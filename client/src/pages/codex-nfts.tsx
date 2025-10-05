import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Image, 
  Sparkles, 
  Wallet,
  TrendingUp,
  Zap,
  Shield,
  Star
} from "lucide-react";
import { Link } from "wouter";

interface NftCollection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  type: string;
  totalSupply: string;
  maxSupply: string;
  isDynamic: boolean;
  isTransferable: boolean;
}

interface UserNft {
  id: string;
  name: string;
  image?: string;
  rarity: string;
  level?: number;
  experience?: number;
  powerScore?: number;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export default function CodexNftsPage() {
  const { account, isConnected } = useWeb3();

  const { data: collections, isLoading: collectionsLoading } = useQuery<NftCollection[]>({
    queryKey: ["/api/codex/nft-collections"],
    enabled: true,
  });

  const { data: userNfts, isLoading: nftsLoading } = useQuery<UserNft[]>({
    queryKey: [`/api/codex/nfts/${account}`],
    enabled: isConnected && !!account,
  });

  const formatNumber = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case "legendary":
        return "from-yellow-500 to-orange-600";
      case "epic":
        return "from-purple-500 to-pink-600";
      case "rare":
        return "from-blue-500 to-cyan-600";
      case "uncommon":
        return "from-green-500 to-emerald-600";
      default:
        return "from-gray-500 to-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 dark:from-gray-900 dark:via-purple-950 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              CODEX NFT Collections
            </h1>
            <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
          </div>
          <p className="text-xl text-purple-200 dark:text-purple-300">
            Explore Dynamic AI-Powered NFTs That Evolve With Your Journey
          </p>
        </div>

        {!isConnected ? (
          <Card className="mb-8 bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-900/30 dark:to-red-900/30 border-orange-400/30">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wallet className="w-20 h-20 text-orange-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
                <p className="text-orange-200 dark:text-orange-300 mb-6 max-w-md mx-auto">
                  Connect your wallet to view NFT collections and your owned NFTs.
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
        ) : null}

        <Card className="mb-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Image className="w-6 h-6 text-purple-400" />
              NFT Collections
            </CardTitle>
            <CardDescription className="text-purple-200 dark:text-purple-300">
              Explore all available CODEX NFT collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collectionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-64 bg-purple-800/30" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {collections?.map((collection: any) => (
                  <Card
                    key={collection.id}
                    className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 dark:from-purple-950/60 dark:to-indigo-950/60 border-purple-400/30 hover:border-purple-400/60 transition-all"
                    data-testid={`card-collection-${collection.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-white">{collection.name}</CardTitle>
                        <Badge className={`bg-gradient-to-r ${collection.isDynamic ? 'from-purple-500 to-pink-600' : 'from-gray-500 to-slate-600'} text-white`}>
                          {collection.isDynamic ? "Dynamic" : "Static"}
                        </Badge>
                      </div>
                      <CardDescription className="text-purple-300">
                        {collection.symbol} • {collection.type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-purple-200 mb-4">{collection.description}</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-400/20">
                          <p className="text-xs text-purple-400 mb-1">Total Supply</p>
                          <p className="text-lg font-bold text-white" data-testid={`text-total-supply-${collection.id}`}>
                            {formatNumber(collection.totalSupply)}
                          </p>
                        </div>
                        <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-400/20">
                          <p className="text-xs text-purple-400 mb-1">Max Supply</p>
                          <p className="text-lg font-bold text-white" data-testid={`text-max-supply-${collection.id}`}>
                            {formatNumber(collection.maxSupply)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="border-purple-400 text-purple-200">
                          {collection.isTransferable ? "Transferable" : "Soulbound"}
                        </Badge>
                        {collection.isDynamic && (
                          <Badge variant="outline" className="border-pink-400 text-pink-200">
                            <Zap className="w-3 h-3 mr-1" />
                            AI-Powered
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Star className="w-6 h-6 text-blue-400" />
                Your NFTs
              </CardTitle>
              <CardDescription className="text-blue-200 dark:text-blue-300">
                Your owned CODEX NFT collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nftsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-96 bg-blue-800/30" />
                  ))}
                </div>
              ) : userNfts && userNfts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {userNfts.map((nft: any) => (
                    <Card
                      key={nft.id}
                      className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 dark:from-blue-950/60 dark:to-cyan-950/60 border-blue-400/30 hover:border-blue-400/60 transition-all overflow-hidden"
                      data-testid={`card-nft-${nft.id}`}
                    >
                      <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        {nft.image ? (
                          <img 
                            src={nft.image} 
                            alt={nft.name} 
                            className="w-full h-full object-cover"
                            data-testid={`img-nft-${nft.id}`}
                          />
                        ) : (
                          <Image className="w-20 h-20 text-white/50" />
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className={`bg-gradient-to-r ${getRarityColor(nft.rarity)} text-white`}>
                            {nft.rarity}
                          </Badge>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-white text-lg" data-testid={`text-nft-name-${nft.id}`}>
                          {nft.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-300">Level</span>
                            <span className="font-bold text-white" data-testid={`text-level-${nft.id}`}>
                              {nft.level || 1}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-blue-300">Experience</span>
                              <span className="text-xs text-blue-400" data-testid={`text-experience-${nft.id}`}>
                                {nft.experience || 0} XP
                              </span>
                            </div>
                            <Progress value={((nft.experience || 0) % 1000) / 10} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-300">Power Score</span>
                            <span className="font-bold text-yellow-400" data-testid={`text-power-${nft.id}`}>
                              <Zap className="w-4 h-4 inline mr-1" />
                              {nft.powerScore || 0}
                            </span>
                          </div>
                          {nft.attributes && nft.attributes.length > 0 && (
                            <div className="pt-2 border-t border-blue-400/20">
                              <p className="text-xs text-blue-300 mb-2">Attributes</p>
                              <div className="flex flex-wrap gap-1">
                                {nft.attributes.slice(0, 3).map((attr: any, idx: number) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="text-xs border-blue-400 text-blue-200"
                                    data-testid={`badge-attribute-${nft.id}-${idx}`}
                                  >
                                    {attr.trait_type}: {attr.value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
                  <p className="text-blue-200 dark:text-blue-300">
                    You don't own any CODEX NFTs yet
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
