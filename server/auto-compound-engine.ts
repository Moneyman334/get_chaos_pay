import { storage } from "./storage";

class AutoCompoundEngine {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  async start() {
    if (this.isRunning) {
      console.log("Auto-compound engine already running");
      return;
    }

    console.log("🚀 Starting auto-compound engine...");
    this.isRunning = true;

    try {
      // Get all active pools
      const pools = await storage.getActiveAutoCompoundPools();
      
      for (const pool of pools) {
        this.schedulePoolCompounding(pool);
      }

      console.log(`✅ Auto-compound engine started for ${pools.length} pools`);
    } catch (error) {
      console.error("Failed to start auto-compound engine:", error);
      this.isRunning = false;
    }
  }

  private schedulePoolCompounding(pool: any) {
    // Clear existing interval if any
    if (this.intervals.has(pool.id)) {
      clearInterval(this.intervals.get(pool.id)!);
    }

    // Determine interval based on compound frequency
    let intervalMs: number;
    switch (pool.compoundFrequency) {
      case 'hourly':
        intervalMs = 60 * 60 * 1000; // 1 hour
        break;
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      default:
        intervalMs = 60 * 60 * 1000; // Default to hourly
    }

    // For development, use shorter intervals (5 minutes for hourly, 15 for daily)
    if (process.env.NODE_ENV === 'development') {
      intervalMs = pool.compoundFrequency === 'hourly' ? 5 * 60 * 1000 : 15 * 60 * 1000;
    }

    // Schedule compounding with proper error handling
    const interval = setInterval(async () => {
      try {
        await this.executeCompounding(pool.id);
      } catch (error) {
        console.error(`Critical error in compounding interval for pool ${pool.id}:`, error);
        // Don't stop the interval - log and continue with next cycle
      }
    }, intervalMs);

    this.intervals.set(pool.id, interval);
    
    console.log(`📊 Scheduled ${pool.name} compounding every ${intervalMs / 1000}s`);
  }

  private async executeCompounding(poolId: string) {
    try {
      console.log(`⚡ Executing compounding for pool ${poolId}...`);

      // Get pool details
      const pool = await storage.getAutoCompoundPool(poolId);
      if (!pool || pool.status !== 'active') {
        console.log(`Pool ${poolId} not active, skipping`);
        return;
      }

      // Get all active stakes for this pool
      const stakes = await storage.getPoolStakes(poolId);
      const activeStakes = stakes.filter((s: any) => s.status === 'active');

      if (activeStakes.length === 0) {
        console.log(`No active stakes for pool ${poolId}`);
        return;
      }

      let compoundedCount = 0;

      for (const stake of activeStakes) {
        try {
          await this.compoundStake(stake, pool);
          compoundedCount++;
        } catch (error) {
          console.error(`Failed to compound stake ${stake.id}:`, error);
        }
      }

      console.log(`✅ Compounded ${compoundedCount}/${activeStakes.length} stakes for pool ${poolId}`);
    } catch (error) {
      console.error(`Error executing compounding for pool ${poolId}:`, error);
    }
  }

  private async compoundStake(stake: any, pool: any) {
    const currentBalance = parseFloat(stake.currentBalance);
    const baseApy = parseFloat(pool.baseApy) / 100; // Convert percentage to decimal
    
    // Calculate reward based on compound frequency
    let periodRate: number;
    switch (pool.compoundFrequency) {
      case 'hourly':
        periodRate = baseApy / (365 * 24); // Hourly rate
        break;
      case 'daily':
        periodRate = baseApy / 365; // Daily rate
        break;
      case 'weekly':
        periodRate = baseApy / 52; // Weekly rate
        break;
      default:
        periodRate = baseApy / (365 * 24); // Default to hourly
    }

    // Calculate compound interest: newBalance = currentBalance * (1 + rate)
    const newBalance = currentBalance * (1 + periodRate);
    const rewardAmount = newBalance - currentBalance;

    // Update stake
    const compoundCount = parseInt(stake.compoundCount || '0') + 1;
    const totalEarned = parseFloat(stake.totalEarned || '0') + rewardAmount;

    await storage.updateStake(stake.id, {
      currentBalance: newBalance.toString(),
      totalEarned: totalEarned.toString(),
      compoundCount: compoundCount.toString(),
      lastCompoundAt: new Date(),
      effectiveApy: this.calculateEffectiveApy(stake.initialStake, newBalance.toString(), stake.stakedAt).toString()
    });

    // Create compound event
    await storage.createCompoundEvent({
      stakeId: stake.id,
      poolId: pool.id,
      walletAddress: stake.walletAddress,
      balanceBefore: currentBalance.toString(),
      balanceAfter: newBalance.toString(),
      rewardAmount: rewardAmount.toString(),
      apyAtCompound: pool.baseApy
    });

    console.log(`  💰 Stake ${stake.id}: ${currentBalance.toFixed(6)} → ${newBalance.toFixed(6)} ETH (+${rewardAmount.toFixed(6)})`);
  }

  private calculateEffectiveApy(initialStake: string, currentBalance: string, stakedAt: Date): number {
    const initial = parseFloat(initialStake);
    const current = parseFloat(currentBalance);
    const daysStaked = (Date.now() - new Date(stakedAt).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysStaked === 0 || initial === 0) return 0;
    
    // Calculate effective APY: ((currentBalance / initialStake) - 1) * (365 / daysStaked) * 100
    const gain = (current / initial) - 1;
    const annualized = gain * (365 / daysStaked);
    const apy = annualized * 100;
    
    return Math.max(0, apy);
  }

  async stop() {
    console.log("🛑 Stopping auto-compound engine...");
    
    // Clear all intervals
    this.intervals.forEach((interval, poolId) => {
      clearInterval(interval);
      console.log(`  Stopped compounding for pool ${poolId}`);
    });
    
    this.intervals.clear();
    this.isRunning = false;
    
    console.log("✅ Auto-compound engine stopped");
  }

  async refreshPools() {
    console.log("🔄 Refreshing pool schedules...");
    
    // Stop all current intervals
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();

    // Restart with latest pool data
    const pools = await storage.getActiveAutoCompoundPools();
    for (const pool of pools) {
      this.schedulePoolCompounding(pool);
    }

    console.log(`✅ Refreshed ${pools.length} pool schedules`);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activePools: this.intervals.size,
      pools: Array.from(this.intervals.keys())
    };
  }
}

// Export singleton instance
export const autoCompoundEngine = new AutoCompoundEngine();
