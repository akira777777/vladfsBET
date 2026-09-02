import { provablyFairFloat, sha256 } from "@vladfsbet/utils";
export class VladfsOriginalsGameProvider {
    slug = "vladfs-originals";
    name = "VladfsBET Originals";
    async authenticatePlayer(req) {
        const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        return {
            sessionId: `sess_${Date.now()}`,
            launchUrl: `/casino/${req.gameSlug}`,
            token,
        };
    }
    async settleRound(req) {
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
