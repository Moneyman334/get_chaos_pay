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
  ETH: { usd: 2500, lastUpdated: new Date(), usd_24h_change: 2.5 },
  USDC: { usd: 1.0, lastUpdated: new Date(), usd_24h_change: 0.01 },
  DAI: { usd: 1.0, lastUpdated: new Date(), usd_24h_change: -0.02 },
  USDT: { usd: 1.0, lastUpdated: new Date(), usd_24h_change: 0.0 },
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
  
  const cryptoAmount = usdAmount / price.usd;
  return cryptoAmount.toFixed(8);
}

export function convertCryptoToUsd(cryptoAmount: string, cryptoSymbol: string): number {
  const price = getCryptoPrice(cryptoSymbol);
  if (!price) {
    throw new Error(`Price not available for ${cryptoSymbol}`);
  }
  
  const amount = parseFloat(cryptoAmount);
  return amount * price.usd;
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
    
    data.slice(0, 10).forEach(coin => {
      const symbol = coin.symbol.toUpperCase();
      PRICES[symbol] = {
        usd: coin.current_price,
        lastUpdated: new Date(coin.last_updated),
        usd_24h_change: coin.price_change_percentage_24h_in_currency,
        usd_24h_vol: coin.total_volume,
        usd_market_cap: coin.market_cap,
      };
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
