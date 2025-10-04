import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Coins, 
  TrendingUp, 
  Lock, 
  Gift, 
  ArrowRight,
  Sparkles,
  Wallet,
  PiggyBank
} from "lucide-react";
import { Link } from "wouter";

export default function CodexTokenDashboard() {
  const { address, isConnected } = useWeb3();

  // Fetch platform token info
  const { data: token, isLoading: tokenLoading } = useQuery({
    queryKey: ["/api/codex/token"],
    enabled: true,
  });

  // Fetch user token holdings
  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: [`/api/codex/holdings/${address}`],
    enabled: isConnected && !!address,
  });

  // Fetch staking pools
  const { data: stakingPools, isLoading: poolsLoading } = useQuery({
    queryKey: ["/api/codex/staking-pools"],
    enabled: true,
  });

  // Fetch user stakes
  const { data: userStakes, isLoading: stakesLoading } = useQuery({
    queryKey: [`/api/codex/stakes/${address}`],
    enabled: isConnected && !!address,
  });

  const formatNumber = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(num);
  };

  const totalStaked = userStakes?.reduce(
    (sum: number, stake: any) => sum + parseFloat(stake.amount || "0"),
    0
  ) || 0;

  const totalRewards = userStakes?.reduce(
    (sum: number, stake: any) => sum + parseFloat(stake.rewardsEarned || "0"),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 dark:from-gray-900 dark:via-purple-950 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              CODEX Token Dashboard
            </h1>
            <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-xl text-purple-200 dark:text-purple-300">
            Your Gateway to the CODEX Ecosystem - Stake, Earn, and Evolve
          </p>
        </div>

        {/* Token Info Card */}
        <Card className="mb-8 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-400/30 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8 text-yellow-400" />
                <div>
                  <CardTitle className="text-3xl text-white dark:text-white">CODEX (CDX)</CardTitle>
                  <CardDescription className="text-purple-200 dark:text-purple-300">
                    Platform Governance & Utility Token
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg px-4 py-2">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {tokenLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 bg-purple-800/30" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-purple-900/30 dark:bg-purple-950/50 rounded-lg p-4 border border-purple-400/20">
                  <p className="text-sm text-purple-300 mb-1">Total Supply</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-supply">
                    {formatNumber(token?.totalSupply || "1000000000")} CDX
                  </p>
                </div>
                <div className="bg-purple-900/30 dark:bg-purple-950/50 rounded-lg p-4 border border-purple-400/20">
                  <p className="text-sm text-purple-300 mb-1">Symbol</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-symbol">
                    {token?.symbol || "CDX"}
                  </p>
                </div>
                <div className="bg-purple-900/30 dark:bg-purple-950/50 rounded-lg p-4 border border-purple-400/20">
                  <p className="text-sm text-purple-300 mb-1">Decimals</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-decimals">
                    {token?.decimals || "18"}
                  </p>
                </div>
                <div className="bg-purple-900/30 dark:bg-purple-950/50 rounded-lg p-4 border border-purple-400/20">
                  <p className="text-sm text-purple-300 mb-1">Chain</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-chain">
                    Ethereum
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Connection Check */}
        {!isConnected ? (
          <Card className="mb-8 bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-400/30">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wallet className="w-20 h-20 text-orange-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
                <p className="text-orange-200 dark:text-orange-300 mb-6 max-w-md mx-auto">
                  Connect your MetaMask wallet to view your CODEX token holdings, staking positions, and rewards.
                </p>
                <Link href="/wallet-nexus">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg px-8 py-6">
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* User Holdings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 dark:from-green-900/30 dark:to-emerald-900/30 border-green-400/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Wallet className="w-5 h-5 text-green-400" />
                    Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {holdingsLoading ? (
                    <Skeleton className="h-12 bg-green-800/30" />
                  ) : (
                    <p className="text-4xl font-bold text-white" data-testid="text-balance">
                      {formatNumber(holdings?.balance || "0")} CDX
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-400/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Lock className="w-5 h-5 text-blue-400" />
                    Staked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stakesLoading ? (
                    <Skeleton className="h-12 bg-blue-800/30" />
                  ) : (
                    <p className="text-4xl font-bold text-white" data-testid="text-staked">
                      {formatNumber(totalStaked)} CDX
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-400/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Gift className="w-5 h-5 text-yellow-400" />
                    Rewards Earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stakesLoading ? (
                    <Skeleton className="h-12 bg-yellow-800/30" />
                  ) : (
                    <p className="text-4xl font-bold text-white" data-testid="text-rewards">
                      {formatNumber(totalRewards)} CDX
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Staking Pools Preview */}
        <Card className="mb-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-400/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PiggyBank className="w-6 h-6 text-purple-400" />
                <CardTitle className="text-white">Staking Pools</CardTitle>
              </div>
              <Link href="/codex-staking">
                <Button variant="outline" className="border-purple-400 text-purple-200 hover:bg-purple-600/30">
                  View All Pools
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {poolsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 bg-purple-800/30" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stakingPools?.slice(0, 4).map((pool: any) => (
                  <div
                    key={pool.id}
                    className="bg-purple-900/30 dark:bg-purple-950/50 rounded-lg p-4 border border-purple-400/20 hover:border-purple-400/50 transition-all"
                    data-testid={`card-pool-${pool.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">{pool.name}</h4>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                        {pool.apr}% APR
                      </Badge>
                    </div>
                    <p className="text-sm text-purple-300 mb-3">{pool.description}</p>
                    <div className="flex items-center justify-between text-xs text-purple-400">
                      <span>Min: {formatNumber(pool.minStake)} CDX</span>
                      <span>Lock: {parseInt(pool.lockPeriod) / 86400} days</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/codex-staking">
            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-400/30 hover:border-blue-400/60 cursor-pointer transition-all h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-8 h-8 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Stake Tokens</h3>
                </div>
                <p className="text-blue-200 dark:text-blue-300 mb-4">
                  Lock your CDX tokens and earn up to 50% APR with NFT bonuses
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-stake">
                  Start Staking
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/codex-nfts">
            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-400/30 hover:border-purple-400/60 cursor-pointer transition-all h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">NFT Collections</h3>
                </div>
                <p className="text-purple-200 dark:text-purple-300 mb-4">
                  Explore exclusive NFT collections with dynamic AI-powered features
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" data-testid="button-nfts">
                  Browse NFTs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/codex-achievements">
            <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-400/30 hover:border-yellow-400/60 cursor-pointer transition-all h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Living Achievements</h3>
                </div>
                <p className="text-yellow-200 dark:text-yellow-300 mb-4">
                  Unlock dynamic NFT achievements that evolve with your activity
                </p>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" data-testid="button-achievements">
                  View Achievements
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
