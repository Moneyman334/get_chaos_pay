import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { data: vaults } = useQuery({
    queryKey: ["/api/vaults"],
    enabled: true
  });

  // Fetch user positions (only if connected)
  const { data: userPositions } = useQuery({
    queryKey: ["/api/vaults/positions", account],
    enabled: isConnected && !!account
  });

  // Mock data - will be replaced with real data from backend
  const empireStats = {
    totalVolume: "12,458,392.50",
    activePlayers: "8,432",
    houseProfit: "245,892.10",
    totalGamesPlayed: "1,284,302"
  };

  const userStats = {
    level: 12,
    xp: 3450,
    xpToNextLevel: 5000,
    wins: 847,
    losses: 653,
    totalWagered: "158.45",
    totalWon: "192.38",
    currentStreak: 7,
    bestStreak: 23,
    achievements: 18,
    rank: 342
  };

  const dailyQuests = [
    { id: 1, title: "Roll the Dice", description: "Play 10 dice games", progress: 7, max: 10, reward: "50 XP + 0.001 ETH", completed: false },
    { id: 2, title: "Spin to Win", description: "Hit a jackpot on slots", progress: 0, max: 1, reward: "100 XP + 0.005 ETH", completed: false },
    { id: 3, title: "Flip Master", description: "Win 5 coin flips in a row", progress: 2, max: 5, reward: "75 XP + 0.002 ETH", completed: false },
    { id: 4, title: "High Roller", description: "Wager at least 1 ETH total", progress: 0.45, max: 1, reward: "200 XP + 0.01 ETH", completed: false }
  ];

  const leaderboard = [
    { rank: 1, address: "0x742d...4ea2", profit: "+45.82 ETH", wins: 234, avatar: "👑" },
    { rank: 2, address: "0x1a3f...9bc1", profit: "+38.91 ETH", wins: 198, avatar: "🔥" },
    { rank: 3, address: "0x8d2c...7ef5", profit: "+32.45 ETH", wins: 176, avatar: "💎" },
    { rank: 4, address: "0x4f9e...2ab8", profit: "+28.19 ETH", wins: 153, avatar: "⚡" },
    { rank: 5, address: "0x6b1a...5cd9", profit: "+24.73 ETH", wins: 142, avatar: "🎯" },
  ];

  const recentActivity = [
    { player: "0x742d...4ea2", action: "won", amount: "2.5 ETH", game: "Dice", time: "2m ago" },
    { player: "0x1a3f...9bc1", action: "won", amount: "1.8 ETH", game: "Slots", time: "3m ago" },
    { player: "0x8d2c...7ef5", action: "lost", amount: "0.5 ETH", game: "Coin Flip", time: "5m ago" },
    { player: "0x4f9e...2ab8", action: "won", amount: "3.2 ETH", game: "Dice", time: "8m ago" },
    { player: "0x6b1a...5cd9", action: "won", amount: "0.9 ETH", game: "Slots", time: "12m ago" },
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-accent p-8 text-white">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <Crown className="h-12 w-12 text-yellow-400 animate-pulse" />
            <div>
              <h1 className="text-5xl font-bold">Chaos Empire</h1>
              <p className="text-xl text-white/90">Evolution of the Future</p>
            </div>
          </div>
          
          {isConnected ? (
            <div className="flex items-center gap-4 flex-wrap">
              <Badge className="bg-white/20 text-white text-lg px-4 py-2" data-testid="badge-user-level">
                <Star className="mr-2 h-5 w-5 text-yellow-400" />
                Level {userStats.level}
              </Badge>
              <Badge className="bg-white/20 text-white text-lg px-4 py-2" data-testid="badge-user-rank">
                <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
                Rank #{userStats.rank}
              </Badge>
              <Badge className="bg-white/20 text-white text-lg px-4 py-2" data-testid="badge-user-streak">
                <Flame className="mr-2 h-5 w-5 text-orange-400" />
                {userStats.currentStreak} Day Streak
              </Badge>
            </div>
          ) : (
            <p className="text-lg text-white/90">Connect your wallet to join the empire and start earning!</p>
          )}
        </div>
      </div>

      {/* Empire Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-volume">{empireStats.totalVolume} ETH</div>
            <p className="text-xs text-muted-foreground mt-1">+12.5% from last week</p>
          </CardContent>
        </Card>

        <Card className="border-accent/50 bg-gradient-to-br from-accent/10 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-active-players">{empireStats.activePlayers}</div>
            <p className="text-xs text-muted-foreground mt-1">+8.2% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">House Profit</CardTitle>
            <Coins className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500" data-testid="stat-house-profit">{empireStats.houseProfit} ETH</div>
            <p className="text-xs text-muted-foreground mt-1">Available for vault holders</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-games-played">{empireStats.totalGamesPlayed}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {isConnected && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* User Progress */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Empire Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Level Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Level {userStats.level}</span>
                  <span className="text-sm text-muted-foreground">{userStats.xp} / {userStats.xpToNextLevel} XP</span>
                </div>
                <Progress value={(userStats.xp / userStats.xpToNextLevel) * 100} className="h-3" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{userStats.wins}</div>
                  <div className="text-xs text-muted-foreground">Wins</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{userStats.losses}</div>
                  <div className="text-xs text-muted-foreground">Losses</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{userStats.totalWagered}</div>
                  <div className="text-xs text-muted-foreground">Wagered (ETH)</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-accent">{userStats.totalWon}</div>
                  <div className="text-xs text-muted-foreground">Won (ETH)</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 flex-wrap">
                <Link href="/games">
                  <Button className="flex-1" data-testid="button-play-games">
                    <Swords className="mr-2 h-4 w-4" />
                    Play Games
                  </Button>
                </Link>
                <Link href="/sentinel-bot">
                  <Button variant="outline" className="flex-1" data-testid="button-trading-bot">
                    <Zap className="mr-2 h-4 w-4" />
                    Trading Bot
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Unlocked</span>
                <Badge variant="outline">{userStats.achievements} / 50</Badge>
              </div>
              <Progress value={(userStats.achievements / 50) * 100} />
              
              <div className="space-y-2 mt-4">
                <Badge className="w-full justify-start bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                  <Trophy className="mr-2 h-4 w-4" />
                  First Win
                </Badge>
                <Badge className="w-full justify-start bg-primary/20 text-primary border-primary/50">
                  <Flame className="mr-2 h-4 w-4" />
                  7 Day Streak
                </Badge>
                <Badge className="w-full justify-start bg-accent/20 text-accent border-accent/50">
                  <Star className="mr-2 h-4 w-4" />
                  High Roller
                </Badge>
              </div>

              <Button variant="outline" className="w-full mt-4" data-testid="button-view-achievements">
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* House Vaults Showcase */}
      <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 overflow-hidden">
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
                {Number(vaults?.reduce((sum: number, v: any) => sum + parseFloat(v.totalStaked || '0'), 0) ?? 0).toFixed(2)} ETH
              </div>
              <div className="text-xs text-muted-foreground">Total Locked</div>
            </div>
            <div className="text-center p-3 border border-blue-500/20 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-blue-500">
                {vaults?.reduce((sum: number, v: any) => sum + parseInt(v.activePositions || '0'), 0) ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Active Stakers</div>
            </div>
            <div className="text-center p-3 border border-purple-500/20 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-purple-500">
                {Number(vaults?.reduce((sum: number, v: any) => sum + parseFloat(v.totalEarnings || '0'), 0) ?? 0).toFixed(2)} ETH
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
            {vaults?.slice(0, 3).map((vault: any) => (
              <div key={vault.id} className="border rounded-lg p-4 bg-background/50 hover:border-green-500/50 transition-all" data-testid={`vault-preview-${vault.tier}`}>
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

      {/* Tabs Section */}
      <Tabs defaultValue="quests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quests" data-testid="tab-quests">
            <Target className="mr-2 h-4 w-4" />
            Daily Quests
          </TabsTrigger>
          <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            <Zap className="mr-2 h-4 w-4" />
            Live Activity
          </TabsTrigger>
        </TabsList>

        {/* Daily Quests */}
        <TabsContent value="quests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Daily Quests
                </span>
                <Badge variant="outline">Resets in 18h 42m</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dailyQuests.map((quest) => (
                <div key={quest.id} className="border rounded-lg p-4 space-y-3" data-testid={`quest-${quest.id}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{quest.title}</h4>
                      <p className="text-sm text-muted-foreground">{quest.description}</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
                      {quest.reward}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{quest.progress} / {quest.max}</span>
                      <span>{((quest.progress / quest.max) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(quest.progress / quest.max) * 100} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Top Players This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((player) => (
                  <div 
                    key={player.rank} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      player.rank <= 3 ? 'bg-primary/5 border-primary/50' : 'border-border'
                    }`}
                    data-testid={`leaderboard-${player.rank}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl ${player.rank <= 3 ? 'text-4xl' : ''}`}>
                        {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.avatar}
                      </div>
                      <div>
                        <div className="font-mono font-semibold">{player.address}</div>
                        <div className="text-sm text-muted-foreground">{player.wins} wins</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-500">{player.profit}</div>
                      <Badge variant="outline" className="mt-1">Rank #{player.rank}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Activity */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary animate-pulse" />
                Live Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.map((activity, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg border"
                    data-testid={`activity-${idx}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.action === 'won' ? 'bg-green-500' : 'bg-red-500'
                      } animate-pulse`}></div>
                      <div>
                        <div className="font-mono text-sm">{activity.player}</div>
                        <div className="text-xs text-muted-foreground">{activity.game} • {activity.time}</div>
                      </div>
                    </div>
                    <Badge variant={activity.action === 'won' ? 'default' : 'destructive'}>
                      {activity.action === 'won' ? '+' : '-'}{activity.amount}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
