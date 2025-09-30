import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Award, Star, Crown, Zap, Lock, CheckCircle, Gift, Medal } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'trading' | 'social' | 'collection' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  unlocked: boolean;
  progress: number;
  requirement: number;
  nftMinted: boolean;
  unlockedAt?: string;
}

interface AchievementStats {
  totalPoints: number;
  unlockedCount: number;
  totalCount: number;
  level: number;
  nextLevelPoints: number;
  rank: string;
}

export default function AchievementsPage() {
  const { account } = useWeb3();
  const { toast } = useToast();

  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements', account],
    enabled: !!account,
  });

  const { data: stats } = useQuery<AchievementStats>({
    queryKey: ['/api/achievements/stats', account],
    enabled: !!account,
  });

  const mintBadgeMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      return apiRequest('POST', '/api/achievements/mint-nft', {
        achievementId,
        wallet: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "NFT Badge Minted!",
        description: "Your achievement badge has been minted to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/achievements', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Minting Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100 dark:bg-orange-950';
      case 'silver': return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      case 'gold': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950';
      case 'platinum': return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-950';
      case 'diamond': return 'text-purple-600 bg-purple-100 dark:bg-purple-950';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return Medal;
      case 'silver': return Star;
      case 'gold': return Trophy;
      case 'platinum': return Crown;
      case 'diamond': return Zap;
      default: return Award;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trading': return Zap;
      case 'social': return Star;
      case 'collection': return Trophy;
      case 'milestone': return Crown;
      case 'special': return Gift;
      default: return Award;
    }
  };

  const achievementsByCategory = {
    trading: achievements?.filter(a => a.category === 'trading') || [],
    social: achievements?.filter(a => a.category === 'social') || [],
    collection: achievements?.filter(a => a.category === 'collection') || [],
    milestone: achievements?.filter(a => a.category === 'milestone') || [],
    special: achievements?.filter(a => a.category === 'special') || [],
  };

  const levelProgress = stats ? ((stats.totalPoints % stats.nextLevelPoints) / stats.nextLevelPoints) * 100 : 0;

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Connect your wallet to view achievements</CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              Please connect your wallet to track achievements
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Achievements</h1>
        <p className="text-muted-foreground">Unlock achievements and mint exclusive NFT badges</p>
      </div>

      {/* Player Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-6 w-6 text-yellow-500" />
                  Level {stats?.level || 1} - {stats?.rank || 'Novice'}
                </CardTitle>
                <CardDescription>
                  {stats?.totalPoints || 0} / {stats?.nextLevelPoints || 1000} XP to next level
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {stats?.totalPoints || 0} XP
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={levelProgress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {((stats?.nextLevelPoints || 1000) - (stats?.totalPoints || 0))} XP remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Unlocked</span>
              <span className="text-2xl font-bold">
                {stats?.unlockedCount || 0}/{stats?.totalCount || 0}
              </span>
            </div>
            <Progress 
              value={stats && stats.totalCount > 0 ? (stats.unlockedCount / stats.totalCount) * 100 : 0} 
              className="h-2"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="milestone">Milestone</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {achievements?.map(achievement => {
            const TierIcon = getTierIcon(achievement.tier);
            const CategoryIcon = getCategoryIcon(achievement.category);
            
            return (
              <Card 
                key={achievement.id}
                className={achievement.unlocked ? 'border-primary' : 'opacity-75'}
                data-testid={`achievement-${achievement.id}`}
              >
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${getTierColor(achievement.tier)}`}>
                      {achievement.unlocked ? (
                        <TierIcon className="h-8 w-8" />
                      ) : (
                        <Lock className="h-8 w-8" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{achievement.title}</h3>
                            <Badge className={getTierColor(achievement.tier)}>
                              {achievement.tier}
                            </Badge>
                            {achievement.unlocked && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-yellow-600 mb-1">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-bold">{achievement.points} XP</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            <CategoryIcon className="h-3 w-3 mr-1" />
                            {achievement.category}
                          </Badge>
                        </div>
                      </div>

                      {!achievement.unlocked ? (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">
                              {achievement.progress}/{achievement.requirement}
                            </span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.requirement) * 100} 
                            className="h-2"
                          />
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2">
                          {achievement.nftMinted ? (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              NFT Minted
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => mintBadgeMutation.mutate(achievement.id)}
                              disabled={mintBadgeMutation.isPending}
                              data-testid={`button-mint-${achievement.id}`}
                            >
                              <Gift className="h-4 w-4 mr-2" />
                              {mintBadgeMutation.isPending ? 'Minting...' : 'Mint NFT Badge'}
                            </Button>
                          )}
                          {achievement.unlockedAt && (
                            <span className="text-xs text-muted-foreground">
                              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {categoryAchievements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">No {category} achievements available</p>
                </CardContent>
              </Card>
            ) : (
              categoryAchievements.map(achievement => {
                const TierIcon = getTierIcon(achievement.tier);
                
                return (
                  <Card 
                    key={achievement.id}
                    className={achievement.unlocked ? 'border-primary' : 'opacity-75'}
                  >
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${getTierColor(achievement.tier)}`}>
                          {achievement.unlocked ? (
                            <TierIcon className="h-8 w-8" />
                          ) : (
                            <Lock className="h-8 w-8" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{achievement.title}</h3>
                                <Badge className={getTierColor(achievement.tier)}>
                                  {achievement.tier}
                                </Badge>
                                {achievement.unlocked && (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-bold">{achievement.points} XP</span>
                            </div>
                          </div>

                          {!achievement.unlocked ? (
                            <div className="mt-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-muted-foreground">Progress</span>
                                <span className="text-sm font-medium">
                                  {achievement.progress}/{achievement.requirement}
                                </span>
                              </div>
                              <Progress 
                                value={(achievement.progress / achievement.requirement) * 100} 
                                className="h-2"
                              />
                            </div>
                          ) : achievement.nftMinted ? (
                            <Badge variant="outline" className="text-green-600 mt-3">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              NFT Minted
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => mintBadgeMutation.mutate(achievement.id)}
                              disabled={mintBadgeMutation.isPending}
                              className="mt-3"
                            >
                              <Gift className="h-4 w-4 mr-2" />
                              {mintBadgeMutation.isPending ? 'Minting...' : 'Mint NFT Badge'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
