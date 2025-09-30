# Overview

This project is a comprehensive Web3 blockchain platform, "Web3 Blockchain Empire," built with React and Express. It provides a complete cryptocurrency ecosystem featuring multi-chain wallet integration (MetaMask), multi-crypto deposits (BTC, ETH, SOL, LTC, DOGE), and universal crypto payments (300+ cryptocurrencies via NOWPayments). Advanced tools include ERC-20 Token and ERC-721/ERC-1155 NFT creators. The platform also integrates an AI-powered Sentinel Auto Trading Bot with diverse strategies, Coinbase Pro integration (pending update to Advanced Trade API), and robust transaction management.

A key differentiator is its "divine visual experience," employing cosmic aesthetics, interactive UI effects, shadcn/ui, and Tailwind CSS for an immersive user interface. The platform is designed for production use, offering smart contract generators, automated trading, and a blockchain-native e-commerce payment system with features like multi-currency support, discount codes, gift cards, loyalty programs, product reviews, wishlists, invoices, and on-chain NFT receipts, all backed by a PostgreSQL database. It also includes a robust Social Media Automation System for Twitter/X.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend utilizes React with TypeScript, Vite, and a component-based structure. It leverages shadcn/ui on Radix UI primitives, styled with Tailwind CSS. State management is handled by React hooks and TanStack Query, with Wouter for client-side routing. A custom Web3 hook enables MetaMask integration. The UI incorporates a "Divine Visual System" with cosmic backgrounds, interactive effects (e.g., cosmic cursor, 3D card tilt, parallax), and advanced animations.

### Complete Frontend Pages (30+ Routes)
**E-Commerce & Payments:**
- `/subscriptions` - Subscription plans with trial periods, billing management, and cancellation
- `/affiliate` - Affiliate dashboard with earnings tracking, referral links, and commission history
- `/gift-cards` - Gift card purchase and redemption with blockchain verification
- `/loyalty` - Loyalty points dashboard with tier progression (Bronze/Silver/Gold/Platinum)
- `/cart-recovery` - Abandoned cart recovery with 7-day persistence and expiry warnings
- `/admin/discounts` - Discount code management with usage tracking and expiration
- `/crypto-payments` - Universal crypto payment interface supporting 300+ cryptocurrencies
- `/checkout` - Multi-currency checkout with discount codes and gift card redemption
- `/orders` - Order history and tracking with blockchain verification

**Web3 & Blockchain:**
- `/wallet` - Wallet management with balance tracking and transaction history
- `/tokens` - Token portfolio with multi-chain support
- `/deposits` - Multi-crypto deposit interface (BTC, ETH, SOL, LTC, DOGE)
- `/transactions` - Transaction history with blockchain explorer links
- `/contracts` - Smart contract interaction interface
- `/nfts` - NFT gallery and management

**Smart Contract Creators:**
- `/token-creator` - ERC-20 token generator with mintable/burnable/pausable features
- `/nft-creator` - ERC-721/721A/1155 NFT creator with IPFS integration

**Trading & Automation:**
- `/sentinel-bot` - AI-powered auto trading bot configuration
- `/bot-dashboard` - Trading bot performance dashboard with real-time metrics
- `/bot-config` - Strategy configuration for automated trading
- `/empire` - Empire dashboard with comprehensive analytics
- `/vaults` - House vaults staking interface with APY tracking
- `/auto-compound` - Auto-compound configuration for yield optimization

**Content & Social:**
- `/games` - Gaming interface
- `/play` - Game play area
- `/social-automation` - Twitter/X automation scheduler and post management

### Reusable UI Components
**Product & Commerce:**
- `ProductRecommendations` - Smart product suggestions (related, upsell, cross-sell) with relevance scoring
- `FlashSalesBanner` - Real-time countdown timers with stock progress and discount badges
- `RecentlyViewed` - Browsing history with quick add-to-cart functionality
- `ProductVariants` - Dynamic attribute selector (size, color) with stock tracking and price adjustments
- `PreOrderInterface` - Partial deposit calculator with release date tracking and payment breakdown
- `CustomerTierBadge` - VIP/Wholesale status indicator with tooltip benefits display

**Infrastructure:**
- `Navigation` - Main navigation with wallet connection
- `ConnectionModal` - Wallet connection modal (MetaMask, WalletConnect)
- `CosmicCursor` - Custom cursor with cosmic trail effects

## Backend Architecture
The backend is an Express.js and TypeScript REST API with modular routes for transactions, wallet operations, and network information. It uses an interface-based storage layer with in-memory and PostgreSQL implementations.

## Database Design
PostgreSQL is the primary database, managed with Drizzle ORM. Key tables include `Users`, `Wallets`, `Transactions`, `NetworkInfo`, and specific tables for social media automation, custom payment system, discount codes, gift cards, loyalty points, product reviews, wishlists, invoices, and NFT receipts. UUIDs are used for primary keys, with foreign key relationships and JSONB for metadata.

## Web3 Integration
MetaMask is integrated via the Ethereum provider API, supporting multiple networks (Ethereum, testnets, Polygon). It manages wallet connections, account data, balance retrieval, transaction sending, and network switching.

## Smart Contract Generators
Production-ready generators for ERC-20 tokens (mintable, burnable, pausable) and ERC-721, ERC-721A, ERC-1155 NFTs with IPFS integration.

## Multi-Cryptocurrency Support
Supports BTC, ETH, SOL, LTC, DOGE deposits with QR code generation. Integrates NOWPayments for universal payments across 300+ cryptocurrencies.

## Sentinel Auto Trading Bot
An automated trading bot for Coinbase Pro (requires migration to Advanced Trade API for production) with a backend trading engine, specific database schema, and API routes. It offers five trading strategies, configurable risk management, and real-time monitoring.

## House Vaults System
A player-owned liquidity system allowing ETH staking with varying APY and lock periods, integrated into the Empire Dashboard.

## Social Media Automation System
Automated posting to Twitter/X every 3 hours. Features include multi-account management, flexible scheduling, post history, real-time monitoring, and secure API integration (Twitter API v2). Fully operational with PostgreSQL persistence.

## Custom Payment System
A blockchain-native e-commerce payment system offering instant settlement, no chargebacks, lower fees, and multi-chain support (Ethereum, Base, Polygon, Sepolia). It includes product management, a shopping cart, multi-payment options (MetaMask, NOWPayments), blockchain verification, and order management. Security features include server-side amount calculation, on-chain verification, transaction hash uniqueness, customer wallet binding, and chain validation.

## Masterpiece E-Commerce Features (20+ Advanced Systems)

### Payment & Commerce Foundation
- **Multi-Currency & Stablecoin Support**: ETH, USDC, DAI, USDT, MATIC across 4 chains with real-time price conversion API
- **Discount Codes System**: Percentage/fixed discounts, usage limits, expiry dates, and minimum purchase requirements
- **Gift Cards System**: Blockchain-native gift cards with balance tracking and partial redemption
- **Invoice & Payment Links**: Shareable B2B payment invoices with multi-currency support
- **Refund System**: Partial/full refunds with on-chain tracking and blockchain verification

### Customer Loyalty & Engagement
- **Loyalty Points System**: Wallet-based loyalty with automatic point earning (1% per transaction), redemption, and tiered rewards (Bronze/Silver/Gold/Platinum)
- **Customer Tier System**: VIP and wholesale pricing tiers with automatic discount application and exclusive benefits
- **Product Reviews System**: Blockchain-verified reviews requiring verified purchases
- **Wishlist System**: Wallet-based product wishlists with persistent storage
- **Recently Viewed**: Track product browsing history for personalized recommendations

### Advanced Sales & Marketing
- **Subscription/Recurring Payments**: Automated blockchain-based billing for subscriptions with trial periods, pause/cancel functionality
- **Affiliate & Referral System**: On-chain commission tracking with unique referral codes, automated payouts, and detailed earnings dashboard
- **Flash Sales System**: Time-limited offers with countdown timers, limited quantity tracking, and automatic status management
- **Pre-Order System**: Accept pre-orders with partial deposits, expected release dates, and automatic fulfillment tracking
- **Product Variants**: Size, color, and attribute variations with independent pricing and inventory management
- **Product Recommendations**: AI-powered cross-sell, upsell, and related product suggestions with relevance scoring

### Conversion & Analytics
- **Abandoned Cart Recovery**: 7-day cart persistence with conversion tracking and recovery email capability
- **On-Chain NFT Receipts**: Mint permanent proof-of-purchase NFTs for high-value transactions

**Total Infrastructure**: 
- Backend: 20 database tables, 70+ API endpoints, full TypeScript type safety
- Frontend: 30+ routes, 12+ pages, 6 reusable components, complete UI for all features
- All features wallet-integrated with real-time updates and responsive design

# External Dependencies

## Core Technologies
- React & TypeScript
- Express.js
- Vite
- Drizzle ORM
- TanStack Query

## UI & Styling
- shadcn/ui
- Tailwind CSS
- Radix UI
- Lucide React

## Web3 & Blockchain
- MetaMask SDK
- Ethereum Provider API

## Database & Storage
- PostgreSQL (via Neon serverless)
- connect-pg-simple

## Third-Party Integrations
- Zod (validation)
- date-fns (date utilities)
- Wouter (routing)
- node-cron (scheduling)
- NOWPayments API (universal crypto payments)
- Coinbase Pro SDK (for Sentinel Auto Trading Bot - **Note: Requires migration to Coinbase Advanced Trade API for production**)
- Twitter API v2 SDK (twitter-api-v2) (for Social Media Automation)