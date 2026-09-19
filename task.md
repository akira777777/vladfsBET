# VladfsBET Global Improvements — Task Tracker

## Phase 1: Critical Security & Data Integrity Fixes
- [x] 1. Fix sports bet odds injection — validate client odds against DB market data
- [x] 2. Fix support ticket IDOR — verify ticket ownership before adding messages
- [x] 3. Fix SportBet UUID crash — replace `sb_${Date.now()}` with `randomUUID()`
- [x] 4. Fix AML risk evaluation ignored on withdrawals — block high-risk withdrawals
- [x] 5. Add Responsible Gaming checks to sportsbook betting (self-exclusion + wager limits)
- [x] 6. Fix CORS vulnerability — restrict origin reflection with allowlist
- [x] 7. Fix bet slip parlay bug — show clear single-bet-only message & prevent single-leg truncation

## Phase 2: Security Hardening
- [x] 8. Add missing RBAC permission checks on admin endpoints (overview, support, cms, analytics)
- [x] 9. Fix idempotency keys — replace `Date.now()` with deterministic keys within 1-minute window
- [x] 10. Invalidate all sessions on password change
- [x] 11. Add CSP and HSTS security headers
- [x] 12. Enhance password complexity validation (character diversity: upper, lower, digit)

## Phase 3: Functional Improvements
- [x] 13. Implement analytics event storage (persist to auditLog instead of dropping)
- [x] 14. Add cursor-based pagination to wallet transactions endpoint
- [x] 15. Replace hardcoded admin analytics with real aggregated data from DB game rounds
- [x] 16. Add RG cooling-off period for limit relaxation (24h delay for regulatory compliance)
- [x] 17. Add backend `/api/notifications` live endpoint

## Phase 4: Code Quality, Hygiene & Test Reliability
- [x] 18. Remove stray build artifacts from src/ directories & update .gitignore
- [x] 19. Remove stray Python script from React components
- [x] 20. Fix currency inconsistencies (replaced hardcoded $ with platform base € / EUR across jackpot ticker, bet slip, notifications, rewards, affiliates, tournaments, community chat)
- [x] 21. Connect notifications drawer to live `/api/notifications` backend
- [x] 22. Fix provably-fair dialog default seed hash fallback (no more empty string hash; added seed commitment & verifier links)
- [x] 23. Fix ledger `withSerializable` to safely handle existing `TransactionClient` instances
- [x] 24. Standardize `provably-fair.test.ts` into a valid Vitest suite so full suite runs and passes cleanly
