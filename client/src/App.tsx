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
import MarketplacePage from "@/pages/marketplace";
import StakingPage from "@/pages/staking";
import ReferralsPage from "@/pages/referrals";
import SwapPage from "@/pages/swap";
import NFTGalleryPage from "@/pages/nft-gallery";
import DAOGovernancePage from "@/pages/dao-governance";
import P2PLendingPage from "@/pages/p2p-lending";
import PredictionMarketsPage from "@/pages/prediction-markets";
import YieldFarmingPage from "@/pages/yield-farming";
import SocialTradingPage from "@/pages/social-trading";
import TokenLaunchpadPage from "@/pages/token-launchpad";
import SupremeCommandPage from "@/pages/supreme-command";
import NotFound from "@/pages/not-found";
import EnhancedConnectionModal from "@/components/enhanced-connection-modal";
import { useWeb3 } from "@/hooks/use-web3";
import CosmicCursor from "@/components/cosmic-cursor";
import EmpireOracle from "@/components/empire-oracle";
import WalletHealthMonitor from "@/components/wallet-health-monitor";
import WalletActivityIndicator from "@/components/wallet-activity-indicator";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { ErrorBoundary } from "@/components/error-boundary";
import LoadingOverlay from "@/components/loading-overlay";
import NetworkStatus from "@/components/network-status";
import OnboardingTour from "@/components/onboarding-tour";

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
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/staking" component={StakingPage} />
      <Route path="/referrals" component={ReferralsPage} />
      <Route path="/swap" component={SwapPage} />
      <Route path="/nft-gallery" component={NFTGalleryPage} />
      <Route path="/dao" component={DAOGovernancePage} />
      <Route path="/lending" component={P2PLendingPage} />
      <Route path="/prediction-markets" component={PredictionMarketsPage} />
      <Route path="/yield-farming" component={YieldFarmingPage} />
      <Route path="/social-trading" component={SocialTradingPage} />
      <Route path="/token-launchpad" component={TokenLaunchpadPage} />
      <Route path="/supreme-command" component={SupremeCommandPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { connectWallet, disconnectWallet, chainId } = useWeb3();
  
  // Initialize wallet session management with activity tracking
  useWalletSession();

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
    <ErrorBoundary>
      <TooltipProvider>
        <LoadingOverlay />
        <div className="bg-background text-foreground min-h-screen">
          <CosmicCursor />
          <Toaster />
          <Navigation 
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
          
          {/* Wallet Health Monitor & Network Status */}
          <div className="fixed top-20 right-4 z-40 hidden md:flex flex-col gap-2">
            <WalletHealthMonitor />
            <NetworkStatus />
          </div>
          
          {/* Wallet Activity Indicator */}
          <WalletActivityIndicator />
          
          <Router />
        
        {/* Enhanced Connection Modal */}
        <EnhancedConnectionModal
          isOpen={showConnectionModal}
          onClose={() => setShowConnectionModal(false)}
          onConnectMetaMask={handleConnectMetaMask}
          selectedNetwork={chainId}
        />

        {/* Empire Oracle - Available on all pages */}
        <EmpireOracle />
        
        {/* Onboarding Tour for new users */}
        <OnboardingTour />
        </div>
      </TooltipProvider>
    </ErrorBoundary>
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
