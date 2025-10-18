# Spectacle - Trustless Event Prop Rentals + AR Rewards

## Overview
Spectacle is a Web3 platform enabling trustless event prop rentals with AR gamification and blockchain-secured rewards on Algorand. The platform combines prop marketplace functionality with WebAR tap-target games and cryptographic voucher-based reward systems.

## Project Status
**Current Version**: MVP → Production Transition  
**Last Updated**: October 18, 2025  
**Development Stage**: Real Blockchain Integration Phase  
**Recent Milestone**: PostgreSQL + Pera Wallet Integration Complete

## Architecture

### Frontend Stack
- **Framework**: React + Vite + TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query v5
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **AR Experience**: A-Frame (WebAR)
- **QR Codes**: qrcode library

### Backend Stack
- **Server**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Cryptography**: @noble/ed25519 for voucher signing
- **Validation**: Zod schemas with drizzle-zod
- **Blockchain**: Algorand TestNet (Pera Wallet SDK)

### Design System
**Color Scheme**: Purple-to-pink gradient Web3 aesthetic
- Primary: `hsl(245 75% 50%)` (Purple)
- Secondary: `hsl(265 70% 55%)` (Violet)
- Accent: `hsl(175 60% 50%)` (Teal)

**Typography**:
- Body: Inter
- Monospace (addresses): JetBrains Mono

## Core Features

### 1. Prop Marketplace
- Browse props with filters (category, price range, search)
- Detailed prop pages with photo galleries
- Real-time availability status
- Vendor information display

### 2. Booking Flow
- Date range selection
- Automatic rental fee calculation
- Real Pera Wallet connection (Algorand TestNet)
- Read-only wallet address display
- Wallet connection requirement enforcement

### 3. Organizer Dashboard
- Event creation and management
- Booking tracking with status indicators
- QR code generation for AR experiences
- Live analytics (player count, total scores)

### 4. WebAR Game Experience
- QR code-activated AR games
- Tap-target gameplay with scoring
- Time-based challenges (customizable duration)
- Real-time HUD with score/time/targets

### 5. Reward System
- Tier-based rewards (Bronze, Silver, Gold)
- Ed25519-signed cryptographic vouchers
- On-chain reward claiming (mock)
- Voucher verification endpoint

## Data Models

### Props
- Name, description, category
- Daily rate & security deposit
- Location (address + coordinates)
- Photos (primary + gallery)
- Status (active/rented/maintenance)
- Vendor information

### Bookings
- Prop reference
- Organizer wallet address
- Date range (start/end)
- Rental fees & deposits
- Escrow transaction ID (mock)
- Status tracking

### Events
- Event details (name, description, date, location)
- Game configuration (type, duration, zones)
- Reward thresholds (Bronze/Silver/Gold points)
- Player statistics

### Game Sessions
- Event reference
- Player identification (wallet/email)
- Zone assignment
- Score & targets hit
- Reward tier earned
- Voucher claim status

## API Endpoints

### Props
- `GET /api/props` - List all props
- `GET /api/props/:id` - Get prop details
- `POST /api/props` - Create new prop (vendor)

### Bookings
- `GET /api/bookings` - List all bookings
- `GET /api/bookings/my-bookings` - User's bookings
- `GET /api/bookings/:id` - Booking details
- `POST /api/bookings` - Create booking

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Event details
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event

### Game Sessions
- `GET /api/events/:eventId/sessions` - Event sessions
- `POST /api/game-sessions` - Submit score & generate voucher

### Vouchers
- `POST /api/vouchers/verify` - Verify voucher signature

## Cryptographic Voucher System

### Voucher Structure
```typescript
{
  v: 1,                    // Version
  eventId: string,         // Event identifier
  sessionId: string,       // Game session ID
  wallet: string,          // Player wallet address
  points: number,          // Score earned
  tier: 0|1|2|3,          // Reward tier (0=none, 1=bronze, 2=silver, 3=gold)
  nonce: string,          // Random hex string (32 chars)
  exp: number             // Unix timestamp expiration
}
```

### Signing Process
1. Serialize voucher data to JSON
2. Create SHA-256 hash of JSON
3. Sign hash with Ed25519 private key
4. Return voucher + signature + hash

### Verification Process
1. Recreate hash from voucher data
2. Verify hash matches provided hash
3. Verify Ed25519 signature
4. Check expiration timestamp
5. Confirm session exists and unclaimed

## Page Routes

- `/` - Landing page with hero, features, stats
- `/marketplace` - Browse props with filters
- `/prop/:id` - Prop detail & booking flow
- `/dashboard` - Organizer dashboard (events + bookings)
- `/ar/:id?zone=XX` - AR game experience

## User Journeys

### Event Organizer Journey
1. Browse marketplace → find props
2. Book prop with dates → escrow deposit
3. Create AR event → configure game
4. Generate QR codes → place at venue
5. Monitor analytics → track engagement

### Attendee Journey
1. Scan QR code at event
2. Launch AR game in browser
3. Play tap-target game
4. Earn points & tier badge
5. Connect wallet → claim rewards

## Technical Decisions

### Why PostgreSQL?
- Production-ready data persistence
- ACID compliance for bookings/events
- Native UUID support for IDs
- Easy Replit integration with Neon
- Supports rollback capabilities

### Why Ed25519?
- Fast signature generation
- Small signature size (64 bytes)
- Perfect for mobile/web vouchers
- Native Algorand compatibility

### Why WebAR (A-Frame)?
- No app download required
- QR code instant activation
- Cross-platform (iOS/Android)
- Lower barrier to entry

## Production Features (Implemented)
- ✅ **PostgreSQL Database**: Full persistence with Drizzle ORM
- ✅ **Pera Wallet Integration**: Real Algorand TestNet wallet connection
- ✅ **Ed25519 Voucher Signing**: Cryptographic reward vouchers

## Mock/Simplified Features (In Progress)
- **Blockchain Escrow**: Mock transaction IDs (upgrading to real Algorand txns)
- **Photo Verification**: Placeholder (AI verification planned)
- **AR Targets**: Simulated (8th Wall upgrade planned)
- **Reward Claiming**: Mock on-chain transactions (ASA minting planned)

## Development Guidelines

### Adding New Features
1. Update schema in `shared/schema.ts`
2. Update storage interface in `server/storage.ts`
3. Add API routes in `server/routes.ts`
4. Create/update React components
5. Test end-to-end flow

### Code Conventions
- TypeScript strict mode enabled
- Zod validation for all API inputs
- TanStack Query for all data fetching
- Shadcn components for UI consistency
- `data-testid` attributes on interactive elements

### Design Principles
- Purple-to-pink gradient for branding
- Professional utility for core platform
- Playful/creative for AR experiences
- Mobile-first responsive design
- Accessible color contrasts

## Known Limitations
- Escrow still uses mock transaction IDs (upgrading to real Algorand txns)
- No smart contract deployment yet (PyTeal contracts designed)
- No actual photo upload/storage (AI verification planned)
- No conflict checking for booking dates
- No authentication beyond wallet connection
- No rate limiting or security hardening

## Future Enhancements
- Real Algorand smart contract integration
- IPFS photo storage with hashing
- Multi-wallet support (Pera, Defly, etc.)
- Advanced AR games (ring toss, scavenger hunt)
- Event analytics dashboard
- Vendor reputation system
- Automated dispute resolution

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `SESSION_SECRET` - Express session secret
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Database credentials

## Running the Project
1. Start development server: `npm run dev`
2. Frontend: http://localhost:5000
3. Backend API: http://localhost:5000/api/*

## Testing Strategy
- E2E testing with Playwright for user journeys
- Visual regression testing for UI consistency
- API endpoint testing for backend logic
- Voucher cryptography verification

---

**Built with** ⚡ on Replit
