import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  Rocket, 
  Code, 
  Shield, 
  Users, 
  Zap, 
  Crown, 
  Sparkles, 
  Trophy, 
  Gem,
  Scroll,
  Palette,
  DollarSign,
  TrendingUp,
  Gift
} from "lucide-react";
import medusaCartoon from "@assets/ChatGPT Image Oct 4, 2025, 07_32_25 PM_1759628419955.png";
import medusaCyborg from "@assets/ChatGPT Image Oct 4, 2025, 07_37_02 PM_1759628392270.png";
import medusaNeon from "@assets/Neon Cyborg Medusa in Glow_1759628441099.png";
import medusaPsychedelic from "@assets/ChatGPT Image Oct 4, 2025, 07_50_40 PM_1759629084543.png";

interface CasinoTokenConfig {
  name: string;
  symbol: string;
  initialSupply: string;
  decimals: string;
  network: string;
  features: string[];
}

interface CasinoNFTConfig {
  name: string;
  symbol: string;
  description: string;
  maxSupply: string;
  network: string;
  nftType: string;
  tier: string;
}

interface CasinoRelicConfig {
  name: string;
  description: string;
  relicClass: string;
  tier: string;
  effect: string;
  effectPower: string;
}

export default function CasinoTokenEcosystemPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("token");

  // Casino Token State
  const [tokenConfig, setTokenConfig] = useState<CasinoTokenConfig>({
    name: "",
    symbol: "",
    initialSupply: "100000000",
    decimals: "18",
    network: "ethereum",
    features: []
  });

  // Casino NFT State
  const [nftConfig, setNFTConfig] = useState<CasinoNFTConfig>({
    name: "",
    symbol: "",
    description: "",
    maxSupply: "10000",
    network: "ethereum",
    nftType: "vip-pass",
    tier: "gold"
  });

  // Casino Relic State
  const [relicConfig, setRelicConfig] = useState<CasinoRelicConfig>({
    name: "",
    description: "",
    relicClass: "fortune",
    tier: "rare",
    effect: "cashback",
    effectPower: "5"
  });

  const networks = [
    { id: "ethereum", name: "Ethereum Mainnet", chainId: "1", icon: "⟠" },
    { id: "polygon", name: "Polygon", chainId: "137", icon: "⬡" },
    { id: "bsc", name: "BSC", chainId: "56", icon: "🔶" },
    { id: "arbitrum", name: "Arbitrum", chainId: "42161", icon: "🔷" },
    { id: "base", name: "Base", chainId: "8453", icon: "🔵" },
  ];

  const casinoTokenFeatures = [
    { id: "dividends", label: "Profit Sharing", description: "Share casino profits with token holders", icon: DollarSign },
    { id: "burnable", label: "Burnable", description: "Reduce supply to increase token value", icon: Zap },
    { id: "staking", label: "Staking Rewards", description: "Earn rewards by staking tokens", icon: TrendingUp },
    { id: "vip-discount", label: "VIP Discounts", description: "Reduced fees for token holders", icon: Crown },
  ];

  const nftTypes = [
    { id: "vip-pass", name: "VIP Pass", description: "Exclusive access and benefits", icon: Crown },
    { id: "collectible", name: "Collectible Card", description: "Rare casino-themed NFTs", icon: Sparkles },
    { id: "achievement", name: "Achievement Badge", description: "Milestone rewards", icon: Trophy },
    { id: "lucky-charm", name: "Lucky Charm", description: "Boost your luck in games", icon: Gift },
  ];

  const nftTiers = [
    { id: "bronze", name: "Bronze", color: "bg-orange-700", benefits: "5% cashback" },
    { id: "silver", name: "Silver", color: "bg-gray-400", benefits: "10% cashback, priority support" },
    { id: "gold", name: "Gold", color: "bg-yellow-500", benefits: "15% cashback, free spins" },
    { id: "platinum", name: "Platinum", color: "bg-blue-400", benefits: "20% cashback, exclusive games" },
    { id: "diamond", name: "Diamond", color: "bg-purple-500", benefits: "25% cashback, VIP host, exclusive events" },
  ];

  const relicClasses = [
    { id: "fortune", name: "Fortune Relic", description: "Increase winning odds", icon: Coins },
    { id: "guardian", name: "Guardian Relic", description: "Reduce house edge", icon: Shield },
    { id: "prosperity", name: "Prosperity Relic", description: "Cashback bonuses", icon: Gem },
  ];

  const relicTiers = [
    { id: "common", name: "Common", power: "1x", color: "text-gray-400" },
    { id: "rare", name: "Rare", power: "2x", color: "text-blue-400" },
    { id: "epic", name: "Epic", power: "3x", color: "text-purple-400" },
    { id: "legendary", name: "Legendary", power: "5x", color: "text-yellow-400" },
  ];

  const medusaNFTCollection = [
    {
      id: "medusa-gold",
      name: "Golden Medusa VIP",
      image: medusaCartoon,
      tier: "gold",
      benefits: "15% cashback, free spins, exclusive games",
      description: "Transform your luck with the Golden Medusa's gaze"
    },
    {
      id: "medusa-cyborg",
      name: "Cyborg Medusa Elite",
      image: medusaCyborg,
      tier: "platinum",
      benefits: "20% cashback, exclusive games, priority support",
      description: "Advanced AI-powered fortune enhancement"
    },
    {
      id: "medusa-neon",
      name: "Neon Medusa Premium",
      image: medusaNeon,
      tier: "diamond",
      benefits: "25% cashback, VIP host, exclusive events",
      description: "Ultimate power with cybernetic precision"
    },
    {
      id: "medusa-psychedelic",
      name: "Cosmic Medusa Legend",
      image: medusaPsychedelic,
      tier: "diamond",
      benefits: "25% cashback, VIP host, exclusive events, bonus multipliers",
      description: "Transcendent luck from another dimension"
    }
  ];

  const medusaRelicCollection = [
    {
      id: "relic-medusa-fortune",
      name: "Medusa's Fortune Eye",
      image: medusaCartoon,
      relicClass: "fortune",
      tier: "epic",
      effect: "Winning odds boost",
      power: "+15%",
      description: "The gaze that turns bad luck to gold"
    },
    {
      id: "relic-medusa-cyborg",
      name: "Cyborg Medusa Core",
      image: medusaCyborg,
      relicClass: "guardian",
      tier: "legendary",
      effect: "House edge reduction",
      power: "-10%",
      description: "Mechanical precision shields against losses"
    },
    {
      id: "relic-medusa-neon",
      name: "Neon Serpent Charm",
      image: medusaNeon,
      relicClass: "prosperity",
      tier: "legendary",
      effect: "Cashback amplifier",
      power: "2.5x",
      description: "Radiant energy multiplies your returns"
    },
    {
      id: "relic-medusa-cosmic",
      name: "Cosmic Medusa Artifact",
      image: medusaPsychedelic,
      relicClass: "fortune",
      tier: "legendary",
      effect: "Jackpot probability",
      power: "+25%",
      description: "Universal forces align in your favor"
    }
  ];

  const toggleTokenFeature = (featureId: string) => {
    setTokenConfig(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const generateCasinoTokenContract = () => {
    const features = tokenConfig.features;
    const hasDividends = features.includes('dividends');
    const hasBurnable = features.includes('burnable');
    const hasStaking = features.includes('staking');
    const hasVipDiscount = features.includes('vip-discount');

    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
${hasBurnable ? 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";' : ''}
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${tokenConfig.symbol || 'CASINO'} is ERC20${hasBurnable ? ', ERC20Burnable' : ''}, Ownable {
    ${hasDividends ? `
    // Profit sharing variables
    uint256 public totalDividends;
    mapping(address => uint256) public lastDividendPoints;
    mapping(address => uint256) public unclaimedDividends;
    uint256 public dividendPointsPerShare;
    uint256 constant POINT_MULTIPLIER = 10**18;
    ` : ''}${hasStaking ? `
    // Staking variables
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingStartTime;
    uint256 public stakingRewardRate = 500; // 5% APY (500 basis points)
    ` : ''}${hasVipDiscount ? `
    // VIP discount tiers
    mapping(address => uint256) public vipTier; // 0 = none, 1-5 = bronze to diamond
    uint256[6] public vipDiscounts = [0, 5, 10, 15, 20, 25]; // Percentage discounts
    ` : ''}
    
    constructor(address initialOwner)
        ERC20("${tokenConfig.name || 'Casino Token'}", "${tokenConfig.symbol || 'CASINO'}")
        Ownable(initialOwner)
    {
        _mint(initialOwner, ${tokenConfig.initialSupply || '100000000'} * 10 ** decimals());
    }
    ${tokenConfig.decimals && tokenConfig.decimals !== '18' ? `
    function decimals() public view override returns (uint8) {
        return ${tokenConfig.decimals};
    }
    ` : ''}${hasDividends ? `
    // Distribute casino profits to token holders
    function distributeProfits() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
        totalDividends += msg.value;
        dividendPointsPerShare += (msg.value * POINT_MULTIPLIER) / totalSupply();
    }
    
    // Claim dividends
    function claimDividends() external {
        _settleDividends(msg.sender);
        uint256 owing = unclaimedDividends[msg.sender];
        require(owing > 0, "No dividends to claim");
        unclaimedDividends[msg.sender] = 0;
        payable(msg.sender).transfer(owing);
    }
    
    function dividendsOwing(address account) public view returns (uint256) {
        uint256 newDividendPoints = dividendPointsPerShare - lastDividendPoints[account];
        uint256 currentAccrual = (balanceOf(account) * newDividendPoints) / POINT_MULTIPLIER;
        return unclaimedDividends[account] + currentAccrual;
    }
    
    // Settle accrued dividends before balance changes
    function _settleDividends(address account) internal {
        if (account != address(0) && balanceOf(account) > 0) {
            uint256 newDividendPoints = dividendPointsPerShare - lastDividendPoints[account];
            uint256 accrued = (balanceOf(account) * newDividendPoints) / POINT_MULTIPLIER;
            if (accrued > 0) {
                unclaimedDividends[account] += accrued;
            }
        }
        lastDividendPoints[account] = dividendPointsPerShare;
    }
    
    // Override _update to settle dividends before transfers (prevents loss and double-claiming)
    function _update(address from, address to, uint256 value) internal override {
        // Settle any accrued dividends before balance changes
        _settleDividends(from);
        _settleDividends(to);
        super._update(from, to, value);
    }
    ` : ''}${hasStaking ? `
    // Stake tokens to earn rewards
    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Claim any pending rewards first
        if (stakedBalance[msg.sender] > 0) {
            claimStakingRewards();
        }
        
        stakedBalance[msg.sender] += amount;
        stakingStartTime[msg.sender] = block.timestamp;
        _transfer(msg.sender, address(this), amount);
    }
    
    function unstake(uint256 amount) external {
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        claimStakingRewards();
        stakedBalance[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount);
    }
    
    function claimStakingRewards() public {
        uint256 reward = calculateStakingRewards(msg.sender);
        if (reward > 0) {
            stakingStartTime[msg.sender] = block.timestamp;
            _mint(msg.sender, reward);
        }
    }
    
    function calculateStakingRewards(address account) public view returns (uint256) {
        if (stakedBalance[account] == 0) return 0;
        uint256 stakingDuration = block.timestamp - stakingStartTime[account];
        return (stakedBalance[account] * stakingRewardRate * stakingDuration) / (365 days * 10000);
    }
    ` : ''}${hasVipDiscount ? `
    // Set VIP tier for addresses (only owner)
    function setVIPTier(address account, uint256 tier) external onlyOwner {
        require(tier <= 5, "Invalid tier");
        vipTier[account] = tier;
    }
    
    // Get discount percentage for an address
    function getDiscount(address account) external view returns (uint256) {
        return vipDiscounts[vipTier[account]];
    }
    ` : ''}
}`;
  };

  const generateCasinoNFTContract = () => {
    const { nftType, tier } = nftConfig;
    const tierData = nftTiers.find(t => t.id === tier);

    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${nftConfig.symbol || 'CasinoNFT'} is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public maxSupply = ${nftConfig.maxSupply || '10000'};
    string private _baseTokenURI;
    
    // NFT Type: ${nftType}
    // Tier: ${tierData?.name}
    // Benefits: ${tierData?.benefits}
    
    mapping(uint256 => uint256) public nftTier; // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum, 5=Diamond
    mapping(uint256 => uint256) public cashbackRate; // Basis points (500 = 5%)
    
    constructor(address initialOwner)
        ERC721("${nftConfig.name || 'Casino VIP Pass'}", "${nftConfig.symbol || 'CVIP'}")
        Ownable(initialOwner)
    {
        _baseTokenURI = "ipfs://YOUR_CID/";
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function mint(address to, uint256 tier) public onlyOwner {
        require(_nextTokenId < maxSupply, "Max supply reached");
        require(tier >= 1 && tier <= 5, "Invalid tier");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        nftTier[tokenId] = tier;
        // Set cashback: Bronze=5%, Silver=10%, Gold=15%, Platinum=20%, Diamond=25%
        cashbackRate[tokenId] = tier * 500;
    }
    
    function batchMint(address to, uint256 quantity, uint256 tier) public onlyOwner {
        require(_nextTokenId + quantity <= maxSupply, "Exceeds max supply");
        for (uint256 i = 0; i < quantity; i++) {
            mint(to, tier);
        }
    }
    
    function getTierBenefits(uint256 tokenId) external view returns (uint256 tier, uint256 cashback) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return (nftTier[tokenId], cashbackRate[tokenId]);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Smart contract code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-casino-ecosystem-title">
            Casino Token Ecosystem
          </h1>
          <p className="text-muted-foreground">Create your casino cryptocurrency, NFTs, and relics</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="token" className="flex items-center gap-2" data-testid="tab-token">
            <Coins className="h-4 w-4" />
            Casino Token
          </TabsTrigger>
          <TabsTrigger value="nft" className="flex items-center gap-2" data-testid="tab-nft">
            <Palette className="h-4 w-4" />
            Casino NFTs
          </TabsTrigger>
          <TabsTrigger value="relic" className="flex items-center gap-2" data-testid="tab-relic">
            <Scroll className="h-4 w-4" />
            Casino Relics
          </TabsTrigger>
        </TabsList>

        {/* CASINO TOKEN TAB */}
        <TabsContent value="token">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Token Configuration</CardTitle>
                  <CardDescription>
                    Create your casino cryptocurrency with profit sharing and rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="casino-token-name">Token Name</Label>
                    <Input
                      id="casino-token-name"
                      placeholder="e.g., Royal Casino Token"
                      value={tokenConfig.name}
                      onChange={(e) => setTokenConfig({ ...tokenConfig, name: e.target.value })}
                      data-testid="input-casino-token-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="casino-token-symbol">Token Symbol</Label>
                    <Input
                      id="casino-token-symbol"
                      placeholder="e.g., ROYAL"
                      value={tokenConfig.symbol}
                      onChange={(e) => setTokenConfig({ ...tokenConfig, symbol: e.target.value.toUpperCase() })}
                      data-testid="input-casino-token-symbol"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="casino-initial-supply">Initial Supply</Label>
                    <Input
                      id="casino-initial-supply"
                      type="number"
                      placeholder="100000000"
                      value={tokenConfig.initialSupply}
                      onChange={(e) => setTokenConfig({ ...tokenConfig, initialSupply: e.target.value })}
                      data-testid="input-casino-initial-supply"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Deployment Network</Label>
                    <Select value={tokenConfig.network} onValueChange={(value) => setTokenConfig({ ...tokenConfig, network: value })}>
                      <SelectTrigger data-testid="select-casino-token-network">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {networks.map((network) => (
                          <SelectItem key={network.id} value={network.id}>
                            <div className="flex items-center gap-2">
                              <span>{network.icon}</span>
                              <span>{network.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Casino Features</CardTitle>
                  <CardDescription>
                    Special features for your casino token
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {casinoTokenFeatures.map((feature) => {
                    const Icon = feature.icon;
                    const isSelected = tokenConfig.features.includes(feature.id);
                    return (
                      <div
                        key={feature.id}
                        onClick={() => toggleTokenFeature(feature.id)}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        `}
                        data-testid={`casino-feature-${feature.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{feature.label}</h4>
                              {isSelected && <Badge>Selected</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Smart Contract Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Smart Contract Code
                  </CardTitle>
                  <CardDescription>
                    Casino-optimized ERC-20 with profit sharing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={generateCasinoTokenContract()}
                    readOnly
                    className="font-mono text-xs h-96"
                    data-testid="casino-token-contract-code"
                  />
                  <Button
                    onClick={() => copyToClipboard(generateCasinoTokenContract())}
                    variant="outline"
                    className="w-full"
                    data-testid="button-copy-casino-token-contract"
                  >
                    Copy Contract Code
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Deploy Your Casino Token
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm mb-4">
                    <li className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">1</Badge>
                      <span>Copy the smart contract code above</span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">2</Badge>
                      <span>Open <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">Remix IDE</a></span>
                    </li>
                    <li className="flex gap-3">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">3</Badge>
                      <span>Deploy on {networks.find(n => n.id === tokenConfig.network)?.name}</span>
                    </li>
                  </ol>
                  <Button className="w-full" data-testid="button-deploy-casino-token">
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy Casino Token
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* CASINO NFT TAB */}
        <TabsContent value="nft">
          {/* Medusa Collection Spotlight */}
          <Card className="mb-6 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Medusa Collection Spotlight
                  </CardTitle>
                  <CardDescription>Exclusive mythical NFTs with legendary benefits</CardDescription>
                </div>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/50">
                  Featured
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {medusaNFTCollection.map((nft) => {
                  const tierData = nftTiers.find(t => t.id === nft.tier);
                  return (
                    <Card 
                      key={nft.id} 
                      className="overflow-hidden border-2 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                      data-testid={`card-medusa-nft-${nft.id}`}
                    >
                      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                        <img 
                          src={nft.image} 
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          data-testid={`img-medusa-nft-${nft.id}`}
                        />
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm" data-testid={`text-medusa-nft-name-${nft.id}`}>
                            {nft.name}
                          </h4>
                          <Badge className={`${tierData?.color} text-white text-xs`}>
                            {tierData?.name}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground" data-testid={`text-medusa-nft-desc-${nft.id}`}>
                          {nft.description}
                        </p>
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs font-semibold text-purple-400" data-testid={`text-medusa-nft-benefits-${nft.id}`}>
                            {nft.benefits}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>NFT Configuration</CardTitle>
                  <CardDescription>
                    Create casino NFTs with VIP benefits and exclusive perks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="casino-nft-name">Collection Name</Label>
                    <Input
                      id="casino-nft-name"
                      placeholder="e.g., Royal Casino VIP Pass"
                      value={nftConfig.name}
                      onChange={(e) => setNFTConfig({ ...nftConfig, name: e.target.value })}
                      data-testid="input-casino-nft-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="casino-nft-symbol">Collection Symbol</Label>
                    <Input
                      id="casino-nft-symbol"
                      placeholder="e.g., RVIP"
                      value={nftConfig.symbol}
                      onChange={(e) => setNFTConfig({ ...nftConfig, symbol: e.target.value.toUpperCase() })}
                      data-testid="input-casino-nft-symbol"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="casino-nft-description">Description</Label>
                    <Textarea
                      id="casino-nft-description"
                      placeholder="Describe your casino NFT collection..."
                      value={nftConfig.description}
                      onChange={(e) => setNFTConfig({ ...nftConfig, description: e.target.value })}
                      data-testid="input-casino-nft-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="casino-nft-max-supply">Max Supply</Label>
                    <Input
                      id="casino-nft-max-supply"
                      type="number"
                      placeholder="10000"
                      value={nftConfig.maxSupply}
                      onChange={(e) => setNFTConfig({ ...nftConfig, maxSupply: e.target.value })}
                      data-testid="input-casino-nft-max-supply"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>NFT Type</CardTitle>
                  <CardDescription>Choose your casino NFT type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nftTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = nftConfig.nftType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setNFTConfig({ ...nftConfig, nftType: type.id })}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        `}
                        data-testid={`nft-type-${type.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{type.name}</h4>
                              {isSelected && <Badge>Selected</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>VIP Tier</CardTitle>
                  <CardDescription>Select the tier for your NFTs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nftTiers.map((tier) => {
                    const isSelected = nftConfig.tier === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setNFTConfig({ ...nftConfig, tier: tier.id })}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        `}
                        data-testid={`nft-tier-${tier.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-5 w-5 rounded-full ${tier.color} mt-0.5`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{tier.name}</h4>
                              {isSelected && <Badge>Selected</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{tier.benefits}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Smart Contract Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Smart Contract Code
                  </CardTitle>
                  <CardDescription>
                    Casino NFT with VIP tier benefits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={generateCasinoNFTContract()}
                    readOnly
                    className="font-mono text-xs h-96"
                    data-testid="casino-nft-contract-code"
                  />
                  <Button
                    onClick={() => copyToClipboard(generateCasinoNFTContract())}
                    variant="outline"
                    className="w-full"
                    data-testid="button-copy-casino-nft-contract"
                  >
                    Copy Contract Code
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>NFT Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg text-center">
                      <Crown className="h-16 w-16 mx-auto mb-4 text-primary" />
                      <h3 className="text-xl font-bold mb-2">{nftConfig.name || "Your Casino NFT"}</h3>
                      <Badge className={nftTiers.find(t => t.id === nftConfig.tier)?.color}>
                        {nftTiers.find(t => t.id === nftConfig.tier)?.name} Tier
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-4">
                        {nftTiers.find(t => t.id === nftConfig.tier)?.benefits}
                      </p>
                    </div>
                    <Button className="w-full" data-testid="button-deploy-casino-nft">
                      <Rocket className="mr-2 h-4 w-4" />
                      Deploy Casino NFT
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* CASINO RELIC TAB */}
        <TabsContent value="relic">
          {/* Medusa Relic Showcase */}
          <Card className="mb-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gem className="h-5 w-5 text-amber-400" />
                    Medusa Relic Collection
                  </CardTitle>
                  <CardDescription>Ancient artifacts of power and prosperity</CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/50">
                  Legendary
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {medusaRelicCollection.map((relic) => {
                  const tierData = relicTiers.find(t => t.id === relic.tier);
                  const classData = relicClasses.find(c => c.id === relic.relicClass);
                  const ClassIcon = classData?.icon || Gem;
                  return (
                    <Card 
                      key={relic.id} 
                      className="overflow-hidden border-2 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/20"
                      data-testid={`card-medusa-relic-${relic.id}`}
                    >
                      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                        <img 
                          src={relic.image} 
                          alt={relic.name}
                          className="w-full h-full object-cover"
                          data-testid={`img-medusa-relic-${relic.id}`}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className={`${tierData?.color} bg-black/50 backdrop-blur-sm`}>
                            {tierData?.name}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm" data-testid={`text-medusa-relic-name-${relic.id}`}>
                            {relic.name}
                          </h4>
                          <ClassIcon className="h-4 w-4 text-amber-400" />
                        </div>
                        <p className="text-xs text-muted-foreground" data-testid={`text-medusa-relic-desc-${relic.id}`}>
                          {relic.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-xs font-semibold text-amber-400" data-testid={`text-medusa-relic-effect-${relic.id}`}>
                            {relic.effect}
                          </span>
                          <Badge variant="outline" className="text-xs" data-testid={`badge-medusa-relic-power-${relic.id}`}>
                            {relic.power}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relic Configuration</CardTitle>
                  <CardDescription>
                    Create powerful relics that provide bonuses in casino games
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="relic-name">Relic Name</Label>
                    <Input
                      id="relic-name"
                      placeholder="e.g., Crown of Fortune"
                      value={relicConfig.name}
                      onChange={(e) => setRelicConfig({ ...relicConfig, name: e.target.value })}
                      data-testid="input-relic-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relic-description">Description</Label>
                    <Textarea
                      id="relic-description"
                      placeholder="Describe the relic's power..."
                      value={relicConfig.description}
                      onChange={(e) => setRelicConfig({ ...relicConfig, description: e.target.value })}
                      data-testid="input-relic-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relic-effect-power">Effect Power (%)</Label>
                    <Input
                      id="relic-effect-power"
                      type="number"
                      placeholder="5"
                      value={relicConfig.effectPower}
                      onChange={(e) => setRelicConfig({ ...relicConfig, effectPower: e.target.value })}
                      data-testid="input-relic-effect-power"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relic Class</CardTitle>
                  <CardDescription>Choose the relic's power type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relicClasses.map((relicClass) => {
                    const Icon = relicClass.icon;
                    const isSelected = relicConfig.relicClass === relicClass.id;
                    return (
                      <div
                        key={relicClass.id}
                        onClick={() => setRelicConfig({ ...relicConfig, relicClass: relicClass.id })}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        `}
                        data-testid={`relic-class-${relicClass.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{relicClass.name}</h4>
                              {isSelected && <Badge>Selected</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{relicClass.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relic Tier</CardTitle>
                  <CardDescription>Set the rarity and power level</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relicTiers.map((tier) => {
                    const isSelected = relicConfig.tier === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setRelicConfig({ ...relicConfig, tier: tier.id })}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        `}
                        data-testid={`relic-tier-${tier.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Sparkles className={`h-5 w-5 mt-0.5 ${tier.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-semibold ${tier.color}`}>{tier.name}</h4>
                              <Badge variant="outline">{tier.power}</Badge>
                            </div>
                            {isSelected && <Badge className="mt-2">Selected</Badge>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Relic Preview */}
            <div className="space-y-6">
              <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scroll className="h-5 w-5" />
                    Relic Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="relative p-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg border-2 border-purple-500/30">
                      <div className="text-center">
                        {relicConfig.relicClass === 'fortune' && <Coins className="h-24 w-24 mx-auto mb-4 text-yellow-500" />}
                        {relicConfig.relicClass === 'guardian' && <Shield className="h-24 w-24 mx-auto mb-4 text-blue-500" />}
                        {relicConfig.relicClass === 'prosperity' && <Gem className="h-24 w-24 mx-auto mb-4 text-purple-500" />}
                        
                        <h3 className="text-2xl font-bold mb-2">{relicConfig.name || "Unnamed Relic"}</h3>
                        
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Badge className={relicTiers.find(t => t.id === relicConfig.tier)?.color}>
                            {relicTiers.find(t => t.id === relicConfig.tier)?.name}
                          </Badge>
                          <Badge variant="outline">
                            {relicConfig.effectPower || 0}% Power
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground">
                          {relicConfig.description || "A mysterious relic imbued with casino power..."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Class:</span>
                        <span className="text-sm text-muted-foreground">
                          {relicClasses.find(c => c.id === relicConfig.relicClass)?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Tier:</span>
                        <span className={`text-sm font-semibold ${relicTiers.find(t => t.id === relicConfig.tier)?.color}`}>
                          {relicTiers.find(t => t.id === relicConfig.tier)?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Power Multiplier:</span>
                        <span className="text-sm font-semibold text-primary">
                          {relicTiers.find(t => t.id === relicConfig.tier)?.power}
                        </span>
                      </div>
                    </div>

                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-sm">Implementation Note</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Casino relics are typically implemented as soulbound NFTs (non-transferable) with on-chain metadata. 
                          They integrate with your casino smart contracts to provide bonuses, reduced house edge, or special features.
                          Use the CODEX Relics system as a reference implementation.
                        </p>
                      </CardContent>
                    </Card>

                    <Button className="w-full" data-testid="button-create-relic">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Relic
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
