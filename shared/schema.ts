import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isOwner: text("is_owner").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  balance: text("balance").default("0"), // Store as wei (string to avoid precision loss)
  network: text("network").notNull().default("mainnet"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  addressLowerIdx: index("wallets_address_lower_idx").on(sql`lower(${table.address})`),
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hash: text("hash").notNull().unique(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: text("amount").notNull(), // Store as wei (string to avoid precision loss)
  gasPrice: text("gas_price"), // Store as wei string
  gasUsed: text("gas_used"), // Store as gas units string
  fee: text("fee"), // Store as wei string
  status: text("status").notNull().default("pending"), // pending, confirmed, failed
  network: text("network").notNull().default("mainnet"),
  blockNumber: text("block_number"), // Store as string to avoid overflow
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
}, (table) => ({
  fromAddressLowerIdx: index("transactions_from_address_lower_idx").on(sql`lower(${table.fromAddress})`),
  toAddressLowerIdx: index("transactions_to_address_lower_idx").on(sql`lower(${table.toAddress})`),
  timestampIdx: index("transactions_timestamp_idx").on(table.timestamp),
}));

export const networkInfo = pgTable("network_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: text("chain_id").notNull().unique(),
  name: text("name").notNull(),
  rpcUrl: text("rpc_url").notNull(),
  blockExplorerUrl: text("block_explorer_url"),
  symbol: text("symbol").notNull().default("ETH"),
  decimals: text("decimals").notNull().default("18"), // Store as string
  isTestnet: text("is_testnet").notNull().default("false"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractAddress: text("contract_address").notNull(),
  chainId: text("chain_id").notNull(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimals: text("decimals").notNull().default("18"), // Store as string
  logoUrl: text("logo_url"),
  isVerified: text("is_verified").notNull().default("false"),
  totalSupply: text("total_supply"), // Store as string to avoid precision loss
  description: text("description"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contractChainIdx: index("tokens_contract_chain_idx").on(table.contractAddress, table.chainId),
  contractLowerIdx: index("tokens_contract_lower_idx").on(sql`lower(${table.contractAddress})`),
  symbolIdx: index("tokens_symbol_idx").on(table.symbol),
  chainIdx: index("tokens_chain_idx").on(table.chainId),
}));

export const tokenBalances = pgTable("token_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  tokenId: varchar("token_id").notNull().references(() => tokens.id),
  balance: text("balance").notNull().default("0"), // Store as string to avoid precision loss
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  walletTokenIdx: index("token_balances_wallet_token_idx").on(table.walletAddress, table.tokenId),
  walletLowerIdx: index("token_balances_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  lastUpdatedIdx: index("token_balances_last_updated_idx").on(table.lastUpdated),
}));

export const userTokens = pgTable("user_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  tokenId: varchar("token_id").notNull().references(() => tokens.id),
  isHidden: text("is_hidden").notNull().default("false"),
  sortOrder: text("sort_order").default("0"), // For custom ordering
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  userWalletTokenIdx: index("user_tokens_user_wallet_token_idx").on(table.userId, table.walletAddress, table.tokenId),
  userWalletIdx: index("user_tokens_user_wallet_idx").on(table.userId, table.walletAddress),
  walletLowerIdx: index("user_tokens_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
}));

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull(),
  chainId: text("chain_id").notNull(),
  name: text("name").notNull(),
  abi: jsonb("abi").notNull(), // Store the contract ABI as JSON
  tags: text("tags").array().default(sql`'{}'::text[]`), // Contract categories/tags
  description: text("description"),
  isVerified: text("is_verified").notNull().default("false"),
  sourceCode: text("source_code"), // Optional verified source code
  compiler: text("compiler"), // Compiler version used
  userId: varchar("user_id").references(() => users.id), // User who added this contract
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  addressChainIdx: index("contracts_address_chain_idx").on(table.address, table.chainId),
  addressLowerIdx: index("contracts_address_lower_idx").on(sql`lower(${table.address})`),
  chainIdx: index("contracts_chain_idx").on(table.chainId),
  userIdx: index("contracts_user_idx").on(table.userId),
  tagsIdx: index("contracts_tags_idx").on(table.tags),
}));

export const contractCalls = pgTable("contract_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  functionName: text("function_name").notNull(),
  functionSelector: text("function_selector"), // 4-byte function selector
  args: jsonb("args"), // Function arguments as JSON
  fromAddress: text("from_address").notNull(), // Who called the function
  toAddress: text("to_address").notNull(), // Contract address
  txHash: text("tx_hash").unique(), // Transaction hash if it's a write call
  status: text("status").notNull().default("pending"), // pending, confirmed, failed, reverted
  blockNumber: text("block_number"), // Block number if confirmed
  gasUsed: text("gas_used"), // Gas used for the transaction
  gasPrice: text("gas_price"), // Gas price paid
  value: text("value").default("0"), // ETH/native token value sent
  returnData: jsonb("return_data"), // Decoded return data for read calls
  error: text("error"), // Error message if failed
  chainId: text("chain_id").notNull(),
  callType: text("call_type").notNull().default("read"), // read, write, estimate
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contractIdx: index("contract_calls_contract_idx").on(table.contractId),
  fromAddressLowerIdx: index("contract_calls_from_address_lower_idx").on(sql`lower(${table.fromAddress})`),
  txHashIdx: index("contract_calls_tx_hash_idx").on(table.txHash),
  statusIdx: index("contract_calls_status_idx").on(table.status),
  chainIdx: index("contract_calls_chain_idx").on(table.chainId),
  createdAtIdx: index("contract_calls_created_at_idx").on(table.createdAt),
  functionIdx: index("contract_calls_function_idx").on(table.functionName),
}));

export const contractEventSubs = pgTable("contract_event_subs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  eventName: text("event_name").notNull(),
  eventSignature: text("event_signature"), // Event signature hash
  indexedFilters: jsonb("indexed_filters"), // Filters for indexed parameters
  fromBlock: text("from_block").default("latest"), // Starting block for monitoring
  toBlock: text("to_block"), // Ending block (null for ongoing)
  isActive: text("is_active").notNull().default("true"),
  userId: varchar("user_id").references(() => users.id), // User who created this subscription
  webhookUrl: text("webhook_url"), // Optional webhook for notifications
  lastProcessedBlock: text("last_processed_block"), // Track processed blocks
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contractIdx: index("contract_event_subs_contract_idx").on(table.contractId),
  eventIdx: index("contract_event_subs_event_idx").on(table.eventName),
  activeIdx: index("contract_event_subs_active_idx").on(table.isActive),
  userIdx: index("contract_event_subs_user_idx").on(table.userId),
  lastBlockIdx: index("contract_event_subs_last_block_idx").on(table.lastProcessedBlock),
}));

export const contractEvents = pgTable("contract_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  subscriptionId: varchar("subscription_id").references(() => contractEventSubs.id),
  eventName: text("event_name").notNull(),
  eventSignature: text("event_signature"),
  args: jsonb("args").notNull(), // Decoded event arguments
  txHash: text("tx_hash").notNull(),
  blockNumber: text("block_number").notNull(),
  blockHash: text("block_hash"),
  logIndex: text("log_index").notNull(), // Position of log in block
  chainId: text("chain_id").notNull(),
  fromAddress: text("from_address"), // Transaction sender
  gasUsed: text("gas_used"),
  gasPrice: text("gas_price"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  contractIdx: index("contract_events_contract_idx").on(table.contractId),
  subscriptionIdx: index("contract_events_subscription_idx").on(table.subscriptionId),
  txHashIdx: index("contract_events_tx_hash_idx").on(table.txHash),
  blockIdx: index("contract_events_block_idx").on(table.blockNumber),
  chainIdx: index("contract_events_chain_idx").on(table.chainId),
  timestampIdx: index("contract_events_timestamp_idx").on(table.timestamp),
  eventIdx: index("contract_events_event_idx").on(table.eventName),
}));

export const nftCollections = pgTable("nft_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  name: text("name").notNull(),
  slug: text("slug"),
  symbol: text("symbol"),
  imageUrl: text("image_url"),
  bannerImageUrl: text("banner_image_url"),
  description: text("description"),
  externalUrl: text("external_url"),
  isVerified: text("is_verified").notNull().default("false"),
  totalSupply: text("total_supply"),
  floorPrice: text("floor_price"), // Store as string to avoid precision loss
  openseaSlug: text("opensea_slug"),
  contractStandard: text("contract_standard").notNull().default("ERC721"), // ERC721, ERC1155
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contractChainIdx: index("nft_collections_contract_chain_idx").on(table.contractAddress, table.chainId),
  contractLowerIdx: index("nft_collections_contract_lower_idx").on(sql`lower(${table.contractAddress})`),
  chainIdx: index("nft_collections_chain_idx").on(table.chainId),
  slugIdx: index("nft_collections_slug_idx").on(table.slug),
  verifiedIdx: index("nft_collections_verified_idx").on(table.isVerified),
  standardIdx: index("nft_collections_standard_idx").on(table.contractStandard),
}));

export const nfts = pgTable("nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id").notNull(), // Store as string to handle large numbers
  standard: text("standard").notNull().default("ERC721"), // ERC721, ERC1155
  name: text("name"),
  description: text("description"),
  imageUrl: text("image_url"),
  imageThumbnailUrl: text("image_thumbnail_url"),
  animationUrl: text("animation_url"),
  externalUrl: text("external_url"),
  attributes: jsonb("attributes"), // Array of trait objects
  metadata: jsonb("metadata"), // Full metadata from tokenURI
  tokenUri: text("token_uri"),
  collectionId: varchar("collection_id").references(() => nftCollections.id),
  rarity: text("rarity"), // Common, Uncommon, Rare, Epic, Legendary
  rarityRank: text("rarity_rank"), // Numeric rank as string
  lastRefreshed: timestamp("last_refreshed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contractTokenIdx: index("nfts_contract_token_idx").on(table.contractAddress, table.tokenId, table.chainId),
  contractLowerIdx: index("nfts_contract_lower_idx").on(sql`lower(${table.contractAddress})`),
  chainIdx: index("nfts_chain_idx").on(table.chainId),
  collectionIdx: index("nfts_collection_idx").on(table.collectionId),
  nameIdx: index("nfts_name_idx").on(table.name),
  standardIdx: index("nfts_standard_idx").on(table.standard),
  rarityIdx: index("nfts_rarity_idx").on(table.rarity),
  lastRefreshedIdx: index("nfts_last_refreshed_idx").on(table.lastRefreshed),
}));

export const nftOwnerships = pgTable("nft_ownerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  nftId: varchar("nft_id").notNull().references(() => nfts.id),
  balance: text("balance").notNull().default("1"), // For ERC1155 support, store as string
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id").notNull(),
  isHidden: text("is_hidden").notNull().default("false"),
  acquisitionDate: timestamp("acquisition_date"),
  acquisitionPrice: text("acquisition_price"), // Store as wei string
  acquisitionCurrency: text("acquisition_currency"), // ETH, MATIC, etc.
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  walletNftIdx: index("nft_ownerships_wallet_nft_idx").on(table.walletAddress, table.nftId),
  walletLowerIdx: index("nft_ownerships_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  chainIdx: index("nft_ownerships_chain_idx").on(table.chainId),
  contractTokenIdx: index("nft_ownerships_contract_token_idx").on(table.contractAddress, table.tokenId),
  lastUpdatedIdx: index("nft_ownerships_last_updated_idx").on(table.lastUpdated),
  hiddenIdx: index("nft_ownerships_hidden_idx").on(table.isHidden),
}));

export const insertNftCollectionSchema = createInsertSchema(nftCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNftSchema = createInsertSchema(nfts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRefreshed: true,
});

export const insertNftOwnershipSchema = createInsertSchema(nftOwnerships).omit({
  id: true,
  lastUpdated: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

export const insertNetworkInfoSchema = createInsertSchema(networkInfo).omit({
  id: true,
  updatedAt: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTokenBalanceSchema = createInsertSchema(tokenBalances).omit({
  id: true,
  lastUpdated: true,
});

export const insertUserTokenSchema = createInsertSchema(userTokens).omit({
  id: true,
  addedAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractCallSchema = createInsertSchema(contractCalls).omit({
  id: true,
  createdAt: true,
});

export const insertContractEventSubSchema = createInsertSchema(contractEventSubs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractEventSchema = createInsertSchema(contractEvents).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertNetworkInfo = z.infer<typeof insertNetworkInfoSchema>;
export type NetworkInfo = typeof networkInfo.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;
export type InsertTokenBalance = z.infer<typeof insertTokenBalanceSchema>;
export type TokenBalance = typeof tokenBalances.$inferSelect;
export type InsertUserToken = z.infer<typeof insertUserTokenSchema>;
export type UserToken = typeof userTokens.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContractCall = z.infer<typeof insertContractCallSchema>;
export type ContractCall = typeof contractCalls.$inferSelect;
export type InsertContractEventSub = z.infer<typeof insertContractEventSubSchema>;
export type ContractEventSub = typeof contractEventSubs.$inferSelect;
export type InsertContractEvent = z.infer<typeof insertContractEventSchema>;
export type ContractEvent = typeof contractEvents.$inferSelect;
export type InsertNftCollection = z.infer<typeof insertNftCollectionSchema>;
export type NftCollection = typeof nftCollections.$inferSelect;
export type InsertNft = z.infer<typeof insertNftSchema>;
export type Nft = typeof nfts.$inferSelect;
export type InsertNftOwnership = z.infer<typeof insertNftOwnershipSchema>;
export type NftOwnership = typeof nftOwnerships.$inferSelect;

export const botStrategies = pgTable("bot_strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  strategyType: text("strategy_type").notNull(), // trend, momentum, arbitrage, grid, dca
  icon: text("icon").notNull().default("🤖"),
  isActive: text("is_active").notNull().default("true"),
  riskLevel: text("risk_level").notNull().default("medium"), // low, medium, high
  minInvestment: text("min_investment").notNull().default("100"),
  expectedReturn: text("expected_return").default("0"),
  config: jsonb("config").notNull(), // Strategy-specific parameters
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("bot_strategies_type_idx").on(table.strategyType),
  activeIdx: index("bot_strategies_active_idx").on(table.isActive),
}));

export const botSubscriptions = pgTable("bot_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  planType: text("plan_type").notNull(), // starter, pro, elite
  status: text("status").notNull().default("active"), // active, paused, cancelled, expired
  startDate: timestamp("start_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date"),
  price: text("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentTxHash: text("payment_tx_hash"), // Crypto payment transaction hash
  maxActiveStrategies: text("max_active_strategies").notNull().default("1"),
  maxDailyTrades: text("max_daily_trades").notNull().default("10"),
  features: jsonb("features").notNull(), // List of enabled features
  autoRenew: text("auto_renew").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("bot_subscriptions_user_idx").on(table.userId),
  statusIdx: index("bot_subscriptions_status_idx").on(table.status),
  expiryIdx: index("bot_subscriptions_expiry_idx").on(table.expiryDate),
}));

export const botUserConfigs = pgTable("bot_user_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id").notNull().references(() => botSubscriptions.id),
  coinbaseApiKey: text("coinbase_api_key"), // Encrypted
  coinbaseApiSecret: text("coinbase_api_secret"), // Encrypted
  coinbasePassphrase: text("coinbase_passphrase"), // Encrypted
  isConnected: text("is_connected").notNull().default("false"),
  maxPositionSize: text("max_position_size").notNull().default("1000"), // Max USD per trade
  maxDailyLoss: text("max_daily_loss").notNull().default("100"), // Max daily loss in USD
  stopLossPercent: text("stop_loss_percent").notNull().default("5"), // Percentage
  takeProfitPercent: text("take_profit_percent").notNull().default("10"), // Percentage
  enableNotifications: text("enable_notifications").notNull().default("true"),
  notificationEmail: text("notification_email"),
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("bot_user_configs_user_idx").on(table.userId),
  subscriptionIdx: index("bot_user_configs_subscription_idx").on(table.subscriptionId),
  connectedIdx: index("bot_user_configs_connected_idx").on(table.isConnected),
}));

export const botActiveStrategies = pgTable("bot_active_strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  strategyId: varchar("strategy_id").notNull().references(() => botStrategies.id),
  configId: varchar("config_id").notNull().references(() => botUserConfigs.id),
  status: text("status").notNull().default("active"), // active, paused, stopped
  tradingPairs: text("trading_pairs").array().notNull(), // ["BTC-USD", "ETH-USD"]
  allocatedCapital: text("allocated_capital").notNull(), // USD amount allocated
  currentProfit: text("current_profit").notNull().default("0"),
  totalTrades: text("total_trades").notNull().default("0"),
  winRate: text("win_rate").notNull().default("0"),
  customConfig: jsonb("custom_config"), // User overrides for strategy params
  startedAt: timestamp("started_at").defaultNow(),
  pausedAt: timestamp("paused_at"),
  stoppedAt: timestamp("stopped_at"),
  lastTradeAt: timestamp("last_trade_at"),
}, (table) => ({
  userIdx: index("bot_active_strategies_user_idx").on(table.userId),
  strategyIdx: index("bot_active_strategies_strategy_idx").on(table.strategyId),
  statusIdx: index("bot_active_strategies_status_idx").on(table.status),
  lastTradeIdx: index("bot_active_strategies_last_trade_idx").on(table.lastTradeAt),
}));

export const botTrades = pgTable("bot_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activeStrategyId: varchar("active_strategy_id").notNull().references(() => botActiveStrategies.id),
  strategyId: varchar("strategy_id").notNull().references(() => botStrategies.id),
  tradingPair: text("trading_pair").notNull(), // BTC-USD
  side: text("side").notNull(), // buy, sell
  orderType: text("order_type").notNull(), // market, limit
  price: text("price").notNull(), // Execution price
  amount: text("amount").notNull(), // Crypto amount
  total: text("total").notNull(), // Total USD value
  fee: text("fee").notNull().default("0"),
  profit: text("profit"), // Realized profit/loss (for sell orders)
  status: text("status").notNull().default("pending"), // pending, filled, cancelled, failed
  coinbaseOrderId: text("coinbase_order_id").unique(),
  reason: text("reason"), // Why the trade was made
  metadata: jsonb("metadata"), // Additional trade data
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("bot_trades_user_idx").on(table.userId),
  activeStrategyIdx: index("bot_trades_active_strategy_idx").on(table.activeStrategyId),
  strategyIdx: index("bot_trades_strategy_idx").on(table.strategyId),
  statusIdx: index("bot_trades_status_idx").on(table.status),
  pairIdx: index("bot_trades_pair_idx").on(table.tradingPair),
  createdAtIdx: index("bot_trades_created_at_idx").on(table.createdAt),
  executedAtIdx: index("bot_trades_executed_at_idx").on(table.executedAt),
}));

export const insertBotStrategySchema = createInsertSchema(botStrategies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotSubscriptionSchema = createInsertSchema(botSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotUserConfigSchema = createInsertSchema(botUserConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotActiveStrategySchema = createInsertSchema(botActiveStrategies).omit({
  id: true,
  startedAt: true,
});

export const insertBotTradeSchema = createInsertSchema(botTrades).omit({
  id: true,
  createdAt: true,
});

export type InsertBotStrategy = z.infer<typeof insertBotStrategySchema>;
export type BotStrategy = typeof botStrategies.$inferSelect;
export type InsertBotSubscription = z.infer<typeof insertBotSubscriptionSchema>;
export type BotSubscription = typeof botSubscriptions.$inferSelect;
export type InsertBotUserConfig = z.infer<typeof insertBotUserConfigSchema>;
export type BotUserConfig = typeof botUserConfigs.$inferSelect;
export type InsertBotActiveStrategy = z.infer<typeof insertBotActiveStrategySchema>;
export type BotActiveStrategy = typeof botActiveStrategies.$inferSelect;
export type InsertBotTrade = z.infer<typeof insertBotTradeSchema>;
export type BotTrade = typeof botTrades.$inferSelect;

// House Vaults - Player-Owned Liquidity System
export const houseVaults = pgTable("house_vaults", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  tier: text("tier").notNull().default("standard"), // standard, premium, elite
  minStake: text("min_stake").notNull().default("0.1"), // Minimum ETH to stake
  apy: text("apy").notNull().default("15"), // Expected annual percentage yield
  totalStaked: text("total_staked").notNull().default("0"), // Total ETH staked
  totalEarnings: text("total_earnings").notNull().default("0"), // Total profit earned
  activePositions: text("active_positions").notNull().default("0"), // Number of active stakers
  status: text("status").notNull().default("active"), // active, paused, closed
  riskLevel: text("risk_level").notNull().default("low"), // low, medium, high
  lockPeriod: text("lock_period").default("0"), // Days before withdrawal allowed (0 = no lock)
  performanceFee: text("performance_fee").notNull().default("10"), // Percentage of profits taken as fee
  vaultAddress: text("vault_address").notNull(), // Ethereum address where ETH is sent
  chainId: text("chain_id").notNull().default("0x1"), // Network chain ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tierIdx: index("house_vaults_tier_idx").on(table.tier),
  statusIdx: index("house_vaults_status_idx").on(table.status),
  vaultAddressIdx: index("house_vaults_vault_address_idx").on(sql`lower(${table.vaultAddress})`),
}));

export const housePositions = pgTable("house_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id").notNull().references(() => houseVaults.id),
  walletAddress: text("wallet_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  stakedAmount: text("staked_amount").notNull(), // ETH amount staked
  shares: text("shares").notNull(), // Vault shares owned
  entryPrice: text("entry_price").notNull(), // Share price at entry
  currentValue: text("current_value").notNull().default("0"), // Current position value
  totalEarnings: text("total_earnings").notNull().default("0"), // Total earned
  claimedEarnings: text("claimed_earnings").notNull().default("0"), // Already claimed
  pendingEarnings: text("pending_earnings").notNull().default("0"), // Ready to claim
  status: text("status").notNull().default("active"), // active, withdrawn, locked, pending
  stakeTxHash: text("stake_tx_hash"), // Transaction hash for stake
  unstakeTxHash: text("unstake_tx_hash"), // Transaction hash for unstake
  stakedAt: timestamp("staked_at").notNull().defaultNow(),
  unlocksAt: timestamp("unlocks_at"), // When position can be withdrawn
  lastClaimAt: timestamp("last_claim_at"),
  withdrawnAt: timestamp("withdrawn_at"),
}, (table) => ({
  vaultIdx: index("house_positions_vault_idx").on(table.vaultId),
  walletIdx: index("house_positions_wallet_idx").on(sql`lower(${table.walletAddress})`),
  userIdx: index("house_positions_user_idx").on(table.userId),
  statusIdx: index("house_positions_status_idx").on(table.status),
  stakedAtIdx: index("house_positions_staked_at_idx").on(table.stakedAt),
  stakeTxHashIdx: index("house_positions_stake_tx_hash_idx").on(table.stakeTxHash),
}));

export const houseDistributions = pgTable("house_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vaultId: varchar("vault_id").notNull().references(() => houseVaults.id),
  profitAmount: text("profit_amount").notNull(), // Total profit to distribute
  performanceFee: text("performance_fee").notNull(), // Fee amount taken
  netProfit: text("net_profit").notNull(), // Profit after fees
  totalShares: text("total_shares").notNull(), // Total shares at distribution time
  pricePerShare: text("price_per_share").notNull(), // Profit per share
  source: text("source").notNull(), // casino_wins, trading_profits, etc
  positionsAffected: text("positions_affected").notNull().default("0"),
  distributedAt: timestamp("distributed_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional distribution details
}, (table) => ({
  vaultIdx: index("house_distributions_vault_idx").on(table.vaultId),
  distributedAtIdx: index("house_distributions_distributed_at_idx").on(table.distributedAt),
  sourceIdx: index("house_distributions_source_idx").on(table.source),
}));

export const houseEarnings = pgTable("house_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  positionId: varchar("position_id").notNull().references(() => housePositions.id),
  distributionId: varchar("distribution_id").notNull().references(() => houseDistributions.id),
  walletAddress: text("wallet_address").notNull(),
  earningAmount: text("earning_amount").notNull(), // Amount earned from this distribution
  shares: text("shares").notNull(), // Shares owned at distribution time
  status: text("status").notNull().default("pending"), // pending, claimed
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  positionIdx: index("house_earnings_position_idx").on(table.positionId),
  distributionIdx: index("house_earnings_distribution_idx").on(table.distributionId),
  walletIdx: index("house_earnings_wallet_idx").on(sql`lower(${table.walletAddress})`),
  statusIdx: index("house_earnings_status_idx").on(table.status),
  createdAtIdx: index("house_earnings_created_at_idx").on(table.createdAt),
}));

export const insertHouseVaultSchema = createInsertSchema(houseVaults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHousePositionSchema = createInsertSchema(housePositions).omit({
  id: true,
  stakedAt: true,
});

export const insertHouseDistributionSchema = createInsertSchema(houseDistributions).omit({
  id: true,
  distributedAt: true,
});

export const insertHouseEarningSchema = createInsertSchema(houseEarnings).omit({
  id: true,
  createdAt: true,
});

export type InsertHouseVault = z.infer<typeof insertHouseVaultSchema>;
export type HouseVault = typeof houseVaults.$inferSelect;
export type InsertHousePosition = z.infer<typeof insertHousePositionSchema>;
export type HousePosition = typeof housePositions.$inferSelect;
export type InsertHouseDistribution = z.infer<typeof insertHouseDistributionSchema>;
export type HouseDistribution = typeof houseDistributions.$inferSelect;
export type InsertHouseEarning = z.infer<typeof insertHouseEarningSchema>;
export type HouseEarning = typeof houseEarnings.$inferSelect;

// Auto-Compounding Staking System
export const autoCompoundPools = pgTable("auto_compound_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tokenSymbol: text("token_symbol").notNull().default("ETH"),
  baseApy: text("base_apy").notNull(), // Base APY (e.g., "45.5" for 45.5%)
  compoundFrequency: text("compound_frequency").notNull().default("hourly"), // hourly, daily, weekly
  totalStaked: text("total_staked").notNull().default("0"),
  totalStakers: text("total_stakers").notNull().default("0"),
  minStake: text("min_stake").notNull().default("0.01"),
  maxStake: text("max_stake"), // null for unlimited
  earlyWithdrawPenalty: text("early_withdraw_penalty").notNull().default("2"), // % penalty
  lockPeriod: text("lock_period").notNull().default("0"), // Days, 0 for no lock
  status: text("status").notNull().default("active"), // active, paused, closed
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("auto_compound_pools_status_idx").on(table.status),
  tokenIdx: index("auto_compound_pools_token_idx").on(table.tokenSymbol),
}));

export const autoCompoundStakes = pgTable("auto_compound_stakes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => autoCompoundPools.id),
  walletAddress: text("wallet_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  initialStake: text("initial_stake").notNull(), // Original stake amount
  currentBalance: text("current_balance").notNull(), // Current value with compounds
  totalEarned: text("total_earned").notNull().default("0"), // Total earnings
  compoundCount: text("compound_count").notNull().default("0"), // Number of compounds
  lastCompoundAt: timestamp("last_compound_at"),
  effectiveApy: text("effective_apy").notNull(), // Actual APY with compounds
  status: text("status").notNull().default("active"), // active, withdrawn
  stakedAt: timestamp("staked_at").notNull().defaultNow(),
  unlocksAt: timestamp("unlocks_at"), // When can withdraw without penalty
  withdrawnAt: timestamp("withdrawn_at"),
  withdrawnAmount: text("withdrawn_amount"),
}, (table) => ({
  poolIdx: index("auto_compound_stakes_pool_idx").on(table.poolId),
  walletIdx: index("auto_compound_stakes_wallet_idx").on(sql`lower(${table.walletAddress})`),
  userIdx: index("auto_compound_stakes_user_idx").on(table.userId),
  statusIdx: index("auto_compound_stakes_status_idx").on(table.status),
  stakedAtIdx: index("auto_compound_stakes_staked_at_idx").on(table.stakedAt),
}));

export const compoundEvents = pgTable("compound_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stakeId: varchar("stake_id").notNull().references(() => autoCompoundStakes.id),
  poolId: varchar("pool_id").notNull().references(() => autoCompoundPools.id),
  walletAddress: text("wallet_address").notNull(),
  balanceBefore: text("balance_before").notNull(),
  balanceAfter: text("balance_after").notNull(),
  rewardAmount: text("reward_amount").notNull(), // Amount compounded
  apyAtCompound: text("apy_at_compound").notNull(), // APY rate at time of compound
  compoundedAt: timestamp("compounded_at").notNull().defaultNow(),
}, (table) => ({
  stakeIdx: index("compound_events_stake_idx").on(table.stakeId),
  poolIdx: index("compound_events_pool_idx").on(table.poolId),
  walletIdx: index("compound_events_wallet_idx").on(sql`lower(${table.walletAddress})`),
  compoundedAtIdx: index("compound_events_compounded_at_idx").on(table.compoundedAt),
}));

export const insertAutoCompoundPoolSchema = createInsertSchema(autoCompoundPools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutoCompoundStakeSchema = createInsertSchema(autoCompoundStakes).omit({
  id: true,
  stakedAt: true,
});

export const insertCompoundEventSchema = createInsertSchema(compoundEvents).omit({
  id: true,
  compoundedAt: true,
});

export type InsertAutoCompoundPool = z.infer<typeof insertAutoCompoundPoolSchema>;
export type AutoCompoundPool = typeof autoCompoundPools.$inferSelect;
export type InsertAutoCompoundStake = z.infer<typeof insertAutoCompoundStakeSchema>;
export type AutoCompoundStake = typeof autoCompoundStakes.$inferSelect;
export type InsertCompoundEvent = z.infer<typeof insertCompoundEventSchema>;
export type CompoundEvent = typeof compoundEvents.$inferSelect;

// Yield Farming System
export const yieldFarmPools = pgTable("yield_farm_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  token0: text("token0").notNull(), // First token in LP pair
  token1: text("token1").notNull(), // Second token in LP pair
  apy: text("apy").notNull(), // Annual Percentage Yield
  tvl: text("tvl").notNull().default("0"), // Total Value Locked
  rewardToken: text("reward_token").notNull(), // Token rewarded
  lockPeriod: text("lock_period").notNull().default("0"), // Days
  status: text("status").notNull().default("active"), // active, ended
  multiplier: text("multiplier").notNull().default("1"), // Reward multiplier
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("yield_farm_pools_status_idx").on(table.status),
}));

export const yieldFarmPositions = pgTable("yield_farm_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => yieldFarmPools.id),
  user: text("user").notNull(), // Wallet address
  amount: text("amount").notNull(), // LP tokens deposited
  rewards: text("rewards").notNull().default("0"), // Pending rewards
  depositDate: timestamp("deposit_date").notNull().defaultNow(),
  autoCompound: text("auto_compound").notNull().default("false"), // Auto-compound enabled
  harvestCount: text("harvest_count").notNull().default("0"), // Number of harvests
  totalRewardsEarned: text("total_rewards_earned").notNull().default("0"), // Total earned
  lastRewardUpdate: timestamp("last_reward_update").defaultNow(),
}, (table) => ({
  poolIdx: index("yield_farm_positions_pool_idx").on(table.poolId),
  userLowerIdx: index("yield_farm_positions_user_lower_idx").on(sql`lower(${table.user})`),
}));

export const insertYieldFarmPoolSchema = createInsertSchema(yieldFarmPools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertYieldFarmPositionSchema = createInsertSchema(yieldFarmPositions).omit({
  id: true,
  depositDate: true,
  lastRewardUpdate: true,
});

export type InsertYieldFarmPool = z.infer<typeof insertYieldFarmPoolSchema>;
export type YieldFarmPool = typeof yieldFarmPools.$inferSelect;
export type InsertYieldFarmPosition = z.infer<typeof insertYieldFarmPositionSchema>;
export type YieldFarmPosition = typeof yieldFarmPositions.$inferSelect;

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  platform: text("platform").notNull(),
  accountName: text("account_name").notNull(),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  accessToken: text("access_token"),
  accessTokenSecret: text("access_token_secret"),
  isActive: text("is_active").notNull().default("true"),
  lastPostedAt: timestamp("last_posted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("social_accounts_user_idx").on(table.userId),
  platformIdx: index("social_accounts_platform_idx").on(table.platform),
  activeIdx: index("social_accounts_active_idx").on(table.isActive),
}));

export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  accountId: varchar("account_id").references(() => socialAccounts.id),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array().default(sql`'{}'::text[]`),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"),
  postType: text("post_type").notNull().default("auto"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("scheduled_posts_user_idx").on(table.userId),
  accountIdx: index("scheduled_posts_account_idx").on(table.accountId),
  statusIdx: index("scheduled_posts_status_idx").on(table.status),
  scheduledForIdx: index("scheduled_posts_scheduled_for_idx").on(table.scheduledFor),
}));

export const postHistory = pgTable("post_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  accountId: varchar("account_id").references(() => socialAccounts.id),
  scheduledPostId: varchar("scheduled_post_id").references(() => scheduledPosts.id),
  content: text("content").notNull(),
  platform: text("platform").notNull(),
  postUrl: text("post_url"),
  externalPostId: text("external_post_id"),
  status: text("status").notNull().default("success"),
  error: text("error"),
  engagement: jsonb("engagement"),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("post_history_user_idx").on(table.userId),
  accountIdx: index("post_history_account_idx").on(table.accountId),
  platformIdx: index("post_history_platform_idx").on(table.platform),
  postedAtIdx: index("post_history_posted_at_idx").on(table.postedAt),
}));

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostHistorySchema = createInsertSchema(postHistory).omit({
  id: true,
  postedAt: true,
});

export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertPostHistory = z.infer<typeof insertPostHistorySchema>;
export type PostHistory = typeof postHistory.$inferSelect;

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("digital"),
  category: text("category"),
  imageUrl: text("image_url"),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  cryptoPrices: jsonb("crypto_prices"),
  isActive: text("is_active").notNull().default("true"),
  stock: text("stock"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("products_category_idx").on(table.category),
  activeIdx: index("products_active_idx").on(table.isActive),
  typeIdx: index("products_type_idx").on(table.type),
}));

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: text("customer_email"),
  customerWallet: text("customer_wallet"),
  status: text("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: text("payment_method").notNull(),
  items: jsonb("items").notNull(),
  shippingInfo: jsonb("shipping_info"),
  metadata: jsonb("metadata"),
  expectedCryptoAmount: text("expected_crypto_amount"),
  expectedChainId: text("expected_chain_id"),
  fxRateLocked: text("fx_rate_locked"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("orders_user_idx").on(table.userId),
  statusIdx: index("orders_status_idx").on(table.status),
  customerEmailIdx: index("orders_customer_email_idx").on(table.customerEmail),
  customerWalletLowerIdx: index("orders_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
  paymentMethodIdx: index("orders_payment_method_idx").on(table.paymentMethod),
}));

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  paymentMethod: text("payment_method").notNull(),
  provider: text("provider").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  providerPaymentId: text("provider_payment_id"),
  providerResponse: jsonb("provider_response"),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  confirmations: text("confirmations").default("0"),
  errorMessage: text("error_message"),
  paidAt: timestamp("paid_at"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  orderIdx: index("payments_order_idx").on(table.orderId),
  statusIdx: index("payments_status_idx").on(table.status),
  txHashIdx: index("payments_tx_hash_idx").on(table.txHash),
  providerPaymentIdIdx: index("payments_provider_payment_id_idx").on(table.providerPaymentId),
  methodIdx: index("payments_method_idx").on(table.paymentMethod),
  providerIdx: index("payments_provider_idx").on(table.provider),
  createdAtIdx: index("payments_created_at_idx").on(table.createdAt),
}));

export const paymentWebhooks = pgTable("payment_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  eventType: text("event_type").notNull(),
  paymentId: varchar("payment_id").references(() => payments.id),
  payload: jsonb("payload").notNull(),
  signature: text("signature"),
  processed: text("processed").notNull().default("false"),
  processedAt: timestamp("processed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  providerIdx: index("payment_webhooks_provider_idx").on(table.provider),
  processedIdx: index("payment_webhooks_processed_idx").on(table.processed),
  paymentIdx: index("payment_webhooks_payment_idx").on(table.paymentId),
  createdAtIdx: index("payment_webhooks_created_at_idx").on(table.createdAt),
}));

// Supported Cryptocurrencies per Chain
export const supportedCurrencies = pgTable("supported_currencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(), // USDC, DAI, ETH, USDT
  name: text("name").notNull(),
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address"), // null for native tokens
  decimals: text("decimals").notNull().default("18"),
  isStablecoin: text("is_stablecoin").notNull().default("false"),
  isActive: text("is_active").notNull().default("true"),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  symbolChainIdx: index("supported_currencies_symbol_chain_idx").on(table.symbol, table.chainId),
  activeIdx: index("supported_currencies_active_idx").on(table.isActive),
}));

// Discount Codes
export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // percentage, fixed
  value: decimal("value", { precision: 20, scale: 8 }).notNull(),
  minPurchase: decimal("min_purchase", { precision: 20, scale: 8 }),
  maxDiscount: decimal("max_discount", { precision: 20, scale: 8 }),
  usageLimit: text("usage_limit"), // null for unlimited
  usageCount: text("usage_count").notNull().default("0"),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: text("is_active").notNull().default("true"),
  applicableProducts: text("applicable_products").array(), // null for all products
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  codeIdx: index("discount_codes_code_idx").on(table.code),
  activeIdx: index("discount_codes_active_idx").on(table.isActive),
}));

// Gift Cards
export const giftCards = pgTable("gift_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  initialValue: decimal("initial_value", { precision: 20, scale: 8 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  purchasedBy: text("purchased_by"), // wallet address
  purchaseTxHash: text("purchase_tx_hash"),
  recipientEmail: text("recipient_email"),
  recipientWallet: text("recipient_wallet"),
  message: text("message"),
  status: text("status").notNull().default("active"), // active, redeemed, expired, cancelled
  expiresAt: timestamp("expires_at"),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  codeIdx: index("gift_cards_code_idx").on(table.code),
  purchasedByLowerIdx: index("gift_cards_purchased_by_lower_idx").on(sql`lower(${table.purchasedBy})`),
  statusIdx: index("gift_cards_status_idx").on(table.status),
}));

// Gift Card Usage History
export const giftCardUsage = pgTable("gift_card_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCardId: varchar("gift_card_id").notNull().references(() => giftCards.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  amountUsed: decimal("amount_used", { precision: 20, scale: 8 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 20, scale: 8 }).notNull(),
  usedAt: timestamp("used_at").notNull().defaultNow(),
}, (table) => ({
  giftCardIdx: index("gift_card_usage_gift_card_idx").on(table.giftCardId),
  orderIdx: index("gift_card_usage_order_idx").on(table.orderId),
}));

// Loyalty Points System
export const loyaltyAccounts = pgTable("loyalty_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  totalPoints: text("total_points").notNull().default("0"),
  availablePoints: text("available_points").notNull().default("0"),
  lifetimePoints: text("lifetime_points").notNull().default("0"),
  tier: text("tier").notNull().default("bronze"), // bronze, silver, gold, platinum, diamond
  tierNftMinted: text("tier_nft_minted").notNull().default("false"),
  tierNftTokenId: text("tier_nft_token_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  walletLowerIdx: index("loyalty_accounts_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  tierIdx: index("loyalty_accounts_tier_idx").on(table.tier),
}));

// Loyalty Transactions
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => loyaltyAccounts.id),
  type: text("type").notNull(), // earned, redeemed, expired, bonus
  points: text("points").notNull(),
  balanceAfter: text("balance_after").notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  description: text("description").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  accountIdx: index("loyalty_transactions_account_idx").on(table.accountId),
  orderIdx: index("loyalty_transactions_order_idx").on(table.orderId),
  typeIdx: index("loyalty_transactions_type_idx").on(table.type),
}));

// Customer Reviews (Blockchain-Verified Purchases)
export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  walletAddress: text("wallet_address").notNull(),
  rating: text("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content"),
  verifiedPurchase: text("verified_purchase").notNull().default("true"),
  purchaseTxHash: text("purchase_tx_hash"),
  helpfulCount: text("helpful_count").notNull().default("0"),
  isApproved: text("is_approved").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("product_reviews_product_idx").on(table.productId),
  orderIdx: index("product_reviews_order_idx").on(table.orderId),
  walletLowerIdx: index("product_reviews_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  ratingIdx: index("product_reviews_rating_idx").on(table.rating),
}));

// Wishlists
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  addedAt: timestamp("added_at").notNull().defaultNow(),
}, (table) => ({
  walletProductIdx: index("wishlists_wallet_product_idx").on(table.walletAddress, table.productId),
  walletLowerIdx: index("wishlists_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  productIdx: index("wishlists_product_idx").on(table.productId),
}));

// Invoices / Payment Links
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  merchantWallet: text("merchant_wallet").notNull(),
  customerEmail: text("customer_email"),
  customerWallet: text("customer_wallet"),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal", { precision: 20, scale: 8 }).notNull(),
  tax: decimal("tax", { precision: 20, scale: 8 }).default("0"),
  total: decimal("total", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  acceptedCurrencies: text("accepted_currencies").array(), // null for all
  status: text("status").notNull().default("unpaid"), // unpaid, paid, cancelled, expired
  orderId: varchar("order_id").references(() => orders.id),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  invoiceNumberIdx: index("invoices_invoice_number_idx").on(table.invoiceNumber),
  merchantWalletLowerIdx: index("invoices_merchant_wallet_lower_idx").on(sql`lower(${table.merchantWallet})`),
  customerWalletLowerIdx: index("invoices_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  statusIdx: index("invoices_status_idx").on(table.status),
}));

// On-Chain NFT Receipts
export const nftReceipts = pgTable("nft_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  walletAddress: text("wallet_address").notNull(),
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id").notNull(),
  tokenUri: text("token_uri"),
  mintTxHash: text("mint_tx_hash").notNull(),
  receiptData: jsonb("receipt_data").notNull(), // order details stored on-chain
  status: text("status").notNull().default("minting"), // minting, minted, failed
  mintedAt: timestamp("minted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orderIdx: index("nft_receipts_order_idx").on(table.orderId),
  walletLowerIdx: index("nft_receipts_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  mintTxHashIdx: index("nft_receipts_mint_tx_hash_idx").on(table.mintTxHash),
}));

// Refunds
export const refunds = pgTable("refunds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  paymentId: varchar("payment_id").notNull().references(() => payments.id),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  refundTxHash: text("refund_tx_hash"),
  refundedTo: text("refunded_to"),
  processedBy: text("processed_by"), // admin wallet
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
}, (table) => ({
  orderIdx: index("refunds_order_idx").on(table.orderId),
  paymentIdx: index("refunds_payment_idx").on(table.paymentId),
  statusIdx: index("refunds_status_idx").on(table.status),
}));

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  billingInterval: text("billing_interval").notNull(), // daily, weekly, monthly, yearly
  trialDays: text("trial_days").default("0"),
  features: text("features").array(),
  maxSubscribers: text("max_subscribers"),
  isActive: text("is_active").notNull().default("true"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("subscription_plans_active_idx").on(table.isActive),
}));

// Customer Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  customerWallet: text("customer_wallet").notNull(),
  status: text("status").notNull().default("active"), // active, cancelled, expired, paused
  startDate: timestamp("start_date").notNull().defaultNow(),
  nextBillingDate: timestamp("next_billing_date").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  pausedAt: timestamp("paused_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  customerWalletLowerIdx: index("subscriptions_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  statusIdx: index("subscriptions_status_idx").on(table.status),
  nextBillingIdx: index("subscriptions_next_billing_idx").on(table.nextBillingDate),
}));

// Subscription Billing History
export const subscriptionBillings = pgTable("subscription_billings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, failed, refunded
  txHash: text("tx_hash"),
  paymentMethod: text("payment_method"),
  billingDate: timestamp("billing_date").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  subscriptionIdx: index("subscription_billings_subscription_idx").on(table.subscriptionId),
  statusIdx: index("subscription_billings_status_idx").on(table.status),
}));

// Affiliate Program
export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  referralCode: text("referral_code").notNull().unique(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("5.00"), // percentage
  totalEarned: decimal("total_earned", { precision: 20, scale: 8 }).notNull().default("0"),
  pendingEarnings: decimal("pending_earnings", { precision: 20, scale: 8 }).notNull().default("0"),
  totalReferrals: text("total_referrals").notNull().default("0"),
  status: text("status").notNull().default("active"), // active, suspended, banned
  payoutWallet: text("payout_wallet"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletLowerIdx: index("affiliates_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  referralCodeIdx: index("affiliates_referral_code_idx").on(table.referralCode),
  statusIdx: index("affiliates_status_idx").on(table.status),
}));

// Affiliate Referrals & Commissions
export const affiliateReferrals = pgTable("affiliate_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  referredWallet: text("referred_wallet").notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  commissionAmount: decimal("commission_amount", { precision: 20, scale: 8 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  orderAmount: decimal("order_amount", { precision: 20, scale: 8 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, paid, cancelled
  paidAt: timestamp("paid_at"),
  paidTxHash: text("paid_tx_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  affiliateIdx: index("affiliate_referrals_affiliate_idx").on(table.affiliateId),
  referredWalletLowerIdx: index("affiliate_referrals_referred_wallet_lower_idx").on(sql`lower(${table.referredWallet})`),
  statusIdx: index("affiliate_referrals_status_idx").on(table.status),
}));

// Product Variants (Size, Color, etc.)
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(), // e.g., "Large / Red"
  attributes: jsonb("attributes").notNull(), // { size: "L", color: "red" }
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 20, scale: 8 }),
  stock: text("stock").notNull().default("0"),
  lowStockThreshold: text("low_stock_threshold").default("5"),
  image: text("image"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("product_variants_product_idx").on(table.productId),
  skuIdx: index("product_variants_sku_idx").on(table.sku),
  activeIdx: index("product_variants_active_idx").on(table.isActive),
}));

// Flash Sales
export const flashSales = pgTable("flash_sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 20, scale: 8 }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  maxQuantity: text("max_quantity"), // total items available in sale
  soldQuantity: text("sold_quantity").notNull().default("0"),
  applicableProducts: text("applicable_products").array(), // product IDs
  status: text("status").notNull().default("scheduled"), // scheduled, active, ended, cancelled
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("flash_sales_status_idx").on(table.status),
  startTimeIdx: index("flash_sales_start_time_idx").on(table.startTime),
  endTimeIdx: index("flash_sales_end_time_idx").on(table.endTime),
}));

// Shopping Carts
export const carts = pgTable("carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  customerWallet: text("customer_wallet"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index("carts_session_idx").on(table.sessionId),
  customerWalletLowerIdx: index("carts_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
}));

// Cart Items
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: varchar("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  cartIdx: index("cart_items_cart_idx").on(table.cartId),
  productIdx: index("cart_items_product_idx").on(table.productId),
}));

// Abandoned Carts
export const abandonedCarts = pgTable("abandoned_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerWallet: text("customer_wallet").notNull(),
  items: jsonb("items").notNull(), // array of { productId, quantity, price }
  subtotal: decimal("subtotal", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  recoveryEmailSent: text("recovery_email_sent").notNull().default("false"),
  recoveryEmailSentAt: timestamp("recovery_email_sent_at"),
  converted: text("converted").notNull().default("false"),
  convertedOrderId: varchar("converted_order_id").references(() => orders.id),
  convertedAt: timestamp("converted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  customerWalletLowerIdx: index("abandoned_carts_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  convertedIdx: index("abandoned_carts_converted_idx").on(table.converted),
  expiresAtIdx: index("abandoned_carts_expires_at_idx").on(table.expiresAt),
}));

// Customer Tiers (VIP, Wholesale, etc.)
export const customerTiers = pgTable("customer_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  minPurchaseAmount: decimal("min_purchase_amount", { precision: 20, scale: 8 }),
  benefits: text("benefits").array(),
  color: text("color").default("#3b82f6"),
  icon: text("icon"),
  priority: text("priority").notNull().default("0"), // higher = better tier
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("customer_tiers_active_idx").on(table.isActive),
  priorityIdx: index("customer_tiers_priority_idx").on(table.priority),
}));

// Customer Tier Assignments
export const customerTierAssignments = pgTable("customer_tier_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerWallet: text("customer_wallet").notNull(),
  tierId: varchar("tier_id").notNull().references(() => customerTiers.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  assignedBy: text("assigned_by"), // admin wallet or "auto"
  metadata: jsonb("metadata"),
}, (table) => ({
  customerWalletLowerIdx: index("customer_tier_assignments_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  tierIdx: index("customer_tier_assignments_tier_idx").on(table.tierId),
}));

// Product Recommendations
export const productRecommendations = pgTable("product_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  recommendedProductId: varchar("recommended_product_id").notNull().references(() => products.id),
  type: text("type").notNull(), // cross_sell, upsell, related, bundle
  score: decimal("score", { precision: 5, scale: 2 }).default("1.0"), // relevance score
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("product_recommendations_product_idx").on(table.productId),
  typeIdx: index("product_recommendations_type_idx").on(table.type),
  activeIdx: index("product_recommendations_active_idx").on(table.isActive),
}));

// Pre-orders
export const preOrders = pgTable("pre_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  customerWallet: text("customer_wallet").notNull(),
  quantity: text("quantity").notNull(),
  totalAmount: decimal("total_amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  depositAmount: decimal("deposit_amount", { precision: 20, scale: 8 }), // partial payment
  depositPaid: text("deposit_paid").notNull().default("false"),
  depositTxHash: text("deposit_tx_hash"),
  status: text("status").notNull().default("pending"), // pending, confirmed, fulfilled, cancelled
  expectedReleaseDate: timestamp("expected_release_date"),
  fulfilledAt: timestamp("fulfilled_at"),
  orderId: varchar("order_id").references(() => orders.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  productIdx: index("pre_orders_product_idx").on(table.productId),
  customerWalletLowerIdx: index("pre_orders_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  statusIdx: index("pre_orders_status_idx").on(table.status),
}));

// Recently Viewed Products
export const recentlyViewed = pgTable("recently_viewed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerWallet: text("customer_wallet").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id),
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
}, (table) => ({
  customerWalletLowerIdx: index("recently_viewed_customer_wallet_lower_idx").on(sql`lower(${table.customerWallet})`),
  productIdx: index("recently_viewed_product_idx").on(table.productId),
  viewedAtIdx: index("recently_viewed_viewed_at_idx").on(table.viewedAt),
}));

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentWebhookSchema = createInsertSchema(paymentWebhooks).omit({
  id: true,
  createdAt: true,
});

export const insertSupportedCurrencySchema = createInsertSchema(supportedCurrencies).omit({
  id: true,
  createdAt: true,
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  createdAt: true,
});

export const insertGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  createdAt: true,
});

export const insertGiftCardUsageSchema = createInsertSchema(giftCardUsage).omit({
  id: true,
  usedAt: true,
});

export const insertLoyaltyAccountSchema = createInsertSchema(loyaltyAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  addedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertNftReceiptSchema = createInsertSchema(nftReceipts).omit({
  id: true,
  createdAt: true,
});

export const insertRefundSchema = createInsertSchema(refunds).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPaymentWebhook = z.infer<typeof insertPaymentWebhookSchema>;
export type PaymentWebhook = typeof paymentWebhooks.$inferSelect;

export type InsertSupportedCurrency = z.infer<typeof insertSupportedCurrencySchema>;
export type SupportedCurrency = typeof supportedCurrencies.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCardUsage = z.infer<typeof insertGiftCardUsageSchema>;
export type GiftCardUsage = typeof giftCardUsage.$inferSelect;
export type InsertLoyaltyAccount = z.infer<typeof insertLoyaltyAccountSchema>;
export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlists.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertNftReceipt = z.infer<typeof insertNftReceiptSchema>;
export type NftReceipt = typeof nftReceipts.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type Refund = typeof refunds.$inferSelect;

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionBillingSchema = createInsertSchema(subscriptionBillings).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateReferralSchema = createInsertSchema(affiliateReferrals).omit({
  id: true,
  createdAt: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
});

export const insertFlashSaleSchema = createInsertSchema(flashSales).omit({
  id: true,
  createdAt: true,
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertAbandonedCartSchema = createInsertSchema(abandonedCarts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerTierSchema = createInsertSchema(customerTiers).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerTierAssignmentSchema = createInsertSchema(customerTierAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertProductRecommendationSchema = createInsertSchema(productRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertPreOrderSchema = createInsertSchema(preOrders).omit({
  id: true,
  createdAt: true,
});

export const insertRecentlyViewedSchema = createInsertSchema(recentlyViewed).omit({
  id: true,
  viewedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscriptionBilling = z.infer<typeof insertSubscriptionBillingSchema>;
export type SubscriptionBilling = typeof subscriptionBillings.$inferSelect;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliateReferral = z.infer<typeof insertAffiliateReferralSchema>;
export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertFlashSale = z.infer<typeof insertFlashSaleSchema>;
export type FlashSale = typeof flashSales.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type Cart = typeof carts.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertAbandonedCart = z.infer<typeof insertAbandonedCartSchema>;
export type AbandonedCart = typeof abandonedCarts.$inferSelect;
export type InsertCustomerTier = z.infer<typeof insertCustomerTierSchema>;
export type CustomerTier = typeof customerTiers.$inferSelect;
export type InsertCustomerTierAssignment = z.infer<typeof insertCustomerTierAssignmentSchema>;
export type CustomerTierAssignment = typeof customerTierAssignments.$inferSelect;
export type InsertProductRecommendation = z.infer<typeof insertProductRecommendationSchema>;
export type ProductRecommendation = typeof productRecommendations.$inferSelect;
export type InsertPreOrder = z.infer<typeof insertPreOrderSchema>;
export type PreOrder = typeof preOrders.$inferSelect;
export type InsertRecentlyViewed = z.infer<typeof insertRecentlyViewedSchema>;
export type RecentlyViewed = typeof recentlyViewed.$inferSelect;

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // social, email, paid_ads, content, influencer, partnership
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  budget: text("budget").notNull().default("0"), // Total budget
  spent: text("spent").notNull().default("0"), // Amount spent
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetAudience: text("target_audience"),
  channels: text("channels").array().default(sql`'{}'::text[]`), // twitter, telegram, discord, etc
  goals: jsonb("goals"), // {impressions: 10000, clicks: 500, conversions: 50}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignMetrics = pgTable("campaign_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => marketingCampaigns.id),
  impressions: text("impressions").notNull().default("0"),
  clicks: text("clicks").notNull().default("0"),
  conversions: text("conversions").notNull().default("0"),
  revenue: text("revenue").notNull().default("0"),
  ctr: text("ctr").notNull().default("0"), // Click-through rate
  conversionRate: text("conversion_rate").notNull().default("0"),
  roi: text("roi").notNull().default("0"), // Return on investment
  date: timestamp("date").notNull(),
  metadata: jsonb("metadata"), // Additional platform-specific metrics
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  campaignIdx: index("campaign_metrics_campaign_idx").on(table.campaignId),
  dateIdx: index("campaign_metrics_date_idx").on(table.date),
}));

export const marketingBudgets = pgTable("marketing_budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => marketingCampaigns.id),
  channel: text("channel").notNull(), // specific channel within campaign
  allocated: text("allocated").notNull().default("0"),
  spent: text("spent").notNull().default("0"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  campaignChannelIdx: index("marketing_budgets_campaign_channel_idx").on(table.campaignId, table.channel),
}));

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignMetricSchema = createInsertSchema(campaignMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertMarketingBudgetSchema = createInsertSchema(marketingBudgets).omit({
  id: true,
  createdAt: true,
});

export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertCampaignMetric = z.infer<typeof insertCampaignMetricSchema>;
export type CampaignMetric = typeof campaignMetrics.$inferSelect;
export type InsertMarketingBudget = z.infer<typeof insertMarketingBudgetSchema>;
export type MarketingBudget = typeof marketingBudgets.$inferSelect;

// ===== WALLET SECURITY TABLES =====

export const walletSecurityPolicies = pgTable("wallet_security_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  multiSigEnabled: text("multi_sig_enabled").notNull().default("false"),
  hardwareWalletEnabled: text("hardware_wallet_enabled").notNull().default("false"),
  txSimulationEnabled: text("tx_simulation_enabled").notNull().default("true"),
  aiSentinelEnabled: text("ai_sentinel_enabled").notNull().default("true"),
  dailySpendingLimit: text("daily_spending_limit").default("10"), // In ETH
  requireApprovalAbove: text("require_approval_above").default("5"), // In ETH
  sessionTimeout: text("session_timeout").default("3600"), // In seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  walletLowerIdx: index("wallet_security_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  userIdx: index("wallet_security_user_idx").on(table.userId),
}));

export const trustedAddresses = pgTable("trusted_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  trustedAddress: text("trusted_address").notNull(),
  label: text("label"), // Optional label for the address
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  walletTrustedIdx: index("trusted_addresses_wallet_trusted_idx").on(table.walletAddress, table.trustedAddress),
  walletLowerIdx: index("trusted_addresses_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  trustedLowerIdx: index("trusted_addresses_trusted_lower_idx").on(sql`lower(${table.trustedAddress})`),
}));

export const blockedAddresses = pgTable("blocked_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  blockedAddress: text("blocked_address").notNull(),
  reason: text("reason"), // Why was it blocked
  blockedAt: timestamp("blocked_at").defaultNow(),
}, (table) => ({
  walletBlockedIdx: index("blocked_addresses_wallet_blocked_idx").on(table.walletAddress, table.blockedAddress),
  walletLowerIdx: index("blocked_addresses_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  blockedLowerIdx: index("blocked_addresses_blocked_lower_idx").on(sql`lower(${table.blockedAddress})`),
}));

export const securityAlerts = pgTable("security_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  type: text("type").notNull(), // spending_limit, suspicious_tx, blocked_address, unusual_pattern
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional context
  isRead: text("is_read").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  walletIdx: index("security_alerts_wallet_idx").on(table.walletAddress),
  walletLowerIdx: index("security_alerts_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  typeIdx: index("security_alerts_type_idx").on(table.type),
  severityIdx: index("security_alerts_severity_idx").on(table.severity),
  createdAtIdx: index("security_alerts_created_at_idx").on(table.createdAt),
}));

export const transactionLimits = pgTable("transaction_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalSpent: text("total_spent").notNull().default("0"), // In ETH
  transactionCount: text("transaction_count").notNull().default("0"),
  limitReached: text("limit_reached").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  walletPeriodIdx: index("transaction_limits_wallet_period_idx").on(table.walletAddress, table.periodStart),
  walletLowerIdx: index("transaction_limits_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
}));

// Insert schemas
export const insertWalletSecurityPolicySchema = createInsertSchema(walletSecurityPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrustedAddressSchema = createInsertSchema(trustedAddresses).omit({
  id: true,
  addedAt: true,
});

export const insertBlockedAddressSchema = createInsertSchema(blockedAddresses).omit({
  id: true,
  blockedAt: true,
});

export const insertSecurityAlertSchema = createInsertSchema(securityAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionLimitSchema = createInsertSchema(transactionLimits).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertWalletSecurityPolicy = z.infer<typeof insertWalletSecurityPolicySchema>;
export type WalletSecurityPolicy = typeof walletSecurityPolicies.$inferSelect;
export type InsertTrustedAddress = z.infer<typeof insertTrustedAddressSchema>;
export type TrustedAddress = typeof trustedAddresses.$inferSelect;
export type InsertBlockedAddress = z.infer<typeof insertBlockedAddressSchema>;
export type BlockedAddress = typeof blockedAddresses.$inferSelect;
export type InsertSecurityAlert = z.infer<typeof insertSecurityAlertSchema>;
export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type InsertTransactionLimit = z.infer<typeof insertTransactionLimitSchema>;
export type TransactionLimit = typeof transactionLimits.$inferSelect;

// ===== CODEX PLATFORM TOKEN & NFT ECOSYSTEM =====

// Platform Token (CODEX) - ERC-20 Governance & Utility Token
export const platformToken = pgTable("platform_token", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("CODEX"),
  symbol: text("symbol").notNull().default("CDX"),
  totalSupply: text("total_supply").notNull().default("1000000000"), // 1 billion tokens
  decimals: text("decimals").notNull().default("18"),
  contractAddress: text("contract_address"),
  chainId: text("chain_id").notNull().default("0x1"), // Ethereum mainnet
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Token Holdings - Track user balances
export const tokenHoldings = pgTable("token_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  balance: text("balance").notNull().default("0"),
  stakedBalance: text("staked_balance").notNull().default("0"),
  rewardsEarned: text("rewards_earned").notNull().default("0"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletLowerIdx: index("token_holdings_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  balanceIdx: index("token_holdings_balance_idx").on(table.balance),
}));

// Platform NFT Collections
export const platformNftCollections = pgTable("platform_nft_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  description: text("description"),
  type: text("type").notNull(), // founder, elite, genesis, achievement
  contractAddress: text("contract_address"),
  chainId: text("chain_id").notNull().default("0x1"),
  totalSupply: text("total_supply").notNull(),
  maxSupply: text("max_supply"),
  baseUri: text("base_uri"),
  royaltyPercentage: text("royalty_percentage").default("5"), // 5%
  isDynamic: text("is_dynamic").notNull().default("false"), // Can evolve
  isTransferable: text("is_transferable").notNull().default("true"), // Soulbound if false
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  typeIdx: index("platform_nft_collections_type_idx").on(table.type),
  contractIdx: index("platform_nft_collections_contract_idx").on(table.contractAddress),
}));

// User NFTs - Individual token ownership
export const platformUserNfts = pgTable("platform_user_nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").notNull().references(() => platformNftCollections.id),
  walletAddress: text("wallet_address").notNull(),
  tokenId: text("token_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  animationUrl: text("animation_url"),
  externalUrl: text("external_url"),
  attributes: jsonb("attributes"), // Standard NFT metadata attributes
  dynamicAttributes: jsonb("dynamic_attributes"), // AI-powered evolving attributes
  level: text("level").notNull().default("1"),
  experience: text("experience").notNull().default("0"),
  rarity: text("rarity").notNull().default("common"), // common, rare, epic, legendary, mythic
  powerScore: text("power_score").notNull().default("0"), // Overall NFT strength
  lastEvolutionAt: timestamp("last_evolution_at"),
  mintedAt: timestamp("minted_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  collectionIdx: index("platform_user_nfts_collection_idx").on(table.collectionId),
  walletLowerIdx: index("platform_user_nfts_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  tokenIdx: index("platform_user_nfts_token_idx").on(table.collectionId, table.tokenId),
  rarityIdx: index("platform_user_nfts_rarity_idx").on(table.rarity),
  levelIdx: index("platform_user_nfts_level_idx").on(table.level),
}));

// Living Achievement System - Revolutionary dynamic NFTs
export const platformAchievements = pgTable("platform_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // trading, staking, gaming, social, governance
  tier: text("tier").notNull().default("bronze"), // bronze, silver, gold, platinum, diamond
  requiredActions: jsonb("required_actions").notNull(), // Conditions to unlock
  rewards: jsonb("rewards"), // Token rewards, power boosts, exclusive access
  imageUrl: text("image_url"),
  isActive: text("is_active").notNull().default("true"),
  unlockCount: text("unlock_count").notNull().default("0"), // How many users unlocked
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("platform_achievements_category_idx").on(table.category),
  tierIdx: index("platform_achievements_tier_idx").on(table.tier),
  activeIdx: index("platform_achievements_active_idx").on(table.isActive),
}));

// User Achievement Progress
export const platformUserAchievements = pgTable("platform_user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  achievementId: varchar("achievement_id").notNull().references(() => platformAchievements.id),
  nftId: varchar("nft_id").references(() => platformUserNfts.id), // Linked Living Achievement NFT
  progress: jsonb("progress").notNull().default('{}'), // Current progress toward completion
  isCompleted: text("is_completed").notNull().default("false"),
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletAchievementIdx: index("platform_user_achievements_wallet_achievement_idx").on(table.walletAddress, table.achievementId),
  walletLowerIdx: index("platform_user_achievements_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  completedIdx: index("platform_user_achievements_completed_idx").on(table.isCompleted),
  nftIdx: index("platform_user_achievements_nft_idx").on(table.nftId),
}));

// NFT Evolution Log - Track how NFTs change over time
export const platformNftEvolutionLog = pgTable("platform_nft_evolution_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: varchar("nft_id").notNull().references(() => platformUserNfts.id),
  evolutionType: text("evolution_type").notNull(), // level_up, attribute_boost, rarity_upgrade, achievement_unlock
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  trigger: text("trigger"), // What caused the evolution
  aiAnalysis: text("ai_analysis"), // AI-generated insights
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  nftIdx: index("platform_nft_evolution_log_nft_idx").on(table.nftId),
  typeIdx: index("platform_nft_evolution_log_type_idx").on(table.evolutionType),
  createdAtIdx: index("platform_nft_evolution_log_created_at_idx").on(table.createdAt),
}));

// Staking Pools for CODEX Token
export const codexStakingPools = pgTable("codex_staking_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  apr: text("apr").notNull(), // Annual Percentage Rate
  lockPeriod: text("lock_period").notNull(), // In seconds
  minStake: text("min_stake").notNull().default("100"),
  maxStake: text("max_stake"),
  totalStaked: text("total_staked").notNull().default("0"),
  rewardsPool: text("rewards_pool").notNull().default("0"),
  isActive: text("is_active").notNull().default("true"),
  nftBonusMultiplier: text("nft_bonus_multiplier").default("1.0"), // NFT holders get bonus
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("codex_staking_pools_active_idx").on(table.isActive),
  aprIdx: index("codex_staking_pools_apr_idx").on(table.apr),
}));

// User Stakes
export const codexUserStakes = pgTable("codex_user_stakes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  poolId: varchar("pool_id").notNull().references(() => codexStakingPools.id),
  amount: text("amount").notNull(),
  rewardsEarned: text("rewards_earned").notNull().default("0"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  unlockDate: timestamp("unlock_date").notNull(),
  lastClaimDate: timestamp("last_claim_date"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  walletLowerIdx: index("codex_user_stakes_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  poolIdx: index("codex_user_stakes_pool_idx").on(table.poolId),
  activeIdx: index("codex_user_stakes_active_idx").on(table.isActive),
}));

// Insert Schemas
export const insertPlatformTokenSchema = createInsertSchema(platformToken).omit({
  id: true,
  createdAt: true,
});

export const insertTokenHoldingSchema = createInsertSchema(tokenHoldings).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertPlatformNftCollectionSchema = createInsertSchema(platformNftCollections).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformUserNftSchema = createInsertSchema(platformUserNfts).omit({
  id: true,
  mintedAt: true,
  createdAt: true,
});

export const insertPlatformAchievementSchema = createInsertSchema(platformAchievements).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformUserAchievementSchema = createInsertSchema(platformUserAchievements).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformNftEvolutionLogSchema = createInsertSchema(platformNftEvolutionLog).omit({
  id: true,
  createdAt: true,
});

export const insertCodexStakingPoolSchema = createInsertSchema(codexStakingPools).omit({
  id: true,
  createdAt: true,
});

export const insertCodexUserStakeSchema = createInsertSchema(codexUserStakes).omit({
  id: true,
  createdAt: true,
});

// Types
export type PlatformToken = typeof platformToken.$inferSelect;
export type InsertPlatformToken = z.infer<typeof insertPlatformTokenSchema>;
export type TokenHolding = typeof tokenHoldings.$inferSelect;
export type InsertTokenHolding = z.infer<typeof insertTokenHoldingSchema>;
export type PlatformNftCollection = typeof platformNftCollections.$inferSelect;
export type InsertPlatformNftCollection = z.infer<typeof insertPlatformNftCollectionSchema>;
export type PlatformUserNft = typeof platformUserNfts.$inferSelect;
export type InsertPlatformUserNft = z.infer<typeof insertPlatformUserNftSchema>;
export type PlatformAchievement = typeof platformAchievements.$inferSelect;
export type InsertPlatformAchievement = z.infer<typeof insertPlatformAchievementSchema>;
export type PlatformUserAchievement = typeof platformUserAchievements.$inferSelect;
export type InsertPlatformUserAchievement = z.infer<typeof insertPlatformUserAchievementSchema>;
export type PlatformNftEvolutionLog = typeof platformNftEvolutionLog.$inferSelect;
export type InsertPlatformNftEvolutionLog = z.infer<typeof insertPlatformNftEvolutionLogSchema>;
export type CodexStakingPool = typeof codexStakingPools.$inferSelect;
export type InsertCodexStakingPool = z.infer<typeof insertCodexStakingPoolSchema>;
export type CodexUserStake = typeof codexUserStakes.$inferSelect;
export type InsertCodexUserStake = z.infer<typeof insertCodexUserStakeSchema>;

// ===== MARKETPLACE SYSTEM =====
// Peer-to-peer trading of NFTs, Tokens, and Relics

export const marketplaceListings = pgTable("marketplace_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemType: varchar("item_type").notNull(), // nft, token, product
  itemId: varchar("item_id").notNull(), // ID of the NFT/token/product being sold
  sellerWallet: varchar("seller_wallet").notNull(),
  buyerWallet: varchar("buyer_wallet"),
  priceEth: varchar("price_eth").notNull(),
  status: varchar("status").notNull().default("active"), // active, sold, cancelled
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  metadata: jsonb("metadata"), // Additional item-specific data
  createdAt: timestamp("created_at").defaultNow(),
  soldAt: timestamp("sold_at"),
}, (table) => ({
  sellerIdx: index("marketplace_listings_seller_idx").on(sql`lower(${table.sellerWallet})`),
  buyerIdx: index("marketplace_listings_buyer_idx").on(sql`lower(${table.buyerWallet})`),
  itemTypeIdx: index("marketplace_listings_item_type_idx").on(table.itemType),
  statusIdx: index("marketplace_listings_status_idx").on(table.status),
}));

// Insert Schema
export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  createdAt: true,
});

// Types
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;

// ===== CODEX RELICS SYSTEM =====
// Tiered, soulbound artifacts earned through milestones

// Master Relic Catalog - Defines what relics exist
export const codexRelics = pgTable("codex_relics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  class: text("class").notNull(), // chronicle, catalyst, sentinel
  tier: text("tier").notNull(), // common, rare, epic, legendary, mythic
  imageUrl: text("image_url"),
  effectType: text("effect_type").notNull(), // stake_apy, trading_fee, bot_boost, achievement_unlock
  effectValue: text("effect_value").notNull(), // e.g., "1.2" for 20% boost
  effectDescription: text("effect_description").notNull(),
  acquisitionType: text("acquisition_type").notNull(), // milestone, forge, vault_ritual
  acquisitionRequirements: jsonb("acquisition_requirements").notNull(), // {stakingDays: 30, cdxBurned: 1000, etc}
  maxSupply: text("max_supply").default("0"), // "0" = unlimited
  currentSupply: text("current_supply").default("0"),
  isSoulbound: text("is_soulbound").notNull().default("true"), // Cannot be transferred
  isActive: text("is_active").notNull().default("true"),
  seasonId: text("season_id"), // For seasonal relics
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  classIdx: index("codex_relics_class_idx").on(table.class),
  tierIdx: index("codex_relics_tier_idx").on(table.tier),
  effectTypeIdx: index("codex_relics_effect_type_idx").on(table.effectType),
  activeIdx: index("codex_relics_active_idx").on(table.isActive),
  acquisitionIdx: index("codex_relics_acquisition_idx").on(table.acquisitionType),
}));

// User Relic Instances - Who owns what
export const codexRelicInstances = pgTable("codex_relic_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  relicId: varchar("relic_id").notNull().references(() => codexRelics.id),
  walletAddress: text("wallet_address").notNull(),
  isEquipped: text("is_equipped").notNull().default("false"), // Can equip up to 3 relics
  equipSlot: text("equip_slot"), // slot1, slot2, slot3
  level: text("level").notNull().default("1"), // Relics can level up
  experience: text("experience").notNull().default("0"),
  powerScore: text("power_score").notNull().default("100"), // Overall strength
  acquiredAt: timestamp("acquired_at").defaultNow(),
  metadata: jsonb("metadata"), // Additional relic-specific data
}, (table) => ({
  relicIdx: index("codex_relic_instances_relic_idx").on(table.relicId),
  walletLowerIdx: index("codex_relic_instances_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  equippedIdx: index("codex_relic_instances_equipped_idx").on(table.isEquipped),
  walletEquippedIdx: index("codex_relic_instances_wallet_equipped_idx").on(table.walletAddress, table.isEquipped),
  levelIdx: index("codex_relic_instances_level_idx").on(table.level),
}));

// Relic Progress Tracking - Milestone progress for earning relics
export const codexRelicProgress = pgTable("codex_relic_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  relicId: varchar("relic_id").notNull().references(() => codexRelics.id),
  walletAddress: text("wallet_address").notNull(),
  progressType: text("progress_type").notNull(), // staking_time, cdx_burned, trading_volume, vault_contribution
  currentValue: text("current_value").notNull().default("0"),
  requiredValue: text("required_value").notNull(),
  isCompleted: text("is_completed").notNull().default("false"),
  completedAt: timestamp("completed_at"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  metadata: jsonb("metadata"), // Track specific progress details
}, (table) => ({
  relicWalletIdx: index("codex_relic_progress_relic_wallet_idx").on(table.relicId, table.walletAddress),
  walletLowerIdx: index("codex_relic_progress_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  progressTypeIdx: index("codex_relic_progress_type_idx").on(table.progressType),
  completedIdx: index("codex_relic_progress_completed_idx").on(table.isCompleted),
}));

// Active Relic Effects - Track currently active boosts
export const codexRelicEffects = pgTable("codex_relic_effects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").notNull().references(() => codexRelicInstances.id),
  walletAddress: text("wallet_address").notNull(),
  effectType: text("effect_type").notNull(), // stake_apy, trading_fee, bot_boost
  effectValue: text("effect_value").notNull(),
  isActive: text("is_active").notNull().default("true"),
  activatedAt: timestamp("activated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // For time-limited effects
}, (table) => ({
  instanceIdx: index("codex_relic_effects_instance_idx").on(table.instanceId),
  walletLowerIdx: index("codex_relic_effects_wallet_lower_idx").on(sql`lower(${table.walletAddress})`),
  effectTypeIdx: index("codex_relic_effects_type_idx").on(table.effectType),
  activeIdx: index("codex_relic_effects_active_idx").on(table.isActive),
  walletActiveIdx: index("codex_relic_effects_wallet_active_idx").on(table.walletAddress, table.isActive),
}));

// Insert Schemas
export const insertCodexRelicSchema = createInsertSchema(codexRelics).omit({
  id: true,
  createdAt: true,
});

export const insertCodexRelicInstanceSchema = createInsertSchema(codexRelicInstances).omit({
  id: true,
  acquiredAt: true,
});

export const insertCodexRelicProgressSchema = createInsertSchema(codexRelicProgress).omit({
  id: true,
  lastUpdated: true,
});

export const insertCodexRelicEffectSchema = createInsertSchema(codexRelicEffects).omit({
  id: true,
  activatedAt: true,
});

// Types
export type CodexRelic = typeof codexRelics.$inferSelect;
export type InsertCodexRelic = z.infer<typeof insertCodexRelicSchema>;
export type CodexRelicInstance = typeof codexRelicInstances.$inferSelect;
export type InsertCodexRelicInstance = z.infer<typeof insertCodexRelicInstanceSchema>;
export type CodexRelicProgress = typeof codexRelicProgress.$inferSelect;
export type InsertCodexRelicProgress = z.infer<typeof insertCodexRelicProgressSchema>;
export type CodexRelicEffect = typeof codexRelicEffects.$inferSelect;
export type InsertCodexRelicEffect = z.infer<typeof insertCodexRelicEffectSchema>;
