import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeftRight, 
  ArrowDown,
  Zap,
  Shield,
  Clock,
  Info,
  RefreshCw,
  TrendingUp,
  Network
} from "lucide-react";
import { networks } from "@/lib/web3";

const supportedChains = [
  { id: '0x1', name: 'Ethereum', symbol: 'ETH', icon: '🔷' },
  { id: '0x89', name: 'Polygon', symbol: 'MATIC', icon: '🟣' },
  { id: '0x38', name: 'BSC', symbol: 'BNB', icon: '🟡' },
  { id: '0xa4b1', name: 'Arbitrum', symbol: 'ETH', icon: '🔵' },
  { id: '0xa', name: 'Optimism', symbol: 'ETH', icon: '🔴' },
  { id: '0x2105', name: 'Base', symbol: 'ETH', icon: '🔵' },
];

const supportedTokens = [
  { symbol: 'ETH', name: 'Ethereum', decimals: 18, icon: '🔷' },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, icon: '💵' },
  { symbol: 'USDT', name: 'Tether', decimals: 6, icon: '💰' },
  { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, icon: '💳' },
  { symbol: 'MATIC', name: 'Polygon', decimals: 18, icon: '🟣' },
  { symbol: 'BNB', name: 'Binance Coin', decimals: 18, icon: '🟡' },
];

export default function BridgePage() {
  const { account, balance } = useWeb3();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sourceChain, setSourceChain] = useState(supportedChains[0].id);
  const [destChain, setDestChain] = useState(supportedChains[1].id);
  const [selectedToken, setSelectedToken] = useState(supportedTokens[0].symbol);
  const [amount, setAmount] = useState("");
  
  const sourceName = supportedChains.find(c => c.id === sourceChain)?.name || "";
  const destName = supportedChains.find(c => c.id === destChain)?.name || "";
  const tokenInfo = supportedTokens.find(t => t.symbol === selectedToken);
  
  // Dynamic gas fee estimation based on network
  const estimateGasFee = (chainId: string, token: string): string => {
    const gasEstimates: Record<string, { native: number, erc20: number }> = {
      '0x1': { native: 0.003, erc20: 0.005 },
      '0x89': { native: 0.0002, erc20: 0.0003 },
      '0x38': { native: 0.0003, erc20: 0.0004 },
      '0xa4b1': { native: 0.0001, erc20: 0.0002 },
      '0xa': { native: 0.0001, erc20: 0.0002 },
      '0x2105': { native: 0.00008, erc20: 0.00015 },
    };
    
    const chainEstimate = gasEstimates[chainId] || { native: 0.001, erc20: 0.002 };
    const isNativeToken = (
      (chainId === '0x1' && token === 'ETH') ||
      (chainId === '0x89' && token === 'MATIC') ||
      (chainId === '0x38' && token === 'BNB')
    );
    
    return isNativeToken ? chainEstimate.native.toFixed(6) : chainEstimate.erc20.toFixed(6);
  };
  
  // Calculate fees (0.1% bridge fee + gas estimate)
  const bridgeFeePercent = 0.1;
  const bridgeFee = amount ? (parseFloat(amount) * bridgeFeePercent / 100).toFixed(6) : "0";
  const gasFee = estimateGasFee(sourceChain, selectedToken);
  const totalFee = amount ? (parseFloat(bridgeFee) + parseFloat(gasFee)).toFixed(6) : "0";
  const amountReceived = amount ? (parseFloat(amount) - parseFloat(totalFee)).toFixed(6) : "0";
  
  // Estimated time based on chain combination
  const getEstimatedTime = () => {
    if (sourceChain === '0x1' || destChain === '0x1') return "10-15 minutes";
    return "2-5 minutes";
  };

  const bridgeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/bridge/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to create bridge transaction');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🌉 Bridge Transaction Initiated!",
        description: `Bridging ${amount} ${selectedToken} from ${sourceName} to ${destName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bridge/transactions'] });
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Bridge Failed",
        description: error.message || "Failed to initiate bridge transaction",
        variant: "destructive"
      });
    }
  });

  const handleSwapChains = () => {
    const temp = sourceChain;
    setSourceChain(destChain);
    setDestChain(temp);
  };

  const handleBridge = async () => {
    if (!account) {
      toast({
        title: "⚠️ Wallet Not Connected",
        description: "Please connect your wallet to use the bridge",
        variant: "destructive"
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "⚠️ Invalid Amount",
        description: "Please enter a valid amount to bridge",
        variant: "destructive"
      });
      return;
    }
    
    if (sourceChain === destChain) {
      toast({
        title: "⚠️ Same Chain Selected",
        description: "Source and destination chains must be different",
        variant: "destructive"
      });
      return;
    }

    const bridgeData = {
      walletAddress: account,
      sourceChain: sourceName,
      destinationChain: destName,
      token: selectedToken,
      amount: amount,
      status: "pending",
      estimatedTime: getEstimatedTime(),
      fee: totalFee,
      sourceTxHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
    };

    bridgeMutation.mutate(bridgeData);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 animate-float">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 glow-secondary animate-pulse-slow">
              <ArrowLeftRight className="h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(139,92,246,0.4)]" data-testid="title-bridge">
                Cross-Chain Bridge
              </h1>
              <p className="text-muted-foreground mt-1">Transfer assets across multiple blockchains instantly</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="premium-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Network className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Supported Chains</p>
                    <p className="text-2xl font-bold" data-testid="text-supported-chains">{supportedChains.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="premium-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Zap className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Speed</p>
                    <p className="text-2xl font-bold" data-testid="text-avg-speed">~3 min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="premium-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bridge Fee</p>
                    <p className="text-2xl font-bold" data-testid="text-bridge-fee">{bridgeFeePercent}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="premium-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Shield className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Security</p>
                    <p className="text-2xl font-bold" data-testid="text-security">Military</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bridge Interface */}
        <Card className="premium-card cosmic-dust border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Bridge Assets
            </CardTitle>
            <CardDescription>
              Transfer your crypto assets across different blockchain networks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Source Chain */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span>From</span>
                <Badge variant="outline">{sourceName}</Badge>
              </label>
              <Select value={sourceChain} onValueChange={setSourceChain}>
                <SelectTrigger data-testid="select-source-chain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map(chain => (
                    <SelectItem key={chain.id} value={chain.id} data-testid={`option-source-${chain.name.toLowerCase()}`}>
                      <span className="flex items-center gap-2">
                        <span>{chain.icon}</span>
                        <span>{chain.name}</span>
                        <span className="text-muted-foreground text-xs">({chain.symbol})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={handleSwapChains}
                data-testid="button-swap-chains"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Destination Chain */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span>To</span>
                <Badge variant="outline">{destName}</Badge>
              </label>
              <Select value={destChain} onValueChange={setDestChain}>
                <SelectTrigger data-testid="select-dest-chain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map(chain => (
                    <SelectItem key={chain.id} value={chain.id} data-testid={`option-dest-${chain.name.toLowerCase()}`}>
                      <span className="flex items-center gap-2">
                        <span>{chain.icon}</span>
                        <span>{chain.name}</span>
                        <span className="text-muted-foreground text-xs">({chain.symbol})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Token Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset</label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger data-testid="select-token">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedTokens.map(token => (
                    <SelectItem key={token.symbol} value={token.symbol} data-testid={`option-token-${token.symbol.toLowerCase()}`}>
                      <span className="flex items-center gap-2">
                        <span>{token.icon}</span>
                        <span>{token.symbol}</span>
                        <span className="text-muted-foreground text-xs">{token.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Amount</label>
                <span className="text-xs text-muted-foreground">
                  Balance: {balance || "0"} {selectedToken}
                </span>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl h-14"
                data-testid="input-amount"
              />
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0', 'MAX'].map(preset => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (preset === 'MAX') {
                        setAmount(balance || "0");
                      } else {
                        setAmount(preset);
                      }
                    }}
                    data-testid={`button-preset-${preset === 'MAX' ? 'max' : preset}`}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Transaction Details */}
            {amount && parseFloat(amount) > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bridge Fee ({bridgeFeePercent}%)</span>
                    <span data-testid="text-bridge-fee-amount">{bridgeFee} {selectedToken}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. Gas Fee</span>
                    <span data-testid="text-gas-fee">{gasFee} {selectedToken}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Estimated Time
                    </span>
                    <span data-testid="text-estimated-time">{getEstimatedTime()}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>You Will Receive</span>
                    <span className="text-green-500" data-testid="text-amount-received">{amountReceived} {selectedToken}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning for same chain */}
            {sourceChain === destChain && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please select different source and destination chains
                </AlertDescription>
              </Alert>
            )}

            {/* Bridge Button */}
            <Button
              className="w-full h-12 text-lg"
              size="lg"
              onClick={handleBridge}
              disabled={!account || bridgeMutation.isPending || !amount || parseFloat(amount) <= 0 || sourceChain === destChain}
              data-testid="button-bridge"
            >
              {!account ? (
                "Connect Wallet to Bridge"
              ) : bridgeMutation.isPending ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Bridging...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-5 w-5 mr-2" />
                  Bridge {selectedToken}
                </>
              )}
            </Button>

            {/* Security & Info Notices */}
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Shield className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                <strong>Testnet Simulation:</strong> This bridge interface demonstrates cross-chain transfer capabilities. 
                For production use, integrate with LayerZero, Wormhole, or custom bridge smart contracts. All transactions 
                are tracked and secured by the OMNIVERSE SYNDICATE.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="premium-card">
            <CardContent className="pt-6">
              <Zap className="h-10 w-10 text-yellow-500 mb-3" />
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Average bridge time of 2-5 minutes for L2s and 10-15 minutes for L1s
              </p>
            </CardContent>
          </Card>
          
          <Card className="premium-card">
            <CardContent className="pt-6">
              <Shield className="h-10 w-10 text-blue-500 mb-3" />
              <h3 className="font-semibold mb-2">Ultra Secure</h3>
              <p className="text-sm text-muted-foreground">
                Multi-signature validation and cryptographic proof verification
              </p>
            </CardContent>
          </Card>
          
          <Card className="premium-card">
            <CardContent className="pt-6">
              <TrendingUp className="h-10 w-10 text-green-500 mb-3" />
              <h3 className="font-semibold mb-2">Low Fees</h3>
              <p className="text-sm text-muted-foreground">
                Industry-leading {bridgeFeePercent}% bridge fee plus minimal gas costs
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
