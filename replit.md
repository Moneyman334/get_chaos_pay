# Overview

This is a comprehensive Web3 blockchain empire platform built with React and Express. The application provides users with complete cryptocurrency ecosystem tools including:
- **Multi-Chain Wallet Integration**: Connect MetaMask wallets across Ethereum, Polygon, BSC, Arbitrum, and Optimism
- **Multi-Crypto Deposits**: Accept deposits in BTC, ETH, SOL, LTC, and DOGE with QR codes
- **Universal Crypto Payments**: Support for 300+ cryptocurrencies through NOWPayments integration
- **Token Creator**: Deploy custom ERC-20 tokens with OpenZeppelin contracts (mintable, burnable, pausable features)
- **NFT Creator**: Deploy custom NFT collections (ERC-721, ERC-721A, ERC-1155 standards)
- **Transaction Management**: Send transactions, track history, and monitor network information

The platform features a modern UI built with shadcn/ui components and Tailwind CSS, with a PostgreSQL database backend for storing transaction data. Deployed at chaoskey333casino.com with production-ready smart contract generators.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript and follows a component-based architecture. The application uses Vite as the build tool and development server, providing fast hot module replacement and optimized builds. The UI is constructed using shadcn/ui components built on top of Radix UI primitives, styled with Tailwind CSS for consistent design system implementation.

State management is handled through React hooks and TanStack Query for server state management and caching. The routing system uses Wouter for lightweight client-side navigation. The application implements a custom Web3 hook that manages wallet connections, account information, and blockchain interactions through the MetaMask provider.

## Backend Architecture
The backend follows a REST API architecture built with Express.js and TypeScript. The server implements middleware for request logging, JSON parsing, and error handling. Routes are organized in a modular structure with dedicated endpoints for transaction management, wallet operations, and network information.

The storage layer uses an interface-based design pattern with both in-memory and database implementations. This allows for flexible data persistence strategies while maintaining a consistent API interface. The current implementation includes a memory storage class for development and testing purposes.

## Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema includes four main entities:
- Users: Basic user authentication and identification
- Wallets: Wallet addresses linked to users with balance tracking
- Transactions: Complete transaction records with metadata
- NetworkInfo: Blockchain network configurations and details

The database schema uses UUID primary keys and includes proper foreign key relationships. Decimal types are used for precise financial calculations, and JSONB fields store flexible metadata.

## Web3 Integration
The application integrates with MetaMask through the Ethereum provider API. It supports multiple networks including Ethereum mainnet, testnets (Goerli, Sepolia), and Polygon. The Web3 integration handles wallet connection, account detection, balance retrieval, transaction sending, and network switching.

Gas estimation and transaction monitoring are implemented to provide users with accurate fee calculations and real-time transaction status updates. The system automatically detects network changes and updates the UI accordingly.


# External Dependencies

## Core Dependencies
- **React & TypeScript**: Frontend framework with type safety
- **Express.js**: Backend web server framework
- **Vite**: Build tool and development server
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL adapter
- **TanStack Query**: Server state management and caching

## UI & Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI component primitives
- **Lucide React**: Icon library

## Web3 & Blockchain
- **MetaMask SDK**: Wallet connection and blockchain interaction
- **Ethereum Provider API**: Direct blockchain communication through MetaMask

## Database & Storage
- **PostgreSQL**: Primary database through Neon serverless
- **connect-pg-simple**: PostgreSQL session store for Express

## Development Tools
- **Zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities
- **Wouter**: Lightweight routing library for React