import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrendingUp, Sprout, Zap, DollarSign, Clock, Trophy, Sparkles, ArrowUpDown } from "lucide-react";

interface FarmPool {
  id: string;
  name: string;
  token0: string;
  token1: string;
  apy: string;
  tvl: string;
  rewardToken: string;
  lockPeriod: number;
  status: 'active' | 'ended';
  multiplier: string;
}

interface FarmPosition {
  id: string;
  poolId: string;
  user: string;
  amount: string;
  rewards: string;
  depositDate: string;
  autoCompound: boolean;
  harvestCount: number;
  totalRewardsEarned: string;
}

export default function YieldFarmingPage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedPool, setSelectedPool] = useState<FarmPool | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: farmPools } = useQuery<FarmPool[]>({
    queryKey: ['/api/yield-farming/pools'],
  });

  const { data: myPositions } = useQuery<FarmPosition[]>({
    queryKey: ['/api/yield-farming/positions', account],
    enabled: !!account,
  });

  const depositMutation = useMutation({
    mutationFn: async ({ poolId, amount }: { poolId: string; amount: string }) => {
      if (!account) throw new Error("Connect wallet to deposit");
      return apiRequest('POST', '/api/yield-farming/deposit', {
        poolId,
        user: account,
        amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Deposit Successful!",
        description: "Your tokens have been deposited to the farm",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/yield-farming/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/yield-farming/positions', account] });
      setSelectedPool(null);
      setDepositAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ positionId, amount }: { positionId: string; amount: string }) => {
      return apiRequest('POST', '/api/yield-farming/withdraw', {
        positionId,
        user: account,
        amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Successful!",
        description: "Your tokens and rewards have been withdrawn",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/yield-farming/positions', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const harvestMutation = useMutation({
    mutationFn: async (positionId: string) => {
      return apiRequest('POST', '/api/yield-farming/harvest', {
        positionId,
        user: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Harvest Successful!",
        description: "Rewards have been sent to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/yield-farming/positions', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Harvest Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAutoCompoundMutation = useMutation({
    mutationFn: async ({ positionId, enabled }: { positionId: string; enabled: boolean }) => {
      return apiRequest('POST', '/api/yield-farming/auto-compound', {
        positionId,
        user: account,
        enabled,
      });
    },
    onSuccess: () => {
      toast({
        title: "Auto-Compound Updated!",
        description: "Your auto-compound settings have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/yield-farming/positions', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalDeposited = myPositions?.reduce((sum, pos) => sum + parseFloat(pos.amount), 0) || 0;
  const totalRewards = myPositions?.reduce((sum, pos) => sum + parseFloat(pos.rewards), 0) || 0;
  const totalEarned = myPositions?.reduce((sum, pos) => sum + parseFloat(pos.totalRewardsEarned), 0) || 0;
  const activePositions = myPositions?.length || 0;

  const activePools = farmPools?.filter(p => p.status === 'active') || [];

  const calculateDailyRewards = (amount: string, apy: string) => {
    const daily = (parseFloat(amount) * parseFloat(apy) / 100) / 365;
    return daily.toFixed(4);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sprout className="h-10 w-10 text-green-500" />
          Yield Farming
        </h1>
        <p className="text-muted-foreground">Stake LP tokens to earn high-yield rewards</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deposited</p>
                <p className="text-3xl font-bold" data-testid="text-total-deposited">
                  ${totalDeposited.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Rewards</p>
                <p className="text-3xl font-bold text-green-600">
                  ${totalRewards.toFixed(2)}
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-3xl font-bold text-purple-600">
                  ${totalEarned.toFixed(2)}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Positions</p>
                <p className="text-3xl font-bold">{activePositions}</p>
              </div>
              <Sprout className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!account ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sprout className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Yield Farming</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to start earning high yields
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="pools" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pools">Farm Pools ({activePools.length})</TabsTrigger>
              <TabsTrigger value="positions">My Positions ({myPositions?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="pools" className="space-y-4">
              {activePools.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Sprout className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Active Farms</h3>
                    <p className="text-muted-foreground">Check back soon for new farming opportunities</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activePools.map(pool => (
                    <Card key={pool.id} data-testid={`pool-${pool.id}`} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                              {pool.token0}/{pool.token1}
                              <Badge variant="secondary">{pool.multiplier}x</Badge>
                            </CardTitle>
                            <CardDescription>{pool.name}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-green-600">{pool.apy}%</div>
                            <p className="text-sm text-muted-foreground">APY</p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">TVL</p>
                            <p className="font-semibold">${parseFloat(pool.tvl).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Lock Period</p>
                            <p className="font-semibold">{pool.lockPeriod} days</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rewards</p>
                            <p className="font-semibold">{pool.rewardToken}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Daily rewards per $1000:</span>
                            <span className="font-bold text-green-600">
                              ${calculateDailyRewards('1000', pool.apy)}
                            </span>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full" onClick={() => setSelectedPool(pool)} data-testid={`button-deposit-${pool.id}`}>
                              <Sprout className="h-4 w-4 mr-2" />
                              Deposit & Farm
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Deposit to {pool.token0}/{pool.token1}</DialogTitle>
                              <DialogDescription>
                                Stake your LP tokens to earn {pool.apy}% APY
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">APY</p>
                                    <p className="text-2xl font-bold text-green-600">{pool.apy}%</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Multiplier</p>
                                    <p className="text-2xl font-bold">{pool.multiplier}x</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="deposit-amount">Deposit Amount (LP Tokens)</Label>
                                <Input
                                  id="deposit-amount"
                                  type="number"
                                  placeholder="100"
                                  value={depositAmount}
                                  onChange={(e) => setDepositAmount(e.target.value)}
                                  data-testid="input-deposit-amount"
                                />
                              </div>

                              {depositAmount && parseFloat(depositAmount) > 0 && (
                                <div className="p-4 bg-muted rounded-lg space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Daily Rewards:</span>
                                    <span className="font-semibold text-green-600">
                                      ${calculateDailyRewards(depositAmount, pool.apy)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Monthly Rewards:</span>
                                    <span className="font-semibold text-green-600">
                                      ${(parseFloat(calculateDailyRewards(depositAmount, pool.apy)) * 30).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Yearly Rewards:</span>
                                    <span className="font-bold text-lg text-green-600">
                                      ${(parseFloat(depositAmount) * parseFloat(pool.apy) / 100).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <Button
                                className="w-full"
                                onClick={() => depositMutation.mutate({ poolId: pool.id, amount: depositAmount })}
                                disabled={!depositAmount || parseFloat(depositAmount) === 0 || depositMutation.isPending}
                                data-testid="button-confirm-deposit"
                              >
                                {depositMutation.isPending ? 'Depositing...' : 'Confirm Deposit'}
                              </Button>

                              <p className="text-xs text-muted-foreground text-center">
                                Tokens will be locked for {pool.lockPeriod} days
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="positions" className="space-y-4">
              {!myPositions || myPositions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Sprout className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Active Positions</h3>
                    <p className="text-muted-foreground mb-6">Deposit tokens to start earning rewards</p>
                    <Button onClick={() => (document.querySelector('[value="pools"]') as HTMLElement)?.click()}>
                      View Farm Pools
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                myPositions.map(position => {
                  const pool = farmPools?.find(p => p.id === position.poolId);
                  const dailyRewards = pool ? calculateDailyRewards(position.amount, pool.apy) : '0';

                  return (
                    <Card key={position.id} data-testid={`position-${position.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">
                              {pool?.token0}/{pool?.token1}
                            </CardTitle>
                            <CardDescription>{pool?.name}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{pool?.apy}%</div>
                            <p className="text-sm text-muted-foreground">APY</p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Deposited</p>
                            <p className="font-semibold">${position.amount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Pending Rewards</p>
                            <p className="font-semibold text-green-600">${position.rewards}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Earned</p>
                            <p className="font-semibold text-purple-600">${position.totalRewardsEarned}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Harvests</p>
                            <p className="font-semibold">{position.harvestCount}x</p>
                          </div>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Daily rewards:</span>
                            <span className="font-semibold text-green-600">~${dailyRewards}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <div>
                              <p className="font-semibold">Auto-Compound</p>
                              <p className="text-xs text-muted-foreground">Automatically reinvest rewards</p>
                            </div>
                          </div>
                          <Switch
                            checked={position.autoCompound}
                            onCheckedChange={(checked) => 
                              toggleAutoCompoundMutation.mutate({ positionId: position.id, enabled: checked })
                            }
                            data-testid={`switch-autocompound-${position.id}`}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => harvestMutation.mutate(position.id)}
                            disabled={parseFloat(position.rewards) === 0 || harvestMutation.isPending}
                            data-testid={`button-harvest-${position.id}`}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Harvest
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="flex-1" data-testid={`button-withdraw-${position.id}`}>
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                Withdraw
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Withdraw from Farm</DialogTitle>
                                <DialogDescription>
                                  Withdraw your LP tokens and claim rewards
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="withdraw-amount">Withdraw Amount</Label>
                                  <Input
                                    id="withdraw-amount"
                                    type="number"
                                    placeholder={position.amount}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    data-testid="input-withdraw-amount"
                                  />
                                  <p className="text-sm text-muted-foreground">
                                    Available: ${position.amount}
                                  </p>
                                </div>

                                <div className="p-4 bg-muted rounded-lg">
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Withdrawing:</span>
                                      <span className="font-semibold">${withdrawAmount || '0'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Pending Rewards:</span>
                                      <span className="font-semibold text-green-600">${position.rewards}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                      <span className="font-semibold">Total Received:</span>
                                      <span className="font-bold text-lg">
                                        ${(parseFloat(withdrawAmount || '0') + parseFloat(position.rewards)).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <Button
                                  className="w-full"
                                  onClick={() => withdrawMutation.mutate({ positionId: position.id, amount: withdrawAmount })}
                                  disabled={!withdrawAmount || parseFloat(withdrawAmount) === 0 || withdrawMutation.isPending}
                                  data-testid="button-confirm-withdraw"
                                >
                                  {withdrawMutation.isPending ? 'Withdrawing...' : 'Confirm Withdrawal'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
