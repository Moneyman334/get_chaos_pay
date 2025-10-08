import { storage } from "./storage";
import { getCryptoPrice } from "./price-service";
import cron from "node-cron";

const LIQUIDATION_THRESHOLD = 0.95; // 95% of liquidation price triggers liquidation
const WARNING_THRESHOLD = 0.85; // 85% of liquidation price sends warning
const CHECK_INTERVAL = '*/30 * * * * *'; // Every 30 seconds

interface PositionRisk {
  positionId: string;
  userId: string;
  tradingPair: string;
  currentPrice: number;
  liquidationPrice: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  distanceToLiquidation: number;
}

class MarginRiskEngine {
  private isRunning = false;

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Margin Risk Engine already running');
      return;
    }

    this.isRunning = true;
    console.log('🛡️  Starting Margin Risk Engine...');

    // Run immediately on start
    await this.checkAllPositions();

    // Schedule periodic checks every 30 seconds
    cron.schedule(CHECK_INTERVAL, async () => {
      if (this.isRunning) {
        await this.checkAllPositions();
      }
    });

    console.log('✅ Margin Risk Engine started - monitoring positions every 30s');
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Margin Risk Engine stopped');
  }

  private async checkAllPositions() {
    try {
      // Get all open positions from all users
      const allUsers = await this.getAllUsersWithOpenPositions();
      
      for (const userId of allUsers) {
        await this.checkUserPositions(userId);
      }
    } catch (error) {
      console.error('❌ Error checking positions:', error);
    }
  }

  private async getAllUsersWithOpenPositions(): Promise<string[]> {
    try {
      // This is a simplified approach - in production you'd query the DB directly
      const positions = await storage.getMarginPositionsByPair('ETH/USDT', 'open');
      const userIds = new Set(positions.map(p => p.userId));
      
      // Add other pairs
      const btcPositions = await storage.getMarginPositionsByPair('BTC/USDT', 'open');
      btcPositions.forEach(p => userIds.add(p.userId));
      
      return Array.from(userIds);
    } catch (error) {
      console.error('Error getting users with open positions:', error);
      return [];
    }
  }

  private async checkUserPositions(userId: string) {
    try {
      const positions = await storage.getUserMarginPositions(userId, 'open');
      
      if (positions.length === 0) return;

      const risks: PositionRisk[] = [];

      for (const position of positions) {
        const risk = await this.analyzePosition(position);
        if (risk) {
          risks.push(risk);
          
          // Handle critical positions
          if (risk.riskLevel === 'critical') {
            await this.handleCriticalPosition(position);
          } else if (risk.riskLevel === 'warning') {
            await this.sendLiquidationWarning(position, risk);
          }
        }
      }

      if (risks.length > 0) {
        console.log(`📊 Risk analysis for user ${userId}:`, risks);
      }
    } catch (error) {
      console.error(`Error checking positions for user ${userId}:`, error);
    }
  }

  private async analyzePosition(position: any): Promise<PositionRisk | null> {
    try {
      // Extract base asset from trading pair (e.g., "ETH/USDT" -> "ETH")
      const [baseAsset] = position.tradingPair.split('/');
      
      // Get current price
      const currentPrice = await getCryptoPrice(baseAsset.toLowerCase());
      if (!currentPrice) {
        console.warn(`⚠️  Could not get price for ${baseAsset}`);
        return null;
      }

      const liquidationPrice = parseFloat(position.liquidationPrice);
      const entryPrice = parseFloat(position.entryPrice);
      
      // Calculate distance to liquidation (percentage)
      let distanceToLiquidation: number;
      let riskLevel: 'safe' | 'warning' | 'critical';

      if (position.side === 'long') {
        // For longs, liquidation happens when price drops
        distanceToLiquidation = ((currentPrice - liquidationPrice) / liquidationPrice) * 100;
        
        if (currentPrice <= liquidationPrice * LIQUIDATION_THRESHOLD) {
          riskLevel = 'critical';
        } else if (currentPrice <= liquidationPrice * (1 + (1 - WARNING_THRESHOLD))) {
          riskLevel = 'warning';
        } else {
          riskLevel = 'safe';
        }
      } else {
        // For shorts, liquidation happens when price rises
        distanceToLiquidation = ((liquidationPrice - currentPrice) / liquidationPrice) * 100;
        
        if (currentPrice >= liquidationPrice * LIQUIDATION_THRESHOLD) {
          riskLevel = 'critical';
        } else if (currentPrice >= liquidationPrice * WARNING_THRESHOLD) {
          riskLevel = 'warning';
        } else {
          riskLevel = 'safe';
        }
      }

      // Update position's current price and unrealized PnL
      const positionSize = parseFloat(position.positionSize);
      let unrealizedPnl: string;

      if (position.side === 'long') {
        unrealizedPnl = String((currentPrice - entryPrice) * positionSize);
      } else {
        unrealizedPnl = String((entryPrice - currentPrice) * positionSize);
      }

      await storage.updateMarginPosition(position.id, {
        currentPrice: String(currentPrice),
        unrealizedPnl
      });

      return {
        positionId: position.id,
        userId: position.userId,
        tradingPair: position.tradingPair,
        currentPrice,
        liquidationPrice,
        riskLevel,
        distanceToLiquidation
      };
    } catch (error) {
      console.error(`Error analyzing position ${position.id}:`, error);
      return null;
    }
  }

  private async handleCriticalPosition(position: any) {
    try {
      console.log(`🚨 CRITICAL: Position ${position.id} at liquidation threshold`);
      
      // Get user settings to check if auto-deleverage is enabled
      const settings = await storage.getUserLeverageSettings(position.userId);
      
      if (settings?.autoDeleverageEnabled === 'true') {
        // Attempt auto-liquidation
        await this.liquidatePosition(position.id, 'auto');
      } else {
        // Just send alert if auto-deleverage disabled
        await this.sendLiquidationAlert(position);
      }
    } catch (error) {
      console.error(`Error handling critical position ${position.id}:`, error);
    }
  }

  private async liquidatePosition(positionId: string, liquidationType: string = 'auto') {
    try {
      const position = await storage.getMarginPosition(positionId);
      if (!position || position.status !== 'open') return;

      const entryPrice = parseFloat(position.entryPrice);
      const liquidationPrice = parseFloat(position.liquidationPrice);
      const positionSize = parseFloat(position.positionSize);
      const collateral = parseFloat(position.collateral);

      let lossAmount = '0';
      let remainingCollateral = '0';

      if (position.side === 'long') {
        lossAmount = String((entryPrice - liquidationPrice) * positionSize);
        remainingCollateral = String(Math.max(0, collateral - parseFloat(lossAmount)));
      } else {
        lossAmount = String((liquidationPrice - entryPrice) * positionSize);
        remainingCollateral = String(Math.max(0, collateral - parseFloat(lossAmount)));
      }

      // Create liquidation record
      await storage.createLiquidationRecord({
        positionId,
        userId: position.userId,
        tradingPair: position.tradingPair,
        side: position.side,
        leverage: position.leverage,
        entryPrice: position.entryPrice,
        liquidationPrice: position.liquidationPrice,
        positionSize: position.positionSize,
        lossAmount,
        remainingCollateral,
        liquidationType
      });

      // Update position status
      await storage.updateMarginPosition(positionId, {
        status: 'liquidated',
        closedAt: new Date(),
        realizedPnl: `-${lossAmount}`
      });

      console.log(`⚡ Position ${positionId} liquidated (${liquidationType}) - Loss: ${lossAmount}`);
    } catch (error) {
      console.error(`Error liquidating position ${positionId}:`, error);
    }
  }

  private async sendLiquidationWarning(position: any, risk: PositionRisk) {
    try {
      const settings = await storage.getUserLeverageSettings(position.userId);
      
      if (settings?.liquidationWarningEnabled !== 'true') return;

      console.log(`⚠️  LIQUIDATION WARNING for position ${position.id}:`);
      console.log(`   Trading Pair: ${risk.tradingPair}`);
      console.log(`   Current Price: $${risk.currentPrice.toFixed(2)}`);
      console.log(`   Liquidation Price: $${risk.liquidationPrice.toFixed(2)}`);
      console.log(`   Distance: ${risk.distanceToLiquidation.toFixed(2)}%`);

      // In production, this would send email/push notification to user
      // For now, just create a security alert
      await storage.createSecurityAlert({
        walletAddress: position.userId,
        alertType: 'liquidation_warning',
        severity: 'high',
        description: `Position ${position.id} (${risk.tradingPair}) approaching liquidation. Current: $${risk.currentPrice.toFixed(2)}, Liquidation: $${risk.liquidationPrice.toFixed(2)}`,
        metadata: JSON.stringify(risk)
      });
    } catch (error) {
      console.error('Error sending liquidation warning:', error);
    }
  }

  private async sendLiquidationAlert(position: any) {
    try {
      console.log(`🚨 LIQUIDATION ALERT for position ${position.id} - AUTO-DELEVERAGE DISABLED`);
      
      await storage.createSecurityAlert({
        walletAddress: position.userId,
        alertType: 'liquidation_imminent',
        severity: 'critical',
        description: `Position ${position.id} (${position.tradingPair}) at critical liquidation threshold. Auto-deleverage is disabled - manual action required!`,
        metadata: JSON.stringify({ positionId: position.id, tradingPair: position.tradingPair })
      });
    } catch (error) {
      console.error('Error sending liquidation alert:', error);
    }
  }

  // Public method to manually check a specific position
  async checkPosition(positionId: string) {
    try {
      const position = await storage.getMarginPosition(positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      const risk = await this.analyzePosition(position);
      return risk;
    } catch (error) {
      console.error(`Error checking position ${positionId}:`, error);
      throw error;
    }
  }

  // Get risk metrics for all user positions
  async getUserRiskMetrics(userId: string) {
    try {
      const positions = await storage.getUserMarginPositions(userId, 'open');
      const risks: PositionRisk[] = [];

      for (const position of positions) {
        const risk = await this.analyzePosition(position);
        if (risk) {
          risks.push(risk);
        }
      }

      const totalPositions = risks.length;
      const criticalPositions = risks.filter(r => r.riskLevel === 'critical').length;
      const warningPositions = risks.filter(r => r.riskLevel === 'warning').length;
      const safePositions = risks.filter(r => r.riskLevel === 'safe').length;

      return {
        totalPositions,
        criticalPositions,
        warningPositions,
        safePositions,
        positions: risks
      };
    } catch (error) {
      console.error(`Error getting risk metrics for user ${userId}:`, error);
      throw error;
    }
  }
}

export const marginRiskEngine = new MarginRiskEngine();
