import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy } from "lucide-react";

interface WalletConnectionProps {
  isConnected: boolean;
  account?: string;
  balance?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletConnection({
  isConnected,
  account,
  balance,
  onConnect,
  onDisconnect
}: WalletConnectionProps) {
  const { toast } = useToast();

  const copyAddress = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account);
        toast({
          title: "Address copied",
          description: "Wallet address copied to clipboard",
        });
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Casino Vault</h2>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Connect to Casino</h3>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to start playing at the crypto casino
            </p>
            <Button 
              onClick={onConnect}
              className="px-8"
              data-testid="connect-wallet-button"
            >
              Connect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Casino Vault</h2>
        
        {/* Connection Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Check className="text-primary-foreground h-5 w-5" />
              </div>
              <div>
                <div className="font-medium" data-testid="wallet-connection-status">
                  MetaMask Connected
                </div>
                <div className="text-sm text-muted-foreground">
                  Ready to play at the casino
                </div>
              </div>
            </div>
            <Button 
              variant="destructive" 
              onClick={onDisconnect}
              data-testid="disconnect-wallet-button"
            >
              Disconnect
            </Button>
          </div>
        </div>

        {/* Wallet Address & Balance */}
        <div className="space-y-4">
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Wallet Address</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="copy-button h-6 w-6 p-0"
                data-testid="copy-address-button"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div 
              className="font-mono text-sm break-all"
              data-testid="wallet-address"
            >
              {account}
            </div>
          </div>
          
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">ETH Balance</div>
            <div 
              className="text-2xl font-semibold"
              data-testid="eth-balance"
            >
              {balance || '0.0000'} ETH
            </div>
            <div className="text-sm text-muted-foreground">
              {/* TODO: Add USD conversion */}
              ≈ $0.00 USD
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
