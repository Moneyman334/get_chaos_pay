import { db as dbClient } from './storage';
import { botTrades, botActiveStrategies, users } from '@shared/schema';
import { eq, and, sql, gte } from 'drizzle-orm';

interface BotFees {
  carryFee: number;        // 1% of profits
  managementFee: number;   // 0.25% annual (calculated daily)
  totalFees: number;
  netProfit: number;
}

interface PerformanceTier {
  tier: string;
  carryRate: number;
  managementRate: number;
  minProfit: number;
}

const PERFORMANCE_TIERS: PerformanceTier[] = [
  { tier: 'standard', carryRate: 1.0, managementRate: 0.25, minProfit: 0 },
  { tier: 'advanced', carryRate: 0.75, managementRate: 0.20, minProfit: 10000 },
  { tier: 'professional', carryRate: 0.50, managementRate: 0.15, minProfit: 50000 },
  { tier: 'institutional', carryRate: 0.25, managementRate: 0.10, minProfit: 100000 }
];

export class BotFeeService {
  /**
   * Get performance tier based on total profits
   */
  private getPerformanceTier(totalProfit: number): PerformanceTier {
    // Find the highest tier the user qualifies for
    for (let i = PERFORMANCE_TIERS.length - 1; i >= 0; i--) {
      if (totalProfit >= PERFORMANCE_TIERS[i].minProfit) {
        return PERFORMANCE_TIERS[i];
      }
    }
    return PERFORMANCE_TIERS[0];
  }

  /**
   * Calculate fees for a profitable trade
   */
  async calculateTradeFees(userId: string, profit: number, allocatedCapital: number): Promise<BotFees> {
    try {
      // Get user's total historical profit to determine tier
      const result = await dbClient
        .select({
          totalProfit: sql<string>`COALESCE(SUM(CAST(${botTrades.profit} AS NUMERIC)), 0)`
        })
        .from(botTrades)
        .where(
          and(
            eq(botTrades.userId, userId),
            eq(botTrades.status, 'filled'),
            sql`CAST(${botTrades.profit} AS NUMERIC) > 0`
          )
        );

      const totalProfit = parseFloat(result[0]?.totalProfit || '0');
      const tier = this.getPerformanceTier(totalProfit);

      // Calculate carry fee (percentage of profit)
      const carryFee = (profit * tier.carryRate) / 100;

      // Calculate annual management fee as daily rate
      // Annual rate / 365 days * allocated capital
      const dailyManagementRate = tier.managementRate / 365;
      const managementFee = (allocatedCapital * dailyManagementRate) / 100;

      return {
        carryFee,
        managementFee,
        totalFees: carryFee + managementFee,
        netProfit: profit - carryFee
      };
    } catch (error) {
      console.error('Error calculating bot fees:', error);
      // Return default fees if error
      return {
        carryFee: (profit * 1.0) / 100,
        managementFee: 0,
        totalFees: (profit * 1.0) / 100,
        netProfit: profit - (profit * 1.0) / 100
      };
    }
  }

  /**
   * Calculate total platform revenue from bot fees for a period
   */
  async calculatePlatformBotRevenue(startDate: Date, endDate: Date) {
    try {
      // Get all profitable trades in period
      const trades = await dbClient
        .select({
          userId: botTrades.userId,
          profit: botTrades.profit,
          activeStrategyId: botTrades.activeStrategyId,
          executedAt: botTrades.executedAt
        })
        .from(botTrades)
        .where(
          and(
            eq(botTrades.status, 'filled'),
            sql`CAST(${botTrades.profit} AS NUMERIC) > 0`,
            gte(botTrades.executedAt, startDate),
            sql`${botTrades.executedAt} <= ${endDate}`
          )
        );

      let totalCarryFees = 0;
      let totalManagementFees = 0;

      for (const trade of trades) {
        // Get strategy allocated capital
        const [strategy] = await dbClient
          .select({ allocatedCapital: botActiveStrategies.allocatedCapital })
          .from(botActiveStrategies)
          .where(eq(botActiveStrategies.id, trade.activeStrategyId))
          .limit(1);

        const profit = parseFloat(trade.profit || '0');
        const capital = parseFloat(strategy?.allocatedCapital || '0');

        const fees = await this.calculateTradeFees(trade.userId, profit, capital);
        totalCarryFees += fees.carryFee;
        totalManagementFees += fees.managementFee;
      }

      return {
        totalCarryFees,
        totalManagementFees,
        totalBotRevenue: totalCarryFees + totalManagementFees,
        tradeCount: trades.length
      };
    } catch (error) {
      console.error('Error calculating platform bot revenue:', error);
      return {
        totalCarryFees: 0,
        totalManagementFees: 0,
        totalBotRevenue: 0,
        tradeCount: 0
      };
    }
  }

  /**
   * Get user's performance tier info
   */
  async getUserPerformanceTier(userId: string) {
    try {
      const result = await dbClient
        .select({
          totalProfit: sql<string>`COALESCE(SUM(CAST(${botTrades.profit} AS NUMERIC)), 0)`,
          tradeCount: sql<string>`COUNT(*)`
        })
        .from(botTrades)
        .where(
          and(
            eq(botTrades.userId, userId),
            eq(botTrades.status, 'filled'),
            sql`CAST(${botTrades.profit} AS NUMERIC) > 0`
          )
        );

      const totalProfit = parseFloat(result[0]?.totalProfit || '0');
      const tradeCount = parseInt(result[0]?.tradeCount || '0');
      const tier = this.getPerformanceTier(totalProfit);

      // Calculate next tier info
      const currentTierIndex = PERFORMANCE_TIERS.findIndex(t => t.tier === tier.tier);
      const nextTier = currentTierIndex < PERFORMANCE_TIERS.length - 1 
        ? PERFORMANCE_TIERS[currentTierIndex + 1] 
        : null;

      return {
        currentTier: tier,
        totalProfit,
        tradeCount,
        nextTier,
        progressToNextTier: nextTier 
          ? ((totalProfit / nextTier.minProfit) * 100).toFixed(2)
          : '100'
      };
    } catch (error) {
      console.error('Error getting user performance tier:', error);
      return {
        currentTier: PERFORMANCE_TIERS[0],
        totalProfit: 0,
        tradeCount: 0,
        nextTier: PERFORMANCE_TIERS[1],
        progressToNextTier: '0'
      };
    }
  }
}

export const botFeeService = new BotFeeService();
