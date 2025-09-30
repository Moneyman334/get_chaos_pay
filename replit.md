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

### Backend
- **Core**: Express.js and TypeScript REST API with modular routes.
- **Database Integration**: Uses an interface-based storage layer with PostgreSQL and Drizzle ORM, with an in-memory option for development.
- **API Architecture**: Over 70 RESTful endpoints organized by feature, with a request/response flow incorporating rate limiting, authentication, Zod validation, and a storage layer.
- **Security**: PostgreSQL-backed sessions, Bcrypt password hashing, rate limiting, progressive slow down, CORS, input sanitization, and SQL injection prevention.
- **Real-time Services**: Auto-Compound Engine, Social Media Scheduler, Trading Bot Engine, and Price Service for real-time crypto price aggregation.

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