import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Scroll, 
  Zap, 
  Shield, 
  Wallet, 
  Sparkles,
  TrendingUp,
  Bot,
  Lock,
  Crown,
  AlertCircle,
  CheckCircle2,
  Flame
} from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const tierColors: Record<string, string> = {
  common: "from-gray-400 to-gray-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-orange-400 to-orange-600",
  mythic: "from-pink-400 to-pink-600",
};

const classIcons: Record<string, any> = {
  chronicle: Scroll,
  catalyst: Zap,
  sentinel: Shield,
};

const effectIcons: Record<string, any> = {
  stake_apy: TrendingUp,
  trading_fee: Sparkles,
  bot_boost: Bot,
};

interface Relic {
  id: string;
  name: string;
  description: string;
  class: string;
  tier: string;
  imageUrl?: string;
  effectType: string;
  effectValue: string;
  effectDescription: string;
  acquisitionType: string;
  acquisitionRequirements: any;
}

interface RelicInstance {
  id: string;
  relicId: string;
  level: number;
  powerScore: number;
  isEquipped: string;
  equipSlot?: string;
  relic?: Relic;
}

export default function CodexRelicsPage() {
  const { account, isConnected } = useWeb3();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("chronicle");
  const [mainTab, setMainTab] = useState("catalog");

  const { data: relics, isLoading: relicsLoading } = useQuery<Relic[]>({
    queryKey: ["/api/codex/relics"],
    enabled: true,
  });

  const { data: userInstances, isLoading: instancesLoading } = useQuery<RelicInstance[]>({
    queryKey: [`/api/codex/relics/instances/${account}`],
    enabled: isConnected && !!account,
  });

  const { data: equippedRelics, isLoading: equippedLoading } = useQuery<RelicInstance[]>({
    queryKey: [`/api/codex/relics/equipped/${account}`],
    enabled: isConnected && !!account,
  });

  const equipMutation = useMutation({
    mutationFn: async ({ instanceId, slot }: { instanceId: string; slot: string }) => {
      return await apiRequest("POST", `/api/codex/relics/equip`, { instanceId, slot });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/codex/relics/instances/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/codex/relics/equipped/${account}`] });
      toast({
        title: "Relic Equipped",
        description: "Your relic has been equipped successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to equip relic",
        description: error.message || "Please try again later.",
      });
    }
  });

  const unequipMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      return await apiRequest("POST", `/api/codex/relics/unequip`, { instanceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/codex/relics/instances/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/codex/relics/equipped/${account}`] });
      toast({
        title: "Relic Unequipped",
        description: "Your relic has been unequipped.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to unequip relic",
        description: error.message || "Please try again later.",
      });
    }
  });

  const groupedRelics = relics?.reduce((acc: any, relic: any) => {
    const relicClass = relic.class || "other";
    if (!acc[relicClass]) {
      acc[relicClass] = [];
    }
    acc[relicClass].push(relic);
    return acc;
  }, {} as Record<string, any[]>) || {};

  const getUserInstance = (relicId: string) => {
    return userInstances?.find((i: any) => i.relicId === relicId);
  };

  const getNextAvailableSlot = () => {
    const usedSlots = equippedRelics?.map((r: any) => r.equipSlot) || [];
    const slots = ['slot1', 'slot2', 'slot3'];
    return slots.find(slot => !usedSlots.includes(slot)) || null;
  };

  const handleEquip = (instanceId: string) => {
    const slot = getNextAvailableSlot();
    if (!slot) {
      toast({
        variant: "destructive",
        title: "No Available Slots",
        description: "You can only equip 3 relics at a time. Unequip one first.",
      });
      return;
    }
    equipMutation.mutate({ instanceId, slot });
  };

  const classes = Object.keys(groupedRelics);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 dark:from-gray-900 dark:via-purple-950 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-12 h-12 text-purple-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              CODEX Relics
            </h1>
            <Crown className="w-12 h-12 text-purple-400 animate-pulse" />
          </div>
          <p className="text-xl text-purple-200 dark:text-purple-300">
            Unlock Powerful Artifacts to Boost Your CODEX Empire
          </p>
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-purple-900/30 mb-6 h-12">
            <TabsTrigger 
              value="catalog" 
              className="data-[state=active]:bg-purple-600/50 text-white"
              data-testid="tab-catalog"
            >
              <Scroll className="w-4 h-4 mr-2" />
              Catalog
            </TabsTrigger>
            <TabsTrigger 
              value="forge" 
              className="data-[state=active]:bg-purple-600/50 text-white"
              data-testid="tab-forge"
            >
              <Flame className="w-4 h-4 mr-2" />
              Forge
            </TabsTrigger>
            <TabsTrigger 
              value="my-relics" 
              className="data-[state=active]:bg-purple-600/50 text-white"
              data-testid="tab-my-relics"
            >
              <Shield className="w-4 h-4 mr-2" />
              My Relics
            </TabsTrigger>
          </TabsList>

          {/* CATALOG TAB */}
          <TabsContent value="catalog" className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-white">Relic Catalog</CardTitle>
                <CardDescription className="text-purple-200">
                  Discover all available relics and their acquisition paths
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="chronicle" value={selectedClass} onValueChange={setSelectedClass} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-purple-900/30 mb-6">
                    {classes.map((relicClass) => {
                      const Icon = classIcons[relicClass] || Scroll;
                      return (
                        <TabsTrigger
                          key={relicClass}
                          value={relicClass}
                          className="data-[state=active]:bg-purple-600/50"
                          data-testid={`filter-${relicClass}`}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {relicClass.charAt(0).toUpperCase() + relicClass.slice(1)}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {classes.map((relicClass) => (
                    <TabsContent key={relicClass} value={relicClass} className="space-y-4">
                      {relicsLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-48 bg-purple-800/30" />
                          ))}
                        </div>
                      ) : (
                        groupedRelics[relicClass]?.map((relic: any) => {
                          const instance = getUserInstance(relic.id);
                          const ClassIcon = classIcons[relic.class] || Scroll;
                          const EffectIcon = effectIcons[relic.effectType] || Sparkles;
                          const owned = !!instance;

                          return (
                            <Card
                              key={relic.id}
                              className={`bg-gradient-to-br ${
                                owned
                                  ? "from-emerald-900/40 to-green-900/40 border-emerald-400/30"
                                  : "from-purple-900/40 to-indigo-900/40 border-purple-400/30"
                              } hover:border-purple-400/60 transition-all`}
                              data-testid={`card-relic-${relic.id}`}
                            >
                              <div className="flex gap-4">
                                {relic.imageUrl && (
                                  <div className="w-32 h-32 flex-shrink-0">
                                    <img
                                      src={relic.imageUrl}
                                      alt={relic.name}
                                      className="w-full h-full object-cover rounded-l-lg"
                                      data-testid={`img-relic-${relic.id}`}
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <CardHeader>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <ClassIcon className="w-6 h-6 text-purple-400" />
                                          <CardTitle className="text-white text-xl" data-testid={`text-relic-name-${relic.id}`}>
                                            {relic.name}
                                          </CardTitle>
                                          {owned && (
                                            <CheckCircle2 className="w-5 h-5 text-green-400" data-testid={`icon-owned-${relic.id}`} />
                                          )}
                                        </div>
                                        <CardDescription className="text-purple-200">
                                          {relic.description}
                                        </CardDescription>
                                      </div>
                                      <Badge className={`bg-gradient-to-r ${tierColors[relic.tier.toLowerCase()] || tierColors.common} text-white`}>
                                        {relic.tier}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div className="flex items-start gap-2 p-3 bg-purple-800/30 rounded-lg">
                                    <EffectIcon className="w-5 h-5 text-purple-400 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-semibold text-purple-300">Effect:</p>
                                      <p className="text-white">{relic.effectDescription}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2 p-3 bg-indigo-800/30 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-indigo-400 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-indigo-300 mb-1">How to Acquire:</p>
                                      <div className="text-sm text-white">
                                        {relic.acquisitionType === 'milestone' && (
                                          <div>
                                            <p className="font-medium text-indigo-200 mb-1">Complete Milestones:</p>
                                            {Object.entries(relic.acquisitionRequirements).map(([key, value]: [string, any]) => (
                                              <p key={key} className="text-purple-300">
                                                • {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}: {value}
                                              </p>
                                            ))}
                                          </div>
                                        )}
                                        {relic.acquisitionType === 'forge' && (
                                          <div>
                                            <p className="font-medium text-indigo-200 mb-1">Relic Forge (Burn Resources):</p>
                                            {Object.entries(relic.acquisitionRequirements).map(([key, value]: [string, any]) => (
                                              <p key={key} className="text-purple-300">
                                                • {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}: {value}
                                              </p>
                                            ))}
                                          </div>
                                        )}
                                        {relic.acquisitionType === 'vault_ritual' && (
                                          <div>
                                            <p className="font-medium text-indigo-200 mb-1">House Vault Ritual:</p>
                                            {Object.entries(relic.acquisitionRequirements).map(([key, value]: [string, any]) => (
                                              <p key={key} className="text-purple-300">
                                                • {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}: {value} ETH
                                              </p>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {owned && instance && (
                                    <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-2 rounded">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span className="text-sm">You own this relic (Level {instance.level})</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                                </div>
                              </div>
                            </Card>
                          );
                        })
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FORGE TAB */}
          <TabsContent value="forge" className="space-y-6">
            {!isConnected ? (
              <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-400/30">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Wallet className="w-20 h-20 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
                    <p className="text-orange-200 mb-6">
                      Connect your wallet to access the Relic Forge
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ForgeContent account={account} />
            )}
          </TabsContent>

          {/* MY RELICS TAB */}
          <TabsContent value="my-relics" className="space-y-6">
            {!isConnected ? (
              <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-400/30">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Wallet className="w-20 h-20 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
                    <p className="text-purple-200 mb-6">
                      Connect your wallet to view and equip your relics
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Equipped Relics (Loadout) */}
                <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-400/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      Active Loadout (3 Slots Maximum)
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Your currently equipped relics and their active effects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {equippedLoading ? (
                        [...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-32 bg-purple-800/30" />
                        ))
                      ) : equippedRelics && equippedRelics.length > 0 ? (
                        equippedRelics.map((instance: any) => {
                          const relic = instance.relic;
                          const EffectIcon = effectIcons[relic?.effectType] || Sparkles;
                          
                          return (
                            <Card 
                              key={instance.id}
                              className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-400/40"
                              data-testid={`equipped-relic-${instance.id}`}
                            >
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-bold text-white text-sm" data-testid={`text-equipped-name-${instance.id}`}>
                                      {relic?.name}
                                    </h4>
                                    <Badge className={`mt-1 bg-gradient-to-r ${tierColors[relic?.tier] || tierColors.common} text-white text-xs`}>
                                      {relic?.tier}
                                    </Badge>
                                  </div>
                                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                                </div>
                                <div className="flex items-center gap-2 text-purple-300 text-xs mb-2">
                                  <EffectIcon className="w-4 h-4" />
                                  <span>{relic?.effectDescription}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unequipMutation.mutate(instance.id)}
                                  disabled={unequipMutation.isPending}
                                  className="w-full"
                                  data-testid={`button-unequip-${instance.id}`}
                                >
                                  Unequip
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="col-span-3 text-center py-8">
                          <Lock className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                          <p className="text-purple-300">No relics equipped. Equip relics below to activate their effects.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* My Relics Inventory */}
                <Card className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 dark:from-indigo-900/30 dark:to-blue-900/30 border-indigo-400/30">
                  <CardHeader>
                    <CardTitle className="text-white">My Relics</CardTitle>
                    <CardDescription className="text-indigo-200">
                      Relics you've earned and can equip
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {instancesLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-48 bg-indigo-800/30" />
                        ))}
                      </div>
                    ) : userInstances && userInstances.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userInstances.map((instance: any) => {
                          const relic = instance.relic;
                          const ClassIcon = classIcons[relic?.class] || Scroll;
                          const EffectIcon = effectIcons[relic?.effectType] || Sparkles;
                          const isEquipped = instance.isEquipped === 'true';

                          return (
                            <Card
                              key={instance.id}
                              className={`bg-gradient-to-br ${
                                isEquipped
                                  ? "from-green-900/40 to-emerald-900/40 border-green-400/50"
                                  : "from-indigo-900/40 to-purple-900/40 border-indigo-400/30"
                              } hover:border-purple-400/60 transition-all overflow-hidden`}
                              data-testid={`card-owned-relic-${instance.id}`}
                            >
                              {relic?.imageUrl && (
                                <div className="w-full h-48 relative overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-600">
                                  <img
                                    src={relic.imageUrl}
                                    alt={relic.name}
                                    className="w-full h-full object-cover"
                                    data-testid={`img-owned-relic-${instance.id}`}
                                  />
                                </div>
                              )}
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-white text-lg flex items-center gap-2">
                                      <ClassIcon className="w-5 h-5" />
                                      {relic?.name}
                                    </CardTitle>
                                    <CardDescription className="text-purple-200 mt-1">
                                      {relic?.description}
                                    </CardDescription>
                                  </div>
                                  <Badge className={`bg-gradient-to-r ${tierColors[relic?.tier] || tierColors.common} text-white`}>
                                    {relic?.tier}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center gap-2 text-purple-300 mb-3">
                                  <EffectIcon className="w-4 h-4" />
                                  <span className="text-sm">{relic?.effectDescription}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-purple-400 mb-4">
                                  <span>Level {instance.level}</span>
                                  <span>•</span>
                                  <span>Power: {instance.powerScore}</span>
                                </div>
                                {isEquipped ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => unequipMutation.mutate(instance.id)}
                                    disabled={unequipMutation.isPending}
                                    className="w-full"
                                    data-testid={`button-unequip-inventory-${instance.id}`}
                                  >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Unequip
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleEquip(instance.id)}
                                    disabled={equipMutation.isPending || (equippedRelics?.length || 0) >= 3}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                    data-testid={`button-equip-${instance.id}`}
                                  >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Equip
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Scroll className="w-20 h-20 text-indigo-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-3">No Relics Yet</h3>
                        <p className="text-indigo-200 mb-6">
                          Complete milestones or use the Forge to acquire your first relic
                        </p>
                        <Button 
                          onClick={() => setMainTab("catalog")}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                          data-testid="button-view-catalog"
                        >
                          View Catalog
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ForgeContent({ account }: { account: string }) {
  const { toast } = useToast();
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  
  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ["/api/forge/recipes"],
  });
  
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: [`/api/forge/inventory/${account}`],
    enabled: !!account,
  });
  
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: [`/api/forge/sessions/${account}`],
    enabled: !!account,
  });
  
  const craftMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      return await apiRequest("POST", "/api/forge/craft", {
        walletAddress: account,
        recipeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forge/sessions/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/forge/inventory/${account}`] });
      toast({
        title: "Crafting Started",
        description: "Your relic is being forged! Check back when it's ready.",
      });
      setSelectedRecipe(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Crafting Failed",
        description: error.message || "Failed to start crafting.",
      });
    },
  });
  
  const completeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest("POST", `/api/forge/complete/${sessionId}`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/forge/sessions/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/codex/relics/instances/${account}`] });
      if (data.success) {
        toast({
          title: "Crafting Successful!",
          description: `You've forged a ${data.relic.relic?.name || 'new relic'}!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Crafting Failed",
          description: "The forge attempt was unsuccessful. Better luck next time!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Completion Failed",
        description: error.message || "Failed to complete crafting.",
      });
    },
  });
  
  const activeSessions = sessions?.filter((s: any) => s.status === "in_progress") || [];
  const completedSessions = sessions?.filter((s: any) => s.status !== "in_progress") || [];
  
  const isSessionReady = (session: any) => {
    return new Date() >= new Date(session.completesAt);
  };
  
  return (
    <>
      {/* Active Crafting Sessions */}
      {activeSessions.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
              Active Forging
            </CardTitle>
            <CardDescription className="text-orange-200">
              Your relics are being forged
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSessions.map((session: any) => {
                const ready = isSessionReady(session);
                const timeLeft = Math.max(0, new Date(session.completesAt).getTime() - Date.now());
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                
                return (
                  <div
                    key={session.id}
                    className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold">Forging in Progress</h4>
                        <p className="text-orange-200 text-sm">
                          {ready ? (
                            <span className="text-green-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Ready to complete!
                            </span>
                          ) : (
                            <span>{minutes}m {seconds}s remaining</span>
                          )}
                        </p>
                      </div>
                      {ready && (
                        <Button
                          onClick={() => completeMutation.mutate(session.id)}
                          disabled={completeMutation.isPending}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          data-testid={`button-complete-${session.id}`}
                        >
                          Complete Forging
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Forge Recipes */}
      <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-400" />
            Forge Recipes
          </CardTitle>
          <CardDescription className="text-orange-200">
            Craft powerful relics using materials and CDX tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recipesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 bg-orange-800/30" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes?.map((recipe: any) => (
                <div
                  key={recipe.id}
                  className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-4 hover:border-orange-400/50 transition-colors"
                >
                  <h3 className="text-white font-bold text-lg mb-2">{recipe.name}</h3>
                  <p className="text-orange-200 text-sm mb-4">{recipe.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm">{recipe.cdxCost} CDX Required</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-300">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">{recipe.successRate}% Success Rate</span>
                    </div>
                  </div>
                  
                  {recipe.materials && (recipe.materials as any[]).length > 0 && (
                    <div className="mb-4">
                      <p className="text-orange-200 text-sm mb-2">Materials Required:</p>
                      <div className="space-y-1">
                        {(recipe.materials as any[]).map((mat: any, idx: number) => (
                          <div key={idx} className="text-orange-300 text-sm">
                            • {mat.quantity}x Material #{mat.materialId.slice(0, 8)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => craftMutation.mutate(recipe.id)}
                    disabled={craftMutation.isPending || activeSessions.length >= 3}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    data-testid={`button-craft-${recipe.id}`}
                  >
                    <Flame className="w-4 h-4 mr-2" />
                    Forge This Relic
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
