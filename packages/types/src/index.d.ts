export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'BRL' | 'JPY' | 'USDT';
export type PlayerStatus = 'PENDING_EMAIL' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'CLOSED' | 'SELF_EXCLUDED';
export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'REQUIRES_INFORMATION' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type WalletAccountType = 'AVAILABLE' | 'BONUS' | 'LOCKED' | 'PENDING';
export type LedgerDirection = 'DEBIT' | 'CREDIT';
export type LedgerJournalType = 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN' | 'REFUND' | 'BONUS' | 'BONUS_REVERSAL' | 'ADJUSTMENT' | 'FEE' | 'CHARGEBACK' | 'TRANSFER';
export type MoneyTransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN' | 'REFUND' | 'BONUS' | 'BONUS_REVERSAL' | 'ADJUSTMENT' | 'FEE' | 'CHARGEBACK';
export type MoneyTransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REVERSED';
export type DepositStatus = 'CREATED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'CHARGEBACK';
export type WithdrawalStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type GameCategory = 'SLOTS' | 'NEW' | 'POPULAR' | 'JACKPOTS' | 'TABLE_GAMES' | 'ROULETTE' | 'BLACKJACK' | 'BACCARAT' | 'POKER' | 'CRASH' | 'LIVE_CASINO';
export type GameSessionMode = 'DEMO' | 'REAL';
export type BonusType = 'WELCOME' | 'FREE_SPINS' | 'DEPOSIT' | 'CASHBACK' | 'RELOAD' | 'VIP' | 'TOURNAMENT' | 'PROMO_CODE';
export type PlayerBonusStatus = 'ISSUED' | 'ACTIVATED' | 'WAGERING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export type LimitType = 'DEPOSIT' | 'LOSS' | 'WAGER' | 'SESSION_TIME';
export type TicketStatus = 'OPEN' | 'PENDING_PLAYER' | 'PENDING_STAFF' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type SportBetStatus = 'OPEN' | 'SETTLED_WIN' | 'SETTLED_LOSS' | 'VOID' | 'CASHED_OUT';
export interface WalletSnapshot {
    currency: string;
    available: string;
    bonus: string;
    locked: string;
    pending: string;
    total: string;
}
export interface PlayerPublicProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    country: string;
    currency: string;
    status: PlayerStatus;
    kycStatus: KycStatus;
    realMoneyEligible: boolean;
    createdAt: string;
    vipTier?: {
        name: string;
        slug: string;
        points: string;
        rank: number;
        cashbackBps: number;
    };
}
export interface GameMetadata {
    id: string;
    slug: string;
    title: string;
    category: GameCategory;
    provider: string;
    thumbnailKey?: string | null;
    bannerKey?: string | null;
    description?: string | null;
    rtpBps?: number | null;
    volatility?: string | null;
    minBet?: string | null;
    maxBet?: string | null;
    demoAvailable: boolean;
    active: boolean;
    tags: string[];
}
export interface GameRoundResult {
    roundId: string;
    gameSlug: string;
    mode: GameSessionMode;
    betAmount: string;
    winAmount: string;
    payoutMultiplier: number;
    currency: string;
    state: Record<string, unknown>;
    provablyFair?: {
        serverSeedHash: string;
        clientSeed: string;
        nonce: number;
        verified: boolean;
    };
    wallet: WalletSnapshot;
}
export interface SportsEvent {
    id: string;
    sport: string;
    name: string;
    startsAt: string;
    status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'CANCELLED';
    score?: string;
    minute?: string;
    markets: SportsMarket[];
}
export interface SportsMarket {
    id: string;
    eventId: string;
    name: string;
    status: 'OPEN' | 'SUSPENDED' | 'SETTLED';
    selections: {
        id: string;
        name: string;
        odds: number;
    }[];
}
export interface PlaceSportBetPayload {
    eventId: string;
    marketId: string;
    selectionId: string;
    selectionName: string;
    odds: number;
    stake: string;
}
export interface BonusSummary {
    id: string;
    slug: string;
    name: string;
    type: BonusType;
    awardedAmount: string;
    remainingAmount: string;
    wageredAmount: string;
    wageringRequired: string;
    progressPercent: number;
    status: PlayerBonusStatus;
    expiresAt?: string | null;
    terms: string;
}
export interface KycCaseSummary {
    id: string;
    status: KycStatus;
    documents: {
        id: string;
        type: string;
        status: KycStatus;
        storageKey: string;
        createdAt: string;
    }[];
    reviewNote?: string | null;
    updatedAt: string;
}
export interface ResponsibleGamingSummary {
    limits: {
        id: string;
        type: LimitType;
        amount?: string | null;
        minutes?: number | null;
        periodHours: number;
        active: boolean;
        startsAt: string;
        endsAt?: string | null;
    }[];
    selfExclusion?: {
        active: boolean;
        endsAt?: string | null;
        permanent: boolean;
    } | null;
    activityStats: {
        sessionTimeMinutes: number;
        totalWagered24h: string;
        netLoss24h: string;
        depositCount24h: number;
        depositTotal24h: string;
    };
}
export interface AdminStatsOverview {
    totalPlayers: number;
    activePlayersToday: number;
    ggr: string;
    ngr: string;
    totalBetsVolume: string;
    totalWinsVolume: string;
    totalDepositsVolume: string;
    totalWithdrawalsVolume: string;
    pendingWithdrawalsCount: number;
    openKycCasesCount: number;
    activeAmlAlertsCount: number;
}
