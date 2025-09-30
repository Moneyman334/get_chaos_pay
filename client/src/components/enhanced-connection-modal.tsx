import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Wallet, 
  QrCode, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  ExternalLink,
  Smartphone,
  Globe,
  Zap,
  Shield,
  HelpCircle
} from "lucide-react";
import { networks } from "@/lib/web3";
import { QRCodeSVG } from "qrcode.react";

interface EnhancedConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectMetaMask: () => void;
  selectedNetwork?: string;
}

type WalletOption = {
  id: string;
  name: string;
  description: string;
  icon: string;
  isInstalled: boolean;
  isRecommended?: boolean;
  color: string;
  onConnect: () => void;
};

export default function EnhancedConnectionModal({
  isOpen,
  onClose,
  onConnectMetaMask,
  selectedNetwork
}: EnhancedConnectionModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Detect installed wallets
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);

  useEffect(() => {
    const detectWallets = () => {
      const hasMetaMask = typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
      const hasCoinbase = typeof window.ethereum !== 'undefined' && (window.ethereum as any).isCoinbaseWallet;
      
      const options: WalletOption[] = [
        {
          id: 'metamask',
          name: 'MetaMask',
          description: 'Most popular Web3 wallet',
          icon: '🦊',
          isInstalled: hasMetaMask,
          isRecommended: true,
          color: 'bg-orange-500',
          onConnect: handleMetaMaskConnect
        },
        {
          id: 'coinbase',
          name: 'Coinbase Wallet',
          description: 'Self-custody wallet from Coinbase',
          icon: '🔵',
          isInstalled: hasCoinbase,
          color: 'bg-blue-500',
          onConnect: handleCoinbaseConnect
        },
        {
          id: 'walletconnect',
          name: 'WalletConnect',
          description: 'Connect with 300+ mobile wallets',
          icon: '📱',
          isInstalled: true,
          color: 'bg-purple-500',
          onConnect: handleWalletConnect
        }
      ];

      setWalletOptions(options);
    };

    detectWallets();
  }, []);

  const handleMetaMaskConnect = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    setSelectedWallet('metamask');
    
    try {
      await onConnectMetaMask();
      onClose();
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  const handleCoinbaseConnect = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    setSelectedWallet('coinbase');
    
    try {
      if (window.ethereum && (window.ethereum as any)?.isCoinbaseWallet) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        onClose();
      } else {
        window.open('https://www.coinbase.com/wallet', '_blank');
        setConnectionError('Please install Coinbase Wallet extension');
      }
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to connect to Coinbase Wallet');
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  const handleWalletConnect = () => {
    setShowQR(true);
    setSelectedWallet('walletconnect');
  };

  const mobileDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;

  const recommendedNetworks = [
    { ...networks['0x1'], chainId: '0x1' },        // Ethereum Mainnet
    { ...networks['0x2105'], chainId: '0x2105' },  // Base
    { ...networks['0x89'], chainId: '0x89' },      // Polygon
    { ...networks['0xaa36a7'], chainId: '0xaa36a7' } // Sepolia
  ].filter(n => n.name); // Filter out any undefined

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <Wallet className="text-white text-3xl h-10 w-10" />
            <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Connect to Web3 Empire
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose your preferred wallet to access the blockchain ecosystem
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="wallets" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallets" data-testid="tab-wallets">
              <Wallet className="h-4 w-4 mr-2" />
              Wallets
            </TabsTrigger>
            <TabsTrigger value="networks" data-testid="tab-networks">
              <Globe className="h-4 w-4 mr-2" />
              Networks
            </TabsTrigger>
            <TabsTrigger value="help" data-testid="tab-help">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </TabsTrigger>
          </TabsList>

          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-4 mt-4">
            {connectionError && (
              <Alert variant="destructive" data-testid="connection-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{connectionError}</AlertDescription>
              </Alert>
            )}

            {showQR ? (
              <div className="text-center space-y-4 p-6">
                <h3 className="text-lg font-semibold">Scan with Mobile Wallet</h3>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <QRCodeSVG value={mobileDeepLink} size={200} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your mobile wallet app
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowQR(false)}
                  data-testid="button-back-to-wallets"
                >
                  Back to Wallets
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {walletOptions.map((wallet) => (
                  <Button
                    key={wallet.id}
                    variant="outline"
                    className="w-full flex items-center space-x-4 p-4 h-auto justify-start hover:bg-secondary transition-all hover:scale-[1.02] relative overflow-hidden group"
                    onClick={wallet.onConnect}
                    disabled={isConnecting}
                    data-testid={`connect-${wallet.id}-button`}
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className={`w-12 h-12 ${wallet.color} rounded-lg flex items-center justify-center text-2xl relative z-10`}>
                      {wallet.icon}
                    </div>
                    
                    <div className="flex-1 text-left relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{wallet.name}</span>
                        {wallet.isRecommended && (
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <Zap className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                        {wallet.isInstalled && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Installed
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{wallet.description}</div>
                    </div>
                    
                    {isConnecting && selectedWallet === wallet.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground relative z-10" />
                    )}
                  </Button>
                ))}
              </div>
            )}

            <Separator />

            {/* Mobile Option */}
            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowQR(true)}
              data-testid="button-show-qr"
            >
              <Smartphone className="h-4 w-4" />
              Connect with Mobile Wallet
              <QrCode className="h-4 w-4" />
            </Button>
          </TabsContent>

          {/* Networks Tab */}
          <TabsContent value="networks" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Supported Networks</h3>
              {recommendedNetworks.map((network) => (
                <div
                  key={network.chainId}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  data-testid={`network-${network.chainId}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: network.color }}
                    >
                      {network.icon}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {network.name}
                        {network.isTestnet && (
                          <Badge variant="outline" className="text-xs">Testnet</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {network.chainType} • {network.symbol}
                      </div>
                    </div>
                  </div>
                  {selectedNetwork === network.chainId ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                You can switch networks after connecting your wallet
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  What is a Web3 wallet?
                </h3>
                <p className="text-sm text-muted-foreground">
                  A Web3 wallet is your gateway to the blockchain. It securely stores your cryptocurrencies, 
                  NFTs, and allows you to interact with decentralized applications like this one.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Troubleshooting
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span><strong>MetaMask not detected:</strong> Make sure you have the MetaMask browser extension installed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span><strong>Connection failed:</strong> Try refreshing the page and reconnecting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span><strong>Wrong network:</strong> After connecting, you can switch networks from the wallet dropdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span><strong>Mobile users:</strong> Use the QR code option or open this site directly in your wallet's browser</span>
                  </li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Don't have a wallet?</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open('https://metamask.io/download/', '_blank')}
                    data-testid="button-install-metamask"
                  >
                    <span>Install MetaMask</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open('https://www.coinbase.com/wallet', '_blank')}
                    data-testid="button-install-coinbase"
                  >
                    <span>Get Coinbase Wallet</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClose}
            disabled={isConnecting}
            data-testid="cancel-connection-button"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
