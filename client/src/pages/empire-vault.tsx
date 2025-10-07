import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, TrendingUp, Users, Trophy, Wallet, ArrowRight, 
  Sparkles, Flame, Crown, DollarSign, Target, Award,
  CircleDollarSign, Gift, Clock, CheckCircle, XCircle
} from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { formatDistanceToNow } from "date-fns";

interface VaultStats {
  totalBalance: number;
  totalDeposited: number;
  totalDistributed: number;
  distributionFrequency: string;
  lastDistributionAt: Date | null;
  status: string;
  treasuryWallet: string;
}

interface RevenueSource {
  source: string;
  total: number;
  count: number;
}

interface Distribution {
  distributionId: string;
  roundNumber: string;
  rewardAmount: number;
  sharePercentage: number;
  distributedAt: Date;
  expiresAt: Date | null;
  isClaimed: boolean;
}

interface PendingRewards {
  totalPending: number;
  distributions: Distribution[];
}

export default function EmpireVaultPage() {
  const { connectedWallet } = useWeb3();
  const { toast } = useToast();
  const [selectedDistribution, setSelectedDistribution] = useState<string | null>(null);

  // Fetch vault stats
  const { data: vaultStats, isLoading: statsLoading } = useQuery<VaultStats>({
    queryKey: ['/api/empire-vault/stats'],
  });

  // Fetch revenue breakdown
  const { data: revenueBreakdown, isLoading: revenueLoading } = useQuery<RevenueSource[]>({
    queryKey: ['/api/empire-vault/revenue'],
  });

  // Fetch user's pending rewards
  const { data: userRewards, isLoading: rewardsLoading } = useQuery<PendingRewards>({
    queryKey: ['/api/empire-vault/rewards', connectedWallet],
    enabled: !!connectedWallet,
  });

  // Claim rewards mutation
  const claimMutation = useMutation({
    mutationFn: async (distributionId: string) => {
      return apiRequest(`/api/empire-vault/claim`, {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: connectedWallet,
          distributionId,
        }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Rewards Claimed!",
        description: `Successfully claimed $${data.claimedAmount.toFixed(2)} from Empire Vault!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/empire-vault/rewards', connectedWallet] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClaim = (distributionId: string) => {
    if (!connectedWallet) {
      toast({
        title: "⚠️ Wallet Not Connected",
        description: "Please connect your wallet to claim rewards",
        variant: "destructive",
      });
      return;
    }
    claimMutation.mutate(distributionId);
  };

  const totalRevenue = revenueBreakdown?.reduce((sum, r) => sum + r.total, 0) || 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="px-6 py-3 text-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black border-none font-black casino-glow-mega mb-4" data-testid="hero-badge">
            <Crown className="inline h-6 w-6 mr-2" />
            EMPIRE VAULT
            <Sparkles className="inline h-6 w-6 ml-2" />
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-black mb-4 casino-sign">
            DAO TREASURY
          </h1>
          
          <p className="text-xl text-neon-cyan max-w-3xl mx-auto mb-2">
            60-80% of all platform revenue flows directly to CDX stakers & NFT holders! 💎
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The more you stake, the bigger your share. NFTs & Relics multiply your rewards up to 3.2x!
          </p>
        </div>

        {/* Vault Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="card-casino hover-explode" data-testid="stat-total-balance">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CircleDollarSign className="h-8 w-8 text-green-500" />
                <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold text-neon-green">
                ${statsLoading ? '...' : vaultStats?.totalBalance.toLocaleString() || '0'}
              </CardTitle>
              <CardDescription className="text-sm">Current Vault Balance</CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-casino hover-explode" data-testid="stat-total-deposited">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <Sparkles className="h-5 w-5 text-cyan-500 animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold text-neon-cyan">
                ${statsLoading ? '...' : vaultStats?.totalDeposited.toLocaleString() || '0'}
              </CardTitle>
              <CardDescription className="text-sm">Lifetime Deposited</CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-casino hover-explode" data-testid="stat-total-distributed">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Gift className="h-8 w-8 text-purple-500" />
                <Trophy className="h-5 w-5 text-yellow-500 animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold text-neon-purple">
                ${statsLoading ? '...' : vaultStats?.totalDistributed.toLocaleString() || '0'}
              </CardTitle>
              <CardDescription className="text-sm">Distributed to Stakers</CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-casino hover-explode" data-testid="stat-last-distribution">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Clock className="h-8 w-8 text-orange-500" />
                <Target className="h-5 w-5 text-pink-500 animate-pulse" />
              </div>
              <CardTitle className="text-lg font-bold text-neon-orange">
                {statsLoading ? '...' : vaultStats?.lastDistributionAt 
                  ? formatDistanceToNow(new Date(vaultStats.lastDistributionAt), { addSuffix: true })
                  : 'Never'}
              </CardTitle>
              <CardDescription className="text-sm">Last Distribution</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* User's Pending Rewards */}
        {connectedWallet && (
          <Card className="mb-12 electric-card p-8 casino-spotlight" data-testid="pending-rewards-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-black text-neon-yellow mb-2">
                    💰 Your Pending Rewards
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Claim your share of the Empire Vault profits!
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-black text-neon-green jackpot-effect">
                    ${rewardsLoading ? '...' : userRewards?.totalPending.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Unclaimed</div>
                </div>
              </div>
            </CardHeader>

            {userRewards && userRewards.distributions.length > 0 ? (
              <CardContent>
                <div className="space-y-4">
                  {userRewards.distributions.map((dist) => (
                    <div
                      key={dist.distributionId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        dist.isClaimed 
                          ? 'bg-muted/30 border border-muted' 
                          : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 pulse-crazy'
                      }`}
                      data-testid={`distribution-${dist.roundNumber}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={dist.isClaimed ? "bg-muted" : "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"}>
                            Round {dist.roundNumber}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(dist.distributedAt), { addSuffix: true })}
                          </span>
                          {dist.isClaimed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                          )}
                        </div>
                        <div className="text-2xl font-bold text-neon-cyan">
                          ${dist.rewardAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dist.sharePercentage.toFixed(4)}% of distribution
                        </div>
                      </div>

                      {!dist.isClaimed && (
                        <Button
                          onClick={() => handleClaim(dist.distributionId)}
                          disabled={claimMutation.isPending}
                          className="btn-jackpot ml-4"
                          data-testid={`button-claim-${dist.roundNumber}`}
                        >
                          <Award className="mr-2 h-5 w-5" />
                          {claimMutation.isPending ? 'Claiming...' : 'Claim Rewards'}
                        </Button>
                      )}
                      
                      {dist.isClaimed && (
                        <Badge variant="outline" className="ml-4 border-green-500 text-green-500">
                          ✅ Claimed
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <div className="text-center py-8">
                  <Coins className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {connectedWallet 
                      ? "No pending rewards yet. Stake CDX to start earning!" 
                      : "Connect your wallet to view rewards"}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Revenue Breakdown */}
        <Card className="mb-12 card-casino" data-testid="revenue-breakdown-card">
          <CardHeader>
            <CardTitle className="text-3xl font-black text-neon-purple mb-2">
              💸 Revenue Breakdown
            </CardTitle>
            <CardDescription className="text-lg">
              Total Revenue: <span className="text-2xl font-bold text-neon-green">${totalRevenue.toLocaleString()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {revenueLoading ? (
                <p className="text-muted-foreground">Loading revenue data...</p>
              ) : revenueBreakdown && revenueBreakdown.length > 0 ? (
                revenueBreakdown.map((source) => {
                  const percentage = totalRevenue > 0 ? (source.total / totalRevenue) * 100 : 0;
                  return (
                    <div
                      key={source.source}
                      className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 hover:border-purple-500/50 transition-all"
                      data-testid={`revenue-source-${source.source}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-neon-cyan uppercase">
                          {source.source.replace(/_/g, ' ')}
                        </span>
                        <DollarSign className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-foreground mb-1">
                        ${source.total.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{percentage.toFixed(1)}% of total</span>
                        <span>{source.count} deposits</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground">No revenue data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="card-casino" data-testid="how-it-works-card">
          <CardHeader>
            <CardTitle className="text-3xl font-black text-neon-yellow mb-2">
              🎯 How Empire Vault Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Coins className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">1. Stake CDX</h3>
                <p className="text-muted-foreground">
                  Stake your CDX tokens to become eligible for profit distributions
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">2. Boost with NFTs</h3>
                <p className="text-muted-foreground">
                  NFTs: 1.1x - 2x boost • Relics: 1.15x - 1.6x boost • Stack them for maximum rewards!
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Claim Rewards</h3>
                <p className="text-muted-foreground">
                  Weekly distributions automatically calculate your share - just claim when ready!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
