import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, QrCode, ChevronRight } from "lucide-react";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectMetaMask: () => void;
  onConnectWalletConnect: () => void;
}

export default function ConnectionModal({
  isOpen,
  onClose,
  onConnectMetaMask,
  onConnectWalletConnect
}: ConnectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="text-primary text-2xl h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-semibold mb-2">
            Connect Your Wallet
          </DialogTitle>
          <p className="text-muted-foreground">
            Choose a wallet to connect to this application
          </p>
        </DialogHeader>
        
        <div className="space-y-3 mt-6">
          <Button
            variant="outline"
            className="w-full flex items-center space-x-3 p-4 h-auto justify-start hover:bg-secondary transition-colors"
            onClick={onConnectMetaMask}
            data-testid="connect-metamask-button"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Wallet className="text-white h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">MetaMask</div>
              <div className="text-sm text-muted-foreground">Connect using browser wallet</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex items-center space-x-3 p-4 h-auto justify-start hover:bg-secondary transition-colors"
            onClick={onConnectWalletConnect}
            data-testid="connect-walletconnect-button"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <QrCode className="text-white h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">WalletConnect</div>
              <div className="text-sm text-muted-foreground">Scan with mobile wallet</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full mt-6 text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClose}
          data-testid="cancel-connection-button"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
