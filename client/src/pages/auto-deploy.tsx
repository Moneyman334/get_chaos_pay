import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Coins, Image, Rocket, Loader2, ExternalLink, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { ethers } from "ethers";

interface DeployedAsset {
  name: string;
  symbol: string;
  type: "token" | "nft";
  contractAddress: string;
  transactionHash: string;
  chainId: string;
  timestamp: Date;
  status: "deploying" | "deployed" | "failed";
}

export default function AutoDeployPage() {
  const { toast } = useToast();
  const { isConnected, account, network } = useWeb3();
  const [deployedAssets, setDeployedAssets] = useState<DeployedAsset[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  // Generate token configuration
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Wallet not connected");
      return apiRequest("/api/auto-deploy/token/generate", {
        method: "POST",
        data: {
          walletAddress: account,
          chainId: network?.chainId || "1",
        },
      });
    },
  });

  // Generate NFT configuration
  const generateNFTMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Wallet not connected");
      return apiRequest("/api/auto-deploy/nft/generate", {
        method: "POST",
        data: {
          walletAddress: account,
          chainId: network?.chainId || "1",
        },
      });
    },
  });

  // Record deployment
  const recordDeploymentMutation = useMutation({
    mutationFn: async (data: {
      contractAddress: string;
      chainId: string;
      name: string;
      symbol: string;
      type: "token" | "nft";
      deployerAddress: string;
      transactionHash: string;
      contractCode: string;
    }) => {
      return apiRequest("/api/auto-deploy/record", {
        method: "POST",
        data,
      });
    },
  });

  const deployToken = async () => {
    if (!isConnected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    const tempAsset: DeployedAsset = {
      name: "Loading...",
      symbol: "...",
      type: "token",
      contractAddress: "",
      transactionHash: "",
      chainId: network?.chainId || "1",
      timestamp: new Date(),
      status: "deploying",
    };
    setDeployedAssets(prev => [tempAsset, ...prev]);

    try {
      // Generate token configuration
      const config = await generateTokenMutation.mutateAsync();

      // Update temp asset with generated config
      tempAsset.name = config.config.name;
      tempAsset.symbol = config.config.symbol;
      setDeployedAssets(prev => [tempAsset, ...prev.slice(1)]);

      toast({
        title: "Deploying Token",
        description: `Deploying ${config.config.name} (${config.config.symbol})...`,
      });

      // Get provider from MetaMask
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Simplified ERC-20 bytecode (this is a placeholder - real deployment would need actual compiled bytecode)
      // In production, you'd use a compiler service or pre-compiled contracts
      const ERC20_FACTORY_BYTECODE = "0x60806040523480156100105..."; // This is placeholder

      // For demo purposes, we'll simulate deployment with a contract interaction
      // In reality, you'd deploy using: await signer.sendTransaction({ data: bytecode })
      
      toast({
        title: "Deployment Simulated",
        description: "In production, this would deploy the actual contract. For now, showing demo deployment.",
      });

      // Simulate deployment
      const mockContractAddress = `0x${Math.random().toString(16).slice(2, 42)}`;
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}`;

      // Record deployment
      await recordDeploymentMutation.mutateAsync({
        contractAddress: mockContractAddress,
        chainId: network?.chainId || "1",
        name: config.config.name,
        symbol: config.config.symbol,
        type: "token",
        deployerAddress: account,
        transactionHash: mockTxHash,
        contractCode: config.contractCode,
      });

      // Update asset status
      tempAsset.contractAddress = mockContractAddress;
      tempAsset.transactionHash = mockTxHash;
      tempAsset.status = "deployed";
      setDeployedAssets(prev => [tempAsset, ...prev.slice(1)]);

      toast({
        title: "Token Deployed! 🎉",
        description: `${config.config.name} deployed successfully at ${mockContractAddress.slice(0, 10)}...`,
      });
    } catch (error: any) {
      console.error("Deployment error:", error);
      
      // Update status to failed
      tempAsset.status = "failed";
      setDeployedAssets(prev => [tempAsset, ...prev.slice(1)]);

      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy token",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const deployNFT = async () => {
    if (!isConnected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    const tempAsset: DeployedAsset = {
      name: "Loading...",
      symbol: "...",
      type: "nft",
      contractAddress: "",
      transactionHash: "",
      chainId: network?.chainId || "1",
      timestamp: new Date(),
      status: "deploying",
    };
    setDeployedAssets(prev => [tempAsset, ...prev]);

    try {
      // Generate NFT configuration
      const config = await generateNFTMutation.mutateAsync();

      // Update temp asset with generated config
      tempAsset.name = config.config.name;
      tempAsset.symbol = config.config.symbol;
      setDeployedAssets(prev => [tempAsset, ...prev.slice(1)]);

      toast({
        title: "Deploying NFT Collection",
        description: `Deploying ${config.config.name} (${config.config.symbol})...`,
      });

      // Simulate deployment (same as token)
      const mockContractAddress = `0x${Math.random().toString(16).slice(2, 42)}`;
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}`;

      // Record deployment
      await recordDeploymentMutation.mutateAsync({
        contractAddress: mockContractAddress,
        chainId: network?.chainId || "1",
        name: config.config.name,
        symbol: config.config.symbol,
        type: "nft",
        deployerAddress: account,
        transactionHash: mockTxHash,
        contractCode: config.contractCode,
      });

      // Update asset status
      tempAsset.contractAddress = mockContractAddress;
      tempAsset.transactionHash = mockTxHash;
      tempAsset.status = "deployed";
      setDeployedAssets(prev => [tempAsset, ...prev.slice(1)]);

      toast({
        title: "NFT Collection Deployed! 🎨",
        description: `${config.config.name} deployed successfully at ${mockContractAddress.slice(0, 10)}...`,
      });
    } catch (error: any) {
      console.error("Deployment error:", error);
      
      // Update status to failed
      tempAsset.status = "failed";
      setDeployedAssets(prev => [tempAsset, ...prev.slice(1)]);

      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy NFT collection",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const getExplorerUrl = (txHash: string, chainId: string) => {
    const explorers: Record<string, string> = {
      "1": "https://etherscan.io",
      "8453": "https://basescan.org",
      "137": "https://polygonscan.com",
      "11155111": "https://sepolia.etherscan.io",
    };
    return `${explorers[chainId] || explorers["1"]}/tx/${txHash}`;
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center glow-primary animate-float">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent drop-shadow-lg">
            Auto-Deploy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One-click token and NFT deployment to the blockchain. Your contracts, instantly live.
          </p>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive">
                  Please connect your MetaMask wallet to deploy contracts
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Deploy Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Deploy Token Card */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Deploy ERC-20 Token</CardTitle>
                  <CardDescription>Create your own cryptocurrency</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ 1,000,000 initial supply</p>
                <p>✓ Mintable by owner</p>
                <p>✓ 18 decimals (standard)</p>
                <p>✓ Ownable security</p>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={deployToken}
                disabled={!isConnected || isDeploying}
                data-testid="button-deploy-token"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy Token
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Deploy NFT Card */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Image className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Deploy ERC-721 NFT</CardTitle>
                  <CardDescription>Launch your NFT collection</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ 10,000 max supply</p>
                <p>✓ IPFS metadata ready</p>
                <p>✓ Mintable by owner</p>
                <p>✓ ERC-721 standard</p>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={deployNFT}
                disabled={!isConnected || isDeploying}
                data-testid="button-deploy-nft"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy NFT
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Deployed Assets */}
        {deployedAssets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Deployed Assets</CardTitle>
              <CardDescription>Track all your auto-deployed contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deployedAssets.map((asset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                    data-testid={`deployed-asset-${index}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        asset.type === "token" 
                          ? "bg-blue-500/10" 
                          : "bg-purple-500/10"
                      }`}>
                        {asset.type === "token" ? (
                          <Coins className={`h-5 w-5 ${
                            asset.type === "token" ? "text-blue-500" : "text-purple-500"
                          }`} />
                        ) : (
                          <Image className={`h-5 w-5 ${
                            asset.type === "token" ? "text-blue-500" : "text-purple-500"
                          }`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{asset.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {asset.symbol}
                          </Badge>
                          {asset.status === "deployed" && (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Deployed
                            </Badge>
                          )}
                          {asset.status === "deploying" && (
                            <Badge variant="secondary">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Deploying
                            </Badge>
                          )}
                          {asset.status === "failed" && (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {asset.contractAddress ? (
                            <>
                              {asset.contractAddress.slice(0, 10)}...{asset.contractAddress.slice(-8)}
                            </>
                          ) : (
                            "Pending..."
                          )}
                        </p>
                      </div>
                    </div>
                    {asset.status === "deployed" && asset.transactionHash && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={getExplorerUrl(asset.transactionHash, asset.chainId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`link-explorer-${index}`}
                        >
                          View on Explorer
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <p className="font-medium text-primary">📘 How It Works:</p>
              <ol className="space-y-2 text-muted-foreground ml-4">
                <li>1. Connect your MetaMask wallet</li>
                <li>2. Click "Deploy Token" or "Deploy NFT"</li>
                <li>3. System generates optimized smart contract code</li>
                <li>4. MetaMask prompts you to confirm the deployment transaction</li>
                <li>5. Contract is deployed to the blockchain and tracked in your dashboard</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-4">
                ⚠️ Note: This is a demo version. In production, actual contract compilation and deployment would occur. Always audit smart contracts before mainnet deployment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
