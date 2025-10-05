import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Coins, ImageIcon, Crown, Sparkles } from "lucide-react";

import leviathanImg from "@assets/ChatGPT Image Oct 4, 2025, 07_01_27 PM_1759626447603.png";
import tokensImg from "@assets/ChatGPT Image Oct 4, 2025, 07_05_30 PM_1759626460982.png";
import memoryScrollImg from "@assets/ChatGPT Image Oct 4, 2025, 07_08_56 PM_1759626564124.png";
import kaylinRelicImg from "@assets/ChatGPT Image Oct 4, 2025, 07_09_59 PM_1759626634333.png";
import masterCodexImg from "@assets/ChatGPT Image Oct 4, 2025, 07_10_45 PM_1759626672358.png";
import royalFlushImg from "@assets/ChatGPT Image Oct 4, 2025, 07_12_20 PM_1759626766204.png";
import chaosBtcImg from "@assets/ChatGPT Image Oct 4, 2025, 07_13_33 PM_1759626840208.png";
import omniverseImg from "@assets/ChatGPT Image Oct 4, 2025, 07_14_10 PM_1759626869271.png";

const tokens = [
  {
    id: 1,
    name: "The Leviathan Rises",
    symbol: "LEVIATHAN",
    description: "The Legacy Scroll has been awakened",
    image: leviathanImg,
    type: "Mythical",
    features: ["Profit Sharing", "Ancient Power", "Legacy Rewards"]
  },
  {
    id: 2,
    name: "BOOTY Token",
    symbol: "BOOTY",
    description: "Pirate treasure token for high-seas adventures",
    image: tokensImg,
    type: "Legendary",
    features: ["Treasure Sharing", "Raid Rewards"]
  },
  {
    id: 3,
    name: "GOD Token",
    symbol: "GOD",
    description: "Divine golden tree of prosperity",
    image: tokensImg,
    type: "Divine",
    features: ["Divine Dividends", "Growth Rewards"]
  },
  {
    id: 4,
    name: "CHAOS Token",
    symbol: "CHAOS",
    description: "Royal key to unlock chaos rewards",
    image: tokensImg,
    type: "Legendary",
    features: ["Chaos Staking", "Key Holder Benefits"]
  },
  {
    id: 5,
    name: "G.O.A.T. Token",
    symbol: "GOAT",
    description: "Greatest Of All Time - Number 1 token",
    image: tokensImg,
    type: "Elite",
    features: ["#1 Rewards", "Champion Benefits"]
  }
];

const nfts = [
  {
    id: 1,
    name: "The Memory of the Many",
    collection: "Wisdom Scrolls",
    description: "When he remembered this life, he remembered them all",
    image: memoryScrollImg,
    tier: "Eternal",
    traits: ["Infinite Memory", "Wisdom +∞", "All-Seeing"]
  },
  {
    id: 2,
    name: "Omniverse Syndicate",
    collection: "Syndicate Elite",
    description: "All-seeing eye of the Omniverse network",
    image: omniverseImg,
    tier: "Supreme",
    traits: ["Universal Access", "Circuit Power", "Divine Vision"]
  }
];

const relics = [
  {
    id: 1,
    name: "Kaylin the Lightkeeper",
    type: "Personal Relic",
    description: "One Love - Heart of light and guidance",
    image: kaylinRelicImg,
    power: "Lightkeeper's Grace",
    bonus: "+50% Love Energy"
  },
  {
    id: 2,
    name: "Master Codex Relic",
    type: "Chaoskey333 Relic",
    description: "Chaos Balance 333 - Master control relic",
    image: masterCodexImg,
    power: "Chaos Mastery",
    bonus: "333 Balance Points"
  },
  {
    id: 3,
    name: "Royal Flush VIP Relic",
    type: "Casino VIP",
    description: "Ultimate casino VIP pass - 1,000 Vault Chips",
    image: royalFlushImg,
    power: "Royal Status",
    bonus: "+1000 Vault Chips"
  },
  {
    id: 4,
    name: "Chaos BTC Relic",
    type: "Profit Tracker",
    description: "+0.10 BTC Profit - Forged by RW2GIYANSHPHE7BCHO4RW",
    image: chaosBtcImg,
    power: "Bitcoin Forge",
    bonus: "+0.10 BTC Profit"
  }
];

const medusaAssets = {
  token: {
    name: "Medusa Token",
    symbol: "MEDUSA",
    description: "Petrifying power token with stone-gaze rewards",
    type: "Mythical",
    features: ["Stone Staking", "Gaze Dividends", "Serpent Power"]
  },
  nft: {
    name: "Medusa's Gaze",
    collection: "Gorgon Elite",
    description: "Eyes that turn fortunes to stone",
    tier: "Mythical",
    traits: ["Petrifying Power", "Serpent Crown", "Stone Wealth"]
  },
  relic: {
    name: "Medusa's Crown",
    type: "Gorgon Relic",
    description: "Crown of serpents granting petrifying profits",
    power: "Gorgon's Curse",
    bonus: "+100% Stone Rewards"
  }
};

export default function PersonalCollection() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Crown className="h-10 w-10 text-yellow-500" />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Personal Empire Collection
            </h1>
            <p className="text-muted-foreground mt-1">
              Your exclusive tokens, NFTs, and relics from the Omniverse
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tokens" className="gap-2" data-testid="tab-tokens">
            <Coins className="h-4 w-4" />
            Tokens
          </TabsTrigger>
          <TabsTrigger value="nfts" className="gap-2" data-testid="tab-nfts">
            <ImageIcon className="h-4 w-4" />
            NFTs
          </TabsTrigger>
          <TabsTrigger value="relics" className="gap-2" data-testid="tab-relics">
            <Crown className="h-4 w-4" />
            Relics
          </TabsTrigger>
          <TabsTrigger value="medusa" className="gap-2" data-testid="tab-medusa">
            <Sparkles className="h-4 w-4" />
            Medusa Collection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <Card key={token.id} className="overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-token-${token.id}`}>
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                  <img 
                    src={token.image} 
                    alt={token.name}
                    className="w-full h-full object-cover"
                    data-testid={`img-token-${token.id}`}
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl" data-testid={`text-token-name-${token.id}`}>{token.name}</CardTitle>
                      <CardDescription data-testid={`text-token-symbol-${token.id}`}>${token.symbol}</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2" data-testid={`badge-token-type-${token.id}`}>{token.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-token-desc-${token.id}`}>
                    {token.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {token.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-token-feature-${token.id}-${idx}`}>
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nfts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <Card key={nft.id} className="overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-nft-${nft.id}`}>
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-yellow-500/20 to-purple-500/20">
                  <img 
                    src={nft.image} 
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    data-testid={`img-nft-${nft.id}`}
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl" data-testid={`text-nft-name-${nft.id}`}>{nft.name}</CardTitle>
                      <CardDescription data-testid={`text-nft-collection-${nft.id}`}>{nft.collection}</CardDescription>
                    </div>
                    <Badge className="ml-2 bg-yellow-500/20 text-yellow-600 border-yellow-500/50" data-testid={`badge-nft-tier-${nft.id}`}>
                      {nft.tier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-nft-desc-${nft.id}`}>
                    {nft.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {nft.traits.map((trait, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-nft-trait-${nft.id}-${idx}`}>
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="relics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relics.map((relic) => (
              <Card key={relic.id} className="overflow-hidden hover:shadow-xl transition-shadow border-2 border-purple-500/30" data-testid={`card-relic-${relic.id}`}>
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                  <img 
                    src={relic.image} 
                    alt={relic.name}
                    className="w-full h-full object-cover"
                    data-testid={`img-relic-${relic.id}`}
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl" data-testid={`text-relic-name-${relic.id}`}>{relic.name}</CardTitle>
                      <CardDescription data-testid={`text-relic-type-${relic.id}`}>{relic.type}</CardDescription>
                    </div>
                    <Crown className="h-6 w-6 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground" data-testid={`text-relic-desc-${relic.id}`}>
                    {relic.description}
                  </p>
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400" data-testid={`text-relic-power-label-${relic.id}`}>
                        Power:
                      </span>
                      <span className="text-sm font-bold" data-testid={`text-relic-power-${relic.id}`}>{relic.power}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400" data-testid={`text-relic-bonus-label-${relic.id}`}>
                        Bonus:
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400" data-testid={`text-relic-bonus-${relic.id}`}>
                        {relic.bonus}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="medusa" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-purple-500 bg-clip-text text-transparent mb-2">
              Medusa Collection
            </h2>
            <p className="text-muted-foreground">Mythical assets with petrifying power</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Medusa Token */}
            <Card className="overflow-hidden hover:shadow-xl transition-shadow border-2 border-green-500/30" data-testid="card-medusa-token">
              <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-green-500/30 to-purple-500/30 flex items-center justify-center">
                <div className="text-center p-6">
                  <Coins className="h-24 w-24 mx-auto mb-4 text-green-500" />
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">MEDUSA</h3>
                  <p className="text-sm text-muted-foreground mt-2">Token</p>
                </div>
              </div>
              <CardHeader>
                <CardTitle data-testid="text-medusa-token-name">{medusaAssets.token.name}</CardTitle>
                <CardDescription data-testid="text-medusa-token-symbol">${medusaAssets.token.symbol}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-medusa-token-desc">
                  {medusaAssets.token.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {medusaAssets.token.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-medusa-token-feature-${idx}`}>
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Medusa NFT */}
            <Card className="overflow-hidden hover:shadow-xl transition-shadow border-2 border-purple-500/30" data-testid="card-medusa-nft">
              <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-500/30 to-green-500/30 flex items-center justify-center">
                <div className="text-center p-6">
                  <ImageIcon className="h-24 w-24 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">GAZE</h3>
                  <p className="text-sm text-muted-foreground mt-2">NFT</p>
                </div>
              </div>
              <CardHeader>
                <CardTitle data-testid="text-medusa-nft-name">{medusaAssets.nft.name}</CardTitle>
                <CardDescription data-testid="text-medusa-nft-collection">{medusaAssets.nft.collection}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-medusa-nft-desc">
                  {medusaAssets.nft.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {medusaAssets.nft.traits.map((trait, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-medusa-nft-trait-${idx}`}>
                      {trait}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Medusa Relic */}
            <Card className="overflow-hidden hover:shadow-xl transition-shadow border-2 border-green-500/30" data-testid="card-medusa-relic">
              <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-green-500/30 to-purple-500/30 flex items-center justify-center">
                <div className="text-center p-6">
                  <Crown className="h-24 w-24 mx-auto mb-4 text-green-500" />
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">CROWN</h3>
                  <p className="text-sm text-muted-foreground mt-2">Relic</p>
                </div>
              </div>
              <CardHeader>
                <CardTitle data-testid="text-medusa-relic-name">{medusaAssets.relic.name}</CardTitle>
                <CardDescription data-testid="text-medusa-relic-type">{medusaAssets.relic.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground" data-testid="text-medusa-relic-desc">
                  {medusaAssets.relic.description}
                </p>
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Power:</span>
                    <span className="text-sm font-bold" data-testid="text-medusa-relic-power">{medusaAssets.relic.power}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Bonus:</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400" data-testid="text-medusa-relic-bonus">
                      {medusaAssets.relic.bonus}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
