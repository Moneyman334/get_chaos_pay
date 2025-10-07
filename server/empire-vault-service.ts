import { db as dbClient } from './storage';
import {
  empireVault,
  empireRevenueDeposits,
  empireDistributions,
  empireUserShares,
  empireRewardClaims,
  tokenHoldings,
  codexUserStakes,
  platformUserNfts,
  codexRelicInstances,
  InsertEmpireRevenueDeposit,
  InsertEmpireDistribution,
  InsertEmpireUserShare,
  InsertEmpireRewardClaim
} from '@shared/schema';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';

interface RevenueDeposit {
  amount: number;
  source: 'marketplace' | 'trading_bot' | 'launchpad' | 'ecommerce' | 'staking_fees' | 'subscription' | 'flash_sale';
  sourceId?: string;
  description?: string;
  txHash?: string;
}

interface UserShareCalculation {
  walletAddress: string;
  cdxStaked: number;
  nftCount: number;
  relicCount: number;
  baseShares: number;
  nftBoostMultiplier: number;
  relicBoostMultiplier: number;
  totalShares: number;
  governanceWeight: number;
}

interface DistributionRound {
  roundNumber: string;
  totalAmount: number;
  totalCdxStaked: number;
  totalShares: number;
  amountPerShare: number;
  eligibleWallets: number;
  userShares: UserShareCalculation[];
}

export class EmpireVaultService {
  // NFT Boost Multipliers
  private readonly NFT_BOOST_TIERS = {
    0: 1.0,    // No NFTs
    1: 1.1,    // 1 NFT = 10% boost
    3: 1.25,   // 3 NFTs = 25% boost
    5: 1.5,    // 5 NFTs = 50% boost
    10: 2.0,   // 10+ NFTs = 100% boost
  };

  // Relic Boost Multipliers
  private readonly RELIC_BOOST_TIERS = {
    0: 1.0,    // No relics
    1: 1.15,   // 1 relic = 15% boost
    2: 1.35,   // 2 relics = 35% boost
    3: 1.6,    // 3 relics = 60% boost (max)
  };

  /**
   * Deposit revenue into the Empire Vault
   */
  async depositRevenue(deposit: RevenueDeposit): Promise<void> {
    try {
      // Record the deposit
      await dbClient.insert(empireRevenueDeposits).values({
        amount: deposit.amount.toString(),
        source: deposit.source,
        sourceId: deposit.sourceId,
        description: deposit.description,
        txHash: deposit.txHash,
        status: 'confirmed',
      });

      // Update vault balance
      await dbClient
        .update(empireVault)
        .set({
          totalBalance: sql`CAST(${empireVault.totalBalance} AS NUMERIC) + ${deposit.amount}`,
          totalDeposited: sql`CAST(${empireVault.totalDeposited} AS NUMERIC) + ${deposit.amount}`,
          updatedAt: new Date(),
        });

      console.log(`💰 Empire Vault: Deposited $${deposit.amount} from ${deposit.source}`);
    } catch (error) {
      console.error('❌ Empire Vault deposit failed:', error);
      throw error;
    }
  }

  /**
   * Calculate NFT boost multiplier based on NFT count
   */
  private calculateNftBoost(nftCount: number): number {
    if (nftCount >= 10) return this.NFT_BOOST_TIERS[10];
    if (nftCount >= 5) return this.NFT_BOOST_TIERS[5];
    if (nftCount >= 3) return this.NFT_BOOST_TIERS[3];
    if (nftCount >= 1) return this.NFT_BOOST_TIERS[1];
    return this.NFT_BOOST_TIERS[0];
  }

  /**
   * Calculate Relic boost multiplier based on equipped relics
   */
  private calculateRelicBoost(relicCount: number): number {
    const count = Math.min(relicCount, 3); // Max 3 relics
    return this.RELIC_BOOST_TIERS[count as 0 | 1 | 2 | 3] || 1.0;
  }

  /**
   * Get all CDX stakers with their NFT/Relic boosts
   */
  private async getEligibleStakers(): Promise<UserShareCalculation[]> {
    // Get all CDX stakers
    const stakes = await dbClient
      .select({
        walletAddress: tokenHoldings.walletAddress,
        stakedBalance: tokenHoldings.stakedBalance,
      })
      .from(tokenHoldings)
      .where(sql`CAST(${tokenHoldings.stakedBalance} AS NUMERIC) > 0`);

    const userShares: UserShareCalculation[] = [];

    for (const stake of stakes) {
      const walletAddress = stake.walletAddress;
      const cdxStaked = parseFloat(stake.stakedBalance);

      // Count NFTs owned by this wallet
      const nftResult = await dbClient
        .select({ count: sql<string>`COUNT(*)` })
        .from(platformUserNfts)
        .where(eq(sql`lower(${platformUserNfts.walletAddress})`, walletAddress.toLowerCase()));
      const nftCount = parseInt(nftResult[0]?.count || '0');

      // Count equipped relics
      const relicResult = await dbClient
        .select({ count: sql<string>`COUNT(*)` })
        .from(codexRelicInstances)
        .where(
          and(
            eq(sql`lower(${codexRelicInstances.walletAddress})`, walletAddress.toLowerCase()),
            eq(codexRelicInstances.isEquipped, 'true')
          )
        );
      const relicCount = parseInt(relicResult[0]?.count || '0');

      // Calculate boosts
      const nftBoostMultiplier = this.calculateNftBoost(nftCount);
      const relicBoostMultiplier = this.calculateRelicBoost(relicCount);

      // Base shares = CDX staked
      const baseShares = cdxStaked;

      // Total shares = base * NFT boost * Relic boost
      const totalShares = baseShares * nftBoostMultiplier * relicBoostMultiplier;

      // Governance weight (for voting) = total shares
      const governanceWeight = totalShares;

      userShares.push({
        walletAddress,
        cdxStaked,
        nftCount,
        relicCount,
        baseShares,
        nftBoostMultiplier,
        relicBoostMultiplier,
        totalShares,
        governanceWeight,
      });
    }

    return userShares;
  }

  /**
   * Create a new distribution round
   */
  async createDistribution(): Promise<DistributionRound> {
    try {
      // Get vault balance
      const vault = await dbClient.select().from(empireVault).limit(1);
      if (!vault.length) throw new Error('Empire Vault not initialized');

      const currentBalance = parseFloat(vault[0].totalBalance);
      const minDistribution = parseFloat(vault[0].minDistributionAmount);

      if (currentBalance < minDistribution) {
        throw new Error(`Insufficient balance for distribution. Need $${minDistribution}, have $${currentBalance}`);
      }

      // Get eligible stakers
      const userShares = await this.getEligibleStakers();
      
      if (userShares.length === 0) {
        throw new Error('No eligible stakers for distribution');
      }

      // Calculate totals
      const totalCdxStaked = userShares.reduce((sum, s) => sum + s.cdxStaked, 0);
      const totalShares = userShares.reduce((sum, s) => sum + s.totalShares, 0);
      const amountPerShare = currentBalance / totalShares;

      // Get next round number
      const lastRound = await dbClient
        .select({ roundNumber: empireDistributions.roundNumber })
        .from(empireDistributions)
        .orderBy(desc(empireDistributions.roundNumber))
        .limit(1);
      
      const nextRoundNumber = lastRound.length 
        ? (parseInt(lastRound[0].roundNumber) + 1).toString()
        : '1';

      // Create distribution record
      const [distribution] = await dbClient
        .insert(empireDistributions)
        .values({
          roundNumber: nextRoundNumber,
          totalAmount: currentBalance.toString(),
          totalCdxStaked: totalCdxStaked.toString(),
          totalShares: totalShares.toString(),
          amountPerShare: amountPerShare.toString(),
          eligibleWallets: userShares.length.toString(),
          unclaimedAmount: currentBalance.toString(),
          status: 'active',
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        })
        .returning();

      // Create user shares for each staker
      for (const userShare of userShares) {
        const rewardAmount = userShare.totalShares * amountPerShare;
        const sharePercentage = (userShare.totalShares / totalShares) * 100;

        await dbClient.insert(empireUserShares).values({
          distributionId: distribution.id,
          walletAddress: userShare.walletAddress,
          cdxStaked: userShare.cdxStaked.toString(),
          baseShares: userShare.baseShares.toString(),
          nftBoostMultiplier: userShare.nftBoostMultiplier.toString(),
          relicBoostMultiplier: userShare.relicBoostMultiplier.toString(),
          totalShares: userShare.totalShares.toString(),
          sharePercentage: sharePercentage.toString(),
          rewardAmount: rewardAmount.toString(),
          nftCount: userShare.nftCount.toString(),
          relicCount: userShare.relicCount.toString(),
          governanceWeight: userShare.governanceWeight.toString(),
        });
      }

      // Update vault balance (move to distribution)
      await dbClient
        .update(empireVault)
        .set({
          totalBalance: '0', // Reset balance after distribution
          totalDistributed: sql`CAST(${empireVault.totalDistributed} AS NUMERIC) + ${currentBalance}`,
          lastDistributionAt: new Date(),
          updatedAt: new Date(),
        });

      console.log(`🎉 Empire Vault: Created distribution round ${nextRoundNumber} with $${currentBalance} for ${userShares.length} stakers`);

      return {
        roundNumber: nextRoundNumber,
        totalAmount: currentBalance,
        totalCdxStaked,
        totalShares,
        amountPerShare,
        eligibleWallets: userShares.length,
        userShares,
      };
    } catch (error) {
      console.error('❌ Empire Vault distribution failed:', error);
      throw error;
    }
  }

  /**
   * Claim rewards for a user
   */
  async claimRewards(walletAddress: string, distributionId: string): Promise<number> {
    try {
      // Get user share for this distribution
      const [userShare] = await dbClient
        .select()
        .from(empireUserShares)
        .where(
          and(
            eq(empireUserShares.distributionId, distributionId),
            eq(sql`lower(${empireUserShares.walletAddress})`, walletAddress.toLowerCase())
          )
        );

      if (!userShare) {
        throw new Error('No rewards available for this wallet in this distribution');
      }

      // Check if already claimed
      const existingClaim = await dbClient
        .select()
        .from(empireRewardClaims)
        .where(
          and(
            eq(empireRewardClaims.distributionId, distributionId),
            eq(sql`lower(${empireRewardClaims.walletAddress})`, walletAddress.toLowerCase())
          )
        );

      if (existingClaim.length > 0) {
        throw new Error('Rewards already claimed for this distribution');
      }

      const claimAmount = parseFloat(userShare.rewardAmount);

      // Create claim record
      await dbClient.insert(empireRewardClaims).values({
        distributionId,
        userShareId: userShare.id,
        walletAddress,
        claimAmount: claimAmount.toString(),
        status: 'completed',
        completedAt: new Date(),
      });

      // Update distribution stats
      await dbClient
        .update(empireDistributions)
        .set({
          claimedCount: sql`CAST(${empireDistributions.claimedCount} AS INTEGER) + 1`,
          claimedAmount: sql`CAST(${empireDistributions.claimedAmount} AS NUMERIC) + ${claimAmount}`,
          unclaimedAmount: sql`CAST(${empireDistributions.unclaimedAmount} AS NUMERIC) - ${claimAmount}`,
        })
        .where(eq(empireDistributions.id, distributionId));

      console.log(`✅ Empire Vault: ${walletAddress} claimed $${claimAmount} from round ${distributionId}`);

      return claimAmount;
    } catch (error) {
      console.error('❌ Empire Vault claim failed:', error);
      throw error;
    }
  }

  /**
   * Get vault statistics
   */
  async getVaultStats() {
    const [vault] = await dbClient.select().from(empireVault).limit(1);
    
    if (!vault) {
      return {
        totalBalance: 0,
        totalDeposited: 0,
        totalDistributed: 0,
        distributionFrequency: 'weekly',
        lastDistributionAt: null,
        status: 'inactive',
      };
    }

    return {
      totalBalance: parseFloat(vault.totalBalance),
      totalDeposited: parseFloat(vault.totalDeposited),
      totalDistributed: parseFloat(vault.totalDistributed),
      distributionFrequency: vault.distributionFrequency,
      lastDistributionAt: vault.lastDistributionAt,
      status: vault.status,
      treasuryWallet: vault.treasuryWallet,
    };
  }

  /**
   * Get user's pending rewards across all distributions
   */
  async getUserPendingRewards(walletAddress: string): Promise<{
    totalPending: number;
    distributions: Array<{
      distributionId: string;
      roundNumber: string;
      rewardAmount: number;
      sharePercentage: number;
      distributedAt: Date;
      expiresAt: Date | null;
      isClaimed: boolean;
    }>;
  }> {
    // Get all user shares
    const shares = await dbClient
      .select({
        id: empireUserShares.id,
        distributionId: empireUserShares.distributionId,
        rewardAmount: empireUserShares.rewardAmount,
        sharePercentage: empireUserShares.sharePercentage,
      })
      .from(empireUserShares)
      .where(eq(sql`lower(${empireUserShares.walletAddress})`, walletAddress.toLowerCase()));

    const distributions = [];
    let totalPending = 0;

    for (const share of shares) {
      // Check if claimed
      const claim = await dbClient
        .select()
        .from(empireRewardClaims)
        .where(eq(empireRewardClaims.userShareId, share.id))
        .limit(1);

      const isClaimed = claim.length > 0;

      // Get distribution details
      const [dist] = await dbClient
        .select()
        .from(empireDistributions)
        .where(eq(empireDistributions.id, share.distributionId));

      if (dist) {
        const rewardAmount = parseFloat(share.rewardAmount);
        
        if (!isClaimed) {
          totalPending += rewardAmount;
        }

        distributions.push({
          distributionId: share.distributionId,
          roundNumber: dist.roundNumber,
          rewardAmount,
          sharePercentage: parseFloat(share.sharePercentage),
          distributedAt: dist.distributedAt,
          expiresAt: dist.expiresAt,
          isClaimed,
        });
      }
    }

    return {
      totalPending,
      distributions: distributions.sort((a, b) => 
        b.distributedAt.getTime() - a.distributedAt.getTime()
      ),
    };
  }

  /**
   * Get revenue breakdown by source
   */
  async getRevenueBreakdown(startDate?: Date, endDate?: Date) {
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(empireRevenueDeposits.depositedAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(empireRevenueDeposits.depositedAt, endDate));
    }

    const deposits = await dbClient
      .select({
        source: empireRevenueDeposits.source,
        total: sql<string>`COALESCE(SUM(CAST(${empireRevenueDeposits.amount} AS NUMERIC)), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(empireRevenueDeposits)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(empireRevenueDeposits.source);

    return deposits.map(d => ({
      source: d.source,
      total: parseFloat(d.total),
      count: parseInt(d.count),
    }));
  }
}

export const empireVaultService = new EmpireVaultService();
