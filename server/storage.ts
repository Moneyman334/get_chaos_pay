import { 
  type User, 
  type InsertUser,
  type Wallet,
  type InsertWallet,
  type Transaction,
  type InsertTransaction,
  type NetworkInfo,
  type InsertNetworkInfo,
  users,
  wallets,
  transactions,
  networkInfo
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private wallets: Map<string, Wallet>;
  private transactions: Map<string, Transaction>;
  private networks: Map<string, NetworkInfo>;

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.networks = new Map();
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
}

// Use PostgreSQL storage instead of MemStorage
export const storage = new PostgreSQLStorage();
