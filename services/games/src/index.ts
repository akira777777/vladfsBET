import { provablyFairFloat, sha256, toDecimal, formatMoney } from "@vladfsbet/utils";

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

export class VladfsOriginalsGameProvider implements GameProviderInterface {
  slug = "vladfs-originals";
  name = "VladfsBET Originals";

  async authenticatePlayer(req: GameSessionAuthRequest): Promise<GameSessionAuthResponse> {
    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    return {
      sessionId: `sess_${Date.now()}`,
      launchUrl: `/casino/${req.gameSlug}`,
      token,
    };
  }

  async settleRound(req: RoundSettlementRequest): Promise<RoundSettlementResult> {
    const floatVal = provablyFairFloat(req.serverSeed, req.clientSeed, req.nonce);
    const serverSeedHash = sha256(req.serverSeed);

    // Optimization: Dynamic win probability and multiplier from gameData if provided, else use defaults
    const winProbability = (req.gameData?.winProbability as number) ?? 0.45;
    const baseMultiplier = (req.gameData?.baseMultiplier as number) ?? 2.0;

    const won = floatVal < winProbability;
    const multiplier = won ? baseMultiplier : 0;
    
    const betNum = toDecimal(req.betAmount);
    const payoutAmount = formatMoney(betNum.times(multiplier), 8);

    return {
      roundId: req.roundId,
      won,
      multiplier,
      payoutAmount,
      resultData: { floatVal, won, winProbability },
      verification: {
        serverSeedHash,
        clientSeed: req.clientSeed,
        nonce: req.nonce,
      },
    };
  }
}