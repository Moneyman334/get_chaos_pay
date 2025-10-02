import { 
  type User, 
  type InsertUser,
  type Wallet,
  type InsertWallet,
  type Transaction,
  type InsertTransaction,
  type NetworkInfo,
  type InsertNetworkInfo,
  type Token,
  type InsertToken,
  type TokenBalance,
  type InsertTokenBalance,
  type UserToken,
  type InsertUserToken,
  type Contract,
  type InsertContract,
  type ContractCall,
  type InsertContractCall,
  type ContractEventSub,
  type InsertContractEventSub,
  type ContractEvent,
  type InsertContractEvent,
  type NftCollection,
  type InsertNftCollection,
  type Nft,
  type InsertNft,
  type NftOwnership,
  type InsertNftOwnership,
  users,
  wallets,
  transactions,
  networkInfo,
  tokens,
  tokenBalances,
  userTokens,
  contracts,
  contractCalls,
  contractEventSubs,
  contractEvents,
  nftCollections,
  nfts,
  nftOwnerships,
  botStrategies,
  botSubscriptions,
  botUserConfigs,
  botActiveStrategies,
  botTrades,
  houseVaults,
  housePositions,
  houseDistributions,
  houseEarnings,
  type HouseVault,
  type InsertHouseVault,
  type HousePosition,
  type InsertHousePosition,
  type HouseDistribution,
  type InsertHouseDistribution,
  type HouseEarning,
  type InsertHouseEarning,
  autoCompoundPools,
  autoCompoundStakes,
  compoundEvents,
  type AutoCompoundPool,
  type InsertAutoCompoundPool,
  type AutoCompoundStake,
  type InsertAutoCompoundStake,
  type CompoundEvent,
  type InsertCompoundEvent,
  socialAccounts,
  scheduledPosts,
  postHistory,
  type SocialAccount,
  type InsertSocialAccount,
  type ScheduledPost,
  type InsertScheduledPost,
  type PostHistory,
  type InsertPostHistory,
  products,
  orders,
  payments,
  paymentWebhooks,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Payment,
  type InsertPayment,
  type PaymentWebhook,
  type InsertPaymentWebhook,
  bridgeTransactions,
  tradingSignals,
  governanceStakes,
  type BridgeTransaction,
  type InsertBridgeTransaction,
  type TradingSignal,
  type InsertTradingSignal,
  type GovernanceStake,
  type InsertGovernanceStake
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, or, desc, sql } from "drizzle-orm";

// Address normalization utility
function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Health check method
  healthCheck(): Promise<void>;
  
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet methods
  getWalletByAddress(address: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(address: string, updates: Partial<InsertWallet>): Promise<Wallet | undefined>;
  
  // Transaction methods
  getTransactionsByAddress(address: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(hash: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  upsertTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  
  // Network methods
  getAllNetworks(): Promise<NetworkInfo[]>;
  createOrUpdateNetwork(network: InsertNetworkInfo): Promise<NetworkInfo>;
  
  // Token methods
  getToken(id: string): Promise<Token | undefined>;
  getTokenByAddressAndChain(contractAddress: string, chainId: string): Promise<Token | undefined>;
  getTokensByChain(chainId: string): Promise<Token[]>;
  getAllTokens(): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  updateToken(id: string, updates: Partial<InsertToken>): Promise<Token | undefined>;
  
  // Token balance methods
  getTokenBalance(walletAddress: string, tokenId: string): Promise<TokenBalance | undefined>;
  getTokenBalancesByWallet(walletAddress: string): Promise<TokenBalance[]>;
  getTokenBalancesByToken(tokenId: string): Promise<TokenBalance[]>;
  createOrUpdateTokenBalance(tokenBalance: InsertTokenBalance): Promise<TokenBalance>;
  updateTokenBalance(walletAddress: string, tokenId: string, balance: string): Promise<TokenBalance | undefined>;
  
  // User token methods
  getUserTokens(userId: string, walletAddress: string): Promise<UserToken[]>;
  getUserTokensByWallet(walletAddress: string): Promise<UserToken[]>;
  addUserToken(userToken: InsertUserToken): Promise<UserToken>;
  removeUserToken(userId: string, walletAddress: string, tokenId: string): Promise<boolean>;
  updateUserToken(id: string, updates: Partial<InsertUserToken>): Promise<UserToken | undefined>;
  
  // Contract methods
  getContract(id: string): Promise<Contract | undefined>;
  getContractByAddressAndChain(address: string, chainId: string): Promise<Contract | undefined>;
  getContracts(filters?: { userId?: string; chainId?: string; tags?: string[] }): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, updates: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;
  
  // Contract call methods
  getContractCall(id: string): Promise<ContractCall | undefined>;
  getContractCalls(contractId: string, pagination?: { page: number; limit: number }): Promise<ContractCall[]>;
  getContractCallsByAddress(fromAddress: string, pagination?: { page: number; limit: number }): Promise<ContractCall[]>;
  createContractCall(call: InsertContractCall): Promise<ContractCall>;
  updateContractCall(id: string, updates: Partial<InsertContractCall>): Promise<ContractCall | undefined>;
  
  // Contract event subscription methods
  getContractEventSub(id: string): Promise<ContractEventSub | undefined>;
  getContractEventSubs(contractId: string): Promise<ContractEventSub[]>;
  getActiveEventSubs(): Promise<ContractEventSub[]>;
  createContractEventSub(subscription: InsertContractEventSub): Promise<ContractEventSub>;
  updateContractEventSub(id: string, updates: Partial<InsertContractEventSub>): Promise<ContractEventSub | undefined>;
  deleteContractEventSub(id: string): Promise<boolean>;
  
  // Contract event methods
  getContractEvent(id: string): Promise<ContractEvent | undefined>;
  getContractEvents(contractId: string, pagination?: { page: number; limit: number }): Promise<ContractEvent[]>;
  getContractEventsBySubscription(subscriptionId: string, pagination?: { page: number; limit: number }): Promise<ContractEvent[]>;
  createContractEvent(event: InsertContractEvent): Promise<ContractEvent>;

  // NFT Collection methods
  getNftCollection(id: string): Promise<NftCollection | undefined>;
  getNftCollectionByContract(contractAddress: string, chainId: string): Promise<NftCollection | undefined>;
  getNftCollections(filters?: { chainId?: string; verified?: boolean; search?: string }): Promise<NftCollection[]>;
  upsertNftCollection(collection: InsertNftCollection): Promise<NftCollection>;
  updateNftCollection(id: string, updates: Partial<InsertNftCollection>): Promise<NftCollection | undefined>;

  // NFT methods
  getNft(id: string): Promise<Nft | undefined>;
  getNftByToken(contractAddress: string, tokenId: string, chainId: string): Promise<Nft | undefined>;
  getNftsByCollection(collectionId: string, pagination?: { page: number; limit: number }): Promise<Nft[]>;
  getNftsByContract(contractAddress: string, chainId: string, pagination?: { page: number; limit: number }): Promise<Nft[]>;
  searchNfts(query: string, chainId?: string, pagination?: { page: number; limit: number }): Promise<Nft[]>;
  upsertNft(nft: InsertNft): Promise<Nft>;
  updateNft(id: string, updates: Partial<InsertNft>): Promise<Nft | undefined>;
  refreshNftMetadata(id: string): Promise<Nft | undefined>;

  // NFT Ownership methods
  getNftOwnership(id: string): Promise<NftOwnership | undefined>;
  getNftOwnershipByWalletAndNft(walletAddress: string, nftId: string): Promise<NftOwnership | undefined>;
  getNftOwnershipsByWallet(
    walletAddress: string, 
    filters?: { 
      chainId?: string; 
      contractAddress?: string; 
      collectionId?: string; 
      hidden?: boolean; 
      search?: string;
      attributes?: Record<string, string | string[]>;
    },
    pagination?: { page: number; limit: number; sortBy?: 'name' | 'collection' | 'acquired'; sortOrder?: 'asc' | 'desc' }
  ): Promise<NftOwnership[]>;
  getNftOwnershipsByNft(nftId: string): Promise<NftOwnership[]>;
  getCollectionsByWallet(walletAddress: string, chainId?: string): Promise<NftCollection[]>;
  upsertNftOwnership(ownership: InsertNftOwnership): Promise<NftOwnership>;
  updateNftOwnership(id: string, updates: Partial<InsertNftOwnership>): Promise<NftOwnership | undefined>;
  removeNftOwnership(walletAddress: string, nftId: string): Promise<boolean>;

  // NFT Aggregated queries
  getNftStats(walletAddress: string): Promise<{
    totalNfts: number;
    totalCollections: number;
    chainCounts: Record<string, number>;
    collectionCounts: Record<string, number>;
  }>;
  getNftAttributeFacets(
    walletAddress: string,
    filters?: { chainId?: string; collectionId?: string }
  ): Promise<Record<string, Record<string, number>>>;
  
  // Bot Strategy methods
  getAllBotStrategies(): Promise<any[]>;
  
  // Bot Subscription methods
  createBotSubscription(subscription: any): Promise<any>;
  getUserBotSubscription(userId: string): Promise<any | undefined>;
  
  // Bot User Config methods
  saveBotUserConfig(config: any): Promise<any>;
  getUserBotConfig(userId: string): Promise<any | undefined>;
  
  // Bot Active Strategy methods
  createBotActiveStrategy(strategy: any): Promise<any>;
  getUserActiveStrategies(userId: string): Promise<any[]>;
  stopBotStrategy(activeStrategyId: string): Promise<void>;
  
  // Bot Trade methods
  getUserBotTrades(userId: string, limit: number): Promise<any[]>;
  getStrategyTrades(activeStrategyId: string): Promise<any[]>;
  
  // House Vault methods
  getAllHouseVaults(): Promise<HouseVault[]>;
  getHouseVault(id: string): Promise<HouseVault | undefined>;
  createHouseVault(vault: InsertHouseVault): Promise<HouseVault>;
  updateHouseVault(id: string, updates: Partial<InsertHouseVault>): Promise<HouseVault | undefined>;
  
  // House Position methods
  getUserPositions(walletAddress: string): Promise<HousePosition[]>;
  getVaultPositions(vaultId: string): Promise<HousePosition[]>;
  getPosition(id: string): Promise<HousePosition | undefined>;
  createPosition(position: InsertHousePosition): Promise<HousePosition>;
  updatePosition(id: string, updates: Partial<InsertHousePosition>): Promise<HousePosition | undefined>;
  
  // House Distribution methods
  getVaultDistributions(vaultId: string, limit?: number): Promise<HouseDistribution[]>;
  createDistribution(distribution: InsertHouseDistribution): Promise<HouseDistribution>;
  
  // House Earning methods
  getPositionEarnings(positionId: string): Promise<HouseEarning[]>;
  getUserEarnings(walletAddress: string): Promise<HouseEarning[]>;
  createEarning(earning: InsertHouseEarning): Promise<HouseEarning>;
  claimEarning(id: string): Promise<HouseEarning | undefined>;
  
  // Auto-Compound Pool methods
  getAllAutoCompoundPools(): Promise<AutoCompoundPool[]>;
  getActiveAutoCompoundPools(): Promise<AutoCompoundPool[]>;
  getAutoCompoundPool(id: string): Promise<AutoCompoundPool | undefined>;
  createAutoCompoundPool(pool: InsertAutoCompoundPool): Promise<AutoCompoundPool>;
  updateAutoCompoundPool(id: string, updates: Partial<InsertAutoCompoundPool>): Promise<AutoCompoundPool | undefined>;
  
  // Auto-Compound Stake methods
  getUserStakes(walletAddress: string): Promise<AutoCompoundStake[]>;
  getPoolStakes(poolId: string): Promise<AutoCompoundStake[]>;
  getStake(id: string): Promise<AutoCompoundStake | undefined>;
  createStake(stake: InsertAutoCompoundStake): Promise<AutoCompoundStake>;
  updateStake(id: string, updates: Partial<InsertAutoCompoundStake>): Promise<AutoCompoundStake | undefined>;
  
  // Compound Event methods
  getStakeCompoundEvents(stakeId: string, limit?: number): Promise<CompoundEvent[]>;
  getUserCompoundEvents(walletAddress: string, limit?: number): Promise<CompoundEvent[]>;
  createCompoundEvent(event: InsertCompoundEvent): Promise<CompoundEvent>;
  
  // Social Media Automation methods
  getSocialAccount(id: string): Promise<any>;
  getUserSocialAccounts(userId: string): Promise<any[]>;
  getActiveSocialAccounts(userId: string): Promise<any[]>;
  createSocialAccount(account: any): Promise<any>;
  updateSocialAccount(id: string, updates: any): Promise<any>;
  deleteSocialAccount(id: string): Promise<boolean>;
  
  // Scheduled Post methods
  getScheduledPost(id: string): Promise<any>;
  getUserScheduledPosts(userId: string): Promise<any[]>;
  getPendingPosts(): Promise<any[]>;
  getPostsDueForPublish(time: Date): Promise<any[]>;
  createScheduledPost(post: any): Promise<any>;
  updateScheduledPost(id: string, updates: any): Promise<any>;
  deleteScheduledPost(id: string): Promise<boolean>;
  
  // Post History methods
  getPostHistory(id: string): Promise<any>;
  getUserPostHistory(userId: string, limit?: number): Promise<any[]>;
  getAccountPostHistory(accountId: string, limit?: number): Promise<any[]>;
  createPostHistory(history: any): Promise<any>;
  
  // Product methods
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Order methods
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  getOrdersByWallet(walletAddress: string): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Payment methods
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByOrder(orderId: string): Promise<Payment[]>;
  getPaymentByTxHash(txHash: string): Promise<Payment | undefined>;
  getPaymentByProviderPaymentId(providerPaymentId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined>;
  
  // Payment Webhook methods
  getPaymentWebhook(id: string): Promise<PaymentWebhook | undefined>;
  getUnprocessedWebhooks(provider: string): Promise<PaymentWebhook[]>;
  createPaymentWebhook(webhook: InsertPaymentWebhook): Promise<PaymentWebhook>;
  markWebhookProcessed(id: string, error?: string): Promise<PaymentWebhook | undefined>;
  
  // Bridge Transaction methods
  getBridgeTransactions(walletAddress: string): Promise<BridgeTransaction[]>;
  getBridgeTransaction(id: string): Promise<BridgeTransaction | undefined>;
  createBridgeTransaction(transaction: InsertBridgeTransaction): Promise<BridgeTransaction>;
  updateBridgeTransaction(id: string, updates: Partial<InsertBridgeTransaction>): Promise<BridgeTransaction | undefined>;
  
  // Trading Signal methods
  getTradingSignals(): Promise<TradingSignal[]>;
  getTradingSignal(id: string): Promise<TradingSignal | undefined>;
  createTradingSignal(signal: InsertTradingSignal): Promise<TradingSignal>;
  updateTradingSignal(id: string, updates: Partial<InsertTradingSignal>): Promise<TradingSignal | undefined>;
  
  // Governance Stake methods
  getGovernanceStakes(walletAddress: string): Promise<GovernanceStake[]>;
  getGovernanceStake(id: string): Promise<GovernanceStake | undefined>;
  createGovernanceStake(stake: InsertGovernanceStake): Promise<GovernanceStake>;
  updateGovernanceStake(id: string, updates: Partial<InsertGovernanceStake>): Promise<GovernanceStake | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private wallets: Map<string, Wallet>;
  private transactions: Map<string, Transaction>;
  private networks: Map<string, NetworkInfo>;
  private tokens: Map<string, Token>;
  private tokenBalances: Map<string, TokenBalance>;
  private userTokens: Map<string, UserToken>;
  private contracts: Map<string, Contract>;
  private contractCalls: Map<string, ContractCall>;
  private contractEventSubs: Map<string, ContractEventSub>;
  private contractEvents: Map<string, ContractEvent>;

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.networks = new Map();
    this.tokens = new Map();
    this.tokenBalances = new Map();
    this.userTokens = new Map();
    this.contracts = new Map();
    this.contractCalls = new Map();
    this.contractEventSubs = new Map();
    this.contractEvents = new Map();
  }

  // Health check for MemStorage (always passes)
  async healthCheck(): Promise<void> {
    // Memory storage doesn't require database extensions
    return;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Wallet methods
  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(
      (wallet) => wallet.address.toLowerCase() === address.toLowerCase()
    );
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = randomUUID();
    const wallet: Wallet = { 
      address: normalizeAddress(insertWallet.address),
      balance: insertWallet.balance || "0",
      network: insertWallet.network || "mainnet",
      userId: insertWallet.userId || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async updateWallet(address: string, updates: Partial<InsertWallet>): Promise<Wallet | undefined> {
    const wallet = await this.getWalletByAddress(address);
    if (!wallet) return undefined;

    const updatedWallet: Wallet = { 
      ...wallet, 
      ...updates,
      updatedAt: new Date()
    };
    this.wallets.set(wallet.id, updatedWallet);
    return updatedWallet;
  }

  // Transaction methods
  async getTransactionsByAddress(address: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (tx) => 
        tx.fromAddress.toLowerCase() === address.toLowerCase() ||
        tx.toAddress.toLowerCase() === address.toLowerCase()
    ).sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      hash: insertTransaction.hash,
      fromAddress: normalizeAddress(insertTransaction.fromAddress),
      toAddress: normalizeAddress(insertTransaction.toAddress),
      amount: insertTransaction.amount,
      gasPrice: insertTransaction.gasPrice || null,
      gasUsed: insertTransaction.gasUsed || null,
      fee: insertTransaction.fee || null,
      status: insertTransaction.status || "pending",
      network: insertTransaction.network || "mainnet",
      blockNumber: insertTransaction.blockNumber || null,
      metadata: insertTransaction.metadata || null,
      id,
      timestamp: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(hash: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = Array.from(this.transactions.values()).find(tx => tx.hash === hash);
    if (!transaction) return undefined;

    const updatedTransaction: Transaction = { 
      ...transaction, 
      ...updates
    };
    this.transactions.set(transaction.id, updatedTransaction);
    return updatedTransaction;
  }

  async upsertTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    const results: Transaction[] = [];
    
    for (const insertTransaction of insertTransactions) {
      // Check if transaction already exists (by hash and network)
      const existing = Array.from(this.transactions.values()).find(
        tx => tx.hash === insertTransaction.hash && tx.network === (insertTransaction.network || "mainnet")
      );

      if (existing) {
        // Update existing transaction
        const updatedTransaction: Transaction = { 
          ...existing,
          ...insertTransaction,
          fromAddress: normalizeAddress(insertTransaction.fromAddress),
          toAddress: normalizeAddress(insertTransaction.toAddress),
          id: existing.id, // Keep existing ID
          timestamp: existing.timestamp // Keep original timestamp
        };
        this.transactions.set(existing.id, updatedTransaction);
        results.push(updatedTransaction);
      } else {
        // Create new transaction
        const id = randomUUID();
        const transaction: Transaction = { 
          hash: insertTransaction.hash,
          fromAddress: normalizeAddress(insertTransaction.fromAddress),
          toAddress: normalizeAddress(insertTransaction.toAddress),
          amount: insertTransaction.amount,
          gasPrice: insertTransaction.gasPrice || null,
          gasUsed: insertTransaction.gasUsed || null,
          fee: insertTransaction.fee || null,
          status: insertTransaction.status || "pending",
          network: insertTransaction.network || "mainnet",
          blockNumber: insertTransaction.blockNumber || null,
          metadata: insertTransaction.metadata || null,
          id,
          timestamp: new Date()
        };
        this.transactions.set(id, transaction);
        results.push(transaction);
      }
    }
    
    return results;
  }

  // Network methods
  async getAllNetworks(): Promise<NetworkInfo[]> {
    return Array.from(this.networks.values());
  }

  async createOrUpdateNetwork(insertNetwork: InsertNetworkInfo): Promise<NetworkInfo> {
    const existing = Array.from(this.networks.values()).find(
      (network) => network.chainId === insertNetwork.chainId
    );

    if (existing) {
      const updatedNetwork: NetworkInfo = { 
        ...existing, 
        ...insertNetwork,
        updatedAt: new Date()
      };
      this.networks.set(existing.id, updatedNetwork);
      return updatedNetwork;
    } else {
      const id = randomUUID();
      const network: NetworkInfo = { 
        chainId: insertNetwork.chainId,
        name: insertNetwork.name,
        rpcUrl: insertNetwork.rpcUrl,
        blockExplorerUrl: insertNetwork.blockExplorerUrl || null,
        symbol: insertNetwork.symbol || "ETH",
        decimals: insertNetwork.decimals || "18",
        isTestnet: insertNetwork.isTestnet || "false",
        id,
        updatedAt: new Date()
      };
      this.networks.set(id, network);
      return network;
    }
  }

  // Token methods
  async getToken(id: string): Promise<Token | undefined> {
    return this.tokens.get(id);
  }

  async getTokenByAddressAndChain(contractAddress: string, chainId: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(
      (token) => 
        token.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
        token.chainId === chainId
    );
  }

  async getTokensByChain(chainId: string): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(
      (token) => token.chainId === chainId
    );
  }

  async getAllTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = randomUUID();
    const token: Token = {
      contractAddress: normalizeAddress(insertToken.contractAddress),
      chainId: insertToken.chainId,
      name: insertToken.name,
      symbol: insertToken.symbol,
      decimals: insertToken.decimals || "18",
      logoUrl: insertToken.logoUrl || null,
      isVerified: insertToken.isVerified || "false",
      totalSupply: insertToken.totalSupply || null,
      description: insertToken.description || null,
      website: insertToken.website || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tokens.set(id, token);
    return token;
  }

  async updateToken(id: string, updates: Partial<InsertToken>): Promise<Token | undefined> {
    const token = this.tokens.get(id);
    if (!token) return undefined;

    const updatedToken: Token = {
      ...token,
      ...updates,
      contractAddress: updates.contractAddress ? normalizeAddress(updates.contractAddress) : token.contractAddress,
      updatedAt: new Date()
    };
    this.tokens.set(id, updatedToken);
    return updatedToken;
  }

  // Token balance methods
  async getTokenBalance(walletAddress: string, tokenId: string): Promise<TokenBalance | undefined> {
    return Array.from(this.tokenBalances.values()).find(
      (balance) => 
        balance.walletAddress.toLowerCase() === walletAddress.toLowerCase() &&
        balance.tokenId === tokenId
    );
  }

  async getTokenBalancesByWallet(walletAddress: string): Promise<TokenBalance[]> {
    return Array.from(this.tokenBalances.values()).filter(
      (balance) => balance.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  async getTokenBalancesByToken(tokenId: string): Promise<TokenBalance[]> {
    return Array.from(this.tokenBalances.values()).filter(
      (balance) => balance.tokenId === tokenId
    );
  }

  async createOrUpdateTokenBalance(insertTokenBalance: InsertTokenBalance): Promise<TokenBalance> {
    const existing = await this.getTokenBalance(insertTokenBalance.walletAddress, insertTokenBalance.tokenId);
    
    if (existing) {
      const updatedBalance: TokenBalance = {
        ...existing,
        balance: insertTokenBalance.balance,
        lastUpdated: new Date()
      };
      this.tokenBalances.set(existing.id, updatedBalance);
      return updatedBalance;
    } else {
      const id = randomUUID();
      const tokenBalance: TokenBalance = {
        walletAddress: normalizeAddress(insertTokenBalance.walletAddress),
        tokenId: insertTokenBalance.tokenId,
        balance: insertTokenBalance.balance,
        id,
        lastUpdated: new Date()
      };
      this.tokenBalances.set(id, tokenBalance);
      return tokenBalance;
    }
  }

  async updateTokenBalance(walletAddress: string, tokenId: string, balance: string): Promise<TokenBalance | undefined> {
    const tokenBalance = await this.getTokenBalance(walletAddress, tokenId);
    if (!tokenBalance) return undefined;

    const updatedBalance: TokenBalance = {
      ...tokenBalance,
      balance,
      lastUpdated: new Date()
    };
    this.tokenBalances.set(tokenBalance.id, updatedBalance);
    return updatedBalance;
  }

  // User token methods
  async getUserTokens(userId: string, walletAddress: string): Promise<UserToken[]> {
    return Array.from(this.userTokens.values()).filter(
      (userToken) => 
        userToken.userId === userId &&
        userToken.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  async getUserTokensByWallet(walletAddress: string): Promise<UserToken[]> {
    return Array.from(this.userTokens.values()).filter(
      (userToken) => userToken.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  async addUserToken(insertUserToken: InsertUserToken): Promise<UserToken> {
    const id = randomUUID();
    const userToken: UserToken = {
      userId: insertUserToken.userId || null,
      walletAddress: normalizeAddress(insertUserToken.walletAddress),
      tokenId: insertUserToken.tokenId,
      isHidden: insertUserToken.isHidden || "false",
      sortOrder: insertUserToken.sortOrder || "0",
      id,
      addedAt: new Date()
    };
    this.userTokens.set(id, userToken);
    return userToken;
  }

  async removeUserToken(userId: string, walletAddress: string, tokenId: string): Promise<boolean> {
    const userToken = Array.from(this.userTokens.values()).find(
      (ut) => 
        ut.userId === userId &&
        ut.walletAddress.toLowerCase() === walletAddress.toLowerCase() &&
        ut.tokenId === tokenId
    );
    
    if (userToken) {
      this.userTokens.delete(userToken.id);
      return true;
    }
    return false;
  }

  async updateUserToken(id: string, updates: Partial<InsertUserToken>): Promise<UserToken | undefined> {
    const userToken = this.userTokens.get(id);
    if (!userToken) return undefined;

    const updatedUserToken: UserToken = {
      ...userToken,
      ...updates,
      walletAddress: updates.walletAddress ? normalizeAddress(updates.walletAddress) : userToken.walletAddress
    };
    this.userTokens.set(id, updatedUserToken);
    return updatedUserToken;
  }
}

// Database connection setup
const sql_client = neon(process.env.DATABASE_URL!);
const db = drizzle(sql_client);

export class PostgreSQLStorage implements IStorage {
  // Health check to verify database extensions
  async healthCheck(): Promise<void> {
    try {
      // Check if pgcrypto extension is available
      const extensionCheck = await db.execute(sql`
        SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
      `);
      
      if (extensionCheck.rows.length === 0) {
        throw new Error("pgcrypto extension is not installed");
      }

      // Test UUID generation function
      const uuidTest = await db.execute(sql`SELECT gen_random_uuid() as test_uuid`);
      
      if (!uuidTest.rows[0]?.test_uuid) {
        throw new Error("gen_random_uuid() function is not working");
      }

      console.log("✅ Database health check passed: pgcrypto extension is working");
    } catch (error) {
      console.error("❌ Database health check failed:", error);
      throw error;
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Wallet methods
  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    const normalizedAddress = normalizeAddress(address);
    const result = await db.select().from(wallets)
      .where(sql`lower(${wallets.address}) = ${normalizedAddress}`)
      .limit(1);
    return result[0];
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const walletData = {
      ...insertWallet,
      address: normalizeAddress(insertWallet.address),
      balance: insertWallet.balance || "0",
      network: insertWallet.network || "mainnet"
    };
    const result = await db.insert(wallets).values(walletData).returning();
    return result[0];
  }

  async updateWallet(address: string, updates: Partial<InsertWallet>): Promise<Wallet | undefined> {
    const normalizedAddress = normalizeAddress(address);
    const updateData = {
      ...updates,
      address: updates.address ? normalizeAddress(updates.address) : undefined,
      updatedAt: sql`now()`
    };
    const result = await db.update(wallets)
      .set(updateData)
      .where(sql`lower(${wallets.address}) = ${normalizedAddress}`)
      .returning();
    return result[0];
  }

  // Transaction methods
  async getTransactionsByAddress(address: string): Promise<Transaction[]> {
    const normalizedAddress = normalizeAddress(address);
    const result = await db.select().from(transactions)
      .where(or(
        sql`lower(${transactions.fromAddress}) = ${normalizedAddress}`,
        sql`lower(${transactions.toAddress}) = ${normalizedAddress}`
      ))
      .orderBy(desc(transactions.timestamp));
    return result;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transactionData = {
      ...insertTransaction,
      fromAddress: normalizeAddress(insertTransaction.fromAddress),
      toAddress: normalizeAddress(insertTransaction.toAddress),
      status: insertTransaction.status || "pending",
      network: insertTransaction.network || "mainnet"
    };
    const result = await db.insert(transactions).values(transactionData).returning();
    return result[0];
  }

  async updateTransaction(hash: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions)
      .set(updates)
      .where(eq(transactions.hash, hash))
      .returning();
    return result[0];
  }

  async upsertTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    const results: Transaction[] = [];
    
    for (const insertTransaction of insertTransactions) {
      const transactionData = {
        ...insertTransaction,
        fromAddress: normalizeAddress(insertTransaction.fromAddress),
        toAddress: normalizeAddress(insertTransaction.toAddress),
        status: insertTransaction.status || "pending",
        network: insertTransaction.network || "mainnet"
      };

      try {
        // Try to insert, if conflict then update
        const result = await db.insert(transactions)
          .values(transactionData)
          .onConflictDoUpdate({
            target: transactions.hash,
            set: {
              fromAddress: sql`excluded.${transactions.fromAddress}`,
              toAddress: sql`excluded.${transactions.toAddress}`,
              amount: sql`excluded.${transactions.amount}`,
              gasPrice: sql`excluded.${transactions.gasPrice}`,
              gasUsed: sql`excluded.${transactions.gasUsed}`,
              fee: sql`excluded.${transactions.fee}`,
              status: sql`excluded.${transactions.status}`,
              blockNumber: sql`excluded.${transactions.blockNumber}`,
              metadata: sql`excluded.${transactions.metadata}`,
              updatedAt: sql`now()`
            }
          })
          .returning();
        
        results.push(result[0]);
      } catch (error) {
        // If upsert fails, try a select to see if it exists
        console.warn(`Failed to upsert transaction ${insertTransaction.hash}:`, error);
        try {
          const existing = await db.select().from(transactions)
            .where(eq(transactions.hash, insertTransaction.hash))
            .limit(1);
          
          if (existing[0]) {
            results.push(existing[0]);
          }
        } catch (selectError) {
          console.error(`Failed to select existing transaction ${insertTransaction.hash}:`, selectError);
        }
      }
    }
    
    return results;
  }

  // Network methods
  async getAllNetworks(): Promise<NetworkInfo[]> {
    const result = await db.select().from(networkInfo);
    return result;
  }

  async createOrUpdateNetwork(insertNetwork: InsertNetworkInfo): Promise<NetworkInfo> {
    // Try to find existing network by chainId
    const existing = await db.select().from(networkInfo)
      .where(eq(networkInfo.chainId, insertNetwork.chainId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing network
      const updateData = {
        ...insertNetwork,
        updatedAt: sql`now()`
      };
      const result = await db.update(networkInfo)
        .set(updateData)
        .where(eq(networkInfo.chainId, insertNetwork.chainId))
        .returning();
      return result[0];
    } else {
      // Create new network
      const networkData = {
        ...insertNetwork,
        symbol: insertNetwork.symbol || "ETH",
        decimals: insertNetwork.decimals || "18",
        isTestnet: insertNetwork.isTestnet || "false"
      };
      const result = await db.insert(networkInfo).values(networkData).returning();
      return result[0];
    }
  }

  // Token methods
  async getToken(id: string): Promise<Token | undefined> {
    const result = await db.select().from(tokens).where(eq(tokens.id, id)).limit(1);
    return result[0];
  }

  async getTokenByAddressAndChain(contractAddress: string, chainId: string): Promise<Token | undefined> {
    const normalizedAddress = normalizeAddress(contractAddress);
    const result = await db.select().from(tokens)
      .where(sql`lower(${tokens.contractAddress}) = ${normalizedAddress} AND ${tokens.chainId} = ${chainId}`)
      .limit(1);
    return result[0];
  }

  async getTokensByChain(chainId: string): Promise<Token[]> {
    const result = await db.select().from(tokens)
      .where(eq(tokens.chainId, chainId))
      .orderBy(tokens.symbol);
    return result;
  }

  async getAllTokens(): Promise<Token[]> {
    const result = await db.select().from(tokens)
      .orderBy(tokens.chainId, tokens.symbol);
    return result;
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const tokenData = {
      ...insertToken,
      contractAddress: normalizeAddress(insertToken.contractAddress),
      decimals: insertToken.decimals || "18",
      isVerified: insertToken.isVerified || "false"
    };
    const result = await db.insert(tokens).values(tokenData).returning();
    return result[0];
  }

  async updateToken(id: string, updates: Partial<InsertToken>): Promise<Token | undefined> {
    const updateData = {
      ...updates,
      contractAddress: updates.contractAddress ? normalizeAddress(updates.contractAddress) : undefined,
      updatedAt: sql`now()`
    };
    const result = await db.update(tokens)
      .set(updateData)
      .where(eq(tokens.id, id))
      .returning();
    return result[0];
  }

  // Token balance methods
  async getTokenBalance(walletAddress: string, tokenId: string): Promise<TokenBalance | undefined> {
    const normalizedAddress = normalizeAddress(walletAddress);
    const result = await db.select().from(tokenBalances)
      .where(sql`lower(${tokenBalances.walletAddress}) = ${normalizedAddress} AND ${tokenBalances.tokenId} = ${tokenId}`)
      .limit(1);
    return result[0];
  }

  async getTokenBalancesByWallet(walletAddress: string): Promise<TokenBalance[]> {
    const normalizedAddress = normalizeAddress(walletAddress);
    const result = await db.select().from(tokenBalances)
      .where(sql`lower(${tokenBalances.walletAddress}) = ${normalizedAddress}`)
      .orderBy(desc(tokenBalances.lastUpdated));
    return result;
  }

  async getTokenBalancesByToken(tokenId: string): Promise<TokenBalance[]> {
    const result = await db.select().from(tokenBalances)
      .where(eq(tokenBalances.tokenId, tokenId))
      .orderBy(desc(tokenBalances.lastUpdated));
    return result;
  }

  async createOrUpdateTokenBalance(insertTokenBalance: InsertTokenBalance): Promise<TokenBalance> {
    const normalizedAddress = normalizeAddress(insertTokenBalance.walletAddress);
    
    // Try to find existing balance
    const existing = await db.select().from(tokenBalances)
      .where(sql`lower(${tokenBalances.walletAddress}) = ${normalizedAddress} AND ${tokenBalances.tokenId} = ${insertTokenBalance.tokenId}`)
      .limit(1);

    if (existing.length > 0) {
      // Update existing balance
      const updateData = {
        balance: insertTokenBalance.balance,
        lastUpdated: sql`now()`
      };
      const result = await db.update(tokenBalances)
        .set(updateData)
        .where(eq(tokenBalances.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new balance record
      const balanceData = {
        ...insertTokenBalance,
        walletAddress: normalizedAddress
      };
      const result = await db.insert(tokenBalances).values(balanceData).returning();
      return result[0];
    }
  }

  async updateTokenBalance(walletAddress: string, tokenId: string, balance: string): Promise<TokenBalance | undefined> {
    const normalizedAddress = normalizeAddress(walletAddress);
    const updateData = {
      balance,
      lastUpdated: sql`now()`
    };
    const result = await db.update(tokenBalances)
      .set(updateData)
      .where(sql`lower(${tokenBalances.walletAddress}) = ${normalizedAddress} AND ${tokenBalances.tokenId} = ${tokenId}`)
      .returning();
    return result[0];
  }

  // User token methods
  async getUserTokens(userId: string, walletAddress: string): Promise<UserToken[]> {
    const normalizedAddress = normalizeAddress(walletAddress);
    const result = await db.select().from(userTokens)
      .where(sql`${userTokens.userId} = ${userId} AND lower(${userTokens.walletAddress}) = ${normalizedAddress}`)
      .orderBy(userTokens.sortOrder, userTokens.addedAt);
    return result;
  }

  async getUserTokensByWallet(walletAddress: string): Promise<UserToken[]> {
    const normalizedAddress = normalizeAddress(walletAddress);
    const result = await db.select().from(userTokens)
      .where(sql`lower(${userTokens.walletAddress}) = ${normalizedAddress}`)
      .orderBy(userTokens.sortOrder, userTokens.addedAt);
    return result;
  }

  async addUserToken(insertUserToken: InsertUserToken): Promise<UserToken> {
    const userTokenData = {
      ...insertUserToken,
      walletAddress: normalizeAddress(insertUserToken.walletAddress),
      isHidden: insertUserToken.isHidden || "false",
      sortOrder: insertUserToken.sortOrder || "0"
    };
    const result = await db.insert(userTokens).values(userTokenData).returning();
    return result[0];
  }

  async removeUserToken(userId: string, walletAddress: string, tokenId: string): Promise<boolean> {
    const normalizedAddress = normalizeAddress(walletAddress);
    const result = await db.delete(userTokens)
      .where(sql`${userTokens.userId} = ${userId} AND lower(${userTokens.walletAddress}) = ${normalizedAddress} AND ${userTokens.tokenId} = ${tokenId}`)
      .returning();
    return result.length > 0;
  }

  async updateUserToken(id: string, updates: Partial<InsertUserToken>): Promise<UserToken | undefined> {
    const updateData = {
      ...updates,
      walletAddress: updates.walletAddress ? normalizeAddress(updates.walletAddress) : undefined
    };
    const result = await db.update(userTokens)
      .set(updateData)
      .where(eq(userTokens.id, id))
      .returning();
    return result[0];
  }

  // Contract methods
  async getContract(id: string): Promise<Contract | undefined> {
    const result = await db.select().from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);
    return result[0];
  }

  async getContractByAddressAndChain(address: string, chainId: string): Promise<Contract | undefined> {
    const normalizedAddress = normalizeAddress(address);
    const result = await db.select().from(contracts)
      .where(sql`lower(${contracts.address}) = ${normalizedAddress} AND ${contracts.chainId} = ${chainId}`)
      .limit(1);
    return result[0];
  }

  async getContracts(filters?: { userId?: string; chainId?: string; tags?: string[] }): Promise<Contract[]> {
    let query = db.select().from(contracts);
    
    if (filters?.userId) {
      query = query.where(eq(contracts.userId, filters.userId));
    }
    if (filters?.chainId) {
      query = query.where(eq(contracts.chainId, filters.chainId));
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.where(sql`${contracts.tags} && ${filters.tags}`);
    }
    
    const result = await query.orderBy(desc(contracts.createdAt));
    return result;
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const contractData = {
      ...insertContract,
      address: normalizeAddress(insertContract.address),
      isVerified: insertContract.isVerified || "false"
    };
    const result = await db.insert(contracts).values(contractData).returning();
    return result[0];
  }

  async updateContract(id: string, updates: Partial<InsertContract>): Promise<Contract | undefined> {
    const updateData = {
      ...updates,
      address: updates.address ? normalizeAddress(updates.address) : undefined,
      updatedAt: sql`now()`
    };
    const result = await db.update(contracts)
      .set(updateData)
      .where(eq(contracts.id, id))
      .returning();
    return result[0];
  }

  async deleteContract(id: string): Promise<boolean> {
    const result = await db.delete(contracts)
      .where(eq(contracts.id, id))
      .returning();
    return result.length > 0;
  }

  // Contract call methods
  async getContractCall(id: string): Promise<ContractCall | undefined> {
    const result = await db.select().from(contractCalls)
      .where(eq(contractCalls.id, id))
      .limit(1);
    return result[0];
  }

  async getContractCalls(contractId: string, pagination?: { page: number; limit: number }): Promise<ContractCall[]> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 25, 100);
    const offset = (page - 1) * limit;

    const result = await db.select().from(contractCalls)
      .where(eq(contractCalls.contractId, contractId))
      .orderBy(desc(contractCalls.createdAt))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async getContractCallsByAddress(fromAddress: string, pagination?: { page: number; limit: number }): Promise<ContractCall[]> {
    const normalizedAddress = normalizeAddress(fromAddress);
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 25, 100);
    const offset = (page - 1) * limit;

    const result = await db.select().from(contractCalls)
      .where(sql`lower(${contractCalls.fromAddress}) = ${normalizedAddress}`)
      .orderBy(desc(contractCalls.createdAt))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async createContractCall(insertContractCall: InsertContractCall): Promise<ContractCall> {
    const callData = {
      ...insertContractCall,
      fromAddress: normalizeAddress(insertContractCall.fromAddress),
      toAddress: normalizeAddress(insertContractCall.toAddress),
      status: insertContractCall.status || "pending",
      callType: insertContractCall.callType || "read",
      value: insertContractCall.value || "0"
    };
    const result = await db.insert(contractCalls).values(callData).returning();
    return result[0];
  }

  async updateContractCall(id: string, updates: Partial<InsertContractCall>): Promise<ContractCall | undefined> {
    const updateData = {
      ...updates,
      fromAddress: updates.fromAddress ? normalizeAddress(updates.fromAddress) : undefined,
      toAddress: updates.toAddress ? normalizeAddress(updates.toAddress) : undefined
    };
    const result = await db.update(contractCalls)
      .set(updateData)
      .where(eq(contractCalls.id, id))
      .returning();
    return result[0];
  }

  // Contract event subscription methods
  async getContractEventSub(id: string): Promise<ContractEventSub | undefined> {
    const result = await db.select().from(contractEventSubs)
      .where(eq(contractEventSubs.id, id))
      .limit(1);
    return result[0];
  }

  async getContractEventSubs(contractId: string): Promise<ContractEventSub[]> {
    const result = await db.select().from(contractEventSubs)
      .where(eq(contractEventSubs.contractId, contractId))
      .orderBy(desc(contractEventSubs.createdAt));
    return result;
  }

  async getActiveEventSubs(): Promise<ContractEventSub[]> {
    const result = await db.select().from(contractEventSubs)
      .where(eq(contractEventSubs.isActive, "true"))
      .orderBy(desc(contractEventSubs.createdAt));
    return result;
  }

  async createContractEventSub(insertEventSub: InsertContractEventSub): Promise<ContractEventSub> {
    const subData = {
      ...insertEventSub,
      isActive: insertEventSub.isActive || "true",
      fromBlock: insertEventSub.fromBlock || "latest"
    };
    const result = await db.insert(contractEventSubs).values(subData).returning();
    return result[0];
  }

  async updateContractEventSub(id: string, updates: Partial<InsertContractEventSub>): Promise<ContractEventSub | undefined> {
    const updateData = {
      ...updates,
      updatedAt: sql`now()`
    };
    const result = await db.update(contractEventSubs)
      .set(updateData)
      .where(eq(contractEventSubs.id, id))
      .returning();
    return result[0];
  }

  async deleteContractEventSub(id: string): Promise<boolean> {
    const result = await db.delete(contractEventSubs)
      .where(eq(contractEventSubs.id, id))
      .returning();
    return result.length > 0;
  }

  // Contract event methods
  async getContractEvent(id: string): Promise<ContractEvent | undefined> {
    const result = await db.select().from(contractEvents)
      .where(eq(contractEvents.id, id))
      .limit(1);
    return result[0];
  }

  async getContractEvents(contractId: string, pagination?: { page: number; limit: number }): Promise<ContractEvent[]> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 25, 100);
    const offset = (page - 1) * limit;

    const result = await db.select().from(contractEvents)
      .where(eq(contractEvents.contractId, contractId))
      .orderBy(desc(contractEvents.timestamp))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async getContractEventsBySubscription(subscriptionId: string, pagination?: { page: number; limit: number }): Promise<ContractEvent[]> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 25, 100);
    const offset = (page - 1) * limit;

    const result = await db.select().from(contractEvents)
      .where(eq(contractEvents.subscriptionId, subscriptionId))
      .orderBy(desc(contractEvents.timestamp))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async createContractEvent(insertEvent: InsertContractEvent): Promise<ContractEvent> {
    const eventData = {
      ...insertEvent,
      fromAddress: insertEvent.fromAddress ? normalizeAddress(insertEvent.fromAddress) : null
    };
    const result = await db.insert(contractEvents).values(eventData).returning();
    return result[0];
  }

  // NFT Collection methods
  async getNftCollection(id: string): Promise<NftCollection | undefined> {
    const result = await db.select().from(nftCollections)
      .where(eq(nftCollections.id, id))
      .limit(1);
    return result[0];
  }

  async getNftCollectionByContract(contractAddress: string, chainId: string): Promise<NftCollection | undefined> {
    const normalizedAddress = normalizeAddress(contractAddress);
    const result = await db.select().from(nftCollections)
      .where(sql`lower(${nftCollections.contractAddress}) = ${normalizedAddress} AND ${nftCollections.chainId} = ${chainId}`)
      .limit(1);
    return result[0];
  }

  async getNftCollections(filters?: { chainId?: string; verified?: boolean; search?: string }): Promise<NftCollection[]> {
    let query = db.select().from(nftCollections);
    const conditions = [];

    if (filters?.chainId) {
      conditions.push(eq(nftCollections.chainId, filters.chainId));
    }

    if (filters?.verified !== undefined) {
      conditions.push(eq(nftCollections.isVerified, filters.verified ? "true" : "false"));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`lower(${nftCollections.name}) LIKE ${searchTerm}`,
          sql`lower(${nftCollections.symbol}) LIKE ${searchTerm}`,
          sql`lower(${nftCollections.slug}) LIKE ${searchTerm}`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`);
    }

    return query.orderBy(desc(nftCollections.updatedAt));
  }

  async upsertNftCollection(insertCollection: InsertNftCollection): Promise<NftCollection> {
    const collectionData = {
      ...insertCollection,
      contractAddress: normalizeAddress(insertCollection.contractAddress),
      isVerified: insertCollection.isVerified || "false",
      contractStandard: insertCollection.contractStandard || "ERC721"
    };

    // Try to update first
    const existingCollection = await this.getNftCollectionByContract(
      insertCollection.contractAddress, 
      insertCollection.chainId
    );

    if (existingCollection) {
      const updateData = {
        ...collectionData,
        updatedAt: sql`now()`
      };
      const result = await db.update(nftCollections)
        .set(updateData)
        .where(eq(nftCollections.id, existingCollection.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(nftCollections).values(collectionData).returning();
      return result[0];
    }
  }

  async updateNftCollection(id: string, updates: Partial<InsertNftCollection>): Promise<NftCollection | undefined> {
    const updateData = {
      ...updates,
      contractAddress: updates.contractAddress ? normalizeAddress(updates.contractAddress) : undefined,
      updatedAt: sql`now()`
    };
    const result = await db.update(nftCollections)
      .set(updateData)
      .where(eq(nftCollections.id, id))
      .returning();
    return result[0];
  }

  // NFT methods
  async getNft(id: string): Promise<Nft | undefined> {
    const result = await db.select().from(nfts)
      .where(eq(nfts.id, id))
      .limit(1);
    return result[0];
  }

  async getNftByToken(contractAddress: string, tokenId: string, chainId: string): Promise<Nft | undefined> {
    const normalizedAddress = normalizeAddress(contractAddress);
    const result = await db.select().from(nfts)
      .where(sql`lower(${nfts.contractAddress}) = ${normalizedAddress} AND ${nfts.tokenId} = ${tokenId} AND ${nfts.chainId} = ${chainId}`)
      .limit(1);
    return result[0];
  }

  async getNftsByCollection(collectionId: string, pagination?: { page: number; limit: number }): Promise<Nft[]> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 25, 100);
    const offset = (page - 1) * limit;

    const result = await db.select().from(nfts)
      .where(eq(nfts.collectionId, collectionId))
      .orderBy(nfts.name, nfts.tokenId)
      .limit(limit)
      .offset(offset);
    return result;
  }

  async getNftsByContract(contractAddress: string, chainId: string, pagination?: { page: number; limit: number }): Promise<Nft[]> {
    const normalizedAddress = normalizeAddress(contractAddress);
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 25, 100);
    const offset = (page - 1) * limit;

    const result = await db.select().from(nfts)
      .where(sql`lower(${nfts.contractAddress}) = ${normalizedAddress} AND ${nfts.chainId} = ${chainId}`)
      .orderBy(nfts.name, nfts.tokenId)
      .limit(limit)
      .offset(offset);
    return result;
  }

  async searchNfts(query: string, chainId?: string, pagination?: { page: number; limit: number }): Promise<Nft[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 25, 100);
    const offset = (page - 1) * limit;

    const conditions = [
      or(
        sql`lower(${nfts.name}) LIKE ${searchTerm}`,
        sql`lower(${nfts.description}) LIKE ${searchTerm}`
      )
    ];

    if (chainId) {
      conditions.push(eq(nfts.chainId, chainId));
    }

    const result = await db.select().from(nfts)
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .orderBy(nfts.name)
      .limit(limit)
      .offset(offset);
    return result;
  }

  async upsertNft(insertNft: InsertNft): Promise<Nft> {
    const nftData = {
      ...insertNft,
      contractAddress: normalizeAddress(insertNft.contractAddress),
      standard: insertNft.standard || "ERC721"
    };

    // Try to update first
    const existingNft = await this.getNftByToken(
      insertNft.contractAddress, 
      insertNft.tokenId, 
      insertNft.chainId
    );

    if (existingNft) {
      const updateData = {
        ...nftData,
        updatedAt: sql`now()`,
        lastRefreshed: sql`now()`
      };
      const result = await db.update(nfts)
        .set(updateData)
        .where(eq(nfts.id, existingNft.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(nfts).values(nftData).returning();
      return result[0];
    }
  }

  async updateNft(id: string, updates: Partial<InsertNft>): Promise<Nft | undefined> {
    const updateData = {
      ...updates,
      contractAddress: updates.contractAddress ? normalizeAddress(updates.contractAddress) : undefined,
      updatedAt: sql`now()`,
      lastRefreshed: sql`now()`
    };
    const result = await db.update(nfts)
      .set(updateData)
      .where(eq(nfts.id, id))
      .returning();
    return result[0];
  }

  async refreshNftMetadata(id: string): Promise<Nft | undefined> {
    const result = await db.update(nfts)
      .set({ lastRefreshed: sql`now()` })
      .where(eq(nfts.id, id))
      .returning();
    return result[0];
  }

  // NFT Ownership methods
  async getNftOwnership(id: string): Promise<NftOwnership | undefined> {
    const result = await db.select().from(nftOwnerships)
      .where(eq(nftOwnerships.id, id))
      .limit(1);
    return result[0];
  }

  async getNftOwnershipByWalletAndNft(walletAddress: string, nftId: string): Promise<NftOwnership | undefined> {
    const normalizedAddress = normalizeAddress(walletAddress);
    const result = await db.select().from(nftOwnerships)
      .where(sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress} AND ${nftOwnerships.nftId} = ${nftId}`)
      .limit(1);
    return result[0];
  }

  async getNftOwnershipsByWallet(
    walletAddress: string, 
    filters?: { 
      chainId?: string; 
      contractAddress?: string; 
      collectionId?: string; 
      hidden?: boolean; 
      search?: string;
      attributes?: Record<string, string | string[]>;
    },
    pagination?: { page: number; limit: number; sortBy?: 'name' | 'collection' | 'acquired'; sortOrder?: 'asc' | 'desc' }
  ): Promise<NftOwnership[]> {
    const normalizedAddress = normalizeAddress(walletAddress);
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 25, 100);
    const offset = (page - 1) * limit;

    // Start with base query joining NFTs for filtering
    let query = db.select({
      ownership: nftOwnerships,
      nft: nfts,
      collection: nftCollections
    })
    .from(nftOwnerships)
    .leftJoin(nfts, eq(nftOwnerships.nftId, nfts.id))
    .leftJoin(nftCollections, eq(nfts.collectionId, nftCollections.id))
    .where(sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress}`);

    const conditions = [sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress}`];

    if (filters?.chainId) {
      conditions.push(eq(nftOwnerships.chainId, filters.chainId));
    }

    if (filters?.contractAddress) {
      const normalizedContract = normalizeAddress(filters.contractAddress);
      conditions.push(sql`lower(${nftOwnerships.contractAddress}) = ${normalizedContract}`);
    }

    if (filters?.collectionId) {
      conditions.push(eq(nfts.collectionId, filters.collectionId));
    }

    if (filters?.hidden !== undefined) {
      conditions.push(eq(nftOwnerships.isHidden, filters.hidden ? "true" : "false"));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`lower(${nfts.name}) LIKE ${searchTerm}`,
          sql`lower(${nfts.description}) LIKE ${searchTerm}`,
          sql`lower(${nftCollections.name}) LIKE ${searchTerm}`
        )
      );
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`);
    }

    // Apply sorting
    const sortBy = pagination?.sortBy || 'acquired';
    const sortOrder = pagination?.sortOrder || 'desc';
    
    if (sortBy === 'name') {
      query = sortOrder === 'asc' 
        ? query.orderBy(nfts.name, nfts.tokenId)
        : query.orderBy(desc(nfts.name), desc(nfts.tokenId));
    } else if (sortBy === 'collection') {
      query = sortOrder === 'asc'
        ? query.orderBy(nftCollections.name, nfts.name)
        : query.orderBy(desc(nftCollections.name), desc(nfts.name));
    } else {
      query = sortOrder === 'asc'
        ? query.orderBy(nftOwnerships.lastUpdated)
        : query.orderBy(desc(nftOwnerships.lastUpdated));
    }

    const result = await query.limit(limit).offset(offset);
    
    // Extract just the ownership records
    return result.map(row => row.ownership);
  }

  async getNftOwnershipsByNft(nftId: string): Promise<NftOwnership[]> {
    const result = await db.select().from(nftOwnerships)
      .where(eq(nftOwnerships.nftId, nftId))
      .orderBy(desc(nftOwnerships.lastUpdated));
    return result;
  }

  async getCollectionsByWallet(walletAddress: string, chainId?: string): Promise<NftCollection[]> {
    const normalizedAddress = normalizeAddress(walletAddress);
    
    let query = db.select({
      collection: nftCollections
    })
    .from(nftOwnerships)
    .innerJoin(nfts, eq(nftOwnerships.nftId, nfts.id))
    .innerJoin(nftCollections, eq(nfts.collectionId, nftCollections.id))
    .where(sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress}`)
    .groupBy(nftCollections.id);

    if (chainId) {
      query = query.where(sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress} AND ${nftOwnerships.chainId} = ${chainId}`);
    }

    const result = await query.orderBy(nftCollections.name);
    return result.map(row => row.collection);
  }

  async upsertNftOwnership(insertOwnership: InsertNftOwnership): Promise<NftOwnership> {
    const ownershipData = {
      ...insertOwnership,
      walletAddress: normalizeAddress(insertOwnership.walletAddress),
      contractAddress: normalizeAddress(insertOwnership.contractAddress),
      balance: insertOwnership.balance || "1",
      isHidden: insertOwnership.isHidden || "false"
    };

    // Try to update first
    const existingOwnership = await this.getNftOwnershipByWalletAndNft(
      insertOwnership.walletAddress, 
      insertOwnership.nftId
    );

    if (existingOwnership) {
      const updateData = {
        ...ownershipData,
        lastUpdated: sql`now()`
      };
      const result = await db.update(nftOwnerships)
        .set(updateData)
        .where(eq(nftOwnerships.id, existingOwnership.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(nftOwnerships).values(ownershipData).returning();
      return result[0];
    }
  }

  async updateNftOwnership(id: string, updates: Partial<InsertNftOwnership>): Promise<NftOwnership | undefined> {
    const updateData = {
      ...updates,
      walletAddress: updates.walletAddress ? normalizeAddress(updates.walletAddress) : undefined,
      contractAddress: updates.contractAddress ? normalizeAddress(updates.contractAddress) : undefined,
      lastUpdated: sql`now()`
    };
    const result = await db.update(nftOwnerships)
      .set(updateData)
      .where(eq(nftOwnerships.id, id))
      .returning();
    return result[0];
  }

  async removeNftOwnership(walletAddress: string, nftId: string): Promise<boolean> {
    const normalizedAddress = normalizeAddress(walletAddress);
    const result = await db.delete(nftOwnerships)
      .where(sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress} AND ${nftOwnerships.nftId} = ${nftId}`)
      .returning();
    return result.length > 0;
  }

  // NFT Aggregated queries
  async getNftStats(walletAddress: string): Promise<{
    totalNfts: number;
    totalCollections: number;
    chainCounts: Record<string, number>;
    collectionCounts: Record<string, number>;
  }> {
    const normalizedAddress = normalizeAddress(walletAddress);

    // Get total NFTs
    const totalNftsResult = await db.select({
      count: sql<number>`count(*)`
    }).from(nftOwnerships)
      .where(sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress} AND ${nftOwnerships.isHidden} = 'false'`);

    // Get total collections
    const totalCollectionsResult = await db.select({
      count: sql<number>`count(DISTINCT ${nfts.collectionId})`
    }).from(nftOwnerships)
      .innerJoin(nfts, eq(nftOwnerships.nftId, nfts.id))
      .where(sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress} AND ${nftOwnerships.isHidden} = 'false'`);

    // Get chain counts
    const chainCountsResult = await db.select({
      chainId: nftOwnerships.chainId,
      count: sql<number>`count(*)`
    }).from(nftOwnerships)
      .where(sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress} AND ${nftOwnerships.isHidden} = 'false'`)
      .groupBy(nftOwnerships.chainId);

    // Get collection counts
    const collectionCountsResult = await db.select({
      collectionName: nftCollections.name,
      count: sql<number>`count(*)`
    }).from(nftOwnerships)
      .innerJoin(nfts, eq(nftOwnerships.nftId, nfts.id))
      .innerJoin(nftCollections, eq(nfts.collectionId, nftCollections.id))
      .where(sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress} AND ${nftOwnerships.isHidden} = 'false'`)
      .groupBy(nftCollections.name)
      .limit(10);

    const chainCounts: Record<string, number> = {};
    chainCountsResult.forEach(row => {
      chainCounts[row.chainId] = row.count;
    });

    const collectionCounts: Record<string, number> = {};
    collectionCountsResult.forEach(row => {
      collectionCounts[row.collectionName || 'Unknown'] = row.count;
    });

    return {
      totalNfts: totalNftsResult[0]?.count || 0,
      totalCollections: totalCollectionsResult[0]?.count || 0,
      chainCounts,
      collectionCounts
    };
  }

  async getNftAttributeFacets(
    walletAddress: string,
    filters?: { chainId?: string; collectionId?: string }
  ): Promise<Record<string, Record<string, number>>> {
    const normalizedAddress = normalizeAddress(walletAddress);
    
    const conditions = [sql`lower(${nftOwnerships.walletAddress}) = ${normalizedAddress}`];
    
    if (filters?.chainId) {
      conditions.push(eq(nftOwnerships.chainId, filters.chainId));
    }
    
    if (filters?.collectionId) {
      conditions.push(eq(nfts.collectionId, filters.collectionId));
    }

    // Get all NFT attributes for the wallet
    const attributesResult = await db.select({
      attributes: nfts.attributes
    }).from(nftOwnerships)
      .innerJoin(nfts, eq(nftOwnerships.nftId, nfts.id))
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .where(sql`${nfts.attributes} IS NOT NULL`);

    const facets: Record<string, Record<string, number>> = {};

    attributesResult.forEach(row => {
      if (row.attributes && Array.isArray(row.attributes)) {
        row.attributes.forEach((attr: any) => {
          if (attr.trait_type && attr.value) {
            const traitType = attr.trait_type;
            const value = attr.value.toString();
            
            if (!facets[traitType]) {
              facets[traitType] = {};
            }
            
            facets[traitType][value] = (facets[traitType][value] || 0) + 1;
          }
        });
      }
    });

    return facets;
  }

  // Bot Strategy methods
  async getAllBotStrategies() {
    const strategies = await db.select().from(botStrategies).where(eq(botStrategies.isActive, 'true'));
    return strategies;
  }

  // Bot Subscription methods
  async createBotSubscription(subscription: any) {
    const [created] = await db.insert(botSubscriptions).values(subscription).returning();
    return created;
  }

  async getUserBotSubscription(userId: string) {
    const [subscription] = await db.select().from(botSubscriptions)
      .where(eq(botSubscriptions.userId, userId))
      .orderBy(desc(botSubscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  // Bot User Config methods
  async saveBotUserConfig(config: any) {
    const existing = await this.getUserBotConfig(config.userId);
    
    if (existing) {
      const [updated] = await db.update(botUserConfigs)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(botUserConfigs.userId, config.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(botUserConfigs).values(config).returning();
      return created;
    }
  }

  async getUserBotConfig(userId: string) {
    const [config] = await db.select().from(botUserConfigs)
      .where(eq(botUserConfigs.userId, userId))
      .orderBy(desc(botUserConfigs.createdAt))
      .limit(1);
    return config;
  }

  // Bot Active Strategy methods
  async createBotActiveStrategy(strategy: any) {
    const [created] = await db.insert(botActiveStrategies).values(strategy).returning();
    return created;
  }

  async getUserActiveStrategies(userId: string) {
    const strategies = await db.select().from(botActiveStrategies)
      .where(eq(botActiveStrategies.userId, userId))
      .orderBy(desc(botActiveStrategies.startedAt));
    return strategies;
  }

  async stopBotStrategy(activeStrategyId: string) {
    await db.update(botActiveStrategies)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botActiveStrategies.id, activeStrategyId));
  }

  // Bot Trade methods
  async getUserBotTrades(userId: string, limit: number) {
    const trades = await db.select().from(botTrades)
      .where(eq(botTrades.userId, userId))
      .orderBy(desc(botTrades.createdAt))
      .limit(limit);
    return trades;
  }

  async getStrategyTrades(activeStrategyId: string) {
    const trades = await db.select().from(botTrades)
      .where(eq(botTrades.activeStrategyId, activeStrategyId))
      .orderBy(desc(botTrades.createdAt));
    return trades;
  }
  
  // House Vault methods
  async getAllHouseVaults() {
    const vaults = await db.select().from(houseVaults).where(eq(houseVaults.status, 'active'));
    return vaults;
  }
  
  async getHouseVault(id: string) {
    const [vault] = await db.select().from(houseVaults).where(eq(houseVaults.id, id));
    return vault;
  }
  
  async createHouseVault(vault: InsertHouseVault) {
    const [created] = await db.insert(houseVaults).values(vault).returning();
    return created;
  }
  
  async updateHouseVault(id: string, updates: Partial<InsertHouseVault>) {
    const [updated] = await db.update(houseVaults)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(houseVaults.id, id))
      .returning();
    return updated;
  }
  
  // House Position methods
  async getUserPositions(walletAddress: string) {
    const positions = await db.select().from(housePositions)
      .where(eq(sql`lower(${housePositions.walletAddress})`, normalizeAddress(walletAddress)))
      .orderBy(desc(housePositions.stakedAt));
    return positions;
  }
  
  async getVaultPositions(vaultId: string) {
    const positions = await db.select().from(housePositions)
      .where(eq(housePositions.vaultId, vaultId))
      .orderBy(desc(housePositions.stakedAt));
    return positions;
  }
  
  async getPosition(id: string) {
    const [position] = await db.select().from(housePositions).where(eq(housePositions.id, id));
    return position;
  }
  
  async createPosition(position: InsertHousePosition) {
    const [created] = await db.insert(housePositions).values(position).returning();
    return created;
  }
  
  async updatePosition(id: string, updates: Partial<InsertHousePosition>) {
    const [updated] = await db.update(housePositions)
      .set(updates)
      .where(eq(housePositions.id, id))
      .returning();
    return updated;
  }
  
  // House Distribution methods
  async getVaultDistributions(vaultId: string, limit: number = 50) {
    const distributions = await db.select().from(houseDistributions)
      .where(eq(houseDistributions.vaultId, vaultId))
      .orderBy(desc(houseDistributions.distributedAt))
      .limit(limit);
    return distributions;
  }
  
  async createDistribution(distribution: InsertHouseDistribution) {
    const [created] = await db.insert(houseDistributions).values(distribution).returning();
    return created;
  }
  
  // House Earning methods
  async getPositionEarnings(positionId: string) {
    const earnings = await db.select().from(houseEarnings)
      .where(eq(houseEarnings.positionId, positionId))
      .orderBy(desc(houseEarnings.createdAt));
    return earnings;
  }
  
  async getUserEarnings(walletAddress: string) {
    const earnings = await db.select().from(houseEarnings)
      .where(eq(sql`lower(${houseEarnings.walletAddress})`, normalizeAddress(walletAddress)))
      .orderBy(desc(houseEarnings.createdAt));
    return earnings;
  }
  
  async createEarning(earning: InsertHouseEarning) {
    const [created] = await db.insert(houseEarnings).values(earning).returning();
    return created;
  }
  
  async claimEarning(id: string) {
    const [updated] = await db.update(houseEarnings)
      .set({ status: 'claimed', claimedAt: new Date() })
      .where(eq(houseEarnings.id, id))
      .returning();
    return updated;
  }
  
  // Auto-Compound Pool methods
  async getAllAutoCompoundPools() {
    const pools = await db.select().from(autoCompoundPools)
      .orderBy(desc(autoCompoundPools.createdAt));
    return pools;
  }
  
  async getActiveAutoCompoundPools() {
    const pools = await db.select().from(autoCompoundPools)
      .where(eq(autoCompoundPools.status, 'active'))
      .orderBy(desc(autoCompoundPools.createdAt));
    return pools;
  }
  
  async getAutoCompoundPool(id: string) {
    const [pool] = await db.select().from(autoCompoundPools)
      .where(eq(autoCompoundPools.id, id))
      .limit(1);
    return pool;
  }
  
  async createAutoCompoundPool(pool: InsertAutoCompoundPool) {
    const [created] = await db.insert(autoCompoundPools).values(pool).returning();
    return created;
  }
  
  async updateAutoCompoundPool(id: string, updates: Partial<InsertAutoCompoundPool>) {
    const [updated] = await db.update(autoCompoundPools)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(autoCompoundPools.id, id))
      .returning();
    return updated;
  }
  
  // Auto-Compound Stake methods
  async getUserStakes(walletAddress: string) {
    const stakes = await db.select().from(autoCompoundStakes)
      .where(eq(sql`lower(${autoCompoundStakes.walletAddress})`, normalizeAddress(walletAddress)))
      .orderBy(desc(autoCompoundStakes.stakedAt));
    return stakes;
  }
  
  async getPoolStakes(poolId: string) {
    const stakes = await db.select().from(autoCompoundStakes)
      .where(eq(autoCompoundStakes.poolId, poolId))
      .orderBy(desc(autoCompoundStakes.stakedAt));
    return stakes;
  }
  
  async getStake(id: string) {
    const [stake] = await db.select().from(autoCompoundStakes)
      .where(eq(autoCompoundStakes.id, id))
      .limit(1);
    return stake;
  }
  
  async createStake(stake: InsertAutoCompoundStake) {
    const [created] = await db.insert(autoCompoundStakes).values(stake).returning();
    return created;
  }
  
  async updateStake(id: string, updates: Partial<InsertAutoCompoundStake>) {
    const [updated] = await db.update(autoCompoundStakes)
      .set(updates)
      .where(eq(autoCompoundStakes.id, id))
      .returning();
    return updated;
  }
  
  // Compound Event methods
  async getStakeCompoundEvents(stakeId: string, limit: number = 50) {
    const events = await db.select().from(compoundEvents)
      .where(eq(compoundEvents.stakeId, stakeId))
      .orderBy(desc(compoundEvents.compoundedAt))
      .limit(limit);
    return events;
  }
  
  async getUserCompoundEvents(walletAddress: string, limit: number = 50) {
    const events = await db.select().from(compoundEvents)
      .where(eq(sql`lower(${compoundEvents.walletAddress})`, normalizeAddress(walletAddress)))
      .orderBy(desc(compoundEvents.compoundedAt))
      .limit(limit);
    return events;
  }
  
  async createCompoundEvent(event: InsertCompoundEvent) {
    const [created] = await db.insert(compoundEvents).values(event).returning();
    return created;
  }
  
  // Social Media Automation methods
  async getSocialAccount(id: string) {
    const [account] = await db.select().from(socialAccounts)
      .where(eq(socialAccounts.id, id))
      .limit(1);
    return account;
  }
  
  async getUserSocialAccounts(userId: string) {
    const accounts = await db.select().from(socialAccounts)
      .where(eq(socialAccounts.userId, userId))
      .orderBy(desc(socialAccounts.createdAt));
    return accounts;
  }
  
  async getActiveSocialAccounts(userId: string) {
    const accounts = await db.select().from(socialAccounts)
      .where(sql`${socialAccounts.userId} = ${userId} AND ${socialAccounts.isActive} = 'true'`)
      .orderBy(desc(socialAccounts.createdAt));
    return accounts;
  }
  
  async createSocialAccount(account: InsertSocialAccount) {
    const [created] = await db.insert(socialAccounts).values(account).returning();
    return created;
  }
  
  async updateSocialAccount(id: string, updates: Partial<InsertSocialAccount>) {
    const [updated] = await db.update(socialAccounts)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(socialAccounts.id, id))
      .returning();
    return updated;
  }
  
  async deleteSocialAccount(id: string) {
    await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
    return true;
  }
  
  // Scheduled Post methods
  async getScheduledPost(id: string) {
    const [post] = await db.select().from(scheduledPosts)
      .where(eq(scheduledPosts.id, id))
      .limit(1);
    return post;
  }
  
  async getUserScheduledPosts(userId: string) {
    const posts = await db.select().from(scheduledPosts)
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(desc(scheduledPosts.scheduledFor));
    return posts;
  }
  
  async getPendingPosts() {
    const posts = await db.select().from(scheduledPosts)
      .where(eq(scheduledPosts.status, 'pending'))
      .orderBy(scheduledPosts.scheduledFor);
    return posts;
  }
  
  async getPostsDueForPublish(time: Date) {
    const posts = await db.select().from(scheduledPosts)
      .where(sql`${scheduledPosts.status} = 'pending' AND ${scheduledPosts.scheduledFor} <= ${time}`)
      .orderBy(scheduledPosts.scheduledFor);
    return posts;
  }
  
  async createScheduledPost(post: InsertScheduledPost) {
    const [created] = await db.insert(scheduledPosts).values(post).returning();
    return created;
  }
  
  async updateScheduledPost(id: string, updates: Partial<InsertScheduledPost>) {
    const [updated] = await db.update(scheduledPosts)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(scheduledPosts.id, id))
      .returning();
    return updated;
  }
  
  async deleteScheduledPost(id: string) {
    await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
    return true;
  }
  
  // Post History methods
  async getPostHistory(id: string) {
    const [history] = await db.select().from(postHistory)
      .where(eq(postHistory.id, id))
      .limit(1);
    return history;
  }
  
  async getUserPostHistory(userId: string, limit: number = 50) {
    const history = await db.select().from(postHistory)
      .where(eq(postHistory.userId, userId))
      .orderBy(desc(postHistory.postedAt))
      .limit(limit);
    return history;
  }
  
  async getAccountPostHistory(accountId: string, limit: number = 50) {
    const history = await db.select().from(postHistory)
      .where(eq(postHistory.accountId, accountId))
      .orderBy(desc(postHistory.postedAt))
      .limit(limit);
    return history;
  }
  
  async createPostHistory(history: InsertPostHistory) {
    const [created] = await db.insert(postHistory).values(history).returning();
    return created;
  }
  
  // Product methods
  async getAllProducts() {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }
  
  async getActiveProducts() {
    return await db.select().from(products)
      .where(eq(products.isActive, 'true'))
      .orderBy(desc(products.createdAt));
  }
  
  async getProduct(id: string) {
    const [product] = await db.select().from(products)
      .where(eq(products.id, id))
      .limit(1);
    return product;
  }
  
  async getProductsByCategory(category: string) {
    return await db.select().from(products)
      .where(eq(products.category, category))
      .orderBy(desc(products.createdAt));
  }
  
  async createProduct(product: InsertProduct) {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }
  
  async updateProduct(id: string, updates: Partial<InsertProduct>) {
    const [updated] = await db.update(products)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }
  
  async deleteProduct(id: string) {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }
  
  // Order methods
  async getOrder(id: string) {
    const [order] = await db.select().from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return order;
  }
  
  async getUserOrders(userId: string) {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }
  
  async getOrdersByWallet(walletAddress: string) {
    const normalized = normalizeAddress(walletAddress);
    return await db.select().from(orders)
      .where(sql`lower(${orders.customerWallet}) = ${normalized}`)
      .orderBy(desc(orders.createdAt));
  }
  
  async getOrdersByStatus(status: string) {
    return await db.select().from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt));
  }
  
  async createOrder(order: InsertOrder) {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }
  
  async updateOrder(id: string, updates: Partial<InsertOrder>) {
    const [updated] = await db.update(orders)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }
  
  // Payment methods
  async getPayment(id: string) {
    const [payment] = await db.select().from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return payment;
  }
  
  async getPaymentsByOrder(orderId: string) {
    return await db.select().from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));
  }
  
  async getPaymentByTxHash(txHash: string) {
    const [payment] = await db.select().from(payments)
      .where(eq(payments.txHash, txHash))
      .limit(1);
    return payment;
  }
  
  async getPaymentByProviderPaymentId(providerPaymentId: string) {
    const [payment] = await db.select().from(payments)
      .where(eq(payments.providerPaymentId, providerPaymentId))
      .limit(1);
    return payment;
  }
  
  async createPayment(payment: InsertPayment) {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }
  
  async updatePayment(id: string, updates: Partial<InsertPayment>) {
    const [updated] = await db.update(payments)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }
  
  // Payment Webhook methods
  async getPaymentWebhook(id: string) {
    const [webhook] = await db.select().from(paymentWebhooks)
      .where(eq(paymentWebhooks.id, id))
      .limit(1);
    return webhook;
  }
  
  async getUnprocessedWebhooks(provider: string) {
    return await db.select().from(paymentWebhooks)
      .where(sql`${paymentWebhooks.provider} = ${provider} AND ${paymentWebhooks.processed} = 'false'`)
      .orderBy(paymentWebhooks.createdAt);
  }
  
  async createPaymentWebhook(webhook: InsertPaymentWebhook) {
    const [created] = await db.insert(paymentWebhooks).values(webhook).returning();
    return created;
  }
  
  async markWebhookProcessed(id: string, error?: string) {
    const [updated] = await db.update(paymentWebhooks)
      .set({ 
        processed: 'true',
        processedAt: sql`now()`,
        ...(error && { error })
      })
      .where(eq(paymentWebhooks.id, id))
      .returning();
    return updated;
  }
  
  // Bridge Transaction methods
  async getBridgeTransactions(walletAddress: string) {
    const normalized = normalizeAddress(walletAddress);
    return await db.select().from(bridgeTransactions)
      .where(sql`lower(${bridgeTransactions.walletAddress}) = ${normalized}`)
      .orderBy(desc(bridgeTransactions.createdAt));
  }
  
  async getBridgeTransaction(id: string) {
    const [transaction] = await db.select().from(bridgeTransactions)
      .where(eq(bridgeTransactions.id, id))
      .limit(1);
    return transaction;
  }
  
  async createBridgeTransaction(transaction: InsertBridgeTransaction) {
    const [created] = await db.insert(bridgeTransactions).values(transaction).returning();
    return created;
  }
  
  async updateBridgeTransaction(id: string, updates: Partial<InsertBridgeTransaction>) {
    const [updated] = await db.update(bridgeTransactions)
      .set(updates)
      .where(eq(bridgeTransactions.id, id))
      .returning();
    return updated;
  }
  
  // Trading Signal methods
  async getTradingSignals() {
    return await db.select().from(tradingSignals)
      .orderBy(desc(tradingSignals.createdAt));
  }
  
  async getTradingSignal(id: string) {
    const [signal] = await db.select().from(tradingSignals)
      .where(eq(tradingSignals.id, id))
      .limit(1);
    return signal;
  }
  
  async createTradingSignal(signal: InsertTradingSignal) {
    const [created] = await db.insert(tradingSignals).values(signal).returning();
    return created;
  }
  
  async updateTradingSignal(id: string, updates: Partial<InsertTradingSignal>) {
    const [updated] = await db.update(tradingSignals)
      .set(updates)
      .where(eq(tradingSignals.id, id))
      .returning();
    return updated;
  }
  
  // Governance Stake methods
  async getGovernanceStakes(walletAddress: string) {
    const normalized = normalizeAddress(walletAddress);
    return await db.select().from(governanceStakes)
      .where(sql`lower(${governanceStakes.walletAddress}) = ${normalized}`)
      .orderBy(desc(governanceStakes.createdAt));
  }
  
  async getGovernanceStake(id: string) {
    const [stake] = await db.select().from(governanceStakes)
      .where(eq(governanceStakes.id, id))
      .limit(1);
    return stake;
  }
  
  async createGovernanceStake(stake: InsertGovernanceStake) {
    const [created] = await db.insert(governanceStakes).values(stake).returning();
    return created;
  }
  
  async updateGovernanceStake(id: string, updates: Partial<InsertGovernanceStake>) {
    const [updated] = await db.update(governanceStakes)
      .set(updates)
      .where(eq(governanceStakes.id, id))
      .returning();
    return updated;
  }
}

// Use PostgreSQL storage instead of MemStorage
export const storage = new PostgreSQLStorage();
