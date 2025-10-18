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
- **Cryptography**: `@noble/ed25519` for voucher signing
- **Validation**: Zod schemas with `drizzle-zod`
- **Smart Contracts**: PyTeal (Algorand TEAL v10)
- **SDK**: `py-algorand-sdk` for contract deployment

### Core Features
- **Prop Marketplace**: Browse, filter, and view detailed prop information with real-time availability.
- **Booking Flow**: Date range selection, automatic fee calculation, Pera Wallet connection enforcement, and Algorand TestNet integration.
- **Organizer Dashboard**: Event management, booking tracking, QR code generation for AR, and live analytics.
- **Vendor Dashboard**: Hybrid payment system with flexible payout options (Stripe, bank transfer, or Algorand blockchain). Vendors can track pending earnings, set payment preferences, and claim accumulated earnings in batch transactions to reduce fees. Supports pending balance tracking and payout history.
- **WebAR Game Experience**: QR code-activated, tap-target AR games with scoring, time-based challenges, and a real-time HUD.
- **Reward System**: Tier-based rewards (Bronze, Silver, Gold) secured by Ed25519-signed cryptographic vouchers, with **real on-chain ASA reward distribution** on Algorand TestNet. Players opt-in to receive reward tokens via Pera Wallet.
- **Data Models**: Structured for Props, Bookings, Events, Game Sessions, Vendors, and Payouts.
- **API Endpoints**: Comprehensive API for props, bookings, Algorand smart contract interactions, events, game sessions, voucher verification, vendor management, and payout processing.
- **Cryptographic Voucher System**: Vouchers are JSON-serialized, SHA-256 hashed, and signed with Ed25519 private keys for secure verification.
- **Algorand Smart Contracts**: A stateful PyTeal rental escrow contract manages deposits, rental fees, and confirmations for delivery/return, with methods for deposit, delivery, return, damage reporting, fee release, refund, and timeout.
- **Algorand Standard Assets (ASAs)**: Three reward tokens created on TestNet - Bronze Medal (SPBRNZ: 747986229), Silver Medal (SPSLVR: 747986230), and Gold Medal (SPGOLD: 747986231). Backend automatically transfers tokens to players after voucher verification and ASA opt-in. **All new events automatically configure these ASA IDs** for all three reward tiers during event creation.
- **Vendor Payout System**: Hybrid payment approach where rental payments flow to platform wallet initially, vendor earnings accumulate as pending balance. Vendors choose payment method (Stripe/bank/blockchain) and can claim earnings in batch to reduce transaction fees. System tracks pending balance, total earnings, and payout history per vendor.

### Technical Decisions
- **PostgreSQL**: Chosen for production readiness, ACID compliance, native UUID support, and Replit/Neon integration.
- **Ed25519**: Selected for fast signature generation, small signature size, and compatibility with Algorand for secure voucher systems.
- **WebAR (A-Frame)**: Utilized for no-app-download, instant QR code activation, cross-platform compatibility, and lower barrier to entry.
- **Hybrid Vendor Payouts**: Platform-controlled payment flow reduces complexity for vendors (no crypto wallet required initially), enables batch payouts to reduce fees, provides flexible payment options (traditional and blockchain), and allows platform to verify rental completion before releasing funds to vendors.

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **Blockchain**: Algorand TestNet
- **Wallet Integration**: Pera Wallet SDK
- **UI Libraries**: Shadcn UI, Radix UI
- **AR Framework**: A-Frame
- **Payment/Transaction**: Algorand blockchain for escrow and rewards, Stripe for traditional vendor payouts (configured)