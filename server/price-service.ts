import { ethers } from "ethers";

export interface CryptoPrice {
  usd: number;
  lastUpdated: Date;
  usd_24h_change?: number;
  usd_24h_vol?: number;
  usd_market_cap?: number;
}

export interface LiveCryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number;
  sparkline_in_7d: {
    price: number[];
  };
  last_updated: string;
}

const PRICES: Record<string, CryptoPrice> = {
  BTC: { usd: 40000, lastUpdated: new Date(), usd_24h_change: 0 },
  ETH: { usd: 2500, lastUpdated: new Date(), usd_24h_change: 0 },
  SOL: { usd: 100, lastUpdated: new Date(), usd_24h_change: 0 },
  USDC: { usd: 1.0, lastUpdated: new Date(), usd_24h_change: 0 },
  USDT: { usd: 1.0, lastUpdated: new Date(), usd_24h_change: 0 },
  DAI: { usd: 1.0, lastUpdated: new Date(), usd_24h_change: 0 },
  MATIC: { usd: 0.8, lastUpdated: new Date(), usd_24h_change: 0 },
  BNB: { usd: 300, lastUpdated: new Date(), usd_24h_change: 0 },
  LTC: { usd: 70, lastUpdated: new Date(), usd_24h_change: 0 },
  DOGE: { usd: 0.08, lastUpdated: new Date(), usd_24h_change: 0 },
  XRP: { usd: 0.5, lastUpdated: new Date(), usd_24h_change: 0 },
  ADA: { usd: 0.35, lastUpdated: new Date(), usd_24h_change: 0 },
  AVAX: { usd: 25, lastUpdated: new Date(), usd_24h_change: 0 },
  DOT: { usd: 5, lastUpdated: new Date(), usd_24h_change: 0 },
  LINK: { usd: 12, lastUpdated: new Date(), usd_24h_change: 0 },
};

let livePriceCache: LiveCryptoData[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30000;

export function getCryptoPrice(symbol: string): CryptoPrice | null {
  return PRICES[symbol.toUpperCase()] || null;
}

export function convertUsdToCrypto(usdAmount: number, cryptoSymbol: string): string {
  const price = getCryptoPrice(cryptoSymbol);
  if (!price) {
    throw new Error(`Price not available for ${cryptoSymbol}`);
  }
  
  if (!price.usd || price.usd <= 0) {
    throw new Error(`Invalid price data for ${cryptoSymbol}: price is ${price.usd}. Please try again later.`);
  }
  
  const cryptoAmount = usdAmount / price.usd;
  if (!isFinite(cryptoAmount)) {
    throw new Error(`Failed to calculate conversion for ${cryptoSymbol}: invalid result`);
  }
  
  return cryptoAmount.toFixed(8);
}

export function convertCryptoToUsd(cryptoAmount: string, cryptoSymbol: string): number {
  const price = getCryptoPrice(cryptoSymbol);
  if (!price) {
    throw new Error(`Price not available for ${cryptoSymbol}`);
  }
  
  if (!price.usd || price.usd <= 0) {
    throw new Error(`Invalid price data for ${cryptoSymbol}: price is ${price.usd}. Please try again later.`);
  }
  
  const amount = parseFloat(cryptoAmount);
  if (isNaN(amount)) {
    throw new Error(`Invalid crypto amount: ${cryptoAmount}`);
  }
  
  const usdValue = amount * price.usd;
  if (!isFinite(usdValue)) {
    throw new Error(`Failed to calculate conversion for ${cryptoSymbol}: invalid result`);
  }
  
  return usdValue;
}

export function getAllPrices(): Record<string, CryptoPrice> {
  return { ...PRICES };
}

// Format crypto amount for display
export function formatCryptoAmount(amount: string, symbol: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  
  // Stablecoins show 2 decimals, others show 6
  const decimals = ["USDC", "USDT", "DAI"].includes(symbol.toUpperCase()) ? 2 : 6;
  return num.toFixed(decimals);
}

// Calculate slippage tolerance for crypto payments
export function calculateSlippageBounds(
  cryptoAmount: string,
  toleranceBps: number // basis points (100 = 1%)
): { min: string; max: string } {
  const amount = ethers.parseUnits(cryptoAmount, 18);
  const tolerance = (amount * BigInt(toleranceBps)) / BigInt(10000);
  
  const min = amount - tolerance;
  const max = amount + tolerance;
  
  return {
    min: ethers.formatUnits(min, 18),
    max: ethers.formatUnits(max, 18),
  };
}

export async function fetchLivePrices(): Promise<LiveCryptoData[]> {
  const now = Date.now();
  
  if (livePriceCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return livePriceCache;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d&locale=en'
    );

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status);
      return livePriceCache;
    }

    const data: LiveCryptoData[] = await response.json();
    livePriceCache = data;
    lastFetchTime = now;
    
    const symbolsToTrack = ['BTC', 'ETH', 'SOL', 'USDC', 'USDT', 'DAI', 'MATIC', 'BNB', 'LTC', 'DOGE', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK'];
    
    data.forEach(coin => {
      const symbol = coin.symbol.toUpperCase();
      if (symbolsToTrack.includes(symbol) && coin.current_price > 0) {
        PRICES[symbol] = {
          usd: coin.current_price,
          lastUpdated: new Date(coin.last_updated),
          usd_24h_change: coin.price_change_percentage_24h_in_currency,
          usd_24h_vol: coin.total_volume,
          usd_market_cap: coin.market_cap,
        };
      }
    });

    return data;
  } catch (error) {
    console.error('Failed to fetch live prices:', error);
    return livePriceCache;
  }
}

export function getLivePriceCache(): LiveCryptoData[] {
  return livePriceCache;
}

class PriceUpdateService {
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly UPDATE_INTERVAL_MS = 30000;

  async start() {
    if (this.isRunning) {
      console.log('💰 Price update service already running');
      return;
    }

    console.log('💰 Starting price update service...');
    this.isRunning = true;

    await this.updatePrices();

    this.updateInterval = setInterval(async () => {
      await this.updatePrices();
    }, this.UPDATE_INTERVAL_MS);

    console.log('💰 Price update service started (updates every 30 seconds)');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('💰 Stopping price update service...');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isRunning = false;
    console.log('💰 Price update service stopped');
  }

  private async updatePrices() {
    let retries = 3;
    let lastError: any;
    
    while (retries > 0) {
      try {
        const prices = await fetchLivePrices();
        if (prices && prices.length > 0) {
          const validPrices = Object.entries(PRICES).filter(([_, p]) => p.usd > 0).length;
          console.log(`💰 Updated prices for ${validPrices}/${Object.keys(PRICES).length} cryptocurrencies`);
          return;
        } else {
          lastError = new Error('CoinGecko returned empty data');
        }
      } catch (error) {
        lastError = error;
      }
      
      retries--;
      if (retries > 0) {
        const backoffMs = (4 - retries) * 2000;
        console.log(`💰 Price fetch failed, retrying in ${backoffMs}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    
    console.error('💰 Failed to update crypto prices after retries (using cached/fallback values):', lastError instanceof Error ? lastError.message : lastError);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: lastFetchTime > 0 ? new Date(lastFetchTime) : null,
      cachedCoins: livePriceCache.length,
      updateInterval: this.UPDATE_INTERVAL_MS,
    };
  }
}

export const priceUpdateService = new PriceUpdateService();
