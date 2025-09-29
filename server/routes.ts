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

  const httpServer = createServer(app);
  return httpServer;
}
