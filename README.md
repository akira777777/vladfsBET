# VladfsBET — Production-Grade Online Casino & Sportsbook Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-Proprietary-gold.svg)]()
[![Platform](https://img.shields.io/badge/stack-Next.js%2016%20%7C%20Hono%20%7C%20Prisma%20%7C%20PostgreSQL-blue.svg)]()
[![Provably Fair](https://img.shields.io/badge/RNG-HMAC--SHA256%20Provably%20Fair-purple.svg)]()

**VladfsBET** is a full-featured, enterprise-grade online casino and global sportsbook platform engineered with financial-grade double-entry ledger architecture, cryptographic provably fair RNG, real-time AML risk monitoring, multi-jurisdiction regulatory controls, and rich interactive game engines.

---

## 🏛️ Platform Highlights & Architecture

- **Immutable Double-Entry Financial Ledger**:
  - Every financial movement (wager, payout, deposit, withdrawal reservation, bonus grant) creates balanced debit/credit lines across user sub-accounts (`AVAILABLE`, `BONUS`, `LOCKED`, `PENDING`) and house clearing accounts.
  - Zero frontend balance trust; absolute transaction integrity.
- **Cryptographic Provably Fair Engine**:
  - HMAC-SHA256 outcome generation combining server seeds, revealed SHA-256 seed hashes, client seeds, and round nonces.
  - In-game modal verifier allowing players to mathematically confirm outcome authenticity.
- **Interactive Game Suite**:
  - 🎰 **Gates of Vladfs / Cyber Neon 777 Slots**: 5x3 reels, 20 glowing paylines, Zeus lightning multipliers up to 25x, Free Spins feature buy.
  - 🎡 **European Roulette Deluxe**: 3D spinning wheel, complete inside/outside betting table (Straight, Split, Street, Corner, Red/Black, Even/Odd).
  - 🃏 **Quantum Blackjack**: Deal, Hit, Stand, Double Down, Split, realistic animated cards, dealer AI standing on 17.
  - 🚀 **Aero Crash Multiplier**: Live canvas exponential trajectory curve, instant manual cashout, auto-cashout multiplier targets, crash history ticker.
  - 🀄 **Dragon Speed Baccarat**: Punto Banco table layout, Player/Banker/Tie wagering, roadmaps.
  - ♠️ **Cyber Video Poker**: 5-card draw, interactive Hold toggles, Jacks or Better paytable matrix.
- **Live Dealer Experience**:
  - Lightning Roulette, Infinite Blackjack VIP, Speed Baccarat, and live game show lobbies with table limits ($0.10 - $5,000) and player occupancy counters.
- **Full-Scale Sportsbook**:
  - Live odds and match fixtures across Soccer, Basketball, Tennis, and Esports.
  - Interactive multi-selection Bet Slip with live potential payout calculator and My Bets tracking.
- **VIP Club & Promotions Engine**:
  - 5-Tier Loyalty System (*Bronze, Silver, Gold, Platinum, Diamond Legend*) with automated point accrual and up to 15% weekly cashback.
  - Bonus campaign templates, wagering multiplier tracking, and promotional code redemption.
- **Player Account & Cashier Center**:
  - Multi-method sandbox deposits (Credit Card, Bank Wire, Crypto Gateway).
  - Balance reservation withdrawals with compliance review states.
  - KYC verification hub with document uploader and checksum tracking.
  - Active device sessions manager with "Revoke other sessions".
  - Self-service Responsible Gaming controls (Deposit/Loss/Wager limits, Reality Checks, Cooling-off, Self-Exclusion).
- **Internal Staff Admin Dashboard (`/admin`)**:
  - Platform Command Center with live GGR, NGR, bet turnover, and payout metrics.
  - Player directory with manual status updates and mandatory audit notes.
  - Withdrawal review queue and dual-control balance adjustment tool.
  - KYC document verification queue and AML risk alert resolvers.
  - Support desk with customer chat and internal staff note threads.
  - Immutable audit trail stream and jurisdictional gating configuration.

---

## 📂 Monorepo Structure

```
vladfsBET/
├── apps/
│   ├── web/                    # Next.js 16 App Router (Player Portal & Admin Suite)
│   └── api/                    # High-Performance Hono REST API server (:4000)
├── packages/
│   ├── db/                     # Prisma schema, migrations, double-entry ledger, game engines
│   ├── types/                  # Shared TypeScript domain definitions
│   ├── utils/                  # High-precision Decimal math, crypto hashing, provably fair
│   └── config/                 # Zod environment schemas & platform brand constants
├── services/                   # Decoupled provider interfaces & mock adapters
│   ├── payments/               # PaymentGatewayManager, Card/Bank/Crypto providers
│   ├── kyc/                    # KycProviderInterface & automated verification
│   ├── games/                  # GameProviderInterface & VladfsOriginals engine
│   ├── sports/                 # SportsFeedProviderInterface & fixtures feed
│   ├── risk/                   # AML velocity rule engine & anomaly detection
│   └── notifications/          # Multi-channel notification dispatcher
├── docs/                       # Technical & compliance documentation
│   ├── ARCHITECTURE.md         # System design, ledger invariants, ERD
│   ├── API.md                  # Complete REST API reference
│   ├── SECURITY.md             # Security, cryptographic standards, AML velocity rules
│   └── COMPLIANCE.md           # Regulatory sandbox notice, age limits, KYC checklists
└── .github/workflows/
    └── ci.yml                  # Automated test & build CI pipeline
```

---

## 🚀 Quickstart & Development Setup

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL 15+ (or Docker)

### Installation
```powershell
# 1. Clone repository & install dependencies
npm install

# 2. Configure environment variables
copy .env.example .env

# 3. Initialize database & run seed script
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Running Locally
```powershell
# Run both API and Web concurrently
npm run dev

# Or run separately:
npm run api:dev    # API on http://127.0.0.1:4000
npm run web:dev    # Web on http://localhost:3000
```

### Building for Production
```powershell
npm run build
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@vladfsbet.com` | `Admin123456!` | Full Administrative & Compliance Console (`/admin`) |
| **Compliance Officer** | `compliance@vladfsbet.com` | `Admin123456!` | KYC Review & AML Alerts Queue |
| **Demo Player** | `player1@vladfsbet.com` | `Player123456!` | Authenticated Player Portal with $1,000 Starting Balance |

---

## 🛡️ Responsible Gaming & Regulatory Sandbox Notice

VladfsBET is architected as a high-fidelity demonstration environment.
- All monetary figures and balances represent **virtual sandbox credits**.
- Real-money transactional settlement is strictly disabled until the operator obtains formal gaming licenses and merchant payment contracts within the target operating jurisdictions.
- Underage gambling is strictly prohibited. Minimum age restrictions (18+/21+) are strictly enforced per jurisdiction.
- For help with problem gambling, visit [BeGambleAware](https://www.begambleaware.org) or [GamCare](https://www.gamcare.org.uk).
