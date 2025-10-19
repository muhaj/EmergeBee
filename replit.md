# Spectacle - Trustless Event Prop Rentals + AR Rewards

## Overview
Spectacle is a Web3 platform that enables trustless event prop rentals. It integrates AR gamification and blockchain-secured rewards using Algorand. The platform combines a prop marketplace with WebAR tap-target games and a cryptographic voucher-based reward system, aiming to transition from MVP to a production-ready system with real blockchain integration.

## User Preferences
I want iterative development. Ask before making major changes. I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`.

## System Architecture

### Frontend
- **Framework**: React + Vite + TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query v5
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **AR Experience**: A-Frame (WebAR)
- **QR Codes**: `qrcode` library
- **Design System**: Purple-to-pink gradient aesthetic (`hsl(245 75% 50%)`, `hsl(265 70% 55%)`, `hsl(175 60% 50%)`). Typography includes Inter for body and JetBrains Mono for monospace.

### Backend
- **Server**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect + passport.js) with session management
- **Cryptography**: `@noble/ed25519` for voucher signing
- **Validation**: Zod schemas with `drizzle-zod`
- **Smart Contracts**: PyTeal (Algorand TEAL v10)
- **SDK**: `py-algorand-sdk` for contract deployment

### Core Features
- **Authentication System**: 
  - **Pera Wallet**: Primary authentication method for dashboard access and blockchain transactions on Algorand TestNet
  - **Replit Auth Backend**: OpenID Connect infrastructure remains in backend but is not exposed in the UI
- **Prop Marketplace**: Browse, filter, and view detailed prop information with real-time availability.
- **Booking Flow**: Date range selection, automatic fee calculation, Pera Wallet connection enforcement, and Algorand TestNet integration.
- **Organizer Dashboard**: Event management, booking tracking, QR code generation for AR, and live analytics. Requires Pera Wallet connection.
- **Vendor Dashboard**: Hybrid payment system with flexible payout options (Stripe, bank transfer, or Algorand blockchain). Vendors can track pending earnings, set payment preferences, and claim accumulated earnings in batch transactions to reduce fees. Supports pending balance tracking and payout history.
- **WebAR Game Experience**: QR code-activated, tap-target AR games with scoring, time-based challenges, and a real-time HUD.
- **Reward System**: Tier-based rewards (Bronze, Silver, Gold) secured by Ed25519-signed cryptographic vouchers, with **real on-chain ASA reward distribution** on Algorand TestNet. Players opt-in to receive reward tokens via Pera Wallet.
- **Data Models**: Structured for Props, Bookings, Events, Game Sessions, Vendors, Payouts, Users, and Sessions.
- **API Endpoints**: Comprehensive API for props, bookings, Algorand smart contract interactions, events, game sessions, voucher verification, vendor management, payout processing, and authentication.
- **Cryptographic Voucher System**: Vouchers are JSON-serialized, SHA-256 hashed, and signed with Ed25519 private keys for secure verification.
- **Algorand Smart Contracts**: A stateful PyTeal rental escrow contract manages deposits, rental fees, and confirmations for delivery/return, with methods for deposit, delivery, return, damage reporting, fee release, refund, and timeout.
- **Algorand Standard Assets (ASAs)**: Three reward tokens created on TestNet - Bronze Medal (SPBRNZ: 747986229), Silver Medal (SPSLVR: 747986230), and Gold Medal (SPGOLD: 747986231). Backend automatically transfers tokens to players after voucher verification and ASA opt-in. **All new events automatically configure these ASA IDs** for all three reward tiers during event creation.
- **Vendor Payout System**: Hybrid payment approach where rental payments flow to platform wallet initially, vendor earnings accumulate as pending balance. Vendors choose payment method (Stripe/bank/blockchain) and can claim earnings in batch to reduce transaction fees. System tracks pending balance, total earnings, and payout history per vendor.

### Technical Decisions
- **Replit Auth**: Chosen for zero external configuration, built-in OAuth support (Google/GitHub/Apple/email), session management with PostgreSQL, and seamless Replit platform integration. Replaced Clerk to eliminate external dependencies.
- **PostgreSQL**: Chosen for production readiness, ACID compliance, native UUID support, and Replit/Neon integration.
- **Ed25519**: Selected for fast signature generation, small signature size, and compatibility with Algorand for secure voucher systems.
- **WebAR (A-Frame)**: Utilized for no-app-download, instant QR code activation, cross-platform compatibility, and lower barrier to entry.
- **Hybrid Vendor Payouts**: Platform-controlled payment flow reduces complexity for vendors (no crypto wallet required initially), enables batch payouts to reduce fees, provides flexible payment options (traditional and blockchain), and allows platform to verify rental completion before releasing funds to vendors.
- **Wallet-Only Authentication**: Using Pera Wallet as the sole authentication method aligns with Web3 principles, ensures all users have blockchain capability, and simplifies the authentication flow. Backend Replit Auth infrastructure remains for potential future use.

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **Authentication**: Replit Auth (OpenID Connect)
- **Blockchain**: Algorand TestNet
- **Wallet Integration**: Pera Wallet SDK
- **UI Libraries**: Shadcn UI, Radix UI
- **AR Framework**: A-Frame
- **Payment/Transaction**: Algorand blockchain for escrow and rewards, Stripe for traditional vendor payouts (configured)

## Recent Changes

### October 19, 2025
- **Unified Dashboard System**: Complete reorganization of dashboard experience
  - **Main Dashboard**: New unified entry point at /dashboard with wallet connection modal
  - **Modal UI**: Shows "Login to Dashboard" modal when wallet not connected, with message "Connect your Pera Wallet to manage your props and your AR events experiences"
  - **Three Management Options**: After wallet connection, dashboard displays 3 clear option cards:
    1. **List Props** → navigates to /props-management (vendor prop creation and management)
    2. **Manage Bookings** → navigates to /bookings-management (view all rental bookings)
    3. **Create AR Events** → navigates to /events-management (AR event creation and management)
  - **Separate Management Pages**: Created dedicated pages for each function (PropsManagement.tsx, BookingsManagement.tsx, EventsManagement.tsx)
  - **Improved Navigation**: "Dashboard" link in header navigates to unified dashboard
  - **Seamless Flow**: After connecting wallet, users can easily switch between managing props, bookings, and AR events
- **Props Management Form Fixes**: Fixed critical bugs and enhanced photo upload functionality
  - **Fixed wallet address bug**: Changed `walletAddress` to `accountAddress` to properly display connected Pera Wallet address
  - **Multiple photo support**: Upgraded from single photo URL to array of photo URLs (up to 6 photos)
  - Added dynamic add/remove photo URL functionality with "Add Photo" button
  - First photo automatically marked as primary (displayed in marketplace)
  - Wallet address field displays with monospace font and is read-only
  - Form successfully submits all photos in photos array with vendorWalletAddress
- **Vendor Prop Creation System**: Built complete prop listing functionality in PropsManagement page
  - Added collapsible "List a New Prop" form with all required fields (name, description, category, daily rate, deposit, location, photos)
  - **Auto-save vendor wallet address**: Connected Pera Wallet address automatically saved to prop listings
  - Form displays vendor wallet address in read-only field to confirm auto-population
  - Integrated with existing POST /api/props endpoint
  - Props created with vendorWalletAddress field for automatic payment routing
- **Database Schema Update**: Added `vendor_wallet_address TEXT NOT NULL` column to props table
  - Stores vendor's Algorand wallet address directly on prop records
  - Enables automatic vendor identification for rental payments
  - Applied schema change via SQL (ALTER TABLE props ADD COLUMN)
- **Simplified Booking Flow**: Removed deployer mnemonic requirement from organizer booking
  - **Removed deployer mnemonic input field** from PropDetail booking form
  - Vendor wallet now auto-populates from prop.vendorWalletAddress (read-only display)
  - Backend uses ALGORAND_DEPLOYER_MNEMONIC environment secret for contract deployment
  - Updated deployContractSchema to remove deployerMnemonic parameter
  - Booking button disabled condition updated to check: startDate, endDate, wallet connection, and prop vendorWalletAddress
- **Security Improvement**: Deployer mnemonic moved to backend environment secrets
  - Frontend no longer handles sensitive mnemonic data
  - Backend retrieves mnemonic from process.env.ALGORAND_DEPLOYER_MNEMONIC
  - Returns error if secret not configured
- **UX Enhancements**: Streamlined booking experience for event organizers
  - Only need to connect Pera Wallet and select dates
  - No manual vendor wallet or mnemonic entry required
  - Clear visual feedback showing vendor wallet is auto-configured
- **Modern Hero Section**: Transformed Home page hero to modern video-background style layout
  - Text positioned top-left (desktop) / centered (mobile) instead of fully centered
  - Added decorative gradient background with SVG dot pattern overlay
  - Updated buttons to rounded-full pill-shaped styling with ChevronRight icon
  - Created InfiniteSlider component for animated stats carousel
  - Created ProgressiveBlur component for fade effects on slider edges
  - Added "Trusted by events worldwide" section with scrolling stats
  - Installed `react-use-measure` dependency for slider animation
- **AR Game Scrolling Fix**: Completely hidden AR.js video element to prevent page scrolling
  - Added comprehensive CSS rules (display: none, position: absolute, width/height: 0, overflow: hidden, visibility: hidden)
  - Changed results screen from overflow-y-auto to overflow-hidden
- **Wallet-Only Authentication UI**: Removed Replit Auth sign-in UI from frontend
- **Simplified Navigation**: Navigation component now only shows Connect/Disconnect Wallet buttons
- **Dashboard Access**: OrganizerDashboard and VendorDashboard now require only Pera Wallet connection
- **Route Aliases**: Added `/organizer-dashboard` and `/vendor-dashboard` routes for better UX
- **Backend Preserved**: Replit Auth infrastructure remains in backend for potential future use

### October 18, 2025
- **Removed Clerk Authentication**: Completely removed Clerk SDK and all dependencies
- **Implemented Replit Auth**: Integrated native Replit authentication with OpenID Connect and passport.js
- **Database Schema Updates**: Added `users` and `sessions` tables for Replit Auth
- **Authentication Routes**: `/api/login` (sign in), `/api/logout` (sign out), `/api/auth/user` (current user)