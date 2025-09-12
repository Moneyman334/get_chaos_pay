import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWeb3 } from "@/hooks/use-web3";
import { RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, Network, Clock, Zap } from "lucide-react";

interface NetworkInfoProps {
  isConnected: boolean;
  network?: any;
  chainId?: string;
}

export default function NetworkInfo({ isConnected, network, chainId }: NetworkInfoProps) {
  const { 
    refreshNetworkInfo, 
    blockNumber, 
    gasPrice,
    getCurrentNetworkInfo,
    getTokenExplorerUrl,
    isCurrentNetworkSupported 
  } = useWeb3();
  
  const currentNetworkInfo = getCurrentNetworkInfo();
  const isSupported = isCurrentNetworkSupported();

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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {currentNetworkInfo?.icon && (
              <span className="text-xl">{currentNetworkInfo.icon}</span>
            )}
            <Network className="h-5 w-5" />
            <span>Network Information</span>
          </div>
          <div className="flex items-center space-x-2">
            {isSupported ? (
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Supported
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Unsupported
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Network Details */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Network</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium" data-testid="network-name">
                {network?.name || 'Unknown'}
              </span>
              {network?.isTestnet && (
                <Badge variant="outline" className="text-xs">
                  Testnet
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Chain Type</span>
            <Badge 
              variant={currentNetworkInfo?.chainType === 'L2' ? 'secondary' : 'outline'} 
              className="text-xs"
              data-testid="chain-type"
            >
              {currentNetworkInfo?.chainType || 'Unknown'}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chain ID</span>
            <span className="font-mono text-sm" data-testid="chain-id">
              {chainId || 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Native Token</span>
            <span className="font-medium" data-testid="native-token">
              {network?.symbol || 'ETH'}
            </span>
          </div>
          
          {currentNetworkInfo?.averageBlockTime && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Block Time
              </span>
              <span className="text-sm" data-testid="block-time">
                ~{currentNetworkInfo.averageBlockTime}s
              </span>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Live Network Data */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center">
            <Zap className="w-4 h-4 mr-1" />
            Live Network Data
          </h4>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Block Number</span>
            <span className="font-mono text-sm" data-testid="block-number">
              {blockNumber || 'Loading...'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gas Price</span>
            <span className="font-mono text-sm" data-testid="current-gas-price">
              {gasPrice || 'Loading...'}
            </span>
          </div>
        </div>
        
        <Separator />
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            className="w-full" 
            variant="secondary" 
            onClick={handleRefresh}
            data-testid="refresh-network-info-button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Network Info
          </Button>
          
          {network?.blockExplorerUrl && (
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.open(network.blockExplorerUrl, '_blank')}
              data-testid="block-explorer-button"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Block Explorer
            </Button>
          )}
        </div>
        
        {/* Network Status Footer */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Network Status</span>
            <div className="flex items-center space-x-2">
              <span 
                className={`status-dot ${
                  isConnected 
                    ? isSupported 
                      ? 'status-connected' 
                      : 'status-warning'
                    : 'status-disconnected'
                }`}
                data-testid="network-status-dot"
              />
              <span className="text-xs font-medium">
                {isConnected 
                  ? isSupported 
                    ? 'Connected & Supported'
                    : 'Connected but Unsupported'
                  : 'Disconnected'
                }
              </span>
            </div>
          </div>
          
          {!isSupported && isConnected && (
            <p className="text-xs text-muted-foreground">
              This network may have limited functionality. Consider switching to a supported network.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
