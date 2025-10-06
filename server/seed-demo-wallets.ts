import { db } from "./storage";
import { users, wallets, userPreferences, tokens, tokenBalances } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import type { IStorage } from "./storage";

export async function seedDemoWallets(storage: IStorage) {
  console.log("🔐 Seeding demo wallets for owner...");
  
  // Get or create owner user
  const [owner] = await db.select().from(users).where(eq(users.isOwner, "true")).limit(1);
  
  let ownerId: string;
  if (!owner) {
    console.log("Creating owner user...");
    const [newOwner] = await db.insert(users).values({
      username: "empire_owner",
      password: "owner_password_hash",
      isOwner: "true",
    }).returning();
    ownerId = newOwner.id;
  } else {
    ownerId = owner.id;
  }
  
  console.log(`✅ Owner user ID: ${ownerId}`);
  
  // Demo wallet addresses with realistic balances
  const demoWallets = [
    {
      address: "0x742d35Cc6673C4532A9C2C04E9d8c4A5c8F3C1d5",
      balance: "5250000000000000000", // 5.25 ETH
      network: "mainnet",
    },
    {
      address: "0x1A2B3C4D5E6F7890ABCDEF1234567890ABCDEF12",
      balance: "2100000000000000000", // 2.1 ETH
      network: "mainnet",
    },
    {
      address: "0x9876543210FEDCBA0987654321FEDCBA09876543",
      balance: "12500000000000000000", // 12.5 ETH
      network: "mainnet",
    },
  ];
  
  let primaryWalletId: string | null = null;
  
  for (const walletData of demoWallets) {
    try {
      // Check if wallet already exists
      const [existing] = await db.select().from(wallets).where(eq(wallets.address, walletData.address)).limit(1);
      
      if (!existing) {
        const [newWallet] = await db.insert(wallets).values({
          address: walletData.address,
          userId: ownerId,
          balance: walletData.balance,
          network: walletData.network,
        }).returning();
        console.log(`✅ Created wallet ${walletData.address.slice(0, 10)}... with ${parseFloat(walletData.balance) / 1e18} ETH`);
        if (!primaryWalletId) primaryWalletId = newWallet.id;
      } else {
        // Update to link to owner if not linked
        if (!existing.userId) {
          await db.update(wallets)
            .set({ userId: ownerId, balance: walletData.balance })
            .where(eq(wallets.address, walletData.address));
          console.log(`✅ Linked existing wallet ${walletData.address.slice(0, 10)}... to owner`);
        } else {
          console.log(`⏭️  Wallet ${walletData.address.slice(0, 10)}... already exists`);
        }
        if (!primaryWalletId) primaryWalletId = existing.id;
      }
    } catch (error) {
      console.error(`Failed to seed wallet ${walletData.address}:`, error);
    }
  }
  
  // Create or update user preferences with auto-connect enabled
  try {
    const [existingPrefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, ownerId)).limit(1);
    
    if (!existingPrefs) {
      await db.insert(userPreferences).values({
        userId: ownerId,
        autoLoginEnabled: "true",
        autoConnectEnabled: "true",
        lastWalletId: primaryWalletId,
      });
      console.log("✅ Created user preferences with auto-connect enabled");
    } else {
      await db.update(userPreferences)
        .set({
          autoConnectEnabled: "true",
          autoLoginEnabled: "true",
          lastWalletId: primaryWalletId || existingPrefs.lastWalletId,
        })
        .where(eq(userPreferences.userId, ownerId));
      console.log("✅ Updated user preferences to enable auto-connect");
    }
  } catch (error) {
    console.error("Failed to update preferences:", error);
  }
  
  // Seed token balances for demo purposes
  console.log("🪙 Seeding token balances...");
  
  // First, ensure we have some tokens in the system
  const demoTokens = [
    {
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      chainId: "1",
      name: "USD Coin",
      symbol: "USDC",
      decimals: "6",
      isVerified: "true",
    },
    {
      contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      chainId: "1",
      name: "Tether USD",
      symbol: "USDT",
      decimals: "6",
      isVerified: "true",
    },
    {
      contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      chainId: "1",
      name: "Dai Stablecoin",
      symbol: "DAI",
      decimals: "18",
      isVerified: "true",
    },
  ];
  
  const tokenIds: Record<string, string> = {};
  
  for (const tokenData of demoTokens) {
    try {
      const [existing] = await db.select().from(tokens).where(and(
        eq(tokens.contractAddress, tokenData.contractAddress),
        eq(tokens.chainId, tokenData.chainId)
      )).limit(1);
      
      if (!existing) {
        const [newToken] = await db.insert(tokens).values(tokenData).returning();
        tokenIds[tokenData.symbol] = newToken.id;
        console.log(`✅ Created token ${tokenData.symbol}`);
      } else {
        tokenIds[tokenData.symbol] = existing.id;
        console.log(`⏭️  Token ${tokenData.symbol} already exists`);
      }
    } catch (error) {
      console.error(`Failed to seed token ${tokenData.symbol}:`, error);
    }
  }
  
  // Add token balances to the first wallet
  const firstWallet = demoWallets[0].address;
  const tokenBalanceData = [
    { symbol: "USDC", balance: "15000000000", tokenId: tokenIds["USDC"] }, // 15,000 USDC
    { symbol: "USDT", balance: "8500000000", tokenId: tokenIds["USDT"] }, // 8,500 USDT
    { symbol: "DAI", balance: "3200000000000000000000", tokenId: tokenIds["DAI"] }, // 3,200 DAI
  ];
  
  for (const balanceData of tokenBalanceData) {
    if (!balanceData.tokenId) continue;
    
    try {
      const [existing] = await db.select().from(tokenBalances).where(and(
        eq(tokenBalances.walletAddress, firstWallet),
        eq(tokenBalances.tokenId, balanceData.tokenId)
      )).limit(1);
      
      if (!existing) {
        await db.insert(tokenBalances).values({
          walletAddress: firstWallet,
          tokenId: balanceData.tokenId,
          balance: balanceData.balance,
        });
        console.log(`✅ Added ${balanceData.symbol} balance to wallet`);
      } else {
        await db.update(tokenBalances)
          .set({ balance: balanceData.balance })
          .where(and(
            eq(tokenBalances.walletAddress, firstWallet),
            eq(tokenBalances.tokenId, balanceData.tokenId)
          ));
        console.log(`⏭️  Updated ${balanceData.symbol} balance for wallet`);
      }
    } catch (error) {
      console.error(`Failed to seed ${balanceData.symbol} balance:`, error);
    }
  }
  
  console.log("✅ Demo wallet seeding complete!");
}
