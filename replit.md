# Overview

"Web3 Blockchain Empire" is a comprehensive Web3 blockchain platform offering a complete cryptocurrency ecosystem. It features multi-chain wallet integration, multi-crypto deposits, and universal crypto payments via NOWPayments. The platform includes advanced tools like ERC-20 Token and ERC-721/ERC-1155 NFT creators, an AI-powered Sentinel Auto Trading Bot, and robust transaction management. It provides a "divine visual experience" with cosmic aesthetics and interactive UI effects, designed for production use. Key features include smart contract generators, automated trading, a blockchain-native e-commerce payment system with multi-currency support, discount codes, gift cards, loyalty programs, and on-chain NFT receipts. It also incorporates a Social Media Automation System for Twitter/X.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a "Divine Visual System" with a cosmic theme (purple/blue gradients, star effects, animated backgrounds), interactive elements (hover effects, 3D card tilts, parallax scrolling), a custom cosmic trail cursor, and glassmorphism. It uses shadcn/ui and Tailwind CSS for a consistent, accessible, and responsive design, adhering to WCAG AA standards.

## Technical Implementations

### Frontend
- **Technology Stack**: React 18, TypeScript, Vite, Wouter (lightweight routing), TanStack Query v5 (server state management), shadcn/ui, Radix UI, Tailwind CSS, Lucide React, Framer Motion.
- **State Management**: Three-layer architecture combining TanStack Query for server state, Context/Hooks for global client state (e.g., authentication, theme), and `useState` for local component state.
- **Web3 Integration**: A `useWeb3` hook handles MetaMask integration, wallet connection, network switching, and account/balance monitoring.
- **Form Handling**: Utilizes React Hook Form with Zod for client-side validation and strongly typed form submissions.
- **Performance**: Implements code splitting, lazy loading, memoization, virtual scrolling, and image optimization.
- **Error Handling & Resilience**:
  - React Error Boundary catches all crashes with recovery UI (reload/home actions)
  - Network Status Monitor with real-time online/offline detection and visual banners
  - Automatic retry with exponential backoff (1s→2s→4s→10s cap) for 408/429/5xx errors
  - QueryClient: 3 query retries, 2 mutation retries, refetch on reconnect
  - Branded loading overlay with cosmic animations for initial load
  - Toast notifications for connectivity changes

### Backend
- **Core**: Express.js and TypeScript REST API with modular routes.
- **Database Integration**: Uses an interface-based storage layer with PostgreSQL and Drizzle ORM, with an in-memory option for development.
- **API Architecture**: Over 70 RESTful endpoints organized by feature, with a request/response flow incorporating rate limiting, authentication, Zod validation, and a storage layer.
- **Security**: PostgreSQL-backed sessions, Bcrypt password hashing, rate limiting, progressive slow down, CORS, input sanitization, and SQL injection prevention.
- **Real-time Services**: Auto-Compound Engine, Social Media Scheduler, Trading Bot Engine, and Price Service for real-time crypto price aggregation.
- **Stability & Resilience**: 
  - Idempotent graceful shutdown handling (SIGTERM, SIGINT, uncaughtException, unhandledRejection)
  - Sequential cleanup of all background services even on errors
  - Proper exit codes (0 for clean, 1 for errors)
  - Service monitoring with 10s timeout warnings

## Feature Specifications

### Web3 & Blockchain
- **Multi-Chain Wallet Integration**: MetaMask for wallet connections, account data, balance retrieval, and transaction signing.
- **Smart Contract Generators**: Production-ready ERC-20 token (mintable, burnable, pausable) and ERC-721/721A/1155 NFT creators with IPFS integration.
- **Multi-Cryptocurrency Support**: Deposits for BTC, ETH, SOL, LTC, DOGE, and universal payments for 300+ cryptocurrencies via NOWPayments.

### Trading & Automation
- **Sentinel Auto Trading Bot**: AI-powered bot for Coinbase Pro (requires migration to Advanced Trade API) with five strategies, configurable risk management, and real-time monitoring.
- **House Vaults System**: Player-owned liquidity system for ETH staking with varying APY and lock periods.

### E-commerce & Payments
- **Blockchain-Native Payment System**: Instant settlement, no chargebacks, lower fees, multi-chain support (Ethereum, Base, Polygon, Sepolia). Includes product management, shopping cart, multi-payment options, blockchain verification, and order management.
- **Advanced E-commerce Features**: Multi-currency & stablecoin support, discount codes, gift cards, invoice/payment links, refund system, wallet-based loyalty points, customer tier system, blockchain-verified product reviews, wishlist, recently viewed products, subscription/recurring payments, affiliate/referral system, flash sales, pre-order system, product variants, AI-powered product recommendations, abandoned cart recovery, and on-chain NFT receipts.

### Comprehensive Frontend Pages (23 Total)
1. **Products Catalog** (/products) - Advanced filtering, search, grid/list view, price range filtering, category selection, featured products, stock indicators
2. **Wishlist** (/wishlist) - Save products, remove items, wallet-based persistence, quick add to cart, stock monitoring
3. **Customer Dashboard** (/dashboard) - Unified view of loyalty points, tier status, subscriptions, recent orders, account stats, spending analytics
4. **Enhanced Checkout** (/checkout) - Multi-step checkout with discount code redemption, gift card application, payment method selection, order review, wallet integration
5. **Product Reviews** (/reviews) - Blockchain-verified reviews, rating system, filtering by rating/product/verified status, review submission with wallet verification
6. **Flash Sales Admin** (/admin/flash-sales) - Create/manage time-limited sales, product selection, discount configuration, start/end times, active/expired sales tracking
7. **Invoice Management** (/invoices) - View all invoices, create payment links, share invoices, payment status tracking, due date management
8. **Enhanced Orders** (/orders) - Detailed order tracking with timeline, NFT receipt minting, refund requests, order status updates, delivery tracking
9. **Analytics Dashboard** (/analytics) - Real-time revenue trends, order status distribution charts, payment method breakdown, top products, blockchain activity across chains
10. **Portfolio Tracker** (/portfolio) - Multi-chain asset management, portfolio distribution charts, chain/token breakdowns, performance tracking, total value overview
11. **Notifications System** (/notifications) - Live notification center, filtering by type (orders, payments, system), mark as read/unread, delete notifications, notification stats
12. **Achievements & Gamification** (/achievements) - NFT badge collection, achievement progress tracking, XP and level system, achievement categories, badge minting, tier progression
13. **Marketplace** (/marketplace) - Peer-to-peer trading, create listings, search and filter items, sort by price/date, buy/sell functionality, listing management
14. **Staking Rewards** (/staking) - Multiple staking pools with varying APYs, stake/unstake tokens, rewards tracking, lock period management, APY calculator with custom amounts/periods
15. **Referral/Affiliate System** (/referrals) - Complete affiliate program with referral code generation, commission tracking (total earned, pending, referrals count), referral link sharing with copy/share, withdrawal functionality, detailed referral history with status tracking, transaction verification
16. **Token Swap/DEX** (/swap) - Built-in decentralized exchange for swapping cryptocurrencies (ETH, USDC, USDT, DAI, WBTC), rate calculations, slippage tolerance settings, fee estimates, price impact display, popular trading pairs, wallet-integrated swap execution
17. **NFT Gallery** (/nft-gallery) - Multi-chain NFT collection showcase with grid/list views, search and chain filtering, collection grouping, stats dashboard (total NFTs, collections, value, chains), detailed NFT modal with attributes, rarity, sale history, OpenSea integration
18. **DAO Governance** (/dao) - Decentralized autonomous organization with proposal creation, voting system (for/against/abstain), quorum tracking, voting power management, treasury balance display, proposal execution, time-limited voting periods, vote percentage calculations, active/passed/all proposal tabs
19. **P2P Lending Platform** (/lending) - Decentralized peer-to-peer lending with loan requests, collateral management, interest rate bidding, lending pools, automatic matching, repayment tracking, risk assessment, default handling, lender/borrower dashboards
20. **Prediction Markets** (/prediction-markets) - Bet on future events with liquidity pools, YES/NO markets, odds calculation, position tracking, market resolution, winnings claiming, categories (crypto, sports, politics), live odds updates, profit/loss tracking
21. **Yield Farming Dashboard** (/yield-farming) - Stake LP tokens for high-yield rewards, multiple farm pools with varying APYs, auto-compound strategies, harvest rewards, deposit/withdraw management, TVL tracking, APY calculators, lock periods, multipliers, vesting schedules
22. **Social Trading Platform** (/social-trading) - Copy successful traders automatically, trader leaderboards, performance metrics (total return, win rate), risk levels, follower counts, copy allocations, automatic trade replication, P&L tracking, trader profiles, strategies showcase
23. **Token Launchpad** (/token-launchpad) - Invest in new token launches (ICOs/IDOs), fair token distribution, vesting schedules, hard/soft caps, fundraising progress, token allocation, TGE (Token Generation Event), claim schedules, project categories, investment tracking, upcoming/active launches

# External Dependencies

- React & TypeScript
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
- Coinbase Pro SDK (Note: Requires migration to Coinbase Advanced Trade API for production)
- Twitter API v2 SDK (twitter-api-v2)