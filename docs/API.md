# VladfsBET REST API Reference

The VladfsBET backend is exposed via a high-performance Hono REST API server running on port `4000`.

Base URL: `http://127.0.0.1:4000/api` (or `/api` via Next.js reverse proxy).

---

## 1. Authentication & Player Account

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register player account (checks age per jurisdiction) | No |
| `/api/auth/login` | `POST` | Authenticate player and set httpOnly session cookie | No |
| `/api/auth/logout` | `POST` | Invalidate current session token | Yes |
| `/api/auth/me` | `GET` | Retrieve authenticated player profile & VIP status | Yes |
| `/api/auth/profile` | `POST` | Update personal profile details (Name, City) | Yes |
| `/api/auth/change-password` | `POST` | Update account password | Yes |
| `/api/auth/sessions` | `GET` | List active device sessions | Yes |
| `/api/auth/sessions/revoke-others` | `POST` | Terminate all other active device sessions | Yes |

---

## 2. Wallet, Ledger & Cashier

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/wallet` | `GET` | Get balance snapshot (`available`, `bonus`, `locked`, `pending`) | Yes |
| `/api/wallet/transactions` | `GET` | Get immutable ledger transaction history | Yes |
| `/api/wallet/payment-methods`| `GET` | List available deposit & withdrawal payment gateways | Yes |
| `/api/wallet/deposit` | `POST` | Execute sandbox virtual deposit | Yes |
| `/api/wallet/withdrawal` | `POST` | Submit withdrawal request (reserves balance into `PENDING`) | Yes |
| `/api/wallet/demo-credit` | `POST` | Faucet credit sandbox funds | Yes |

---

## 3. Casino Games & Provably Fair

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/games` | `GET` | Retrieve full casino games catalog | No |
| `/api/games/:slug` | `GET` | Get game details and metadata | No |
| `/api/games/:slug/play` | `POST` | Wager and settle game round with Provably Fair RNG | Yes |
| `/api/games/provably-fair/seeds` | `GET` | Get active server seed hash and client seed | Yes |
| `/api/games/provably-fair/rotate` | `POST` | Rotate seeds and reveal previous server seed | Yes |

---

## 4. Sportsbook

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/sports/events` | `GET` | List sports fixtures and live odds markets | No |
| `/api/sports/bet` | `POST` | Place sportsbook wager (debited via ledger) | Yes |
| `/api/sports/my-bets` | `GET` | List placed and settled sportsbook bets | Yes |

---

## 5. Bonuses & VIP Loyalty

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/bonuses/templates` | `GET` | List available bonus campaigns | No |
| `/api/bonuses/claim` | `POST` | Activate bonus campaign | Yes |
| `/api/bonuses/redeem-code`| `POST` | Redeem promotional bonus code | Yes |
| `/api/vip/claim-cashback`| `POST` | Claim accrued VIP weekly cashback | Yes |

---

## 6. KYC & Responsible Gaming

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/kyc/case` | `GET` | Retrieve current player KYC case & uploaded documents | Yes |
| `/api/kyc/upload` | `POST` | Upload verification document metadata & checksum | Yes |
| `/api/rg/summary` | `GET` | Get player responsible gaming limits & self-exclusion state | Yes |
| `/api/rg/limits` | `POST` | Set deposit, loss, or wager limits | Yes |
| `/api/rg/cooling-off` | `POST` | Apply temporary cooling-off break (24h - 30d) | Yes |
| `/api/rg/self-exclude` | `POST` | Apply self-exclusion lockout (6m - Permanent) | Yes |

---

## 7. Administrative Console (`/api/admin/*`)

| Endpoint | Method | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `/api/admin/auth/login` | `POST` | Authenticate staff/admin user | Public |
| `/api/admin/overview` | `GET` | Fetch platform KPIs (GGR, NGR, Volume, Alerts) | ADMIN |
| `/api/admin/players` | `GET` | Search and list player directory | ADMIN |
| `/api/admin/players/:id/status` | `POST` | Update player account status with mandatory audit note | ADMIN |
| `/api/admin/withdrawals` | `GET` | List pending withdrawal review queue | ADMIN |
| `/api/admin/withdrawals/:id/approve` | `POST` | Approve withdrawal and post settlement ledger journal | ADMIN |
| `/api/admin/withdrawals/:id/reject` | `POST` | Reject withdrawal and refund funds from `PENDING` to `AVAILABLE` | ADMIN |
| `/api/admin/ledger/adjust` | `POST` | Execute dual-control manual balance adjustment | ADMIN |
| `/api/admin/kyc` | `GET` | List open KYC verification cases | ADMIN / COMPLIANCE |
| `/api/admin/kyc/:id/review` | `POST` | Approve, Reject, or Request Info for KYC case | ADMIN / COMPLIANCE |
| `/api/admin/risk/alerts` | `GET` | List AML risk and anomaly alerts | ADMIN / COMPLIANCE |
| `/api/admin/risk/alerts/:id/resolve` | `POST` | Resolve AML alert with compliance findings | ADMIN / COMPLIANCE |
| `/api/admin/support/tickets` | `GET` | List support tickets queue | ADMIN / SUPPORT |
| `/api/admin/support/tickets/:id/message` | `POST` | Post customer reply or internal staff note | ADMIN / SUPPORT |
| `/api/admin/audit-logs` | `GET` | Retrieve immutable administrative audit stream | ADMIN |
