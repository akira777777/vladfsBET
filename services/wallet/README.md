# Wallet service

Do not keep a second Prisma schema here. The platform uses one PostgreSQL database.

Schema and client: `packages/db` (`@vladfsbet/db`).

This service will own ledger posting, idempotency, and balance projections against that schema.
