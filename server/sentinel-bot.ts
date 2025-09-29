import CoinbasePro from 'coinbase-pro';
import { EventEmitter } from 'events';

export interface TradingSignal {
  pair: string;
  action: 'buy' | 'sell';
  price: number;
  amount: number;
  reason: string;
  confidence: number;
}

export interface BotConfig {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  userId: string;
  strategyId: string;
  activeStrategyId: string;
  tradingPairs: string[];
  maxPositionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
}

export class SentinelBot extends EventEmitter {
  private client: any;
  private config: BotConfig;
  private isRunning: boolean = false;
  private positions: Map<string, any> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: BotConfig) {
    super();
    this.config = config;
    
    this.client = new CoinbasePro.AuthenticatedClient(
      config.apiKey,
      config.apiSecret,
      config.passphrase,
      'https://api.exchange.coinbase.com'
    );
  }

  async start() {
    if (this.isRunning) {
      throw new Error('Bot is already running');
    }

    this.isRunning = true;
    this.emit('started');

    this.intervalId = setInterval(async () => {
      try {
        await this.executeTradingCycle();
      } catch (error) {
        this.emit('error', error);
      }
    }, 60000);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.emit('stopped');
  }

  private async executeTradingCycle() {
    for (const pair of this.config.tradingPairs) {
      try {
        const ticker = await this.client.getProductTicker(pair);
        const signal = await this.analyzeMarket(pair, ticker);
        
        if (signal) {
          await this.executeTrade(signal);
        }

        await this.checkExistingPositions(pair);
      } catch (error) {
        console.error(`Error processing ${pair}:`, error);
      }
    }
  }

  private async analyzeMarket(pair: string, ticker: any): Promise<TradingSignal | null> {
    const candles = await this.client.getProductHistoricRates(pair, {
      granularity: 3600,
    });

    if (!candles || candles.length < 20) {
      return null;
    }

    const closes = candles.map((c: any) => parseFloat(c[4])).reverse();
    const sma20 = closes.slice(0, 20).reduce((a: number, b: number) => a + b, 0) / 20;
    const currentPrice = parseFloat(ticker.price);

    if (currentPrice > sma20 * 1.02) {
      return {
        pair,
        action: 'buy',
        price: currentPrice,
        amount: Math.min(this.config.maxPositionSize / currentPrice, 1),
        reason: 'Price crossed above SMA20',
        confidence: 0.7,
      };
    } else if (currentPrice < sma20 * 0.98) {
      const position = this.positions.get(pair);
      if (position) {
        return {
          pair,
          action: 'sell',
          price: currentPrice,
          amount: position.amount,
          reason: 'Price crossed below SMA20',
          confidence: 0.7,
        };
      }
    }

    return null;
  }

  private async executeTrade(signal: TradingSignal) {
    try {
      const order = await this.client.placeOrder({
        product_id: signal.pair,
        side: signal.action,
        type: 'market',
        size: signal.amount.toString(),
      });

      this.emit('trade', {
        signal,
        order,
        userId: this.config.userId,
        strategyId: this.config.strategyId,
        activeStrategyId: this.config.activeStrategyId,
      });

      if (signal.action === 'buy') {
        this.positions.set(signal.pair, {
          amount: signal.amount,
          entryPrice: signal.price,
          stopLoss: signal.price * (1 - this.config.stopLossPercent / 100),
          takeProfit: signal.price * (1 + this.config.takeProfitPercent / 100),
        });
      } else {
        this.positions.delete(signal.pair);
      }
    } catch (error) {
      this.emit('error', { error, signal });
      throw error;
    }
  }

  private async checkExistingPositions(pair: string) {
    const position = this.positions.get(pair);
    if (!position) return;

    try {
      const ticker = await this.client.getProductTicker(pair);
      const currentPrice = parseFloat(ticker.price);

      if (currentPrice <= position.stopLoss) {
        await this.executeTrade({
          pair,
          action: 'sell',
          price: currentPrice,
          amount: position.amount,
          reason: 'Stop loss triggered',
          confidence: 1.0,
        });
      } else if (currentPrice >= position.takeProfit) {
        await this.executeTrade({
          pair,
          action: 'sell',
          price: currentPrice,
          amount: position.amount,
          reason: 'Take profit triggered',
          confidence: 1.0,
        });
      }
    } catch (error) {
      console.error(`Error checking position for ${pair}:`, error);
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export class BotManager {
  private bots: Map<string, SentinelBot> = new Map();

  createBot(config: BotConfig): SentinelBot {
    const botId = `${config.userId}-${config.activeStrategyId}`;
    
    if (this.bots.has(botId)) {
      throw new Error('Bot already exists for this user and strategy');
    }

    const bot = new SentinelBot(config);
    this.bots.set(botId, bot);
    
    return bot;
  }

  getBot(userId: string, activeStrategyId: string): SentinelBot | undefined {
    const botId = `${userId}-${activeStrategyId}`;
    return this.bots.get(botId);
  }

  async stopBot(userId: string, activeStrategyId: string): Promise<void> {
    const botId = `${userId}-${activeStrategyId}`;
    const bot = this.bots.get(botId);
    
    if (bot) {
      await bot.stop();
      this.bots.delete(botId);
    }
  }

  async stopAllBots(): Promise<void> {
    const stopPromises = Array.from(this.bots.values()).map(bot => bot.stop());
    await Promise.all(stopPromises);
    this.bots.clear();
  }

  getAllActiveBots(): Map<string, SentinelBot> {
    return new Map(this.bots);
  }
}

export const botManager = new BotManager();
