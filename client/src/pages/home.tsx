import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, Users, Star, ArrowRight, Shield, Zap, CheckCircle, Award, Lock, Clock } from "lucide-react";
import { Link } from "wouter";
import { useWeb3 } from "@/hooks/use-web3";
import SEO from "@/components/seo";

export default function HomePage() {
  const { isConnected, connectWallet } = useWeb3();

  const handleConnectWallet = () => {
    if (!isConnected) {
      connectWallet();
    }
  };

  return (
    <>
      <SEO 
        title="Provably Fair Crypto Casino & Blockchain Gaming Platform"
        description="Experience the future of fair gaming with our provably fair cryptocurrency casino. Instant crypto payouts, transparent blockchain verification, slots, poker, dice games and more with ETH, BTC."
        keywords={["crypto casino home", "blockchain gaming platform", "provably fair crypto slots", "instant crypto payouts", "ethereum casino", "bitcoin gambling", "web3 gaming", "decentralized casino", "crypto gaming platform", "fair blockchain gambling"]}
        canonicalUrl="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Home - CryptoCasino",
          "description": "Experience the future of fair gaming with provably fair cryptocurrency games, instant payouts, and transparent blockchain verification.",
          "url": "/",
          "mainEntity": {
            "@type": "Organization",
            "name": "CryptoCasino",
            "description": "Provably fair cryptocurrency casino platform",
            "offers": {
              "@type": "Offer",
              "category": "Gaming Services",
              "description": "Cryptocurrency gambling with provably fair algorithms"
            }
          }
        }}
      />
      <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-block">
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-none font-bold animate-pulse" data-testid="new-badge">
            👑 CODEX OF THE CHAOS EMPIRE • EVOLUTION OF THE FUTURE 👑
          </Badge>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
          Chaos Empire
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
          The Ultimate Blockchain Empire Platform
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
          Multi-chain casino games • AI-powered Sentinel trading bot • Token & NFT creation • Player-owned liquidity •
          The future of decentralized gaming and finance, all in one unstoppable empire.
        </p>
        <div className="flex items-center justify-center gap-6 mb-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Provably Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Instant Payouts</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span>Blockchain Verified</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/empire">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold" data-testid="button-enter-empire">
              👑 Enter the Empire <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/games">
            <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-start-playing">
              Play Games
            </Button>
          </Link>
          {!isConnected && (
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={handleConnectWallet} data-testid="button-connect-wallet">
              <Coins className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
          {isConnected && (
            <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-wallet-connected">
              <CheckCircle className="mr-2 h-4 w-4" />
              Wallet Connected
            </Button>
          )}
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
          <Link href="/games">
            <Button variant="outline" data-testid="button-view-all-games">
              View All Games <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
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

      {/* Key Features */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Crypto Casino</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built on blockchain technology for the most transparent and fair gaming experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="gradient-border text-center">
            <div className="gradient-border-inner p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Provably Fair</h3>
              <p className="text-muted-foreground">
                Every game result is cryptographically verifiable. Check the fairness of any bet using our transparent algorithms.
              </p>
            </div>
          </Card>

          <Card className="gradient-border text-center">
            <div className="gradient-border-inner p-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Payouts</h3>
              <p className="text-muted-foreground">
                Win and withdraw immediately. No waiting periods, no delays. Your crypto is transferred instantly to your wallet.
              </p>
            </div>
          </Card>

          <Card className="gradient-border text-center">
            <div className="gradient-border-inner p-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground">
                Play anonymously with just your wallet. No personal information required. Your privacy is our priority.
              </p>
            </div>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="bg-card/50 rounded-lg p-8 border">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold mb-2">Trusted by Crypto Gamers Worldwide</h3>
            <p className="text-muted-foreground">Join thousands of players who trust our platform</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">Licensed</span>
              </div>
              <p className="text-xs text-muted-foreground">Regulated Gaming</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Audited</span>
              </div>
              <p className="text-xs text-muted-foreground">Smart Contracts</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">24/7</span>
              </div>
              <p className="text-xs text-muted-foreground">Live Support</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Encrypted</span>
              </div>
              <p className="text-xs text-muted-foreground">SSL Protected</p>
            </div>
          </div>
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
              Connect your MetaMask or other Web3 wallet. No registration required.
            </p>
          </div>
          <div className="space-y-4" data-testid="step-deposit">
            <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold">Fund & Play</h3>
            <p className="text-muted-foreground">
              Use ETH, MATIC, or other supported cryptocurrencies to play our games.
            </p>
          </div>
          <div className="space-y-4" data-testid="step-play">
            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold">Win & Withdraw</h3>
            <p className="text-muted-foreground">
              Enjoy instant payouts directly to your wallet. No delays, no hassle.
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}