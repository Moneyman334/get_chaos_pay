import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import HomePage from "@/pages/home";
import GamesPage from "@/pages/games";
import WalletPage from "@/pages/wallet";
import ContractsPage from "@/pages/contracts";
import NotFound from "@/pages/not-found";
import ConnectionModal from "@/components/connection-modal";
import { useWeb3 } from "@/hooks/use-web3";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/games" component={GamesPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/contracts" component={ContractsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { connectWallet, disconnectWallet } = useWeb3();

  const handleConnect = () => {
    setShowConnectionModal(true);
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleConnectMetaMask = async () => {
    try {
      await connectWallet();
      setShowConnectionModal(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <TooltipProvider>
      <div className="bg-background text-foreground min-h-screen">
        <Toaster />
        <Navigation 
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
        <Router />
        
        {/* Global Connection Modal */}
        <ConnectionModal
          isOpen={showConnectionModal}
          onClose={() => setShowConnectionModal(false)}
          onConnectMetaMask={handleConnectMetaMask}
          onConnectWalletConnect={() => {
            console.log("WalletConnect not implemented yet");
            // TODO: Implement WalletConnect
          }}
        />
      </div>
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
