import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWeb3 } from "@/hooks/use-web3";
import { getNetworkGroup } from "@/lib/web3";
import { 
  Wallet, 
  Home, 
  Gamepad2, 
  Menu,
  Coins,
  Network,
  AlertTriangle,
  CheckCircle2,
  Palette,
  ArrowDownToLine,
  Sparkles,
  Image,
  Bot,
  Crown,
  Trophy,
  Zap,
  Twitter,
  BarChart3,
  Activity,
  TrendingUp,
  Settings,
  ShoppingCart,
  ShoppingBag,
  Package,
  Lock,
  Target,
  Scroll
} from "lucide-react";

interface NavigationProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const navigationItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/empire", label: "Empire", icon: Crown, featured: true },
  { path: "/command-center", label: "Command Center", icon: Activity, featured: true },
  { path: "/codex-dashboard", label: "CODEX Dashboard", icon: Coins, featured: true },
  { path: "/codex-staking", label: "CODEX Staking", icon: Lock, featured: true },
  { path: "/codex-nfts", label: "CODEX NFTs", icon: Sparkles, featured: true },
  { path: "/codex-achievements", label: "CODEX Achievements", icon: Target, featured: true },
  { path: "/codex-relics", label: "CODEX Relics", icon: Scroll, featured: true },
  { path: "/wallet-nexus", label: "Wallet Nexus", icon: Network, featured: true },
  { path: "/trade", label: "Trade Crypto", icon: TrendingUp, featured: true },
  { path: "/products", label: "Shop", icon: ShoppingBag, featured: true },
  { path: "/cart", label: "Cart", icon: ShoppingCart },
  { path: "/orders", label: "Orders", icon: Package },
  { path: "/auto-trading-bot", label: "Auto Trading Bot", icon: Bot, featured: true },
  { path: "/auto-compound", label: "Auto-Compound", icon: Zap, featured: true },
  { path: "/vaults", label: "House Vaults", icon: Trophy },
  { path: "/sentinel-bot", label: "Sentinel Bot", icon: Bot },
  { path: "/social-automation", label: "Social Automation", icon: Twitter },
  { path: "/marketing-overview", label: "Marketing Overview", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings, featured: true },
  { path: "/games", label: "Games", icon: Gamepad2 },
  { path: "/wallet", label: "Wallet", icon: Wallet },
  { path: "/deposits", label: "Deposits", icon: ArrowDownToLine },
  { path: "/crypto-payments", label: "All Crypto", icon: Coins },
  { path: "/token-creator", label: "Create Token", icon: Sparkles },
  { path: "/nft-creator", label: "Create NFT", icon: Image },
  { path: "/auto-deploy", label: "Auto-Deploy", icon: Zap, featured: true },
  { path: "/nfts", label: "NFT Gallery", icon: Palette }
];

export default function Navigation({ onConnect, onDisconnect }: NavigationProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { 
    isConnected,
    isCheckingConnection,
    account, 
    balance, 
    network, 
    switchNetwork,
    getAvailableNetworks,
    getCurrentNetworkInfo,
    isCurrentNetworkSupported
  } = useWeb3();

  const handleNetworkChange = (chainId: string) => {
    switchNetwork(chainId);
  };
  
  // Organize networks by groups
  const networkGroups = useMemo(() => {
    const allNetworks = getAvailableNetworks();
    const groups: Record<string, any[]> = {};
    
    allNetworks.forEach(network => {
      const group = getNetworkGroup(network);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(network);
    });
    
    return groups;
  }, [getAvailableNetworks]);
  
  const currentNetworkInfo = getCurrentNetworkInfo();
  const isSupported = isCurrentNetworkSupported();

  const isActivePath = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  const formatBalance = (balance: string | null | undefined) => {
    if (!balance || balance === "0" || isNaN(parseFloat(balance))) return "0.000";
    const numBalance = parseFloat(balance);
    return isNaN(numBalance) ? "0.000" : numBalance.toFixed(3);
  };

  const formatAddress = (address: string | null | undefined) => {
    if (!address || address.length < 10) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const NavLinks = ({ mobile = false }) => (
    <div className={`${mobile ? 'flex flex-col space-y-4' : 'flex items-center space-x-8'}`}>
      {navigationItems.map(({ path, label, icon: Icon, featured }) => (
        <Link 
          key={path}
          href={path}
          onClick={() => mobile && setIsMobileMenuOpen(false)}
          data-testid={`nav-link-${label.toLowerCase()}`}
        >
          <div className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300
            ${isActivePath(path) 
              ? featured 
                ? 'bg-gradient-to-r from-primary to-accent text-white font-medium shadow-lg shadow-primary/30' 
                : 'bg-primary/20 text-primary font-medium border border-primary/50' 
              : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground hover:border-primary/30 border border-transparent'
            }
            ${mobile ? 'text-lg' : 'text-sm'}
            ${featured && !isActivePath(path) ? 'hover:shadow-lg hover:shadow-primary/20' : ''}
          `}>
            <Icon className={`${mobile ? 'h-5 w-5' : 'h-4 w-4'} ${isActivePath(path) && featured ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : ''}`} />
            <span>{label}</span>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-primary/5 holographic">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" data-testid="nav-brand">
            <div className="flex items-center space-x-3 hover:scale-105 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-purple-500 to-accent rounded-xl flex items-center justify-center glow-primary animate-float divine-glow">
                <Coins className="text-white h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  Crypto Casino
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">
                  Provably Fair Gaming
                </p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block max-w-2xl overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <NavLinks />
          </nav>

          {/* Connection Info & Controls */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                {isConnected && network?.icon && (
                  <span className="text-base" title={network.name}>{network.icon}</span>
                )}
                <span 
                  className={`status-dot ${
                    isCheckingConnection
                      ? 'status-warning animate-pulse'
                      : isConnected 
                        ? isSupported 
                          ? 'status-connected' 
                          : 'status-warning'
                        : 'status-disconnected'
                  }`}
                  data-testid="nav-connection-status-dot"
                />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs" data-testid="nav-connection-status-text">
                    {isCheckingConnection
                      ? 'Checking...'
                      : isConnected 
                        ? `${network?.name || 'Unknown'}` 
                        : 'Disconnected'
                    }
                  </span>
                  {isConnected && (
                    <div className="flex items-center space-x-1">
                      {network?.chainType && (
                        <Badge 
                          variant={network.chainType === 'L2' ? 'secondary' : 'outline'} 
                          className="text-xs h-4 px-1"
                        >
                          {network.chainType}
                        </Badge>
                      )}
                      {!isSupported && (
                        <Badge variant="destructive" className="text-xs h-4 px-1">
                          <AlertTriangle className="w-2 h-2 mr-1" />
                          Unsupported
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Network Selector */}
              {isConnected && (
                <Select 
                  onValueChange={handleNetworkChange} 
                  data-testid="nav-network-select"
                  value={currentNetworkInfo?.chainId || ''}
                >
                  <SelectTrigger className="w-48 h-9">
                    <div className="flex items-center space-x-2">
                      {currentNetworkInfo?.icon && (
                        <span className="text-sm">{currentNetworkInfo.icon}</span>
                      )}
                      <Network className="h-4 w-4" />
                    </div>
                    <SelectValue placeholder="Select Network" />
                  </SelectTrigger>
                  <SelectContent className="w-64">
                    {Object.entries(networkGroups).map(([groupName, networks]) => (
                      <div key={groupName}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {groupName}
                        </div>
                        {networks.map((network) => (
                          <SelectItem 
                            key={network.chainId} 
                            value={network.chainId}
                            className="pl-4"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">{network.icon}</span>
                                <span>{network.name}</span>
                                {network.isTestnet && (
                                  <Badge variant="outline" className="text-xs h-4 px-1">
                                    Test
                                  </Badge>
                                )}
                                <Badge 
                                  variant={network.chainType === 'L2' ? 'secondary' : 'outline'}
                                  className="text-xs h-4 px-1"
                                >
                                  {network.chainType}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {network.symbol}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        <Separator className="my-1" />
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium" data-testid="nav-wallet-balance">
                      {formatBalance(balance)} {network?.symbol || 'ETH'}
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="nav-wallet-address">
                      {formatAddress(account)}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onDisconnect}
                    data-testid="nav-button-disconnect"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={onConnect}
                  size="sm"
                  disabled={isCheckingConnection}
                  data-testid="nav-button-connect"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {isCheckingConnection ? 'Checking...' : 'Connect Wallet'}
                </Button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden" data-testid="nav-mobile-menu-toggle">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="mt-8">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                      <Coins className="text-primary-foreground h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Crypto Casino
                      </h1>
                      <p className="text-xs text-muted-foreground">
                        Provably Fair Gaming
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Mobile Navigation */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                        Navigation
                      </h3>
                      <NavLinks mobile />
                    </div>

                    {/* Mobile Connection Info */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                        Wallet
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {isConnected && network?.icon && (
                              <span className="text-base">{network.icon}</span>
                            )}
                            <span 
                              className={`status-dot ${
                                isConnected 
                                  ? isSupported 
                                    ? 'status-connected' 
                                    : 'status-warning'
                                  : 'status-disconnected'
                              }`}
                              data-testid="nav-mobile-connection-status-dot"
                            />
                            <span className="text-sm" data-testid="nav-mobile-connection-status-text">
                              {isConnected ? `Connected to ${network?.name || 'Unknown'}` : 'Disconnected'}
                            </span>
                          </div>
                          {isConnected && (
                            <div className="flex items-center space-x-2 ml-6">
                              {network?.chainType && (
                                <Badge 
                                  variant={network.chainType === 'L2' ? 'secondary' : 'outline'} 
                                  className="text-xs h-4 px-1"
                                >
                                  {network.chainType}
                                </Badge>
                              )}
                              {!isSupported && (
                                <Badge variant="destructive" className="text-xs h-4 px-1">
                                  <AlertTriangle className="w-2 h-2 mr-1" />
                                  Unsupported
                                </Badge>
                              )}
                              {isSupported && (
                                <Badge variant="default" className="text-xs h-4 px-1">
                                  <CheckCircle2 className="w-2 h-2 mr-1" />
                                  Supported
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {isConnected && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium" data-testid="nav-mobile-wallet-balance">
                                Balance: {formatBalance(balance)} {network?.symbol || 'ETH'}
                              </p>
                              <p className="text-xs text-muted-foreground" data-testid="nav-mobile-wallet-address">
                                {formatAddress(account)}
                              </p>
                            </div>

                            <Select 
                              onValueChange={handleNetworkChange} 
                              data-testid="nav-mobile-network-select"
                              value={currentNetworkInfo?.chainId || ''}
                            >
                              <SelectTrigger className="w-full">
                                <div className="flex items-center space-x-2">
                                  {currentNetworkInfo?.icon && (
                                    <span className="text-sm">{currentNetworkInfo.icon}</span>
                                  )}
                                  <Network className="h-4 w-4" />
                                </div>
                                <SelectValue placeholder="Select Network" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(networkGroups).map(([groupName, networks]) => (
                                  <div key={groupName}>
                                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                      {groupName}
                                    </div>
                                    {networks.map((network) => (
                                      <SelectItem 
                                        key={network.chainId} 
                                        value={network.chainId}
                                        className="pl-4"
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm">{network.icon}</span>
                                            <span>{network.name}</span>
                                            {network.isTestnet && (
                                              <Badge variant="outline" className="text-xs h-4 px-1">
                                                Test
                                              </Badge>
                                            )}
                                            <Badge 
                                              variant={network.chainType === 'L2' ? 'secondary' : 'outline'}
                                              className="text-xs h-4 px-1"
                                            >
                                              {network.chainType}
                                            </Badge>
                                          </div>
                                          <span className="text-xs text-muted-foreground">
                                            {network.symbol}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                    <Separator className="my-1" />
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button 
                              variant="outline" 
                              className="w-full" 
                              onClick={() => {
                                onDisconnect?.();
                                setIsMobileMenuOpen(false);
                              }}
                              data-testid="nav-mobile-button-disconnect"
                            >
                              Disconnect Wallet
                            </Button>
                          </div>
                        )}

                        {!isConnected && (
                          <Button 
                            className="w-full"
                            onClick={() => {
                              onConnect?.();
                              setIsMobileMenuOpen(false);
                            }}
                            data-testid="nav-mobile-button-connect"
                          >
                            <Wallet className="mr-2 h-4 w-4" />
                            Connect Wallet
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}