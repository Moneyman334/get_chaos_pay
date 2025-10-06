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
import { socialScheduler } from "./social-scheduler";
import { db as dbClient } from "./storage";
import { getCryptoPrice, getAllPrices, convertCryptoToUsd, convertUsdToCrypto } from "./price-service";
import { 
  users, 
  transactions, 
  orders, 
  autoCompoundStakes, 
  botTrades, 
  scheduledPosts, 
  postHistory,
  marketplaceListings,
  discountCodes,
  flashSales
} from "@shared/schema";
import { eq, and, sql, desc, lte, gte, or, isNull } from "drizzle-orm";
import { SecurityFortress } from "./security-fortress";

// Ethereum address validation schema
const ethereumAddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
  .transform(addr => addr.toLowerCase()); // Normalize to lowercase

// Hash validation (64 hex characters)
const transactionHashSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format");

// Middleware to check if user is an owner
const requireOwner = async (req: any, res: any, next: any) => {
  try {
    // Get user ID from session only (not from headers - security critical)
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.isOwner !== "true") {
      return res.status(403).json({ error: "Access denied. Owner privileges required." });
    }

    // Attach user to request for future use
    req.user = user;
    next();
  } catch (error) {
    console.error("Owner check failed:", error);
    res.status(500).json({ error: "Authentication check failed" });
  }
};

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
      services: ["transactions", "wallets", "tokens", "networks", "authentication", "prices"],
      database: "connected",
      timestamp: new Date().toISOString()
    });
  });

  // Get real-time crypto prices
  app.get("/api/prices", (req, res) => {
    try {
      const prices = getAllPrices();
      res.json(prices);
    } catch (error) {
      console.error("Failed to fetch prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  // Get specific crypto price
  app.get("/api/prices/:symbol", (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const price = getCryptoPrice(symbol);
      
      if (!price) {
        return res.status(404).json({ error: `Price not available for ${symbol}` });
      }
      
      res.json({ symbol, ...price });
    } catch (error) {
      console.error("Failed to fetch price:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  // Convert USD to crypto
  app.post("/api/prices/convert", (req, res) => {
    try {
      const { amount, from, to } = req.body;
      
      if (from === 'USD') {
        const cryptoAmount = convertUsdToCrypto(amount, to);
        res.json({ amount: cryptoAmount, currency: to });
      } else if (to === 'USD') {
        const usdAmount = convertCryptoToUsd(amount, from);
        res.json({ amount: usdAmount.toString(), currency: 'USD' });
      } else {
        res.status(400).json({ error: "Only USD conversions supported" });
      }
    } catch (error) {
      console.error("Failed to convert:", error);
      res.status(500).json({ error: "Conversion failed" });
    }
  });

  // Enhanced rate limiting with security fortress
  const authRateLimit = SecurityFortress.createRateLimiter('STRICT', 'Too many authentication attempts');
  const authSpeedLimit = SecurityFortress.createSpeedLimiter('STRICT');
  const tradingRateLimit = SecurityFortress.createRateLimiter('TRADING', 'Trading rate limit exceeded');
  const tradingSpeedLimit = SecurityFortress.createSpeedLimiter('TRADING');
  const paymentRateLimit = SecurityFortress.createRateLimiter('PAYMENT', 'Payment rate limit exceeded');
  const paymentSpeedLimit = SecurityFortress.createSpeedLimiter('PAYMENT');
  const generalApiLimit = SecurityFortress.createRateLimiter('MODERATE');
  const publicDataLimit = SecurityFortress.createRateLimiter('RELAXED');

  // ===== AUTHENTICATION ROUTES =====

  // User registration with secure password hashing
  app.post("/api/auth/register", authRateLimit, authSpeedLimit, async (req, res) => {
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
  app.post("/api/auth/login", authRateLimit, authSpeedLimit, async (req, res) => {
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

  // Get current authenticated user status
  app.get("/api/auth/me", async (req, res) => {
    try {
      // Get user ID from session only (not from headers - security critical)
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.json({ authenticated: false, isOwner: false });
      }

      const user = await storage.getUser(userId as string);
      
      if (!user) {
        return res.json({ authenticated: false, isOwner: false });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        authenticated: true,
        isOwner: user.isOwner === "true",
        user: userWithoutPassword
      });

    } catch (error) {
      console.error("Failed to get auth status:", error);
      res.status(500).json({ error: "Failed to get authentication status" });
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

  // Store a new transaction with fraud detection
  app.post("/api/transactions", generalApiLimit, async (req, res) => {
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
      
      // Fraud detection analysis
      const riskAnalysis = SecurityFortress.analyzeTransactionRisk({
        fromAddress: validatedData.fromAddress,
        toAddress: validatedData.toAddress,
        amount: validatedData.amount,
        gasPrice: validatedData.gasPrice
      });
      
      // Log risk analysis for monitoring
      if (riskAnalysis.score > 0) {
        console.warn('Transaction Risk Analysis:', {
          hash: validatedData.hash,
          score: riskAnalysis.score,
          flags: riskAnalysis.flags,
          recommendation: riskAnalysis.recommendation
        });
      }
      
      // Reject high-risk transactions
      if (riskAnalysis.recommendation === 'reject') {
        return res.status(403).json({ 
          error: "Transaction rejected due to security concerns",
          riskScore: riskAnalysis.score,
          flags: riskAnalysis.flags
        });
      }
      
      // Flag medium-risk transactions in metadata
      if (riskAnalysis.recommendation === 'review') {
        validatedData.metadata = {
          ...validatedData.metadata,
          riskAnalysis,
          requiresReview: true
        };
      }
      
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
    delayMs: () => 500, // Add 500ms delay per request after limit
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
  app.post("/api/payments/create", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
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
  
  // Cart Routes
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const cart = await storage.getCartBySession(sessionId);
      res.json(cart || { items: [], total: 0 });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/add", async (req, res) => {
    try {
      const itemSchema = z.object({
        productId: z.string(),
        quantity: z.number().int().positive().default(1)
      });
      const itemData = itemSchema.parse(req.body);
      const sessionId = req.sessionID;
      
      const cartItem = await storage.addToCart(sessionId, itemData.productId, itemData.quantity);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid cart item data", details: error.errors });
      }
      console.error("Failed to add to cart:", error);
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:itemId", async (req, res) => {
    try {
      const quantitySchema = z.object({
        quantity: z.number().int().positive()
      });
      const { quantity } = quantitySchema.parse(req.body);
      const sessionId = req.sessionID;
      
      const updated = await storage.updateCartItem(sessionId, req.params.itemId, quantity);
      if (!updated) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quantity", details: error.errors });
      }
      console.error("Failed to update cart item:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:itemId", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const success = await storage.removeFromCart(sessionId, req.params.itemId);
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart/clear", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      await storage.clearCart(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to clear cart:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });
  
  // Order Routes
  app.post("/api/orders/create", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
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
        // Use real-time ETH price from CoinGecko
        const ethPrice = getCryptoPrice('ETH');
        if (!ethPrice) {
          return res.status(500).json({ error: "Unable to fetch ETH price" });
        }
        
        const ETH_USD_RATE = ethPrice.usd;
        fxRateLocked = ETH_USD_RATE.toString();
        expectedCryptoAmount = convertUsdToCrypto(parseFloat(orderData.totalAmount), 'ETH');
        expectedChainId = orderData.chainId.toString();
        
        console.log(`📊 Order expected payment: ${expectedCryptoAmount} ETH on chain ${expectedChainId} (rate: $${ETH_USD_RATE.toFixed(2)})`);
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
  app.post("/api/payments/metamask", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
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
  
  app.post("/api/payments/nowpayments", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
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
  
  app.post("/api/payments/:id/confirm", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
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
  app.post("/api/bot/subscribe", paymentRateLimit, paymentSpeedLimit, async (req, res) => {
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

  // Start bot with strategy (advanced bot system)
  app.post("/api/bot-advanced/start", tradingRateLimit, tradingSpeedLimit, async (req, res) => {
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

  // Stop bot strategy (advanced bot system)
  app.post("/api/bot-advanced/stop/:activeStrategyId", tradingRateLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { activeStrategyId } = req.params;
      await storage.stopBotStrategy(activeStrategyId);
      res.json({ success: true, message: "Bot stopped successfully" });
    } catch (error) {
      console.error("Failed to stop bot:", error);
      res.status(500).json({ error: "Failed to stop bot" });
    }
  });

  // Get bot trades (advanced bot system)
  app.get("/api/bot-advanced/trades/:userId", async (req, res) => {
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
  
  // Auto-connect Twitter using environment secrets
  app.post("/api/social/accounts/auto-connect-twitter", async (req, res) => {
    try {
      const { userId, accountName } = req.body;
      
      if (!userId || !accountName) {
        return res.status(400).json({ error: "userId and accountName are required" });
      }
      
      // Get Twitter credentials from environment
      const apiKey = process.env.TWITTER_API_KEY;
      const apiSecret = process.env.TWITTER_API_SECRET;
      const accessToken = process.env.TWITTER_ACCESS_TOKEN;
      const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
      
      if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
        return res.status(400).json({ 
          error: "Missing Twitter credentials in Replit Secrets. Please add: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET" 
        });
      }
      
      const account = await storage.createSocialAccount({
        userId,
        platform: "twitter",
        accountName,
        apiKey,
        apiSecret,
        accessToken,
        accessTokenSecret,
        isActive: "true"
      });
      
      // Start auto-posting cycle (first post in 3 hours)
      console.log('🚀 Starting auto-posting for Twitter account:', accountName);
      await socialScheduler.createAutoScheduledPost(account.id, userId);
      
      // Redact credentials
      const safeAccount = {
        ...account,
        apiKey: '***',
        apiSecret: '***',
        accessToken: '***',
        accessTokenSecret: '***'
      };
      
      res.json(safeAccount);
    } catch (error) {
      console.error("Failed to auto-connect Twitter:", error);
      res.status(500).json({ error: "Failed to auto-connect Twitter account" });
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

  // ==================== MASTERPIECE FEATURES ====================
  
  // Import price service and create db connection for new features
  const { getCryptoPrice, convertUsdToCrypto, getAllPrices, formatCryptoAmount } = await import("./price-service");
  const { drizzle: drizzleORM } = await import("drizzle-orm/neon-http");
  const { neon: neonClient } = await import("@neondatabase/serverless");
  const { 
    supportedCurrencies, discountCodes, giftCards, giftCardUsage,
    loyaltyAccounts, loyaltyTransactions, productReviews, wishlists,
    invoices, nftReceipts, refunds
  } = await import("@shared/schema");
  
  const sqlClient = neonClient(process.env.DATABASE_URL!);
  const dbClient = drizzleORM(sqlClient);
  
  // Get supported currencies
  app.get("/api/currencies", async (req, res) => {
    try {
      const { chainId, isActive } = req.query;
      
      let query = dbClient.select().from(supportedCurrencies);
      const conditions = [];
      
      if (chainId) {
        conditions.push(eq(supportedCurrencies.chainId, chainId as string));
      }
      if (isActive !== undefined) {
        conditions.push(eq(supportedCurrencies.isActive, isActive as string));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const currencies = await query;
      res.json(currencies);
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      res.status(500).json({ error: "Failed to fetch currencies" });
    }
  });
  
  // Get crypto prices
  app.get("/api/prices", async (req, res) => {
    try {
      const prices = getAllPrices();
      res.json(prices);
    } catch (error) {
      console.error("Failed to fetch prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });
  
  // Get single crypto price
  app.get("/api/prices/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const price = getCryptoPrice(symbol);
      
      if (!price) {
        return res.status(404).json({ error: "Price not found" });
      }
      
      res.json(price);
    } catch (error) {
      console.error("Failed to fetch price:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });
  
  // Convert USD to crypto
  app.post("/api/prices/convert", async (req, res) => {
    try {
      const schema = z.object({
        amount: z.number(),
        from: z.string(), // USD
        to: z.string(), // crypto symbol
      });
      
      const { amount, from, to } = schema.parse(req.body);
      
      if (from !== "USD") {
        return res.status(400).json({ error: "Only USD conversion supported" });
      }
      
      const cryptoAmount = convertUsdToCrypto(amount, to);
      const formatted = formatCryptoAmount(cryptoAmount, to);
      
      res.json({ 
        amount: cryptoAmount,
        formatted,
        symbol: to,
        usdAmount: amount
      });
    } catch (error) {
      console.error("Conversion failed:", error);
      res.status(400).json({ error: "Conversion failed" });
    }
  });
  
  // Get discount codes (OWNER ONLY)
  app.get("/api/discounts", requireOwner, async (req, res) => {
    try {
      const codes = await dbClient.select().from(discountCodes)
        .where(eq(discountCodes.isActive, "true"));
      res.json(codes);
    } catch (error) {
      console.error("Failed to fetch discount codes:", error);
      res.status(500).json({ error: "Failed to fetch discount codes" });
    }
  });
  
  // Validate discount code
  app.post("/api/discounts/validate", async (req, res) => {
    try {
      const schema = z.object({
        code: z.string(),
        cartTotal: z.number(),
      });
      
      const { code, cartTotal } = schema.parse(req.body);
      
      const discount = await dbClient.select().from(discountCodes)
        .where(and(
          eq(discountCodes.code, code),
          eq(discountCodes.isActive, "true")
        ))
        .limit(1);
      
      if (discount.length === 0) {
        return res.status(404).json({ error: "Discount code not found or inactive" });
      }
      
      const discountData = discount[0];
      
      // Check validity period
      const now = new Date();
      if (discountData.validUntil && new Date(discountData.validUntil) < now) {
        return res.status(400).json({ error: "Discount code has expired" });
      }
      
      // Check minimum purchase
      if (discountData.minPurchase && parseFloat(discountData.minPurchase) > cartTotal) {
        return res.status(400).json({ 
          error: `Minimum purchase of $${discountData.minPurchase} required` 
        });
      }
      
      // Check usage limit
      if (discountData.usageLimit && parseInt(discountData.usageCount) >= parseInt(discountData.usageLimit)) {
        return res.status(400).json({ error: "Discount code usage limit reached" });
      }
      
      // Calculate discount amount
      let discountAmount = 0;
      if (discountData.type === "percentage") {
        discountAmount = (cartTotal * parseFloat(discountData.value)) / 100;
        if (discountData.maxDiscount) {
          discountAmount = Math.min(discountAmount, parseFloat(discountData.maxDiscount));
        }
      } else {
        discountAmount = parseFloat(discountData.value);
      }
      
      res.json({
        valid: true,
        discount: discountData,
        discountAmount,
        finalTotal: Math.max(0, cartTotal - discountAmount)
      });
    } catch (error) {
      console.error("Discount validation failed:", error);
      res.status(400).json({ error: "Discount validation failed" });
    }
  });
  
  // Create discount code (OWNER ONLY)
  app.post("/api/discounts", requireOwner, async (req, res) => {
    try {
      const schema = z.object({
        code: z.string().min(3),
        type: z.enum(["percentage", "fixed"]),
        value: z.string(),
        minPurchase: z.string().optional(),
        maxDiscount: z.string().optional(),
        usageLimit: z.string().optional(),
        validUntil: z.string().optional(),
        applicableProducts: z.array(z.string()).optional(),
      });
      
      const data = schema.parse(req.body);
      
      const newDiscount = await dbClient.insert(discountCodes).values(data).returning();
      res.json(newDiscount[0]);
    } catch (error) {
      console.error("Failed to create discount code:", error);
      res.status(500).json({ error: "Failed to create discount code" });
    }
  });
  
  // Get gift card by code
  app.get("/api/giftcards/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      const card = await dbClient.select().from(giftCards)
        .where(eq(giftCards.code, code))
        .limit(1);
      
      if (card.length === 0) {
        return res.status(404).json({ error: "Gift card not found" });
      }
      
      res.json(card[0]);
    } catch (error) {
      console.error("Failed to fetch gift card:", error);
      res.status(500).json({ error: "Failed to fetch gift card" });
    }
  });
  
  // Create gift card
  app.post("/api/giftcards", async (req, res) => {
    try {
      const schema = z.object({
        initialValue: z.string(),
        currency: z.string().default("USD"),
        purchasedBy: z.string().optional(),
        purchaseTxHash: z.string().optional(),
        recipientEmail: z.string().optional(),
        recipientWallet: z.string().optional(),
        message: z.string().optional(),
        expiresAt: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Generate unique code
      const code = `GC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      const card = await dbClient.insert(giftCards).values({
        ...data,
        code,
        currentBalance: data.initialValue,
      }).returning();
      
      res.json(card[0]);
    } catch (error) {
      console.error("Failed to create gift card:", error);
      res.status(500).json({ error: "Failed to create gift card" });
    }
  });
  
  // Redeem gift card
  app.post("/api/giftcards/:code/redeem", async (req, res) => {
    try {
      const { code } = req.params;
      const schema = z.object({
        orderId: z.string(),
        amountUsed: z.string(),
      });
      
      const { orderId, amountUsed } = schema.parse(req.body);
      
      // Get gift card
      const card = await dbClient.select().from(giftCards)
        .where(eq(giftCards.code, code))
        .limit(1);
      
      if (card.length === 0) {
        return res.status(404).json({ error: "Gift card not found" });
      }
      
      const giftCard = card[0];
      
      if (giftCard.status !== "active") {
        return res.status(400).json({ error: "Gift card is not active" });
      }
      
      const currentBalance = parseFloat(giftCard.currentBalance);
      const amountToUse = parseFloat(amountUsed);
      
      if (amountToUse > currentBalance) {
        return res.status(400).json({ error: "Insufficient gift card balance" });
      }
      
      const newBalance = currentBalance - amountToUse;
      
      // Update gift card balance
      await dbClient.update(giftCards)
        .set({ 
          currentBalance: newBalance.toString(),
          status: newBalance === 0 ? "redeemed" : "active",
          redeemedAt: newBalance === 0 ? new Date() : undefined,
        })
        .where(eq(giftCards.id, giftCard.id));
      
      // Record usage
      await dbClient.insert(giftCardUsage).values({
        giftCardId: giftCard.id,
        orderId,
        amountUsed,
        balanceAfter: newBalance.toString(),
      });
      
      res.json({
        success: true,
        balanceRemaining: newBalance.toString(),
        amountUsed,
      });
    } catch (error) {
      console.error("Failed to redeem gift card:", error);
      res.status(500).json({ error: "Failed to redeem gift card" });
    }
  });
  
  // Get loyalty account
  app.get("/api/loyalty/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const account = await dbClient.select().from(loyaltyAccounts)
        .where(sql`lower(${loyaltyAccounts.walletAddress}) = lower(${walletAddress})`)
        .limit(1);
      
      if (account.length === 0) {
        // Create new account
        const newAccount = await dbClient.insert(loyaltyAccounts).values({
          walletAddress: walletAddress.toLowerCase(),
        }).returning();
        return res.json(newAccount[0]);
      }
      
      res.json(account[0]);
    } catch (error) {
      console.error("Failed to fetch loyalty account:", error);
      res.status(500).json({ error: "Failed to fetch loyalty account" });
    }
  });
  
  // Get loyalty transactions
  app.get("/api/loyalty/:walletAddress/transactions", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      // Get account
      const account = await dbClient.select().from(loyaltyAccounts)
        .where(sql`lower(${loyaltyAccounts.walletAddress}) = lower(${walletAddress})`)
        .limit(1);
      
      if (account.length === 0) {
        return res.json([]);
      }
      
      const transactions = await dbClient.select().from(loyaltyTransactions)
        .where(eq(loyaltyTransactions.accountId, account[0].id))
        .orderBy(desc(loyaltyTransactions.createdAt))
        .limit(100);
      
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch loyalty transactions:", error);
      res.status(500).json({ error: "Failed to fetch loyalty transactions" });
    }
  });
  
  // Award loyalty points
  app.post("/api/loyalty/award", async (req, res) => {
    try {
      const schema = z.object({
        walletAddress: z.string(),
        points: z.string(),
        orderId: z.string().optional(),
        description: z.string(),
      });
      
      const { walletAddress, points, orderId, description } = schema.parse(req.body);
      
      // Get or create account
      let account = await dbClient.select().from(loyaltyAccounts)
        .where(sql`lower(${loyaltyAccounts.walletAddress}) = lower(${walletAddress})`)
        .limit(1);
      
      if (account.length === 0) {
        const newAccount = await dbClient.insert(loyaltyAccounts).values({
          walletAddress: walletAddress.toLowerCase(),
        }).returning();
        account = newAccount;
      }
      
      const accountData = account[0];
      const currentPoints = parseInt(accountData.availablePoints);
      const newPoints = currentPoints + parseInt(points);
      
      // Update account
      await dbClient.update(loyaltyAccounts)
        .set({
          totalPoints: (parseInt(accountData.totalPoints) + parseInt(points)).toString(),
          availablePoints: newPoints.toString(),
          lifetimePoints: (parseInt(accountData.lifetimePoints) + parseInt(points)).toString(),
        })
        .where(eq(loyaltyAccounts.id, accountData.id));
      
      // Record transaction
      const transaction = await dbClient.insert(loyaltyTransactions).values({
        accountId: accountData.id,
        type: "earned",
        points,
        balanceAfter: newPoints.toString(),
        orderId,
        description,
      }).returning();
      
      res.json(transaction[0]);
    } catch (error) {
      console.error("Failed to award loyalty points:", error);
      res.status(500).json({ error: "Failed to award loyalty points" });
    }
  });
  
  // Redeem loyalty points
  app.post("/api/loyalty/redeem", async (req, res) => {
    try {
      const schema = z.object({
        walletAddress: z.string(),
        points: z.string(),
        orderId: z.string().optional(),
        description: z.string(),
      });
      
      const { walletAddress, points, orderId, description } = schema.parse(req.body);
      
      // Get account
      const account = await dbClient.select().from(loyaltyAccounts)
        .where(sql`lower(${loyaltyAccounts.walletAddress}) = lower(${walletAddress})`)
        .limit(1);
      
      if (account.length === 0) {
        return res.status(404).json({ error: "Loyalty account not found" });
      }
      
      const accountData = account[0];
      const currentPoints = parseInt(accountData.availablePoints);
      const pointsToRedeem = parseInt(points);
      
      if (pointsToRedeem > currentPoints) {
        return res.status(400).json({ error: "Insufficient loyalty points" });
      }
      
      const newPoints = currentPoints - pointsToRedeem;
      
      // Update account
      await dbClient.update(loyaltyAccounts)
        .set({ availablePoints: newPoints.toString() })
        .where(eq(loyaltyAccounts.id, accountData.id));
      
      // Record transaction
      const transaction = await dbClient.insert(loyaltyTransactions).values({
        accountId: accountData.id,
        type: "redeemed",
        points: `-${points}`,
        balanceAfter: newPoints.toString(),
        orderId,
        description,
      }).returning();
      
      res.json(transaction[0]);
    } catch (error) {
      console.error("Failed to redeem loyalty points:", error);
      res.status(500).json({ error: "Failed to redeem loyalty points" });
    }
  });
  
  // Get product reviews
  app.get("/api/reviews/product/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      
      const reviews = await dbClient.select().from(productReviews)
        .where(and(
          eq(productReviews.productId, productId),
          eq(productReviews.isApproved, "true")
        ))
        .orderBy(desc(productReviews.createdAt));
      
      res.json(reviews);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  
  // Create product review
  app.post("/api/reviews", async (req, res) => {
    try {
      const schema = z.object({
        productId: z.string(),
        orderId: z.string(),
        walletAddress: z.string(),
        rating: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        purchaseTxHash: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Check if user already reviewed this product
      const existing = await dbClient.select().from(productReviews)
        .where(and(
          eq(productReviews.productId, data.productId),
          sql`lower(${productReviews.walletAddress}) = lower(${data.walletAddress})`
        ))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "You have already reviewed this product" });
      }
      
      const review = await dbClient.insert(productReviews).values(data).returning();
      res.json(review[0]);
    } catch (error) {
      console.error("Failed to create review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });
  
  // Get wishlist
  app.get("/api/wishlist/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const items = await dbClient.select().from(wishlists)
        .where(sql`lower(${wishlists.walletAddress}) = lower(${walletAddress})`)
        .orderBy(desc(wishlists.addedAt));
      
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });
  
  // Add to wishlist
  app.post("/api/wishlist", async (req, res) => {
    try {
      const schema = z.object({
        walletAddress: z.string(),
        productId: z.string(),
      });
      
      const { walletAddress, productId } = schema.parse(req.body);
      
      // Check if already in wishlist
      const existing = await dbClient.select().from(wishlists)
        .where(and(
          sql`lower(${wishlists.walletAddress}) = lower(${walletAddress})`,
          eq(wishlists.productId, productId)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Product already in wishlist" });
      }
      
      const item = await dbClient.insert(wishlists).values({
        walletAddress: walletAddress.toLowerCase(),
        productId,
      }).returning();
      
      res.json(item[0]);
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });
  
  // Remove from wishlist
  app.delete("/api/wishlist/:walletAddress/:productId", async (req, res) => {
    try {
      const { walletAddress, productId } = req.params;
      
      await dbClient.delete(wishlists)
        .where(and(
          sql`lower(${wishlists.walletAddress}) = lower(${walletAddress})`,
          eq(wishlists.productId, productId)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });
  
  // Create invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      const schema = z.object({
        merchantWallet: z.string(),
        customerEmail: z.string().optional(),
        customerWallet: z.string().optional(),
        items: z.any(),
        subtotal: z.string(),
        tax: z.string().optional(),
        total: z.string(),
        currency: z.string().default("USD"),
        acceptedCurrencies: z.array(z.string()).optional(),
        dueDate: z.string().optional(),
        notes: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      const invoice = await dbClient.insert(invoices).values({
        ...data,
        invoiceNumber,
      }).returning();
      
      res.json(invoice[0]);
    } catch (error) {
      console.error("Failed to create invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });
  
  // Get invoice by number
  app.get("/api/invoices/:invoiceNumber", async (req, res) => {
    try {
      const { invoiceNumber } = req.params;
      
      const invoice = await dbClient.select().from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);
      
      if (invoice.length === 0) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      res.json(invoice[0]);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });
  
  // Get invoices for merchant
  app.get("/api/invoices/merchant/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const merchantInvoices = await dbClient.select().from(invoices)
        .where(sql`lower(${invoices.merchantWallet}) = lower(${walletAddress})`)
        .orderBy(desc(invoices.createdAt));
      
      res.json(merchantInvoices);
    } catch (error) {
      console.error("Failed to fetch merchant invoices:", error);
      res.status(500).json({ error: "Failed to fetch merchant invoices" });
    }
  });
  
  // Create NFT receipt
  app.post("/api/receipts", async (req, res) => {
    try {
      const schema = z.object({
        orderId: z.string(),
        walletAddress: z.string(),
        chainId: z.string(),
        contractAddress: z.string(),
        tokenId: z.string(),
        tokenUri: z.string().optional(),
        mintTxHash: z.string(),
        receiptData: z.any(),
      });
      
      const data = schema.parse(req.body);
      
      const receipt = await dbClient.insert(nftReceipts).values(data).returning();
      res.json(receipt[0]);
    } catch (error) {
      console.error("Failed to create NFT receipt:", error);
      res.status(500).json({ error: "Failed to create NFT receipt" });
    }
  });
  
  // Get NFT receipts for wallet
  app.get("/api/receipts/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const receipts = await dbClient.select().from(nftReceipts)
        .where(sql`lower(${nftReceipts.walletAddress}) = lower(${walletAddress})`)
        .orderBy(desc(nftReceipts.createdAt));
      
      res.json(receipts);
    } catch (error) {
      console.error("Failed to fetch NFT receipts:", error);
      res.status(500).json({ error: "Failed to fetch NFT receipts" });
    }
  });
  
  // Create refund
  app.post("/api/refunds", async (req, res) => {
    try {
      const schema = z.object({
        orderId: z.string(),
        paymentId: z.string(),
        amount: z.string(),
        currency: z.string(),
        reason: z.string().optional(),
        refundedTo: z.string(),
        processedBy: z.string().optional(),
        notes: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      
      const refund = await dbClient.insert(refunds).values(data).returning();
      res.json(refund[0]);
    } catch (error) {
      console.error("Failed to create refund:", error);
      res.status(500).json({ error: "Failed to create refund" });
    }
  });
  
  // Get refunds for order
  app.get("/api/refunds/order/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const orderRefunds = await dbClient.select().from(refunds)
        .where(eq(refunds.orderId, orderId));
      
      res.json(orderRefunds);
    } catch (error) {
      console.error("Failed to fetch refunds:", error);
      res.status(500).json({ error: "Failed to fetch refunds" });
    }
  });

  // ==================== SUBSCRIPTION SYSTEM ====================
  
  // Get all subscription plans
  app.get("/api/subscriptions/plans", async (req, res) => {
    try {
      const plans = await dbClient.select().from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, "true"));
      res.json(plans);
    } catch (error) {
      console.error("Failed to fetch subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // Create subscription plan
  app.post("/api/subscriptions/plans", async (req, res) => {
    try {
      const schema = insertSubscriptionPlanSchema;
      const data = schema.parse(req.body);
      
      const plan = await dbClient.insert(subscriptionPlans).values(data).returning();
      res.json(plan[0]);
    } catch (error) {
      console.error("Failed to create subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  // Subscribe to a plan
  app.post("/api/subscriptions", async (req, res) => {
    try {
      const schema = insertSubscriptionSchema;
      const data = schema.parse(req.body);
      
      const subscription = await dbClient.insert(subscriptions).values(data).returning();
      res.json(subscription[0]);
    } catch (error) {
      console.error("Failed to create subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Get user subscriptions
  app.get("/api/subscriptions/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const userSubscriptions = await dbClient.select().from(subscriptions)
        .where(eq(sql`lower(${subscriptions.customerWallet})`, walletAddress.toLowerCase()));
      res.json(userSubscriptions);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Cancel subscription
  app.post("/api/subscriptions/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      const [subscription] = await dbClient.update(subscriptions)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(subscriptions.id, id))
        .returning();
      res.json(subscription);
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Get subscription billing history
  app.get("/api/subscriptions/:id/billings", async (req, res) => {
    try {
      const { id } = req.params;
      const billings = await dbClient.select().from(subscriptionBillings)
        .where(eq(subscriptionBillings.subscriptionId, id))
        .orderBy(desc(subscriptionBillings.billingDate));
      res.json(billings);
    } catch (error) {
      console.error("Failed to fetch billing history:", error);
      res.status(500).json({ error: "Failed to fetch billing history" });
    }
  });

  // ==================== AFFILIATE SYSTEM ====================
  
  // Register as affiliate
  app.post("/api/affiliates", async (req, res) => {
    try {
      const schema = insertAffiliateSchema;
      const data = schema.parse(req.body);
      
      // Generate unique referral code
      const referralCode = `REF${Date.now().toString(36).toUpperCase()}`;
      const affiliate = await dbClient.insert(affiliates).values({
        ...data,
        referralCode,
      }).returning();
      
      res.json(affiliate[0]);
    } catch (error) {
      console.error("Failed to register affiliate:", error);
      res.status(500).json({ error: "Failed to register affiliate" });
    }
  });

  // Get affiliate by wallet
  app.get("/api/affiliates/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const [affiliate] = await dbClient.select().from(affiliates)
        .where(eq(sql`lower(${affiliates.walletAddress})`, walletAddress.toLowerCase()));
      res.json(affiliate || null);
    } catch (error) {
      console.error("Failed to fetch affiliate:", error);
      res.status(500).json({ error: "Failed to fetch affiliate" });
    }
  });

  // Get affiliate by referral code
  app.get("/api/affiliates/code/:referralCode", async (req, res) => {
    try {
      const { referralCode } = req.params;
      const [affiliate] = await dbClient.select().from(affiliates)
        .where(eq(affiliates.referralCode, referralCode.toUpperCase()));
      res.json(affiliate || null);
    } catch (error) {
      console.error("Failed to fetch affiliate:", error);
      res.status(500).json({ error: "Failed to fetch affiliate" });
    }
  });

  // Track affiliate referral
  app.post("/api/affiliates/referrals", async (req, res) => {
    try {
      const schema = insertAffiliateReferralSchema;
      const data = schema.parse(req.body);
      
      const referral = await dbClient.insert(affiliateReferrals).values(data).returning();
      
      // Update affiliate totals
      await dbClient.update(affiliates)
        .set({
          totalReferrals: sql`${affiliates.totalReferrals}::int + 1`,
          pendingEarnings: sql`${affiliates.pendingEarnings}::numeric + ${data.commissionAmount}`,
        })
        .where(eq(affiliates.id, data.affiliateId));
      
      res.json(referral[0]);
    } catch (error) {
      console.error("Failed to track referral:", error);
      res.status(500).json({ error: "Failed to track referral" });
    }
  });

  // Get affiliate referrals
  app.get("/api/affiliates/:id/referrals", async (req, res) => {
    try {
      const { id } = req.params;
      const referrals = await dbClient.select().from(affiliateReferrals)
        .where(eq(affiliateReferrals.affiliateId, id))
        .orderBy(desc(affiliateReferrals.createdAt));
      res.json(referrals);
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  // ==================== PRODUCT VARIANTS ====================
  
  // Get variants for product
  app.get("/api/products/:productId/variants", async (req, res) => {
    try {
      const { productId } = req.params;
      const variants = await dbClient.select().from(productVariants)
        .where(and(
          eq(productVariants.productId, productId),
          eq(productVariants.isActive, "true")
        ));
      res.json(variants);
    } catch (error) {
      console.error("Failed to fetch product variants:", error);
      res.status(500).json({ error: "Failed to fetch product variants" });
    }
  });

  // Create product variant
  app.post("/api/products/:productId/variants", async (req, res) => {
    try {
      const { productId } = req.params;
      const schema = insertProductVariantSchema;
      const data = schema.parse(req.body);
      
      const variant = await dbClient.insert(productVariants).values({
        ...data,
        productId,
      }).returning();
      
      res.json(variant[0]);
    } catch (error) {
      console.error("Failed to create product variant:", error);
      res.status(500).json({ error: "Failed to create product variant" });
    }
  });

  // Update variant stock
  app.patch("/api/variants/:id/stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      
      const [variant] = await dbClient.update(productVariants)
        .set({ stock: stock.toString() })
        .where(eq(productVariants.id, id))
        .returning();
      
      res.json(variant);
    } catch (error) {
      console.error("Failed to update variant stock:", error);
      res.status(500).json({ error: "Failed to update variant stock" });
    }
  });

  // ==================== FLASH SALES ====================
  
  // Get active flash sales
  app.get("/api/flash-sales/active", async (req, res) => {
    try {
      const now = new Date();
      const sales = await dbClient.select().from(flashSales)
        .where(and(
          eq(flashSales.status, "active"),
          lte(flashSales.startTime, now),
          gte(flashSales.endTime, now)
        ));
      res.json(sales);
    } catch (error) {
      console.error("Failed to fetch flash sales:", error);
      res.status(500).json({ error: "Failed to fetch flash sales" });
    }
  });

  // Create flash sale (OWNER ONLY)
  app.post("/api/flash-sales", requireOwner, async (req, res) => {
    try {
      const schema = insertFlashSaleSchema;
      const data = schema.parse(req.body);
      
      const sale = await dbClient.insert(flashSales).values(data).returning();
      res.json(sale[0]);
    } catch (error) {
      console.error("Failed to create flash sale:", error);
      res.status(500).json({ error: "Failed to create flash sale" });
    }
  });

  // Get flash sale by ID
  app.get("/api/flash-sales/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [sale] = await dbClient.select().from(flashSales)
        .where(eq(flashSales.id, id));
      res.json(sale || null);
    } catch (error) {
      console.error("Failed to fetch flash sale:", error);
      res.status(500).json({ error: "Failed to fetch flash sale" });
    }
  });

  // ==================== ABANDONED CARTS ====================
  
  // Save/update abandoned cart
  app.post("/api/abandoned-carts", async (req, res) => {
    try {
      const schema = insertAbandonedCartSchema;
      const data = schema.parse(req.body);
      
      // Set expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const cart = await dbClient.insert(abandonedCarts).values({
        ...data,
        expiresAt,
      }).returning();
      
      res.json(cart[0]);
    } catch (error) {
      console.error("Failed to save abandoned cart:", error);
      res.status(500).json({ error: "Failed to save abandoned cart" });
    }
  });

  // Get user's abandoned carts
  app.get("/api/abandoned-carts/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const carts = await dbClient.select().from(abandonedCarts)
        .where(and(
          eq(sql`lower(${abandonedCarts.customerWallet})`, walletAddress.toLowerCase()),
          eq(abandonedCarts.converted, "false"),
          gte(abandonedCarts.expiresAt, new Date())
        ))
        .orderBy(desc(abandonedCarts.updatedAt));
      res.json(carts);
    } catch (error) {
      console.error("Failed to fetch abandoned carts:", error);
      res.status(500).json({ error: "Failed to fetch abandoned carts" });
    }
  });

  // Mark cart as converted
  app.post("/api/abandoned-carts/:id/convert", async (req, res) => {
    try {
      const { id } = req.params;
      const { orderId } = req.body;
      
      const [cart] = await dbClient.update(abandonedCarts)
        .set({
          converted: "true",
          convertedOrderId: orderId,
          convertedAt: new Date(),
        })
        .where(eq(abandonedCarts.id, id))
        .returning();
      
      res.json(cart);
    } catch (error) {
      console.error("Failed to mark cart as converted:", error);
      res.status(500).json({ error: "Failed to mark cart as converted" });
    }
  });

  // ==================== CUSTOMER TIERS ====================
  
  // Get all tiers
  app.get("/api/customer-tiers", async (req, res) => {
    try {
      const tiers = await dbClient.select().from(customerTiers)
        .where(eq(customerTiers.isActive, "true"))
        .orderBy(desc(customerTiers.priority));
      res.json(tiers);
    } catch (error) {
      console.error("Failed to fetch customer tiers:", error);
      res.status(500).json({ error: "Failed to fetch customer tiers" });
    }
  });

  // Create tier
  app.post("/api/customer-tiers", async (req, res) => {
    try {
      const schema = insertCustomerTierSchema;
      const data = schema.parse(req.body);
      
      const tier = await dbClient.insert(customerTiers).values(data).returning();
      res.json(tier[0]);
    } catch (error) {
      console.error("Failed to create tier:", error);
      res.status(500).json({ error: "Failed to create tier" });
    }
  });

  // Assign tier to customer
  app.post("/api/customer-tiers/assign", async (req, res) => {
    try {
      const schema = insertCustomerTierAssignmentSchema;
      const data = schema.parse(req.body);
      
      const assignment = await dbClient.insert(customerTierAssignments).values(data).returning();
      res.json(assignment[0]);
    } catch (error) {
      console.error("Failed to assign tier:", error);
      res.status(500).json({ error: "Failed to assign tier" });
    }
  });

  // Get customer's tier
  app.get("/api/customer-tiers/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const assignment = await dbClient.select({
        tier: customerTiers,
        assignment: customerTierAssignments,
      })
      .from(customerTierAssignments)
      .innerJoin(customerTiers, eq(customerTierAssignments.tierId, customerTiers.id))
      .where(and(
        eq(sql`lower(${customerTierAssignments.customerWallet})`, walletAddress.toLowerCase()),
        or(
          isNull(customerTierAssignments.expiresAt),
          gte(customerTierAssignments.expiresAt, new Date())
        )
      ))
      .orderBy(desc(customerTierAssignments.assignedAt))
      .limit(1);
      
      res.json(assignment[0] || null);
    } catch (error) {
      console.error("Failed to fetch customer tier:", error);
      res.status(500).json({ error: "Failed to fetch customer tier" });
    }
  });

  // ==================== PRODUCT RECOMMENDATIONS ====================
  
  // Get recommendations for product
  app.get("/api/products/:productId/recommendations", async (req, res) => {
    try {
      const { productId } = req.params;
      const { type } = req.query;
      
      const recommendations = await dbClient.select({
        id: productRecommendations.id,
        type: productRecommendations.type,
        score: productRecommendations.score,
        product: products,
      })
      .from(productRecommendations)
      .innerJoin(products, eq(productRecommendations.recommendedProductId, products.id))
      .where(and(
        eq(productRecommendations.productId, productId),
        eq(productRecommendations.isActive, "true"),
        type ? eq(productRecommendations.type, type as string) : undefined
      ))
      .orderBy(desc(productRecommendations.score));
      
      res.json(recommendations);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // Create recommendation
  app.post("/api/products/:productId/recommendations", async (req, res) => {
    try {
      const { productId } = req.params;
      const schema = insertProductRecommendationSchema;
      const data = schema.parse(req.body);
      
      const recommendation = await dbClient.insert(productRecommendations).values({
        ...data,
        productId,
      }).returning();
      
      res.json(recommendation[0]);
    } catch (error) {
      console.error("Failed to create recommendation:", error);
      res.status(500).json({ error: "Failed to create recommendation" });
    }
  });

  // ==================== PRE-ORDERS ====================
  
  // Create pre-order
  app.post("/api/pre-orders", async (req, res) => {
    try {
      const schema = insertPreOrderSchema;
      const data = schema.parse(req.body);
      
      const preOrder = await dbClient.insert(preOrders).values(data).returning();
      res.json(preOrder[0]);
    } catch (error) {
      console.error("Failed to create pre-order:", error);
      res.status(500).json({ error: "Failed to create pre-order" });
    }
  });

  // Get user's pre-orders
  app.get("/api/pre-orders/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const userPreOrders = await dbClient.select({
        preOrder: preOrders,
        product: products,
      })
      .from(preOrders)
      .innerJoin(products, eq(preOrders.productId, products.id))
      .where(eq(sql`lower(${preOrders.customerWallet})`, walletAddress.toLowerCase()))
      .orderBy(desc(preOrders.createdAt));
      
      res.json(userPreOrders);
    } catch (error) {
      console.error("Failed to fetch pre-orders:", error);
      res.status(500).json({ error: "Failed to fetch pre-orders" });
    }
  });

  // Update pre-order status
  app.patch("/api/pre-orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [preOrder] = await dbClient.update(preOrders)
        .set({ status })
        .where(eq(preOrders.id, id))
        .returning();
      
      res.json(preOrder);
    } catch (error) {
      console.error("Failed to update pre-order status:", error);
      res.status(500).json({ error: "Failed to update pre-order status" });
    }
  });

  // ==================== RECENTLY VIEWED ====================
  
  // Track product view
  app.post("/api/recently-viewed", async (req, res) => {
    try {
      const schema = insertRecentlyViewedSchema;
      const data = schema.parse(req.body);
      
      // Delete old views for this product by this user
      await dbClient.delete(recentlyViewed)
        .where(and(
          eq(sql`lower(${recentlyViewed.customerWallet})`, data.customerWallet.toLowerCase()),
          eq(recentlyViewed.productId, data.productId)
        ));
      
      // Insert new view
      const view = await dbClient.insert(recentlyViewed).values(data).returning();
      res.json(view[0]);
    } catch (error) {
      console.error("Failed to track product view:", error);
      res.status(500).json({ error: "Failed to track product view" });
    }
  });

  // Get recently viewed products
  app.get("/api/recently-viewed/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const views = await dbClient.select({
        viewedAt: recentlyViewed.viewedAt,
        product: products,
      })
      .from(recentlyViewed)
      .innerJoin(products, eq(recentlyViewed.productId, products.id))
      .where(eq(sql`lower(${recentlyViewed.customerWallet})`, walletAddress.toLowerCase()))
      .orderBy(desc(recentlyViewed.viewedAt))
      .limit(limit);
      
      res.json(views);
    } catch (error) {
      console.error("Failed to fetch recently viewed:", error);
      res.status(500).json({ error: "Failed to fetch recently viewed" });
    }
  });

  // ==================== SUPREME COMMAND CENTER ====================
  
  // Get aggregated empire stats
  app.get("/api/supreme/stats", async (req, res) => {
    try {
      const walletAddress = req.query.account as string;
      
      if (!walletAddress) {
        return res.json({
          totalPortfolioValue: "0.00",
          totalInvested: "0.00",
          totalEarned: "0.00",
          activePositions: 0,
          totalPnL: "0.00",
          pnlPercent: "0.00%"
        });
      }

      let totalInvested = 0;
      let totalEarned = 0;
      let totalValue = 0;
      let activePositions = 0;

      // Aggregate staking positions if method exists
      try {
        if (typeof storage.getUserStakingPositions === 'function') {
          const stakingPositions = await storage.getUserStakingPositions(walletAddress);
          for (const pos of stakingPositions) {
            totalInvested += parseFloat(pos.amount);
            totalValue += parseFloat(pos.amount) + parseFloat(pos.rewards);
            totalEarned += parseFloat(pos.rewards);
            if (pos.status === 'active') activePositions++;
          }
        }
      } catch (e) {
        // Staking data may not be available
        console.log("Staking positions not available:", e);
      }

      // Aggregate from wallet balance if available
      try {
        const wallets = await storage.getWalletsByAddress(walletAddress);
        for (const wallet of wallets) {
          if (wallet.balance) {
            totalValue += parseFloat(wallet.balance);
          }
        }
      } catch (e) {
        // Wallet data may not be available
      }

      const totalPnL = totalEarned;
      const pnlPercent = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : "0.00";

      res.json({
        totalPortfolioValue: totalValue.toFixed(2),
        totalInvested: totalInvested.toFixed(2),
        totalEarned: totalEarned.toFixed(2),
        activePositions,
        totalPnL: totalPnL.toFixed(2),
        pnlPercent: `${pnlPercent}%`
      });
    } catch (error) {
      console.error("Failed to fetch empire stats:", error);
      // Return safe defaults instead of 500 error
      res.json({
        totalPortfolioValue: "0.00",
        totalInvested: "0.00",
        totalEarned: "0.00",
        activePositions: 0,
        totalPnL: "0.00",
        pnlPercent: "0.00%"
      });
    }
  });

  // Get recent activity across all features
  app.get("/api/supreme/activity", async (req, res) => {
    try {
      const walletAddress = req.query.account as string;
      
      if (!walletAddress) {
        return res.json([]);
      }

      const activities: any[] = [];

      // Get recent transactions
      try {
        const transactions = await storage.getTransactionsByAddress(walletAddress);
        for (const tx of transactions.slice(0, 5)) {
          activities.push({
            id: tx.hash,
            type: 'Transaction',
            description: `${tx.type} transaction on ${tx.chain}`,
            amount: tx.value ? `$${parseFloat(tx.value).toFixed(2)}` : undefined,
            timestamp: tx.timestamp,
            category: 'Blockchain'
          });
        }
      } catch (e) {
        // Transactions may not be available
      }

      // Get recent orders
      try {
        const orders = await storage.getOrders();
        const userOrders = orders
          .filter(o => o.customerWallet?.toLowerCase() === walletAddress.toLowerCase())
          .slice(0, 3);
        
        for (const order of userOrders) {
          activities.push({
            id: order.id,
            type: 'Order',
            description: `Order ${order.id.substring(0, 8)} - ${order.status}`,
            amount: `$${order.totalAmount}`,
            timestamp: order.createdAt,
            category: 'E-commerce'
          });
        }
      } catch (e) {
        // Orders may not be available
      }

      // Sort by timestamp descending and limit to 10
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.json(activities.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // ===== MARKETING CAMPAIGN ROUTES =====
  
  // Get all marketing campaigns for a user
  app.get("/api/marketing/campaigns/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const campaigns = await storage.getAllMarketingCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });
  
  // Get single campaign
  app.get("/api/marketing/campaign/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getMarketingCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });
  
  // Get campaigns by status
  app.get("/api/marketing/campaigns/:userId/status/:status", async (req, res) => {
    try {
      const { userId, status } = req.params;
      const campaigns = await storage.getCampaignsByStatus(userId, status);
      res.json(campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns by status:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });
  
  // Create marketing campaign
  app.post("/api/marketing/campaigns", async (req, res) => {
    try {
      const campaignSchema = z.object({
        userId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        type: z.string(),
        status: z.string().optional(),
        budget: z.string().optional(),
        spent: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        targetAudience: z.string().optional(),
        channels: z.array(z.string()).optional(),
        goals: z.any().optional()
      });
      
      const data = campaignSchema.parse(req.body);
      
      const { startDate, endDate, ...restData } = data;
      const campaignData: Omit<typeof restData, never> & { startDate?: Date; endDate?: Date } = {
        ...restData,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) })
      };
      
      const campaign = await storage.createMarketingCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Failed to create campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });
  
  // Update marketing campaign
  app.patch("/api/marketing/campaign/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const updateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        budget: z.string().optional(),
        spent: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        targetAudience: z.string().optional(),
        channels: z.array(z.string()).optional(),
        goals: z.any().optional()
      });
      
      const data = updateSchema.parse(req.body);
      
      const { startDate, endDate, ...restData } = data;
      const updateData: Omit<typeof restData, never> & { startDate?: Date; endDate?: Date } = {
        ...restData,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) })
      };
      
      const campaign = await storage.updateMarketingCampaign(id, updateData);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Failed to update campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });
  
  // Delete marketing campaign
  app.delete("/api/marketing/campaign/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMarketingCampaign(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });
  
  // Get campaign analytics
  app.get("/api/marketing/campaign/:id/analytics", async (req, res) => {
    try {
      const { id } = req.params;
      const analytics = await storage.getCampaignAnalytics(id);
      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  
  // Get campaign metrics
  app.get("/api/marketing/campaign/:id/metrics", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const metrics = await storage.getCampaignMetrics(id, limit);
      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });
  
  // Create campaign metric
  app.post("/api/marketing/campaign/:id/metrics", async (req, res) => {
    try {
      const { id } = req.params;
      const metricSchema = z.object({
        impressions: z.string().optional(),
        clicks: z.string().optional(),
        conversions: z.string().optional(),
        revenue: z.string().optional(),
        ctr: z.string().optional(),
        conversionRate: z.string().optional(),
        roi: z.string().optional(),
        date: z.string(),
        metadata: z.any().optional()
      });
      
      const data = metricSchema.parse(req.body);
      const metric = await storage.createCampaignMetric({ ...data, campaignId: id });
      res.json(metric);
    } catch (error) {
      console.error("Failed to create metric:", error);
      res.status(500).json({ error: "Failed to create metric" });
    }
  });
  
  // Get campaign budgets
  app.get("/api/marketing/campaign/:id/budgets", async (req, res) => {
    try {
      const { id } = req.params;
      const budgets = await storage.getCampaignBudgets(id);
      res.json(budgets);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });
  
  // Create campaign budget
  app.post("/api/marketing/campaign/:id/budgets", async (req, res) => {
    try {
      const { id } = req.params;
      const budgetSchema = z.object({
        channel: z.string(),
        allocated: z.string(),
        spent: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        notes: z.string().optional()
      });
      
      const data = budgetSchema.parse(req.body);
      const budget = await storage.createMarketingBudget({ ...data, campaignId: id });
      res.json(budget);
    } catch (error) {
      console.error("Failed to create budget:", error);
      res.status(500).json({ error: "Failed to create budget" });
    }
  });
  
  // ===== SECURITY / WALLET ROUTES =====
  
  // In-memory storage for security policies and transaction limits (non-persistent features)
  const securityPolicies = new Map<string, any>();
  const transactionLimits = new Map<string, any>();
  
  // Get wallet security policy
  app.get("/api/security/policy/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const policy = securityPolicies.get(walletAddress.toLowerCase()) || {
        walletAddress,
        multiSigEnabled: false,
        hardwareWalletEnabled: false,
        txSimulationEnabled: true,
        aiSentinelEnabled: true,
        dailySpendingLimit: "10",
        requireApprovalAbove: "5",
        sessionTimeout: "3600",
      };
      res.json(policy);
    } catch (error) {
      console.error("Failed to fetch security policy:", error);
      res.status(500).json({ error: "Failed to fetch security policy" });
    }
  });
  
  // Update wallet security policy
  app.put("/api/security/policy/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const policySchema = z.object({
        multiSigEnabled: z.boolean().optional(),
        hardwareWalletEnabled: z.boolean().optional(),
        txSimulationEnabled: z.boolean().optional(),
        aiSentinelEnabled: z.boolean().optional(),
        dailySpendingLimit: z.string().optional(),
        requireApprovalAbove: z.string().optional(),
        sessionTimeout: z.string().optional(),
      });
      
      const updates = policySchema.parse(req.body);
      const current = securityPolicies.get(walletAddress.toLowerCase()) || {};
      const updated = { ...current, ...updates, walletAddress, updatedAt: new Date() };
      
      securityPolicies.set(walletAddress.toLowerCase(), updated);
      
      // Create alert for policy change
      const alert = {
        id: Date.now().toString(),
        type: 'policy_change',
        severity: 'low',
        title: 'Security Policy Updated',
        description: `Security settings have been modified`,
        metadata: updates,
        isRead: false,
        createdAt: new Date(),
      };
      
      const alerts = securityAlerts.get(walletAddress.toLowerCase()) || [];
      alerts.unshift(alert);
      securityAlerts.set(walletAddress.toLowerCase(), alerts.slice(0, 50)); // Keep last 50
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update security policy:", error);
      res.status(500).json({ error: "Failed to update security policy" });
    }
  });
  
  // Add trusted address
  app.post("/api/security/whitelist/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const schema = z.object({
        address: z.string(),
        label: z.string().optional(),
      });
      
      const { address, label } = schema.parse(req.body);
      
      // Add to database
      await storage.addTrustedAddress({
        walletAddress,
        trustedAddress: address,
        label: label || null
      });
      
      // Create security alert
      await storage.createSecurityAlert({
        walletAddress,
        type: 'whitelist_add',
        severity: 'low',
        title: 'Address Whitelisted',
        description: `${address.slice(0, 10)}... added to trusted addresses`,
        metadata: { address, label },
        isRead: "false"
      });
      
      res.json({ success: true, address, label });
    } catch (error) {
      console.error("Failed to add trusted address:", error);
      res.status(500).json({ error: "Failed to add trusted address" });
    }
  });
  
  // Get trusted addresses
  app.get("/api/security/whitelist/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const trustedAddressList = await storage.getTrustedAddresses(walletAddress);
      const addresses = trustedAddressList.map(ta => ta.trustedAddress);
      res.json(addresses);
    } catch (error) {
      console.error("Failed to fetch trusted addresses:", error);
      res.status(500).json({ error: "Failed to fetch trusted addresses" });
    }
  });
  
  // Block address
  app.post("/api/security/blacklist/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const schema = z.object({
        address: z.string(),
        reason: z.string().optional(),
      });
      
      const { address, reason } = schema.parse(req.body);
      
      // Add to database
      await storage.addBlockedAddress({
        walletAddress,
        blockedAddress: address,
        reason: reason || null
      });
      
      // Create high severity alert
      await storage.createSecurityAlert({
        walletAddress,
        type: 'blacklist_add',
        severity: 'high',
        title: 'Address Blocked',
        description: `${address.slice(0, 10)}... has been blocked`,
        metadata: { address, reason },
        isRead: "false"
      });
      
      res.json({ success: true, address, reason });
    } catch (error) {
      console.error("Failed to block address:", error);
      res.status(500).json({ error: "Failed to block address" });
    }
  });
  
  // Validate transaction (ADVANCED security enforcement)
  app.post("/api/security/validate-transaction", async (req, res) => {
    try {
      const schema = z.object({
        from: z.string(),
        to: z.string(),
        amount: z.string(),
        amountWei: z.string().optional(),
        network: z.string().optional(),
        chainId: z.string().optional(),
        timestamp: z.string().optional(),
      });
      
      const { from, to, amount, amountWei, network, chainId, timestamp } = schema.parse(req.body);
      const fromKey = from.toLowerCase();
      const toKey = to.toLowerCase();
      
      const policy = securityPolicies.get(fromKey) || {};
      const alerts: any[] = [];
      let blocked = false;
      let warnings: string[] = [];
      
      // VELOCITY LIMIT CHECK: Track transaction frequency
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const recentTxKey = `${fromKey}_recent`;
      let recentTx = transactionLimits.get(recentTxKey) || [];
      
      // Clean old transactions (older than 1 hour)
      recentTx = recentTx.filter((tx: any) => now - tx.timestamp < oneHour);
      
      // Check velocity: max 10 transactions per hour
      if (recentTx.length >= 10) {
        blocked = true;
        alerts.push({
          id: Date.now().toString(),
          type: 'velocity_limit',
          severity: 'critical',
          title: 'Velocity Limit Exceeded',
          description: `Too many transactions (${recentTx.length}) in the last hour. Please wait before sending more.`,
          metadata: { from, count: recentTx.length, limit: 10 },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // Add current transaction to tracking
      recentTx.push({ timestamp: now, amount: parseFloat(amount) });
      transactionLimits.set(recentTxKey, recentTx);
      
      // EMERGENCY LOCKDOWN CHECK
      if (policy.lockdownEnabled) {
        blocked = true;
        alerts.push({
          id: (Date.now() + 1).toString(),
          type: 'lockdown',
          severity: 'critical',
          title: 'Wallet Locked',
          description: 'Emergency lockdown is active. All transactions are blocked.',
          metadata: { from, to, amount },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // BLACKLIST CHECK - Use database-backed storage
      const blockedAddressList = await storage.getBlockedAddresses(from);
      const isBlocked = blockedAddressList.some(ba => ba.blockedAddress.toLowerCase() === toKey);
      
      if (isBlocked) {
        blocked = true;
        alerts.push({
          id: (Date.now() + 2).toString(),
          type: 'blocked_transaction',
          severity: 'critical',
          title: 'Transaction Blocked',
          description: `Attempted transaction to blocked address ${to.slice(0, 10)}...`,
          metadata: { from, to, amount, network, chainId },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // SPENDING LIMIT CHECK (per chain)
      const dailyLimit = parseFloat(policy.dailySpendingLimit || "10");
      const txAmount = parseFloat(amount);
      
      if (txAmount > dailyLimit) {
        warnings.push(`Transaction amount (${amount} ETH) exceeds daily limit (${dailyLimit} ETH)`);
        alerts.push({
          id: (Date.now() + 3).toString(),
          type: 'spending_limit',
          severity: 'medium',
          title: 'Spending Limit Exceeded',
          description: `Transaction of ${amount} ETH exceeds daily limit of ${dailyLimit} ETH`,
          metadata: { from, to, amount, limit: dailyLimit, network, chainId },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // HIGH-VALUE CHECK
      const requireApproval = parseFloat(policy.requireApprovalAbove || "5");
      if (txAmount > requireApproval) {
        warnings.push(`High-value transaction requires approval (>${requireApproval} ETH)`);
      }
      
      // WHITELIST CHECK - Use database-backed storage
      const trustedAddressList = await storage.getTrustedAddresses(from);
      const isTrusted = trustedAddressList.some(ta => ta.trustedAddress.toLowerCase() === toKey);
      
      if (!isTrusted && !blocked) {
        warnings.push(`Recipient address is not in your trusted list`);
      }
      
      // PATTERN ANALYSIS: Detect suspicious behavior
      const hourlyTotal = recentTx.reduce((sum: number, tx: any) => sum + tx.amount, 0);
      if (hourlyTotal > dailyLimit * 2) {
        warnings.push(`⚠️ FRAUD ALERT: Unusual spending pattern detected (${hourlyTotal.toFixed(2)} ETH in 1 hour)`);
        alerts.push({
          id: (Date.now() + 4).toString(),
          type: 'suspicious_pattern',
          severity: 'high',
          title: 'Suspicious Activity Detected',
          description: `Unusual spending pattern: ${hourlyTotal.toFixed(2)} ETH in the last hour`,
          metadata: { from, hourlyTotal, transactions: recentTx.length },
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // Store alerts
      if (alerts.length > 0) {
        const existingAlerts = securityAlerts.get(fromKey) || [];
        securityAlerts.set(fromKey, [...alerts, ...existingAlerts].slice(0, 100)); // Keep last 100
      }
      
      res.json({
        valid: !blocked,
        blocked,
        warnings,
        requiresApproval: txAmount > requireApproval,
        alerts,
        policy,
        metadata: {
          network,
          chainId,
          timestamp,
          velocityCheck: {
            recentCount: recentTx.length,
            limit: 10,
            hourlyTotal: hourlyTotal.toFixed(2)
          }
        }
      });
    } catch (error) {
      console.error("Transaction validation failed:", error);
      res.status(500).json({ error: "Transaction validation failed" });
    }
  });
  
  // Get security alerts (AI Sentinel monitoring)
  app.get("/api/security/alerts/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const alerts = securityAlerts.get(walletAddress.toLowerCase()) || [];
      res.json(alerts);
    } catch (error) {
      console.error("Failed to fetch security alerts:", error);
      res.status(500).json({ error: "Failed to fetch security alerts" });
    }
  });
  
  // Mark alert as read
  app.put("/api/security/alerts/:walletAddress/:alertId/read", async (req, res) => {
    try {
      const { walletAddress, alertId } = req.params;
      const alerts = securityAlerts.get(walletAddress.toLowerCase()) || [];
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.isRead = true;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });
  
  // Emergency lockdown toggle
  app.post("/api/security/lockdown/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const schema = z.object({
        enabled: z.boolean(),
      });
      
      const { enabled } = schema.parse(req.body);
      const key = walletAddress.toLowerCase();
      
      const current = securityPolicies.get(key) || {};
      const updated = { ...current, lockdownEnabled: enabled, walletAddress, updatedAt: new Date() };
      
      securityPolicies.set(key, updated);
      
      // Create alert
      const alert = {
        id: Date.now().toString(),
        type: enabled ? 'lockdown_enabled' : 'lockdown_disabled',
        severity: enabled ? 'critical' : 'medium',
        title: enabled ? 'Emergency Lockdown Activated' : 'Emergency Lockdown Deactivated',
        description: enabled ? '🔒 All transactions are now blocked' : '🔓 Wallet unlocked, transactions allowed',
        metadata: { walletAddress, enabled },
        isRead: false,
        createdAt: new Date(),
      };
      
      const alerts = securityAlerts.get(key) || [];
      alerts.unshift(alert);
      securityAlerts.set(key, alerts.slice(0, 100));
      
      res.json({ success: true, lockdownEnabled: enabled });
    } catch (error) {
      console.error("Failed to toggle lockdown:", error);
      res.status(500).json({ error: "Failed to toggle lockdown" });
    }
  });
  
  // ===== TRADING PLATFORM ROUTES =====
  
  // In-memory storage for trading orders
  const openOrders: Map<string, any> = new Map();
  const orderHistory: any[] = [];
  
  // Initialize with some demo orders
  openOrders.set(`order_${Date.now()}_1`, {
    id: `order_${Date.now()}_1`,
    pair: 'BTC-USD',
    side: 'buy',
    type: 'limit',
    amount: 0.1,
    price: '49500.00',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  });
  
  openOrders.set(`order_${Date.now()}_2`, {
    id: `order_${Date.now()}_2`,
    pair: 'ETH-USD',
    side: 'sell',
    type: 'limit',
    amount: 2,
    price: '3100.00',
    status: 'open',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  });
  
  // Initialize order history
  orderHistory.push({
    id: `order_history_1`,
    pair: 'BTC-USD',
    side: 'buy',
    type: 'market',
    amount: 0.05,
    executedPrice: '49800.00',
    profit: 150.50,
    status: 'filled',
    executedAt: new Date(Date.now() - 86400000).toISOString()
  });
  
  orderHistory.push({
    id: `order_history_2`,
    pair: 'ETH-USD',
    side: 'sell',
    type: 'market',
    amount: 1,
    executedPrice: '3050.00',
    profit: -25.00,
    status: 'filled',
    executedAt: new Date(Date.now() - 172800000).toISOString()
  });
  
  orderHistory.push({
    id: `order_history_3`,
    pair: 'SOL-USD',
    side: 'buy',
    type: 'limit',
    amount: 10,
    executedPrice: '98.50',
    profit: 45.00,
    status: 'filled',
    executedAt: new Date(Date.now() - 259200000).toISOString()
  });
  
  // Get order book for a trading pair
  app.get("/api/trading/orderbook/:pair", async (req, res) => {
    try {
      const { pair } = req.params;
      
      // Mock order book data (in production, fetch from Coinbase)
      const orderBook = {
        bids: Array.from({ length: 20 }, (_, i) => ({
          price: (50000 - i * 10).toFixed(2),
          size: (Math.random() * 2).toFixed(4)
        })),
        asks: Array.from({ length: 20 }, (_, i) => ({
          price: (50010 + i * 10).toFixed(2),
          size: (Math.random() * 2).toFixed(4)
        }))
      };
      
      res.json(orderBook);
    } catch (error) {
      console.error("Failed to fetch order book:", error);
      res.status(500).json({ error: "Failed to fetch order book" });
    }
  });
  
  // Place trading order
  app.post("/api/trading/orders", tradingRateLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const orderSchema = z.object({
        pair: z.string(),
        side: z.enum(['buy', 'sell']),
        type: z.enum(['market', 'limit', 'stop_loss', 'take_profit']),
        amount: z.number().positive(),
        limitPrice: z.number().positive().optional(),
        stopPrice: z.number().positive().optional(),
        targetPrice: z.number().positive().optional(),
      });
      
      const orderData = orderSchema.parse(req.body);
      
      // Get current price (mock - in production, fetch from Coinbase)
      const currentPrice = 50000 + Math.random() * 1000;
      
      // Create order
      const order = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...orderData,
        status: orderData.type === 'market' ? 'filled' : 'open',
        executedPrice: orderData.type === 'market' ? currentPrice.toFixed(2) : orderData.limitPrice?.toFixed(2) || '0',
        executedAt: orderData.type === 'market' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      };
      
      // Store order based on status
      if (order.status === 'open') {
        openOrders.set(order.id, order);
      } else if (order.status === 'filled') {
        orderHistory.unshift(order);
      }
      
      res.json(order);
    } catch (error) {
      console.error("Failed to place order:", error);
      res.status(500).json({ error: "Failed to place order" });
    }
  });
  
  // Get open orders
  app.get("/api/trading/orders/open", async (req, res) => {
    try {
      // Return all open orders from in-memory store
      const orders = Array.from(openOrders.values());
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch open orders:", error);
      res.status(500).json({ error: "Failed to fetch open orders" });
    }
  });
  
  // Get order history
  app.get("/api/trading/orders/history", async (req, res) => {
    try {
      // Return order history from in-memory store
      res.json(orderHistory);
    } catch (error) {
      console.error("Failed to fetch order history:", error);
      res.status(500).json({ error: "Failed to fetch order history" });
    }
  });
  
  // Cancel order
  app.post("/api/trading/orders/:orderId/cancel", tradingRateLimit, tradingSpeedLimit, async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Remove order from open orders
      if (openOrders.has(orderId)) {
        openOrders.delete(orderId);
        res.json({ success: true, orderId });
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });
  
  // ===== COMMAND CENTER / PLATFORM STATISTICS ROUTES =====
  
  // Get platform statistics (OWNER ONLY)
  app.get("/api/command-center/stats", requireOwner, async (req, res) => {
    try {
      // Aggregate stats from existing tables
      const stats = await storage.getPlatformStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch platform stats:", error);
      res.status(500).json({ error: "Failed to fetch platform statistics" });
    }
  });
  
  // Get recent platform activity feed (OWNER ONLY)
  app.get("/api/command-center/activity", requireOwner, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activity = await storage.getPlatformActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });
  
  // Get system health metrics (OWNER ONLY)
  app.get("/api/command-center/health", requireOwner, async (req, res) => {
    try {
      const health = await storage.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error("Failed to fetch system health:", error);
      res.status(500).json({ error: "Failed to fetch system health" });
    }
  });

  // Get platform revenue dashboard (OWNER ONLY)
  app.get("/api/platform/revenue", requireOwner, async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (period === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === '90d') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      // 1. E-commerce revenue from orders
      const ordersResult = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0)`,
          count: sql<string>`COALESCE(COUNT(*), 0)`
        })
        .from(orders)
        .where(and(
          eq(orders.status, 'completed'),
          gte(orders.createdAt, startDate)
        ));
      
      const ecommerceRevenue = parseFloat(ordersResult[0]?.total || '0');
      const orderCount = parseInt(ordersResult[0]?.count || '0');

      // 2. Marketplace fees (assume 2% fee on sales)
      const marketplaceResult = await dbClient
        .select({
          total: sql<string>`COALESCE(SUM(CAST(price AS NUMERIC)), 0)`,
          count: sql<string>`COALESCE(COUNT(*), 0)`
        })
        .from(marketplaceListings)
        .where(and(
          eq(marketplaceListings.status, 'sold'),
          gte(marketplaceListings.createdAt, startDate)
        ));
      
      const marketplaceSales = parseFloat(marketplaceResult[0]?.total || '0');
      const marketplaceFees = marketplaceSales * 0.02; // 2% platform fee
      const marketplaceSalesCount = parseInt(marketplaceResult[0]?.count || '0');

      // 3. Trading bot performance fees (assume 10% of profits)
      const tradingResult = await dbClient
        .select({
          totalProfit: sql<string>`COALESCE(SUM(CAST(profit AS NUMERIC)), 0)`,
          count: sql<string>`COALESCE(COUNT(*), 0)`
        })
        .from(botTrades)
        .where(and(
          eq(botTrades.status, 'filled'),
          gte(botTrades.createdAt, startDate),
          sql`CAST(${botTrades.profit} AS NUMERIC) > 0`
        ));
      
      const totalTradingProfit = parseFloat(tradingResult[0]?.totalProfit || '0');
      const tradingFees = totalTradingProfit * 0.10; // 10% performance fee
      const profitableTradesCount = parseInt(tradingResult[0]?.count || '0');

      // 4. Subscription revenue (from subscription_billings)
      const subscriptionResult = await dbClient
        .execute(sql`
          SELECT 
            COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total,
            COALESCE(COUNT(*), 0) as count
          FROM subscription_billings
          WHERE status = 'paid'
          AND created_at >= ${startDate.toISOString()}
        `);
      
      const subscriptionRevenue = parseFloat(subscriptionResult.rows[0]?.total || '0');
      const subscriptionCount = parseInt(subscriptionResult.rows[0]?.count || '0');

      // 5. Affiliate commissions (money we save, not paid out)
      const affiliateResult = await dbClient
        .execute(sql`
          SELECT 
            COALESCE(SUM(CAST(commission_amount AS NUMERIC)), 0) as total,
            COALESCE(COUNT(*), 0) as count
          FROM affiliate_referrals
          WHERE status IN ('pending', 'approved')
          AND created_at >= ${startDate.toISOString()}
        `);
      
      const pendingAffiliateCosts = parseFloat(affiliateResult.rows[0]?.total || '0');
      const affiliateReferralCount = parseInt(affiliateResult.rows[0]?.count || '0');

      // 6. Flash sales revenue
      const flashSalesResult = await dbClient
        .select({
          count: sql<string>`COALESCE(SUM(CAST(sold_quantity AS NUMERIC)), 0)`
        })
        .from(flashSales)
        .where(gte(flashSales.createdAt, startDate));
      
      const flashSalesCount = parseInt(flashSalesResult[0]?.count || '0');

      // Calculate totals
      const totalRevenue = ecommerceRevenue + marketplaceFees + tradingFees + subscriptionRevenue;
      const netRevenue = totalRevenue - pendingAffiliateCosts;

      res.json({
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        revenue: {
          total: totalRevenue.toFixed(2),
          net: netRevenue.toFixed(2),
          bySource: {
            ecommerce: {
              amount: ecommerceRevenue.toFixed(2),
              count: orderCount,
              label: 'E-commerce Sales'
            },
            marketplace: {
              amount: marketplaceFees.toFixed(2),
              count: marketplaceSalesCount,
              label: 'Marketplace Fees (2%)'
            },
            trading: {
              amount: tradingFees.toFixed(2),
              count: profitableTradesCount,
              label: 'Trading Bot Fees (10%)'
            },
            subscriptions: {
              amount: subscriptionRevenue.toFixed(2),
              count: subscriptionCount,
              label: 'Subscription Revenue'
            }
          },
          costs: {
            affiliateCommissions: {
              amount: pendingAffiliateCosts.toFixed(2),
              count: affiliateReferralCount,
              label: 'Pending Affiliate Payouts'
            }
          }
        },
        metrics: {
          totalTransactions: orderCount + marketplaceSalesCount + profitableTradesCount + subscriptionCount,
          avgTransactionValue: orderCount > 0 ? (totalRevenue / orderCount).toFixed(2) : '0',
          flashSalesVolume: flashSalesCount
        }
      });
    } catch (error) {
      console.error("Failed to fetch platform revenue:", error);
      res.status(500).json({ error: "Failed to fetch platform revenue" });
    }
  });

  // Get comprehensive owner metrics (OWNER ONLY)
  app.get("/api/owner/metrics", requireOwner, async (req, res) => {
    try {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get platform statistics
      const platformStats = await storage.getPlatformStatistics();

      // Get user counts
      const [totalUsers, newUsersThisMonth, premiumUsers] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` }).from(users),
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(sql`created_at >= ${oneMonthAgo}`),
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(eq(users.isOwner, "true"))
      ]);

      // Get transaction metrics
      const [todayTransactions, todayVolume] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(transactions)
          .where(sql`timestamp >= ${oneDayAgo}`),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(CAST(amount AS NUMERIC)), 0)::text` 
        })
          .from(transactions)
          .where(sql`timestamp >= ${oneDayAgo}`)
      ]);

      // Get revenue metrics
      const [monthlyRevenue, weeklyRevenue, totalProfit] = await Promise.all([
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(total_amount), 0)::text` 
        })
          .from(orders)
          .where(and(
            eq(orders.status, 'completed'),
            sql`created_at >= ${oneMonthAgo}`
          )),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(total_amount), 0)::text` 
        })
          .from(orders)
          .where(and(
            eq(orders.status, 'completed'),
            sql`created_at >= ${oneWeekAgo}`
          )),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(total_amount), 0)::text` 
        })
          .from(orders)
          .where(eq(orders.status, 'completed'))
      ]);

      // Get auto-compound metrics
      const [activeStakes, totalStaked, totalRewards] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(autoCompoundStakes)
          .where(eq(autoCompoundStakes.status, 'active')),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(CAST(initial_stake AS NUMERIC)), 0)::text` 
        })
          .from(autoCompoundStakes)
          .where(eq(autoCompoundStakes.status, 'active')),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(CAST(total_rewards AS NUMERIC)), 0)::text` 
        })
          .from(autoCompoundStakes)
      ]);

      // Get trading bot metrics
      const [totalTrades, botStats] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(botTrades),
        dbClient.select({
          totalPnL: sql<string>`COALESCE(SUM(CAST(pnl AS NUMERIC)), 0)::text`,
          winningTrades: sql<number>`COUNT(CASE WHEN CAST(pnl AS NUMERIC) > 0 THEN 1 END)::int`,
          totalCount: sql<number>`COUNT(*)::int`
        })
          .from(botTrades)
      ]);

      const winRate = botStats[0]?.totalCount > 0 
        ? (botStats[0].winningTrades / botStats[0].totalCount) * 100 
        : 0;

      // Get social automation metrics
      const [scheduledPostsCount, publishedPostsCount, totalEngagement] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(scheduledPosts)
          .where(eq(scheduledPosts.status, 'scheduled')),
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(postHistory)
          .where(eq(postHistory.status, 'published')),
        dbClient.select({ 
          total: sql<number>`COALESCE(SUM(CAST(likes AS INTEGER) + CAST(retweets AS INTEGER) + CAST(replies AS INTEGER)), 0)::int` 
        })
          .from(postHistory)
          .where(eq(postHistory.status, 'published'))
      ]);

      // Get marketplace metrics
      const [totalListings, activeSales, marketplaceVolume] = await Promise.all([
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(marketplaceListings),
        dbClient.select({ count: sql<number>`count(*)::int` })
          .from(marketplaceListings)
          .where(eq(marketplaceListings.status, 'active')),
        dbClient.select({ 
          total: sql<string>`COALESCE(SUM(CAST(price AS NUMERIC)), 0)::text` 
        })
          .from(marketplaceListings)
          .where(eq(marketplaceListings.status, 'sold'))
      ]);

      const totalRevenue = parseFloat(platformStats.totalRevenue || '0');
      const totalProfitNum = parseFloat(totalProfit[0]?.total || '0');
      const profitMargin = totalRevenue > 0 ? (totalProfitNum / totalRevenue) * 100 : 0;

      // Calculate active users (users with stakes or recent transactions)
      const activeUsersResult = await dbClient.select({ 
        count: sql<number>`COUNT(DISTINCT user_id)::int` 
      })
        .from(autoCompoundStakes)
        .where(eq(autoCompoundStakes.status, 'active'));

      const metrics = {
        financials: {
          totalRevenue: totalRevenue,
          monthlyRevenue: parseFloat(monthlyRevenue[0]?.total || '0'),
          weeklyRevenue: parseFloat(weeklyRevenue[0]?.total || '0'),
          totalProfit: totalProfitNum,
          profitMargin: profitMargin
        },
        users: {
          total: totalUsers[0]?.count || 0,
          active: activeUsersResult[0]?.count || 0,
          newThisMonth: newUsersThisMonth[0]?.count || 0,
          premiumUsers: premiumUsers[0]?.count || 0
        },
        transactions: {
          total: platformStats.totalTransactions || 0,
          volume: parseFloat(platformStats.totalRevenue || '0'),
          todayCount: todayTransactions[0]?.count || 0,
          todayVolume: parseFloat(todayVolume[0]?.total || '0')
        },
        algorithms: {
          autoCompound: {
            status: 'Active',
            poolsActive: activeStakes[0]?.count || 0,
            totalStaked: parseFloat(totalStaked[0]?.total || '0'),
            totalRewards: parseFloat(totalRewards[0]?.total || '0')
          },
          tradingBot: {
            status: 'Active',
            activeStrategies: 5,
            totalTrades: totalTrades[0]?.count || 0,
            profitLoss: parseFloat(botStats[0]?.totalPnL || '0'),
            winRate: winRate
          },
          socialAutomation: {
            status: 'Active',
            postsScheduled: scheduledPostsCount[0]?.count || 0,
            postsPublished: publishedPostsCount[0]?.count || 0,
            engagement: totalEngagement[0]?.total || 0
          }
        },
        marketplace: {
          totalListings: totalListings[0]?.count || 0,
          activeSales: activeSales[0]?.count || 0,
          totalVolume: parseFloat(marketplaceVolume[0]?.total || '0')
        }
      };

      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch owner metrics:", error);
      res.status(500).json({ error: "Failed to fetch owner metrics" });
    }
  });
  
  // ===== AUTO TRADING BOT ROUTES =====
  
  // In-memory bot state
  let botState: any = {
    status: 'stopped',
    config: null,
    startTime: null,
  };
  
  const botTrades: any[] = [];
  const botStats = {
    totalProfit: 0,
    totalTrades: 0,
    winningTrades: 0,
    winRate: 0,
  };
  
  // Get bot status
  app.get("/api/bot/status", async (req, res) => {
    try {
      res.json(botState);
    } catch (error) {
      console.error("Failed to fetch bot status:", error);
      res.status(500).json({ error: "Failed to fetch bot status" });
    }
  });
  
  
  // Get bot trades
  app.get("/api/bot/trades", async (req, res) => {
    try {
      res.json(botTrades);
    } catch (error) {
      console.error("Failed to fetch bot trades:", error);
      res.status(500).json({ error: "Failed to fetch bot trades" });
    }
  });
  
  // Get bot stats
  app.get("/api/bot/stats", async (req, res) => {
    try {
      const winRate = botStats.totalTrades > 0 
        ? ((botStats.winningTrades / botStats.totalTrades) * 100).toFixed(1)
        : 0;
      
      res.json({
        ...botStats,
        winRate,
      });
    } catch (error) {
      console.error("Failed to fetch bot stats:", error);
      res.status(500).json({ error: "Failed to fetch bot stats" });
    }
  });
  
  // Bot activity feed (demo mode)
  const botActivityFeed: any[] = [];
  let activityInterval: NodeJS.Timeout | null = null;
  
  const generateBotActivity = async () => {
    if (botState.status !== 'running' || !botState.config) return;
    
    const config = botState.config;
    const demoMode = config.demoMode !== false; // Default to demo mode for safety
    
    // Simulate market analysis
    const currentPrice = 42000 + Math.random() * 2000; // Random price for demo
    const sma20 = currentPrice * (0.98 + Math.random() * 0.04);
    
    const activities = [
      { type: 'analysis', message: `Analyzing ${config.tradingPair} market conditions`, details: 'Fetching latest candlestick data and calculating indicators' },
      { type: 'analysis', message: 'Computing SMA20 indicator', details: `Current price: $${currentPrice.toFixed(2)} | SMA20: $${sma20.toFixed(2)}` },
    ];
    
    // Randomly decide if signal should trigger
    if (Math.random() > 0.7) {
      const side = currentPrice > sma20 ? 'buy' : 'sell';
      const signalType = side === 'buy' ? 'Bullish' : 'Bearish';
      
      activities.push({ 
        type: 'signal', 
        message: `✨ ${side.toUpperCase()} signal detected!`, 
        details: `Price ${side === 'buy' ? 'crossed above' : 'crossed below'} SMA20 - ${signalType} momentum confirmed` 
      });
      
      activities.push({ 
        type: 'strategy', 
        message: 'Evaluating risk parameters', 
        details: `Stop loss: ${config.stopLoss}% | Take profit: ${config.takeProfit}% | Position size validated` 
      });
      
      // Execute trade (demo or live)
      if (demoMode) {
        activities.push({ 
          type: 'trade', 
          message: `🎮 DEMO ${side.toUpperCase()} order executed`, 
          details: `${(parseFloat(config.tradeAmount) / currentPrice).toFixed(6)} ${config.tradingPair.split('-')[0]} @ $${currentPrice.toFixed(2)} | Total: $${config.tradeAmount}` 
        });
        
        // Record demo trade
        const profit = (Math.random() - 0.4) * parseFloat(config.tradeAmount) * 0.1;
        botTrades.unshift({
          id: 'demo_' + Date.now(),
          tradingPair: config.tradingPair,
          side,
          orderType: 'market',
          amount: (parseFloat(config.tradeAmount) / currentPrice).toFixed(6),
          price: currentPrice.toFixed(2),
          strategy: config.strategy,
          timestamp: new Date().toISOString(),
          profit: profit.toFixed(2),
          mode: 'DEMO'
        });
        
        // Update stats
        botStats.totalTrades++;
        botStats.totalProfit += profit;
        if (profit > 0) botStats.winningTrades++;
        
      } else {
        activities.push({ 
          type: 'trade', 
          message: `🚀 LIVE ${side.toUpperCase()} order submitted`, 
          details: `Executing on real trading platform - ${config.tradingPair}` 
        });
        
        // Note: In production, this would call POST /api/trading/orders
        // For now, we log that it would execute
        activities.push({ 
          type: 'system', 
          message: '⚠️ Live trading requires trading platform integration', 
          details: 'Enable demo mode for safe testing' 
        });
      }
    } else {
      activities.push({ 
        type: 'system', 
        message: 'No trading signal - Waiting for optimal entry', 
        details: `Monitoring ${config.tradingPair} | Daily trades: ${botStats.totalTrades}/${config.maxDailyTrades}` 
      });
    }
    
    // Add activities to feed
    for (const activity of activities) {
      botActivityFeed.unshift({
        ...activity,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Keep only last 30 activities
    while (botActivityFeed.length > 30) {
      botActivityFeed.pop();
    }
  };
  
  // Bot configuration validation schema
  const botConfigSchema = z.object({
    tradingPair: z.string().min(1, "Trading pair is required"),
    strategy: z.string().min(1, "Strategy is required"),
    tradeAmount: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Trade amount must be a positive number"),
    stopLoss: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "Stop loss must be between 0 and 100"),
    takeProfit: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 1000;
    }, "Take profit must be between 0 and 1000"),
    maxDailyTrades: z.string().refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0 && num <= 100;
    }, "Max daily trades must be between 1 and 100"),
    demoMode: z.boolean().default(true),
  });

  // Start bot with activity generation
  app.post("/api/bot/start", async (req, res) => {
    try {
      // Validate configuration
      const validationResult = botConfigSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid bot configuration", 
          details: validationResult.error.errors 
        });
      }
      
      const config = validationResult.data;
      
      botState = {
        status: 'running',
        config,
        startTime: new Date().toISOString(),
      };
      
      // Clear old activity and start new feed
      botActivityFeed.length = 0;
      if (activityInterval) clearInterval(activityInterval);
      
      // Generate activity every 3-5 seconds
      activityInterval = setInterval(() => {
        generateBotActivity();
      }, 3000 + Math.random() * 2000);
      
      res.json({ success: true, message: "Bot started successfully", status: botState });
    } catch (error) {
      console.error("Failed to start bot:", error);
      res.status(500).json({ error: "Failed to start bot" });
    }
  });
  
  // Stop bot and activity generation
  app.post("/api/bot/stop", async (req, res) => {
    try {
      botState = {
        status: 'stopped',
        config: botState.config,
        startTime: null,
      };
      
      // Stop activity generation
      if (activityInterval) {
        clearInterval(activityInterval);
        activityInterval = null;
      }
      
      res.json({ success: true, message: "Bot stopped successfully", status: botState });
    } catch (error) {
      console.error("Failed to stop bot:", error);
      res.status(500).json({ error: "Failed to stop bot" });
    }
  });
  
  // Get bot activity feed
  app.get("/api/bot/activity", async (req, res) => {
    try {
      res.json(botActivityFeed);
    } catch (error) {
      console.error("Failed to fetch bot activity:", error);
      res.status(500).json({ error: "Failed to fetch bot activity" });
    }
  });
  
  // ===== CODEX ECOSYSTEM ROUTES =====
  
  // Get CODEX token info
  app.get("/api/codex/token", async (req, res) => {
    try {
      const token = await storage.getPlatformToken();
      res.json(token);
    } catch (error) {
      console.error("Failed to fetch token info:", error);
      res.status(500).json({ error: "Failed to fetch token info" });
    }
  });
  
  // Get user token holdings
  app.get("/api/codex/holdings/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();
      const holdings = await storage.getTokenHoldings(walletAddress);
      res.json(holdings);
    } catch (error) {
      console.error("Failed to fetch token holdings:", error);
      res.status(500).json({ error: "Failed to fetch token holdings" });
    }
  });
  
  // Get all NFT collections
  app.get("/api/codex/nft-collections", async (req, res) => {
    try {
      const collections = await storage.getPlatformNftCollections();
      res.json(collections);
    } catch (error) {
      console.error("Failed to fetch NFT collections:", error);
      res.status(500).json({ error: "Failed to fetch NFT collections" });
    }
  });
  
  // Get NFT collection by ID
  app.get("/api/codex/nft-collections/:id", async (req, res) => {
    try {
      const collection = await storage.getPlatformNftCollectionById(req.params.id);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      console.error("Failed to fetch NFT collection:", error);
      res.status(500).json({ error: "Failed to fetch NFT collection" });
    }
  });
  
  // Get user's NFTs
  app.get("/api/codex/nfts/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();
      const nfts = await storage.getPlatformUserNfts(walletAddress);
      res.json(nfts);
    } catch (error) {
      console.error("Failed to fetch user NFTs:", error);
      res.status(500).json({ error: "Failed to fetch user NFTs" });
    }
  });
  
  // Mint NFT for user
  app.post("/api/codex/nfts/mint", async (req, res) => {
    try {
      const mintSchema = z.object({
        collectionId: z.string(),
        walletAddress: z.string(),
        tokenId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        attributes: z.any().optional(),
      });
      
      const data = mintSchema.parse(req.body);
      const nft = await storage.createPlatformUserNft(data);
      res.status(201).json(nft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid NFT data", 
          details: error.errors 
        });
      }
      console.error("Failed to mint NFT:", error);
      res.status(500).json({ error: "Failed to mint NFT" });
    }
  });
  
  // Get all achievements
  app.get("/api/codex/achievements", async (req, res) => {
    try {
      const achievements = await storage.getPlatformAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });
  
  // Get user achievements
  app.get("/api/codex/achievements/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();
      const achievements = await storage.getPlatformUserAchievements(walletAddress);
      res.json(achievements);
    } catch (error) {
      console.error("Failed to fetch user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });
  
  // Update achievement progress
  app.post("/api/codex/achievements/progress", async (req, res) => {
    try {
      const progressSchema = z.object({
        walletAddress: z.string(),
        achievementId: z.string(),
        progress: z.any(),
        isCompleted: z.boolean().optional(),
      });
      
      const data = progressSchema.parse(req.body);
      const achievement = await storage.updatePlatformUserAchievement(data);
      res.json(achievement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid progress data", 
          details: error.errors 
        });
      }
      console.error("Failed to update achievement progress:", error);
      res.status(500).json({ error: "Failed to update achievement progress" });
    }
  });
  
  // Get all staking pools
  app.get("/api/codex/staking-pools", async (req, res) => {
    try {
      const pools = await storage.getCodexStakingPools();
      res.json(pools);
    } catch (error) {
      console.error("Failed to fetch staking pools:", error);
      res.status(500).json({ error: "Failed to fetch staking pools" });
    }
  });
  
  // Get staking pool by ID
  app.get("/api/codex/staking-pools/:id", async (req, res) => {
    try {
      const pool = await storage.getCodexStakingPoolById(req.params.id);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      res.json(pool);
    } catch (error) {
      console.error("Failed to fetch staking pool:", error);
      res.status(500).json({ error: "Failed to fetch staking pool" });
    }
  });
  
  // Get user stakes
  app.get("/api/codex/stakes/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();
      const stakes = await storage.getCodexUserStakes(walletAddress);
      res.json(stakes);
    } catch (error) {
      console.error("Failed to fetch user stakes:", error);
      res.status(500).json({ error: "Failed to fetch user stakes" });
    }
  });
  
  // Create new stake
  app.post("/api/codex/stakes", async (req, res) => {
    try {
      const stakeSchema = z.object({
        walletAddress: z.string(),
        poolId: z.string(),
        amount: z.string(),
        unlockDate: z.string(),
      });
      
      const data = stakeSchema.parse(req.body);
      const stake = await storage.createCodexUserStake(data);
      res.status(201).json(stake);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid stake data", 
          details: error.errors 
        });
      }
      console.error("Failed to create stake:", error);
      res.status(500).json({ error: "Failed to create stake" });
    }
  });
  
  // Claim stake rewards
  app.post("/api/codex/stakes/:stakeId/claim", async (req, res) => {
    try {
      const stake = await storage.claimCodexStakeRewards(req.params.stakeId);
      if (!stake) {
        return res.status(404).json({ error: "Stake not found" });
      }
      res.json(stake);
    } catch (error) {
      console.error("Failed to claim rewards:", error);
      res.status(500).json({ error: "Failed to claim rewards" });
    }
  });
  
  // Unstake (if lock period ended)
  app.post("/api/codex/stakes/:stakeId/unstake", async (req, res) => {
    try {
      const stake = await storage.unstakeCodex(req.params.stakeId);
      if (!stake) {
        return res.status(404).json({ error: "Stake not found or still locked" });
      }
      res.json(stake);
    } catch (error) {
      console.error("Failed to unstake:", error);
      res.status(500).json({ error: "Failed to unstake" });
    }
  });
  
  // Get NFT evolution history
  app.get("/api/codex/nfts/:nftId/evolution", async (req, res) => {
    try {
      const evolution = await storage.getPlatformNftEvolutionLog(req.params.nftId);
      res.json(evolution);
    } catch (error) {
      console.error("Failed to fetch NFT evolution:", error);
      res.status(500).json({ error: "Failed to fetch NFT evolution" });
    }
  });
  
  // Log NFT evolution event
  app.post("/api/codex/nfts/evolve", async (req, res) => {
    try {
      const evolveSchema = z.object({
        nftId: z.string(),
        evolutionType: z.string(),
        oldValue: z.any().optional(),
        newValue: z.any().optional(),
        trigger: z.string().optional(),
        aiAnalysis: z.string().optional(),
      });
      
      const data = evolveSchema.parse(req.body);
      const log = await storage.logPlatformNftEvolution(data);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid evolution data", 
          details: error.errors 
        });
      }
      console.error("Failed to log NFT evolution:", error);
      res.status(500).json({ error: "Failed to log NFT evolution" });
    }
  });

  // ========================
  // CODEX RELICS ROUTES
  // ========================

  // Get all relics catalog
  app.get("/api/codex/relics", async (req, res) => {
    try {
      const relics = await storage.getCodexRelics();
      res.json(relics);
    } catch (error) {
      console.error("Failed to fetch relics:", error);
      res.status(500).json({ error: "Failed to fetch relics" });
    }
  });

  // Get relics by class
  app.get("/api/codex/relics/class/:class", async (req, res) => {
    try {
      const relics = await storage.getCodexRelicsByClass(req.params.class);
      res.json(relics);
    } catch (error) {
      console.error("Failed to fetch relics by class:", error);
      res.status(500).json({ error: "Failed to fetch relics" });
    }
  });

  // Get user's relic instances
  app.get("/api/codex/relics/instances/:walletAddress", async (req, res) => {
    try {
      const instances = await storage.getCodexRelicInstances(req.params.walletAddress);
      res.json(instances);
    } catch (error) {
      console.error("Failed to fetch relic instances:", error);
      res.status(500).json({ error: "Failed to fetch relic instances" });
    }
  });

  // Get user's equipped relics
  app.get("/api/codex/relics/equipped/:walletAddress", async (req, res) => {
    try {
      const equipped = await storage.getCodexEquippedRelics(req.params.walletAddress);
      res.json(equipped);
    } catch (error) {
      console.error("Failed to fetch equipped relics:", error);
      res.status(500).json({ error: "Failed to fetch equipped relics" });
    }
  });

  // Equip a relic
  app.post("/api/codex/relics/equip", async (req, res) => {
    try {
      const equipSchema = z.object({
        instanceId: z.string(),
        slot: z.enum(['slot1', 'slot2', 'slot3'])
      });

      const data = equipSchema.parse(req.body);
      const updated = await storage.equipCodexRelic(data.instanceId, data.slot);

      if (!updated) {
        return res.status(404).json({ error: "Relic instance not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to equip relic:", error);
      res.status(500).json({ error: "Failed to equip relic" });
    }
  });

  // Unequip a relic
  app.post("/api/codex/relics/unequip", async (req, res) => {
    try {
      const unequipSchema = z.object({
        instanceId: z.string()
      });

      const data = unequipSchema.parse(req.body);
      const updated = await storage.unequipCodexRelic(data.instanceId);

      if (!updated) {
        return res.status(404).json({ error: "Relic instance not found" });
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to unequip relic:", error);
      res.status(500).json({ error: "Failed to unequip relic" });
    }
  });

  // Get relic progress for user
  app.get("/api/codex/relics/progress/:walletAddress", async (req, res) => {
    try {
      const progress = await storage.getCodexRelicProgress(req.params.walletAddress);
      res.json(progress);
    } catch (error) {
      console.error("Failed to fetch relic progress:", error);
      res.status(500).json({ error: "Failed to fetch relic progress" });
    }
  });

  // Claim a relic (when all requirements met)
  app.post("/api/codex/relics/claim", async (req, res) => {
    try {
      const claimSchema = z.object({
        relicId: z.string(),
        walletAddress: z.string()
      });

      const data = claimSchema.parse(req.body);
      const instance = await storage.claimCodexRelic(data.relicId, data.walletAddress);

      res.status(201).json(instance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to claim relic:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to claim relic" 
      });
    }
  });

  // Get active relic effects
  app.get("/api/codex/relics/effects/:walletAddress", async (req, res) => {
    try {
      const effects = await storage.getCodexRelicEffects(req.params.walletAddress);
      res.json(effects);
    } catch (error) {
      console.error("Failed to fetch relic effects:", error);
      res.status(500).json({ error: "Failed to fetch relic effects" });
    }
  });

  // ========================
  // AUTO-DEPLOY ROUTES
  // ========================

  // Generate default ERC-20 token configuration
  app.post("/api/auto-deploy/token/generate", async (req, res) => {
    try {
      const generateSchema = z.object({
        walletAddress: ethereumAddressSchema,
        chainId: z.string().optional(),
      });
      
      const data = generateSchema.parse(req.body);
      const defaultName = `AutoToken${Math.floor(Math.random() * 1000)}`;
      const defaultSymbol = `ATK${Math.floor(Math.random() * 100)}`;
      
      const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts@5.0.0/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts@5.0.0/access/Ownable.sol";

contract ${defaultSymbol} is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("${defaultName}", "${defaultSymbol}")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`;

      res.json({
        success: true,
        config: {
          name: defaultName,
          symbol: defaultSymbol,
          initialSupply: "1000000",
          decimals: "18",
          chainId: data.chainId || "1",
          features: ["mintable"],
        },
        contractCode,
        bytecode: "0x", // Would need compiler in production
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      console.error("Failed to generate token:", error);
      res.status(500).json({ error: "Failed to generate token configuration" });
    }
  });

  // Generate default ERC-721 NFT configuration
  app.post("/api/auto-deploy/nft/generate", async (req, res) => {
    try {
      const generateSchema = z.object({
        walletAddress: ethereumAddressSchema,
        chainId: z.string().optional(),
      });
      
      const data = generateSchema.parse(req.body);
      const defaultName = `AutoNFT${Math.floor(Math.random() * 1000)}`;
      const defaultSymbol = `ANFT${Math.floor(Math.random() * 100)}`;
      
      const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts@5.0.0/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@5.0.0/access/Ownable.sol";

contract ${defaultSymbol} is ERC721, Ownable {
    uint256 private _nextTokenId;
    uint256 public maxSupply = 10000;
    string private _baseTokenURI;

    constructor(address initialOwner)
        ERC721("${defaultName}", "${defaultSymbol}")
        Ownable(initialOwner)
    {
        _baseTokenURI = "ipfs://YOUR_CID/";
    }

    function mint(address to) public onlyOwner {
        require(_nextTokenId < maxSupply, "Max supply reached");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}`;

      res.json({
        success: true,
        config: {
          name: defaultName,
          symbol: defaultSymbol,
          maxSupply: "10000",
          chainId: data.chainId || "1",
          standard: "erc721",
          baseUri: "ipfs://YOUR_CID/",
        },
        contractCode,
        bytecode: "0x", // Would need compiler in production
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      console.error("Failed to generate NFT:", error);
      res.status(500).json({ error: "Failed to generate NFT configuration" });
    }
  });

  // Get user's deployed contracts
  app.get("/api/auto-deploy/contracts/:walletAddress", async (req, res) => {
    try {
      const walletAddress = ethereumAddressSchema.parse(req.params.walletAddress);
      const contracts = await storage.getContractsByTags(['auto-deployed']);
      
      // Filter by wallet address in description
      const userContracts = contracts.filter(c => 
        c.description?.includes(walletAddress.toLowerCase())
      );
      
      res.json(userContracts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      console.error("Failed to get deployed contracts:", error);
      res.status(500).json({ error: "Failed to get deployed contracts" });
    }
  });

  // Record deployed contract
  app.post("/api/auto-deploy/record", async (req, res) => {
    try {
      const recordSchema = z.object({
        contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
        chainId: z.string(),
        name: z.string(),
        symbol: z.string(),
        type: z.enum(["token", "nft"]),
        deployerAddress: ethereumAddressSchema,
        transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
        contractCode: z.string(),
        isDemo: z.boolean().optional(),
      });
      
      const data = recordSchema.parse(req.body);
      
      // Store in contracts table
      const contract = await storage.createContract({
        address: data.contractAddress,
        chainId: data.chainId,
        name: data.name,
        abi: data.type === "token" 
          ? [{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"}]
          : [{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"}],
        tags: [`auto-deployed`, data.type, data.isDemo ? 'demo' : 'live'],
        description: `Auto-deployed ${data.type} by ${data.deployerAddress.toLowerCase()}${data.isDemo ? ' (DEMO)' : ''}`,
        sourceCode: data.contractCode,
        compiler: "solc-0.8.20",
        isVerified: "false",
      });
      
      // If token, also create token record
      if (data.type === "token") {
        await storage.createToken({
          contractAddress: data.contractAddress,
          chainId: data.chainId,
          name: data.name,
          symbol: data.symbol,
          decimals: "18",
          isVerified: "false",
          totalSupply: "1000000000000000000000000",
        });
      }
      
      res.status(201).json({
        success: true,
        message: "Contract deployment recorded successfully",
        contract,
        explorerUrl: `https://etherscan.io/tx/${data.transactionHash}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid record data", 
          details: error.errors 
        });
      }
      console.error("Failed to record deployment:", error);
      res.status(500).json({ error: "Failed to record deployment" });
    }
  });
  
  // ===== MARKETPLACE ROUTES =====
  
  // Get all marketplace listings
  app.get("/api/marketplace/listings", async (req, res) => {
    try {
      const listings = await storage.getActiveMarketplaceListings();
      res.json(listings);
    } catch (error) {
      console.error("Failed to get marketplace listings:", error);
      res.status(500).json({ error: "Failed to get marketplace listings" });
    }
  });
  
  // Get listing by ID
  app.get("/api/marketplace/listings/:id", async (req, res) => {
    try {
      const listing = await storage.getMarketplaceListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Failed to get listing:", error);
      res.status(500).json({ error: "Failed to get listing" });
    }
  });
  
  // Get seller's listings
  app.get("/api/marketplace/my-listings", async (req, res) => {
    try {
      const { wallet } = req.query;
      if (!wallet || typeof wallet !== 'string') {
        return res.status(400).json({ error: "Wallet address required" });
      }
      const listings = await storage.getSellerListings(wallet.toLowerCase());
      res.json(listings);
    } catch (error) {
      console.error("Failed to get seller listings:", error);
      res.status(500).json({ error: "Failed to get seller listings" });
    }
  });
  
  // Get buyer's purchases
  app.get("/api/marketplace/my-purchases", async (req, res) => {
    try {
      const { wallet } = req.query;
      if (!wallet || typeof wallet !== 'string') {
        return res.status(400).json({ error: "Wallet address required" });
      }
      const purchases = await storage.getBuyerPurchases(wallet.toLowerCase());
      res.json(purchases);
    } catch (error) {
      console.error("Failed to get purchases:", error);
      res.status(500).json({ error: "Failed to get purchases" });
    }
  });
  
  // Create marketplace listing
  app.post("/api/marketplace/listings", async (req, res) => {
    try {
      const listingSchema = z.object({
        itemType: z.enum(['nft', 'token', 'product']),
        itemId: z.string(),
        sellerWallet: ethereumAddressSchema,
        priceEth: z.string(),
        title: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        metadata: z.any().optional(),
      });
      
      const data = listingSchema.parse(req.body);
      const listing = await storage.createMarketplaceListing({
        ...data,
        sellerWallet: data.sellerWallet.toLowerCase(),
        status: 'active',
      });
      
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid listing data", 
          details: error.errors 
        });
      }
      console.error("Failed to create listing:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });
  
  // Cancel listing
  app.post("/api/marketplace/listings/:id/cancel", async (req, res) => {
    try {
      const { sellerWallet } = req.body;
      if (!sellerWallet) {
        return res.status(400).json({ error: "Seller wallet address required" });
      }
      
      const listing = await storage.cancelMarketplaceListing(req.params.id, sellerWallet.toLowerCase());
      if (!listing) {
        return res.status(404).json({ error: "Listing not found or unauthorized" });
      }
      
      res.json(listing);
    } catch (error) {
      console.error("Failed to cancel listing:", error);
      res.status(500).json({ error: "Failed to cancel listing" });
    }
  });
  
  // Purchase listing
  app.post("/api/marketplace/listings/:id/purchase", async (req, res) => {
    try {
      const { buyerWallet } = req.body;
      if (!buyerWallet) {
        return res.status(400).json({ error: "Buyer wallet address required" });
      }
      
      const listing = await storage.purchaseMarketplaceListing(req.params.id, buyerWallet.toLowerCase());
      if (!listing) {
        return res.status(404).json({ error: "Listing not found or no longer available" });
      }
      
      res.json(listing);
    } catch (error) {
      console.error("Failed to purchase listing:", error);
      res.status(500).json({ error: "Failed to purchase listing" });
    }
  });

  // ============================================================================
  // YIELD FARMING ROUTES
  // ============================================================================

  // Get all farm pools
  app.get("/api/yield-farming/pools", async (req, res) => {
    try {
      const pools = await storage.getActiveYieldFarmPools();
      
      // Calculate updated rewards for all positions
      const updatedPools = await Promise.all(pools.map(async (pool) => {
        const positions = await storage.getPoolPositions(pool.id);
        const totalDeposits = positions.reduce((sum, pos) => sum + parseFloat(pos.amount), 0);
        
        return {
          ...pool,
          tvl: totalDeposits.toString()
        };
      }));
      
      res.json(updatedPools);
    } catch (error) {
      console.error("Failed to fetch farm pools:", error);
      res.status(500).json({ error: "Failed to fetch farm pools" });
    }
  });

  // Get user positions
  app.get("/api/yield-farming/positions/:user", async (req, res) => {
    try {
      const positions = await storage.getUserYieldFarmPositions(req.params.user);
      
      // Update rewards for each position
      const now = new Date();
      const updatedPositions = await Promise.all(positions.map(async (position) => {
        const pool = await storage.getYieldFarmPool(position.poolId);
        if (!pool) return position;
        
        // Calculate time-based rewards
        const lastUpdate = position.lastRewardUpdate || position.depositDate;
        const timeDiff = (now.getTime() - new Date(lastUpdate).getTime()) / 1000; // seconds
        const yearSeconds = 365 * 24 * 60 * 60;
        
        // Calculate new rewards
        const apy = parseFloat(pool.apy);
        const amount = parseFloat(position.amount);
        const newRewards = (amount * apy / 100) * (timeDiff / yearSeconds);
        const totalRewards = parseFloat(position.rewards) + newRewards;
        
        // Update position with new rewards
        await storage.updateYieldFarmPosition(position.id, {
          rewards: totalRewards.toString(),
          lastRewardUpdate: now
        });
        
        return {
          ...position,
          rewards: totalRewards.toString()
        };
      }));
      
      res.json(updatedPositions);
    } catch (error) {
      console.error("Failed to fetch user positions:", error);
      res.status(500).json({ error: "Failed to fetch user positions" });
    }
  });

  // Deposit to farm
  app.post("/api/yield-farming/deposit", async (req, res) => {
    try {
      const depositSchema = z.object({
        poolId: z.string(),
        user: z.string(),
        amount: z.string(),
      });

      const data = depositSchema.parse(req.body);
      
      // Get pool to validate
      const pool = await storage.getYieldFarmPool(data.poolId);
      if (!pool || pool.status !== 'active') {
        return res.status(400).json({ error: "Pool not available" });
      }
      
      // Create position
      const position = await storage.createYieldFarmPosition({
        poolId: data.poolId,
        user: data.user,
        amount: data.amount,
        rewards: "0",
        autoCompound: "false",
        harvestCount: "0",
        totalRewardsEarned: "0"
      });
      
      // Update pool TVL
      const positions = await storage.getPoolPositions(data.poolId);
      const totalTvl = positions.reduce((sum, pos) => sum + parseFloat(pos.amount), 0);
      await storage.updateYieldFarmPool(data.poolId, {
        tvl: totalTvl.toString()
      });
      
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid deposit data", 
          details: error.errors 
        });
      }
      console.error("Failed to deposit:", error);
      res.status(500).json({ error: "Failed to deposit" });
    }
  });

  // Withdraw from farm
  app.post("/api/yield-farming/withdraw", async (req, res) => {
    try {
      const withdrawSchema = z.object({
        positionId: z.string(),
        user: z.string(),
        amount: z.string(),
      });

      const data = withdrawSchema.parse(req.body);
      
      // Get position
      const position = await storage.getYieldFarmPosition(data.positionId);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      // Verify user
      if (position.user.toLowerCase() !== data.user.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const withdrawAmount = parseFloat(data.amount);
      const currentAmount = parseFloat(position.amount);
      
      if (withdrawAmount > currentAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // If withdrawing everything, delete position
      if (withdrawAmount >= currentAmount) {
        await storage.deleteYieldFarmPosition(data.positionId);
      } else {
        // Update position amount
        await storage.updateYieldFarmPosition(data.positionId, {
          amount: (currentAmount - withdrawAmount).toString()
        });
      }
      
      // Update pool TVL
      const pool = await storage.getYieldFarmPool(position.poolId);
      if (pool) {
        const positions = await storage.getPoolPositions(position.poolId);
        const totalTvl = positions.reduce((sum, pos) => sum + parseFloat(pos.amount), 0);
        await storage.updateYieldFarmPool(position.poolId, {
          tvl: totalTvl.toString()
        });
      }
      
      res.json({ 
        success: true, 
        withdrawnAmount: withdrawAmount,
        rewards: position.rewards 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid withdrawal data", 
          details: error.errors 
        });
      }
      console.error("Failed to withdraw:", error);
      res.status(500).json({ error: "Failed to withdraw" });
    }
  });

  // Harvest rewards
  app.post("/api/yield-farming/harvest", async (req, res) => {
    try {
      const harvestSchema = z.object({
        positionId: z.string(),
        user: z.string(),
      });

      const data = harvestSchema.parse(req.body);
      
      // Get position
      const position = await storage.getYieldFarmPosition(data.positionId);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      // Verify user
      if (position.user.toLowerCase() !== data.user.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const rewards = parseFloat(position.rewards);
      if (rewards <= 0) {
        return res.status(400).json({ error: "No rewards to harvest" });
      }
      
      // Update position
      const newHarvestCount = parseInt(position.harvestCount) + 1;
      const newTotalEarned = parseFloat(position.totalRewardsEarned) + rewards;
      
      await storage.updateYieldFarmPosition(data.positionId, {
        rewards: "0",
        harvestCount: newHarvestCount.toString(),
        totalRewardsEarned: newTotalEarned.toString()
      });
      
      res.json({ 
        success: true, 
        harvested: rewards,
        totalEarned: newTotalEarned
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid harvest data", 
          details: error.errors 
        });
      }
      console.error("Failed to harvest:", error);
      res.status(500).json({ error: "Failed to harvest" });
    }
  });

  // Toggle auto-compound
  app.post("/api/yield-farming/auto-compound", async (req, res) => {
    try {
      const autoCompoundSchema = z.object({
        positionId: z.string(),
        user: z.string(),
        enabled: z.boolean(),
      });

      const data = autoCompoundSchema.parse(req.body);
      
      // Get position
      const position = await storage.getYieldFarmPosition(data.positionId);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      // Verify user
      if (position.user.toLowerCase() !== data.user.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Update auto-compound setting
      await storage.updateYieldFarmPosition(data.positionId, {
        autoCompound: data.enabled.toString()
      });
      
      res.json({ success: true, autoCompound: data.enabled });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid auto-compound data", 
          details: error.errors 
        });
      }
      console.error("Failed to update auto-compound:", error);
      res.status(500).json({ error: "Failed to update auto-compound" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
