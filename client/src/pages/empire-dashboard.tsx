 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  TrendingUp, 
  Users, 
  Coins, 
  Trophy, 
  Zap, 
  Target,
  Star,
  Flame,
  Sparkles,
  Gift,
  Swords,
  Shield,
  ChevronRight
} from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function EmpireDashboard() {
  const { account, balance, isConnected } = useWeb3();
  
  // Fetch House Vaults data
  const { data: vaults } = useQuery<any[]>({
    queryKey: ["/api/vaults"],
    enabled: true
  });

  // Fetch user positions (only if connected)
  const { data: userPositions } = useQuery<any[]>({
    queryKey: ["/api/vaults/positions", account],
    enabled: isConnected && !!account
  });

  // Fetch real empire stats from backend
  const { data: supremeStats } = useQuery<any>({
    queryKey: ["/api/supreme/stats", account],
    enabled: isConnected && !!account
  });

  // Fetch real activity feed from backend
  const { data: supremeActivity } = useQuery<any[]>({
    queryKey: ["/api/supreme/activity", account],
    enabled: isConnected && !!account
  });

  // Calculate user stats from real data
  const userStats = {
    totalInvested: supremeStats?.totalInvested || "0.00",
    totalEarned: supremeStats?.totalEarned || "0.00",
    totalValue: supremeStats?.totalPortfolioValue || "0.00",
    activePositions: supremeStats?.activePositions || 0,
    totalPnL: supremeStats?.totalPnL || "0.00",
    pnlPercent: supremeStats?.pnlPercent || "0.00%"
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-accent p-8 text-white animate-float divine-glow">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div className="absolute inset-0 animate-shimmer"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <Crown className="h-12 w-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" style={{animation: "float 3s ease-in-out infinite"}} />
            <div>
              <h1 className="text-5xl font-bold drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">Chaos Empire</h1>
              <p className="text-xl text-white/90">Evolution of the Future</p>
            </div>
          </div>
          
          {isConnected ? (
            <div className="flex items-center gap-4 flex-wrap">
              <Badge className="bg-white/20 text-white text-lg px-4 py-2" data-testid="badge-portfolio-value">
                <Coins className="mr-2 h-5 w-5 text-yellow-400" />
                ${userStats.totalValue}
              </Badge>
              <Badge className="bg-white/20 text-white text-lg px-4 py-2" data-testid="badge-total-earned">
                <TrendingUp className="mr-2 h-5 w-5 text-green-400" />
                +${userStats.totalEarned}
              </Badge>
              <Badge className="bg-white/20 text-white text-lg px-4 py-2" data-testid="badge-pnl">
                <Target className="mr-2 h-5 w-5 text-blue-400" />
                {userStats.pnlPercent}
              </Badge>
            </div>
          ) : (
            <p className="text-lg text-white/90">Connect your wallet to join the empire and start earning!</p>
          )}
        </div>
      </div>

      {/* Empire Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card cosmic-dust border-primary/30 hover:border-primary/60 transition-all duration-300 glow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-volume">${userStats.totalValue}</div>
            <p className="text-xs text-muted-foreground mt-1">Total assets</p>
          </CardContent>
        </Card>

        <Card className="premium-card cosmic-dust border-accent/30 hover:border-accent/60 transition-all duration-300 glow-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Coins className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-active-players">${userStats.totalInvested}</div>
            <p className="text-xs text-muted-foreground mt-1">Capital deployed</p>
          </CardContent>
        </Card>

        <Card className="premium-card cosmic-dust border-green-500/30 hover:border-green-500/60 transition-all duration-300 glow-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500" data-testid="stat-house-profit">${userStats.totalEarned}</div>
            <p className="text-xs text-muted-foreground mt-1">Rewards & profits</p>
          </CardContent>
        </Card>

        <Card className="premium-card cosmic-dust border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <Target className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-games-played">{userStats.activePositions}</div>
            <p className="text-xs text-muted-foreground mt-1">Running strategies</p>
          </CardContent>
        </Card>
      </div>

      {isConnected && supremeActivity && supremeActivity.length > 0 && (
        <Card className="glass-strong aurora-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supremeActivity.slice(0, 8).map((activity: any, idx: number) => (
                <div 
                  key={activity.id || idx} 
                  className="flex items-center justify-between p-3 rounded-lg premium-card hover:border-primary/30"
                  data-testid={`activity-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      {activity.category === 'Blockchain' ? (
                        <Target className="h-4 w-4 text-primary" />
                      ) : (
                        <Trophy className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.type}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <p className="text-sm font-bold text-green-500">{activity.amount}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Recently'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* House Vaults Showcase */}
      <Card className="glass-strong cosmic-dust border-green-500/30 hover:border-green-500/60 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 overflow-hidden transition-all duration-300 glow-secondary divine-glow">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-teal-500/5 pointer-events-none" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">House Vaults</CardTitle>
                <p className="text-muted-foreground">Become the house. Earn from every win.</p>
              </div>
            </div>
            <Link href="/vaults">
              <Button size="lg" className="bg-green-500 hover:bg-green-600" data-testid="button-explore-vaults">
                Explore Vaults
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vault Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border border-green-500/20 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-green-500">
                {Number((vaults || []).reduce((sum: number, v: any) => sum + parseFloat(v.totalStaked || '0'), 0)).toFixed(2)} ETH
              </div>
              <div className="text-xs text-muted-foreground">Total Locked</div>
            </div>
            <div className="text-center p-3 border border-blue-500/20 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-blue-500">
                {(vaults || []).reduce((sum: number, v: any) => sum + parseInt(v.activePositions || '0'), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Active Stakers</div>
            </div>
            <div className="text-center p-3 border border-purple-500/20 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-purple-500">
                {Number((vaults || []).reduce((sum: number, v: any) => sum + parseFloat(v.totalEarnings || '0'), 0)).toFixed(2)} ETH
              </div>
              <div className="text-xs text-muted-foreground">Total Distributed</div>
            </div>
            <div className="text-center p-3 border border-yellow-500/20 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-yellow-500">
                {Number((userPositions ?? []).filter((p: any) => p.status === 'active').reduce((sum: number, p: any) => sum + parseFloat(p.stakedAmount || '0'), 0)).toFixed(2)} ETH
              </div>
              <div className="text-xs text-muted-foreground">Your Position</div>
            </div>
          </div>

          {/* Featured Vaults */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(vaults || []).slice(0, 3).map((vault: any) => (
              <div key={vault.id} className="border rounded-lg p-4 bg-background/50 hover:border-green-500/50 transition-all premium-card" data-testid={`vault-preview-${vault.tier}`}>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={vault.tier === 'elite' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black' : vault.tier === 'premium' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}>
                    {vault.tier.toUpperCase()}
                  </Badge>
                  <div className="text-2xl font-bold text-green-500">{vault.apy}%</div>
                </div>
                <h4 className="font-semibold mb-1">{vault.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{vault.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Min Stake:</span>
                  <span className="font-semibold">{vault.minStake} ETH</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Staked:</span>
                  <span className="font-semibold">{vault.totalStaked} ETH</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
