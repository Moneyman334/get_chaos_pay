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
  users,
  wallets,
  transactions,
  networkInfo,
  tokens,
  tokenBalances,
  userTokens
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private wallets: Map<string, Wallet>;
  private transactions: Map<string, Transaction>;
  private networks: Map<string, NetworkInfo>;
  private tokens: Map<string, Token>;
  private tokenBalances: Map<string, TokenBalance>;
  private userTokens: Map<string, UserToken>;

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.networks = new Map();
    this.tokens = new Map();
    this.tokenBalances = new Map();
    this.userTokens = new Map();
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
}

// Use PostgreSQL storage instead of MemStorage
export const storage = new PostgreSQLStorage();
