export interface GameSessionAuthRequest {
    userId: string;
    gameSlug: string;
    currency: string;
    mode: "DEMO" | "REAL";
}
export interface GameSessionAuthResponse {
    sessionId: string;
    launchUrl: string;
    token: string;
}
export interface RoundSettlementRequest {
    sessionId: string;
    roundId: string;
    betAmount: string;
    currency: string;
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    gameData?: Record<string, unknown>;
}
export interface RoundSettlementResult {
    roundId: string;
    won: boolean;
    multiplier: number;
    payoutAmount: string;
    resultData: Record<string, unknown>;
    verification: {
        serverSeedHash: string;
        clientSeed: string;
        nonce: number;
    };
}
export interface GameProviderInterface {
    slug: string;
    name: string;
    authenticatePlayer(req: GameSessionAuthRequest): Promise<GameSessionAuthResponse>;
    settleRound(req: RoundSettlementRequest): Promise<RoundSettlementResult>;
}
export declare class VladfsOriginalsGameProvider implements GameProviderInterface {
    slug: string;
    name: string;
    authenticatePlayer(req: GameSessionAuthRequest): Promise<GameSessionAuthResponse>;
    settleRound(req: RoundSettlementRequest): Promise<RoundSettlementResult>;
}
