# VladfsBET Security & Risk Mitigation Standards

## 1. Cryptographic Safeguards
- **Password Security**: Credentials are protected using the memory-hard `scrypt` key derivation function with unique cryptographic salts, mitigating GPU-accelerated brute-force attacks.
- **Session Tokens**: 256-bit cryptographically secure pseudorandom tokens stored with SHA-256 digests in PostgreSQL.
- **Cookie Security**: Auth cookies are marked `httpOnly`, `SameSite=Lax`, and `Secure` (in production) to prevent XSS exfiltration and CSRF attacks.

---

## 2. Double-Entry Balance Preservation
- Zero trust on client balance representations.
- All monetary balances are recalculated from immutable `LedgerLine` entries or maintained via transactional double-entry journals.
- Database operations on financial journals execute inside ACID transactions with strict isolation levels.

---

## 3. Balance Funding Policy
- A player receives one $1,000 virtual starting balance during registration.
- Deposit, faucet, promo-code credit, VIP cashback, and manual balance-adjustment routes are disabled.
- Game stakes and payouts continue to use the double-entry ledger.

---

## 4. Role-Based Access Control (RBAC) & Dual Control
- Admin endpoints strictly enforce staff authorization.
- Sensitive administrative operations such as KYC approvals and account suspensions require reason codes and are written to `AuditLog`.

---

## 5. DDoS Mitigation & Application-Level Rate Limiting
- **Multi-Tier Rate Limiting (Sliding Window)**:
  - **Auth (`/api/auth/*`)**: 10 requests / min per IP to eliminate brute-force and credential stuffing.
  - **Burst**: 40 requests / 10 seconds per client.
  - **Wallet (`/api/wallet/*`)**: 30 requests / min per client.
  - **Gameplay & Sports (`/api/games/*/play`, `/api/sports/bet`)**: 60 requests / min.
  - **Global API (`/api/*`)**: 240 requests / min per client.
  - Returns standard `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After` (HTTP 429).
  - Production instances share counters through `REDIS_URL`; a bounded in-process limiter remains active if Redis is temporarily unavailable.
- **Payload Size Guards (`bodyLimit`)**:
  - Global API requests strictly capped at **128 KB** to prevent Event Loop blocking and Memory Exhaustion (HTTP 413).
  - KYC document uploads (`/api/kyc/upload`) are capped at **4 MB**.
- **Request Timeout Defense**:
  - Global 15-second execution timeout prevents Slowloris and connection starvation attacks (HTTP 504).
- **Security Headers**:
  - Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, and HSTS.

---

## 6. Edge & Reverse-Proxy Requirements
- Application rate limiting protects database and CPU work; volumetric DDoS traffic must be absorbed by the hosting edge or reverse proxy.
- Standalone Node binds to `127.0.0.1` by default and limits headers, connection count, keep-alive time, and request duration.
- Forwarding headers are ignored unless Vercel, Cloudflare, or trusted proxy CIDRs are explicitly configured.
- On Vercel, the platform-owned `x-vercel-forwarded-for` header is used. For Cloudflare, expose the origin only through Cloudflare before setting `TRUSTED_PROXY_PROVIDER=cloudflare`.

