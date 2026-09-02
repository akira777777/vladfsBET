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
