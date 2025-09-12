import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, Users, Star, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-block">
          <Badge variant="secondary" className="mb-4" data-testid="new-badge">
            🎰 New Platform
          </Badge>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome to Crypto Casino
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Experience the future of gaming with cryptocurrency-powered casino games. 
          Fair play, instant payouts, and transparent blockchain technology.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" data-testid="button-start-playing">
            Start Playing <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" data-testid="button-learn-more">
            Learn More
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="gradient-border">
          <div className="gradient-border-inner p-6">
            <div className="flex items-center justify-between mb-2">
              <Coins className="h-8 w-8 text-primary" />
              <Badge variant="secondary" data-testid="badge-total-volume">Live</Badge>
            </div>
            <h3 className="text-2xl font-bold" data-testid="text-total-volume">$2.4M+</h3>
            <p className="text-muted-foreground">Total Volume</p>
          </div>
        </Card>

        <Card className="gradient-border">
          <div className="gradient-border-inner p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-accent" />
              <Badge variant="secondary" data-testid="badge-active-players">24h</Badge>
            </div>
            <h3 className="text-2xl font-bold" data-testid="text-active-players">1,247</h3>
            <p className="text-muted-foreground">Active Players</p>
          </div>
        </Card>

        <Card className="gradient-border">
          <div className="gradient-border-inner p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <Badge variant="secondary" data-testid="badge-win-rate">Avg</Badge>
            </div>
            <h3 className="text-2xl font-bold" data-testid="text-win-rate">96.5%</h3>
            <p className="text-muted-foreground">Return Rate</p>
          </div>
        </Card>
      </div>

      {/* Featured Games Preview */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Games</h2>
            <p className="text-muted-foreground">Try our most popular cryptocurrency games</p>
          </div>
          <Button variant="outline" data-testid="button-view-all-games">
            View All Games <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "Crypto Slots", description: "Spin to win with various cryptocurrencies", rating: 4.8 },
            { name: "Blockchain Poker", description: "Texas Hold'em with provably fair dealing", rating: 4.9 },
            { name: "DeFi Dice", description: "Classic dice game with smart contract odds", rating: 4.7 }
          ].map((game, index) => (
            <Card key={index} className="transition-all hover:scale-105 cursor-pointer" data-testid={`card-game-${index}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{game.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-muted-foreground" data-testid={`text-rating-${index}`}>
                      {game.rating}
                    </span>
                  </div>
                </div>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" data-testid={`button-play-${index}`}>
                  Play Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4" data-testid="step-connect">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold">Connect Wallet</h3>
            <p className="text-muted-foreground">
              Connect your MetaMask or other Web3 wallet to get started
            </p>
          </div>
          <div className="space-y-4" data-testid="step-deposit">
            <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold">Fund Your Account</h3>
            <p className="text-muted-foreground">
              Deposit ETH, MATIC, or other supported cryptocurrencies
            </p>
          </div>
          <div className="space-y-4" data-testid="step-play">
            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold">Start Playing</h3>
            <p className="text-muted-foreground">
              Choose from various games and start winning cryptocurrencies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}