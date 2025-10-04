import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Lock, 
  Unlock, 
  Gift, 
  TrendingUp,
  Sparkles,
  Wallet,
  Calendar,
  Clock,
  Zap
} from "lucide-react";
import { Link } from "wouter";

export default function CodexStakingPage() {
  const { account, isConnected } = useWeb3();
  const { toast } = useToast();
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<string>("");

  const { data: pools, isLoading: poolsLoading } = useQuery({
    queryKey: ["/api/codex/staking-pools"],
    enabled: true,
  });

  const { data: userStakes, isLoading: stakesLoading } = useQuery({
    queryKey: [`/api/codex/stakes/${account}`],
    enabled: isConnected && !!account,
  });

  const stakeMutation = useMutation({
    mutationFn: async (data: { poolId: string; amount: string }) => {
      const pool = pools?.find((p: any) => p.id === data.poolId);
      const lockPeriodSeconds = parseInt(pool?.lockPeriod || "0");
      const unlockDate = new Date(Date.now() + lockPeriodSeconds * 1000).toISOString();
      
      const response = await fetch("/api/codex/stakes", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: account,
          poolId: data.poolId,
          amount: data.amount,
          unlockDate,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to stake");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/codex/stakes/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/codex/holdings/${account}`] });
      toast({
        title: "Success",
        description: "Tokens staked successfully!",
      });
      setStakeAmount("");
      setSelectedPoolId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stake tokens",
        variant: "destructive",
      });
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      const response = await fetch(`/api/codex/stakes/${stakeId}/claim`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to claim rewards");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/codex/stakes/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/codex/holdings/${account}`] });
      toast({
        title: "Success",
        description: "Rewards claimed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim rewards",
        variant: "destructive",
      });
    },
  });

  const unstakeMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      const response = await fetch(`/api/codex/stakes/${stakeId}/unstake`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to unstake");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/codex/stakes/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/codex/holdings/${account}`] });
      toast({
        title: "Success",
        description: "Tokens unstaked successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unstake tokens",
        variant: "destructive",
      });
    },
  });

  const formatNumber = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 4,
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeRemaining = (unlockDate: string) => {
    const now = new Date().getTime();
    const unlock = new Date(unlockDate).getTime();
    const diff = unlock - now;

    if (diff <= 0) return "Unlocked";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const isUnlocked = (unlockDate: string) => {
    return new Date(unlockDate).getTime() <= new Date().getTime();
  };

  const selectedPool = pools?.find((p: any) => p.id === selectedPoolId);
  const unlockDate = selectedPool
    ? new Date(Date.now() + parseInt(selectedPool.lockPeriod) * 1000).toISOString()
    : null;

  const handleStake = () => {
    if (!selectedPoolId || !stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a pool and enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    stakeMutation.mutate({
      poolId: selectedPoolId,
      amount: stakeAmount,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-indigo-900 dark:from-gray-900 dark:via-blue-950 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lock className="w-12 h-12 text-blue-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              CODEX Staking
            </h1>
            <Lock className="w-12 h-12 text-blue-400 animate-pulse" />
          </div>
          <p className="text-xl text-blue-200 dark:text-blue-300">
            Lock Your Tokens and Earn Passive Rewards with NFT Bonuses
          </p>
        </div>

        {!isConnected ? (
          <Card className="mb-8 bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-400/30">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wallet className="w-20 h-20 text-orange-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
                <p className="text-orange-200 dark:text-orange-300 mb-6 max-w-md mx-auto">
                  Connect your wallet to stake tokens and view your staking positions.
                </p>
                <Link href="/wallet-nexus">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg px-8 py-6" data-testid="button-connect-wallet">
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-6 h-6 text-purple-400" />
                Stake Tokens
              </CardTitle>
              <CardDescription className="text-purple-200 dark:text-purple-300">
                Select a pool and amount to start earning rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="pool-select" className="text-white mb-2">Select Pool</Label>
                  <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                    <SelectTrigger id="pool-select" className="bg-purple-900/30 border-purple-400/30 text-white" data-testid="select-pool">
                      <SelectValue placeholder="Choose a staking pool" />
                    </SelectTrigger>
                    <SelectContent>
                      {pools?.map((pool: any) => (
                        <SelectItem key={pool.id} value={pool.id} data-testid={`option-pool-${pool.id}`}>
                          {pool.name} - {pool.apr}% APR
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stake-amount" className="text-white mb-2">Amount (CDX)</Label>
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="bg-purple-900/30 border-purple-400/30 text-white"
                    data-testid="input-stake-amount"
                  />
                </div>
              </div>

              {selectedPool && (
                <div className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-400/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-purple-300 mb-1">APR</p>
                      <p className="text-white font-bold" data-testid="text-selected-apr">{selectedPool.apr}%</p>
                    </div>
                    <div>
                      <p className="text-purple-300 mb-1">Lock Period</p>
                      <p className="text-white font-bold" data-testid="text-selected-lock">
                        {parseInt(selectedPool.lockPeriod) / 86400} days
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-300 mb-1">Min Stake</p>
                      <p className="text-white font-bold">{formatNumber(selectedPool.minStake)} CDX</p>
                    </div>
                    <div>
                      <p className="text-purple-300 mb-1">NFT Bonus</p>
                      <p className="text-white font-bold">{selectedPool.nftBonusMultiplier}x</p>
                    </div>
                  </div>
                  {unlockDate && (
                    <div className="mt-4 pt-4 border-t border-purple-400/20">
                      <p className="text-purple-300 text-sm">Unlock Date: <span className="text-white font-bold" data-testid="text-unlock-date">{formatDate(unlockDate)}</span></p>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleStake}
                disabled={!selectedPoolId || !stakeAmount || stakeMutation.isPending}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-lg py-6"
                data-testid="button-stake"
              >
                <Lock className="w-5 h-5 mr-2" />
                {stakeMutation.isPending ? "Staking..." : "Stake Tokens"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Available Staking Pools
            </CardTitle>
            <CardDescription className="text-blue-200 dark:text-blue-300">
              Choose from multiple pools with varying APRs and lock periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            {poolsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48 bg-blue-800/30" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pools?.map((pool: any) => (
                  <Card
                    key={pool.id}
                    className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 dark:from-blue-950/60 dark:to-cyan-950/60 border-blue-400/30 hover:border-blue-400/60 transition-all"
                    data-testid={`card-pool-${pool.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-white text-lg" data-testid={`text-pool-name-${pool.id}`}>
                          {pool.name}
                        </CardTitle>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg px-3 py-1">
                          {pool.apr}% APR
                        </Badge>
                      </div>
                      <CardDescription className="text-blue-200">
                        {pool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-400/20">
                          <p className="text-xs text-blue-400 mb-1">Lock Period</p>
                          <p className="text-sm font-bold text-white" data-testid={`text-lock-period-${pool.id}`}>
                            {parseInt(pool.lockPeriod) / 86400} days
                          </p>
                        </div>
                        <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-400/20">
                          <p className="text-xs text-blue-400 mb-1">Min Stake</p>
                          <p className="text-sm font-bold text-white" data-testid={`text-min-stake-${pool.id}`}>
                            {formatNumber(pool.minStake)} CDX
                          </p>
                        </div>
                        <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-400/20">
                          <p className="text-xs text-blue-400 mb-1">Max Stake</p>
                          <p className="text-sm font-bold text-white">
                            {formatNumber(pool.maxStake)} CDX
                          </p>
                        </div>
                        <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-400/20">
                          <p className="text-xs text-blue-400 mb-1">NFT Bonus</p>
                          <p className="text-sm font-bold text-yellow-400" data-testid={`text-nft-bonus-${pool.id}`}>
                            <Zap className="w-3 h-3 inline mr-1" />
                            {pool.nftBonusMultiplier}x
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 dark:from-green-900/30 dark:to-emerald-900/30 border-green-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="w-6 h-6 text-green-400" />
                Your Active Stakes
              </CardTitle>
              <CardDescription className="text-green-200 dark:text-green-300">
                Manage your staking positions and claim rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stakesLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-48 bg-green-800/30" />
                  ))}
                </div>
              ) : userStakes && userStakes.length > 0 ? (
                <div className="space-y-4">
                  {userStakes.map((stake: any) => {
                    const unlocked = isUnlocked(stake.unlockDate);
                    return (
                      <Card
                        key={stake.id}
                        className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 dark:from-green-950/60 dark:to-emerald-950/60 border-green-400/30"
                        data-testid={`card-stake-${stake.id}`}
                      >
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div>
                              <p className="text-sm text-green-300 mb-1">Staked Amount</p>
                              <p className="text-2xl font-bold text-white" data-testid={`text-stake-amount-${stake.id}`}>
                                {formatNumber(stake.amount)} CDX
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-green-300 mb-1">Rewards Earned</p>
                              <p className="text-2xl font-bold text-yellow-400" data-testid={`text-rewards-${stake.id}`}>
                                {formatNumber(stake.rewardsEarned || 0)} CDX
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-green-300 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Start Date
                              </p>
                              <p className="text-sm font-bold text-white">
                                {formatDate(stake.startDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-green-300 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {unlocked ? "Unlocked" : "Time Remaining"}
                              </p>
                              <p className={`text-sm font-bold ${unlocked ? "text-green-400" : "text-white"}`} data-testid={`text-time-${stake.id}`}>
                                {getTimeRemaining(stake.unlockDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => claimMutation.mutate(stake.id)}
                              disabled={claimMutation.isPending || parseFloat(stake.rewardsEarned || "0") <= 0}
                              className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
                              data-testid={`button-claim-${stake.id}`}
                            >
                              <Gift className="w-4 h-4 mr-2" />
                              Claim Rewards
                            </Button>
                            {unlocked && (
                              <Button
                                onClick={() => unstakeMutation.mutate(stake.id)}
                                disabled={unstakeMutation.isPending}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                                data-testid={`button-unstake-${stake.id}`}
                              >
                                <Unlock className="w-4 h-4 mr-2" />
                                Unstake
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lock className="w-16 h-16 text-green-400/50 mx-auto mb-4" />
                  <p className="text-green-200 dark:text-green-300">
                    You don't have any active stakes yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
