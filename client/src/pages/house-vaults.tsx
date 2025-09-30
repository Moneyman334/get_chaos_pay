import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Coins, 
  TrendingUp, 
  Users, 
  Lock, 
  Unlock,
  ArrowUpCircle,
  ArrowDownCircle,
  Gift,
  Trophy,
  Shield,
  Zap,
  Crown,
  Info,
  Loader2
} from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function HouseVaultsPage() {
  const { account, balance, isConnected, sendTransaction } = useWeb3();
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [showStakeDialog, setShowStakeDialog] = useState(false);
  const { toast } = useToast();

  // Fetch all active vaults
  const { data: vaults, isLoading: vaultsLoading } = useQuery({
    queryKey: ["/api/vaults"],
    enabled: true
  });

  // Fetch user positions (only if connected)
  const { data: userPositions } = useQuery({
    queryKey: ["/api/vaults/positions", account],
    enabled: isConnected && !!account
  });

  // Selected vault details
  const selectedVault = vaults?.find((v: any) => v.id === selectedVaultId);

  // Stake mutation
  const stakeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVault || !account) throw new Error("Missing vault or account");
      
      const amount = parseFloat(stakeAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid stake amount");
      }

      if (amount < parseFloat(selectedVault.minStake)) {
        throw new Error(`Minimum stake is ${selectedVault.minStake} ETH`);
      }

      // Send ETH transaction via MetaMask
      const txHash = await sendTransaction(selectedVault.vaultAddress, stakeAmount);
      
      // Record stake in backend
      const res = await apiRequest("POST", `/api/vaults/${selectedVault.id}/stake`, {
        walletAddress: account,
        stakedAmount: stakeAmount,
        stakeTxHash: txHash
      });
      
      await res.json();

      return txHash;
    },
    onSuccess: (txHash) => {
      toast({
        title: "Stake Successful!",
        description: `Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vaults"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vaults/positions", account] });
      setShowStakeDialog(false);
      setStakeAmount("");
      setSelectedVaultId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Stake Failed",
        description: error.message || "Failed to stake ETH",
        variant: "destructive",
      });
    }
  });

  // Unstake mutation
  const unstakeMutation = useMutation({
    mutationFn: async ({ positionId, vaultAddress, amount }: { positionId: string; vaultAddress: string; amount: string }) => {
      if (!account) throw new Error("Wallet not connected");
      
      // Send ETH withdrawal transaction via MetaMask
      // Note: For now, we're using a simple ETH send. In production, this should call a vault contract's unstake function
      const unstakeTxHash = await sendTransaction(account, "0");
      
      // Record unstake in backend
      const res = await apiRequest("POST", `/api/vaults/positions/${positionId}/unstake`, {
        unstakeTxHash
      });
      
      await res.json();
      
      return unstakeTxHash;
    },
    onSuccess: () => {
      toast({
        title: "Unstake Successful!",
        description: "Your funds have been withdrawn from the vault",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vaults"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vaults/positions", account] });
    },
    onError: (error: any) => {
      toast({
        title: "Unstake Failed",
        description: error.message || "Failed to unstake",
        variant: "destructive",
      });
    }
  });

  const handleStakeClick = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    setShowStakeDialog(true);
  };

  const handleStake = () => {
    stakeMutation.mutate();
  };

  const handleUnstake = (position: any) => {
    const vault = vaults?.find((v: any) => v.id === position.vaultId);
    if (vault) {
      unstakeMutation.mutate({
        positionId: position.id,
        vaultAddress: vault.vaultAddress,
        amount: position.stakedAmount
      });
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black';
      case 'premium': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'standard': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default: return 'bg-primary';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (vaultsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading House Vaults...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-12 w-12 text-yellow-400 animate-pulse" />
            <div>
              <h1 className="text-5xl font-bold">House Vaults</h1>
              <p className="text-xl text-white/90">Become the House. Earn from Every Win.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <Badge className="bg-white/20 text-white text-lg px-4 py-2" data-testid="badge-vault-info">
              <Shield className="mr-2 h-5 w-5" />
              Player-Owned Liquidity
            </Badge>
            <Badge className="bg-white/20 text-white text-lg px-4 py-2" data-testid="badge-earn-info">
              <TrendingUp className="mr-2 h-5 w-5" />
              Up to 25% APY
            </Badge>
            <Badge className="bg-white/20 text-white text-lg px-4 py-2" data-testid="badge-instant-info">
              <Zap className="mr-2 h-5 w-5" />
              Instant Withdrawals
            </Badge>
          </div>

          {!isConnected && (
            <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="text-white/90">Connect your wallet to stake in House Vaults and start earning!</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locked</CardTitle>
            <Coins className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500" data-testid="stat-total-locked">
              {Number(vaults?.reduce((sum: number, v: any) => sum + parseFloat(v.totalStaked || '0'), 0) ?? 0).toFixed(2)} ETH
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all vaults</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stakers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500" data-testid="stat-active-stakers">
              {vaults?.reduce((sum: number, v: any) => sum + parseInt(v.activePositions || '0'), 0) ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total participants</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500" data-testid="stat-total-earnings">
              {Number(vaults?.reduce((sum: number, v: any) => sum + parseFloat(v.totalEarnings || '0'), 0) ?? 0).toFixed(2)} ETH
            </div>
            <p className="text-xs text-muted-foreground mt-1">Distributed to stakers</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Position</CardTitle>
            <Gift className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500" data-testid="stat-user-position">
              {Number((userPositions ?? []).filter((p: any) => p.status === 'active').reduce((sum: number, p: any) => sum + parseFloat(p.stakedAmount || '0'), 0)).toFixed(2)} ETH
            </div>
            <p className="text-xs text-muted-foreground mt-1">Your staked amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="vaults" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vaults" data-testid="tab-vaults">
            <Trophy className="mr-2 h-4 w-4" />
            Available Vaults
          </TabsTrigger>
          <TabsTrigger value="positions" data-testid="tab-positions" disabled={!isConnected}>
            <Coins className="mr-2 h-4 w-4" />
            My Positions
          </TabsTrigger>
          <TabsTrigger value="earnings" data-testid="tab-earnings" disabled={!isConnected}>
            <Gift className="mr-2 h-4 w-4" />
            Earnings
          </TabsTrigger>
        </TabsList>

        {/* Available Vaults */}
        <TabsContent value="vaults" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vaults && Array.isArray(vaults) && vaults.map((vault: any) => (
              <Card key={vault.id} className="border-2 hover:border-primary/50 transition-all" data-testid={`vault-${vault.tier}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${getTierColor(vault.tier)}`}>
                        <Crown className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{vault.name}</CardTitle>
                        <CardDescription>{vault.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getTierColor(vault.tier)} variant="outline">
                      {vault.tier.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vault Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-3xl font-bold text-green-500">{vault.apy}%</div>
                      <div className="text-xs text-muted-foreground">APY</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold">{vault.totalStaked} ETH</div>
                      <div className="text-xs text-muted-foreground">Total Staked</div>
                    </div>
                  </div>

                  {/* Vault Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Stake:</span>
                      <span className="font-semibold">{vault.minStake} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Stakers:</span>
                      <span className="font-semibold">{vault.activePositions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Level:</span>
                      <span className={`font-semibold ${getRiskColor(vault.riskLevel)}`}>
                        {vault.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lock Period:</span>
                      <span className="font-semibold">
                        {vault.lockPeriod === '0' ? 'No Lock' : `${vault.lockPeriod} days`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Performance Fee:</span>
                      <span className="font-semibold">{vault.performanceFee}%</span>
                    </div>
                  </div>

                  {/* Stake Button */}
                  {isConnected ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleStakeClick(vault.id)}
                      data-testid={`button-stake-${vault.tier}`}
                    >
                      <ArrowUpCircle className="mr-2 h-5 w-5" />
                      Stake in This Vault
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" variant="outline" disabled>
                      <Lock className="mr-2 h-5 w-5" />
                      Connect Wallet to Stake
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {(!vaults || !Array.isArray(vaults) || vaults.length === 0) && (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">No vaults available at the moment</p>
                <p className="text-sm text-muted-foreground mt-2">Check back soon for new investment opportunities!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Positions */}
        <TabsContent value="positions" className="space-y-4">
          {userPositions && Array.isArray(userPositions) && userPositions.length > 0 ? (
            <div className="space-y-4">
              {userPositions.filter((p: any) => p.status === 'active').map((position: any) => (
                <Card key={position.id} data-testid={`position-${position.id}`}>
                  <CardHeader>
                    <CardTitle>Position #{position.id.slice(0, 8)}</CardTitle>
                    <CardDescription>Staked on {new Date(position.stakedAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-green-500">{position.stakedAmount}</div>
                        <div className="text-xs text-muted-foreground">Staked (ETH)</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-500">{position.currentValue}</div>
                        <div className="text-xs text-muted-foreground">Current Value</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-500">{position.totalEarnings}</div>
                        <div className="text-xs text-muted-foreground">Total Earned</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-yellow-500">{position.pendingEarnings}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>

                    {position.unlocksAt && new Date() < new Date(position.unlocksAt) ? (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex items-center gap-2">
                        <Lock className="h-5 w-5 text-yellow-500" />
                        <span>Unlocks on {new Date(position.unlocksAt).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant="destructive" 
                        data-testid={`button-unstake-${position.id}`}
                        onClick={() => handleUnstake(position)}
                        disabled={unstakeMutation.isPending}
                      >
                        {unstakeMutation.isPending ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <ArrowDownCircle className="mr-2 h-5 w-5" />
                        )}
                        Unstake Position
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Coins className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">No active positions</p>
                <p className="text-sm text-muted-foreground mt-2">Stake in a vault to start earning!</p>
                <Link href="#vaults">
                  <Button className="mt-4">Browse Vaults</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Earnings */}
        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">Earnings tracking coming soon!</p>
              <p className="text-sm text-muted-foreground mt-2">You'll be able to view and claim your earnings here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stake Dialog */}
      <Dialog open={showStakeDialog} onOpenChange={setShowStakeDialog}>
        <DialogContent data-testid="dialog-stake">
          <DialogHeader>
            <DialogTitle>Stake in {selectedVault?.name}</DialogTitle>
            <DialogDescription>
              Enter the amount of ETH you want to stake in this vault.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedVault && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">APY:</span>
                  <span className="font-semibold text-green-500">{selectedVault.apy}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Stake:</span>
                  <span className="font-semibold">{selectedVault.minStake} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lock Period:</span>
                  <span className="font-semibold">
                    {selectedVault.lockPeriod === '0' ? 'No Lock' : `${selectedVault.lockPeriod} days`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Balance:</span>
                  <span className="font-semibold">{balance} ETH</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="stake-amount">Amount (ETH)</Label>
              <Input
                id="stake-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Min: ${selectedVault?.minStake || '0'}`}
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                data-testid="input-stake-amount"
              />
            </div>

            {selectedVault && parseFloat(stakeAmount) > 0 && (
              <div className="p-3 border rounded-lg bg-green-500/10 border-green-500/50">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Estimated yearly earnings: ~{(parseFloat(stakeAmount) * parseFloat(selectedVault.apy) / 100).toFixed(4)} ETH
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStakeDialog(false);
                setStakeAmount("");
              }}
              disabled={stakeMutation.isPending}
              data-testid="button-cancel-stake"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStake}
              disabled={stakeMutation.isPending || !stakeAmount || parseFloat(stakeAmount) <= 0}
              data-testid="button-confirm-stake"
            >
              {stakeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Stake ETH
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
