import { useState } from "react";
import { useWeb3 } from "@/hooks/use-web3";
import WalletConnection from "@/components/wallet-connection";
import SendTransaction from "@/components/send-transaction";
import NetworkInfo from "@/components/network-info";
import RecentTransactions from "@/components/recent-transactions";
import ConnectionModal from "@/components/connection-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet } from "lucide-react";

export default function WalletPage() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { 
    isConnected, 
    account, 
    balance, 
    network, 
    chainId, 
    connectWallet, 
    disconnectWallet,
    switchNetwork 
  } = useWeb3();

  const handleNetworkChange = (networkValue: string) => {
    const networkMap: Record<string, string> = {
      "mainnet": "0x1",
      "goerli": "0x5",
      "sepolia": "0xaa36a7",
      "polygon": "0x89"
    };
    
    const targetChainId = networkMap[networkValue];
    if (targetChainId) {
      switchNetwork(targetChainId);
    }
  };

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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-semibold">Crypto Casino</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <span 
                  className={`status-dot ${isConnected ? 'status-connected' : 'status-disconnected'}`}
                  data-testid="connection-status-dot"
                />
                <span className="text-muted-foreground" data-testid="connection-status-text">
                  {isConnected ? `Connected to ${network?.name || 'Unknown'}` : 'Disconnected'}
                </span>
              </div>
              {isConnected && (
                <Select onValueChange={handleNetworkChange} data-testid="network-select">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={network?.name || "Select Network"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
                    <SelectItem value="goerli">Goerli Testnet</SelectItem>
                    <SelectItem value="sepolia">Sepolia Testnet</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </header>

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
