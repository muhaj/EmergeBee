# EmergeBee: Events Prop Rentals + AR Rewards on Algorand

**Trustless event prop rentals with blockchain-secured deposits and WebAR gamification rewards**

EmergeBee combines a decentralized marketplace for event props with immersive AR experiences, rewarding attendees with on-chain tokens while ensuring secure, automated rental agreements through Algorand smart contracts.

![EmergeBee Banner](https://via.placeholder.com/1200x400/6B46C1/FFFFFF?text=EmergeBee)

---

## 🎯 One-Liner

**Rent giant inflatables, run AR mini-games, reward attendees with blockchain tokens — all secured by Algorand smart contracts.**

---

## 🌟 Key Features

### 🏪 Decentralized Prop Marketplace
- Browse event props (inflatables, sculptures, branded setups)
- Real-time availability calendar
- Transparent pricing with blockchain-secured deposits
- Vendor dashboards with flexible payout options

### 🎮 WebAR Gamification
- QR code-activated AR experiences (no app download needed)
- Tap-target mini-games built with A-Frame
- Real-time scoring and leaderboards
- Instant rewards via Pera Wallet

### 🔐 Blockchain Security
- **Smart Contract Escrow**: Automated deposit management with delivery/return verification
- **Cryptographic Vouchers**: Ed25519-signed reward claims prevent fraud
- **ASA Rewards**: Three-tier token system (Bronze, Silver, Gold medals)
- **Trustless Payments**: No intermediaries — rental agreements execute on-chain

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
├──────────────┬──────────────────┬──────────────────────────┤
│  Marketplace │ Organizer Portal │    AR Experience         │
│  (Browse)    │  (Dashboard)     │    (WebAR + Rewards)     │
└──────────────┴──────────────────┴──────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
├──────────────────┬──────────────────┬──────────────────────┤
│   Express API    │  Voucher Signer  │   Payout Manager     │
│  (REST + Auth)   │  (Ed25519)       │   (Hybrid System)    │
└──────────────────┴──────────────────┴──────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
├──────────────────────────────┬──────────────────────────────┤
│      PostgreSQL (Neon)       │        Algorand TestNet      │
│  (Props, Bookings, Events)   │  (Smart Contracts + ASAs)    │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 🛠️ Smart Contracts (PyTeal)

### Contract: **RentalEscrow.algo**

**Purpose:** Manages rental deposits and automates payment flows with delivery/return verification.

**Key Methods:**

#### `deposit(vendorAddress, rentalFee, depositAmount)`
- Organizer deposits rental fee + damage deposit in ALGO
- Contract holds funds in escrow
- Emits `DepositReceived` event

#### `confirmDelivery()`
- Vendor confirms prop delivery
- Marks rental as "active"
- Enables return process

#### `confirmReturn(noDamage: bool)`
- Organizer confirms prop return condition
- If `noDamage == true`:
  - Releases deposit back to organizer
  - Transfers rental fee to vendor
- If `noDamage == false`:
  - Triggers dispute flow

#### `reportDamage(damageDescription, estimatedCost)`
- Either party can report damage
- Withholds deposit pending resolution
- Logs damage details on-chain

#### `releaseFee()` / `refundDeposit()`
- Admin-triggered settlement after verification
- Automated fund distribution based on contract state

**Security Features:**
- Timelock mechanisms prevent indefinite fund locking
- Role-based access control (organizer vs vendor vs admin)
- Immutable transaction history for dispute resolution

---

### Contract: **EventRewardManager.algo**

**Purpose:** Verifies cryptographic vouchers and distributes ASA rewards to AR game players.

**Key Methods:**

#### `claimReward(voucherData, signature, tier)`
- Validates Ed25519 signature against trusted public key
- Verifies voucher hasn't been replayed (nonce tracking)
- Transfers appropriate ASA token (Bronze/Silver/Gold)
- Marks voucher as consumed

**Voucher Structure:**
```json
{
  "eventId": 42,
  "wallet": "ALGORAND_ADDRESS",
  "score": 95,
  "tier": 3,
  "nonce": "unique-uuid",
  "expiry": 1729555200
}
```

**Security:**
- Vouchers signed server-side after AR game validation
- SHA-256 hashing before Ed25519 signature
- Prevents front-running and replay attacks
- Single-use nonce enforcement

---

## 🪙 Algorand Standard Assets (ASAs)

EmergeBee uses three reward tokens on Algorand TestNet:

| Token         | ASA ID      | Purpose                          |
|---------------|-------------|----------------------------------|
| **SPBRNZ**    | 747986229   | Bronze Medal (score 50-74)       |
| **SPSLVR**    | 747986230   | Silver Medal (score 75-94)       |
| **SPGOLD**    | 747986231   | Gold Medal (score 95-100)        |

**Automatic Distribution:**
1. Player completes AR game
2. Backend issues signed voucher
3. Player connects Pera Wallet
4. Opts-in to ASA (one-time)
5. Claims reward via smart contract
6. Token appears in wallet instantly

---

## 🎮 AR Game Flow

```mermaid
sequenceDiagram
    participant User
    participant QR Code
    participant AR Game
    participant Backend
    participant Blockchain

    User->>QR Code: Scan at event
    QR Code->>AR Game: Launch WebAR (A-Frame)
    User->>AR Game: Play tap-target game (30s)
    AR Game->>Backend: Submit score
    Backend->>Backend: Validate + Sign voucher (Ed25519)
    Backend->>User: Return signed voucher
    User->>Blockchain: Connect Pera Wallet
    User->>Blockchain: Claim reward (submit voucher)
    Blockchain->>Blockchain: Verify signature + nonce
    Blockchain->>User: Transfer ASA token
```

---

## 🔒 Security Architecture

### 1. **Cryptographic Vouchers**
- **Signing Algorithm:** Ed25519 (fast, secure, 64-byte signatures)
- **Hashing:** SHA-256 before signature
- **Nonce Protection:** UUID v4 ensures single-use
- **Expiry Enforcement:** 24-hour TTL on vouchers

### 2. **Smart Contract Security**
- **Role-Based Access:** Only authorized addresses can execute critical functions
- **Timelock Protection:** Prevents indefinite fund locking (7-day auto-refund)
- **Event Logging:** All state changes emit verifiable events
- **Replay Protection:** On-chain nonce tracking

### 3. **Wallet Authentication**
- **Pera Wallet Integration:** Industry-standard Algorand wallet
- **No Private Key Exposure:** All signing happens client-side in wallet
- **Session Management:** Secure session storage with auto-expiry

### 4. **API Security**
- **Input Validation:** Zod schemas on all endpoints
- **Rate Limiting:** Prevents abuse of voucher issuance
- **CORS Protection:** Whitelisted origins only
- **Environment Secrets:** All sensitive keys in .env (never committed)

---

## 💻 Tech Stack

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Routing:** Wouter (lightweight)
- **State:** TanStack Query v5
- **UI:** Shadcn UI + Radix UI + Tailwind CSS
- **Forms:** React Hook Form + Zod
- **AR:** A-Frame (WebXR)
- **Wallet:** Pera Wallet Connect SDK

### Backend
- **Server:** Express.js + TypeScript
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **Auth:** Pera Wallet (blockchain-based)
- **Crypto:** @noble/ed25519 for voucher signing
- **Blockchain:** py-algorand-sdk for contract deployment

### Smart Contracts
- **Language:** PyTeal (Algorand)
- **Version:** TEAL v10
- **Network:** Algorand TestNet
- **Deployment:** AlgoKit + py-algorand-sdk

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Algorand TestNet account
- Pera Wallet (mobile or browser extension)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/emergebee.git
cd emergebee

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Add your Algorand TestNet credentials, database URL, etc.

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Deploy Smart Contracts

```bash
# Install Python dependencies
pip install pyteal py-algorand-sdk

# Deploy escrow contract
python scripts/deploy_rental_escrow.py

# Deploy reward manager
python scripts/deploy_reward_manager.py

# Create ASA tokens (Bronze, Silver, Gold)
python scripts/create_reward_assets.py
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/emergebee

# Algorand
ALGORAND_NETWORK=testnet
ALGORAND_ALGOD_URL=https://testnet-api.algonode.cloud
ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud
ALGORAND_DEPLOYER_MNEMONIC=your_25_word_mnemonic

# Voucher Signing
ED25519_PRIVATE_KEY=your_private_key_base64
ED25519_PUBLIC_KEY=your_public_key_base64

# ASA IDs (after deployment)
ASA_BRONZE_ID=747986229
ASA_SILVER_ID=747986230
ASA_GOLD_ID=747986231
```

---

## 📊 Database Schema

### Core Tables

**props**
- Prop listings with photos, pricing, vendor wallet address
- Availability calendar (JSONB)
- Categories, dimensions, location data

**bookings**
- Rental agreements linking organizers to props
- Escrow contract IDs, transaction hashes
- Delivery/return status tracking
- Damage reports and dispute resolution

**events**
- AR experience configurations
- QR code zones, reward tier thresholds
- Live analytics (player count, avg score)

**game_sessions**
- Individual AR gameplay records
- Scores, voucher data, claim status
- Device info, geolocation (optional)

**vendors**
- Payout preferences (Stripe, bank, blockchain)
- Pending balance tracking
- Earnings history

---

## 🎨 User Flows

### 1. **Vendor: List a Prop**
1. Connect Pera Wallet
2. Navigate to Dashboard → List Props
3. Upload photos, set pricing + deposit
4. Submit → Wallet address auto-saved
5. Prop appears in marketplace

### 2. **Organizer: Rent a Prop**
1. Browse marketplace, select prop
2. Choose rental dates
3. Connect Pera Wallet
4. Smart contract deploys escrow
5. Sign transaction (rental fee + deposit)
6. Vendor confirms delivery → Rental active
7. After event, confirm return → Deposit refunded (if no damage)

### 3. **Attendee: Play AR Game & Earn Rewards**
1. Scan QR code at event venue
2. WebAR game loads (no app needed)
3. Play tap-target game (30 seconds)
4. Submit score → Backend issues voucher
5. Connect Pera Wallet
6. Opt-in to reward ASA (first time only)
7. Claim reward → Token transferred instantly

---

## 🌐 Live Demo

🔗 **Website:** [https://emergebee.com](https://emergebee.com)  
🔗 **Marketplace:** [https://emergebee.com/marketplace](https://emergebee.com/marketplace)  
🔗 **AR Demo:** [Scan QR at event]

### Demo Credentials (TestNet)
- **Test Wallet:** Create one at [Pera Wallet TestNet](https://perawallet.app)
- **Faucet:** Get test ALGO at [Algorand Dispenser](https://testnet.algoexplorer.io/dispenser)

---

## 📦 Smart Contract Addresses (TestNet)

| Contract          | Address                                      | Explorer Link                                                                 |
|-------------------|----------------------------------------------|-------------------------------------------------------------------------------|
| RentalEscrow      | `0xABC123...` (EVM-compatible via AVM)       | [View on AlgoExplorer](https://testnet.algoexplorer.io/application/...)      |
| RewardManager     | `0xDEF456...`                                | [View on AlgoExplorer](https://testnet.algoexplorer.io/application/...)      |
| Bronze ASA        | 747986229                                    | [View Asset](https://testnet.algoexplorer.io/asset/747986229)                |
| Silver ASA        | 747986230                                    | [View Asset](https://testnet.algoexplorer.io/asset/747986230)                |
| Gold ASA          | 747986231                                    | [View Asset](https://testnet.algoexplorer.io/asset/747986231)                |

---

## 🛣️ Roadmap

### ✅ MVP (Completed)
- [x] Prop marketplace with blockchain escrow
- [x] WebAR tap-target game
- [x] Cryptographic voucher system
- [x] ASA reward distribution
- [x] Pera Wallet integration
- [x] Vendor payout system

### 🚧 In Progress
- [ ] Mobile app (React Native)
- [ ] Multi-signature escrow for high-value props
- [ ] AI damage detection (photo comparison)
- [ ] Social sharing with auto-overlays
- [ ] Analytics dashboard for organizers

### 🔮 Future (v2+)
- [ ] Cross-chain support (Ethereum, Polygon)
- [ ] NFT-based prop ownership certificates
- [ ] DAO governance for dispute resolution
- [ ] AR multiplayer games
- [ ] Integration with Shopify (coupon redemption)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style (Prettier + ESLint configs)
- Write tests for new features
- Update documentation
- Ensure smart contract changes are audited

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Algorand Foundation** for blockchain infrastructure
- **A-Frame Community** for WebAR framework
- **Shadcn UI** for beautiful component library
- **Neon** for serverless PostgreSQL
- **Pera Wallet** for seamless wallet integration

---

## 📞 Contact & Links

- **Website:** [https://emergebee.com](https://emergebee.com)
- **GitHub:** [https://github.com/muhaj/emergebee](https://github.com/muhaj/emergebee)
- **Twitter:** [@EmergeBee](https://twitter.com/emergebee)
- **Email:** hello@emergebee.com

---

## 🎥 Demo Video

[![EmergeBee Demo](https://via.placeholder.com/800x450/6B46C1/FFFFFF?text=Click+to+Watch+Demo)](https://youtu.be/your-demo-video)

---

## 📸 Screenshots

### Marketplace
![Marketplace Screenshot](https://via.placeholder.com/800x500/6B46C1/FFFFFF?text=Marketplace)

### AR Game Experience
![AR Game Screenshot](https://via.placeholder.com/800x500/6B46C1/FFFFFF?text=AR+Game)

### Organizer Dashboard
![Dashboard Screenshot](https://via.placeholder.com/800x500/6B46C1/FFFFFF?text=Dashboard)

### Reward Claim
![Reward Claim Screenshot](https://via.placeholder.com/800x500/6B46C1/FFFFFF?text=Claim+Rewards)

---

<div align="center">

**Built with ❤️ on Algorand**

[⬆ Back to Top](#emergebee-events-prop-rentals--ar-rewards-on-algorand)

</div>
