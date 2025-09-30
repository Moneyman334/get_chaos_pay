import { useEffect, useState, useCallback, useRef } from "react";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Wifi, WifiOff, AlertTriangle } from "lucide-react";

export default function WalletHealthMonitor() {
  const { isConnected, account, balance, network, chainId, connectWallet, refreshBalance } = useWeb3();
  const { toast } = useToast();
  const [connectionHealth, setConnectionHealth] = useState<'healthy' | 'degraded' | 'disconnected'>('disconnected');
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const isRecoveringRef = useRef(false);

  // Auto-recovery mechanism
  const attemptRecovery = useCallback(async () => {
    if (isRecoveringRef.current) return;
    
    isRecoveringRef.current = true;
    
    try {
      // Wait a moment before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to reconnect
      const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
      
      if (accounts && accounts.length > 0) {
        setConnectionHealth('healthy');
        toast({
          title: "Connection recovered",
          description: "Wallet connection has been restored",
        });
      } else {
        setConnectionHealth('disconnected');
        toast({
          title: "Connection lost",
          description: "Please reconnect your wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      setConnectionHealth('disconnected');
    } finally {
      isRecoveringRef.current = false;
    }
  }, [toast]);

  // Health check function
  const checkConnectionHealth = useCallback(async () => {
    if (!isConnected || !window.ethereum) {
      setConnectionHealth('disconnected');
      return;
    }

    try {
      // Test connection with a simple RPC call
      await window.ethereum.request({ method: 'eth_blockNumber' });
      setConnectionHealth('healthy');
      setLastCheckTime(new Date());
    } catch (error) {
      console.error('Connection health check failed:', error);
      setConnectionHealth('degraded');
      
      // Attempt auto-recovery if not already recovering
      if (!isRecoveringRef.current) {
        attemptRecovery();
      }
    }
  }, [isConnected, attemptRecovery]);

  // Periodic health checks
  useEffect(() => {
    if (!isConnected) {
      setConnectionHealth('disconnected');
      return;
    }

    // Initial check
    checkConnectionHealth();

    // Check every 30 seconds
    const interval = setInterval(checkConnectionHealth, 30000);

    return () => clearInterval(interval);
  }, [isConnected, checkConnectionHealth]);

  // Auto-refresh balance every minute
  useEffect(() => {
    if (!isConnected || !account || !refreshBalance) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshBalance();
      } catch (error) {
        console.error('Balance refresh failed:', error);
      }
    }, 60000); // Every minute

    return () => clearInterval(refreshInterval);
  }, [isConnected, account, refreshBalance]);

  if (!isConnected) return null;

  const getHealthColor = () => {
    switch (connectionHealth) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-amber-500';
      case 'disconnected': return 'bg-red-500';
    }
  };

  const getHealthIcon = () => {
    switch (connectionHealth) {
      case 'healthy': return <Wifi className="h-3 w-3" />;
      case 'degraded': return <AlertTriangle className="h-3 w-3" />;
      case 'disconnected': return <WifiOff className="h-3 w-3" />;
    }
  };

  const getHealthText = () => {
    switch (connectionHealth) {
      case 'healthy': return 'Connected';
      case 'degraded': return 'Degraded';
      case 'disconnected': return 'Disconnected';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className="gap-2 cursor-pointer relative"
          data-testid="wallet-health-indicator"
        >
          <div className={`w-2 h-2 rounded-full ${getHealthColor()} ${connectionHealth === 'healthy' ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">{getHealthText()}</span>
          {getHealthIcon()}
          {isRecoveringRef.current && (
            <div className="absolute -top-1 -right-1">
              <Activity className="h-3 w-3 animate-spin text-amber-500" />
            </div>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <p><strong>Status:</strong> {getHealthText()}</p>
          <p><strong>Network:</strong> {network?.name}</p>
          <p><strong>Balance:</strong> {balance} {network?.symbol}</p>
          <p><strong>Last Check:</strong> {lastCheckTime.toLocaleTimeString()}</p>
          {isRecoveringRef.current && <p className="text-amber-500">Recovering...</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
