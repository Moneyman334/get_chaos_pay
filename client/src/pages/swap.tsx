import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWeb3 } from "@/hooks/use-web3";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownUp, TrendingUp, DollarSign, Zap, Info, RefreshCw, Settings, AlertCircle } from "lucide-react";
import { ethers } from "ethers";

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: number;
  priceImpact: number;
  fee: string;
  minReceived: string;
  route: string[];
  gas: string;
  protocols: string[];
}

// Supported chains for DEX aggregator
const SUPPORTED_CHAINS = [
  { id: 1, name: "Ethereum", symbol: "ETH" },
  { id: 56, name: "BSC", symbol: "BNB" },
  { id: 137, name: "Polygon", symbol: "MATIC" },
  { id: 42161, name: "Arbitrum", symbol: "ETH" },
  { id: 10, name: "Optimism", symbol: "ETH" },
  { id: 8453, name: "Base", symbol: "ETH" },
  { id: 43114, name: "Avalanche", symbol: "AVAX" },
  { id: 250, name: "Fantom", symbol: "FTM" },
];

export default function SwapPage() {
  const { account, balance, switchChain, chainId: connectedChainId } = useWeb3();
  const { toast } = useToast();
  
  const [chainId, setChainId] = useState<number>(1); // Default Ethereum
  const [fromToken, setFromToken] = useState<string>("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"); // Native ETH
  const [toToken, setToToken] = useState<string>("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); // USDC
  const [fromAmount, setFromAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch supported tokens for selected chain from backend
  const { data: tokens = [], isLoading: tokensLoading } = useQuery<Token[]>({
    queryKey: ['/api/swap/tokens', chainId],
    queryFn: async () => {
      const response = await fetch(`/api/swap/tokens/${chainId}`);
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Convert amount to wei based on decimals
  const toWei = (amount: string, decimals: number): string => {
    if (!amount || amount === "") return "0";
    try {
      return ethers.parseUnits(amount, decimals).toString();
    } catch {
      return "0";
    }
  };

  // Convert wei to readable amount
  const fromWei = (amount: string, decimals: number): string => {
    if (!amount || amount === "0") return "0";
    try {
      return ethers.formatUnits(amount, decimals);
    } catch {
      return "0";
    }
  };

  const fromTokenData = tokens.find(t => t.address === fromToken);
  const toTokenData = tokens.find(t => t.address === toToken);

  // Get swap quote from real DEX API
  const { data: quote, isLoading: quoteLoading, error: quoteError, refetch: refetchQuote } = useQuery<SwapQuote>({
    queryKey: ['/api/swap/quote', chainId, fromToken, toToken, fromAmount],
    queryFn: async () => {
      if (!fromAmount || parseFloat(fromAmount) === 0) {
        throw new Error("Enter amount");
      }
      
      const amountWei = toWei(fromAmount, fromTokenData?.decimals || 18);
      
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        fromToken,
        toToken,
        amount: amountWei,
        slippage: slippage.toString(),
      });

      const response = await fetch(`/api/swap/quote?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get quote');
      }

      return response.json();
    },
    enabled: !!fromAmount && parseFloat(fromAmount) > 0 && fromToken !== toToken && !!fromTokenData && !!toTokenData,
    refetchInterval: 15000, // Refresh quote every 15 seconds
  });

  // Execute swap mutation
  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Connect wallet to swap");
      if (!fromAmount || parseFloat(fromAmount) === 0) throw new Error("Enter amount to swap");
      if (connectedChainId !== chainId) {
        await switchChain(chainId);
        throw new Error(`Please switch to ${SUPPORTED_CHAINS.find(c => c.id === chainId)?.name}`);
      }
      
      const amountWei = toWei(fromAmount, fromTokenData?.decimals || 18);
      
      // Get transaction data from backend
      const response = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          fromToken,
          toToken,
          amount: amountWei,
          wallet: account,
          slippage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create swap transaction');
      }

      const txData = await response.json();
      
      // Execute transaction via MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        from: txData.from,
        to: txData.to,
        data: txData.data,
        value: txData.value,
        gasLimit: txData.gas,
      });

      await tx.wait();
      
      return { 
        hash: tx.hash,
        toAmount: fromWei(quote?.toAmount || "0", toTokenData?.decimals || 18)
      };
    },
    onSuccess: (data) => {
      toast({
        title: "Swap Successful!",
        description: `Swapped ${fromAmount} ${fromTokenData?.symbol} for ${data.toAmount} ${toTokenData?.symbol}`,
      });
      setFromAmount("");
      refetchQuote();
    },
    onError: (error: Error) => {
      toast({
        title: "Swap Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFlipTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  // Update token selection when chain changes
  useEffect(() => {
    if (tokens.length >= 2) {
      // Set from/to to different tokens when tokens load
      setFromToken(tokens[0]?.address || "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
      setToToken(tokens[1]?.address || tokens[0]?.address);
    }
  }, [chainId, tokens.length]); // Re-run when chain or tokens change

  const handleChainChange = (newChainId: string) => {
    const id = parseInt(newChainId);
    setChainId(id);
    setFromAmount(""); // Reset amount when changing chains
  };

  // Display values
  const toAmountDisplay = quote ? fromWei(quote.toAmount, toTokenData?.decimals || 18) : "0";
  const minReceivedDisplay = quote ? fromWei(quote.minReceived, toTokenData?.decimals || 18) : "0";
  const feeDisplay = quote ? fromWei(quote.fee, toTokenData?.decimals || 18) : "0";

  // Check if 1inch API is available
  const isApiAvailable = !quoteError || (quoteError as Error)?.message?.includes("fallback");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">DEX Aggregator</h1>
          <p className="text-muted-foreground">Best rates across 300+ liquidity sources</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Supported Chains</p>
                  <p className="text-2xl font-bold">{SUPPORTED_CHAINS.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">DEX Sources</p>
                  <p className="text-2xl font-bold">300+</p>
                </div>
                <ArrowDownUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Platform Fee</p>
                  <p className="text-2xl font-bold">0.3%</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Swap Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Swap Tokens</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
            {showSettings && (
              <div className="mt-4 p-4 border rounded-lg space-y-3">
                <div className="space-y-2">
                  <Label>Slippage Tolerance</Label>
                  <div className="flex gap-2">
                    {[0.1, 0.5, 1.0].map(value => (
                      <Button
                        key={value}
                        variant={slippage === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSlippage(value)}
                        data-testid={`button-slippage-${value}`}
                      >
                        {value}%
                      </Button>
                    ))}
                    <Input
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                      className="w-20"
                      step="0.1"
                      data-testid="input-custom-slippage"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Chain Selector */}
            <div className="space-y-2">
              <Label>Network</Label>
              <Select value={chainId.toString()} onValueChange={handleChainChange}>
                <SelectTrigger data-testid="select-chain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CHAINS.map(chain => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* From Token */}
            <div className="space-y-2">
              <Label>From</Label>
              <div className="relative">
                <div className="flex gap-2">
                  <Select value={fromToken} onValueChange={setFromToken}>
                    <SelectTrigger className="w-[180px]" data-testid="select-from-token">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map(token => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{token.symbol}</span>
                            <span className="text-sm text-muted-foreground">{token.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1"
                    data-testid="input-from-amount"
                  />
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-4 border-background"
                onClick={handleFlipTokens}
                data-testid="button-flip-tokens"
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <Label>To (estimated)</Label>
              <div className="flex gap-2">
                <Select value={toToken} onValueChange={setToToken}>
                  <SelectTrigger className="w-[180px]" data-testid="select-to-token">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map(token => (
                      <SelectItem key={token.address} value={token.address}>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{token.symbol}</span>
                          <span className="text-sm text-muted-foreground">{token.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="0.0"
                    value={quoteLoading ? "Loading..." : toAmountDisplay}
                    readOnly
                    className="flex-1"
                    data-testid="input-to-amount"
                  />
                  {quoteLoading && (
                    <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Swap Details */}
            {quote && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-semibold">
                    1 {fromTokenData?.symbol} = {quote.rate.toFixed(6)} {toTokenData?.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee (0.3%)</span>
                  <span className="font-semibold">
                    {parseFloat(feeDisplay).toFixed(6)} {toTokenData?.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span className={`font-semibold ${quote.priceImpact > 1 ? 'text-red-600' : 'text-green-600'}`}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Received</span>
                  <span className="font-semibold">
                    {parseFloat(minReceivedDisplay).toFixed(6)} {toTokenData?.symbol}
                  </span>
                </div>
                {quote.protocols.length > 0 && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Route</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {quote.protocols.slice(0, 3).map((protocol, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {protocol}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* API Warning */}
            {quoteError && (quoteError as Error)?.message?.includes("1inch API key") && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  DEX trading disabled: 1inch API key required. Using fallback pricing for quotes.
                </p>
              </div>
            )}

            {/* Swap Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => swapMutation.mutate()}
              disabled={
                !account ||
                !fromAmount ||
                parseFloat(fromAmount) === 0 ||
                fromToken === toToken ||
                swapMutation.isPending ||
                !quote ||
                quoteLoading
              }
              data-testid="button-swap"
            >
              {!account
                ? "Connect Wallet"
                : fromToken === toToken
                ? "Select Different Tokens"
                : swapMutation.isPending
                ? "Swapping..."
                : connectedChainId !== chainId
                ? `Switch to ${SUPPORTED_CHAINS.find(c => c.id === chainId)?.name}`
                : "Swap"}
            </Button>

            {/* Info Banner */}
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Powered by 1inch - aggregating 300+ DEX sources for best execution across {SUPPORTED_CHAINS.length} chains
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
