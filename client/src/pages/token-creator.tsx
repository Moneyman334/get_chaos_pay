import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, Rocket, Code, Shield, Users, Zap } from "lucide-react";

interface TokenConfig {
  name: string;
  symbol: string;
  initialSupply: string;
  decimals: string;
  network: string;
  features: string[];
}

export default function TokenCreatorPage() {
  const { toast } = useToast();
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    name: "",
    symbol: "",
    initialSupply: "1000000",
    decimals: "18",
    network: "ethereum",
    features: []
  });

  const networks = [
    { id: "ethereum", name: "Ethereum Mainnet", chainId: "1", icon: "⟠" },
    { id: "polygon", name: "Polygon", chainId: "137", icon: "⬡" },
    { id: "bsc", name: "BSC", chainId: "56", icon: "🔶" },
    { id: "arbitrum", name: "Arbitrum", chainId: "42161", icon: "🔷" },
    { id: "optimism", name: "Optimism", chainId: "10", icon: "🔴" },
  ];

  const tokenFeatures = [
    { id: "mintable", label: "Mintable", description: "Create new tokens after deployment", icon: Zap },
    { id: "burnable", label: "Burnable", description: "Destroy tokens to reduce supply", icon: Shield },
    { id: "pausable", label: "Pausable", description: "Pause all token transfers", icon: Users },
  ];

  const toggleFeature = (featureId: string) => {
    setTokenConfig(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const generateSmartContract = () => {
    const features = tokenConfig.features;
    const hasFeatures = features.length > 0;
    
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
${features.includes('burnable') ? 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";' : ''}
${features.includes('pausable') ? 'import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";' : ''}
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${tokenConfig.symbol || 'MyToken'} is ERC20${features.includes('burnable') ? ', ERC20Burnable' : ''}${features.includes('pausable') ? ', ERC20Pausable' : ''}, Ownable {
    constructor(address initialOwner)
        ERC20("${tokenConfig.name || 'My Token'}", "${tokenConfig.symbol || 'MTK'}")
        Ownable(initialOwner)
    {
        _mint(msg.sender, ${tokenConfig.initialSupply || '1000000'} * 10 ** decimals());
    }
${features.includes('mintable') ? `
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }` : ''}
${features.includes('pausable') ? `
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }` : ''}
}`;
  };

  const handleDeploy = () => {
    if (!tokenConfig.name || !tokenConfig.symbol) {
      toast({
        title: "Missing Information",
        description: "Please fill in token name and symbol",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Token Deployment Guide",
      description: "Follow the instructions below to deploy your token using Remix IDE",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Smart contract code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-token-creator-title">
            Token Creator
          </h1>
          <p className="text-muted-foreground">Deploy your own ERC-20 cryptocurrency</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Token Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Configuration</CardTitle>
              <CardDescription>
                Configure your token's basic properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-name">Token Name</Label>
                <Input
                  id="token-name"
                  placeholder="e.g., Casino Chip Token"
                  value={tokenConfig.name}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, name: e.target.value })}
                  data-testid="input-token-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token-symbol">Token Symbol</Label>
                <Input
                  id="token-symbol"
                  placeholder="e.g., CCT"
                  value={tokenConfig.symbol}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, symbol: e.target.value.toUpperCase() })}
                  data-testid="input-token-symbol"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial-supply">Initial Supply</Label>
                <Input
                  id="initial-supply"
                  type="number"
                  placeholder="1000000"
                  value={tokenConfig.initialSupply}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, initialSupply: e.target.value })}
                  data-testid="input-initial-supply"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="decimals">Decimals</Label>
                <Input
                  id="decimals"
                  type="number"
                  placeholder="18"
                  value={tokenConfig.decimals}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, decimals: e.target.value })}
                  data-testid="input-decimals"
                />
              </div>

              <div className="space-y-2">
                <Label>Deployment Network</Label>
                <Select value={tokenConfig.network} onValueChange={(value) => setTokenConfig({ ...tokenConfig, network: value })}>
                  <SelectTrigger data-testid="select-network">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network) => (
                      <SelectItem key={network.id} value={network.id}>
                        <div className="flex items-center gap-2">
                          <span>{network.icon}</span>
                          <span>{network.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Features</CardTitle>
              <CardDescription>
                Select advanced features for your token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tokenFeatures.map((feature) => {
                const Icon = feature.icon;
                const isSelected = tokenConfig.features.includes(feature.id);
                return (
                  <div
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                    `}
                    data-testid={`feature-${feature.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{feature.label}</h4>
                          {isSelected && <Badge>Selected</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Smart Contract Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Smart Contract Code
              </CardTitle>
              <CardDescription>
                OpenZeppelin ERC-20 implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={generateSmartContract()}
                readOnly
                className="font-mono text-xs h-96"
                data-testid="contract-code"
              />
              <Button
                onClick={() => copyToClipboard(generateSmartContract())}
                variant="outline"
                className="w-full"
                data-testid="button-copy-contract"
              >
                Copy Contract Code
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">1</Badge>
                  <span>Copy the smart contract code above</span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">2</Badge>
                  <span>Open <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">Remix IDE</a></span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">3</Badge>
                  <span>Create a new Solidity file and paste the code</span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">4</Badge>
                  <span>Compile the contract (Solidity 0.8.20)</span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">5</Badge>
                  <span>Connect MetaMask to {networks.find(n => n.id === tokenConfig.network)?.name}</span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">6</Badge>
                  <span>Deploy and enter your wallet address as initialOwner</span>
                </li>
              </ol>
              <Button
                onClick={handleDeploy}
                className="w-full mt-4"
                data-testid="button-deploy-token"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Deploy Token
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Token Preview */}
      {tokenConfig.name && tokenConfig.symbol && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Token Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{tokenConfig.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Symbol</p>
                <p className="font-semibold">{tokenConfig.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Initial Supply</p>
                <p className="font-semibold">{parseInt(tokenConfig.initialSupply).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="font-semibold">{networks.find(n => n.id === tokenConfig.network)?.name}</p>
              </div>
            </div>
            {tokenConfig.features.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Features</p>
                <div className="flex gap-2">
                  {tokenConfig.features.map(f => (
                    <Badge key={f} variant="secondary">
                      {tokenFeatures.find(tf => tf.id === f)?.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
