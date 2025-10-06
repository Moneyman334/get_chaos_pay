# Overview
"Web3 Blockchain Empire" is a comprehensive Web3 blockchain platform aiming to be a complete cryptocurrency ecosystem. It features multi-chain wallet integration, multi-crypto deposits, universal crypto payments, and advanced tools like ERC-20 Token and NFT creators, an AI-powered Sentinel Auto Trading Bot, and robust transaction management. The platform emphasizes a "divine visual experience" with cosmic aesthetics and interactive UI, targeting production readiness. Business ambitions include a blockchain-native e-commerce payment system with multi-currency support, loyalty programs, on-chain NFT receipts, and a Social Media Automation System for Twitter/X.

# Recent Changes

## October 2025 - Critical System Updates and Fixes

### Fetch API Bug Fix (Critical)
Fixed critical bug in `client/src/lib/queryClient.ts` where GET and HEAD requests incorrectly included request bodies, causing "Window.fetch: HEAD or GET Request cannot have a body" errors. The `apiRequest` function now properly excludes body content for GET/HEAD methods using method type checking before sending requests.

**Impact**: This fix resolved widespread API communication issues across the platform, improving stability and reliability of all data fetching operations.

### Wallet Money Updates - Verified Working
Confirmed wallet balance updates are functioning correctly through direct blockchain RPC calls:
- Balances fetched via `eth_getBalance` directly from blockchain nodes
- Automatic updates triggered by `accountsChanged` and `chainChanged` events
- Manual refresh capability through `refreshBalance` function in `useWeb3` hook
- Real-time balance synchronization across all wallet displays

**Technical Details**: The `WalletNexusProvider` manages session state with wallet maps, primary wallet designation, and total USD balance calculations. All wallet data persists in localStorage for seamless reconnection across sessions.

### Coinbase Wallet Integration - Fully Functional
Verified complete Coinbase Wallet integration with comprehensive detection and connection flow:
- Multi-method detection: `window.coinbaseWalletExtension`, `ethereum.isCoinbaseWallet` flag, and providers array checking
- Full `CoinbaseConnector` implementation with all required methods: connect, disconnect, getBalance, signMessage, sendTransaction, switchChain
- Event listeners for account changes, chain changes, and disconnection
- Proper installation status detection and user feedback
- Mobile support with deep linking to Coinbase Wallet app

**UI Integration**: Connection modal properly displays Coinbase Wallet (🔵) alongside MetaMask (🦊) with install status indicators and one-click connection flow.

### Money Overview Analytics - Data Validation
Confirmed the Owner Analytics Dashboard (`/owner-analytics`) correctly displays comprehensive platform metrics:
- **Total Revenue**: Real-time calculation from completed orders via `/api/orders` endpoint
- **Total Orders**: Live count of all platform transactions
- **Avg Order Value**: Dynamic computation (totalRevenue / totalOrders)
- **Active Users**: Statistics from `/api/users/stats` endpoint
- **Trading Volume**: Platform-wide trading activity metrics
- **Staking TVL**: Total value locked in staking pools

All metric cards feature proper formatting, trend indicators, icons, and real-time data refresh capabilities.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a "Divine Visual System" with a cosmic theme (purple/blue gradients, star effects, animated backgrounds), interactive elements (hover effects, 3D card tilts, parallax scrolling), a custom cosmic trail cursor, and glassmorphism. It uses shadcn/ui and Tailwind CSS for a consistent, accessible, and responsive design, adhering to WCAG AA standards.

**Image Strategy**:
- Casino Token Ecosystem (Medusa NFTs/Relics): Uses imported static assets from `attached_assets/` directory
- CODEX Relics: Uses external placeholder images via picsum.photos with unique seeded URLs per class/tier combination (9 total relics)
- CODEX NFTs: Type-safe rendering with proper TypeScript interfaces and fallback handling
- All images display with proper loading states and responsive sizing

## Technical Implementations

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query v5 for server state management. It includes a `useWeb3` hook for MetaMask integration, React Hook Form with Zod for validation, and performance optimizations like code splitting and lazy loading. Error handling incorporates React Error Boundaries, network status monitoring, automatic retry, and toast notifications. A comprehensive User Preferences & Analytics System tracks user behavior, manages settings via `localStorage`, and provides an analytics dashboard.

### Backend
The backend is an Express.js and TypeScript REST API with modular routes. It uses PostgreSQL and Drizzle ORM. The API architecture includes over 70 RESTful endpoints with rate limiting, authentication, Zod validation, and a storage layer. Real-time services include an Auto-Compound Engine, Social Media Scheduler, Trading Bot Engine, and **Real-Time Price Service** (CoinGecko API with 5-minute auto-refresh for live crypto prices), designed for stability with graceful shutdown handling.

**Security Fortress**: The platform is configured as an "indestructible fortress" with comprehensive multi-layer security:
- **Multi-Tier Rate Limiting**: STRICT (10/15min) for auth, TRADING (60/min) for bot/orders, PAYMENT (20/15min) for payments, MODERATE (100/15min) for general API, RELAXED (500/15min) for public data
- **Dual Protection**: All critical endpoints (auth, payments, trading, staking, vaults) use both rate limiting AND speed limiting (gradual slowdown after 50% of limit)
- **Transaction Fraud Detection**: Real-time risk analysis with scoring system (0-100), auto-rejection of high-risk transactions, flagging of medium-risk for review
- **Hardened CSP**: Content-Security-Policy without unsafe-inline or unsafe-eval, strict script-src/style-src directives
- **Security Headers**: HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **IPv6-Safe Rate Limiting**: Uses default key generator to prevent IPv6 bypass vulnerabilities
- **Input Sanitization**: Recursive XSS/injection pattern detection on all request bodies and query params
- **CORS Hardening**: Strict origin validation with credentials support
- **Secure Error Handling**: Generic error messages in production, detailed logging for debugging
- **Request Signing & Validation**: Middleware for signature verification and timestamp validation (available for high-security routes)

**Real-Time Price Oracle**: Integrated CoinGecko API provides live cryptocurrency prices for ETH, BTC, USDC, USDT, DAI, SOL, LTC, DOGE, MATIC, WBTC, and CDX. The price service auto-initializes on server startup and refreshes every 5 minutes. API endpoints at `/api/prices` and `/api/prices/:symbol` serve current USD values with timestamps. This replaces all hardcoded price values throughout the platform, ensuring accurate trading calculations, order valuations, and wallet balances.

**Platform Revenue Dashboard**: Comprehensive revenue tracking system at `/api/platform/revenue` aggregates all platform earnings: e-commerce sales (completed orders), marketplace fees (2% on sales), trading bot performance fees (10% of profits), subscription revenue (paid billings), and pending affiliate payouts. Supports 7-day, 30-day, and 90-day period filters with detailed breakdowns by source, transaction counts, and average transaction values.

**Owner/Admin Protection System**: A secure authentication system protects owner-only routes and dashboards. The `requireOwner` middleware verifies session-based authentication (no header spoofing) and checks the user's `isOwner` database flag. Protected routes include Command Center, Marketing Dashboards, Social Automation, Admin Discounts, Admin Flash Sales, Owner Analytics, and Platform Revenue Dashboard. The frontend `ProtectedRoute` component enforces access control by checking `/api/auth/me` and redirecting unauthorized users to the home page.


## Feature Specifications

### Web3 & Blockchain
- **Auto-Deploy System**: A production-quality demo for one-click token and NFT deployment, generating ERC-20 tokens and ERC-721 NFTs with IPFS readiness.
- **Codex Wallet Nexus**: A multi-wallet management system supporting unlimited simultaneous wallet connections (MetaMask, Coinbase Wallet), a unified interface, primary wallet designation, session persistence, balance aggregation, and multi-chain support (EVM chains).
- **CODEX ECOSYSTEM**: A complete platform token economy including a platform token (CDX), four NFT collections, four staking pools with NFT holder multipliers, eight AI-powered dynamic Living Achievements, and a Relics System with 9 soulbound artifacts providing passive ecosystem boosts. The **Forge System** enables players to craft relics by burning CDX tokens and materials with configurable success rates and crafting times. Forge features include recipe browser, material inventory management, active crafting session tracking, and time-based completion mechanics. It includes 30+ API endpoints and 5 frontend pages.
- **Multi-Chain Wallet Integration**: Primarily MetaMask for connections, account data, balances, and transaction signing.
- **Advanced Wallet Security Protection**: Database-persisted security system with Transaction Validation Engine, Velocity Limits, Emergency Lockdown Mode, Fraud Detection, Persistent Blacklist/Whitelist (PostgreSQL-backed with case-insensitive address normalization), Spending Limits, and AI Sentinel Monitoring. Security alerts are automatically pruned (max 100 per wallet). Trusted/blocked addresses persist across server restarts.
- **Smart Contract Generators**: Production-ready ERC-20 token and ERC-721/721A/1155 NFT creators with IPFS placeholders. Note: Full IPFS integration requires external service setup (e.g., Pinata, NFT.Storage, or Infura IPFS) - currently uses placeholder URIs `ipfs://YOUR_CID/`.
- **Multi-Cryptocurrency Support**: Deposits for BTC, ETH, SOL, LTC, DOGE, and universal payments for 300+ cryptocurrencies via NOWPayments.
- **Marketplace System**: Complete peer-to-peer marketplace for trading NFTs, Tokens, and Products with REST API, database support, and secure transaction handling.

### Trading & Automation
- **Buy & Trade Crypto Platform**: A comprehensive trading interface with a real-time order book, multiple order types, various trading pairs, live price ticker, order history, and trading statistics dashboard.
- **Auto Trading Bot**: An advanced AI-powered bot with real-time activity feed, demo/live modes, five trading strategies, an emergency stop button, performance dashboard, and risk management configurations.
- **House Vaults System**: Player-owned liquidity system for ETH staking with varying APY and lock periods.
- **Yield Farming System**: Complete LP token staking platform with 4 active farm pools (ETH-USDC 85.5% APY, BTC-ETH 120% APY, DAI-USDT 45.2% APY, MATIC-USDC 95.8% APY). Features include deposit/withdraw functionality, real-time reward calculation, harvest rewards, auto-compound toggle, position management, and TVL tracking. Backend includes 6 API endpoints (`/api/yield-farming/pools`, `/api/yield-farming/positions/:user`, `/api/yield-farming/deposit`, `/api/yield-farming/withdraw`, `/api/yield-farming/harvest`, `/api/yield-farming/auto-compound`), 2 database tables (yield_farm_pools, yield_farm_positions), and complete storage layer integration.

### E-commerce & Payments
- **Complete Checkout System**: A full e-commerce checkout flow with a persistent shopping cart, three-stage checkout process, MetaMask direct payments, NOWPayments multi-crypto support, payment status monitoring, and order management.
- **Universal Payment System**: Platform accepts all world currencies through MetaMask Integration and NOWPayments Gateway, supporting 300+ cryptocurrencies and fiat-to-crypto conversion.
- **Blockchain-Native Payment System**: Instant settlement, no chargebacks, lower fees, multi-chain support, product management, shopping cart, and order management.
- **Advanced E-commerce Features**: Multi-currency, stablecoin support, discount codes, gift cards, invoice/payment links, refund system, wallet-based loyalty points, blockchain-verified product reviews, subscription/recurring payments, affiliate/referral system, and on-chain NFT receipts.

### Marketing & Analytics
- **Command Center**: Real-time platform monitoring dashboard with live statistics and system health.
- **Marketing Overview Dashboard**: Comprehensive marketing intelligence with executive metrics and campaign performance.
- **Marketing Campaign Management**: Full-featured system for campaign creation, CRUD operations, budget tracking, and analytics.
- **Social Media Automation**: Automated promotional content posting to Twitter.

# External Dependencies

- React
- TypeScript
- Express.js
- Vite
- Drizzle ORM
- TanStack Query
- shadcn/ui
- Tailwind CSS
- Radix UI
- Lucide React
- Framer Motion
- MetaMask SDK
- Ethereum Provider API
- PostgreSQL (via Neon serverless)
- connect-pg-simple
- Zod
- date-fns
- Wouter
- node-cron
- NOWPayments API
- Coinbase Pro SDK
- Twitter API v2 SDK (twitter-api-v2)