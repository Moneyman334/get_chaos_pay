# Overview
"Web3 Blockchain Empire" (Chaos Crypto Casino) is a comprehensive Web3 blockchain platform aiming to be a complete cryptocurrency ecosystem. It features multi-chain wallet integration, multi-crypto deposits, universal crypto payments, and advanced tools like ERC-20 Token and NFT creators, an AI-powered Sentinel Auto Trading Bot, and robust transaction management. The platform emphasizes a "divine visual experience" with cosmic aesthetics and interactive UI, targeting production readiness. Native iOS and Android mobile apps are built and ready for App Store distribution (App ID: com.chaoscrypto.casino). Business ambitions include a blockchain-native e-commerce payment system with multi-currency support, loyalty programs, on-chain NFT receipts, and a Social Media Automation System for Twitter/X.

**App Store Submission Status**: Custom cyberpunk-themed app icon created (1024x1024 PNG). Google Play Console account created (Chaos Crypto Studio, ID verification pending). Apple Developer account pending (maintenance). All legal pages (Privacy Policy, Terms of Service, FAQ/Support) are live and production-ready.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a "Divine Visual System" with a cosmic theme (purple/blue gradients, star effects, animated backgrounds), interactive elements (hover effects, 3D card tilts, parallax scrolling), a custom cosmic trail cursor, and glassmorphism. It uses shadcn/ui and Tailwind CSS for a consistent, accessible, and responsive design, adhering to WCAG AA standards. Images are handled via imported static assets, external placeholders (picsum.photos), and type-safe rendering for NFTs.

## Technical Implementations

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query v5 for server state management. It includes a `useWeb3` hook for MetaMask integration, React Hook Form with Zod for validation, performance optimizations, and comprehensive error handling. A User Preferences & Analytics System tracks user behavior, manages settings via `localStorage`, and provides an analytics dashboard.

### Backend
The backend is an Express.js and TypeScript REST API with modular routes, using PostgreSQL and Drizzle ORM. It features over 70 RESTful endpoints with rate limiting, authentication, Zod validation, and a storage layer. Real-time services include an Auto-Compound Engine, Social Media Scheduler, Trading Bot Engine, and a Real-Time Price Service (CoinGecko API with 5-minute auto-refresh).

**Security Fortress**: The platform implements multi-layer security including multi-tier and speed limiting for rate limiting, transaction fraud detection (risk analysis, auto-rejection), hardened CSP, security headers (HSTS, X-Frame-Options, etc.), IPv6-safe rate limiting, input sanitization, CORS hardening, secure error handling, and request signing/validation.

**Real-Time Price Oracle**: Integrated CoinGecko API provides live cryptocurrency prices for multiple assets (ETH, BTC, USDC, USDT, DAI, SOL, LTC, DOGE, MATIC, WBTC, CDX), refreshing every 5 minutes and serving data via `/api/prices` endpoints.

**Platform Revenue Dashboard**: A comprehensive system at `/api/platform/revenue` aggregates all platform earnings (e-commerce sales, marketplace fees, trading bot performance, subscriptions, affiliate payouts) with period filters and detailed breakdowns.

**Owner/Admin Protection System**: Secure session-based authentication with `requireOwner` middleware protects owner-only routes and dashboards, verified by an `isOwner` flag in the database.

## Feature Specifications

### Web3 & Blockchain
- **22-Chain Multi-Chain Infrastructure**: Full support for 22 major blockchain networks including Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism, Solana, Base, Fantom, Cosmos, Polkadot, Cardano, Algorand, Near, Sui, Aptos, Tezos, Celo, Harmony, Stellar, Cronos, and Starknet. Powered by Alchemy, Infura, and QuickNode RPC providers for sub-50ms latency and zero downtime.
- **Cross-Chain Bridge Integration**: Native support for Wormhole (30+ chains), LayerZero (40+ chains), Axelar (50+ chains), and Chainlink CCIP for seamless asset transfers across all supported networks.
- **Auto-Deploy System**: One-click token (ERC-20) and NFT (ERC-721) deployment with IPFS readiness.
- **Codex Wallet Nexus**: Advanced multi-chain wallet management supporting MetaMask, Coinbase Wallet, and 22+ blockchain networks. Features unified interface, primary wallet designation, session persistence, balance aggregation across all chains, and automatic chain switching.
- **CODEX ECOSYSTEM**: Platform token (CDX), four NFT collections, four staking pools with NFT multipliers, eight AI-powered Living Achievements, and a Relics System with 9 soulbound artifacts providing ecosystem boosts. Includes a **Forge System** for crafting relics.
- **Empire Vault - DAO Treasury**: Revolutionary profit-sharing system that pools 60-80% of ALL platform revenue (marketplace, trading bot, launchpad, e-commerce, staking fees, subscriptions) and distributes directly to CDX stakers and NFT holders. Features: automatic share calculation based on CDX stake with NFT boost multipliers (1.1x-2x) and Relic boosts (1.15x-1.6x), weekly distributions, governance voting, claim rewards UI with casino effects. Users become profit-sharing owners - the more you stake, the bigger your share!
- **Advanced Wallet Security Protection**: Database-persisted system with Transaction Validation Engine, Velocity Limits, Emergency Lockdown, Fraud Detection, Persistent Blacklist/Whitelist, Spending Limits, and AI Sentinel Monitoring.
- **Smart Contract Generators**: Production-ready ERC-20 and ERC-721/721A/1155 NFT creators.
- **Multi-Cryptocurrency Support**: Deposits for BTC, ETH, SOL, LTC, DOGE, and universal payments for 300+ cryptocurrencies via NOWPayments.
- **Marketplace System**: Peer-to-peer trading for NFTs, Tokens, and Products.

### Trading & Automation
- **DEX Aggregator**: Revolutionary swap engine powered by 1inch API aggregating 300+ DEX sources for best price routing. Supports 8 major chains (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche, Fantom) with live quotes, slippage protection, and 0.3% platform fee. Features automatic fallback to CoinGecko pricing when 1inch unavailable.
- **Buy & Trade Crypto Platform**: Comprehensive trading interface with real-time order book, multiple order types, various trading pairs, and trading statistics.
- **Copy Trading System**: Revolutionary social trading platform where users follow top traders and automatically copy their trades. Features: trader leaderboard sorted by performance, public trader profiles with statistics, follow/unfollow traders with customizable settings, auto-copy execution, copy trade history, follower earnings tracking, and 10% revenue share for traders (5% platform fee). Viral growth mechanism built-in.
- **Margin/Futures Trading System**: Professional leverage trading platform with up to 20x leverage. Features: long/short positions, isolated/cross margin modes, real-time PnL tracking, automated risk management engine (30s monitoring), auto-liquidation at 95% threshold, liquidation warnings at 85%, customizable leverage limits (1-20x), stop-loss/take-profit orders, comprehensive position history, and liquidation protection. Risk engine runs every 30 seconds updating prices and checking liquidation thresholds.
- **Auto Trading Bot**: AI-powered bot with real-time activity feed, demo/live modes, five strategies, emergency stop, performance dashboard, and risk management.
- **House Vaults System**: Player-owned liquidity for ETH staking with varying APY and lock periods.
- **Yield Farming System**: LP token staking platform with 4 active farm pools, including deposit/withdraw, real-time reward calculation, harvest, auto-compound, and TVL tracking.

### E-commerce & Payments
- **Complete Checkout System**: Full e-commerce checkout flow with persistent shopping cart, three-stage process, MetaMask direct payments, NOWPayments multi-crypto support, and order management.
- **Universal Payment System**: Accepts all world currencies via MetaMask and NOWPayments (300+ cryptocurrencies, fiat-to-crypto conversion).
- **Blockchain-Native Payment System**: Instant settlement, no chargebacks, lower fees, multi-chain support.
- **Advanced E-commerce Features**: Multi-currency, stablecoin support, discount codes, gift cards, invoice/payment links, refund system, wallet-based loyalty points, blockchain-verified product reviews, subscription/recurring payments, affiliate/referral system, and on-chain NFT receipts.

### Marketing & Analytics
- **Command Center**: Real-time platform monitoring dashboard.
- **Marketing Overview Dashboard**: Comprehensive marketing intelligence.
- **Marketing Campaign Management**: System for campaign creation, CRUD operations, budget tracking, and analytics.
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
- CoinGecko API