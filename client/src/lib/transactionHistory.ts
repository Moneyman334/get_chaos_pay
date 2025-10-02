import { 
  getNetworkByChainId, 
  networks,
  formatTokenAmount,
  getBlockExplorerUrl,
  createWeb3Provider 
} from '@/lib/web3';
import { apiRequest } from '@/lib/queryClient';

export interface BlockchainTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  gas: string;
  isError: string;
  txreceipt_status: string;
  contractAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  transactionIndex: string;
  functionName?: string;
  methodId?: string;
}

export interface ProcessedTransaction {
  id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  gasPrice?: string;
  gasUsed?: string;
  fee?: string;
  status: 'pending' | 'confirmed' | 'failed';
  network: string;
  blockNumber?: string;
  timestamp: Date;
  type: 'sent' | 'received' | 'token_transfer' | 'contract_interaction';
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimals?: number;
  direction: 'incoming' | 'outgoing';
  explorerUrl: string;
  metadata?: any;
}

export interface TransactionHistoryOptions {
  page?: number;
  limit?: number;
  startBlock?: number;
  endBlock?: number;
  includeTokenTransfers?: boolean;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedTransactionHistory {
  transactions: ProcessedTransaction[];
  hasMore: boolean;
  totalCount: number;
  page: number;
  limit: number;
}

// Rate limiting configuration for different networks
const RATE_LIMITS = {
  ethereum: { requests: 5, window: 1000 }, // 5 requests per second
  polygon: { requests: 10, window: 1000 },
  bsc: { requests: 5, window: 1000 },
  default: { requests: 3, window: 1000 }
};

export class TransactionHistoryService {
  private static instance: TransactionHistoryService;
  private cache: Map<string, { data: ProcessedTransaction[]; timestamp: number }> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimiters: Map<string, { lastRequest: number; requests: number[] }> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for recent data

  static getInstance(): TransactionHistoryService {
    if (!TransactionHistoryService.instance) {
      TransactionHistoryService.instance = new TransactionHistoryService();
    }
    return TransactionHistoryService.instance;
  }

  /**
   * Fetch comprehensive transaction history for a wallet address
   */
  async getTransactionHistory(
    address: string,
    chainId: string,
    options: TransactionHistoryOptions = {}
  ): Promise<PaginatedTransactionHistory> {
    const {
      page = 1,
      limit = 25,
      includeTokenTransfers = true,
      sortOrder = 'desc'
    } = options;

    try {
      const network = getNetworkByChainId(chainId);
      if (!network) {
        throw new Error(`Unsupported network: ${chainId}`);
      }

      // Check cache first
      const cacheKey = `${address}-${chainId}-${page}-${limit}-${includeTokenTransfers}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return this.formatPaginatedResponse(cached, page, limit);
      }

      // Fetch both native and token transactions concurrently
      const [nativeTransactions, tokenTransactions] = await Promise.all([
        this.fetchNativeTransactions(address, chainId, options),
        includeTokenTransfers ? this.fetchTokenTransactions(address, chainId, options) : []
      ]);

      // Combine and process transactions
      const allTransactions = [...nativeTransactions, ...tokenTransactions];
      const processedTransactions = await this.processTransactions(allTransactions, address, chainId);

      // Sort by timestamp
      processedTransactions.sort((a, b) => {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timestampB - timestampA : timestampA - timestampB;
      });

      // Cache the results
      this.setCachedData(cacheKey, processedTransactions);

      // Store in database for persistence
      await this.storeTransactionsInDatabase(processedTransactions);

      return this.formatPaginatedResponse(processedTransactions, page, limit);

    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      
      // Fallback to database-stored transactions
      try {
        const storedTransactions = await this.getStoredTransactions(address);
        return this.formatPaginatedResponse(storedTransactions, page, limit);
      } catch (dbError) {
        console.error('Failed to fetch stored transactions:', dbError);
        return {
          transactions: [],
          hasMore: false,
          totalCount: 0,
          page,
          limit
        };
      }
    }
  }

  /**
   * Fetch native blockchain transactions (ETH, BNB, MATIC, etc.)
   */
  private async fetchNativeTransactions(
    address: string,
    chainId: string,
    options: TransactionHistoryOptions
  ): Promise<BlockchainTransaction[]> {
    const network = getNetworkByChainId(chainId);
    if (!network) return [];

    // Use etherscan-style APIs for most networks
    const apiUrls = this.getApiUrls(chainId);
    if (!apiUrls.main) {
      // Fallback to RPC if no explorer API
      return this.fetchTransactionsViaRPC(address, chainId, options);
    }

    await this.waitForRateLimit(chainId);

    try {
      const params = new URLSearchParams({
        module: 'account',
        action: 'txlist',
        address: address.toLowerCase(),
        startblock: (options.startBlock || 0).toString(),
        endblock: (options.endBlock || 99999999).toString(),
        page: (options.page || 1).toString(),
        offset: (options.limit || 25).toString(),
        sort: options.sortOrder || 'desc'
      });

      const response = await fetch(`${apiUrls.main}?${params}`);
      const data = await response.json();

      if (data.status === '1' && Array.isArray(data.result)) {
        return data.result;
      }

      return [];
    } catch (error) {
      console.error(`Failed to fetch native transactions for ${chainId}:`, error);
      return [];
    }
  }

  /**
   * Fetch ERC-20 token transactions
   */
  private async fetchTokenTransactions(
    address: string,
    chainId: string,
    options: TransactionHistoryOptions
  ): Promise<BlockchainTransaction[]> {
    const apiUrls = this.getApiUrls(chainId);
    if (!apiUrls.main) return [];

    await this.waitForRateLimit(chainId);

    try {
      const params = new URLSearchParams({
        module: 'account',
        action: 'tokentx',
        address: address.toLowerCase(),
        startblock: (options.startBlock || 0).toString(),
        endblock: (options.endBlock || 99999999).toString(),
        page: (options.page || 1).toString(),
        offset: (options.limit || 25).toString(),
        sort: options.sortOrder || 'desc'
      });

      const response = await fetch(`${apiUrls.main}?${params}`);
      const data = await response.json();

      if (data.status === '1' && Array.isArray(data.result)) {
        return data.result;
      }

      return [];
    } catch (error) {
      console.error(`Failed to fetch token transactions for ${chainId}:`, error);
      return [];
    }
  }

  /**
   * Fallback method using RPC calls when explorer APIs are not available
   */
  private async fetchTransactionsViaRPC(
    address: string,
    chainId: string,
    options: TransactionHistoryOptions
  ): Promise<BlockchainTransaction[]> {
    try {
      const network = getNetworkByChainId(chainId);
      if (!network || !window.ethereum) return [];

      // This is a simplified RPC implementation
      // In production, you'd want to use a more robust solution
      const provider = createWeb3Provider();
      
      // Get latest block number
      const latestBlock = await window.ethereum.request({
        method: 'eth_blockNumber',
        params: []
      });

      const blockNumber = parseInt(latestBlock, 16);
      const transactions: BlockchainTransaction[] = [];

      // This is a basic implementation that checks recent blocks
      // A production system would use indexing services or graph protocols
      const blocksToCheck = Math.min(100, blockNumber);
      const startBlock = Math.max(1, blockNumber - blocksToCheck);

      for (let i = startBlock; i <= blockNumber; i++) {
        try {
          const block = await window.ethereum.request({
            method: 'eth_getBlockByNumber',
            params: [`0x${i.toString(16)}`, true]
          });

          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (tx.from?.toLowerCase() === address.toLowerCase() || 
                  tx.to?.toLowerCase() === address.toLowerCase()) {
                
                transactions.push({
                  hash: tx.hash,
                  blockNumber: parseInt(block.number, 16).toString(),
                  timeStamp: parseInt(block.timestamp, 16).toString(),
                  from: tx.from,
                  to: tx.to || '',
                  value: parseInt(tx.value, 16).toString(),
                  gasPrice: parseInt(tx.gasPrice, 16).toString(),
                  gasUsed: parseInt(tx.gas, 16).toString(),
                  gas: parseInt(tx.gas, 16).toString(),
                  isError: '0',
                  txreceipt_status: '1',
                  transactionIndex: parseInt(tx.transactionIndex, 16).toString()
                });
              }
            }
          }
        } catch (blockError) {
          console.warn(`Failed to fetch block ${i}:`, blockError);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Failed to fetch transactions via RPC:', error);
      return [];
    }
  }

  /**
   * Process raw blockchain transactions into standardized format
   */
  private async processTransactions(
    rawTransactions: BlockchainTransaction[],
    address: string,
    chainId: string
  ): Promise<ProcessedTransaction[]> {
    const network = getNetworkByChainId(chainId);
    if (!network) return [];

    return rawTransactions.map(tx => {
      const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
      const isTokenTransfer = !!tx.tokenSymbol;
      
      // Calculate transaction type
      let type: ProcessedTransaction['type'];
      if (tx.to === '' || tx.contractAddress) {
        type = 'contract_interaction';
      } else if (isTokenTransfer) {
        type = 'token_transfer';
      } else {
        type = isOutgoing ? 'sent' : 'received';
      }

      // Calculate fee
      const gasUsed = tx.gasUsed || '0';
      const gasPrice = tx.gasPrice || '0';
      const fee = (BigInt(gasUsed) * BigInt(gasPrice)).toString();

      // Format amount based on token or native currency
      let amount: string;
      if (isTokenTransfer && tx.tokenDecimal && tx.tokenSymbol) {
        amount = formatTokenAmount(tx.value, tx.tokenSymbol, parseInt(tx.tokenDecimal));
      } else {
        amount = formatTokenAmount(tx.value, network.symbol, network.decimals || 18);
      }

      // Determine status
      let status: ProcessedTransaction['status'] = 'confirmed';
      if (tx.isError === '1' || tx.txreceipt_status === '0') {
        status = 'failed';
      }

      return {
        id: tx.hash,
        hash: tx.hash,
        fromAddress: tx.from.toLowerCase(),
        toAddress: (tx.to || tx.contractAddress || '').toLowerCase(),
        amount,
        gasPrice: tx.gasPrice,
        gasUsed: tx.gasUsed,
        fee: formatTokenAmount(fee, network.symbol, network.decimals || 18),
        status,
        network: network.name,
        blockNumber: tx.blockNumber,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
        type,
        tokenSymbol: tx.tokenSymbol,
        tokenName: tx.tokenName,
        tokenDecimals: tx.tokenDecimal ? parseInt(tx.tokenDecimal) : undefined,
        direction: isOutgoing ? 'outgoing' : 'incoming',
        explorerUrl: getBlockExplorerUrl(chainId, 'tx', tx.hash),
        metadata: {
          transactionIndex: tx.transactionIndex,
          functionName: tx.functionName,
          methodId: tx.methodId,
          contractAddress: tx.contractAddress
        }
      };
    });
  }

  /**
   * Store transactions in database for persistence and offline access
   */
  private async storeTransactionsInDatabase(transactions: ProcessedTransaction[]): Promise<void> {
    if (transactions.length === 0) return;

    try {
      // Prepare transactions for bulk storage, ensuring proper format for API
      const bulkData = transactions.map(tx => ({
        hash: tx.hash,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        // Convert formatted amount back to wei string for storage
        amount: tx.amount || "0",
        gasPrice: tx.gasPrice,
        gasUsed: tx.gasUsed,
        fee: tx.fee,
        status: tx.status,
        network: tx.network,
        blockNumber: tx.blockNumber,
        metadata: tx.metadata
      }));

      // Use bulk upsert endpoint for efficient storage
      const response = await apiRequest('POST', '/api/transactions/bulk', bulkData);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bulk store failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully stored ${data.stored || bulkData.length} transactions in database`);
      
    } catch (error) {
      // Enhanced error logging for debugging
      console.error('❌ Failed to store transactions in database:', {
        error: error.message,
        count: transactions.length,
        sample: transactions.slice(0, 2).map(tx => ({ hash: tx.hash, network: tx.network }))
      });
      
      // Don't throw - storage failure shouldn't break the user experience
      // But we should still log it prominently for debugging
    }
  }

  /**
   * Get stored transactions from database
   */
  private async getStoredTransactions(address: string): Promise<ProcessedTransaction[]> {
    try {
      const response = await fetch(`/api/transactions/${address.toLowerCase()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stored transactions: ${response.status}`);
      }
      
      const data = await response.json();
      // Handle paginated API response format
      const transactions = data.transactions || data;
      
      return transactions.map((tx: any) => ({
        ...tx,
        timestamp: new Date(tx.timestamp),
        explorerUrl: getBlockExplorerUrl(tx.network, 'tx', tx.hash),
        direction: tx.fromAddress.toLowerCase() === address.toLowerCase() ? 'outgoing' : 'incoming',
        type: tx.type || (tx.fromAddress.toLowerCase() === address.toLowerCase() ? 'sent' : 'received')
      }));
    } catch (error) {
      console.error('Failed to fetch stored transactions:', error);
      return [];
    }
  }

  /**
   * Get API URLs for different networks
   */
  private getApiUrls(chainId: string): { main?: string; backup?: string } {
    const apiKeys = {
      // Add your API keys here
      etherscan: '', // ETHERSCAN_API_KEY
      polygonscan: '', // POLYGONSCAN_API_KEY
      bscscan: '' // BSCSCAN_API_KEY
    };

    switch (chainId) {
      case '0x1': // Ethereum Mainnet
        return {
          main: `https://api.etherscan.io/api${apiKeys.etherscan ? `?apikey=${apiKeys.etherscan}` : ''}`,
          backup: 'https://blockscout.com/eth/mainnet/api'
        };
      case '0x5': // Goerli
        return {
          main: `https://api-goerli.etherscan.io/api${apiKeys.etherscan ? `?apikey=${apiKeys.etherscan}` : ''}`
        };
      case '0xaa36a7': // Sepolia
        return {
          main: `https://api-sepolia.etherscan.io/api${apiKeys.etherscan ? `?apikey=${apiKeys.etherscan}` : ''}`
        };
      case '0x89': // Polygon
        return {
          main: `https://api.polygonscan.com/api${apiKeys.polygonscan ? `?apikey=${apiKeys.polygonscan}` : ''}`
        };
      case '0x13881': // Mumbai
        return {
          main: `https://api-testnet.polygonscan.com/api${apiKeys.polygonscan ? `?apikey=${apiKeys.polygonscan}` : ''}`
        };
      case '0x38': // BSC
        return {
          main: `https://api.bscscan.com/api${apiKeys.bscscan ? `?apikey=${apiKeys.bscscan}` : ''}`
        };
      case '0x61': // BSC Testnet
        return {
          main: `https://api-testnet.bscscan.com/api${apiKeys.bscscan ? `?apikey=${apiKeys.bscscan}` : ''}`
        };
      default:
        return {};
    }
  }

  /**
   * Rate limiting implementation
   */
  private async waitForRateLimit(chainId: string): Promise<void> {
    const networkType = this.getNetworkType(chainId);
    const limits = RATE_LIMITS[networkType as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
    
    const now = Date.now();
    const limiter = this.rateLimiters.get(chainId) || { lastRequest: 0, requests: [] };
    
    // Clean old requests outside the window
    limiter.requests = limiter.requests.filter(time => now - time < limits.window);
    
    if (limiter.requests.length >= limits.requests) {
      const oldestRequest = Math.min(...limiter.requests);
      const waitTime = limits.window - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    limiter.requests.push(now);
    limiter.lastRequest = now;
    this.rateLimiters.set(chainId, limiter);
  }

  private getNetworkType(chainId: string): string {
    if (['0x1', '0x5', '0xaa36a7'].includes(chainId)) return 'ethereum';
    if (['0x89', '0x13881'].includes(chainId)) return 'polygon';
    if (['0x38', '0x61'].includes(chainId)) return 'bsc';
    return 'default';
  }

  /**
   * Cache management
   */
  private getCachedData(key: string): ProcessedTransaction[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: ProcessedTransaction[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Format paginated response
   */
  private formatPaginatedResponse(
    transactions: ProcessedTransaction[],
    page: number,
    limit: number
  ): PaginatedTransactionHistory {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    return {
      transactions: paginatedTransactions,
      hasMore: endIndex < transactions.length,
      totalCount: transactions.length,
      page,
      limit
    };
  }

  /**
   * Search transactions
   */
  searchTransactions(
    transactions: ProcessedTransaction[],
    query: string
  ): ProcessedTransaction[] {
    if (!query.trim()) return transactions;

    const searchTerm = query.toLowerCase();
    return transactions.filter(tx =>
      tx.hash.toLowerCase().includes(searchTerm) ||
      tx.fromAddress.toLowerCase().includes(searchTerm) ||
      tx.toAddress.toLowerCase().includes(searchTerm) ||
      tx.tokenSymbol?.toLowerCase().includes(searchTerm) ||
      tx.tokenName?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Filter transactions by criteria
   */
  filterTransactions(
    transactions: ProcessedTransaction[],
    filters: {
      type?: string[];
      status?: string[];
      network?: string[];
      dateRange?: { start: Date; end: Date };
      amountRange?: { min: number; max: number };
    }
  ): ProcessedTransaction[] {
    return transactions.filter(tx => {
      if (filters.type && !filters.type.includes(tx.type)) return false;
      if (filters.status && !filters.status.includes(tx.status)) return false;
      if (filters.network && !filters.network.includes(tx.network)) return false;
      
      if (filters.dateRange) {
        const txDate = new Date(tx.timestamp);
        if (txDate < filters.dateRange.start || txDate > filters.dateRange.end) return false;
      }
      
      if (filters.amountRange) {
        const amount = parseFloat(tx.amount);
        if (amount < filters.amountRange.min || amount > filters.amountRange.max) return false;
      }
      
      return true;
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const transactionHistoryService = TransactionHistoryService.getInstance();

// Utility functions
export async function getTransactionHistory(
  address: string,
  chainId: string,
  options?: TransactionHistoryOptions
): Promise<PaginatedTransactionHistory> {
  return transactionHistoryService.getTransactionHistory(address, chainId, options);
}

export function searchTransactions(
  transactions: ProcessedTransaction[],
  query: string
): ProcessedTransaction[] {
  return transactionHistoryService.searchTransactions(transactions, query);
}

export function filterTransactions(
  transactions: ProcessedTransaction[],
  filters: any
): ProcessedTransaction[] {
  return transactionHistoryService.filterTransactions(transactions, filters);
}