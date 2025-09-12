import { 
  getTokenMetadata, 
  getTokenBalance, 
  POPULAR_TOKENS, 
  TokenMetadata,
  formatTokenBalance,
  getNetworkByChainId 
} from '@/lib/web3';

export interface DetectedToken extends TokenMetadata {
  balance: string;
  formattedBalance: string;
  balanceInWei: string;
  chainId: string;
  isPopular: boolean;
  isCustom: boolean;
}

export interface TokenDetectionOptions {
  includeZeroBalances?: boolean;
  includeCustomTokens?: boolean;
  customTokenAddresses?: string[];
  maxConcurrentRequests?: number;
}

export class TokenDetectionService {
  private static instance: TokenDetectionService;
  private cache: Map<string, DetectedToken> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): TokenDetectionService {
    if (!TokenDetectionService.instance) {
      TokenDetectionService.instance = new TokenDetectionService();
    }
    return TokenDetectionService.instance;
  }

  /**
   * Auto-detect tokens for a wallet address on a specific chain
   */
  async detectTokensForWallet(
    walletAddress: string,
    chainId: string,
    options: TokenDetectionOptions = {}
  ): Promise<DetectedToken[]> {
    const {
      includeZeroBalances = false,
      includeCustomTokens = true,
      customTokenAddresses = [],
      maxConcurrentRequests = 10
    } = options;

    try {
      const network = getNetworkByChainId(chainId);
      if (!network) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      // Get popular tokens for this chain
      const popularTokens = POPULAR_TOKENS[chainId] || [];
      
      // Combine popular tokens with custom tokens
      const allTokenAddresses = [
        ...popularTokens.map(t => t.address),
        ...customTokenAddresses
      ];

      // Remove duplicates
      const uniqueAddresses = [...new Set(allTokenAddresses)];

      // Process tokens in batches to avoid overwhelming the network
      const detectedTokens: DetectedToken[] = [];
      
      for (let i = 0; i < uniqueAddresses.length; i += maxConcurrentRequests) {
        const batch = uniqueAddresses.slice(i, i + maxConcurrentRequests);
        
        const batchPromises = batch.map(address => 
          this.detectSingleToken(address, walletAddress, chainId, popularTokens)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const token = result.value;
            
            // Include token based on options
            const hasBalance = BigInt(token.balanceInWei) > 0n;
            const shouldInclude = hasBalance || includeZeroBalances;
            
            if (shouldInclude) {
              detectedTokens.push(token);
            }
          } else {
            console.warn(`Failed to detect token ${batch[index]}:`, result.status === 'rejected' ? result.reason : 'Unknown error');
          }
        });
      }

      // Sort by balance (descending) and then by symbol
      return detectedTokens.sort((a, b) => {
        const balanceA = BigInt(a.balanceInWei);
        const balanceB = BigInt(b.balanceInWei);
        
        if (balanceA !== balanceB) {
          return balanceA > balanceB ? -1 : 1;
        }
        
        return a.symbol.localeCompare(b.symbol);
      });

    } catch (error) {
      console.error('Failed to detect tokens:', error);
      return [];
    }
  }

  /**
   * Detect a single token and its balance
   */
  private async detectSingleToken(
    contractAddress: string,
    walletAddress: string,
    chainId: string,
    popularTokens: Array<{address: string, symbol: string, name: string}>
  ): Promise<DetectedToken | null> {
    try {
      const cacheKey = `${contractAddress}-${walletAddress}-${chainId}`;
      
      // Check cache first
      if (this.isCached(cacheKey)) {
        return this.cache.get(cacheKey) || null;
      }

      // Get token metadata and balance concurrently
      const [metadata, balanceInWei] = await Promise.all([
        getTokenMetadata(contractAddress),
        getTokenBalance(contractAddress, walletAddress)
      ]);

      if (!metadata) {
        return null;
      }

      // Check if this is a popular token
      const isPopular = popularTokens.some(t => 
        t.address.toLowerCase() === contractAddress.toLowerCase()
      );

      const detectedToken: DetectedToken = {
        ...metadata,
        balance: formatTokenBalance(balanceInWei, metadata.decimals, 6),
        formattedBalance: formatTokenBalance(balanceInWei, metadata.decimals, 4),
        balanceInWei,
        chainId,
        isPopular,
        isCustom: !isPopular
      };

      // Cache the result
      this.cache.set(cacheKey, detectedToken);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return detectedToken;

    } catch (error) {
      console.error(`Failed to detect token ${contractAddress}:`, error);
      return null;
    }
  }

  /**
   * Add a custom token by contract address
   */
  async addCustomToken(
    contractAddress: string,
    walletAddress: string,
    chainId: string
  ): Promise<DetectedToken | null> {
    try {
      // Validate contract address format
      if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid contract address format');
      }

      // Check if it's already a popular token
      const popularTokens = POPULAR_TOKENS[chainId] || [];
      const isPopular = popularTokens.some(t => 
        t.address.toLowerCase() === contractAddress.toLowerCase()
      );

      if (isPopular) {
        throw new Error('Token is already in the popular tokens list');
      }

      // Try to get token metadata to validate it's a real ERC-20 token
      const metadata = await getTokenMetadata(contractAddress);
      if (!metadata) {
        throw new Error('Unable to fetch token metadata. Please verify the contract address is a valid ERC-20 token.');
      }

      // Get current balance
      const balanceInWei = await getTokenBalance(contractAddress, walletAddress);

      const customToken: DetectedToken = {
        ...metadata,
        balance: formatTokenBalance(balanceInWei, metadata.decimals, 6),
        formattedBalance: formatTokenBalance(balanceInWei, metadata.decimals, 4),
        balanceInWei,
        chainId,
        isPopular: false,
        isCustom: true
      };

      // Cache the custom token
      const cacheKey = `${contractAddress}-${walletAddress}-${chainId}`;
      this.cache.set(cacheKey, customToken);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return customToken;

    } catch (error) {
      console.error('Failed to add custom token:', error);
      throw error;
    }
  }

  /**
   * Refresh token balances for a list of tokens
   */
  async refreshTokenBalances(
    tokens: DetectedToken[],
    walletAddress: string
  ): Promise<DetectedToken[]> {
    try {
      const refreshPromises = tokens.map(async (token) => {
        try {
          const balanceInWei = await getTokenBalance(token.address, walletAddress);
          
          return {
            ...token,
            balance: formatTokenBalance(balanceInWei, token.decimals, 6),
            formattedBalance: formatTokenBalance(balanceInWei, token.decimals, 4),
            balanceInWei
          };
        } catch (error) {
          console.error(`Failed to refresh balance for ${token.symbol}:`, error);
          return token; // Return original token if refresh fails
        }
      });

      const refreshedTokens = await Promise.all(refreshPromises);

      // Update cache
      refreshedTokens.forEach(token => {
        const cacheKey = `${token.address}-${walletAddress}-${token.chainId}`;
        this.cache.set(cacheKey, token);
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      });

      return refreshedTokens;

    } catch (error) {
      console.error('Failed to refresh token balances:', error);
      return tokens; // Return original tokens if refresh fails
    }
  }

  /**
   * Search for tokens by symbol or name
   */
  searchTokens(tokens: DetectedToken[], query: string): DetectedToken[] {
    if (!query.trim()) {
      return tokens;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(searchTerm) ||
      token.name.toLowerCase().includes(searchTerm) ||
      token.address.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get popular tokens for a specific chain
   */
  getPopularTokensForChain(chainId: string): Array<{address: string, symbol: string, name: string}> {
    return POPULAR_TOKENS[chainId] || [];
  }

  /**
   * Validate if an address could be a token contract
   */
  async validateTokenContract(contractAddress: string): Promise<boolean> {
    try {
      const metadata = await getTokenMetadata(contractAddress);
      return metadata !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache for a specific wallet or all cache
   */
  clearCache(walletAddress?: string): void {
    if (walletAddress) {
      // Clear cache for specific wallet
      for (const [key] of this.cache) {
        if (key.includes(walletAddress)) {
          this.cache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Check if a cache entry is still valid
   */
  private isCached(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      return false;
    }
    return this.cache.has(cacheKey);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry) {
      if (now > expiry) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; expiredEntries: number } {
    this.cleanupExpiredCache();
    return {
      size: this.cache.size,
      expiredEntries: 0 // After cleanup, there should be no expired entries
    };
  }
}

// Export singleton instance
export const tokenDetectionService = TokenDetectionService.getInstance();

// Utility functions for easy access
export async function detectTokensForWallet(
  walletAddress: string,
  chainId: string,
  options?: TokenDetectionOptions
): Promise<DetectedToken[]> {
  return tokenDetectionService.detectTokensForWallet(walletAddress, chainId, options);
}

export async function addCustomToken(
  contractAddress: string,
  walletAddress: string,
  chainId: string
): Promise<DetectedToken | null> {
  return tokenDetectionService.addCustomToken(contractAddress, walletAddress, chainId);
}

export async function refreshTokenBalances(
  tokens: DetectedToken[],
  walletAddress: string
): Promise<DetectedToken[]> {
  return tokenDetectionService.refreshTokenBalances(tokens, walletAddress);
}