/**
 * DEX Aggregator Service
 * Integrates with 1inch API for best price routing across 300+ DEX sources
 * Supports all major chains with automatic liquidity aggregation
 */

import { ethers } from 'ethers';

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

interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}

export class DexAggregator {
  private readonly ONEINCH_API = 'https://api.1inch.dev/swap/v6.0';
  private readonly apiKey: string;
  
  // Chain ID mapping for 1inch
  private readonly supportedChains: Record<number, string> = {
    1: '1',        // Ethereum
    56: '56',      // BSC
    137: '137',    // Polygon
    42161: '42161', // Arbitrum
    10: '10',      // Optimism
    8453: '8453',  // Base
    43114: '43114', // Avalanche
    250: '250',    // Fantom
  };

  constructor() {
    this.apiKey = process.env.ONEINCH_API_KEY || '';
  }

  /**
   * Get swap quote from 1inch aggregator
   */
  async getQuote(params: {
    chainId: number;
    fromToken: string;
    toToken: string;
    amount: string;
    slippage?: number;
  }): Promise<SwapQuote> {
    const { chainId, fromToken, toToken, amount, slippage = 0.5 } = params;

    if (!this.supportedChains[chainId]) {
      throw new Error(`Chain ${chainId} not supported by DEX aggregator`);
    }

    try {
      // Use 1inch quote API
      const url = `${this.ONEINCH_API}/${chainId}/quote?src=${fromToken}&dst=${toToken}&amount=${amount}`;
      
      const response = await fetch(url, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
      });

      if (!response.ok) {
        // Fallback to simple calculation if API fails
        console.warn('1inch API unavailable, using fallback calculation');
        return this.getFallbackQuote(params);
      }

      const data = await response.json();
      
      // Calculate platform fee (0.3% = 30 basis points)
      const platformFee = (BigInt(data.dstAmount) * BigInt(3)) / BigInt(1000);
      const toAmountAfterFee = BigInt(data.dstAmount) - platformFee;
      
      // CRITICAL FIX: Calculate minReceived using basis points (10000 = 100%)
      // slippage is in percentage (e.g., 0.5 = 0.5%), so multiply by 100 to get basis points
      const slippageBps = Math.floor(slippage * 100); // 0.5% -> 50 bps
      const minReceivedAmount = (toAmountAfterFee * BigInt(10000 - slippageBps)) / BigInt(10000);
      
      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: toAmountAfterFee.toString(),
        rate: parseFloat(data.dstAmount) / parseFloat(amount),
        priceImpact: parseFloat(data.estimatedGas) / parseFloat(amount) * 100,
        fee: platformFee.toString(),
        minReceived: minReceivedAmount.toString(),
        route: data.protocols?.[0]?.map((p: any) => p.name) || [],
        gas: data.gas || '150000',
        protocols: data.protocols?.[0]?.map((p: any) => p.name) || ['Uniswap V3'],
      };
    } catch (error) {
      console.error('DEX quote error:', error);
      return this.getFallbackQuote(params);
    }
  }

  /**
   * Get swap transaction data for execution
   */
  async getSwapTransaction(params: {
    chainId: number;
    fromToken: string;
    toToken: string;
    amount: string;
    from: string;
    slippage?: number;
  }): Promise<SwapTransaction> {
    const { chainId, fromToken, toToken, amount, from, slippage = 0.5 } = params;

    if (!this.supportedChains[chainId]) {
      throw new Error(`Chain ${chainId} not supported by DEX aggregator`);
    }

    // Require API key for actual swaps
    if (!this.apiKey) {
      throw new Error('1inch API key required for swaps. Add ONEINCH_API_KEY to Replit Secrets to enable DEX trading.');
    }

    // Platform fee wallet address (where 0.3% fee goes)
    const FEE_WALLET = process.env.PLATFORM_FEE_WALLET || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
    const PLATFORM_FEE_BPS = 30; // 0.3% in basis points (30/10000 = 0.003)

    try {
      // Build swap URL with fee parameters for platform revenue
      const url = `${this.ONEINCH_API}/${chainId}/swap?` + 
        `src=${fromToken}&` +
        `dst=${toToken}&` +
        `amount=${amount}&` +
        `from=${from}&` +
        `slippage=${slippage}&` +
        `fee=${PLATFORM_FEE_BPS}&` +
        `referrer=${FEE_WALLET}`;
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('1inch API error:', errorText);
        throw new Error(`1inch API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        from: data.tx.from,
        to: data.tx.to,
        data: data.tx.data,
        value: data.tx.value,
        gas: data.tx.gas,
        gasPrice: data.tx.gasPrice,
      };
    } catch (error) {
      console.error('DEX swap transaction error:', error);
      throw error; // Throw original error for better debugging
    }
  }

  /**
   * Fallback quote calculation when 1inch API is unavailable
   * Uses CoinGecko prices for estimation
   * NOTE: amount is in wei, must convert to decimal for price calculation
   */
  private async getFallbackQuote(params: {
    fromToken: string;
    toToken: string;
    amount: string;
    slippage?: number;
  }): Promise<SwapQuote> {
    const { fromToken, toToken, amount, slippage = 0.5 } = params;
    
    // Import price service
    const { getCryptoPrice } = await import('./price-service');
    
    // Map token addresses to CoinGecko IDs (case-insensitive)
    const tokenToCoinGecko: Record<string, string> = {
      'ETH': 'ethereum',
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ethereum', // Native ETH
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin', // USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether', // USDT
      '0x6b175474e89094c44da98b954eedeac495271d0f': 'dai', // DAI
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wrapped-bitcoin', // WBTC
    };
    
    const fromCoinId = tokenToCoinGecko[fromToken.toLowerCase()] || 'ethereum';
    const toCoinId = tokenToCoinGecko[toToken.toLowerCase()] || 'usd-coin';
    
    const fromPrice = getCryptoPrice(fromCoinId);
    const toPrice = getCryptoPrice(toCoinId);
    
    if (!fromPrice || !toPrice) {
      throw new Error('Unable to fetch token prices');
    }
    
    // CRITICAL FIX: Convert amount from wei to decimal (assume 18 decimals for fallback)
    const fromAmountDecimal = Number(amount) / 1e18;
    
    // Calculate output amount in decimal
    const fromValueUSD = fromAmountDecimal * fromPrice.usd;
    const toAmountDecimal = fromValueUSD / toPrice.usd;
    
    // Apply 0.3% platform fee (30 basis points)
    const platformFeeDecimal = toAmountDecimal * 0.003;
    const toAmountAfterFeeDecimal = toAmountDecimal - platformFeeDecimal;
    
    // Convert to wei (18 decimals)
    const toAmountWei = BigInt(Math.floor(toAmountAfterFeeDecimal * 1e18));
    const platformFeeWei = BigInt(Math.floor(platformFeeDecimal * 1e18));
    
    // CRITICAL FIX: Slippage calculation using basis points (10000 = 100%)
    // slippage is in percentage (e.g., 0.5 = 0.5%), so we multiply by 100 to get basis points
    const slippageBps = Math.floor(slippage * 100); // 0.5% -> 50 bps
    const minReceivedWei = (toAmountWei * BigInt(10000 - slippageBps)) / BigInt(10000);
    
    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: toAmountWei.toString(),
      rate: toAmountDecimal / fromAmountDecimal,
      priceImpact: 0.1, // Minimal impact for fallback
      fee: platformFeeWei.toString(),
      minReceived: minReceivedWei.toString(),
      route: ['Direct'],
      gas: '150000',
      protocols: ['Fallback Pricing'],
    };
  }

  /**
   * Get list of supported tokens for a chain
   */
  async getSupportedTokens(chainId: number): Promise<any[]> {
    if (!this.supportedChains[chainId]) {
      return [];
    }

    try {
      const url = `${this.ONEINCH_API}/${chainId}/tokens`;
      const response = await fetch(url, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
      });

      if (!response.ok) {
        return this.getDefaultTokens(chainId);
      }

      const data = await response.json();
      return Object.values(data.tokens || {});
    } catch (error) {
      return this.getDefaultTokens(chainId);
    }
  }

  /**
   * Default token list when API is unavailable
   * Comprehensive list for all supported chains
   */
  private getDefaultTokens(chainId: number): any[] {
    const defaultTokens: Record<number, any[]> = {
      1: [ // Ethereum
        { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
        { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
        { symbol: 'DAI', name: 'Dai', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
      ],
      56: [ // BSC
        { symbol: 'BNB', name: 'BNB', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        { symbol: 'USDT', name: 'Tether', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
        { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
      ],
      137: [ // Polygon
        { symbol: 'MATIC', name: 'Polygon', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
        { symbol: 'USDT', name: 'Tether', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
        { symbol: 'DAI', name: 'Dai', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
      ],
      42161: [ // Arbitrum
        { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', decimals: 6 },
        { symbol: 'USDT', name: 'Tether', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
        { symbol: 'DAI', name: 'Dai', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
      ],
      10: [ // Optimism
        { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', decimals: 6 },
        { symbol: 'USDT', name: 'Tether', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
        { symbol: 'DAI', name: 'Dai', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
      ],
      8453: [ // Base
        { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
        { symbol: 'DAI', name: 'Dai', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
      ],
      43114: [ // Avalanche
        { symbol: 'AVAX', name: 'Avalanche', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
        { symbol: 'USDT', name: 'Tether', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6 },
        { symbol: 'DAI', name: 'Dai', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', decimals: 18 },
      ],
      250: [ // Fantom
        { symbol: 'FTM', name: 'Fantom', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', decimals: 6 },
        { symbol: 'USDT', name: 'Tether', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', decimals: 6 },
        { symbol: 'DAI', name: 'Dai', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', decimals: 18 },
      ],
    };

    return defaultTokens[chainId] || [];
  }
}

export const dexAggregator = new DexAggregator();
