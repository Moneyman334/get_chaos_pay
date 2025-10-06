import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface DemoModeContextType {
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("codex_demo_mode");
    if (savedMode === "true") {
      setIsDemoMode(true);
    }
  }, []);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem("codex_demo_mode", "true");
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem("codex_demo_mode");
  };

  const toggleDemoMode = () => {
    if (isDemoMode) {
      disableDemoMode();
    } else {
      enableDemoMode();
    }
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, enableDemoMode, disableDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
}

// Demo data generators
export const demoData = {
  wallet: {
    address: "0x1234...5678",
    balance: "12.5432",
    usdValue: 24386.82
  },
  
  portfolio: [
    { symbol: "ETH", amount: 12.5432, value: 24386.82, change: 5.2 },
    { symbol: "BTC", amount: 0.523, value: 21840.50, change: 3.1 },
    { symbol: "USDC", amount: 5000, value: 5000, change: 0 },
    { symbol: "LINK", amount: 1250, value: 18750, change: -2.3 }
  ],
  
  transactions: [
    { id: "1", type: "Stake", amount: "5.0 ETH", status: "Completed", timestamp: Date.now() - 3600000 },
    { id: "2", type: "Swap", amount: "0.5 BTC → 8 ETH", status: "Completed", timestamp: Date.now() - 7200000 },
    { id: "3", type: "Payment", amount: "250 USDC", status: "Pending", timestamp: Date.now() - 10800000 }
  ],
  
  orders: [
    { id: "ORD-001", product: "Premium NFT Pack", amount: 500, status: "delivered", date: "2025-10-01" },
    { id: "ORD-002", product: "Token Bundle", amount: 250, status: "processing", date: "2025-10-02" },
    { id: "ORD-003", product: "Staking Credit", amount: 1000, status: "delivered", date: "2025-10-03" }
  ],
  
  nfts: [
    { id: "1", name: "CODEX Genesis #42", collection: "CODEX Genesis", image: "https://picsum.photos/400/400?random=1", rarity: "Legendary" },
    { id: "2", name: "Crypto Punk Clone #789", collection: "Punk Clone", image: "https://picsum.photos/400/400?random=2", rarity: "Rare" },
    { id: "3", name: "Abstract Art #123", collection: "Abstract Collection", image: "https://picsum.photos/400/400?random=3", rarity: "Common" }
  ],
  
  stakingPools: [
    { name: "ETH Pool", apy: 25.5, staked: 10.5, rewards: 1.23, unlockDate: Date.now() + 2592000000 },
    { name: "USDC Pool", apy: 15.0, staked: 5000, rewards: 625, unlockDate: null },
    { name: "BTC Pool", apy: 35.0, staked: 0.3, rewards: 0.105, unlockDate: Date.now() + 7776000000 }
  ],
  
  tradingBots: [
    { id: "bot1", name: "Sentinel Alpha", strategy: "Momentum", profit: 2847.52, trades: 142, winRate: 89 },
    { id: "bot2", name: "Sentinel Beta", strategy: "Mean Reversion", profit: 1523.18, trades: 87, winRate: 76 },
    { id: "bot3", name: "Sentinel Gamma", strategy: "Arbitrage", profit: 892.45, trades: 213, winRate: 94 }
  ],
  
  achievements: [
    { id: "1", name: "Early Adopter", description: "Joined within first 1000 users", unlocked: true, rarity: "Legendary" },
    { id: "2", name: "First Trade", description: "Complete your first trade", unlocked: true, rarity: "Common" },
    { id: "3", name: "Whale Status", description: "Stake over $10,000", unlocked: false, rarity: "Epic" },
    { id: "4", name: "NFT Collector", description: "Own 10+ NFTs", unlocked: true, rarity: "Rare" }
  ],
  
  loyaltyPoints: {
    total: 12847,
    tier: "Diamond",
    nextTierPoints: 15000,
    lifetime: 28392
  },

  demoWallets: [
    {
      id: "metamask-0x7a32cd212d5a3630d4c0be28042407108fde8dc8",
      type: "metamask" as const,
      name: "MetaMask",
      address: "0x7a32cd212d5a3630d4c0be28042407108fde8dc8",
      chainType: "evm" as const,
      chainId: "0x1",
      balance: "40.46",
      nativeSymbol: "ETH",
      isConnected: true,
      isPrimary: true,
      lastUsed: Date.now()
    },
    {
      id: "coinbase-0x8ba1f109551bd432803012645ac136ddd64dba72",
      type: "coinbase" as const,
      name: "Coinbase Wallet",
      address: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
      chainType: "evm" as const,
      chainId: "0x89",
      balance: "1245.89",
      nativeSymbol: "MATIC",
      isConnected: true,
      isPrimary: false,
      lastUsed: Date.now() - 3600000
    }
  ]
};
