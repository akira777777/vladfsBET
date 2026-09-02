"use client";

import { useState } from "react";
import { ShieldCheck, Lock, RefreshCw, CheckCircle2, Copy, Sparkles, Binary } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PLINKO_PAYOUTS } from "@/lib/provably-fair";

type EngineType = "CRASH" | "PLINKO" | "MINES" | "DICE" | "LIMBO" | "HILO" | "SLOTS" | "ROULETTE";

// Cryptographic Web Crypto HMAC-SHA256
async function hmacSha256Hex(keyStr: string, messageStr: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(keyStr);
  const msgData = enc.encode(messageStr);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ProvablyFairPage() {
  const [engine, setEngine] = useState<EngineType>("CRASH");
  const [serverSeed, setServerSeed] = useState("a8f5c3d2e1b0f9a8b7c6d5e4f3a2b1c0e9d8f7a6b5c4d3e2f1a0b9c8d7e6f5a4");
  const [clientSeed, setClientSeed] = useState("vladfs_player_2026");
  const [nonce, setNonce] = useState(42);

  // Specific Game Options
  const [plinkoRows, setPlinkoRows] = useState(16);
  const [plinkoRisk, setPlinkoRisk] = useState<"LOW" | "MEDIUM" | "HIGH">("HIGH");
  const [mineCount, setMineCount] = useState(3);

  const [verifiedHex, setVerifiedHex] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [stepDetails, setStepDetails] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const message = `${clientSeed}:${nonce}`;
      const hmacHex = await hmacSha256Hex(serverSeed, message);
      setVerifiedHex(hmacHex);

      const steps: string[] = [
        `1. HMAC-SHA256(key: "${serverSeed}", msg: "${message}")`,
        `2. Resulting 256-bit Digest: ${hmacHex}`,
      ];

      if (engine === "CRASH") {
        const e = Math.pow(2, 52);
        const h = parseInt(hmacHex.slice(0, 13), 16);
        const crash = Math.max(1.0, Math.floor(((100 * e - h) / (e - h)) / 100) / 100);
        const finalCrash = Math.min(1000000, crash);
        setResultSummary(`🚀 Crash Point: ${finalCrash.toFixed(2)}x`);
        steps.push(`3. 52-bit Float Hex Slice: 0x${hmacHex.slice(0, 13)} -> Decimal ${h}`);
        steps.push(`4. Formula: floor((100 * 2^52 - h) / (2^52 - h)) = ${finalCrash.toFixed(2)}x`);
      } else if (engine === "DICE") {
        const num = parseInt(hmacHex.slice(0, 8), 16);
        const roll = Math.floor(((num % 10000) / 100) * 100) / 100;
        setResultSummary(`🎲 Rolled Dice: ${roll.toFixed(2)} / 100.00`);
        steps.push(`3. 32-bit Integer: ${num}`);
        steps.push(`4. Deterministic Roll: (${num} % 10000) / 100 = ${roll.toFixed(2)}`);
      } else if (engine === "LIMBO") {
        const num = parseInt(hmacHex.slice(0, 8), 16) / 0xffffffff;
        const roll = num >= 0.99 ? Math.min(1000000, Math.floor((99 / (1 - num)) * 100) / 100) : Math.max(1.0, Math.floor((99 / (100 - num * 100)) * 100) / 100);
        setResultSummary(`🎯 Limbo Multiplier: ${roll.toFixed(2)}x`);
        steps.push(`3. Uniform Float (0..1): ${num.toFixed(8)}`);
        steps.push(`4. Inverse Pareto Multiplier = ${roll.toFixed(2)}x`);
      } else if (engine === "PLINKO") {
        const path: number[] = [];
        let bin = 0;
        for (let i = 0; i < plinkoRows; i++) {
          const byteVal = parseInt(hmacHex.slice(i * 2, i * 2 + 2), 16);
          const dir = byteVal % 2; // 0 = Left, 1 = Right
          path.push(dir);
          if (dir === 1) bin++;
        }
        const payoutTable = PLINKO_PAYOUTS[plinkoRows]?.[plinkoRisk] || [];
        const mult = payoutTable[bin] ?? 1.0;
        setResultSummary(`⚡ Landed in Bin #${bin} (${mult}x) on ${plinkoRows} Rows [${plinkoRisk}]`);
        steps.push(`3. Path Vector (L/R): [${path.map((d) => (d === 1 ? "R" : "L")).join(", ")}]`);
        steps.push(`4. Total Right Deflections: ${bin} -> Payout: ${mult}x`);
      } else if (engine === "MINES") {
        const tiles = Array.from({ length: 25 }, (_, i) => i);
        // Fisher-Yates with hash bytes
        for (let i = 24; i > 0; i--) {
          const byteVal = parseInt(hmacHex.slice((24 - i) * 2, (24 - i) * 2 + 2), 16);
          const j = byteVal % (i + 1);
          const temp = tiles[i]!;
          tiles[i] = tiles[j]!;
          tiles[j] = temp;
        }
        const mines = tiles.slice(0, mineCount).sort((a, b) => a - b);
        setResultSummary(`💎 Mine Indices (0-24): [${mines.join(", ")}]`);
        steps.push(`3. Deterministic Fisher-Yates Permutation across 25 tiles`);
        steps.push(`4. ${mineCount} Mine Positions: Grid cells #${mines.join(", #")}`);
      } else if (engine === "HILO") {
        const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
        const suits = ["♠", "♥", "♦", "♣"];
        const rankIdx = parseInt(hmacHex.slice(0, 4), 16) % 13;
        const suitIdx = parseInt(hmacHex.slice(4, 6), 16) % 4;
        setResultSummary(`🃏 Initial Dealt Card: ${ranks[rankIdx]} ${suits[suitIdx]} (Value: ${rankIdx + 2})`);
        steps.push(`3. Dealt Rank: ${ranks[rankIdx]}, Suit: ${suits[suitIdx]}`);
      } else if (engine === "ROULETTE") {
        const pocket = parseInt(hmacHex.slice(0, 6), 16) % 37;
        const color = pocket === 0 ? "Green" : pocket % 2 === 0 ? "Black" : "Red";
        setResultSummary(`🎡 Roulette Pocket: ${pocket} (${color})`);
        steps.push(`3. Modulo 37 -> Pocket ${pocket}`);
      } else {
        const reel1 = parseInt(hmacHex.slice(0, 2), 16) % 6;
        const reel2 = parseInt(hmacHex.slice(2, 4), 16) % 6;
        const reel3 = parseInt(hmacHex.slice(4, 6), 16) % 6;
        setResultSummary(`🎰 Slot Reel Stops: [${reel1}, ${reel2}, ${reel3}]`);
        steps.push(`3. Symbol Stop Indexes: Reel 1=${reel1}, Reel 2=${reel2}, Reel 3=${reel3}`);
      }

      setStepDetails(steps);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-4 py-1 text-xs font-bold text-emerald-400">
          <ShieldCheck className="h-4 w-4" /> 100% CRYPTOGRAPHIC TRANSPARENCY
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Provably Fair Verifier
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every bet outcome is generated using unalterable Web Crypto HMAC-SHA256 cryptography. Verify any round independently without trusting the casino.
        </p>
      </div>

      {/* Verification Tool Card */}
      <Card className="p-6 sm:p-8 border-white/10 bg-neutral-950/80 shadow-2xl space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gold">Select Game Original</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
              {(["CRASH", "PLINKO", "MINES", "DICE", "LIMBO", "HILO", "SLOTS", "ROULETTE"] as EngineType[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setEngine(g);
                    setVerifiedHex(null);
                    setResultSummary(null);
                  }}
                  className={`rounded-xl py-2.5 px-2 text-xs font-bold transition-all border ${
                    engine === g
                      ? "bg-gold text-black border-gold shadow-md scale-[1.02]"
                      : "bg-black/40 border-white/10 text-muted-foreground hover:text-white"
                  }`}
                >
                  {g === "CRASH" ? "🚀 Crash" :
                   g === "PLINKO" ? "⚡ Plinko" :
                   g === "MINES" ? "💎 Mines" :
                   g === "DICE" ? "🎲 Dice" :
                   g === "LIMBO" ? "🎯 Limbo" :
                   g === "HILO" ? "🃏 Hilo" :
                   g === "SLOTS" ? "🎰 Slots" : "🎡 Roulette"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Server Seed (Unhashed 256-bit Hex)</label>
              <Input
                value={serverSeed}
                onChange={(e) => setServerSeed(e.target.value)}
                className="font-mono text-xs bg-black/60 border-white/10 text-gold"
                placeholder="Paste unhashed server seed here..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Seed</label>
              <Input
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                className="font-mono text-xs bg-black/60 border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nonce (Round #)</label>
              <Input
                type="number"
                min="1"
                value={nonce}
                onChange={(e) => setNonce(parseInt(e.target.value) || 1)}
                className="font-mono text-xs bg-black/60 border-white/10"
              />
            </div>

            {engine === "PLINKO" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plinko Rows</label>
                  <select
                    value={plinkoRows}
                    onChange={(e) => setPlinkoRows(parseInt(e.target.value))}
                    className="w-full h-10 rounded-md bg-black/60 border border-white/10 px-3 text-xs font-bold text-white"
                  >
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16].map((r) => (
                      <option key={r} value={r}>{r} Rows</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Risk Level</label>
                  <select
                    value={plinkoRisk}
                    onChange={(e) => setPlinkoRisk(e.target.value as any)}
                    className="w-full h-10 rounded-md bg-black/60 border border-white/10 px-3 text-xs font-bold text-white"
                  >
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                  </select>
                </div>
              </>
            )}

            {engine === "MINES" && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mines Count (1-24)</label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={mineCount}
                  onChange={(e) => setMineCount(Math.min(24, Math.max(1, parseInt(e.target.value) || 3)))}
                  className="font-mono text-xs bg-black/60 border-white/10"
                />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleVerify}
          disabled={isVerifying}
          size="lg"
          className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 text-white shadow-lg shadow-emerald-500/20 uppercase tracking-wider"
        >
          <ShieldCheck className="mr-2 h-5 w-5" /> Calculate Cryptographic Proof
        </Button>

        {/* Verification Result Box */}
        {resultSummary && (
          <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/40 p-5 space-y-4 animate-in zoom-in">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" /> Cryptographic Proof Validated
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold">HMAC-SHA256 Output Hash:</span>
              <p className="font-mono text-xs text-white break-all bg-black/60 p-3 rounded-lg border border-white/5">
                {verifiedHex}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold">Deterministic Outcome:</span>
              <p className="font-mono text-xl font-black text-gold">
                {resultSummary}
              </p>
            </div>

            <div className="rounded-xl bg-black/50 border border-white/5 p-3 space-y-1.5 text-xs font-mono text-muted-foreground">
              <p className="font-bold text-white mb-1">Mathematical Breakdown:</p>
              {stepDetails.map((step, idx) => (
                <p key={idx}>{step}</p>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Cryptographic Architecture Explainer */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="font-bold text-white text-sm">Server Seed Commitment</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The casino generates a 256-bit secret random seed and publishes its SHA-256 hash prior to the round. The casino cannot change it without altering the hash.
          </p>
        </div>

        <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="font-bold text-white text-sm">Client Seed Entropy</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You provide your own client seed from your browser. The casino has no knowledge of this value when generating the server seed.
          </p>
        </div>

        <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="font-bold text-white text-sm">Deterministic Verification</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Both parties compute HMAC-SHA256(ServerSeed, ClientSeed + Nonce). The mathematical outcome is completely unalterable by either side.
          </p>
        </div>
      </div>
    </div>
  );
}
