import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useWeb3 } from "@/hooks/use-web3";
import { 
  Wallet, 
  Home, 
  Gamepad2, 
  Menu,
  Coins,
  Network
} from "lucide-react";

interface NavigationProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const navigationItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/games", label: "Games", icon: Gamepad2 },
  { path: "/wallet", label: "Wallet", icon: Wallet }
];

export default function Navigation({ onConnect, onDisconnect }: NavigationProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { 
    isConnected, 
    account, 
    balance, 
    network, 
    switchNetwork 
  } = useWeb3();

  const handleNetworkChange = (networkValue: string) => {
    const networkMap: Record<string, string> = {
      "mainnet": "0x1",
      "goerli": "0x5", 
      "sepolia": "0xaa36a7",
      "polygon": "0x89"
    };
    
    const targetChainId = networkMap[networkValue];
    if (targetChainId) {
      switchNetwork(targetChainId);
    }
  };

  const isActivePath = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  const formatBalance = (balance: string | null | undefined) => {
    if (!balance) return "0.000";
    const numBalance = parseFloat(balance);
    return numBalance.toFixed(3);
  };

  const formatAddress = (address: string | null | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const NavLinks = ({ mobile = false }) => (
    <div className={`${mobile ? 'flex flex-col space-y-4' : 'flex items-center space-x-8'}`}>
      {navigationItems.map(({ path, label, icon: Icon }) => (
        <Link 
          key={path}
          href={path}
          onClick={() => mobile && setIsMobileMenuOpen(false)}
          data-testid={`nav-link-${label.toLowerCase()}`}
        >
          <div className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
            ${isActivePath(path) 
              ? 'bg-primary text-primary-foreground font-medium' 
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }
            ${mobile ? 'text-lg' : 'text-sm'}
          `}>
            <Icon className={`${mobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
            <span>{label}</span>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" data-testid="nav-brand">
            <div className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Coins className="text-primary-foreground h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Crypto Casino
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">
                  Provably Fair Gaming
                </p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <NavLinks />
          </nav>

          {/* Connection Info & Controls */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <span 
                  className={`status-dot ${isConnected ? 'status-connected' : 'status-disconnected'}`}
                  data-testid="nav-connection-status-dot"
                />
                <span className="text-muted-foreground" data-testid="nav-connection-status-text">
                  {isConnected ? `${network?.name || 'Unknown'}` : 'Disconnected'}
                </span>
              </div>

              {/* Network Selector */}
              {isConnected && (
                <Select onValueChange={handleNetworkChange} data-testid="nav-network-select">
                  <SelectTrigger className="w-40 h-9">
                    <Network className="h-4 w-4 mr-1" />
                    <SelectValue placeholder={network?.name || "Network"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mainnet">Ethereum</SelectItem>
                    <SelectItem value="goerli">Goerli</SelectItem>
                    <SelectItem value="sepolia">Sepolia</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
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
                      {formatBalance(balance)} ETH
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
                  data-testid="nav-button-connect"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
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
                        <div className="flex items-center space-x-2">
                          <span 
                            className={`status-dot ${isConnected ? 'status-connected' : 'status-disconnected'}`}
                            data-testid="nav-mobile-connection-status-dot"
                          />
                          <span className="text-sm" data-testid="nav-mobile-connection-status-text">
                            {isConnected ? `Connected to ${network?.name || 'Unknown'}` : 'Disconnected'}
                          </span>
                        </div>

                        {isConnected && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium" data-testid="nav-mobile-wallet-balance">
                                Balance: {formatBalance(balance)} ETH
                              </p>
                              <p className="text-xs text-muted-foreground" data-testid="nav-mobile-wallet-address">
                                {formatAddress(account)}
                              </p>
                            </div>

                            <Select onValueChange={handleNetworkChange} data-testid="nav-mobile-network-select">
                              <SelectTrigger className="w-full">
                                <Network className="h-4 w-4 mr-2" />
                                <SelectValue placeholder={network?.name || "Select Network"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mainnet">Ethereum</SelectItem>
                                <SelectItem value="goerli">Goerli</SelectItem>
                                <SelectItem value="sepolia">Sepolia</SelectItem>
                                <SelectItem value="polygon">Polygon</SelectItem>
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