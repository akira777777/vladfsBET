import { provablyFairFloat, sha256 } from "@vladfsbet/utils";

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

    const won = floatVal < 0.45;
    const multiplier = won ? 2.0 : 0;
    const betNum = parseFloat(req.betAmount) || 0;
    const payoutAmount = (betNum * multiplier).toFixed(8);

    return {
      roundId: req.roundId,
      won,
      multiplier,
      payoutAmount,
      resultData: { floatVal, won },
      verification: {
        serverSeedHash,
        clientSeed: req.clientSeed,
        nonce: req.nonce,
      },
    };
  }
}
