# Overview
"Web3 Blockchain Empire" is a comprehensive Web3 blockchain platform aiming to be a complete cryptocurrency ecosystem. It features multi-chain wallet integration, multi-crypto deposits, universal crypto payments, and advanced tools like ERC-20 Token and NFT creators, an AI-powered Sentinel Auto Trading Bot, and robust transaction management. The platform emphasizes a "divine visual experience" with cosmic aesthetics and interactive UI, targeting production readiness. Business ambitions include a blockchain-native e-commerce payment system with multi-currency support, loyalty programs, on-chain NFT receipts, and a Social Media Automation System for Twitter/X.

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
The backend is an Express.js and TypeScript REST API with modular routes. It uses PostgreSQL and Drizzle ORM. The API architecture includes over 70 RESTful endpoints with rate limiting, authentication, Zod validation, and a storage layer. Security features include PostgreSQL-backed sessions, Bcrypt password hashing, CORS, input sanitization, and SQL injection prevention. Real-time services include an Auto-Compound Engine, Social Media Scheduler, Trading Bot Engine, and Price Service, designed for stability with graceful shutdown handling.

**Owner/Admin Protection System**: A secure authentication system protects owner-only routes and dashboards. The `requireOwner` middleware verifies session-based authentication (no header spoofing) and checks the user's `isOwner` database flag. Protected routes include Command Center, Marketing Dashboards, Social Automation, Admin Discounts, Admin Flash Sales, and Owner Analytics. The frontend `ProtectedRoute` component enforces access control by checking `/api/auth/me` and redirecting unauthorized users to the home page.

## Feature Specifications

### Web3 & Blockchain
- **Auto-Deploy System**: A production-quality demo for one-click token and NFT deployment, generating ERC-20 tokens and ERC-721 NFTs with IPFS readiness.
- **Codex Wallet Nexus**: A multi-wallet management system supporting unlimited simultaneous wallet connections (MetaMask, Coinbase Wallet), a unified interface, primary wallet designation, session persistence, balance aggregation, and multi-chain support (EVM chains).
- **CODEX ECOSYSTEM**: A complete platform token economy including a platform token (CDX), four NFT collections, four staking pools with NFT holder multipliers, eight AI-powered dynamic Living Achievements, and a Relics System with 9 soulbound artifacts providing passive ecosystem boosts. It includes 25+ API endpoints and 5 frontend pages.
- **Multi-Chain Wallet Integration**: Primarily MetaMask for connections, account data, balances, and transaction signing.
- **Advanced Wallet Security Protection**: Features a Transaction Validation Engine, Velocity Limits, Emergency Lockdown Mode, Fraud Detection, Blacklist/Whitelist, Spending Limits, and AI Sentinel Monitoring.
- **Smart Contract Generators**: Production-ready ERC-20 token and ERC-721/721A/1155 NFT creators with IPFS integration.
- **Multi-Cryptocurrency Support**: Deposits for BTC, ETH, SOL, LTC, DOGE, and universal payments for 300+ cryptocurrencies via NOWPayments.
- **Marketplace System**: Complete peer-to-peer marketplace for trading NFTs, Tokens, and Products with REST API, database support, and secure transaction handling.

### Trading & Automation
- **Buy & Trade Crypto Platform**: A comprehensive trading interface with a real-time order book, multiple order types, various trading pairs, live price ticker, order history, and trading statistics dashboard.
- **Auto Trading Bot**: An advanced AI-powered bot with real-time activity feed, demo/live modes, five trading strategies, an emergency stop button, performance dashboard, and risk management configurations.
- **House Vaults System**: Player-owned liquidity system for ETH staking with varying APY and lock periods.

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