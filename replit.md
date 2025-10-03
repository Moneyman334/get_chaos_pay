# Overview

"Web3 Blockchain Empire" is a comprehensive Web3 blockchain platform designed to be a complete cryptocurrency ecosystem. It features multi-chain wallet integration, multi-crypto deposits, and universal crypto payments via NOWPayments. The platform includes advanced tools like ERC-20 Token and ERC-721/ERC-1155 NFT creators, an AI-powered Sentinel Auto Trading Bot, and robust transaction management with military-grade security. It offers a "divine visual experience" with cosmic aesthetics and interactive UI, aiming for production readiness. Key business ambitions include a blockchain-native e-commerce payment system with multi-currency support, loyalty programs, on-chain NFT receipts, and a Social Media Automation System for Twitter/X.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a "Divine Visual System" with a cosmic theme (purple/blue gradients, star effects, animated backgrounds), interactive elements (hover effects, 3D card tilts, parallax scrolling), a custom cosmic trail cursor, and glassmorphism. It leverages shadcn/ui and Tailwind CSS for a consistent, accessible, and responsive design, adhering to WCAG AA standards.

## Technical Implementations

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query v5 for server state management. It implements a three-layer state management approach, `useWeb3` hook for MetaMask integration, React Hook Form with Zod for validation, and various performance optimizations (code splitting, lazy loading). Robust error handling includes React Error Boundaries, a network status monitor, automatic retry with exponential backoff, and toast notifications.

### Backend
The backend is an Express.js and TypeScript REST API with modular routes. It uses PostgreSQL and Drizzle ORM for database integration. The API architecture includes over 70 RESTful endpoints with rate limiting, authentication, Zod validation, and a storage layer. Security features include PostgreSQL-backed sessions, Bcrypt password hashing, CORS, input sanitization, and SQL injection prevention. Real-time services include an Auto-Compound Engine, Social Media Scheduler, Trading Bot Engine, and Price Service. The backend is designed for stability with idempotent graceful shutdown handling and service monitoring.

## Feature Specifications

### Web3 & Blockchain
- **Multi-Chain Wallet Integration**: MetaMask for connections, account data, balances, and transaction signing.
- **Advanced Wallet Security Protection**: Features a Transaction Validation Engine, Velocity Limits, Emergency Lockdown Mode, Fraud Detection, Blacklist/Whitelist System, Spending Limits, AI Sentinel Monitoring, and readiness for Multi-Signature and Hardware Wallet integrations.
- **Smart Contract Generators**: Production-ready ERC-20 token and ERC-721/721A/1155 NFT creators with IPFS integration.
- **Multi-Cryptocurrency Support**: Deposits for BTC, ETH, SOL, LTC, DOGE, and universal payments for 300+ cryptocurrencies.

### Trading & Automation
- **Sentinel Auto Trading Bot**: AI-powered bot with five strategies and configurable risk management for Coinbase Pro (requires migration to Advanced Trade API).
- **House Vaults System**: Player-owned liquidity system for ETH staking with varying APY and lock periods.

### E-commerce & Payments
- **Blockchain-Native Payment System**: Instant settlement, no chargebacks, lower fees, multi-chain support (Ethereum, Base, Polygon, Sepolia) with product management, shopping cart, and order management.
- **Advanced E-commerce Features**: Multi-currency, stablecoin support, discount codes, gift cards, invoice/payment links, refund system, wallet-based loyalty points, blockchain-verified product reviews, subscription/recurring payments, affiliate/referral system, and on-chain NFT receipts.

### Marketing & Analytics
- **Command Center**: Real-time platform monitoring dashboard with live statistics (TVL, revenue, users, transactions), activity feed, and system health.
- **Marketing Overview Dashboard**: Comprehensive marketing intelligence with executive metrics, budget utilization, campaign performance, and channel insights.
- **Marketing Campaign Management**: Full-featured system for campaign creation, CRUD operations, budget tracking, multi-channel support, and analytics.

### Social Media Automation
- **Twitter Auto-Posting**: Automated promotional content posting every 3 hours using OAuth 1.0a credentials, cycling through specific messages.

### Key Frontend Pages
The platform includes 26 comprehensive frontend pages covering:
- **Product Management**: Catalog, Wishlist, Product Reviews, Flash Sales Admin.
- **User & Order Management**: Customer Dashboard, Enhanced Checkout, Invoices, Enhanced Orders.
- **Analytics & Portfolio**: Analytics Dashboard, Portfolio Tracker, Notifications System.
- **Web3 Features**: Achievements & Gamification, Marketplace, Staking Rewards, Referral/Affiliate System, Token Swap/DEX, NFT Gallery, DAO Governance, P2P Lending, Prediction Markets, Yield Farming, Social Trading, Token Launchpad.
- **Marketing**: Marketing Overview, Campaign Management, Command Center.

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
- Coinbase Pro SDK (Note: Requires migration to Coinbase Advanced Trade API)
- Twitter API v2 SDK (twitter-api-v2)