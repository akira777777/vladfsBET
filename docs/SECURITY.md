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

## 3. AML Risk Engine & Velocity Controls
- **Deposit Velocity Limits**: Max 5 deposits within a 1-hour window.
- **High Single-Transaction Gating**: Transactions exceeding €5,000 trigger automated KYC escalation and compliance hold.
- **Rapid Turnaround Rule**: Immediate withdrawal requests following deposits without adequate game wagering automatically generate an AML review alert.
- **Account Multiplicity Check**: Duplicate IP, device fingerprint, and beneficiary bank details trigger fraud review flags.

---

## 4. Role-Based Access Control (RBAC) & Dual Control
- Admin endpoints strictly enforce staff authorization.
- Sensitive administrative operations (e.g. manual ledger balance adjustments, KYC approvals, account suspensions) require mandatory reason codes and are immutably written to `AuditLog`.

---

## 5. DDoS Mitigation & Application-Level Rate Limiting
- **Multi-Tier Rate Limiting (Sliding Window)**:
  - **Auth (`/api/auth/*`)**: 10 requests / min per IP to eliminate brute-force and credential stuffing.
  - **Wallet (`/api/wallet/*`)**: 20 requests / min per IP/account to prevent ledger contention and withdrawal flooding.
  - **Gameplay & Sports (`/api/games/*/play`, `/api/sports/bets`)**: 60 requests / min to block automated bot clickers.
  - **Global API (`/api/*`)**: 120 requests / min per IP.
  - Returns standard `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After` (HTTP 429).
- **Payload Size Guards (`bodyLimit`)**:
  - Global API requests strictly capped at **128 KB** to prevent Event Loop blocking and Memory Exhaustion (HTTP 413).
  - KYC document uploads (`/api/kyc/documents`) gated separately up to **10 MB**.
- **Request Timeout Defense**:
  - Global 15-second execution timeout prevents Slowloris and connection starvation attacks (HTTP 504).
- **Security Headers**:
  - Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, and HSTS.

---

## 6. Edge & Reverse-Proxy Topology (Cloudflare + Nginx)
- **Origin Cloaking**: The origin server IP must never be exposed publicly. All public ingress must be routed through Cloudflare Anycast CDN with Authenticated Origin Pulls (or Cloudflare Tunnel).
- **Firewall Rules (UFW / Security Groups)**: Ingress ports 80/443 strictly whitelisted to Cloudflare IP blocks.
- **Client IP Resolution**: Hono API extracts genuine client IP using `CF-Connecting-IP` -> `X-Real-IP` -> sanitized multi-hop `X-Forwarded-For`.
- **Nginx Hardening**: Configured with strict client body/header timeouts, connection limits (`limit_conn`), and buffer limits to shed volumetric Layer 7 floods before touching Node.js.

