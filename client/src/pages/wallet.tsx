import { useWeb3 } from "@/hooks/use-web3";
import WalletConnection from "@/components/wallet-connection";
import SendTransaction from "@/components/send-transaction";
import NetworkInfo from "@/components/network-info";
import RecentTransactions from "@/components/recent-transactions";
import TransactionHistory from "@/components/transaction-history";
import SEO from "@/components/seo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WalletPage() {
  const { 
    isConnected, 
    account, 
    balance, 
    network, 
    chainId, 
    connectWallet, 
    disconnectWallet
  } = useWeb3();

  const handleConnect = () => {
    if (!isConnected) {
      connectWallet();
    }
  };

  return (
    <>
      <SEO 
        title="Crypto Wallet - Connect & Manage Your Web3 Gaming Funds"
        description="Securely connect your MetaMask or Web3 wallet to CryptoCasino. Send transactions, check balances, and manage your crypto funds for seamless blockchain gaming experience."
        keywords={["crypto wallet", "MetaMask casino", "web3 wallet integration", "crypto transactions", "blockchain wallet", "ethereum wallet casino", "wallet connect gaming", "crypto balance management", "secure crypto gaming", "web3 gaming wallet"]}
        canonicalUrl="/wallet"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Crypto Wallet - CryptoCasino",
          "description": "Connect and manage your Web3 wallet for secure cryptocurrency gaming transactions.",
          "url": "/wallet",
          "mainEntity": {
            "@type": "SoftwareApplication",
            "name": "Crypto Wallet Integration",
            "description": "Web3 wallet integration for cryptocurrency gaming",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "category": "Wallet Services",
              "description": "Secure cryptocurrency wallet management for gaming"
            }
          }
        }}
      />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Wallet Connection - Always Visible */}
          <WalletConnection 
            isConnected={isConnected}
            account={account}
            balance={balance}
            onConnect={handleConnect}
            onDisconnect={disconnectWallet}
          />
          
          {isConnected ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" data-testid="tab-overview">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="send" data-testid="tab-send">
                  Send Transaction
                </TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">
                  Transaction History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Network Info */}
                  <div className="lg:col-span-1">
                    <NetworkInfo 
                      isConnected={isConnected}
                      network={network}
                      chainId={chainId}
                    />
                  </div>
                  
                  {/* Recent Transactions */}
                  <div className="lg:col-span-2">
                    <RecentTransactions account={account} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="send" className="space-y-6">
                <div className="max-w-2xl mx-auto">
                  <SendTransaction 
                    account={account}
                    balance={balance}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-6">
                <TransactionHistory 
                  address={account}
                  className="w-full"
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Network Info */}
              <NetworkInfo 
                isConnected={isConnected}
                network={network}
                chainId={chainId}
              />
              
              {/* Placeholder for when not connected */}
              <div className="flex items-center justify-center bg-secondary/20 rounded-lg p-8">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
                  <p className="text-muted-foreground">
                    Connect your wallet to access transaction history, send crypto, and explore multi-chain features.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

    </>
  );
}
