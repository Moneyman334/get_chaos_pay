import { 
  InsertNftCollection, 
  InsertNft, 
  InsertNftOwnership,
  type Nft,
  type NftCollection,
  type NftOwnership
} from "@shared/schema";
import { storage } from "./storage";

// Provider interfaces for different NFT APIs
interface NFTProvider {
  name: string;
  fetchNFTsByOwner(walletAddress: string, chainId: string, cursor?: string): Promise<NFTProviderResponse>;
  fetchNFTMetadata(contractAddress: string, tokenId: string, chainId: string): Promise<NFTMetadata | null>;
  isAvailable(): boolean;
}

interface NFTProviderResponse {
  nfts: NFTMetadata[];
  nextCursor?: string;
  hasMore: boolean;
}

interface NFTMetadata {
  chainId: string;
  contractAddress: string;
  tokenId: string;
  standard: 'ERC721' | 'ERC1155';
  name?: string;
  description?: string;
  imageUrl?: string;
  imageThumbnailUrl?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  metadata?: any;
  tokenUri?: string;
  collection?: {
    name: string;
    slug?: string;
    symbol?: string;
    imageUrl?: string;
    bannerImageUrl?: string;
    description?: string;
    externalUrl?: string;
    isVerified?: boolean;
    totalSupply?: string;
    floorPrice?: string;
    contractStandard?: string;
  };
  balance?: string;
}

// Fallback provider for when external APIs are unavailable  
class FallbackNFTProvider implements NFTProvider {
  name = "FallbackProvider";

  isAvailable(): boolean {
    return false; // Never available - forces explicit provider configuration
  }

  async fetchNFTsByOwner(walletAddress: string, chainId: string, cursor?: string): Promise<NFTProviderResponse> {
    // This should never be called if isAvailable() returns false
    throw new Error('NFT provider not configured. Please set MORALIS_API_KEY or OPENSEA_API_KEY environment variable.');
    
    return {
      nfts: [],
      hasMore: false,
      nextCursor: undefined
    };
    
    // Legacy mock data (commented out for production)
    /*
    const mockNFTs: NFTMetadata[] = [
      {
        chainId,
        contractAddress: "0x123456789",
        tokenId: "1",
        standard: "ERC721",
        name: "Cool Cat #1",
        description: "A cool cat NFT from the popular collection",
        imageUrl: "https://picsum.photos/400/400?random=1",
        imageThumbnailUrl: "https://picsum.photos/200/200?random=1",
        attributes: [
          { trait_type: "Background", value: "Blue" },
          { trait_type: "Body", value: "Cat" },
          { trait_type: "Eyes", value: "Green" },
          { trait_type: "Rarity", value: "Common" }
        ],
        collection: {
          name: "Cool Cats",
          slug: "cool-cats",
          symbol: "COOL",
          imageUrl: "https://picsum.photos/300/300?random=10",
          description: "Cool Cats is a collection of 9,999 randomly generated NFTs",
          isVerified: true,
          contractStandard: "ERC721"
        },
        balance: "1"
      },
      {
        chainId,
        contractAddress: "0x987654321",
        tokenId: "42",
        standard: "ERC721",
        name: "Bored Ape #42",
        description: "A bored ape from the exclusive club",
        imageUrl: "https://picsum.photos/400/400?random=2",
        imageThumbnailUrl: "https://picsum.photos/200/200?random=2",
        attributes: [
          { trait_type: "Background", value: "Yellow" },
          { trait_type: "Fur", value: "Brown" },
          { trait_type: "Eyes", value: "Laser" },
          { trait_type: "Rarity", value: "Rare" }
        ],
        collection: {
          name: "Bored Ape Yacht Club",
          slug: "bored-ape-yacht-club",
          symbol: "BAYC",
          imageUrl: "https://picsum.photos/300/300?random=11",
          description: "The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs",
          isVerified: true,
          contractStandard: "ERC721"
        },
        balance: "1"
      },
      {
        chainId,
        contractAddress: "0x456789123",
        tokenId: "7",
        standard: "ERC1155",
        name: "Gaming Item #7",
        description: "A powerful sword for your avatar",
        imageUrl: "https://picsum.photos/400/400?random=3",
        imageThumbnailUrl: "https://picsum.photos/200/200?random=3",
        attributes: [
          { trait_type: "Type", value: "Weapon" },
          { trait_type: "Damage", value: "150" },
          { trait_type: "Durability", value: "98" },
          { trait_type: "Rarity", value: "Epic" }
        ],
        collection: {
          name: "Gaming Items",
          slug: "gaming-items",
          symbol: "GAME",
          imageUrl: "https://picsum.photos/300/300?random=12",
          description: "Essential items for the metaverse gaming experience",
          isVerified: false,
          contractStandard: "ERC1155"
        },
        balance: "3"
      }
    ];

    // Simulate pagination
    const pageSize = 25;
    const page = cursor ? parseInt(cursor) : 0;
    const start = page * pageSize;
    const end = start + pageSize;
    const paginatedNFTs = mockNFTs.slice(start, end);

    return {
      nfts: paginatedNFTs,
      nextCursor: end < mockNFTs.length ? (page + 1).toString() : undefined,
      hasMore: end < mockNFTs.length
    };
    */
  }

  async fetchNFTMetadata(contractAddress: string, tokenId: string, chainId: string): Promise<NFTMetadata | null> {
    // This should never be called if isAvailable() returns false
    throw new Error('NFT provider not configured. Please set MORALIS_API_KEY or OPENSEA_API_KEY environment variable.');
    
    return null;
    
    // Legacy mock metadata (commented out for production)
    /*
    return {
      chainId,
      contractAddress,
      tokenId,
      standard: "ERC721",
      name: `NFT #${tokenId}`,
      description: "A sample NFT for testing",
      imageUrl: `https://picsum.photos/400/400?random=${tokenId}`,
      imageThumbnailUrl: `https://picsum.photos/200/200?random=${tokenId}`,
      attributes: [
        { trait_type: "Type", value: "Test" },
        { trait_type: "ID", value: tokenId }
      ],
      collection: {
        name: "Test Collection",
        symbol: "TEST",
        contractStandard: "ERC721"
      },
      balance: "1"
    };
    */
  }
}

// Moralis API Provider - Production Ready Implementation
class MoralisProvider implements NFTProvider {
  name = "Moralis";
  private apiKey: string;
  private baseUrl = "https://deep-index.moralis.io/api/v2.2";

  constructor() {
    this.apiKey = process.env.MORALIS_API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async fetchNFTsByOwner(walletAddress: string, chainId: string, cursor?: string): Promise<NFTProviderResponse> {
    if (!this.isAvailable()) {
      console.warn("Moralis API key not configured - unable to fetch real NFT data");
      throw new Error("Moralis API key not configured. Please set MORALIS_API_KEY environment variable.");
    }

    // Complete chainId to Moralis format mapping for all supported chains
    const chainMapping: Record<string, string> = {
      "0x1": "eth",        // Ethereum Mainnet
      "0x89": "polygon",   // Polygon
      "0x38": "bsc",       // Binance Smart Chain
      "0xa4b1": "arbitrum", // Arbitrum One
      "0xa": "optimism",   // Optimism
      "0x2105": "base",    // Base
      "0x8453": "base",    // Base (alternative ID)
      "0xa86a": "avalanche", // Avalanche C-Chain
      "0xfa": "fantom",    // Fantom Opera
      "0x19": "cronos"      // Cronos
    };

    const chain = chainMapping[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    try {
      const url = new URL(`${this.baseUrl}/${walletAddress}/nft`);
      url.searchParams.set("chain", chain);
      url.searchParams.set("format", "decimal");
      url.searchParams.set("normalizeMetadata", "true");
      url.searchParams.set("media_items", "true");
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }

      const response = await fetch(url.toString(), {
        headers: {
          "X-API-Key": this.apiKey,
          "accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Moralis API error: ${response.status}`);
      }

      const data = await response.json();
      
      const nfts: NFTMetadata[] = data.result?.map((item: any) => this.normalizeNFTData(item, chainId)) || [];

      return {
        nfts,
        nextCursor: data.cursor,
        hasMore: !!data.cursor
      };
    } catch (error) {
      console.error("Moralis fetch error:", error);
      throw error;
    }
  }

  async fetchNFTMetadata(contractAddress: string, tokenId: string, chainId: string): Promise<NFTMetadata | null> {
    if (!this.isAvailable()) {
      console.warn("Moralis API key not configured - unable to fetch NFT metadata");
      return null;
    }

    // Complete chainId to Moralis format mapping for all supported chains
    const chainMapping: Record<string, string> = {
      "0x1": "eth",        // Ethereum Mainnet
      "0x89": "polygon",   // Polygon
      "0x38": "bsc",       // Binance Smart Chain
      "0xa4b1": "arbitrum", // Arbitrum One
      "0xa": "optimism",   // Optimism
      "0x2105": "base",    // Base
      "0x8453": "base",    // Base (alternative ID)
      "0xa86a": "avalanche", // Avalanche C-Chain
      "0xfa": "fantom",    // Fantom Opera
      "0x19": "cronos"      // Cronos
    };

    const chain = chainMapping[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    try {
      const url = new URL(`${this.baseUrl}/nft/${contractAddress}/${tokenId}`);
      url.searchParams.set("chain", chain);
      url.searchParams.set("format", "decimal");
      url.searchParams.set("normalizeMetadata", "true");
      url.searchParams.set("media_items", "true");

      const response = await fetch(url.toString(), {
        headers: {
          "X-API-Key": this.apiKey,
          "accept": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // NFT not found
        }
        throw new Error(`Moralis API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeNFTData(data, chainId);
    } catch (error) {
      console.error("Moralis fetch NFT metadata error:", error);
      return null;
    }
  }

  private normalizeNFTData(item: any, chainId: string): NFTMetadata {
    const metadata = item.normalized_metadata || {};
    const mediaItems = item.media?.media_collection?.high || item.media?.media_collection?.medium || {};

    return {
      chainId,
      contractAddress: item.token_address,
      tokenId: item.token_id,
      standard: item.contract_type === "ERC1155" ? "ERC1155" : "ERC721",
      name: metadata.name || item.name || `${item.symbol} #${item.token_id}`,
      description: metadata.description,
      imageUrl: mediaItems.url || metadata.image,
      imageThumbnailUrl: mediaItems.url || metadata.image,
      animationUrl: metadata.animation_url,
      externalUrl: metadata.external_url,
      attributes: metadata.attributes || [],
      metadata: metadata,
      tokenUri: item.token_uri,
      balance: item.amount || "1"
    };
  }
}

// OpenSea API Provider (implementation placeholder)
class OpenSeaProvider implements NFTProvider {
  name = "OpenSea";
  private apiKey: string;
  private baseUrl = "https://api.opensea.io/v2";

  constructor() {
    this.apiKey = process.env.OPENSEA_API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async fetchNFTsByOwner(walletAddress: string, chainId: string, cursor?: string): Promise<NFTProviderResponse> {
    // OpenSea implementation placeholder
    return { nfts: [], hasMore: false };
  }

  async fetchNFTMetadata(contractAddress: string, tokenId: string, chainId: string): Promise<NFTMetadata | null> {
    // OpenSea implementation placeholder
    return null;
  }
}

// Main NFT Service Class
export class NFTService {
  private providers: NFTProvider[];
  private defaultProvider: NFTProvider;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly CACHE_TTL_HOURS = 24;

  constructor() {
    this.providers = [
      new MoralisProvider(),
      new OpenSeaProvider(),
      new FallbackNFTProvider() // Throws error if used (never available)
    ];
    
    // Use first available provider as default
    const availableProvider = this.providers.find(p => p.isAvailable());
    
    if (!availableProvider) {
      console.warn(`\n⚠️  NFT Service Configuration Warning:\n` +
        `   No NFT providers are configured!\n` +
        `   To enable real NFT data fetching, please:\n` +
        `   1. Sign up for a Moralis account at https://moralis.io\n` +
        `   2. Get your API key from the Moralis dashboard\n` +
        `   3. Set the MORALIS_API_KEY environment variable\n` +
        `   NFT features will only show cached data until a provider is configured.\n`);
      
      // Use fallback provider (will throw errors when called)
      this.defaultProvider = this.providers[this.providers.length - 1];
    } else {
      this.defaultProvider = availableProvider;
      console.log(`NFT Service initialized with provider: ${this.defaultProvider.name}`);
    }
    
    // Start cache cleanup interval
    this.startCacheCleanup();
  }
  
  private startCacheCleanup() {
    // Clean expired cache entries every hour
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of Array.from(this.cache.entries())) {
        if (now > value.timestamp + value.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60 * 60 * 1000); // 1 hour
  }
  
  private getCacheKey(walletAddress: string, chainIds: string[], options: any): string {
    const optionsStr = JSON.stringify({
      collection: options.collection,
      search: options.search,
      page: options.page,
      limit: options.limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder
    });
    return `nfts:${walletAddress}:${chainIds.sort().join(',')}:${optionsStr}`;
  }
  
  private getCachedData(cacheKey: string, maxAgeHours: number): any | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    const ageMs = Date.now() - cached.timestamp;
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    if (ageMs > maxAgeMs) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }
  
  private setCachedData(cacheKey: string, data: any, ttlHours: number = this.CACHE_TTL_HOURS): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttlHours * 60 * 60 * 1000
    });
  }

  // Main method to fetch and cache NFTs for a wallet
  async fetchNFTsForWallet(
    walletAddress: string, 
    chainIds: string[], 
    options: {
      forceRefresh?: boolean;
      maxAge?: number; // hours
      page?: number;
      limit?: number;
      // Filtering options
      collection?: string;
      search?: string;
      sortBy?: 'name' | 'collection' | 'acquired';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    nfts: (NftOwnership & { nft: Nft; collection: NftCollection | null })[];
    collections: NftCollection[];
    stats: any;
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    const { 
      forceRefresh = false, 
      maxAge = 24, 
      page = 1, 
      limit = 25,
      collection,
      search,
      sortBy = 'acquired',
      sortOrder = 'desc'
    } = options;
    
    // Create cache key for this request
    const cacheKey = this.getCacheKey(walletAddress, chainIds, { collection, search, page, limit, sortBy, sortOrder });
    
    // First try to get cached data
    if (!forceRefresh) {
      const cachedResult = this.getCachedData(cacheKey, maxAge);
      if (cachedResult) {
        console.log(`Using cached NFT data (cache key: ${cacheKey})`);
        return cachedResult;
      }
    }

    // Fetch fresh data from providers
    console.log(`Fetching fresh NFT data for ${walletAddress} on chains: ${chainIds.join(', ')}`);
    
    const allNFTs: NFTMetadata[] = [];
    const allCollections = new Map<string, InsertNftCollection>();

    for (const chainId of chainIds) {
      try {
        const response = await this.defaultProvider.fetchNFTsByOwner(walletAddress, chainId);
        allNFTs.push(...response.nfts);

        // Extract collections
        response.nfts.forEach(nft => {
          if (nft.collection) {
            const collectionKey = `${chainId}-${nft.contractAddress}`;
            if (!allCollections.has(collectionKey)) {
              allCollections.set(collectionKey, {
                chainId: nft.chainId,
                contractAddress: nft.contractAddress,
                name: nft.collection.name,
                slug: nft.collection.slug,
                symbol: nft.collection.symbol,
                imageUrl: nft.collection.imageUrl,
                bannerImageUrl: nft.collection.bannerImageUrl,
                description: nft.collection.description,
                externalUrl: nft.collection.externalUrl,
                isVerified: nft.collection.isVerified ? "true" : "false",
                totalSupply: nft.collection.totalSupply,
                floorPrice: nft.collection.floorPrice,
                contractStandard: nft.collection.contractStandard || "ERC721"
              });
            }
          }
        });
      } catch (error) {
        console.error(`Failed to fetch NFTs for chain ${chainId}:`, error);
        
        // If it's a Moralis configuration error, provide helpful guidance
        if (error instanceof Error && error.message.includes('Moralis API key not configured')) {
          console.warn(`\n🔧 NFT Service Configuration Required:\n` +
            `   To enable real NFT data fetching, please:\n` +
            `   1. Sign up for a Moralis account at https://moralis.io\n` +
            `   2. Get your API key from the Moralis dashboard\n` +
            `   3. Set the MORALIS_API_KEY environment variable\n` +
            `   Currently using fallback provider with empty results.\n`);
        }
        
        // Continue with other chains
      }
    }

    // Store in database
    await this.storeNFTData(walletAddress, allNFTs, Array.from(allCollections.values()));

    // Get paginated results with filtering
    const result = await this.getCachedNFTs(walletAddress, chainIds, { 
      page, 
      limit, 
      collection, 
      search, 
      sortBy, 
      sortOrder 
    });
    
    // Cache the result
    this.setCachedData(cacheKey, result, maxAge);
    
    return result;
  }

  // Get cached NFTs from database
  private async getCachedNFTs(
    walletAddress: string, 
    chainIds: string[], 
    options: { 
      page: number; 
      limit: number;
      collection?: string;
      search?: string;
      sortBy?: 'name' | 'collection' | 'acquired';
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const { page, limit, collection, search, sortBy = 'acquired', sortOrder = 'desc' } = options;
    
    // Build storage filter options
    const storageFilters: any = {
      chainId: chainIds.length === 1 ? chainIds[0] : undefined,
      hidden: false
    };
    
    // Add collection filtering
    if (collection) {
      storageFilters.collectionId = collection;
      storageFilters.search = collection; // Also search by collection name
    }
    
    // Add search filtering
    if (search) {
      storageFilters.search = search;
    }
    
    // Storage-level pagination with sorting
    const storagePagination = {
      page,
      limit,
      sortBy,
      sortOrder
    };
    
    const ownerships = await storage.getNftOwnershipsByWallet(
      walletAddress,
      storageFilters,
      storagePagination
    );

    // Get associated NFTs and collections
    const enrichedOwnerships = [];
    for (const ownership of ownerships) {
      const nft = await storage.getNft(ownership.nftId);
      let collection = null;
      if (nft?.collectionId) {
        collection = await storage.getNftCollection(nft.collectionId);
      }

      enrichedOwnerships.push({
        ...ownership,
        nft: nft!,
        collection: collection || null
      });
    }

    const collections = await storage.getCollectionsByWallet(walletAddress);
    const stats = await storage.getNftStats(walletAddress);

    // Get total count for pagination metadata
    const totalOwnerships = await storage.getNftOwnershipsByWallet(
      walletAddress, 
      storageFilters, 
      { page: 1, limit: 999999, sortBy, sortOrder }
    );
    const total = totalOwnerships.length;

    return {
      nfts: enrichedOwnerships,
      collections,
      stats,
      pagination: {
        page,
        limit,
        total,
        hasMore: (page * limit) < total
      }
    };
  }

  // Store NFT data in database
  private async storeNFTData(
    walletAddress: string, 
    nfts: NFTMetadata[], 
    collections: InsertNftCollection[]
  ) {
    // Store collections first
    const collectionMap = new Map<string, string>(); // contractAddress -> collectionId
    
    for (const collection of collections) {
      try {
        const storedCollection = await storage.upsertNftCollection(collection);
        collectionMap.set(collection.contractAddress, storedCollection.id);
      } catch (error) {
        console.error("Failed to store collection:", error);
      }
    }

    // Store NFTs and ownerships
    for (const nft of nfts) {
      try {
        const collectionId = collectionMap.get(nft.contractAddress);
        
        const insertNft: InsertNft = {
          chainId: nft.chainId,
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          standard: nft.standard,
          name: nft.name,
          description: nft.description,
          imageUrl: nft.imageUrl,
          imageThumbnailUrl: nft.imageThumbnailUrl,
          animationUrl: nft.animationUrl,
          externalUrl: nft.externalUrl,
          attributes: nft.attributes || null,
          metadata: nft.metadata || null,
          tokenUri: nft.tokenUri,
          collectionId
        };

        const storedNft = await storage.upsertNft(insertNft);

        const insertOwnership: InsertNftOwnership = {
          walletAddress,
          nftId: storedNft.id,
          balance: nft.balance || "1",
          chainId: nft.chainId,
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          isHidden: "false"
        };

        await storage.upsertNftOwnership(insertOwnership);
      } catch (error) {
        console.error("Failed to store NFT:", error);
      }
    }
  }

  // Refresh metadata for a specific NFT
  async refreshNFTMetadata(contractAddress: string, tokenId: string, chainId: string): Promise<Nft | null> {
    try {
      const metadata = await this.defaultProvider.fetchNFTMetadata(contractAddress, tokenId, chainId);
      if (!metadata) return null;

      const insertNft: InsertNft = {
        chainId: metadata.chainId,
        contractAddress: metadata.contractAddress,
        tokenId: metadata.tokenId,
        standard: metadata.standard,
        name: metadata.name,
        description: metadata.description,
        imageUrl: metadata.imageUrl,
        imageThumbnailUrl: metadata.imageThumbnailUrl,
        animationUrl: metadata.animationUrl,
        externalUrl: metadata.externalUrl,
        attributes: metadata.attributes || null,
        metadata: metadata.metadata || null,
        tokenUri: metadata.tokenUri
      };

      return await storage.upsertNft(insertNft);
    } catch (error) {
      console.error("Failed to refresh NFT metadata:", error);
      return null;
    }
  }

  // Utility method to resolve IPFS URIs
  static resolveIPFSUri(uri: string): string {
    if (!uri) return "";
    
    if (uri.startsWith("ipfs://")) {
      return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    
    if (uri.startsWith("ar://")) {
      return uri.replace("ar://", "https://arweave.net/");
    }
    
    return uri;
  }

  // Sanitize metadata to prevent XSS
  static sanitizeMetadata(metadata: any): any {
    if (!metadata) return null;
    
    const sanitized = { ...metadata };
    
    // Remove potentially dangerous fields
    delete sanitized.scripts;
    delete sanitized.javascript;
    delete sanitized.html;
    
    // Sanitize string fields
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    });
    
    return sanitized;
  }
}

// Export singleton instance
export const nftService = new NFTService();