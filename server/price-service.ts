import { ethers } from "ethers";

// Real-time cryptocurrency price service using CoinGecko API
// Free API, no key required, updates every 5 minutes

export interface CryptoPrice {
  usd: number;
  lastUpdated: Date;
}

// CoinGecko coin ID mapping
const COIN_IDS: Record<string, string> = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  SOL: 'solana',
  LTC: 'litecoin',
  DOGE: 'dogecoin',
  MATIC: 'matic-network',
  WBTC: 'wrapped-bitcoin',
  CDX: 'ethereum', // Platform token priced as ETH for now
};

// Price cache with fallback values
const PRICES: Record<string, CryptoPrice> = {
  ETH: { usd: 2500, lastUpdated: new Date() },
  BTC: { usd: 45000, lastUpdated: new Date() },
  USDC: { usd: 1.0, lastUpdated: new Date() },
  USDT: { usd: 1.0, lastUpdated: new Date() },
  DAI: { usd: 1.0, lastUpdated: new Date() },
  SOL: { usd: 100, lastUpdated: new Date() },
  LTC: { usd: 70, lastUpdated: new Date() },
  DOGE: { usd: 0.08, lastUpdated: new Date() },
  MATIC: { usd: 0.80, lastUpdated: new Date() },
  WBTC: { usd: 45000, lastUpdated: new Date() },
  CDX: { usd: 2500, lastUpdated: new Date() },
};

let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let isFetching = false;

// Fetch live prices from CoinGecko
export async function fetchLivePrices(): Promise<void> {
  const now = Date.now();
  
  // Don't fetch if recently updated or already fetching
  if (now - lastFetchTime < CACHE_DURATION || isFetching) {
    return;
  }

  isFetching = true;

  try {
    const coinIds = Object.values(COIN_IDS).filter((v, i, a) => a.indexOf(v) === i).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const updateTime = new Date();

    // Update prices from API
    for (const [symbol, coinId] of Object.entries(COIN_IDS)) {
      if (data[coinId]?.usd) {
        PRICES[symbol] = {
          usd: data[coinId].usd,
          lastUpdated: updateTime,
        };
      }
    }

    lastFetchTime = now;
    console.log(`✅ Updated crypto prices from CoinGecko at ${updateTime.toISOString()}`);
  } catch (error) {
    console.error('⚠️ Failed to fetch live prices, using cached values:', error);
    // Keep using cached prices on error
  } finally {
    isFetching = false;
  }
}

export function getCryptoPrice(symbol: string): CryptoPrice | null {
  // Trigger async price update if cache is stale
  const now = Date.now();
  if (now - lastFetchTime > CACHE_DURATION && !isFetching) {
    fetchLivePrices().catch(console.error);
  }

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
  // Trigger async price update if cache is stale
  const now = Date.now();
  if (now - lastFetchTime > CACHE_DURATION && !isFetching) {
    fetchLivePrices().catch(console.error);
  }
  
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

// Initialize price service - fetch prices on startup
export async function initializePriceService(): Promise<void> {
  console.log('🔄 Initializing price service with live CoinGecko data...');
  await fetchLivePrices();
  
  // Set up periodic updates every 5 minutes
  setInterval(() => {
    fetchLivePrices().catch(console.error);
  }, CACHE_DURATION);
}
