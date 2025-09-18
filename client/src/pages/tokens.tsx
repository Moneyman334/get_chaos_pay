import { useState, useEffect } from "react";
import { useWeb3 } from "@/hooks/use-web3";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  Plus, 
  Search, 
  ArrowUpRight, 
  Copy, 
  ExternalLink,
  AlertCircle,
  Wallet
} from "lucide-react";
import { 
  getTokenMetadata, 
  getTokenBalance, 
  formatTokenBalance, 
  transferToken,
  TokenMetadata 
} from "@/lib/web3";
import { DetectedToken, tokenDetectionService } from "@/lib/tokenDetection";
import SEO from "@/components/seo";

interface TokenWithBalance extends TokenMetadata {
  balance: string;
  formattedBalance: string;
  balanceInWei: string;
}

export default function TokensPage() {
  const { account, isConnected, network, chainId } = useWeb3();
  const { toast } = useToast();

  // State
  const [tokens, setTokens] = useState<DetectedToken[]>([]);
  const [customTokens, setCustomTokens] = useState<TokenWithBalance[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddToken, setShowAddToken] = useState(false);
  const [newTokenAddress, setNewTokenAddress] = useState("");
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<DetectedToken | TokenWithBalance | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferToAddress, setTransferToAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Load tokens when wallet is connected
  useEffect(() => {
    if (isConnected && account && chainId) {
      loadTokens();
    } else {
      setTokens([]);
      setCustomTokens([]);
    }
  }, [isConnected, account, chainId]);

  const loadTokens = async () => {
    if (!account || !chainId) return;

    setIsLoadingTokens(true);
    try {
      const detectedTokens = await tokenDetectionService.detectTokensForWallet(
        account, 
        chainId,
        { includeZeroBalances: false }
      );
      setTokens(detectedTokens);
    } catch (error) {
      console.error("Failed to load tokens:", error);
      toast({
        title: "Error loading tokens",
        description: "Failed to detect tokens for your wallet",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const addCustomToken = async () => {
    if (!newTokenAddress || !account || !chainId) return;

    setIsAddingToken(true);
    try {
      // Validate address format
      if (!newTokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error("Invalid contract address format");
      }

      // Get token metadata
      const metadata = await getTokenMetadata(newTokenAddress);
      if (!metadata) {
        throw new Error("Unable to fetch token metadata");
      }

      // Get balance
      const balance = await getTokenBalance(newTokenAddress, account);
      const formattedBalance = formatTokenBalance(balance, metadata.decimals);

      const newToken: TokenWithBalance = {
        ...metadata,
        balance,
        formattedBalance,
        balanceInWei: balance
      };

      setCustomTokens(prev => [...prev, newToken]);
      setNewTokenAddress("");
      setShowAddToken(false);

      toast({
        title: "Token added successfully",
        description: `${metadata.name} (${metadata.symbol}) has been added to your token list`
      });
    } catch (error: any) {
      console.error("Failed to add token:", error);
      toast({
        title: "Error adding token",
        description: error.message || "Failed to add custom token",
        variant: "destructive"
      });
    } finally {
      setIsAddingToken(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedToken || !account || !transferAmount || !transferToAddress) return;

    setIsTransferring(true);
    try {
      // Validate recipient address
      if (!transferToAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error("Invalid recipient address format");
      }

      const txHash = await transferToken(
        selectedToken.address,
        transferToAddress,
        transferAmount,
        selectedToken.decimals,
        account
      );

      toast({
        title: "Transfer initiated",
        description: `Transfer of ${transferAmount} ${selectedToken.symbol} initiated. Transaction: ${txHash.slice(0, 10)}...`,
      });

      // Reset form and close modal
      setTransferAmount("");
      setTransferToAddress("");
      setShowTransferModal(false);
      setSelectedToken(null);

      // Refresh tokens after a delay
      setTimeout(loadTokens, 2000);
    } catch (error: any) {
      console.error("Transfer failed:", error);
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to transfer tokens",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied",
      description: "Token contract address copied to clipboard"
    });
  };

  const openTransferModal = (token: DetectedToken | TokenWithBalance) => {
    setSelectedToken(token);
    setShowTransferModal(true);
  };

  // Filter tokens based on search
  const allTokens = [...tokens, ...customTokens];
  const filteredTokens = allTokens.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO 
          title="Token Manager - Connect Wallet"
          description="Connect your wallet to manage ERC-20 tokens, view balances, and transfer tokens"
        />
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Token Manager</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to manage ERC-20 tokens, view balances, and make transfers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title="Token Manager - ERC-20 Token Management"
        description="Manage your ERC-20 tokens across multiple blockchains. View balances, transfer tokens, and add custom tokens to your portfolio."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="tokens-title">
            Token Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your ERC-20 tokens on {network?.name || 'current network'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={loadTokens}
            variant="outline"
            disabled={isLoadingTokens}
            data-testid="refresh-tokens-button"
          >
            <Coins className="w-4 h-4 mr-2" />
            {isLoadingTokens ? "Loading..." : "Refresh"}
          </Button>

          <Dialog open={showAddToken} onOpenChange={setShowAddToken}>
            <DialogTrigger asChild>
              <Button data-testid="add-token-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Token
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-token-modal">
              <DialogHeader>
                <DialogTitle>Add Custom Token</DialogTitle>
                <DialogDescription>
                  Enter the contract address of the ERC-20 token you want to add
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="token-address">Contract Address</Label>
                  <Input
                    id="token-address"
                    placeholder="0x..."
                    value={newTokenAddress}
                    onChange={(e) => setNewTokenAddress(e.target.value)}
                    data-testid="token-address-input"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={addCustomToken}
                    disabled={isAddingToken || !newTokenAddress}
                    className="flex-1"
                    data-testid="confirm-add-token-button"
                  >
                    {isAddingToken ? "Adding..." : "Add Token"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddToken(false)}
                    data-testid="cancel-add-token-button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens by name, symbol, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="token-search-input"
          />
        </div>
      </div>

      {/* Token List */}
      {isLoadingTokens ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTokens.length === 0 ? (
        <Card className="text-center py-12" data-testid="no-tokens-message">
          <CardContent>
            <Coins className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No tokens match your search criteria" : "No tokens detected in your wallet"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddToken(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Token
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTokens.map((token) => (
            <Card 
              key={token.address} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              data-testid={`token-card-${token.symbol}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold truncate" data-testid={`token-name-${token.symbol}`}>
                      {token.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="secondary" data-testid={`token-symbol-${token.symbol}`}>
                        {token.symbol}
                      </Badge>
                      {(token as DetectedToken).isPopular && (
                        <Badge variant="outline" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid={`token-balance-${token.symbol}`}>
                    {token.formattedBalance || formatTokenBalance(token.balance || '0', token.decimals)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Balance
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono truncate flex-1">
                    {token.address.slice(0, 6)}...{token.address.slice(-4)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyAddress(token.address)}
                    className="h-6 w-6 p-0"
                    data-testid={`copy-address-${token.symbol}`}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`${network?.blockExplorer}/token/${token.address}`, '_blank')}
                    className="h-6 w-6 p-0"
                    data-testid={`view-explorer-${token.symbol}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>

                <Button 
                  onClick={() => openTransferModal(token)}
                  className="w-full"
                  disabled={!token.balance || token.balance === '0'}
                  data-testid={`transfer-button-${token.symbol}`}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Transfer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent data-testid="transfer-modal">
          <DialogHeader>
            <DialogTitle>Transfer {selectedToken?.symbol}</DialogTitle>
            <DialogDescription>
              Send {selectedToken?.name} to another wallet
            </DialogDescription>
          </DialogHeader>

          {selectedToken && (
            <div className="space-y-4">
              <div className="bg-muted/20 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span>Available Balance:</span>
                  <span className="font-medium">
                    {selectedToken.formattedBalance || formatTokenBalance(selectedToken.balance || '0', selectedToken.decimals)} {selectedToken.symbol}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="transfer-to">Recipient Address</Label>
                <Input
                  id="transfer-to"
                  placeholder="0x..."
                  value={transferToAddress}
                  onChange={(e) => setTransferToAddress(e.target.value)}
                  data-testid="transfer-to-input"
                />
              </div>

              <div>
                <Label htmlFor="transfer-amount">Amount</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  step="any"
                  placeholder="0.0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  data-testid="transfer-amount-input"
                />
              </div>

              {transferAmount && selectedToken && (
                <div className="bg-muted/20 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">
                    Transaction Summary
                  </div>
                  <div className="font-medium mt-1">
                    Transfer {transferAmount} {selectedToken.symbol}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    To: {transferToAddress.slice(0, 6)}...{transferToAddress.slice(-4)}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleTransfer}
                  disabled={isTransferring || !transferAmount || !transferToAddress}
                  className="flex-1"
                  data-testid="confirm-transfer-button"
                >
                  {isTransferring ? "Transferring..." : "Transfer"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowTransferModal(false)}
                  data-testid="cancel-transfer-button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}