# Overview

"Web3 Blockchain Empire" is a comprehensive Web3 blockchain platform aiming to be a complete cryptocurrency ecosystem. It features multi-chain wallet integration, multi-crypto deposits, universal crypto payments, and advanced tools like ERC-20 Token and NFT creators, an AI-powered Sentinel Auto Trading Bot, and robust transaction management. The platform emphasizes a "divine visual experience" with cosmic aesthetics and interactive UI, targeting production readiness. Business ambitions include a blockchain-native e-commerce payment system with multi-currency support, loyalty programs, on-chain NFT receipts, and a Social Media Automation System for Twitter/X.

# Recent Changes (Oct 4, 2025)

## UX Improvements
1. **Bot Subscription Payment**: Added prominent subscription banner on auto-trading-bot page with $49/mo Premium pricing, dismissible UI, and direct link to /subscriptions page
2. **Clickable Staking Pools**: Transformed CODEX staking pool selection from dropdown to clickable cards with visual feedback (border highlight, "Selected" badge), smooth auto-scroll to stake form
3. **Wallet Connection State**: Fixed connection status inconsistency by adding `isCheckingConnection` state to useWeb3 hook; navigation now shows "Checking..." with animated pulse during reconnection, prevents race conditions between localStorage and MetaMask

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The platform features a "Divine Visual System" with a cosmic theme (purple/blue gradients, star effects, animated backgrounds), interactive elements (hover effects, 3D card tilts, parallax scrolling), a custom cosmic trail cursor, and glassmorphism. It uses shadcn/ui and Tailwind CSS for a consistent, accessible, and responsive design, adhering to WCAG AA standards.

## Technical Implementations

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query v5 for server state management. It includes a `useWeb3` hook for MetaMask integration, React Hook Form with Zod for validation, and performance optimizations like code splitting and lazy loading. Error handling incorporates React Error Boundaries, network status monitoring, automatic retry, and toast notifications. A comprehensive User Preferences & Analytics System tracks user behavior, manages settings via `localStorage`, and provides an analytics dashboard.

### Backend
The backend is an Express.js and TypeScript REST API with modular routes. It uses PostgreSQL and Drizzle ORM. The API architecture includes over 70 RESTful endpoints with rate limiting, authentication, Zod validation, and a storage layer. Security features include PostgreSQL-backed sessions, Bcrypt password hashing, CORS, input sanitization, and SQL injection prevention. Real-time services include an Auto-Compound Engine, Social Media Scheduler, Trading Bot Engine, and Price Service, designed for stability with graceful shutdown handling.

## Feature Specifications

### Web3 & Blockchain
- **Auto-Deploy System**: A production-quality demo for one-click token and NFT deployment, generating ERC-20 tokens and ERC-721 NFTs with IPFS readiness. It features a risk-free demo mode, database integration, history tracking, and production-ready Solidity code.
- **Codex Wallet Nexus**: A multi-wallet management system supporting unlimited simultaneous wallet connections (MetaMask, Coinbase Wallet, with extensibility for others), a unified interface, primary wallet designation, session persistence, balance aggregation, and multi-chain support (EVM chains).
- **CODEX ECOSYSTEM**: A complete platform token economy including a platform token (CDX), four NFT collections (Founder's Pass, Elite Member Pass, Genesis Collection, Living Achievements), four staking pools with NFT holder multipliers, and eight AI-powered dynamic Living Achievements that evolve with user activity. It includes 18 API endpoints and 4 frontend pages (`/codex-dashboard`, `/codex-nfts`, `/codex-achievements`, `/codex-staking`).
- **Multi-Chain Wallet Integration**: Primarily MetaMask for connections, account data, balances, and transaction signing.
- **Advanced Wallet Security Protection**: Features a Transaction Validation Engine, Velocity Limits, Emergency Lockdown Mode, Fraud Detection, Blacklist/Whitelist, Spending Limits, and AI Sentinel Monitoring.
- **Smart Contract Generators**: Production-ready ERC-20 token and ERC-721/721A/1155 NFT creators with IPFS integration.
- **Multi-Cryptocurrency Support**: Deposits for BTC, ETH, SOL, LTC, DOGE, and universal payments for 300+ cryptocurrencies via NOWPayments.

### Trading & Automation
- **Buy & Trade Crypto Platform**: A comprehensive trading interface with a real-time order book, multiple order types (Market, Limit, Stop Loss, Take Profit), various trading pairs, live price ticker, order history, open orders management, and a trading statistics dashboard.
- **Auto Trading Bot**: An advanced AI-powered bot with real-time activity feed, demo/live modes, five trading strategies (SMA Crossover, RSI Oversold, Trend Following, Mean Reversion, Breakout), an emergency stop button, performance dashboard, and risk management configurations.
- **House Vaults System**: Player-owned liquidity system for ETH staking with varying APY and lock periods.

### E-commerce & Payments
- **Complete Checkout System**: A full e-commerce checkout flow with a persistent shopping cart, three-stage checkout process, MetaMask direct payments, NOWPayments multi-crypto support, payment status monitoring, and order management.
- **Blockchain-Native Payment System**: Instant settlement, no chargebacks, lower fees, multi-chain support, product management, shopping cart, and order management.
- **Advanced E-commerce Features**: Multi-currency, stablecoin support, discount codes, gift cards, invoice/payment links, refund system, wallet-based loyalty points, blockchain-verified product reviews, subscription/recurring payments, affiliate/referral system, and on-chain NFT receipts.

### Marketing & Analytics
- **Command Center**: Real-time platform monitoring dashboard with live statistics and system health.
- **Marketing Overview Dashboard**: Comprehensive marketing intelligence with executive metrics and campaign performance.
- **Marketing Campaign Management**: Full-featured system for campaign creation, CRUD operations, budget tracking, and analytics.

### Social Media Automation
- **Twitter Auto-Posting**: Automated promotional content posting every 3 hours.

### Key Frontend Pages
The platform includes 29 comprehensive frontend pages covering Product Management, User & Order Management, Analytics & Portfolio, Wallet Management (Codex Wallet Nexus), Trading (Buy & Trade Crypto), User Experience (Settings & Preferences), Web3 Features (Achievements, Marketplace, Staking, DAO Governance, etc.), and Marketing.

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