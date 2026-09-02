# VladfsBET Architecture & System Design

## 1. High-Level Architecture Overview

VladfsBET follows a modular, decoupled monorepo architecture designed for high throughput, sub-50ms round settlement, zero balance desynchronization, and multi-jurisdiction compliance.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│   Next.js 16 (React 19, Turbopack, Tailwind CSS, shadcn)   │
│   - Player Portal (Lobbies, Interactive Games, Cashier)     │
│   - Staff Admin Console (/admin)                            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / Session Cookie
┌──────────────────────────────▼──────────────────────────────┐
│                        API Gateway                          │
│   Hono Framework (Node.js runtime on Port 4000)             │
│   - Session Auth & RBAC Middleware                          │
│   - Request Rate Limiting & Input Sanitization               │
│   - Audit Trail & Context Logger Interceptors               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Internal Method Calls
┌──────────────────────────────▼──────────────────────────────┐
│                    Domain Services Layer                    │
│   - Provably Fair RNG Simulation Engine (HMAC-SHA256)       │
│   - Double-Entry Ledger Posting Manager                     │
│   - Responsible Gaming Limiter & Self-Exclusion Gate        │
│   - VIP Point Accrual & Bonus Wagering Engine               │
│   - AML Velocity Risk & Anomaly Analyzer                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM
┌──────────────────────────────▼──────────────────────────────┐
│                      Database Layer                         │
│   PostgreSQL 15+ (ACID Compliant)                           │
│   - Double-Entry Ledger (Journals & Lines)                  │
│   - Players, VIP Tiers, Bonus Templates                     │
│   - Game Catalog, Sports Fixtures, Support Tickets          │
│   - Immutable Audit Logs Stream                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Double-Entry Financial Ledger Design

All financial operations strictly adhere to double-entry bookkeeping invariants:

$$\sum \text{Debit Amounts} = \sum \text{Credit Amounts}$$

### Wallet Account Types per Player:
1. **`AVAILABLE`**: Usable balance for gameplay, sports bets, and withdrawal requests.
2. **`BONUS`**: Active promotional funds undergoing wagering multipliers.
3. **`LOCKED`**: Restricted funds subject to verification or bonus completion.
4. **`PENDING`**: Balance reserved during withdrawal processing.

### Example Journal: Game Round (Wager & Win)
When a player bets $10 on Roulette and wins $36:
1. **Bet Placement**:
   - `DEBIT`: Player `AVAILABLE` account ($10.00)
   - `CREDIT`: House Clearing Account ($10.00)
2. **Payout Settlement**:
   - `DEBIT`: House Clearing Account ($36.00)
   - `CREDIT`: Player `AVAILABLE` account ($36.00)

### Example Journal: Withdrawal Reservation & Approval
1. **Withdrawal Requested ($100.00)**:
   - `DEBIT`: Player `AVAILABLE` account ($100.00)
   - `CREDIT`: Player `PENDING` account ($100.00)
2. **Admin Approved Payout**:
   - `DEBIT`: Player `PENDING` account ($100.00)
   - `CREDIT`: House Settlement Account ($100.00)
3. **Admin Rejected Payout (Refund)**:
   - `DEBIT`: Player `PENDING` account ($100.00)
   - `CREDIT`: Player `AVAILABLE` account ($100.00)

---

## 3. Cryptographic Provably Fair Engine

Game outcomes are calculated deterministically using HMAC-SHA256:

```typescript
const hash = crypto.createHmac("sha256", serverSeed)
  .update(`${clientSeed}:${nonce}:${roundNumber}`)
  .digest("hex");

// Extract first 32 bits and normalize to float [0, 1)
const intVal = parseInt(hash.substring(0, 8), 16);
const floatResult = intVal / 0x100000000;
```

Players receive the SHA-256 hash of the server seed **before** playing, and the server seed is revealed upon cycle rotation, allowing full verification via the in-game Provably Fair dialog.
