# Spectacle - Trustless Event Prop Rentals + AR Rewards

## Overview
Spectacle is a Web3 platform enabling trustless event prop rentals with AR gamification and blockchain-secured rewards on Algorand. The platform combines prop marketplace functionality with WebAR tap-target games and cryptographic voucher-based reward systems.

## Project Status
**Current Version**: MVP → Production Transition  
**Last Updated**: October 18, 2025  
**Development Stage**: Real Blockchain Integration Phase  
**Recent Milestone**: Algorand Smart Contract Escrow Integration Complete

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
- **Smart Contracts**: PyTeal (Algorand TEAL v10)
- **SDK**: py-algorand-sdk for contract deployment

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

### Algorand Smart Contracts
- `POST /api/algorand/deploy-contract` - Deploy rental escrow contract to TestNet
- `POST /api/algorand/pay-deposit` - Organizer pays deposit to contract
- `POST /api/algorand/confirm-delivery` - Vendor confirms prop delivery
- `POST /api/algorand/confirm-return` - Organizer confirms prop return
- `GET /api/algorand/contract-state/:appId` - Read contract global state

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
- ✅ **Smart Contract Escrow**: PyTeal rental escrow deployed to TestNet
- ✅ **Contract Deployment**: Automated deployment via Python SDK
- ✅ **Transaction Tracking**: Full transaction history with explorer links

## Mock/Simplified Features (In Progress)
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

## Smart Contract Architecture

### Rental Escrow Contract (PyTeal)
**File**: `contracts/rental_escrow.py`

The rental escrow smart contract is a stateful Algorand application that manages trustless prop rentals with deposit protection.

**Global State Variables**:
- `organizer_addr` - Event organizer's Algorand address
- `vendor_addr` - Prop vendor's Algorand address
- `deposit_amount` - Security deposit in microALGOs
- `rental_fee` - Rental payment in microALGOs
- `lease_start` - Unix timestamp when rental begins
- `lease_end` - Unix timestamp when rental ends
- `deposit_paid` - Boolean flag for deposit status
- `prop_delivered` - Boolean flag for delivery confirmation
- `prop_returned` - Boolean flag for return confirmation
- `damage_reported` - Boolean flag for damage claims

**Contract Methods**:
1. `deposit` - Organizer pays deposit + rental fee to contract
2. `delivery` - Vendor confirms prop delivery
3. `return` - Organizer confirms prop return (undamaged)
4. `damage` - Organizer reports damage
5. `release_fee` - Vendor claims rental fee (after delivery)
6. `refund` - Organizer claims deposit refund (after return)
7. `claim` - Vendor claims deposit (if damage reported)
8. `timeout` - Handle refunds after timeout

**Deployment Flow**:
1. Compile PyTeal → TEAL bytecode
2. Deploy to TestNet via AlgoNode API
3. Store app ID and contract address in database
4. Track all transaction IDs

### Contract Interaction Scripts
**Deployment**: `contracts/deploy.py`
- Compiles PyTeal contract to TEAL
- Creates application on Algorand TestNet
- Returns app ID, contract address, and deployment TX ID

**Interaction**: `contracts/interact.py`
- `pay_deposit()` - Send deposit + rental fee to contract
- `confirm_delivery()` - Vendor marks delivery complete
- `confirm_return()` - Organizer marks return complete
- `get_contract_state()` - Read global state

## Known Limitations
- No actual photo upload/storage (AI verification planned)
- No conflict checking for booking dates
- No authentication beyond wallet connection
- No rate limiting or security hardening
- TestNet only (MainNet deployment requires audit)

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
- `ALGORAND_DEPLOYER_MNEMONIC` - 25-word Algorand mnemonic for contract deployment (TestNet)

## Running the Project
1. Start development server: `npm run dev`
2. Frontend: http://localhost:5000
3. Backend API: http://localhost:5000/api/*

## Testing Strategy
- E2E testing with Playwright for user journeys
- Visual regression testing for UI consistency
- API endpoint testing for backend logic
- Voucher cryptography verification
- Smart contract deployment testing on TestNet

## Algorand Smart Contract Testing Guide

### Prerequisites
1. **Get TestNet ALGO**:
   - Visit: https://bank.testnet.algorand.network/
   - Connect with Google account
   - Dispense 5-10 ALGO (free)
   - **Save your 25-word mnemonic phrase**

2. **Set Environment Variable**:
   ```bash
   ALGORAND_DEPLOYER_MNEMONIC="word1 word2 word3 ... word25"
   ```

### End-to-End Test Flow

**Step 1: Create a Booking with Smart Contract**
1. Navigate to `/marketplace`
2. Select a prop (e.g., "Giant LED Letters")
3. Click prop → Fill booking form:
   - Start Date: Tomorrow
   - End Date: 3 days later
   - Your Wallet: Connect Pera Wallet
   - Vendor Wallet: `<TestNet address>`
   - Deployer Mnemonic: `<Your 25-word mnemonic>`
4. Click "Confirm Booking & Deploy Contract"
5. Wait for contract deployment (~5-10 seconds)
6. **Verify Success**:
   - Contract App ID displayed
   - Contract Address shown
   - Deployment TX ID with TestNet explorer link
   - Button to "View Contract on TestNet Explorer"

**Step 2: Verify on TestNet Explorer**
1. Click "View Contract on TestNet Explorer" link
2. Opens: `https://testnet.algoexplorer.io/application/{appId}`
3. **Verify**:
   - Application exists
   - Creator address matches deployer
   - Global state shows:
     - `organizer_addr` = Your wallet
     - `vendor_addr` = Vendor wallet
     - `deposit_amount` = Deposit in microALGOs
     - `rental_fee` = Rental fee in microALGOs
     - `deposit_paid` = 0 (false)

**Step 3: View on Organizer Dashboard**
1. Navigate to `/organizer-dashboard`
2. Click "My Bookings" tab
3. **Verify Booking Card Shows**:
   - Booking ID, dates, status
   - Rental fee and deposit amounts
   - "Algorand Smart Contract Escrow" section
   - App ID and Contract Address
   - Transaction History:
     - Deployment TX with explorer link
   - "View Contract on TestNet Explorer" button

**Step 4: Test Contract Interactions (Optional)**
To test deposit payment and delivery confirmation:

```bash
# Pay deposit (using API endpoint)
curl -X POST http://localhost:5000/api/algorand/pay-deposit \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "<booking-id>",
    "userMnemonic": "<organizer-mnemonic>",
    "appId": <app-id>
  }'

# Expected: Returns depositTxId and updates booking status to "confirmed"
```

### Testing Checklist
- [ ] Booking creates contract with correct parameters
- [ ] Contract deployment TX appears on TestNet explorer
- [ ] App ID and contract address stored in database
- [ ] Organizer dashboard displays all contract info
- [ ] All transaction links open TestNet explorer
- [ ] Contract global state matches booking parameters
- [ ] Multiple bookings create separate contracts

### Common Issues
**Issue**: "Deployment failed: insufficient funds"
- **Solution**: Ensure deployer wallet has at least 0.5 ALGO on TestNet

**Issue**: "Python script failed"
- **Solution**: Verify Python 3.11 and packages installed (`pyteal`, `py-algorand-sdk`)

**Issue**: "Invalid mnemonic"
- **Solution**: Ensure mnemonic is exactly 25 words, space-separated

**Issue**: "Contract not found on explorer"
- **Solution**: Wait 5-10 seconds for TestNet propagation, then refresh

### TestNet Resources
- **Faucet**: https://bank.testnet.algorand.network/
- **Explorer**: https://testnet.algoexplorer.io/
- **API**: https://testnet-api.algonode.cloud (public, no token required)
- **Status**: https://status.algorand.org/

---

**Built with** ⚡ on Replit
