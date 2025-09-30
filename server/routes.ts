import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertTokenSchema, 
  insertTokenBalanceSchema, 
  insertUserTokenSchema,
  insertContractSchema,
  insertContractCallSchema,
  insertContractEventSubSchema,
  insertUserSchema
} from "@shared/schema";
import { nftService } from "./nft";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import bcrypt from "bcrypt";
import { getChainConfig, verifyTransaction, getAllSupportedChains } from "./blockchain-config";

// Ethereum address validation schema
const ethereumAddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
  .transform(addr => addr.toLowerCase()); // Normalize to lowercase

// Hash validation (64 hex characters)
const transactionHashSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format");

export async function registerRoutes(app: Express): Promise<Server> {
  // API health check endpoint
  app.get("/api", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Transaction History API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // API health check with more details
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      services: ["transactions", "wallets", "tokens", "networks", "authentication"],
      database: "connected",
      timestamp: new Date().toISOString()
    });
  });

  // Rate limiting for auth endpoints
  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 authentication requests per window
    message: {
      error: "Too many authentication attempts, please try again later.",
      retryAfter: "15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ===== AUTHENTICATION ROUTES =====

  // User registration with secure password hashing
  app.post("/api/auth/register", authRateLimit, async (req, res) => {
    try {
      const registrationSchema = z.object({
        username: z.string()
          .min(3, "Username must be at least 3 characters")
          .max(30, "Username must not exceed 30 characters")
          .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
        password: z.string()
          .min(8, "Password must be at least 8 characters")
          .max(128, "Password must not exceed 128 characters")
      });

      const { username, password } = registrationSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Hash the password with bcrypt (cost factor 12 for security)
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user with hashed password
      const user = await storage.createUser({
        username,
        password: hashedPassword
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: userWithoutPassword
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid registration data", 
          details: error.errors 
        });
      }
      console.error("Registration failed:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // User login with password verification
  app.post("/api/auth/login", authRateLimit, async (req, res) => {
    try {
      const loginSchema = z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required")
      });

      const { username, password } = loginSchema.parse(req.body);

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        // Generic error message to prevent username enumeration
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        message: "Login successful",
        user: userWithoutPassword
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid login data", 
          details: error.errors 
        });
      }
      console.error("Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get user profile (requires user ID)
  app.get("/api/auth/user/:id", async (req, res) => {
    try {
      const userId = z.string().parse(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      console.error("Failed to get user:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Check if username is available
  app.get("/api/auth/check-username/:username", async (req, res) => {
    try {
      const username = z.string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_-]+$/)
        .parse(req.params.username);

      const existingUser = await storage.getUserByUsername(username);
      res.json({ 
        available: !existingUser,
        username 
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid username format",
          details: error.errors 
        });
      }
      console.error("Failed to check username:", error);
      res.status(500).json({ error: "Failed to check username" });
    }
  });

  // Get transactions for a wallet address (enhanced with pagination and filtering)
  app.get("/api/transactions/:address", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      
      // Parse query parameters for pagination and filtering
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      const network = req.query.network as string;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const search = req.query.search as string;
      
      const transactions = await storage.getTransactionsByAddress(address);
      
      // Apply filters
      let filteredTransactions = transactions;
      
      if (network) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.network?.toLowerCase() === network.toLowerCase()
        );
      }
      
      if (status) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.status === status
        );
      }
      
      if (type) {
        const isOutgoing = tx => tx.fromAddress.toLowerCase() === address.toLowerCase();
        filteredTransactions = filteredTransactions.filter(tx => {
          switch (type) {
            case 'sent': return isOutgoing(tx);
            case 'received': return !isOutgoing(tx);
            case 'token_transfer': return tx.metadata?.tokenSymbol;
            case 'contract_interaction': return tx.metadata?.contractAddress;
            default: return true;
          }
        });
      }
      
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredTransactions = filteredTransactions.filter(tx =>
          tx.hash.toLowerCase().includes(searchTerm) ||
          tx.fromAddress.toLowerCase().includes(searchTerm) ||
          tx.toAddress.toLowerCase().includes(searchTerm) ||
          tx.metadata?.tokenSymbol?.toLowerCase().includes(searchTerm)
        );
      }
      
      if (startDate) {
        const start = new Date(startDate);
        filteredTransactions = filteredTransactions.filter(tx => 
          new Date(tx.timestamp!) >= start
        );
      }
      
      if (endDate) {
        const end = new Date(endDate);
        filteredTransactions = filteredTransactions.filter(tx => 
          new Date(tx.timestamp!) <= end
        );
      }
      
      // Sort by timestamp (newest first)
      filteredTransactions.sort((a, b) => 
        new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
      );
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
      
      // Response with pagination metadata
      res.json({
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total: filteredTransactions.length,
          hasMore: endIndex < filteredTransactions.length,
          totalPages: Math.ceil(filteredTransactions.length / limit)
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Get transaction statistics for a wallet address
  app.get("/api/transactions/:address/stats", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const transactions = await storage.getTransactionsByAddress(address);
      
      const stats = {
        total: transactions.length,
        sent: transactions.filter(tx => tx.fromAddress.toLowerCase() === address.toLowerCase()).length,
        received: transactions.filter(tx => tx.toAddress.toLowerCase() === address.toLowerCase()).length,
        pending: transactions.filter(tx => tx.status === 'pending').length,
        confirmed: transactions.filter(tx => tx.status === 'confirmed').length,
        failed: transactions.filter(tx => tx.status === 'failed').length,
        networks: [...new Set(transactions.map(tx => tx.network))],
        totalVolume: transactions.reduce((sum, tx) => {
          const amount = parseFloat(tx.amount || '0');
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0)
      };
      
      res.json(stats);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get transaction stats:", error);
      res.status(500).json({ error: "Failed to get transaction stats" });
    }
  });

  // Real-time transaction monitoring endpoint
  app.get("/api/transactions/:address/pending", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const transactions = await storage.getTransactionsByAddress(address);
      const pendingTransactions = transactions.filter(tx => tx.status === 'pending');
      
      res.json(pendingTransactions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get pending transactions:", error);
      res.status(500).json({ error: "Failed to get pending transactions" });
    }
  });

  // Export transactions endpoint
  app.get("/api/transactions/:address/export", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const format = (req.query.format as string) || 'json';
      
      const transactions = await storage.getTransactionsByAddress(address);
      
      if (format === 'csv') {
        const csvHeaders = [
          'Hash', 'Date', 'From', 'To', 'Amount', 'Status', 'Network', 'Gas Price', 'Gas Used', 'Fee', 'Block Number'
        ];
        
        const csvRows = transactions.map(tx => [
          tx.hash,
          tx.timestamp ? new Date(tx.timestamp).toISOString() : '',
          tx.fromAddress,
          tx.toAddress,
          tx.amount || '0',
          tx.status,
          tx.network || '',
          tx.gasPrice || '',
          tx.gasUsed || '',
          tx.fee || '',
          tx.blockNumber || ''
        ]);
        
        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="transactions-${address}.csv"`);
        res.send(csvContent);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="transactions-${address}.json"`);
        res.json(transactions);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to export transactions:", error);
      res.status(500).json({ error: "Failed to export transactions" });
    }
  });

  // Store a new transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionSchema = z.object({
        hash: transactionHashSchema,
        fromAddress: ethereumAddressSchema,
        toAddress: ethereumAddressSchema,
        amount: z.string().regex(/^\d+$/, "Amount must be a valid wei string"),
        gasPrice: z.string().regex(/^\d+$/, "Gas price must be a valid wei string").optional(),
        gasUsed: z.string().regex(/^\d+$/, "Gas used must be a valid number").optional(),
        fee: z.string().regex(/^\d+$/, "Fee must be a valid wei string").optional(),
        status: z.enum(["pending", "confirmed", "failed"]).default("pending"),
        network: z.string().default("mainnet"),
        blockNumber: z.string().regex(/^\d+$/, "Block number must be a valid number").optional(),
        metadata: z.any().optional()
      });

      const validatedData = transactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  // Bulk store transactions (upsert)
  app.post("/api/transactions/bulk", async (req, res) => {
    try {
      const bulkTransactionSchema = z.array(z.object({
        hash: transactionHashSchema,
        fromAddress: ethereumAddressSchema,
        toAddress: ethereumAddressSchema,
        amount: z.string().optional(), // Allow formatted amounts from client
        gasPrice: z.string().optional(),
        gasUsed: z.string().optional(),
        fee: z.string().optional(),
        status: z.enum(["pending", "confirmed", "failed"]).default("confirmed"),
        network: z.string().default("mainnet"),
        blockNumber: z.string().optional(),
        metadata: z.any().optional()
      })).max(100, "Maximum 100 transactions per request");

      const validatedData = bulkTransactionSchema.parse(req.body);
      
      // Validate and normalize the transactions
      const processedTransactions = validatedData.map(tx => ({
        ...tx,
        amount: tx.amount || "0",
        status: tx.status || "confirmed"
      }));

      const storedTransactions = await storage.upsertTransactions(processedTransactions);
      
      res.status(201).json({
        success: true,
        stored: storedTransactions.length,
        transactions: storedTransactions
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid transaction data", 
          details: error.errors.slice(0, 5) // Limit error details to prevent large responses
        });
      }
      console.error("Failed to bulk store transactions:", error);
      res.status(500).json({ error: "Failed to store transactions" });
    }
  });

  // Update transaction status
  app.patch("/api/transactions/:hash", async (req, res) => {
    try {
      const hash = transactionHashSchema.parse(req.params.hash);
      const updateSchema = z.object({
        status: z.enum(["pending", "confirmed", "failed"]).optional(),
        blockNumber: z.string().regex(/^\d+$/, "Block number must be a valid number").optional(),
        gasUsed: z.string().regex(/^\d+$/, "Gas used must be a valid number").optional(),
        fee: z.string().regex(/^\d+$/, "Fee must be a valid wei string").optional()
      });

      const validatedData = updateSchema.parse(req.body);
      const transaction = await storage.updateTransaction(hash, validatedData);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid hash or data format" });
      }
      console.error("Failed to update transaction:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Get or create wallet info
  app.get("/api/wallet/:address", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      let wallet = await storage.getWalletByAddress(address);
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await storage.createWallet({
          address,
          balance: "0",
          network: "mainnet"
        });
      }
      
      res.json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get wallet:", error);
      res.status(500).json({ error: "Failed to get wallet" });
    }
  });

  // Update wallet balance
  app.patch("/api/wallet/:address", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const updateSchema = z.object({
        balance: z.string().regex(/^\d+$/, "Balance must be a valid wei string").optional(),
        network: z.string().optional()
      });

      const validatedData = updateSchema.parse(req.body);
      const wallet = await storage.updateWallet(address, validatedData);
      
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address or data format" });
      }
      console.error("Failed to update wallet:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Get network information
  app.get("/api/networks", async (req, res) => {
    try {
      const networks = await storage.getAllNetworks();
      res.json(networks);
    } catch (error) {
      console.error("Failed to get networks:", error);
      res.status(500).json({ error: "Failed to get networks" });
    }
  });

  // Add or update network information
  app.post("/api/networks", async (req, res) => {
    try {
      const networkSchema = z.object({
        chainId: z.string(),
        name: z.string(),
        rpcUrl: z.string(),
        blockExplorerUrl: z.string().optional(),
        symbol: z.string().default("ETH"),
        decimals: z.string().default("18"),
        isTestnet: z.string().default("false")
      });

      const validatedData = networkSchema.parse(req.body);
      const network = await storage.createOrUpdateNetwork(validatedData);
      res.status(201).json(network);
    } catch (error) {
      console.error("Failed to create/update network:", error);
      res.status(400).json({ error: "Invalid network data" });
    }
  });

  // ========================
  // TOKEN MANAGEMENT ROUTES
  // ========================

  // Get all tokens
  app.get("/api/tokens", async (req, res) => {
    try {
      const tokens = await storage.getAllTokens();
      res.json(tokens);
    } catch (error) {
      console.error("Failed to get tokens:", error);
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });

  // Get tokens by chain
  app.get("/api/tokens/chain/:chainId", async (req, res) => {
    try {
      const chainId = z.string().parse(req.params.chainId);
      const tokens = await storage.getTokensByChain(chainId);
      res.json(tokens);
    } catch (error) {
      console.error("Failed to get tokens by chain:", error);
      res.status(500).json({ error: "Failed to get tokens by chain" });
    }
  });

  // Get token by contract address and chain
  app.get("/api/tokens/:chainId/:contractAddress", async (req, res) => {
    try {
      const chainId = z.string().parse(req.params.chainId);
      const contractAddress = ethereumAddressSchema.parse(req.params.contractAddress);
      const token = await storage.getTokenByAddressAndChain(contractAddress, chainId);
      
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }
      
      res.json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid chain ID or contract address" });
      }
      console.error("Failed to get token:", error);
      res.status(500).json({ error: "Failed to get token" });
    }
  });

  // Create/add new token
  app.post("/api/tokens", async (req, res) => {
    try {
      const validatedData = insertTokenSchema.parse(req.body);
      const token = await storage.createToken(validatedData);
      res.status(201).json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid token data", 
          details: error.errors 
        });
      }
      console.error("Failed to create token:", error);
      res.status(500).json({ error: "Failed to create token" });
    }
  });

  // Update token metadata
  app.put("/api/tokens/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const updateData = insertTokenSchema.partial().parse(req.body);
      const token = await storage.updateToken(id, updateData);
      
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }
      
      res.json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid token data", 
          details: error.errors 
        });
      }
      console.error("Failed to update token:", error);
      res.status(500).json({ error: "Failed to update token" });
    }
  });

  // ========================
  // TOKEN BALANCE ROUTES
  // ========================

  // Get all token balances for a wallet
  app.get("/api/tokens/balances/:walletAddress", async (req, res) => {
    try {
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const balances = await storage.getTokenBalancesByWallet(walletAddress);
      res.json(balances);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      console.error("Failed to get token balances:", error);
      res.status(500).json({ error: "Failed to get token balances" });
    }
  });

  // Get specific token balance
  app.get("/api/tokens/balances/:walletAddress/:tokenId", async (req, res) => {
    try {
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const tokenId = z.string().parse(req.params.tokenId);
      const balance = await storage.getTokenBalance(walletAddress, tokenId);
      
      if (!balance) {
        return res.status(404).json({ error: "Token balance not found" });
      }
      
      res.json(balance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet address or token ID" });
      }
      console.error("Failed to get token balance:", error);
      res.status(500).json({ error: "Failed to get token balance" });
    }
  });

  // Update/create token balance
  app.put("/api/tokens/balances", async (req, res) => {
    try {
      const validatedData = insertTokenBalanceSchema.parse(req.body);
      const balance = await storage.createOrUpdateTokenBalance(validatedData);
      res.json(balance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid token balance data", 
          details: error.errors 
        });
      }
      console.error("Failed to update token balance:", error);
      res.status(500).json({ error: "Failed to update token balance" });
    }
  });

  // Batch update token balances
  app.post("/api/tokens/balances/batch", async (req, res) => {
    try {
      const batchSchema = z.object({
        balances: z.array(insertTokenBalanceSchema)
      });
      
      const { balances } = batchSchema.parse(req.body);
      const updatedBalances = [];
      
      for (const balanceData of balances) {
        const balance = await storage.createOrUpdateTokenBalance(balanceData);
        updatedBalances.push(balance);
      }
      
      res.json(updatedBalances);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid batch balance data", 
          details: error.errors 
        });
      }
      console.error("Failed to batch update token balances:", error);
      res.status(500).json({ error: "Failed to batch update token balances" });
    }
  });

  // ========================
  // USER TOKEN MANAGEMENT
  // ========================

  // Get user's tracked tokens for specific wallet
  app.get("/api/user-tokens/:userId/:walletAddress", async (req, res) => {
    try {
      const userId = z.string().parse(req.params.userId);
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const userTokens = await storage.getUserTokens(userId, walletAddress);
      res.json(userTokens);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user ID or wallet address" });
      }
      console.error("Failed to get user tokens:", error);
      res.status(500).json({ error: "Failed to get user tokens" });
    }
  });

  // Get all user tokens for a wallet (regardless of user)
  app.get("/api/user-tokens/wallet/:walletAddress", async (req, res) => {
    try {
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const userTokens = await storage.getUserTokensByWallet(walletAddress);
      res.json(userTokens);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      console.error("Failed to get user tokens by wallet:", error);
      res.status(500).json({ error: "Failed to get user tokens by wallet" });
    }
  });

  // Add token to user's watchlist
  app.post("/api/user-tokens", async (req, res) => {
    try {
      const validatedData = insertUserTokenSchema.parse(req.body);
      const userToken = await storage.addUserToken(validatedData);
      res.status(201).json(userToken);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid user token data", 
          details: error.errors 
        });
      }
      console.error("Failed to add user token:", error);
      res.status(500).json({ error: "Failed to add user token" });
    }
  });

  // Remove token from user's watchlist
  app.delete("/api/user-tokens/:userId/:walletAddress/:tokenId", async (req, res) => {
    try {
      const userId = z.string().parse(req.params.userId);
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const tokenId = z.string().parse(req.params.tokenId);
      
      const removed = await storage.removeUserToken(userId, walletAddress, tokenId);
      
      if (!removed) {
        return res.status(404).json({ error: "User token not found" });
      }
      
      res.json({ success: true, message: "Token removed from watchlist" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user ID, wallet address, or token ID" });
      }
      console.error("Failed to remove user token:", error);
      res.status(500).json({ error: "Failed to remove user token" });
    }
  });

  // Update user token settings (hide/show, sort order)
  app.patch("/api/user-tokens/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const updateSchema = z.object({
        isHidden: z.string().optional(),
        sortOrder: z.string().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      const userToken = await storage.updateUserToken(id, updateData);
      
      if (!userToken) {
        return res.status(404).json({ error: "User token not found" });
      }
      
      res.json(userToken);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid user token data", 
          details: error.errors 
        });
      }
      console.error("Failed to update user token:", error);
      res.status(500).json({ error: "Failed to update user token" });
    }
  });

  // ================================
  // CONTRACT MANAGEMENT ROUTES
  // ================================

  // Get all contracts with optional filtering
  app.get("/api/contracts", async (req, res) => {
    try {
      const filters: { userId?: string; chainId?: string; tags?: string[] } = {};
      
      if (req.query.userId) {
        filters.userId = z.string().parse(req.query.userId);
      }
      if (req.query.chainId) {
        filters.chainId = z.string().parse(req.query.chainId);
      }
      if (req.query.tags) {
        const tagsParam = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
        filters.tags = tagsParam.map(tag => z.string().parse(tag));
      }

      const contracts = await storage.getContracts(filters);
      res.json({ contracts });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid filter parameters", 
          details: error.errors 
        });
      }
      console.error("Failed to get contracts:", error);
      res.status(500).json({ error: "Failed to get contracts" });
    }
  });

  // Create a new contract
  app.post("/api/contracts", async (req, res) => {
    try {
      const contractData = insertContractSchema.parse(req.body);
      
      // Check if contract already exists
      const existing = await storage.getContractByAddressAndChain(
        contractData.address, 
        contractData.chainId
      );
      
      if (existing) {
        return res.status(409).json({ 
          error: "Contract already exists for this address and chain",
          existingContract: existing 
        });
      }

      const contract = await storage.createContract(contractData);
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid contract data", 
          details: error.errors 
        });
      }
      console.error("Failed to create contract:", error);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  // Get a specific contract by ID
  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contract ID" });
      }
      console.error("Failed to get contract:", error);
      res.status(500).json({ error: "Failed to get contract" });
    }
  });

  // Update a contract
  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const updateSchema = insertContractSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const contract = await storage.updateContract(id, updateData);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid contract data", 
          details: error.errors 
        });
      }
      console.error("Failed to update contract:", error);
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  // Delete a contract
  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const deleted = await storage.deleteContract(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      res.json({ success: true, message: "Contract deleted successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contract ID" });
      }
      console.error("Failed to delete contract:", error);
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // Get contract call history with pagination
  app.get("/api/contracts/:id/calls", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      
      const calls = await storage.getContractCalls(contractId, { page, limit });
      
      res.json({
        calls,
        pagination: {
          page,
          limit,
          hasMore: calls.length === limit
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid pagination parameters", 
          details: error.errors 
        });
      }
      console.error("Failed to get contract calls:", error);
      res.status(500).json({ error: "Failed to get contract calls" });
    }
  });

  // Record a new contract call
  app.post("/api/contracts/:id/calls", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const callData = insertContractCallSchema.parse({
        ...req.body,
        contractId
      });
      
      const call = await storage.createContractCall(callData);
      res.status(201).json(call);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid contract call data", 
          details: error.errors 
        });
      }
      console.error("Failed to create contract call:", error);
      res.status(500).json({ error: "Failed to create contract call" });
    }
  });

  // Update a contract call (e.g., after transaction confirmation)
  app.patch("/api/contracts/:contractId/calls/:callId", async (req, res) => {
    try {
      const callId = z.string().parse(req.params.callId);
      const updateSchema = insertContractCallSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const call = await storage.updateContractCall(callId, updateData);
      
      if (!call) {
        return res.status(404).json({ error: "Contract call not found" });
      }
      
      res.json(call);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid contract call data", 
          details: error.errors 
        });
      }
      console.error("Failed to update contract call:", error);
      res.status(500).json({ error: "Failed to update contract call" });
    }
  });

  // Get contract calls by address (user's call history)
  app.get("/api/contract-calls/:address", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      
      const calls = await storage.getContractCallsByAddress(address, { page, limit });
      
      res.json({
        calls,
        pagination: {
          page,
          limit,
          hasMore: calls.length === limit
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid address format" });
      }
      console.error("Failed to get contract calls by address:", error);
      res.status(500).json({ error: "Failed to get contract calls" });
    }
  });

  // ================================
  // CONTRACT EVENT SUBSCRIPTION ROUTES
  // ================================

  // Get event subscriptions for a contract
  app.get("/api/contracts/:id/event-subscriptions", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const subscriptions = await storage.getContractEventSubs(contractId);
      res.json({ subscriptions });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contract ID" });
      }
      console.error("Failed to get event subscriptions:", error);
      res.status(500).json({ error: "Failed to get event subscriptions" });
    }
  });

  // Create a new event subscription
  app.post("/api/contracts/:id/event-subscriptions", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const subData = insertContractEventSubSchema.parse({
        ...req.body,
        contractId
      });
      
      const subscription = await storage.createContractEventSub(subData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid event subscription data", 
          details: error.errors 
        });
      }
      console.error("Failed to create event subscription:", error);
      res.status(500).json({ error: "Failed to create event subscription" });
    }
  });

  // Update an event subscription
  app.patch("/api/event-subscriptions/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const updateSchema = insertContractEventSubSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const subscription = await storage.updateContractEventSub(id, updateData);
      
      if (!subscription) {
        return res.status(404).json({ error: "Event subscription not found" });
      }
      
      res.json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid event subscription data", 
          details: error.errors 
        });
      }
      console.error("Failed to update event subscription:", error);
      res.status(500).json({ error: "Failed to update event subscription" });
    }
  });

  // Delete an event subscription
  app.delete("/api/event-subscriptions/:id", async (req, res) => {
    try {
      const id = z.string().parse(req.params.id);
      const deleted = await storage.deleteContractEventSub(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Event subscription not found" });
      }
      
      res.json({ success: true, message: "Event subscription deleted successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid subscription ID" });
      }
      console.error("Failed to delete event subscription:", error);
      res.status(500).json({ error: "Failed to delete event subscription" });
    }
  });

  // Get contract events with pagination
  app.get("/api/contracts/:id/events", async (req, res) => {
    try {
      const contractId = z.string().parse(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      
      const events = await storage.getContractEvents(contractId, { page, limit });
      
      res.json({
        events,
        pagination: {
          page,
          limit,
          hasMore: events.length === limit
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid pagination parameters", 
          details: error.errors 
        });
      }
      console.error("Failed to get contract events:", error);
      res.status(500).json({ error: "Failed to get contract events" });
    }
  });

  // Rate limiting configuration for NFT endpoints
  const nftRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs for NFTs
    message: {
      error: "Too many NFT requests from this IP, please try again later.",
      retryAfter: "15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const nftSlowDown = slowDown({
    windowMs: 5 * 60 * 1000, // 5 minutes
    delayAfter: 20, // Allow 20 requests per 5 minutes at full speed
    delayMs: 500, // Add 500ms delay per request after limit
    maxDelayMs: 10000, // Maximum delay of 10 seconds
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
  });

  // Stricter rate limiting for refresh endpoints
  const nftRefreshRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Only 10 refresh requests per hour
    message: {
      error: "Too many NFT refresh requests from this IP, please try again later.",
      retryAfter: "1 hour"
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ===== NFT API ROUTES =====

  // Get NFTs for a wallet address with comprehensive filtering and pagination
  app.get("/api/nfts/:address", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      
      // Parse query parameters
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      const chains = req.query.chains ? 
        (Array.isArray(req.query.chains) ? req.query.chains : [req.query.chains]) : 
        ["0x1", "0x89", "0x38", "0xa4b1", "0xa"]; // Default supported chains
      const collection = req.query.collection as string;
      const search = req.query.search as string;
      const forceRefresh = req.query.refresh === "true";
      const maxAge = parseInt(req.query.maxAge as string) || 24; // hours
      const sortBy = (req.query.sortBy as string) || "acquired";
      const sortOrder = (req.query.sortOrder as string) || "desc";
      
      // Validate chain IDs
      const validChains = chains.filter(chain => 
        typeof chain === 'string' && /^0x[a-fA-F0-9]+$/.test(chain)
      );
      
      if (validChains.length === 0) {
        return res.status(400).json({ 
          error: "At least one valid chain ID is required" 
        });
      }

      const result = await nftService.fetchNFTsForWallet(address, validChains, {
        forceRefresh,
        maxAge,
        page,
        limit,
        collection,
        search,
        sortBy,
        sortOrder
      });

      res.json({
        nfts: result.nfts,
        collections: result.collections,
        stats: result.stats,
        pagination: result.pagination,
        filters: {
          chains: validChains,
          collection,
          search,
          sortBy,
          sortOrder
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid wallet address format",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFTs:", error);
      res.status(500).json({ 
        error: "Failed to fetch NFTs",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get NFT collections for a wallet
  app.get("/api/nfts/:address/collections", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const chainId = req.query.chainId as string;
      
      const collections = await storage.getCollectionsByWallet(address, chainId);
      
      res.json({ collections });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid wallet address format",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFT collections:", error);
      res.status(500).json({ error: "Failed to fetch NFT collections" });
    }
  });

  // Get NFT statistics for a wallet
  app.get("/api/nfts/:address/stats", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      
      const stats = await storage.getNftStats(address);
      
      res.json({ stats });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid wallet address format",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFT stats:", error);
      res.status(500).json({ error: "Failed to fetch NFT stats" });
    }
  });

  // Get NFT attribute facets for filtering
  app.get("/api/nfts/:address/facets", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const chainId = req.query.chainId as string;
      const collectionId = req.query.collectionId as string;
      
      const facets = await storage.getNftAttributeFacets(address, {
        chainId,
        collectionId
      });
      
      res.json({ facets });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid wallet address format",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFT facets:", error);
      res.status(500).json({ error: "Failed to fetch NFT facets" });
    }
  });

  // Force refresh NFTs for a wallet
  app.post("/api/nfts/:address/refresh", nftRefreshRateLimit, nftSlowDown, async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const chains = req.body.chains || ["0x1", "0x89", "0x38", "0xa4b1", "0xa"];
      
      // Validate chain IDs
      const validChains = chains.filter((chain: string) => 
        typeof chain === 'string' && /^0x[a-fA-F0-9]+$/.test(chain)
      );
      
      if (validChains.length === 0) {
        return res.status(400).json({ 
          error: "At least one valid chain ID is required" 
        });
      }

      // Force refresh with no cache
      const result = await nftService.fetchNFTsForWallet(address, validChains, {
        forceRefresh: true,
        maxAge: 0
      });

      res.json({
        success: true,
        message: "NFT data refreshed successfully",
        stats: result.stats,
        refreshedAt: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: error.errors 
        });
      }
      console.error("Failed to refresh NFTs:", error);
      res.status(500).json({ 
        error: "Failed to refresh NFTs",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get specific NFT details
  app.get("/api/nfts/:chainId/:contractAddress/:tokenId", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const chainId = z.string().parse(req.params.chainId);
      const contractAddress = ethereumAddressSchema.parse(req.params.contractAddress);
      const tokenId = z.string().parse(req.params.tokenId);
      
      const nft = await storage.getNftByToken(contractAddress, tokenId, chainId);
      
      if (!nft) {
        return res.status(404).json({ error: "NFT not found" });
      }

      let collection = null;
      if (nft.collectionId) {
        collection = await storage.getNftCollection(nft.collectionId);
      }

      const ownerships = await storage.getNftOwnershipsByNft(nft.id);

      res.json({
        nft,
        collection,
        ownerships
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid NFT parameters",
          details: error.errors 
        });
      }
      console.error("Failed to fetch NFT details:", error);
      res.status(500).json({ error: "Failed to fetch NFT details" });
    }
  });

  // Refresh metadata for a specific NFT
  app.post("/api/nfts/:chainId/:contractAddress/:tokenId/refresh", nftRefreshRateLimit, nftSlowDown, async (req, res) => {
    try {
      const chainId = z.string().parse(req.params.chainId);
      const contractAddress = ethereumAddressSchema.parse(req.params.contractAddress);
      const tokenId = z.string().parse(req.params.tokenId);
      
      const refreshedNft = await nftService.refreshNFTMetadata(contractAddress, tokenId, chainId);
      
      if (!refreshedNft) {
        return res.status(404).json({ error: "Failed to refresh NFT metadata" });
      }

      res.json({
        success: true,
        message: "NFT metadata refreshed successfully",
        nft: refreshedNft,
        refreshedAt: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid NFT parameters",
          details: error.errors 
        });
      }
      console.error("Failed to refresh NFT metadata:", error);
      res.status(500).json({ error: "Failed to refresh NFT metadata" });
    }
  });

  // Update NFT ownership visibility
  app.patch("/api/nfts/:address/:nftId/visibility", async (req, res) => {
    try {
      const address = ethereumAddressSchema.parse(req.params.address);
      const nftId = z.string().parse(req.params.nftId);
      const { hidden } = z.object({
        hidden: z.boolean()
      }).parse(req.body);
      
      const ownership = await storage.getNftOwnershipByWalletAndNft(address, nftId);
      
      if (!ownership) {
        return res.status(404).json({ error: "NFT ownership not found" });
      }

      const updatedOwnership = await storage.updateNftOwnership(ownership.id, {
        isHidden: hidden ? "true" : "false"
      });

      res.json({
        success: true,
        ownership: updatedOwnership
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request parameters",
          details: error.errors 
        });
      }
      console.error("Failed to update NFT visibility:", error);
      res.status(500).json({ error: "Failed to update NFT visibility" });
    }
  });

  // Search NFTs across all collections
  app.get("/api/nfts/search", nftRateLimit, nftSlowDown, async (req, res) => {
    try {
      const query = z.string().min(1).parse(req.query.q);
      const chainId = req.query.chainId as string;
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      
      const nfts = await storage.searchNfts(query, chainId, { page, limit });
      
      res.json({
        nfts,
        pagination: {
          page,
          limit,
          hasMore: nfts.length === limit
        },
        query: {
          search: query,
          chainId
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid search parameters",
          details: error.errors 
        });
      }
      console.error("Failed to search NFTs:", error);
      res.status(500).json({ error: "Failed to search NFTs" });
    }
  });

  // Update health check to include NFTs service
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      services: ["transactions", "wallets", "tokens", "networks", "contracts", "nfts", "payments"],
      database: "connected",
      timestamp: new Date().toISOString()
    });
  });

  // ===== CRYPTO PAYMENT GATEWAY ROUTES (NOWPayments) =====
  
  const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
  const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

  // Get available cryptocurrencies
  app.get("/api/payments/currencies", async (req, res) => {
    try {
      const popular = ['btc', 'eth', 'usdt', 'bnb', 'sol', 'xrp', 'ada', 'doge', 'matic', 'ltc', 'avax', 'dot', 'link', 'uni', 'atom'];
      res.json(popular);
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      res.status(500).json({ error: "Failed to fetch currencies" });
    }
  });

  // Create payment
  app.post("/api/payments/create", async (req, res) => {
    try {
      const paymentSchema = z.object({
        amount: z.number().positive(),
        currency: z.string(),
        crypto: z.string()
      });

      const { amount, currency, crypto } = paymentSchema.parse(req.body);

      // Mock payment creation (in production, call NOWPayments API)
      const mockPayment = {
        payment_id: `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        payment_status: 'waiting',
        pay_address: crypto === 'btc' ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' :
                     crypto === 'eth' ? '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' :
                     crypto === 'sol' ? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' :
                     `${crypto}_payment_address`,
        pay_amount: crypto === 'btc' ? amount / 45000 :
                   crypto === 'eth' ? amount / 2500 :
                   crypto === 'sol' ? amount / 100 :
                   amount / 50,
        price_amount: amount,
        price_currency: currency,
        pay_currency: crypto,
        created_at: new Date().toISOString(),
        expiration_estimate_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      res.json(mockPayment);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid payment data", 
          details: error.errors 
        });
      }
      console.error("Failed to create payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Get payment status
  app.get("/api/payments/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;

      // Mock payment status (in production, call NOWPayments API)
      const mockStatus = {
        payment_id: paymentId,
        payment_status: Math.random() > 0.7 ? 'confirmed' : 'waiting',
        pay_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        pay_amount: 0.00234567,
        price_amount: 100,
        price_currency: 'usd',
        pay_currency: 'btc',
        created_at: new Date().toISOString(),
        expiration_estimate_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      res.json(mockStatus);

    } catch (error) {
      console.error("Failed to get payment status:", error);
      res.status(500).json({ error: "Failed to get payment status" });
    }
  });

  // ===== PAYMENT SYSTEM ROUTES =====
  
  // Product Routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/active", async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch active products:", error);
      res.status(500).json({ error: "Failed to fetch active products" });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });
  
  // Order Routes
  app.post("/api/orders/create", async (req, res) => {
    try {
      const orderSchema = z.object({
        customerEmail: z.string().email().optional(),
        customerWallet: z.string().optional(),
        paymentMethod: z.enum(['metamask', 'nowpayments', 'stripe']),
        items: z.array(z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
          price: z.string()
        })),
        totalAmount: z.string(),
        currency: z.string().default('USD'),
        chainId: z.number().int().positive().optional(),
        metadata: z.any().optional()
      });

      const orderData = orderSchema.parse(req.body);
      
      // Server-side expected crypto amount calculation for MetaMask payments
      let expectedCryptoAmount = undefined;
      let expectedChainId = undefined;
      let fxRateLocked = undefined;
      
      if (orderData.paymentMethod === 'metamask' && orderData.chainId) {
        // TODO PRODUCTION: Replace with real-time price API
        const ETH_USD_RATE = 2500;
        fxRateLocked = ETH_USD_RATE.toString();
        expectedCryptoAmount = (parseFloat(orderData.totalAmount) / ETH_USD_RATE).toFixed(18);
        expectedChainId = orderData.chainId.toString();
        
        console.log(`📊 Order expected payment: ${expectedCryptoAmount} ETH on chain ${expectedChainId} (rate: ${ETH_USD_RATE})`);
      }
      
      const order = await storage.createOrder({
        ...orderData,
        status: 'pending',
        userId: (req.user as any)?.id,
        items: orderData.items as any,
        expectedCryptoAmount,
        expectedChainId,
        fxRateLocked,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid order data", 
          details: error.errors 
        });
      }
      console.error("Failed to create order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  app.get("/api/orders/user/:userId", async (req, res) => {
    try {
      const orders = await storage.getUserOrders(req.params.userId);
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch user orders:", error);
      res.status(500).json({ error: "Failed to fetch user orders" });
    }
  });
  
  app.get("/api/orders/wallet/:walletAddress", async (req, res) => {
    try {
      const orders = await storage.getOrdersByWallet(req.params.walletAddress);
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch wallet orders:", error);
      res.status(500).json({ error: "Failed to fetch wallet orders" });
    }
  });
  
  // Blockchain Configuration Routes
  app.get("/api/blockchain/chains", (req, res) => {
    const chains = getAllSupportedChains();
    res.json(chains);
  });
  
  app.get("/api/blockchain/chains/:chainId", (req, res) => {
    const chainId = parseInt(req.params.chainId);
    const chain = getChainConfig(chainId);
    
    if (!chain) {
      return res.status(404).json({ error: "Chain not supported" });
    }
    
    res.json(chain);
  });
  
  // Payment Processing Routes
  app.post("/api/payments/metamask", async (req, res) => {
    try {
      const paymentSchema = z.object({
        orderId: z.string().uuid(),
        txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
        fromAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid from address"),
        toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid to address"),
        chainId: z.number().int().positive(),
        amount: z.string(), // Client amount (will be validated against server expectation)
        amountUSD: z.string(),
        currency: z.string()
      });

      const data = paymentSchema.parse(req.body);
      
      // SECURITY: Check txHash uniqueness - prevent replay attacks
      const existingPayments = await storage.getPayments();
      const existingTx = existingPayments.find(p => p.txHash === data.txHash);
      if (existingTx) {
        console.error(`❌ Transaction hash already used: ${data.txHash}`);
        return res.status(400).json({ 
          error: "Transaction hash already used. Each transaction can only be used once.",
          existingPaymentId: existingTx.id
        });
      }
      
      // Verify chain is supported
      const chainConfig = getChainConfig(data.chainId);
      if (!chainConfig) {
        return res.status(400).json({ 
          error: `Unsupported chain ID: ${data.chainId}. Supported chains: ${getAllSupportedChains().map(c => `${c.chainName} (${c.chainId})`).join(', ')}`
        });
      }
      
      // Verify recipient matches server-side merchant address
      if (data.toAddress.toLowerCase() !== chainConfig.merchantAddress.toLowerCase()) {
        return res.status(400).json({ 
          error: `Invalid recipient address. Expected ${chainConfig.merchantAddress}, got ${data.toAddress}` 
        });
      }
      
      // Verify order exists and is not expired
      const order = await storage.getOrder(data.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.expiresAt && new Date(order.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Order has expired" });
      }
      
      if (order.status !== 'pending') {
        return res.status(400).json({ error: "Order is not in pending state" });
      }
      
      // SECURITY: Bind payment to customer wallet - prevent order hijacking
      if (order.customerWallet) {
        if (data.fromAddress.toLowerCase() !== order.customerWallet.toLowerCase()) {
          console.error(`❌ Payer mismatch: order wallet ${order.customerWallet}, from ${data.fromAddress}`);
          return res.status(400).json({ 
            error: "Payment must come from the wallet that created the order",
            expectedWallet: order.customerWallet,
            actualWallet: data.fromAddress
          });
        }
      }
      
      // SECURITY: Use server-calculated expected amount, not client amount
      const expectedAmount = order.expectedCryptoAmount || data.amount;
      const expectedChain = order.expectedChainId ? parseInt(order.expectedChainId) : data.chainId;
      
      if (expectedChain !== data.chainId) {
        return res.status(400).json({ 
          error: `Chain mismatch: order expects chain ${expectedChain}, payment on chain ${data.chainId}` 
        });
      }
      
      console.log(`🔍 Verifying transaction ${data.txHash} on ${chainConfig.chainName}...`);
      console.log(`   Expected amount: ${expectedAmount} ETH (server-calculated)`);
      console.log(`   Client claimed: ${data.amount} ETH`);
      
      // BLOCKCHAIN VERIFICATION: Use server-expected amount for verification
      const verification = await verifyTransaction(data.txHash, expectedAmount, data.chainId);
      
      if (!verification.valid) {
        console.error(`❌ Transaction verification failed:`, verification.errors);
        return res.status(400).json({ 
          error: "Transaction verification failed",
          details: verification.errors,
          verificationData: {
            txHash: verification.txHash,
            confirmations: verification.confirmations,
            minRequired: chainConfig.minConfirmations,
            expectedAmount: expectedAmount,
            actualAmount: verification.value
          }
        });
      }
      
      // SECURITY: Verify from address matches blockchain transaction
      if (verification.from.toLowerCase() !== data.fromAddress.toLowerCase()) {
        console.error(`❌ From address mismatch: claimed ${data.fromAddress}, actual ${verification.from}`);
        return res.status(400).json({ 
          error: "Transaction sender does not match claimed address"
        });
      }
      
      console.log(`✅ Transaction verified successfully!`);
      console.log(`   From: ${verification.from} (matched)`);
      console.log(`   To: ${verification.to} (matched)`);
      console.log(`   Value: ${verification.value} ETH (within tolerance)`);
      console.log(`   Confirmations: ${verification.confirmations}/${chainConfig.minConfirmations}`);
      
      const payment = await storage.createPayment({
        orderId: data.orderId,
        paymentMethod: 'metamask',
        provider: 'metamask',
        amount: verification.value,
        currency: data.currency,
        status: 'confirmed',
        txHash: data.txHash,
        fromAddress: verification.from,
        toAddress: verification.to,
        confirmations: verification.confirmations.toString(),
        providerResponse: {
          amountUSD: data.amountUSD,
          chainId: data.chainId,
          chainName: chainConfig.chainName,
          blockNumber: verification.blockNumber,
          verifiedAt: new Date().toISOString(),
          expectedAmount: expectedAmount,
          fxRateLocked: order.fxRateLocked,
          verification: {
            valid: verification.valid,
            confirmations: verification.confirmations,
            valueETH: verification.value
          }
        } as any
      });

      await storage.updateOrder(data.orderId, {
        status: 'completed'
      });

      console.log(`🎉 Payment complete! Order ${order.id} marked as completed`);

      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid payment data", 
          details: error.errors 
        });
      }
      console.error("Failed to process MetaMask payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });
  
  app.post("/api/payments/nowpayments", async (req, res) => {
    try {
      const paymentSchema = z.object({
        orderId: z.string(),
        crypto: z.string(),
        amount: z.string(),
        currency: z.string()
      });

      const data = paymentSchema.parse(req.body);
      
      const payment = await storage.createPayment({
        orderId: data.orderId,
        paymentMethod: 'nowpayments',
        provider: 'nowpayments',
        amount: data.amount,
        currency: data.currency,
        status: 'waiting',
        providerResponse: {
          pay_currency: data.crypto,
          created_at: new Date().toISOString()
        } as any
      });

      await storage.updateOrder(data.orderId, {
        status: 'awaiting_payment'
      });

      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid payment data", 
          details: error.errors 
        });
      }
      console.error("Failed to process NOWPayments payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });
  
  app.get("/api/payments/order/:orderId", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByOrder(req.params.orderId);
      res.json(payments);
    } catch (error) {
      console.error("Failed to fetch order payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  
  app.get("/api/payments/:id/status", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json({ status: payment.status, payment });
    } catch (error) {
      console.error("Failed to fetch payment status:", error);
      res.status(500).json({ error: "Failed to fetch payment status" });
    }
  });
  
  app.post("/api/payments/:id/confirm", async (req, res) => {
    try {
      const confirmSchema = z.object({
        confirmations: z.string().optional(),
        providerResponse: z.any().optional()
      });

      const data = confirmSchema.parse(req.body);
      const payment = await storage.updatePayment(req.params.id, {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmations: data.confirmations,
        providerResponse: data.providerResponse as any
      });

      if (payment) {
        await storage.updateOrder(payment.orderId, {
          status: 'completed'
        });
      }

      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid confirmation data", 
          details: error.errors 
        });
      }
      console.error("Failed to confirm payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });
  
  // Webhook Route (for payment provider callbacks)
  app.post("/api/webhooks/payment", async (req, res) => {
    try {
      const webhookSchema = z.object({
        provider: z.string(),
        eventType: z.string(),
        payload: z.any()
      });

      const data = webhookSchema.parse(req.body);
      
      await storage.createPaymentWebhook({
        provider: data.provider,
        eventType: data.eventType,
        payload: data.payload as any,
        processed: 'false'
      });

      res.json({ received: true });
    } catch (error) {
      console.error("Failed to process webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // ===== SENTINEL BOT ROUTES =====
  
  // Get all available bot strategies
  app.get("/api/bot/strategies", async (req, res) => {
    try {
      const strategies = await storage.getAllBotStrategies();
      res.json(strategies);
    } catch (error) {
      console.error("Failed to fetch bot strategies:", error);
      res.status(500).json({ error: "Failed to fetch bot strategies" });
    }
  });

  // Get bot subscription plans
  app.get("/api/bot/plans", async (req, res) => {
    try {
      const plans = [
        {
          id: 'starter',
          name: 'Starter',
          price: '99',
          currency: 'USD',
          features: [
            '1 Active Strategy',
            '10 Trades Per Day',
            'Basic Technical Indicators',
            'Email Notifications',
            'Stop Loss & Take Profit'
          ],
          maxActiveStrategies: '1',
          maxDailyTrades: '10',
          popular: false
        },
        {
          id: 'pro',
          name: 'Pro',
          price: '299',
          currency: 'USD',
          features: [
            '3 Active Strategies',
            '50 Trades Per Day',
            'Advanced AI Signals',
            'Real-time Alerts',
            'Risk Management Tools',
            'Priority Support'
          ],
          maxActiveStrategies: '3',
          maxDailyTrades: '50',
          popular: true
        },
        {
          id: 'elite',
          name: 'Elite',
          price: '999',
          currency: 'USD',
          features: [
            'Unlimited Strategies',
            'Unlimited Trades',
            'Custom Strategy Builder',
            'Dedicated Account Manager',
            'API Access',
            'White-Glove Onboarding'
          ],
          maxActiveStrategies: '999',
          maxDailyTrades: '999',
          popular: false
        }
      ];
      
      res.json(plans);
    } catch (error) {
      console.error("Failed to fetch bot plans:", error);
      res.status(500).json({ error: "Failed to fetch bot plans" });
    }
  });

  // Create bot subscription
  app.post("/api/bot/subscribe", async (req, res) => {
    try {
      const subscriptionSchema = z.object({
        userId: z.string(),
        planType: z.enum(['starter', 'pro', 'elite']),
        price: z.string(),
        currency: z.string().default('USD'),
        paymentTxHash: z.string().optional()
      });

      const data = subscriptionSchema.parse(req.body);
      
      const planConfig = {
        starter: { maxActiveStrategies: '1', maxDailyTrades: '10', features: ['basic'] },
        pro: { maxActiveStrategies: '3', maxDailyTrades: '50', features: ['advanced'] },
        elite: { maxActiveStrategies: '999', maxDailyTrades: '999', features: ['unlimited'] }
      };

      const config = planConfig[data.planType];
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const subscription = await storage.createBotSubscription({
        userId: data.userId,
        planType: data.planType,
        status: 'active',
        startDate: new Date(),
        expiryDate,
        price: data.price,
        currency: data.currency,
        paymentTxHash: data.paymentTxHash,
        maxActiveStrategies: config.maxActiveStrategies,
        maxDailyTrades: config.maxDailyTrades,
        features: config.features,
        autoRenew: 'false'
      });

      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid subscription data", 
          details: error.errors 
        });
      }
      console.error("Failed to create subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Get user subscription
  app.get("/api/bot/subscription/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const subscription = await storage.getUserBotSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Save user bot configuration
  app.post("/api/bot/config", async (req, res) => {
    try {
      const configSchema = z.object({
        userId: z.string(),
        subscriptionId: z.string(),
        coinbaseApiKey: z.string().optional(),
        coinbaseApiSecret: z.string().optional(),
        coinbasePassphrase: z.string().optional(),
        maxPositionSize: z.string().default('1000'),
        maxDailyLoss: z.string().default('100'),
        stopLossPercent: z.string().default('5'),
        takeProfitPercent: z.string().default('10'),
        enableNotifications: z.string().default('true'),
        notificationEmail: z.string().email().optional()
      });

      const data = configSchema.parse(req.body);
      const config = await storage.saveBotUserConfig(data);

      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid configuration data", 
          details: error.errors 
        });
      }
      console.error("Failed to save bot configuration:", error);
      res.status(500).json({ error: "Failed to save bot configuration" });
    }
  });

  // Get user bot configuration
  app.get("/api/bot/config/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const config = await storage.getUserBotConfig(userId);
      
      if (!config) {
        return res.status(404).json({ error: "No configuration found" });
      }

      const safeConfig = {
        ...config,
        coinbaseApiKey: config.coinbaseApiKey ? '***' : null,
        coinbaseApiSecret: config.coinbaseApiSecret ? '***' : null,
        coinbasePassphrase: config.coinbasePassphrase ? '***' : null
      };

      res.json(safeConfig);
    } catch (error) {
      console.error("Failed to fetch bot configuration:", error);
      res.status(500).json({ error: "Failed to fetch bot configuration" });
    }
  });

  // Start bot with strategy
  app.post("/api/bot/start", async (req, res) => {
    try {
      const startSchema = z.object({
        userId: z.string(),
        strategyId: z.string(),
        tradingPairs: z.array(z.string()),
        allocatedCapital: z.string()
      });

      const data = startSchema.parse(req.body);
      
      const config = await storage.getUserBotConfig(data.userId);
      if (!config) {
        return res.status(400).json({ error: "Bot configuration not found. Please configure your Coinbase API keys first." });
      }

      const subscription = await storage.getUserBotSubscription(data.userId);
      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({ error: "Active subscription required" });
      }

      const activeStrategy = await storage.createBotActiveStrategy({
        userId: data.userId,
        strategyId: data.strategyId,
        configId: config.id,
        status: 'active',
        tradingPairs: data.tradingPairs,
        allocatedCapital: data.allocatedCapital,
        currentProfit: '0',
        totalTrades: '0',
        winRate: '0'
      });

      res.status(201).json(activeStrategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid start data", 
          details: error.errors 
        });
      }
      console.error("Failed to start bot:", error);
      res.status(500).json({ error: "Failed to start bot" });
    }
  });

  // Get user active strategies
  app.get("/api/bot/active/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const strategies = await storage.getUserActiveStrategies(userId);
      res.json(strategies);
    } catch (error) {
      console.error("Failed to fetch active strategies:", error);
      res.status(500).json({ error: "Failed to fetch active strategies" });
    }
  });

  // Stop bot strategy
  app.post("/api/bot/stop/:activeStrategyId", async (req, res) => {
    try {
      const { activeStrategyId } = req.params;
      await storage.stopBotStrategy(activeStrategyId);
      res.json({ success: true, message: "Bot stopped successfully" });
    } catch (error) {
      console.error("Failed to stop bot:", error);
      res.status(500).json({ error: "Failed to stop bot" });
    }
  });

  // Get bot trades
  app.get("/api/bot/trades/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const trades = await storage.getUserBotTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      console.error("Failed to fetch bot trades:", error);
      res.status(500).json({ error: "Failed to fetch bot trades" });
    }
  });

  // Get bot performance metrics
  app.get("/api/bot/performance/:activeStrategyId", async (req, res) => {
    try {
      const { activeStrategyId } = req.params;
      const trades = await storage.getStrategyTrades(activeStrategyId);
      
      const totalTrades = trades.length;
      const winningTrades = trades.filter((t: any) => parseFloat(t.profit || '0') > 0).length;
      const losingTrades = trades.filter((t: any) => parseFloat(t.profit || '0') < 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      const totalProfit = trades.reduce((sum: number, t: any) => {
        return sum + parseFloat(t.profit || '0');
      }, 0);

      const metrics = {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: winRate.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        averageProfit: totalTrades > 0 ? (totalProfit / totalTrades).toFixed(2) : '0.00'
      };

      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch performance metrics:", error);
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  // ====================
  // House Vaults Routes
  // ====================
  
  // Get all active house vaults
  app.get("/api/vaults", async (req, res) => {
    try {
      const vaults = await storage.getAllHouseVaults();
      res.json(vaults);
    } catch (error) {
      console.error("Failed to fetch vaults:", error);
      res.status(500).json({ error: "Failed to fetch vaults" });
    }
  });
  
  // Get specific vault details
  app.get("/api/vaults/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const vault = await storage.getHouseVault(id);
      
      if (!vault) {
        return res.status(404).json({ error: "Vault not found" });
      }
      
      res.json(vault);
    } catch (error) {
      console.error("Failed to fetch vault:", error);
      res.status(500).json({ error: "Failed to fetch vault" });
    }
  });
  
  // Get user's positions in all vaults
  app.get("/api/vaults/positions/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const positions = await storage.getUserPositions(walletAddress);
      res.json(positions);
    } catch (error) {
      console.error("Failed to fetch user positions:", error);
      res.status(500).json({ error: "Failed to fetch user positions" });
    }
  });
  
  // Get positions in a specific vault
  app.get("/api/vaults/:vaultId/positions", async (req, res) => {
    try {
      const { vaultId } = req.params;
      const positions = await storage.getVaultPositions(vaultId);
      res.json(positions);
    } catch (error) {
      console.error("Failed to fetch vault positions:", error);
      res.status(500).json({ error: "Failed to fetch vault positions" });
    }
  });
  
  // Stake ETH in a vault (create position)
  app.post("/api/vaults/:vaultId/stake", async (req, res) => {
    try {
      const { vaultId } = req.params;
      const stakeSchema = z.object({
        walletAddress: ethereumAddressSchema,
        stakedAmount: z.string(),
        stakeTxHash: transactionHashSchema.optional(),
        userId: z.string().optional()
      });
      
      const data = stakeSchema.parse(req.body);
      
      // Verify vault exists
      const vault = await storage.getHouseVault(vaultId);
      if (!vault) {
        return res.status(404).json({ error: "Vault not found" });
      }
      
      // Check minimum stake requirement
      if (parseFloat(data.stakedAmount) < parseFloat(vault.minStake)) {
        return res.status(400).json({ 
          error: "Stake amount below minimum", 
          minStake: vault.minStake 
        });
      }
      
      // Calculate unlock date if there's a lock period
      const unlocksAt = vault.lockPeriod && vault.lockPeriod !== '0' 
        ? new Date(Date.now() + parseInt(vault.lockPeriod) * 24 * 60 * 60 * 1000)
        : undefined;
      
      // Simple share calculation: 1:1 for now
      const shares = data.stakedAmount;
      const entryPrice = '1';
      
      const position = await storage.createPosition({
        vaultId,
        walletAddress: data.walletAddress,
        userId: data.userId,
        stakedAmount: data.stakedAmount,
        shares,
        entryPrice,
        currentValue: data.stakedAmount,
        totalEarnings: '0',
        claimedEarnings: '0',
        pendingEarnings: '0',
        status: 'active',
        stakeTxHash: data.stakeTxHash,
        unlocksAt
      });
      
      // Update vault stats
      const newTotalStaked = (parseFloat(vault.totalStaked) + parseFloat(data.stakedAmount)).toString();
      const newActivePositions = (parseInt(vault.activePositions) + 1).toString();
      
      await storage.updateHouseVault(vaultId, {
        totalStaked: newTotalStaked,
        activePositions: newActivePositions
      });
      
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid stake data", 
          details: error.errors 
        });
      }
      console.error("Failed to create position:", error);
      res.status(500).json({ error: "Failed to create position" });
    }
  });
  
  // Unstake from vault (withdraw position)
  app.post("/api/vaults/positions/:positionId/unstake", async (req, res) => {
    try {
      const { positionId } = req.params;
      
      const unstakeSchema = z.object({
        unstakeTxHash: transactionHashSchema.optional()
      });
      
      const data = unstakeSchema.parse(req.body);
      
      const position = await storage.getPosition(positionId);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      // Check if position is locked
      if (position.unlocksAt && new Date() < new Date(position.unlocksAt)) {
        return res.status(403).json({ 
          error: "Position is locked", 
          unlocksAt: position.unlocksAt 
        });
      }
      
      // Update position status
      await storage.updatePosition(positionId, {
        status: 'withdrawn',
        withdrawnAt: new Date(),
        unstakeTxHash: data.unstakeTxHash
      });
      
      // Update vault stats
      const vault = await storage.getHouseVault(position.vaultId);
      if (vault) {
        const newTotalStaked = Math.max(0, parseFloat(vault.totalStaked) - parseFloat(position.stakedAmount)).toString();
        const newActivePositions = Math.max(0, parseInt(vault.activePositions) - 1).toString();
        
        await storage.updateHouseVault(position.vaultId, {
          totalStaked: newTotalStaked,
          activePositions: newActivePositions
        });
      }
      
      res.json({ success: true, message: "Position withdrawn successfully" });
    } catch (error) {
      console.error("Failed to unstake:", error);
      res.status(500).json({ error: "Failed to unstake" });
    }
  });
  
  // Get vault distributions (profit history)
  app.get("/api/vaults/:vaultId/distributions", async (req, res) => {
    try {
      const { vaultId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const distributions = await storage.getVaultDistributions(vaultId, limit);
      res.json(distributions);
    } catch (error) {
      console.error("Failed to fetch distributions:", error);
      res.status(500).json({ error: "Failed to fetch distributions" });
    }
  });
  
  // Get user's earnings
  app.get("/api/vaults/earnings/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const earnings = await storage.getUserEarnings(walletAddress);
      res.json(earnings);
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });
  
  // Claim earnings
  app.post("/api/vaults/earnings/:earningId/claim", async (req, res) => {
    try {
      const { earningId } = req.params;
      const claimed = await storage.claimEarning(earningId);
      
      if (!claimed) {
        return res.status(404).json({ error: "Earning not found" });
      }
      
      res.json({ success: true, earning: claimed });
    } catch (error) {
      console.error("Failed to claim earning:", error);
      res.status(500).json({ error: "Failed to claim earning" });
    }
  });
  
  // Auto-Compound Staking Routes
  
  // Get all active auto-compound pools
  app.get("/api/auto-compound/pools", async (req, res) => {
    try {
      const pools = await storage.getActiveAutoCompoundPools();
      res.json(pools);
    } catch (error) {
      console.error("Failed to fetch pools:", error);
      res.status(500).json({ error: "Failed to fetch pools" });
    }
  });
  
  // Get specific pool details
  app.get("/api/auto-compound/pools/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await storage.getAutoCompoundPool(id);
      
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      
      res.json(pool);
    } catch (error) {
      console.error("Failed to fetch pool:", error);
      res.status(500).json({ error: "Failed to fetch pool" });
    }
  });
  
  // Get user's stakes
  app.get("/api/auto-compound/stakes/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const stakes = await storage.getUserStakes(walletAddress);
      res.json(stakes);
    } catch (error) {
      console.error("Failed to fetch stakes:", error);
      res.status(500).json({ error: "Failed to fetch stakes" });
    }
  });
  
  // Create new stake
  app.post("/api/auto-compound/pools/:poolId/stake", async (req, res) => {
    try {
      const { poolId } = req.params;
      const stakeSchema = z.object({
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
        initialStake: z.string().regex(/^\d+\.?\d*$/, "Invalid stake amount"),
        userId: z.string().optional()
      });
      
      const stakeData = stakeSchema.parse(req.body);
      
      // Get pool details
      const pool = await storage.getAutoCompoundPool(poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      
      // Check min stake
      const stakeAmount = parseFloat(stakeData.initialStake);
      const minStake = parseFloat(pool.minStake);
      if (stakeAmount < minStake) {
        return res.status(400).json({ error: `Minimum stake is ${minStake} ${pool.tokenSymbol}` });
      }
      
      // Check max stake if set
      if (pool.maxStake && parseFloat(stakeData.initialStake) > parseFloat(pool.maxStake)) {
        return res.status(400).json({ error: `Maximum stake is ${pool.maxStake} ${pool.tokenSymbol}` });
      }
      
      // Calculate unlock time if there's a lock period
      let unlocksAt = null;
      const lockDays = parseFloat(pool.lockPeriod);
      if (lockDays > 0) {
        unlocksAt = new Date();
        unlocksAt.setDate(unlocksAt.getDate() + lockDays);
      }
      
      // Create stake
      const stake = await storage.createStake({
        poolId,
        walletAddress: stakeData.walletAddress,
        userId: stakeData.userId,
        initialStake: stakeData.initialStake,
        currentBalance: stakeData.initialStake,
        effectiveApy: pool.baseApy,
        unlocksAt
      });
      
      // Update pool total staked
      const currentTotal = parseFloat(pool.totalStaked || '0');
      const currentStakers = parseInt(pool.totalStakers || '0');
      await storage.updateAutoCompoundPool(poolId, {
        totalStaked: (currentTotal + stakeAmount).toString(),
        totalStakers: (currentStakers + 1).toString()
      });
      
      res.json({ success: true, stake });
    } catch (error) {
      console.error("Failed to create stake:", error);
      res.status(500).json({ error: "Failed to create stake" });
    }
  });
  
  // Withdraw stake
  app.post("/api/auto-compound/stakes/:stakeId/withdraw", async (req, res) => {
    try {
      const { stakeId } = req.params;
      const { walletAddress } = req.body;
      
      const stake = await storage.getStake(stakeId);
      if (!stake) {
        return res.status(404).json({ error: "Stake not found" });
      }
      
      // Verify ownership
      if (stake.walletAddress.toLowerCase() !== walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized: You can only withdraw your own stakes" });
      }
      
      if (stake.status !== 'active') {
        return res.status(400).json({ error: "Stake already withdrawn" });
      }
      
      const pool = await storage.getAutoCompoundPool(stake.poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      
      // Check if locked
      const now = new Date();
      let withdrawAmount = parseFloat(stake.currentBalance);
      let penalty = 0;
      
      if (stake.unlocksAt && now < stake.unlocksAt) {
        // Apply early withdrawal penalty
        penalty = withdrawAmount * (parseFloat(pool.earlyWithdrawPenalty) / 100);
        withdrawAmount -= penalty;
      }
      
      // Update stake
      const updated = await storage.updateStake(stakeId, {
        status: 'withdrawn',
        withdrawnAt: now,
        withdrawnAmount: withdrawAmount.toString()
      });
      
      // Update pool totals
      const currentTotal = parseFloat(pool.totalStaked || '0');
      const currentStakers = parseInt(pool.totalStakers || '0');
      await storage.updateAutoCompoundPool(stake.poolId, {
        totalStaked: Math.max(0, currentTotal - parseFloat(stake.currentBalance)).toString(),
        totalStakers: Math.max(0, currentStakers - 1).toString()
      });
      
      res.json({ 
        success: true, 
        stake: updated,
        withdrawAmount: withdrawAmount.toString(),
        penalty: penalty.toString()
      });
    } catch (error) {
      console.error("Failed to withdraw stake:", error);
      res.status(500).json({ error: "Failed to withdraw stake" });
    }
  });
  
  // Get compound events for a stake
  app.get("/api/auto-compound/stakes/:stakeId/events", async (req, res) => {
    try {
      const { stakeId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getStakeCompoundEvents(stakeId, limit);
      res.json(events);
    } catch (error) {
      console.error("Failed to fetch compound events:", error);
      res.status(500).json({ error: "Failed to fetch compound events" });
    }
  });
  
  // Get user's compound events
  app.get("/api/auto-compound/events/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getUserCompoundEvents(walletAddress, limit);
      res.json(events);
    } catch (error) {
      console.error("Failed to fetch compound events:", error);
      res.status(500).json({ error: "Failed to fetch compound events" });
    }
  });
  
  // ===== SOCIAL MEDIA AUTOMATION ROUTES =====
  
  // Get user's social accounts
  app.get("/api/social/accounts/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const accounts = await storage.getUserSocialAccounts(userId);
      
      // Redact sensitive credentials before sending
      const safeAccounts = accounts.map(acc => ({
        ...acc,
        apiKey: acc.apiKey ? '***' : null,
        apiSecret: acc.apiSecret ? '***' : null,
        accessToken: acc.accessToken ? '***' : null,
        accessTokenSecret: acc.accessTokenSecret ? '***' : null
      }));
      
      res.json(safeAccounts);
    } catch (error) {
      console.error("Failed to fetch social accounts:", error);
      res.status(500).json({ error: "Failed to fetch social accounts" });
    }
  });
  
  // Get active social accounts
  app.get("/api/social/accounts/:userId/active", async (req, res) => {
    try {
      const { userId } = req.params;
      const accounts = await storage.getActiveSocialAccounts(userId);
      
      const safeAccounts = accounts.map(acc => ({
        ...acc,
        apiKey: acc.apiKey ? '***' : null,
        apiSecret: acc.apiSecret ? '***' : null,
        accessToken: acc.accessToken ? '***' : null,
        accessTokenSecret: acc.accessTokenSecret ? '***' : null
      }));
      
      res.json(safeAccounts);
    } catch (error) {
      console.error("Failed to fetch active social accounts:", error);
      res.status(500).json({ error: "Failed to fetch active social accounts" });
    }
  });
  
  // Create social account
  app.post("/api/social/accounts", async (req, res) => {
    try {
      const accountSchema = z.object({
        userId: z.string().optional(),
        platform: z.string(),
        accountName: z.string(),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        accessToken: z.string().optional(),
        accessTokenSecret: z.string().optional(),
        isActive: z.string().optional()
      });
      
      const accountData = accountSchema.parse(req.body);
      const account = await storage.createSocialAccount(accountData);
      
      // Redact credentials
      const safeAccount = {
        ...account,
        apiKey: account.apiKey ? '***' : null,
        apiSecret: account.apiSecret ? '***' : null,
        accessToken: account.accessToken ? '***' : null,
        accessTokenSecret: account.accessTokenSecret ? '***' : null
      };
      
      res.json(safeAccount);
    } catch (error) {
      console.error("Failed to create social account:", error);
      res.status(500).json({ error: "Failed to create social account" });
    }
  });
  
  // Update social account
  app.patch("/api/social/accounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const account = await storage.updateSocialAccount(id, updates);
      
      if (!account) {
        return res.status(404).json({ error: "Social account not found" });
      }
      
      const safeAccount = {
        ...account,
        apiKey: account.apiKey ? '***' : null,
        apiSecret: account.apiSecret ? '***' : null,
        accessToken: account.accessToken ? '***' : null,
        accessTokenSecret: account.accessTokenSecret ? '***' : null
      };
      
      res.json(safeAccount);
    } catch (error) {
      console.error("Failed to update social account:", error);
      res.status(500).json({ error: "Failed to update social account" });
    }
  });
  
  // Delete social account
  app.delete("/api/social/accounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSocialAccount(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete social account:", error);
      res.status(500).json({ error: "Failed to delete social account" });
    }
  });
  
  // Get user's scheduled posts
  app.get("/api/social/posts/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const posts = await storage.getUserScheduledPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Failed to fetch scheduled posts:", error);
      res.status(500).json({ error: "Failed to fetch scheduled posts" });
    }
  });
  
  // Get pending posts
  app.get("/api/social/posts/pending/all", async (req, res) => {
    try {
      const posts = await storage.getPendingPosts();
      res.json(posts);
    } catch (error) {
      console.error("Failed to fetch pending posts:", error);
      res.status(500).json({ error: "Failed to fetch pending posts" });
    }
  });
  
  // Create scheduled post
  app.post("/api/social/posts", async (req, res) => {
    try {
      const postSchema = z.object({
        userId: z.string().optional(),
        accountId: z.string(),
        content: z.string(),
        mediaUrls: z.array(z.string()).optional(),
        scheduledFor: z.string().transform(str => new Date(str)),
        status: z.string().optional(),
        postType: z.string().optional()
      });
      
      const postData = postSchema.parse(req.body);
      const post = await storage.createScheduledPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Failed to create scheduled post:", error);
      res.status(500).json({ error: "Failed to create scheduled post" });
    }
  });
  
  // Update scheduled post
  app.patch("/api/social/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const post = await storage.updateScheduledPost(id, updates);
      
      if (!post) {
        return res.status(404).json({ error: "Scheduled post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Failed to update scheduled post:", error);
      res.status(500).json({ error: "Failed to update scheduled post" });
    }
  });
  
  // Delete scheduled post
  app.delete("/api/social/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteScheduledPost(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete scheduled post:", error);
      res.status(500).json({ error: "Failed to delete scheduled post" });
    }
  });
  
  // Get user's post history
  app.get("/api/social/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getUserPostHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch post history:", error);
      res.status(500).json({ error: "Failed to fetch post history" });
    }
  });
  
  // Get account's post history
  app.get("/api/social/history/account/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getAccountPostHistory(accountId, limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch account post history:", error);
      res.status(500).json({ error: "Failed to fetch account post history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
