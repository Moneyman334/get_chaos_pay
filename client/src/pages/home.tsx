import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Coins, TrendingUp, Users, Star, ArrowRight, Shield, Zap, CheckCircle, 
  Award, Lock, Rocket, Bot, Wallet, ShoppingCart, Trophy, LineChart,
  Flame, Sparkles, Globe, Code, Layers, Activity, Target, Crown
} from "lucide-react";
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

  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI Trading Bot",
      description: "89% accuracy with 5 automated strategies",
      link: "/bot-dashboard",
      badge: "HOT"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "45% APY Staking",
      description: "Auto-compound every hour, zero effort",
      link: "/yield-farming",
      badge: "NEW"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Cross-Chain Bridge",
      description: "6 chains, instant transfers, 0.1% fee",
      link: "/bridge",
      badge: "LIVE"
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "NFT/Token Creator",
      description: "Launch collections in 5 clicks",
      link: "/nft-creator",
      badge: "EASY"
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: "Crypto Payments",
      description: "Accept 300+ cryptocurrencies",
      link: "/crypto-payments",
      badge: "INSTANT"
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: "DeFi Suite",
      description: "Flash loans, derivatives, yield aggregator",
      link: "/supreme-command",
      badge: "PRO"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Social Trading",
      description: "Copy top traders automatically",
      link: "/social-trading",
      badge: "SOCIAL"
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Token Launchpad",
      description: "ICO/IDO platform with vesting",
      link: "/token-launchpad",
      badge: "LAUNCH"
    }
  ];

  const stats = [
    { value: "55+", label: "Production Features", icon: <Layers className="h-6 w-6" /> },
    { value: "6", label: "Blockchain Networks", icon: <Globe className="h-6 w-6" /> },
    { value: "300+", label: "Cryptocurrencies", icon: <Coins className="h-6 w-6" /> },
    { value: "24/7", label: "Automated Trading", icon: <Activity className="h-6 w-6" /> }
  ];

  const platforms = [
    { name: "Multi-Chain Wallet", features: ["Portfolio tracking", "Asset management", "Multi-sig support"] },
    { name: "Trading & DeFi", features: ["AI bot", "Flash loans", "Derivatives", "Yield farming"] },
    { name: "NFT & Tokens", features: ["ERC-721/1155", "IPFS integration", "No-code creation"] },
    { name: "E-Commerce", features: ["Crypto payments", "Order management", "NFT receipts"] }
  ];

  return (
    <>
      <SEO 
        title="CODEX - The Dominant Blockchain Platform | 55+ Web3 Features"
        description="The most comprehensive Web3 ecosystem: AI trading bot, 45% APY staking, cross-chain bridge, NFT/token creators, crypto payments, DeFi suite, and 50+ more features in one platform."
        keywords={["blockchain platform", "web3 ecosystem", "crypto trading bot", "defi platform", "nft creator", "crypto payments", "yield farming", "cross-chain bridge", "token launchpad", "blockchain automation"]}
        canonicalUrl="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "CODEX - The Dominant Blockchain Platform",
          "description": "Comprehensive Web3 ecosystem with 55+ production features",
          "url": "/",
          "applicationCategory": "FinanceApplication",
          "offers": {
            "@type": "Offer",
            "category": "Blockchain Services",
            "description": "All-in-one Web3 platform for trading, DeFi, NFTs, and blockchain automation"
          }
        }}
      />
      
      <div className="relative overflow-hidden">
        {/* Cosmic Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <Badge className="px-6 py-2 text-lg bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black border-none font-bold animate-pulse" data-testid="hero-badge">
                <Crown className="inline h-5 w-5 mr-2" />
                THE DOMINANT BLOCKCHAIN PLATFORM
                <Sparkles className="inline h-5 w-5 ml-2" />
              </Badge>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
              CODEX
            </h1>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              55+ Web3 Features in One Unstoppable Platform
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8 leading-relaxed">
              AI-powered trading • 45% APY staking • Cross-chain bridge • NFT/Token creators • 
              Crypto payments • DeFi suite • Social trading • And 50+ more features
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-card/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4" data-testid={`stat-${index}`}>
                  <div className="text-purple-400 mb-2 flex justify-center">{stat.icon}</div>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isConnected ? (
                <Button 
                  size="lg" 
                  onClick={handleConnectWallet}
                  className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-bold"
                  data-testid="button-connect-wallet"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet & Start
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Link href="/empire">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-bold"
                    data-testid="button-enter-platform"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Enter CODEX
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              <Link href="/bot-dashboard">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-8 py-6 border-purple-500/50 hover:bg-purple-500/10"
                  data-testid="button-trading-bot"
                >
                  <Bot className="mr-2 h-5 w-5" />
                  Try AI Trading Bot
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-16 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-muted-foreground">Military-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-muted-foreground">Instant Execution</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="text-muted-foreground">Blockchain Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              <span className="text-muted-foreground">Production Ready</span>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Everything You Need, One Platform</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Stop juggling 10+ different Web3 apps. CODEX combines all essential blockchain features in one powerful interface.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Link key={index} href={feature.link}>
                  <Card className="h-full transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer bg-card/50 backdrop-blur-sm border-purple-500/20" data-testid={`feature-card-${index}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 text-purple-400">
                          {feature.icon}
                        </div>
                        {feature.badge && (
                          <Badge variant="secondary" className="text-xs font-bold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30">
                            {feature.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription className="text-sm">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="w-full" data-testid={`button-explore-${index}`}>
                        Explore <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Platform Categories */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Complete Web3 Ecosystem</h2>
              <p className="text-xl text-muted-foreground">Four powerful platforms, infinite possibilities</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {platforms.map((platform, index) => (
                <Card key={index} className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30" data-testid={`platform-card-${index}`}>
                  <CardHeader>
                    <CardTitle className="text-xl mb-2">{platform.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {platform.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Why CODEX */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Why CODEX Dominates</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built for the future of Web3, powered by cutting-edge technology
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30">
                <CardHeader>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl">All-in-One Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Why use 10 different platforms when CODEX has everything? Trading, DeFi, NFTs, payments - all seamlessly integrated.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
                <CardHeader>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Automation First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    AI trading bot, auto-compound staking, scheduled posts - let CODEX work for you 24/7 while you sleep.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border-cyan-500/30">
                <CardHeader>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Military-grade encryption, multi-sig wallets, blockchain verification - your assets are always protected.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mb-16 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-purple-500/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Join the Revolution</h2>
              <p className="text-muted-foreground">Thousands are already building their Web3 empire</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">$10M+</div>
                <div className="text-sm text-muted-foreground">Total Value Locked</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">50K+</div>
                <div className="text-sm text-muted-foreground">Transactions</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">15+</div>
                <div className="text-sm text-muted-foreground">Networks Supported</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12">
            <Flame className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Dominate Web3?</h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Connect your wallet and access 55+ premium features. No credit card required.
            </p>
            
            {!isConnected ? (
              <Button 
                size="lg"
                onClick={handleConnectWallet}
                className="text-lg px-10 py-6 bg-white text-purple-600 hover:bg-gray-100 font-bold"
                data-testid="button-cta-connect"
              >
                <Wallet className="mr-2 h-6 w-6" />
                Connect Wallet Now
                <Rocket className="ml-2 h-6 w-6" />
              </Button>
            ) : (
              <Link href="/empire">
                <Button 
                  size="lg"
                  className="text-lg px-10 py-6 bg-white text-purple-600 hover:bg-gray-100 font-bold"
                  data-testid="button-cta-enter"
                >
                  <Rocket className="mr-2 h-6 w-6" />
                  Launch CODEX Dashboard
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
