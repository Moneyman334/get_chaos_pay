import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { 
  Dice1, 
  Spade, 
  Target, 
  TrendingUp, 
  Users, 
  Search, 
  Filter,
  Star,
  Coins,
  Play,
  Info,
  Shield,
  Zap,
  Crown,
  Video,
  Gamepad2,
  DollarSign,
  Eye,
  Timer,
  Award,
  Sparkles,
  Lock,
  ChevronRight
} from "lucide-react";

interface GameFeature {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Game {
  id: number;
  name: string;
  category: string;
  provider: string;
  minBet: string;
  maxBet: string;
  rtp: string;
  players: number;
  rating: number;
  description: string;
  longDescription: string;
  features: GameFeature[];
  isNew: boolean;
  isHot: boolean;
  isLive: boolean;
  hasJackpot: boolean;
  thumbnail: string;
  screenshots: string[];
  provablyFair: boolean;
  maxWin: string;
  volatility: "Low" | "Medium" | "High";
  theme: string;
  paylines?: number;
  gameType: string;
}

const gameCategories = [
  { id: "all", label: "All Games", count: 42, icon: Gamepad2 },
  { id: "slots", label: "Slots", count: 18, icon: Coins },
  { id: "table", label: "Table Games", count: 12, icon: Spade },
  { id: "live", label: "Live Casino", count: 8, icon: Video },
  { id: "originals", label: "Crypto Originals", count: 4, icon: Crown }
];

const games: Game[] = [
  {
    id: 1,
    name: "Crypto Slots Deluxe",
    category: "slots",
    provider: "Blockchain Studios",
    minBet: "0.001 ETH",
    maxBet: "1 ETH",
    rtp: "96.5%",
    players: 234,
    rating: 4.8,
    description: "Classic slot machine with cryptocurrency themes and progressive jackpots",
    longDescription: "Experience the ultimate crypto slot adventure with our flagship game. Features 5 reels, 25 paylines, and multiple bonus rounds including free spins, multipliers, and a progressive jackpot that grows with every spin across the network.",
    features: [
      { name: "Progressive Jackpot", icon: Crown },
      { name: "Free Spins", icon: Zap },
      { name: "Multipliers", icon: TrendingUp },
      { name: "Auto Play", icon: Play }
    ],
    isNew: false,
    isHot: true,
    isLive: false,
    hasJackpot: true,
    thumbnail: "🎰",
    screenshots: ["🎰", "💎", "🪙"],
    provablyFair: true,
    maxWin: "10,000x",
    volatility: "Medium",
    theme: "Cryptocurrency",
    paylines: 25,
    gameType: "Video Slot"
  },
  {
    id: 2,
    name: "Live Blockchain Blackjack",
    category: "live",
    provider: "Evolution Crypto",
    minBet: "0.01 ETH",
    maxBet: "5 ETH",
    rtp: "99.4%",
    players: 89,
    rating: 4.9,
    description: "Live dealer blackjack with real-time blockchain verification",
    longDescription: "Join our professional dealers for an authentic casino experience. Every card deal is recorded on the blockchain for ultimate transparency. Features side bets, insurance, and surrender options.",
    features: [
      { name: "Live Dealer", icon: Video },
      { name: "Side Bets", icon: DollarSign },
      { name: "Chat", icon: Users },
      { name: "HD Stream", icon: Eye }
    ],
    isNew: false,
    isHot: false,
    isLive: true,
    hasJackpot: false,
    thumbnail: "🃏",
    screenshots: ["🃏", "🎲", "💰"],
    provablyFair: true,
    maxWin: "Unlimited",
    volatility: "Low",
    theme: "Classic Casino",
    gameType: "Live Table Game"
  },
  {
    id: 3,
    name: "DeFi Dice Master",
    category: "originals",
    provider: "Crypto Casino",
    minBet: "0.005 ETH",
    maxBet: "2 ETH",
    rtp: "98.1%",
    players: 156,
    rating: 4.7,
    description: "Revolutionary dice game with DeFi yield farming integration",
    longDescription: "Our signature game combines traditional dice rolling with DeFi mechanics. Set your own odds, customize multipliers, and earn yield on your winning streaks. Smart contract handles all randomness generation.",
    features: [
      { name: "Custom Odds", icon: Target },
      { name: "DeFi Integration", icon: Sparkles },
      { name: "Yield Farming", icon: TrendingUp },
      { name: "Smart Contract", icon: Shield }
    ],
    isNew: true,
    isHot: true,
    isLive: false,
    hasJackpot: false,
    thumbnail: "🎲",
    screenshots: ["🎲", "⚡", "🌟"],
    provablyFair: true,
    maxWin: "100x",
    volatility: "High",
    theme: "DeFi",
    gameType: "Crypto Original"
  },
  {
    id: 4,
    name: "Ethereum Roulette Pro",
    category: "table",
    provider: "NetEnt Blockchain",
    minBet: "0.01 ETH",
    maxBet: "10 ETH",
    rtp: "97.3%",
    players: 67,
    rating: 4.6,
    description: "European roulette with blockchain-verified random number generation",
    longDescription: "Experience the classic casino game with modern blockchain technology. Features European wheel layout, extensive betting options, and complete transparency through smart contract verification.",
    features: [
      { name: "European Wheel", icon: Target },
      { name: "Call Bets", icon: Spade },
      { name: "Statistics", icon: TrendingUp },
      { name: "Quick Bet", icon: Zap }
    ],
    isNew: false,
    isHot: false,
    isLive: false,
    hasJackpot: false,
    thumbnail: "🎡",
    screenshots: ["🎡", "🔴", "⚫"],
    provablyFair: true,
    maxWin: "35x",
    volatility: "Medium",
    theme: "Classic Casino",
    gameType: "Table Game"
  },
  {
    id: 5,
    name: "Crypto Poker Championship",
    category: "table",
    provider: "PokerStars Crypto",
    minBet: "0.02 ETH",
    maxBet: "20 ETH",
    rtp: "98.9%",
    players: 45,
    rating: 4.9,
    description: "Texas Hold'em tournaments with guaranteed crypto prize pools",
    longDescription: "Join daily tournaments with guaranteed prize pools paid in cryptocurrency. Features multiple tournament formats, sit-and-go games, and cash tables with players from around the world.",
    features: [
      { name: "Tournaments", icon: Award },
      { name: "Cash Games", icon: DollarSign },
      { name: "Multi-table", icon: Users },
      { name: "Guaranteed Pools", icon: Shield }
    ],
    isNew: true,
    isHot: true,
    isLive: false,
    hasJackpot: false,
    thumbnail: "🃏",
    screenshots: ["🃏", "💰", "🏆"],
    provablyFair: true,
    maxWin: "Unlimited",
    volatility: "High",
    theme: "Poker",
    gameType: "Tournament"
  },
  {
    id: 6,
    name: "Lucky Seven Megaways",
    category: "slots",
    provider: "Big Time Gaming",
    minBet: "0.001 ETH",
    maxBet: "0.5 ETH",
    rtp: "95.8%",
    players: 189,
    rating: 4.5,
    description: "Classic symbols meet modern Megaways mechanics",
    longDescription: "Traditional lucky sevens slot reimagined with Megaways technology. Up to 117,649 ways to win with cascading reels, mystery symbols, and an explosive free spins bonus round.",
    features: [
      { name: "Megaways", icon: Sparkles },
      { name: "Cascading Reels", icon: Zap },
      { name: "Mystery Symbols", icon: Eye },
      { name: "Free Spins", icon: Play }
    ],
    isNew: false,
    isHot: false,
    isLive: false,
    hasJackpot: false,
    thumbnail: "7️⃣",
    screenshots: ["7️⃣", "💎", "🍀"],
    provablyFair: true,
    maxWin: "50,000x",
    volatility: "High",
    theme: "Classic",
    paylines: 117649,
    gameType: "Megaways Slot"
  },
  {
    id: 7,
    name: "Live Crypto Baccarat",
    category: "live",
    provider: "Evolution Crypto",
    minBet: "0.005 ETH",
    maxBet: "100 ETH",
    rtp: "98.9%",
    players: 124,
    rating: 4.7,
    description: "High-stakes baccarat with live dealers and VIP tables",
    longDescription: "The most elegant game in the casino, now available with live dealers streaming in HD. Choose from multiple table limits and enjoy the sophisticated atmosphere of this timeless classic.",
    features: [
      { name: "Live Dealer", icon: Video },
      { name: "VIP Tables", icon: Crown },
      { name: "Side Bets", icon: DollarSign },
      { name: "Roadmaps", icon: TrendingUp }
    ],
    isNew: false,
    isHot: true,
    isLive: true,
    hasJackpot: false,
    thumbnail: "🎴",
    screenshots: ["🎴", "👔", "💎"],
    provablyFair: true,
    maxWin: "Unlimited",
    volatility: "Low",
    theme: "Elegant",
    gameType: "Live Table Game"
  },
  {
    id: 8,
    name: "NFT Treasure Hunt",
    category: "originals",
    provider: "Crypto Casino",
    minBet: "0.01 ETH",
    maxBet: "5 ETH",
    rtp: "97.2%",
    players: 98,
    rating: 4.6,
    description: "Collect rare NFTs while playing our signature adventure game",
    longDescription: "Embark on a treasure hunting adventure where you can win actual NFTs. Each successful quest yields crypto rewards and a chance to mint exclusive collectible NFTs that can be traded on our marketplace.",
    features: [
      { name: "NFT Rewards", icon: Award },
      { name: "Adventure Mode", icon: Target },
      { name: "Collectibles", icon: Crown },
      { name: "Marketplace", icon: DollarSign }
    ],
    isNew: true,
    isHot: true,
    isLive: false,
    hasJackpot: false,
    thumbnail: "🗺️",
    screenshots: ["🗺️", "💎", "🏴‍☠️"],
    provablyFair: true,
    maxWin: "NFT + 1000x",
    volatility: "Medium",
    theme: "Adventure",
    gameType: "NFT Game"
  }
];

export default function GamesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [filterBy, setFilterBy] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  
  const { isConnected } = useWeb3();
  const { toast } = useToast();

  const filteredGames = games.filter(game => {
    const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.theme.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    switch (filterBy) {
      case "new":
        matchesFilter = game.isNew;
        break;
      case "hot":
        matchesFilter = game.isHot;
        break;
      case "live":
        matchesFilter = game.isLive;
        break;
      case "jackpot":
        matchesFilter = game.hasJackpot;
        break;
      case "provably-fair":
        matchesFilter = game.provablyFair;
        break;
      default:
        matchesFilter = true;
    }
    
    return matchesCategory && matchesSearch && matchesFilter;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "rtp":
        return parseFloat(b.rtp) - parseFloat(a.rtp);
      case "players":
        return b.players - a.players;
      case "name":
        return a.name.localeCompare(b.name);
      default: // popularity
        return b.players - a.players;
    }
  });

  const handlePlayGame = (game: Game) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to play games.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Game Loading",
        description: `Starting ${game.name}... (Demo mode)`,
      });
    }, 1500);
  };

  const VolatilityBadge = ({ volatility }: { volatility: string }) => {
    const colors = {
      Low: "bg-green-500/20 text-green-300 border-green-500/30",
      Medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", 
      High: "bg-red-500/20 text-red-300 border-red-500/30"
    };
    return (
      <Badge variant="outline" className={`text-xs ${colors[volatility as keyof typeof colors]}`}>
        {volatility}
      </Badge>
    );
  };

  const GameCard = ({ game }: { game: Game }) => (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
      {/* Thumbnail/Preview */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
          {game.thumbnail}
        </div>
        
        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {game.isNew && (
            <Badge className="bg-accent text-accent-foreground text-xs font-bold" data-testid={`badge-new-${game.id}`}>
              NEW
            </Badge>
          )}
          {game.isHot && (
            <Badge className="bg-destructive text-destructive-foreground text-xs font-bold animate-pulse" data-testid={`badge-hot-${game.id}`}>
              🔥 HOT
            </Badge>
          )}
          {game.isLive && (
            <Badge className="bg-green-600 text-white text-xs font-bold" data-testid={`badge-live-${game.id}`}>
              ● LIVE
            </Badge>
          )}
          {game.hasJackpot && (
            <Badge className="bg-yellow-600 text-white text-xs font-bold" data-testid={`badge-jackpot-${game.id}`}>
              💰 JACKPOT
            </Badge>
          )}
        </div>

        {/* Trust Indicator */}
        {game.provablyFair && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-primary/20 border-primary text-primary text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Provably Fair
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
              {game.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{game.provider}</p>
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm" data-testid={`text-players-${game.id}`}>
              {game.players}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium" data-testid={`text-rating-${game.id}`}>
              {game.rating}
            </span>
          </div>
          <VolatilityBadge volatility={game.volatility} />
          <Badge variant="outline" className="text-xs">
            {game.gameType}
          </Badge>
        </div>
        
        <CardDescription className="mt-2 line-clamp-2">
          {game.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Game Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Min/Max Bet</p>
            <p className="font-medium" data-testid={`text-bet-range-${game.id}`}>
              {game.minBet} - {game.maxBet}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Max Win</p>
            <p className="font-medium text-accent" data-testid={`text-max-win-${game.id}`}>
              {game.maxWin}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">RTP:</span>
            <span className="text-sm font-medium text-green-500" data-testid={`text-rtp-${game.id}`}>
              {game.rtp}
            </span>
          </div>
          
          <Badge variant="outline" className="capitalize">
            {game.category}
          </Badge>
        </div>

        {/* Game Features */}
        <div className="flex flex-wrap gap-1">
          {game.features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              <feature.icon className="w-3 h-3 mr-1" />
              {feature.name}
            </Badge>
          ))}
          {game.features.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{game.features.length - 3} more
            </Badge>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
            onClick={() => handlePlayGame(game)}
            disabled={isLoading}
            data-testid={`button-play-${game.id}`}
          >
            {isLoading ? (
              <>
                <Timer className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Play Now
              </>
            )}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedGame(game)}
                data-testid={`button-info-${game.id}`}
              >
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <GameDetailsModal game={game} />
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  const GameDetailsModal = ({ game }: { game: Game | null }) => {
    if (!game) return null;
    
    return (
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{game.thumbnail}</span>
            <div>
              <h2 className="text-2xl font-bold">{game.name}</h2>
              <p className="text-muted-foreground">{game.provider}</p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-base">
            {game.longDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Game Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Game Preview</h3>
            <div className="grid grid-cols-3 gap-2">
              {game.screenshots.map((screenshot, index) => (
                <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center text-2xl">
                  {screenshot}
                </div>
              ))}
            </div>
          </div>

          {/* Game Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Game Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium capitalize">{game.category}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Game Type</p>
                <p className="font-medium">{game.gameType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Theme</p>
                <p className="font-medium">{game.theme}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Volatility</p>
                <VolatilityBadge volatility={game.volatility} />
              </div>
              <div>
                <p className="text-muted-foreground">Min Bet</p>
                <p className="font-medium">{game.minBet}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max Bet</p>
                <p className="font-medium">{game.maxBet}</p>
              </div>
              <div>
                <p className="text-muted-foreground">RTP</p>
                <p className="font-medium text-green-500">{game.rtp}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max Win</p>
                <p className="font-medium text-accent">{game.maxWin}</p>
              </div>
              {game.paylines && (
                <div>
                  <p className="text-muted-foreground">Paylines</p>
                  <p className="font-medium">{game.paylines.toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Active Players</p>
                <p className="font-medium">{game.players}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Game Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {game.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <feature.icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{feature.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button 
            className="flex-1" 
            onClick={() => handlePlayGame(game)}
            disabled={isLoading}
            data-testid={`button-modal-play-${game.id}`}
          >
            <Play className="mr-2 h-4 w-4" />
            Play Now
          </Button>
          <Button variant="outline" data-testid={`button-modal-demo-${game.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Try Demo
          </Button>
        </div>
      </DialogContent>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="h-48 bg-muted animate-pulse" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Casino Games
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Experience the thrill of our professionally curated gaming collection. Every game is provably fair, 
          powered by blockchain technology, and designed for the ultimate crypto gaming experience.
        </p>
      </div>

      {/* Search and Advanced Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search games, providers, or themes..." 
            className="pl-10 h-12 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-games"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filterBy} onValueChange={setFilterBy} data-testid="select-filter-games">
            <SelectTrigger className="w-full sm:w-48 h-12">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="new">New Games</SelectItem>
              <SelectItem value="hot">Hot Games</SelectItem>
              <SelectItem value="live">Live Games</SelectItem>
              <SelectItem value="jackpot">Jackpot Games</SelectItem>
              <SelectItem value="provably-fair">Provably Fair</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy} data-testid="select-sort-games">
            <SelectTrigger className="w-full sm:w-48 h-12">
              <TrendingUp className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="rtp">Best RTP</SelectItem>
              <SelectItem value="players">Most Players</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Game Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1">
          {gameCategories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center gap-2 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid={`tab-${category.id}`}
            >
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.label.split(' ')[0]}</span>
              <Badge variant={selectedCategory === category.id ? "secondary" : "outline"} className="text-xs">
                {category.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-8">
          {/* Results Summary */}
          {sortedGames.length > 0 && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground" data-testid="text-results-count">
                Showing {sortedGames.length} of {games.length} games
                {searchQuery && ` for "${searchQuery}"`}
                {filterBy !== "all" && ` (${filterBy} filter)`}
              </p>
              
              {(searchQuery || filterBy !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterBy("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Games Grid */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : sortedGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-6">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No games found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any games matching your criteria. Try adjusting your search or filters.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setFilterBy("all");
                  }}
                  data-testid="button-reset-filters"
                >
                  Reset All Filters
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setSelectedCategory("all")}
                  data-testid="button-view-all"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  View All Games
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Featured Stats */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-1" data-testid="text-total-games">
              {games.length}+
            </h3>
            <p className="text-sm text-muted-foreground">Premium Games</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-1" data-testid="text-active-players">
              {games.reduce((sum, game) => sum + game.players, 0).toLocaleString()}
            </h3>
            <p className="text-sm text-muted-foreground">Active Players</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-1" data-testid="text-avg-rtp">
              {(games.reduce((sum, game) => sum + parseFloat(game.rtp), 0) / games.length).toFixed(1)}%
            </h3>
            <p className="text-sm text-muted-foreground">Average RTP</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold mb-1" data-testid="text-provably-fair">
              100%
            </h3>
            <p className="text-sm text-muted-foreground">Provably Fair</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}