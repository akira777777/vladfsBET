# MASTER PROMPT — BUILD VLADFSBET FULL PRODUCTION ONLINE CASINO

You are a senior full-stack engineering team, product designer, DevOps engineer, security engineer, and casino-platform architect.

Build a complete production-ready online casino platform named **VladfsBET**.

This is NOT a landing page or visual prototype. Build a complete application with a polished frontend, secure backend, database, authentication, player wallet, casino game infrastructure, promotions, payments architecture, KYC/AML workflows, responsible-gaming controls, administration dashboard, analytics, security controls, and deployment configuration.

The application must be architected so that real-money functionality can only be enabled after the operator obtains all required licenses, certifications, payment-provider approvals, game-provider agreements, and regulatory approvals for the jurisdictions in which it operates.

Do not create fake licenses, fake certifications, fake payment confirmations, fake KYC verification, fake RTP claims, fake regulators, or misleading trust badges.

---

# 1. BRAND

Brand:
**VladfsBET**

Visual identity:
- Premium
- Modern
- Dark luxury
- Futuristic casino
- Professional fintech aesthetic
- High-end gaming experience

Primary palette:
- Black / near-black
- Dark navy
- Electric blue
- Metallic gold
- White

The UI should feel comparable to a premium international gaming platform.

Use:
- Glassmorphism
- Subtle gradients
- Neon highlights
- Gold accents
- Smooth transitions
- Micro animations
- High-quality game artwork
- Responsive layouts
- Strong typography
- Large visual hierarchy

Do not make the interface look like a cheap casino template.

---

# 2. TECHNOLOGY STACK

Use a modern scalable architecture.

Recommended stack:

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

Backend:
- Node.js
- TypeScript
- NestJS or a well-structured Next.js backend/API
- REST API and/or GraphQL where appropriate

Database:
- PostgreSQL
- Prisma ORM

Caching / infrastructure:
- Redis

Authentication:
- Secure session-based authentication or OAuth-compatible architecture
- Email verification
- Password reset
- Optional 2FA
- Device/session management

Storage:
- S3-compatible object storage

Deployment:
- Docker
- Docker Compose for local development
- Production-ready containers
- CI/CD configuration
- Environment-based configuration

Testing:
- Jest
- Playwright
- React Testing Library

Code quality:
- ESLint
- Prettier
- strict TypeScript
- comprehensive error handling
- structured logging

---

# 3. APPLICATION STRUCTURE

Create these major areas:

PUBLIC WEBSITE

- Home
- Casino
- Live Casino
- Sports
- Promotions
- Jackpot games
- Search
- Game details
- About
- Responsible Gaming
- FAQ
- Contact
- Terms
- Privacy Policy
- Cookie Policy
- AML Policy
- KYC Policy

AUTHENTICATED PLAYER AREA

- Dashboard
- Profile
- Wallet
- Deposit
- Withdrawal
- Transactions
- Bonuses
- Bonus history
- Game history
- Favorites
- Notifications
- Security
- Responsible Gaming
- Verification/KYC
- Support
- Account settings

ADMIN AREA

- Dashboard
- Players
- KYC
- AML monitoring
- Transactions
- Deposits
- Withdrawals
- Games
- Providers
- Game categories
- Bonuses
- Promotions
- Campaigns
- VIP
- Responsible gaming
- Support tickets
- Reports
- Audit logs
- Fraud detection
- Risk management
- System configuration

---

# 4. HOMEPAGE

Create a cinematic homepage.

Header:

- VladfsBET logo
- Casino
- Live Casino
- Sports
- Promotions
- VIP
- Search
- Language
- Login
- Register

Hero:

Headline:
"THE GAME STARTS HERE"

Subheadline:
"Premium casino entertainment. Built around you."

Buttons:
- PLAY NOW
- EXPLORE GAMES

Show premium casino visuals involving:
- Slots
- Roulette
- Blackjack
- Poker chips
- Cards
- Jackpot effects

Do not imply guaranteed winnings.

Create sections:

- Featured Games
- Trending Games
- New Games
- Live Casino
- Jackpot Games
- Promotions
- VIP Club
- Why VladfsBET
- Responsible Gaming
- FAQ

---

# 5. REGISTRATION

Create a complete registration system.

Fields:

- First name
- Last name
- Date of birth
- Email
- Phone
- Country
- Password
- Currency
- Promotional code
- Terms acceptance
- Privacy acceptance
- Responsible-gaming acknowledgement

Implement:

- Email verification
- Phone verification where configured
- Password strength validation
- Rate limiting
- CAPTCHA integration point
- Duplicate-account detection
- Age verification workflow
- Country/jurisdiction restrictions
- Session creation
- Suspicious-registration detection

Never allow underage users.

---

# 6. LOGIN AND SECURITY

Implement:

- Email/password login
- Password reset
- Email verification
- Optional 2FA
- Session management
- Logout from all devices
- Device tracking
- Login history
- Suspicious-login detection
- Rate limiting
- Brute-force protection
- Secure cookies
- CSRF protection where applicable
- Security headers
- Input validation
- Server-side authorization

Never store plaintext passwords.

Use strong password hashing.

---

# 7. PLAYER WALLET

Create a proper double-entry ledger architecture.

Wallet features:

- Available balance
- Bonus balance
- Locked balance
- Pending balance
- Currency
- Transaction history

Transaction types:

- Deposit
- Withdrawal
- Bet
- Win
- Refund
- Bonus
- Bonus reversal
- Adjustment
- Fee
- Chargeback

Every financial transaction must create an immutable ledger record.

Never update monetary transactions destructively.

Use idempotency keys for financial operations.

Implement transaction states:

- pending
- processing
- completed
- failed
- cancelled
- reversed

Protect against:

- double spending
- race conditions
- duplicate callbacks
- replay attacks
- balance manipulation

Use database transactions and row-level locking/appropriate concurrency controls.

---

# 8. DEPOSIT SYSTEM

Build a payment abstraction layer.

The system must support payment-provider adapters rather than hardcoding one provider.

Example architecture:

PaymentProviderInterface

Methods:

- createDeposit()
- getDepositStatus()
- createWithdrawal()
- getWithdrawalStatus()
- verifyWebhook()
- handleWebhook()

Create adapter examples using mocked/sandbox providers.

Do NOT pretend to process real payments.

Create clear integration points for licensed payment providers.

Support:

- Card
- Bank transfer
- Wallet providers
- Other approved payment methods

Payment methods must be configurable by jurisdiction.

---

# 9. WITHDRAWALS

Build a complete withdrawal workflow.

Steps:

1. Player creates withdrawal
2. Risk checks
3. KYC status check
4. AML checks
5. Bonus restrictions check
6. Balance reservation
7. Payment-provider submission
8. Provider webhook
9. Status update
10. Ledger entry
11. Player notification

Statuses:

- Requested
- Under Review
- Approved
- Processing
- Completed
- Rejected
- Cancelled

Admin must be able to review withdrawals according to configured permissions.

---

# 10. KYC

Build a KYC workflow.

Statuses:

- Not started
- Pending
- Requires information
- Under review
- Approved
- Rejected
- Expired

Document types may include:

- Identity document
- Proof of address
- Additional verification documents

Create a provider abstraction layer for external KYC vendors.

Do not manufacture or fake verification results.

Store only necessary information.

Include:

- consent handling
- document expiry
- review history
- audit trail
- manual review
- automated provider result integration

---

# 11. AML / FRAUD

Create an AML/risk engine architecture.

Track:

- Deposit velocity
- Withdrawal velocity
- Transaction patterns
- Multiple accounts
- Device fingerprints
- IP anomalies
- Geographic anomalies
- Bonus abuse
- Chargebacks
- Unusual wagering activity
- Large transactions

Create configurable risk rules.

Example:

IF deposits_24h > configurable_limit
THEN create_risk_alert

IF multiple_accounts_same_device
THEN create_risk_alert

IF withdrawal_risk_score > threshold
THEN require_manual_review

Make thresholds configurable by authorized administrators.

Keep detailed audit logs.

---

# 12. CASINO GAME SYSTEM

Build a provider-agnostic casino game platform.

Game model:

- id
- provider
- title
- slug
- category
- thumbnail
- banner
- description
- RTP metadata where legally appropriate
- volatility
- minimum bet
- maximum bet
- supported currencies
- supported countries
- active status
- demo availability

Categories:

- Slots
- New
- Popular
- Jackpots
- Table Games
- Roulette
- Blackjack
- Baccarat
- Poker
- Crash
- Live Casino

Create:

- search
- filtering
- sorting
- favorites
- recently played
- game launch
- demo mode
- responsible gaming warnings where appropriate

---

# 13. GAME PROVIDER INTEGRATION

Do not hardcode games into the frontend.

Create:

GameProviderInterface

With functionality such as:

- authenticatePlayer()
- createGameSession()
- launchGame()
- handleCallback()
- processGameRound()
- verifySignature()
- settleRound()

Provider integrations must support secure authenticated callbacks.

Never trust client-side balance values.

Game outcomes and financial settlement must be validated server-side or by appropriately certified external providers.

---

# 14. DEMO CASINO

Implement a complete DEMO environment that works without real money.

Players can:

- Create an account
- Receive virtual demo balance
- Play demo games
- Win virtual credits
- Lose virtual credits
- View game history

Clearly label demo balances and demo gameplay.

Real-money functionality must remain disabled until the required production integrations are configured.

---

# 15. GAME ROUND LEDGER

Every game round should contain:

- Round ID
- Player ID
- Game ID
- Provider ID
- Session ID
- Bet amount
- Win amount
- Currency
- Result metadata
- Timestamp
- Status
- Provider transaction ID
- Verification data

Use immutable records.

Prevent duplicate settlement.

Implement reconciliation between internal records and provider records.

---

# 16. BONUSES

Create a flexible bonus engine.

Bonus types:

- Welcome bonus
- Free spins
- Deposit bonus
- Cashback
- Reload bonus
- VIP bonus
- Tournament rewards
- Promotional code

Bonus configuration:

- minimum deposit
- maximum bonus
- percentage
- wagering requirement
- expiration
- eligible games
- max bet rules
- country restrictions
- account restrictions

Track:

- issued
- activated
- wagering progress
- expired
- cancelled
- completed

All bonus terms must be clearly displayed to players.

Do not use misleading promotional language.

---

# 17. VIP SYSTEM

Create a configurable VIP program.

Example levels:

- Bronze
- Silver
- Gold
- Platinum
- Diamond

Track:

- wagering/activity
- points
- level
- rewards
- cashback
- personalized promotions

Do not design the system to encourage excessive gambling.

Include responsible-gaming safeguards.

---

# 18. RESPONSIBLE GAMING

Create a dedicated Responsible Gaming center.

Features:

- Deposit limits
- Loss limits
- Wager limits
- Session/time limits
- Reality checks
- Cooling-off period
- Self-exclusion
- Account closure
- Gambling activity history
- Spending summary
- Time spent
- Responsible-gaming information

Players must be able to configure limits easily.

Limits must be enforced server-side.

Do not allow bypassing self-exclusion by simply creating another account.

---

# 19. SPORTS AREA

Build the architecture for a sportsbook section.

Include:

- Sports
- Events
- Markets
- Odds
- Bet slip
- Open bets
- Settled bets

Use provider abstraction for odds/feed integration.

Do not fabricate live odds.

Create a mock/sandbox feed for development.

Real sportsbook feeds must be integrated through licensed providers.

---

# 20. LIVE CASINO

Create a Live Casino interface.

Categories:

- Roulette
- Blackjack
- Baccarat
- Game shows

UI:

- live table cards
- dealer information
- limits
- live status
- game lobby
- filters
- search

Use provider integration points rather than pretending internally generated video is a real dealer feed.

---

# 21. SEARCH

Global game search.

Support:

- title
- provider
- category
- tags

Include instant results and mobile-friendly search.

---

# 22. PLAYER DASHBOARD

Dashboard should show:

- Balance
- Bonus balance
- Recent games
- Favorites
- Active bonuses
- Promotions
- Transaction summary
- KYC status
- Responsible gaming tools

Make it extremely easy to understand.

---

# 23. NOTIFICATIONS

Create notification infrastructure.

Types:

- Email
- In-app
- Push-ready architecture
- SMS-ready architecture

Events:

- Registration
- Verification
- Deposit
- Withdrawal
- KYC update
- Bonus
- Security alert
- Responsible gaming warning
- Account restriction

Create notification templates.

---

# 24. SUPPORT

Create customer-support system.

Features:

- Help center
- FAQ
- Contact form
- Support tickets
- Ticket categories
- Ticket priorities
- Admin responses
- Attachments
- Ticket status
- Internal notes

Optional integration point for live chat providers.

---

# 25. ADMIN DASHBOARD

Build a professional internal admin panel.

Dashboard metrics:

- Registered users
- Active players
- Deposits
- Withdrawals
- Gross gaming revenue
- Net gaming revenue
- Bets
- Wins
- Bonus costs
- Chargebacks
- KYC statistics
- Risk alerts

Charts:

- Daily revenue
- Deposits
- Withdrawals
- Active players
- Game popularity
- Conversion funnel

---

# 26. ADMIN ROLES

Implement RBAC.

Roles:

- Super Admin
- Finance
- Risk
- KYC
- Support
- Marketing
- Content Manager
- Analyst

Every sensitive operation requires authorization.

Record an audit event for:

- login
- account modification
- balance adjustment
- withdrawal approval
- KYC decision
- bonus change
- configuration change
- administrative action

---

# 27. CMS

Create an internal CMS for:

- Homepage banners
- Promotions
- Blog/news
- FAQs
- Game collections
- Navigation
- Footer
- SEO metadata

Content should be editable without changing code.

---

# 28. ANALYTICS

Create event tracking.

Track:

- registration
- login
- deposit_started
- deposit_completed
- withdrawal_started
- withdrawal_completed
- game_opened
- game_started
- bet_placed
- bonus_activated
- KYC_started
- KYC_completed

Create dashboards for authorized staff.

Respect privacy and applicable data-protection requirements.

---

# 29. DATABASE

Create a normalized PostgreSQL schema.

Core entities should include:

- users
- sessions
- profiles
- wallets
- wallet_accounts
- ledger_entries
- transactions
- deposits
- withdrawals
- games
- providers
- game_sessions
- game_rounds
- bonuses
- bonus_wallets
- promotions
- vip_levels
- vip_points
- kyc_cases
- kyc_documents
- aml_alerts
- risk_events
- responsible_gaming_limits
- self_exclusions
- support_tickets
- notifications
- admin_users
- roles
- permissions
- audit_logs

Use UUIDs where appropriate.

Add proper indexes and foreign keys.

---

# 30. SECURITY

Security is a top priority.

Implement:

- secure authentication
- password hashing
- 2FA-ready architecture
- HTTPS-ready deployment
- secure cookies
- CSRF protection where appropriate
- XSS protection
- SQL injection prevention
- input validation
- output encoding
- rate limiting
- API authorization
- RBAC
- webhook signature verification
- replay protection
- idempotency
- encryption for sensitive data where appropriate
- secrets via environment variables
- audit logs
- security headers
- dependency auditing

Never expose secret keys to the browser.

Never trust client-side wallet amounts.

Never allow users to modify transaction status.

Never allow users to call admin APIs.

---

# 31. GEOLOCATION / JURISDICTION

Create a jurisdiction-management layer.

For every request determine:

- country
- jurisdiction
- allowed services
- blocked services
- registration availability
- deposit availability
- withdrawal availability
- game availability

Games, payments, bonuses and account creation must be configurable by jurisdiction.

Do not claim a specific jurisdiction is supported until the operator has actually established legal authorization there.

---

# 32. AGE VERIFICATION

The production system must prevent underage gambling.

Implement an age-verification provider integration point.

Enforce configurable minimum age requirements according to the applicable jurisdiction.

Do not rely solely on a frontend checkbox.

---

# 33. COOKIE / PRIVACY SYSTEM

Create:

- Cookie consent
- Privacy preferences
- Analytics consent
- Marketing consent
- Necessary cookies
- Privacy settings

Do not silently activate non-essential tracking.

---

# 34. MOBILE

The site must be fully responsive.

Optimize specifically for:

- iPhone
- Android
- tablet
- desktop
- large screens

Create a mobile bottom navigation:

Home
Casino
Live
Promotions
Account

Use touch-friendly controls.

---

# 35. PWA

Make the web application PWA-ready.

Include:

- manifest
- icons
- installability
- offline shell where appropriate

Never make offline functionality imply that bets or financial transactions are processed offline.

---

# 36. SEO

Implement:

- dynamic metadata
- Open Graph
- Twitter/X cards
- canonical URLs
- sitemap
- robots.txt
- structured data where appropriate
- clean URLs
- server-side rendering

Generate SEO-friendly pages for games and categories.

---

# 37. PERFORMANCE

Target:

- fast initial page load
- optimized images
- lazy loading
- code splitting
- caching
- CDN-compatible static assets
- efficient database queries
- pagination
- Redis caching where useful

Avoid unnecessary client-side rendering.

---

# 38. ERROR HANDLING

Create a centralized error system.

Frontend:

- friendly error pages
- loading states
- empty states
- retry states

Backend:

- structured errors
- error codes
- request IDs
- logging
- monitoring hooks

Never expose stack traces or secrets to users.

---

# 39. OBSERVABILITY

Add production-ready hooks for:

- structured logs
- metrics
- health checks
- readiness checks
- uptime monitoring
- error monitoring
- database monitoring

Create:

GET /health
GET /ready

---

# 40. API

Create a clean API architecture.

Example groups:

/api/auth/*
/api/users/*
/api/wallet/*
/api/payments/*
/api/games/*
/api/game-sessions/*
/api/transactions/*
/api/bonuses/*
/api/promotions/*
/api/kyc/*
/api/risk/*
/api/responsible-gaming/*
/api/support/*
/api/admin/*

Every endpoint must implement authentication and authorization where required.

---

# 41. ADMIN FINANCIAL SAFETY

Financial admin actions must support:

- dual-control / approval workflows where appropriate
- permissions
- reason codes
- mandatory notes
- audit logs
- immutable records

Do not provide a single unrestricted "change balance" button.

---

# 42. RESPONSIBLE UX

Do not design dark patterns.

Avoid:

- misleading countdowns
- fake scarcity
- fake winners
- guaranteed-win language
- manipulative withdrawal friction
- hidden wagering conditions
- hidden fees
- deceptive buttons
- hiding responsible-gaming controls

Bonus terms must be accessible before activation.

---

# 43. GAME UI

Create premium reusable game-card components.

Game card:

- artwork
- title
- provider
- category
- favorite button
- play button

Game page:

- game iframe/provider container
- balance
- session information
- responsible gaming controls
- help
- favorite

For development, create several sandbox/demo games.

---

# 44. DESIGN SYSTEM

Create reusable components:

Button
Input
Select
Modal
Drawer
Dropdown
Tabs
Card
GameCard
GameGrid
PromoCard
BalanceWidget
TransactionTable
AdminTable
Chart
Toast
Notification
Navigation
MobileNavigation
ModalConfirm
LoadingSkeleton
EmptyState

Use consistent spacing, typography, borders, shadows, radii and interaction states.

---

# 45. TESTING

Write automated tests for:

Authentication
Registration
Authorization
Wallet
Ledger
Deposits
Withdrawals
Bonus calculations
Responsible-gaming limits
Game settlement
Idempotency
Webhook verification
Admin permissions
KYC workflows

Create end-to-end tests for:

Registration → verification → demo gameplay

Deposit sandbox → wallet → demo game → withdrawal sandbox

Admin login → player review → KYC workflow

Responsible-gaming limit → blocked transaction

---

# 46. DEVELOPMENT MODE

Create a complete development environment.

Include:

- seed database
- demo users
- demo games
- demo balances
- mock payment provider
- mock KYC provider
- mock game provider
- mock sportsbook feed
- fake notification provider

Clearly label all mocked systems.

Never confuse demo/sandbox functionality with production financial functionality.

---

# 47. ENVIRONMENT VARIABLES

Create `.env.example`.

Include configuration placeholders for:

DATABASE_URL
REDIS_URL
SESSION_SECRET
JWT_SECRET if applicable
S3 credentials
EMAIL provider
SMS provider
KYC provider
PAYMENT provider
GAME provider
SPORTS provider
ANALYTICS provider
ERROR MONITORING provider

Never hardcode credentials.

---

# 48. DEVOPS

Create:

- Dockerfile
- docker-compose.yml
- production configuration
- database migrations
- seed scripts
- CI configuration
- lint/test/build pipeline

The application should be deployable to standard cloud infrastructure.

---

# 49. DOCUMENTATION

Create:

README.md

Include:

- architecture
- installation
- environment variables
- database setup
- migrations
- seed commands
- development commands
- testing
- production build
- deployment
- provider integrations
- security considerations

Also create:

ARCHITECTURE.md

API.md

SECURITY.md

COMPLIANCE.md

---

# 50. PRODUCTION CHECKLIST

Before declaring the project complete, verify:

- Authentication works
- Registration works
- Database migrations work
- Demo games work
- Wallet ledger works
- Financial records are immutable
- Duplicate transactions are prevented
- Webhooks are verified
- Admin RBAC works
- Audit logs work
- KYC workflow works in sandbox
- Risk engine works in sandbox
- Responsible gaming limits work
- Self-exclusion works
- Mobile UI works
- Error states work
- Tests pass
- Build passes
- Docker build succeeds
- No secrets are committed
- No fake regulatory claims exist
- No production payment processing is falsely represented
- No gambling-age restrictions are bypassable

---

# 51. IMPORTANT IMPLEMENTATION RULE

Do not simply generate static screens.

Every major feature must be connected to real application logic, database models, API routes, validation, authorization, and state management.

Use realistic mock providers where external regulated services are required.

Separate:

1. UI
2. business logic
3. financial ledger
4. provider integrations
5. compliance
6. database
7. infrastructure

Keep the architecture modular so actual licensed providers can later be connected without rewriting the core platform.

---

# 52. FINAL DELIVERABLE

Produce a complete repository containing:

- production-quality frontend
- backend
- PostgreSQL schema
- Prisma migrations
- Redis integration
- authentication
- player dashboard
- wallet
- financial ledger
- demo casino
- game provider abstraction
- payment provider abstraction
- KYC abstraction
- AML/risk abstraction
- responsible-gaming system
- bonus engine
- VIP system
- sportsbook abstraction
- live casino abstraction
- admin dashboard
- CMS
- support system
- analytics
- notifications
- audit logs
- security controls
- tests
- Docker configuration
- CI/CD
- documentation

Do not stop after creating the homepage.

Build the application in a modular monorepo if appropriate and make every module runnable.

The end result should feel like a serious commercial casino platform rather than a website template.

Use **VladfsBET** consistently throughout the product.