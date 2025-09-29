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
import TokensPage from "@/pages/tokens";
import TransactionsPage from "@/pages/transactions";
import ContractsPage from "@/pages/contracts";
import NFTsPage from "@/pages/nfts";
import DepositsPage from "@/pages/deposits";
import CryptoPaymentsPage from "@/pages/crypto-payments";
import TokenCreatorPage from "@/pages/token-creator";
import NFTCreatorPage from "@/pages/nft-creator";
import SentinelBotPage from "@/pages/sentinel-bot";
import BotDashboardPage from "@/pages/bot-dashboard";
import BotConfigPage from "@/pages/bot-config";
import GamePlayPage from "@/pages/game-play";
import EmpireDashboard from "@/pages/empire-dashboard";
import NotFound from "@/pages/not-found";
import ConnectionModal from "@/components/connection-modal";
import { useWeb3 } from "@/hooks/use-web3";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/empire" component={EmpireDashboard} />
      <Route path="/games" component={GamesPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/tokens" component={TokensPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/contracts" component={ContractsPage} />
      <Route path="/nfts" component={NFTsPage} />
      <Route path="/deposits" component={DepositsPage} />
      <Route path="/crypto-payments" component={CryptoPaymentsPage} />
      <Route path="/token-creator" component={TokenCreatorPage} />
      <Route path="/nft-creator" component={NFTCreatorPage} />
      <Route path="/sentinel-bot" component={SentinelBotPage} />
      <Route path="/bot-dashboard" component={BotDashboardPage} />
      <Route path="/bot-config" component={BotConfigPage} />
      <Route path="/play" component={GamePlayPage} />
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
