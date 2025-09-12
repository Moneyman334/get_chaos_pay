import { 
  type User, 
  type InsertUser,
  type Wallet,
  type InsertWallet,
  type Transaction,
  type InsertTransaction,
  type NetworkInfo,
  type InsertNetworkInfo
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
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
      address: insertWallet.address,
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
      fromAddress: insertTransaction.fromAddress,
      toAddress: insertTransaction.toAddress,
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

export const storage = new MemStorage();
