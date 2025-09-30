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
import CheckoutPage from "@/pages/checkout";
import OrdersPage from "@/pages/orders";
import TokenCreatorPage from "@/pages/token-creator";
import NFTCreatorPage from "@/pages/nft-creator";
import SentinelBotPage from "@/pages/sentinel-bot";
import BotDashboardPage from "@/pages/bot-dashboard";
import BotConfigPage from "@/pages/bot-config";
import GamePlayPage from "@/pages/game-play";
import EmpireDashboard from "@/pages/empire-dashboard";
import HouseVaultsPage from "@/pages/house-vaults";
import AutoCompoundPage from "@/pages/auto-compound";
import SocialAutomationPage from "@/pages/social-automation";
import AdminDiscountsPage from "@/pages/admin-discounts";
import AdminFlashSalesPage from "@/pages/admin-flash-sales";
import SubscriptionsPage from "@/pages/subscriptions";
import AffiliateDashboardPage from "@/pages/affiliate-dashboard";
import GiftCardsPage from "@/pages/gift-cards";
import LoyaltyPage from "@/pages/loyalty";
import CartRecoveryPage from "@/pages/cart-recovery";
import ProductsPage from "@/pages/products";
import WishlistPage from "@/pages/wishlist";
import CustomerDashboardPage from "@/pages/customer-dashboard";
import ReviewsPage from "@/pages/reviews";
import InvoicesPage from "@/pages/invoices";
import AnalyticsPage from "@/pages/analytics";
import PortfolioPage from "@/pages/portfolio";
import NotificationsPage from "@/pages/notifications";
import AchievementsPage from "@/pages/achievements";
import NotFound from "@/pages/not-found";
import ConnectionModal from "@/components/connection-modal";
import { useWeb3 } from "@/hooks/use-web3";
import CosmicCursor from "@/components/cosmic-cursor";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/empire" component={EmpireDashboard} />
      <Route path="/vaults" component={HouseVaultsPage} />
      <Route path="/auto-compound" component={AutoCompoundPage} />
      <Route path="/games" component={GamesPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/tokens" component={TokensPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/contracts" component={ContractsPage} />
      <Route path="/nfts" component={NFTsPage} />
      <Route path="/deposits" component={DepositsPage} />
      <Route path="/crypto-payments" component={CryptoPaymentsPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/token-creator" component={TokenCreatorPage} />
      <Route path="/nft-creator" component={NFTCreatorPage} />
      <Route path="/sentinel-bot" component={SentinelBotPage} />
      <Route path="/bot-dashboard" component={BotDashboardPage} />
      <Route path="/bot-config" component={BotConfigPage} />
      <Route path="/play" component={GamePlayPage} />
      <Route path="/social-automation" component={SocialAutomationPage} />
      <Route path="/admin/discounts" component={AdminDiscountsPage} />
      <Route path="/admin/flash-sales" component={AdminFlashSalesPage} />
      <Route path="/subscriptions" component={SubscriptionsPage} />
      <Route path="/affiliate" component={AffiliateDashboardPage} />
      <Route path="/gift-cards" component={GiftCardsPage} />
      <Route path="/loyalty" component={LoyaltyPage} />
      <Route path="/cart-recovery" component={CartRecoveryPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/wishlist" component={WishlistPage} />
      <Route path="/dashboard" component={CustomerDashboardPage} />
      <Route path="/reviews" component={ReviewsPage} />
      <Route path="/invoices" component={InvoicesPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/portfolio" component={PortfolioPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/achievements" component={AchievementsPage} />
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
        <CosmicCursor />
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
