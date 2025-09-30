import { useState } from "react";
import { useWeb3 } from "@/hooks/use-web3";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { networks } from "@/lib/web3";

interface NetworkSwitcherProps {
  recommendedChainId?: string;
  showRecommendation?: boolean;
}

export default function NetworkSwitcher({ 
  recommendedChainId, 
  showRecommendation = false 
}: NetworkSwitcherProps) {
  const { network, chainId, switchNetwork, isConnected } = useWeb3();
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isConnected) return null;

  const handleNetworkSwitch = async (targetChainId: string) => {
    setIsSwitching(true);
    try {
      await switchNetwork(targetChainId);
    } finally {
      setIsSwitching(false);
    }
  };

  const popularNetworks = [
    { ...networks['0x1'], chainId: '0x1' },        // Ethereum
    { ...networks['0x2105'], chainId: '0x2105' },  // Base
    { ...networks['0x89'], chainId: '0x89' },      // Polygon
    { ...networks['0xaa36a7'], chainId: '0xaa36a7' } // Sepolia
  ].filter(n => n.name);

  const isWrongNetwork = recommendedChainId && chainId !== recommendedChainId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isWrongNetwork ? "destructive" : "outline"} 
          className="gap-2 relative"
          data-testid="button-network-switcher"
        >
          <span className="text-lg">{network?.icon || '🌐'}</span>
          <span className="hidden sm:inline">{network?.name || 'Unknown Network'}</span>
          <ChevronDown className="h-4 w-4" />
          {isWrongNetwork && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          Select Network
          {network?.isTestnet && (
            <Badge variant="outline" className="text-xs">Testnet</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Show recommendation if applicable */}
        {showRecommendation && recommendedChainId && isWrongNetwork && (
          <>
            <div className="px-2 py-3 text-sm">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Wrong Network</span>
              </div>
              <p className="text-muted-foreground text-xs">
                This feature works best on {networks[recommendedChainId]?.name}
              </p>
              <Button
                variant="default"
                size="sm"
                className="w-full mt-2 bg-amber-500 hover:bg-amber-600"
                onClick={() => handleNetworkSwitch(recommendedChainId)}
                disabled={isSwitching}
                data-testid="button-switch-recommended"
              >
                <Zap className="h-3 w-3 mr-1" />
                Switch to {networks[recommendedChainId]?.name}
              </Button>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {popularNetworks.map((net) => (
          <DropdownMenuItem
            key={net.chainId}
            onClick={() => handleNetworkSwitch(net.chainId)}
            disabled={isSwitching || chainId === net.chainId}
            className="flex items-center justify-between cursor-pointer"
            data-testid={`network-option-${net.chainId}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{net.icon}</span>
              <div>
                <div className="font-medium">{net.name}</div>
                <div className="text-xs text-muted-foreground">{net.symbol}</div>
              </div>
            </div>
            {chainId === net.chainId && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {recommendedChainId === net.chainId && chainId !== net.chainId && (
              <Zap className="h-4 w-4 text-amber-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
