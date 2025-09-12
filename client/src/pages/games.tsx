import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dice1, 
  Spade, 
  Target, 
  TrendingUp, 
  Users, 
  Search, 
  Filter,
  Star,
  Coins
} from "lucide-react";

const gameCategories = [
  { id: "all", label: "All Games", count: 24 },
  { id: "slots", label: "Slots", count: 12 },
  { id: "table", label: "Table Games", count: 8 },
  { id: "dice", label: "Dice Games", count: 4 }
];

const games = [
  {
    id: 1,
    name: "Crypto Slots Deluxe",
    category: "slots",
    minBet: "0.001 ETH",
    maxBet: "1 ETH",
    rtp: "96.5%",
    players: 234,
    rating: 4.8,
    description: "Classic slot machine with cryptocurrency themes and progressive jackpots",
    isNew: false,
    isHot: true
  },
  {
    id: 2,
    name: "Blockchain Blackjack",
    category: "table",
    minBet: "0.01 ETH",
    maxBet: "5 ETH",
    rtp: "99.4%",
    players: 89,
    rating: 4.9,
    description: "Provably fair blackjack with live dealers and instant payouts",
    isNew: false,
    isHot: false
  },
  {
    id: 3,
    name: "DeFi Dice Master",
    category: "dice",
    minBet: "0.005 ETH",
    maxBet: "2 ETH",
    rtp: "98.1%",
    players: 156,
    rating: 4.7,
    description: "Roll the dice and predict outcomes with customizable multipliers",
    isNew: true,
    isHot: true
  },
  {
    id: 4,
    name: "Ethereum Roulette",
    category: "table",
    minBet: "0.01 ETH",
    maxBet: "10 ETH",
    rtp: "97.3%",
    players: 67,
    rating: 4.6,
    description: "European roulette with transparent blockchain-based spinning",
    isNew: false,
    isHot: false
  },
  {
    id: 5,
    name: "Crypto Poker Championship",
    category: "table",
    minBet: "0.02 ETH",
    maxBet: "20 ETH",
    rtp: "98.9%",
    players: 45,
    rating: 4.9,
    description: "Texas Hold'em tournaments with guaranteed prize pools",
    isNew: true,
    isHot: true
  },
  {
    id: 6,
    name: "Lucky Seven Slots",
    category: "slots",
    minBet: "0.001 ETH",
    maxBet: "0.5 ETH",
    rtp: "95.8%",
    players: 189,
    rating: 4.5,
    description: "Traditional 7-symbol slot with bonus rounds and free spins",
    isNew: false,
    isHot: false
  }
];

export default function GamesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");

  const filteredGames = games.filter(game => {
    const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "rtp":
        return parseFloat(b.rtp) - parseFloat(a.rtp);
      case "players":
        return b.players - a.players;
      default: // popularity
        return b.players - a.players;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Casino Games
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose from our collection of provably fair cryptocurrency games. 
          All games are powered by smart contracts for complete transparency.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search games..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-games"
            />
          </div>
        </div>
        
        <div className="flex gap-4">
          <Select value={sortBy} onValueChange={setSortBy} data-testid="select-sort-games">
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="rtp">Best RTP</SelectItem>
              <SelectItem value="players">Most Players</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Game Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          {gameCategories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center gap-2"
              data-testid={`tab-${category.id}`}
            >
              {category.label}
              <Badge variant="secondary" className="text-xs">
                {category.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedGames.map((game) => (
              <Card key={game.id} className="transition-all hover:scale-105 cursor-pointer group" data-testid={`card-game-${game.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{game.name}</CardTitle>
                        {game.isNew && (
                          <Badge variant="default" className="text-xs" data-testid={`badge-new-${game.id}`}>
                            NEW
                          </Badge>
                        )}
                        {game.isHot && (
                          <Badge variant="destructive" className="text-xs" data-testid={`badge-hot-${game.id}`}>
                            🔥 HOT
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium" data-testid={`text-rating-${game.id}`}>
                          {game.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({game.players} players)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm" data-testid={`text-players-${game.id}`}>
                        {game.players}
                      </span>
                    </div>
                  </div>
                  
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Game Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Min Bet</p>
                      <p className="font-medium" data-testid={`text-min-bet-${game.id}`}>
                        {game.minBet}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Max Bet</p>
                      <p className="font-medium" data-testid={`text-max-bet-${game.id}`}>
                        {game.maxBet}
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
                    
                    <Badge variant="outline">
                      {game.category.charAt(0).toUpperCase() + game.category.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1" data-testid={`button-play-${game.id}`}>
                      <Coins className="mr-2 h-4 w-4" />
                      Play Now
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-demo-${game.id}`}>
                      Demo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {sortedGames.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No games found matching your criteria.
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                data-testid="button-reset-filters"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Game Statistics */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Dice1 className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold" data-testid="text-total-games">24</h3>
            <p className="text-sm text-muted-foreground">Total Games</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 text-accent mx-auto mb-2" />
            <h3 className="font-semibold" data-testid="text-active-players">1,247</h3>
            <p className="text-sm text-muted-foreground">Active Players</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold" data-testid="text-avg-rtp">96.8%</h3>
            <p className="text-sm text-muted-foreground">Average RTP</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="font-semibold" data-testid="text-total-wagered">$2.4M</h3>
            <p className="text-sm text-muted-foreground">Total Wagered</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}