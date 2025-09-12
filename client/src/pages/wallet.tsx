import { useState } from "react";
import { useWeb3 } from "@/hooks/use-web3";
import WalletConnection from "@/components/wallet-connection";
import SendTransaction from "@/components/send-transaction";
import NetworkInfo from "@/components/network-info";
import RecentTransactions from "@/components/recent-transactions";
import ConnectionModal from "@/components/connection-modal";

export default function WalletPage() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
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
      setShowConnectionModal(true);
    }
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
    <>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Wallet Connection & Send Transaction */}
          <div className="lg:col-span-2 space-y-6">
            <WalletConnection 
              isConnected={isConnected}
              account={account}
              balance={balance}
              onConnect={handleConnect}
              onDisconnect={disconnectWallet}
            />
            
            {isConnected && (
              <SendTransaction 
                account={account}
                balance={balance}
              />
            )}
          </div>

          {/* Right Column: Network Info & Recent Transactions */}
          <div className="space-y-6">
            <NetworkInfo 
              isConnected={isConnected}
              network={network}
              chainId={chainId}
            />
            
            {isConnected && (
              <RecentTransactions account={account} />
            )}
          </div>
        </div>
      </main>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onConnectMetaMask={handleConnectMetaMask}
        onConnectWalletConnect={() => {
          console.log("WalletConnect not implemented yet");
          // TODO: Implement WalletConnect
        }}
      />
    </>
  );
}
