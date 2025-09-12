import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/hooks/use-web3";
import { RefreshCw } from "lucide-react";

interface NetworkInfoProps {
  isConnected: boolean;
  network?: any;
  chainId?: string;
}

export default function NetworkInfo({ isConnected, network, chainId }: NetworkInfoProps) {
  const { refreshNetworkInfo, blockNumber, gasPrice } = useWeb3();

  const handleRefresh = async () => {
    try {
      await refreshNetworkInfo();
    } catch (error) {
      console.error("Failed to refresh network info:", error);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Network Information</h3>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Connect wallet to view network information</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Network Information</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium" data-testid="network-name">
              {network?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chain ID</span>
            <span className="font-mono" data-testid="chain-id">
              {chainId || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Block Number</span>
            <span className="font-mono" data-testid="block-number">
              {blockNumber || 'Loading...'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gas Price</span>
            <span className="font-mono" data-testid="current-gas-price">
              {gasPrice || 'Loading...'}
            </span>
          </div>
        </div>
        
        <Button 
          className="w-full mt-4" 
          variant="secondary" 
          onClick={handleRefresh}
          data-testid="refresh-network-info-button"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Network Info
        </Button>
      </CardContent>
    </Card>
  );
}
