import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Palette, Image, Code, Rocket, Shield, Users } from "lucide-react";

interface NFTConfig {
  name: string;
  symbol: string;
  description: string;
  maxSupply: string;
  network: string;
  standard: string;
  baseUri: string;
}

export default function NFTCreatorPage() {
  const { toast } = useToast();
  const [nftConfig, setNFTConfig] = useState<NFTConfig>({
    name: "",
    symbol: "",
    description: "",
    maxSupply: "10000",
    network: "ethereum",
    standard: "erc721",
    baseUri: "ipfs://YOUR_CID/"
  });

  const networks = [
    { id: "ethereum", name: "Ethereum Mainnet", chainId: "1", icon: "⟠" },
    { id: "polygon", name: "Polygon", chainId: "137", icon: "⬡" },
    { id: "bsc", name: "BSC", chainId: "56", icon: "🔶" },
    { id: "arbitrum", name: "Arbitrum", chainId: "42161", icon: "🔷" },
    { id: "optimism", name: "Optimism", chainId: "10", icon: "🔴" },
  ];

  const nftStandards = [
    { id: "erc721", name: "ERC-721", description: "Standard NFT - One per address", icon: Image },
    { id: "erc721a", name: "ERC-721A", description: "Gas-optimized for batch minting", icon: Palette },
    { id: "erc1155", name: "ERC-1155", description: "Multi-token standard - Gaming", icon: Users },
  ];

  const generateSmartContract = () => {
    if (nftConfig.standard === "erc721") {
      return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${nftConfig.symbol || 'MyNFT'} is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public maxSupply = ${nftConfig.maxSupply || '10000'};
    string private _baseTokenURI;

    constructor(address initialOwner)
        ERC721("${nftConfig.name || 'My NFT Collection'}", "${nftConfig.symbol || 'MNFT'}")
        Ownable(initialOwner)
    {
        _baseTokenURI = "${nftConfig.baseUri || 'ipfs://YOUR_CID/'}";
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function mint(address to) public onlyOwner {
        require(_nextTokenId < maxSupply, "Max supply reached");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function batchMint(address to, uint256 quantity) public onlyOwner {
        require(_nextTokenId + quantity <= maxSupply, "Exceeds max supply");
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(to, _nextTokenId++);
        }
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`;
    } else if (nftConfig.standard === "erc1155") {
      return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${nftConfig.symbol || 'MyNFT'} is ERC1155, Ownable {
    uint256 public constant MAX_SUPPLY = ${nftConfig.maxSupply || '10000'};
    uint256 private _currentTokenId = 0;

    constructor(address initialOwner)
        ERC1155("${nftConfig.baseUri || 'ipfs://YOUR_CID/'}")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) public onlyOwner {
        require(_currentTokenId < MAX_SUPPLY, "Max supply reached");
        _mint(to, _currentTokenId, amount, "");
        _currentTokenId++;
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts) public onlyOwner {
        _mintBatch(to, ids, amounts, "");
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}`;
    }
    return "// Select a standard to generate contract code";
  };

  const handleDeploy = () => {
    if (!nftConfig.name || !nftConfig.symbol) {
      toast({
        title: "Missing Information",
        description: "Please fill in collection name and symbol",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "NFT Deployment Guide",
      description: "Follow the instructions to deploy your NFT collection",
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
          <Palette className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-nft-creator-title">
            NFT Creator
          </h1>
          <p className="text-muted-foreground">Deploy your own NFT collection</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* NFT Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Collection Configuration</CardTitle>
              <CardDescription>
                Configure your NFT collection properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nft-name">Collection Name</Label>
                <Input
                  id="nft-name"
                  placeholder="e.g., Casino VIP Cards"
                  value={nftConfig.name}
                  onChange={(e) => setNFTConfig({ ...nftConfig, name: e.target.value })}
                  data-testid="input-nft-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nft-symbol">Collection Symbol</Label>
                <Input
                  id="nft-symbol"
                  placeholder="e.g., CVIP"
                  value={nftConfig.symbol}
                  onChange={(e) => setNFTConfig({ ...nftConfig, symbol: e.target.value.toUpperCase() })}
                  data-testid="input-nft-symbol"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your NFT collection..."
                  value={nftConfig.description}
                  onChange={(e) => setNFTConfig({ ...nftConfig, description: e.target.value })}
                  data-testid="input-nft-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-supply">Max Supply</Label>
                <Input
                  id="max-supply"
                  type="number"
                  placeholder="10000"
                  value={nftConfig.maxSupply}
                  onChange={(e) => setNFTConfig({ ...nftConfig, maxSupply: e.target.value })}
                  data-testid="input-max-supply"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base-uri">Base URI (IPFS)</Label>
                <Input
                  id="base-uri"
                  placeholder="ipfs://YOUR_CID/"
                  value={nftConfig.baseUri}
                  onChange={(e) => setNFTConfig({ ...nftConfig, baseUri: e.target.value })}
                  data-testid="input-base-uri"
                />
                <p className="text-xs text-muted-foreground">
                  Upload your NFT metadata to IPFS using NFT.Storage or Pinata
                </p>
              </div>

              <div className="space-y-2">
                <Label>Deployment Network</Label>
                <Select value={nftConfig.network} onValueChange={(value) => setNFTConfig({ ...nftConfig, network: value })}>
                  <SelectTrigger data-testid="select-nft-network">
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
              <CardTitle>NFT Standard</CardTitle>
              <CardDescription>
                Choose the token standard for your collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {nftStandards.map((standard) => {
                const Icon = standard.icon;
                const isSelected = nftConfig.standard === standard.id;
                return (
                  <div
                    key={standard.id}
                    onClick={() => setNFTConfig({ ...nftConfig, standard: standard.id })}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                    `}
                    data-testid={`standard-${standard.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{standard.name}</h4>
                          {isSelected && <Badge>Selected</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{standard.description}</p>
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
                OpenZeppelin {nftStandards.find(s => s.id === nftConfig.standard)?.name} implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={generateSmartContract()}
                readOnly
                className="font-mono text-xs h-96"
                data-testid="nft-contract-code"
              />
              <Button
                onClick={() => copyToClipboard(generateSmartContract())}
                variant="outline"
                className="w-full"
                data-testid="button-copy-nft-contract"
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
                  <span>Upload NFT images and metadata to IPFS (NFT.Storage or Pinata)</span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">2</Badge>
                  <span>Update Base URI above with your IPFS CID</span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">3</Badge>
                  <span>Copy the smart contract code</span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">4</Badge>
                  <span>Open <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">Remix IDE</a></span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">5</Badge>
                  <span>Deploy on {networks.find(n => n.id === nftConfig.network)?.name}</span>
                </li>
                <li className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">6</Badge>
                  <span>Start minting your NFTs!</span>
                </li>
              </ol>
              <Button
                onClick={handleDeploy}
                className="w-full mt-4"
                data-testid="button-deploy-nft"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Deploy NFT Collection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Collection Preview */}
      {nftConfig.name && nftConfig.symbol && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Collection Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{nftConfig.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Symbol</p>
                <p className="font-semibold">{nftConfig.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Supply</p>
                <p className="font-semibold">{parseInt(nftConfig.maxSupply).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Standard</p>
                <p className="font-semibold">{nftStandards.find(s => s.id === nftConfig.standard)?.name}</p>
              </div>
            </div>
            {nftConfig.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1">{nftConfig.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
