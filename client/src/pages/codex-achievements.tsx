import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  TrendingUp, 
  Lock, 
  Gift, 
  Sparkles,
  Wallet,
  Target,
  Users,
  Coins,
  Gamepad2,
  Vote,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Link } from "wouter";

const categoryIcons: Record<string, any> = {
  trading: TrendingUp,
  staking: Lock,
  gaming: Gamepad2,
  social: Users,
  governance: Vote,
};

const categoryColors: Record<string, string> = {
  trading: "from-green-500 to-emerald-600",
  staking: "from-blue-500 to-cyan-600",
  gaming: "from-purple-500 to-pink-600",
  social: "from-orange-500 to-red-600",
  governance: "from-yellow-500 to-amber-600",
};

const tierColors: Record<string, string> = {
  bronze: "from-orange-700 to-amber-800",
  silver: "from-gray-400 to-slate-500",
  gold: "from-yellow-500 to-amber-600",
  platinum: "from-cyan-400 to-blue-500",
  diamond: "from-purple-500 to-pink-600",
};

export default function CodexAchievementsPage() {
  const { account, isConnected } = useWeb3();

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/codex/achievements"],
    enabled: true,
  });

  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: [`/api/codex/achievements/${account}`],
    enabled: isConnected && !!account,
  });

  const groupedAchievements = achievements?.reduce((acc: any, achievement: any) => {
    const category = achievement.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, any[]>) || {};

  const getUserAchievementProgress = (achievementId: string) => {
    return userProgress?.find((p: any) => p.achievementId === achievementId);
  };

  const getProgressPercentage = (achievement: any, progress: any) => {
    if (!progress || !achievement.requiredActions) return 0;
    const current = progress.currentProgress || 0;
    const required = achievement.requiredActions[0]?.count || 1;
    return Math.min((current / required) * 100, 100);
  };

  const categories = Object.keys(groupedAchievements);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-800 to-amber-900 dark:from-gray-900 dark:via-yellow-950 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              CODEX Achievements
            </h1>
            <Trophy className="w-12 h-12 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-xl text-yellow-200 dark:text-yellow-300">
            Unlock Living NFT Achievements That Evolve With Your Activity
          </p>
        </div>

        {!isConnected ? (
          <Card className="mb-8 bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-400/30">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wallet className="w-20 h-20 text-orange-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
                <p className="text-orange-200 dark:text-orange-300 mb-6 max-w-md mx-auto">
                  Connect your wallet to view your achievement progress and claim rewards.
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-yellow-600/20 to-amber-600/20 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-400/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Total Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <Skeleton className="h-12 bg-yellow-800/30" />
                ) : (
                  <p className="text-4xl font-bold text-white" data-testid="text-total-achievements">
                    {userProgress?.filter((p: any) => p.claimed).length || 0} / {achievements?.length || 0}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-400/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-orange-400" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <Skeleton className="h-12 bg-orange-800/30" />
                ) : (
                  <p className="text-4xl font-bold text-white" data-testid="text-in-progress">
                    {userProgress?.filter((p: any) => !p.claimed && p.currentProgress > 0).length || 0}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-400/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Gift className="w-5 h-5 text-purple-400" />
                  Unclaimed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <Skeleton className="h-12 bg-purple-800/30" />
                ) : (
                  <p className="text-4xl font-bold text-white" data-testid="text-unclaimed">
                    {userProgress?.filter((p: any) => p.completed && !p.claimed).length || 0}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-400/30">
          <CardHeader>
            <CardTitle className="text-white">All Achievements</CardTitle>
            <CardDescription className="text-yellow-200 dark:text-yellow-300">
              Complete actions to unlock achievements and earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={categories[0] || "trading"} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-yellow-900/30 mb-6">
                {categories.map((category) => {
                  const Icon = categoryIcons[category] || Trophy;
                  return (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                      className="data-[state=active]:bg-yellow-600/50"
                      data-testid={`tab-${category}`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  {achievementsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-48 bg-yellow-800/30" />
                      ))}
                    </div>
                  ) : (
                    groupedAchievements[category]?.map((achievement: any) => {
                      const progress = getUserAchievementProgress(achievement.id);
                      const progressPercent = getProgressPercentage(achievement, progress);
                      const isClaimed = progress?.claimed;
                      const isCompleted = progress?.completed;

                      return (
                        <Card
                          key={achievement.id}
                          className={`bg-gradient-to-br ${
                            isClaimed
                              ? "from-green-900/40 to-emerald-900/40 border-green-400/30"
                              : "from-yellow-900/40 to-orange-900/40 border-yellow-400/30"
                          } dark:from-yellow-950/60 dark:to-orange-950/60 hover:border-yellow-400/60 transition-all`}
                          data-testid={`card-achievement-${achievement.id}`}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <CardTitle className="text-white text-lg" data-testid={`text-achievement-name-${achievement.id}`}>
                                    {achievement.name}
                                  </CardTitle>
                                  {isClaimed && (
                                    <CheckCircle2 className="w-5 h-5 text-green-400" data-testid={`icon-claimed-${achievement.id}`} />
                                  )}
                                </div>
                                <CardDescription className="text-yellow-200">
                                  {achievement.description}
                                </CardDescription>
                              </div>
                              <Badge className={`bg-gradient-to-r ${tierColors[achievement.tier?.toLowerCase()] || tierColors.bronze} text-white`}>
                                {achievement.tier}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {achievement.requiredActions && achievement.requiredActions.length > 0 && (
                                <div>
                                  <p className="text-sm text-yellow-300 mb-2">Required Actions:</p>
                                  <div className="space-y-2">
                                    {achievement.requiredActions.map((action: any, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2 text-sm">
                                        {progress?.currentProgress >= action.count ? (
                                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                                        ) : (
                                          <Circle className="w-4 h-4 text-yellow-400/50" />
                                        )}
                                        <span className="text-yellow-200" data-testid={`text-action-${achievement.id}-${idx}`}>
                                          {action.type}: {action.count}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {isConnected && !isClaimed && (
                                <div>
                                  <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-yellow-300">Progress</span>
                                    <span className="text-yellow-400" data-testid={`text-progress-${achievement.id}`}>
                                      {Math.round(progressPercent)}%
                                    </span>
                                  </div>
                                  <Progress value={progressPercent} className="h-2" />
                                </div>
                              )}

                              {achievement.rewards && achievement.rewards.length > 0 && (
                                <div className="pt-3 border-t border-yellow-400/20">
                                  <p className="text-sm text-yellow-300 mb-2">Rewards:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {achievement.rewards.map((reward: any, idx: number) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="border-yellow-400 text-yellow-200"
                                        data-testid={`badge-reward-${achievement.id}-${idx}`}
                                      >
                                        <Coins className="w-3 h-3 mr-1" />
                                        {reward.type}: {reward.amount}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {isConnected && isCompleted && !isClaimed && (
                                <Button
                                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                  data-testid={`button-claim-${achievement.id}`}
                                >
                                  <Gift className="w-4 h-4 mr-2" />
                                  Claim Reward
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
