"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Volume2, VolumeX, Dice5, ArrowLeftRight } from "lucide-react";
import { gameAudio } from "./game-audio";
import { formatMoney } from "@/lib/format";
import { calculateDiceMultiplier } from "@/lib/provably-fair";
import { AutoBettingPanel, useAutoBet } from "./auto-betting-controls";

interface DiceGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

export function DiceGame({ game }: DiceGameProps) {
  const { user, wallet, refreshWallet } = useAuth();
  const currency = wallet?.currency ?? user?.currency ?? "USD";

  // Game Settings
  const [stake, setStake] = useState<number>(10);
  const [target, setTarget] = useState<number>(50.0);
  const [isRollUnder, setIsRollUnder] = useState<boolean>(true);
  const [mode, setMode] = useState<"MANUAL" | "AUTO">("MANUAL");
  const [isMuted, setIsMuted] = useState(false);

  // Result State
  const [lastRolled, setLastRolled] = useState<number | null>(null);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<{ rolled: number; won: boolean; multiplier: number }[]>([
    { rolled: 24.12, won: true, multiplier: 1.98 },
    { rolled: 78.55, won: false, multiplier: 1.98 },
    { rolled: 12.05, won: true, multiplier: 1.98 },
    { rolled: 49.91, won: true, multiplier: 1.98 },
    { rolled: 88.34, won: false, multiplier: 1.98 },
  ]);

  const [provablyFairData, setProvablyFairData] = useState({
    serverSeedHash: "4c7e2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c",
    clientSeed: "vladfs_dice_seed",
    nonce: 512,
  });

  // Auto-Betting Hook
  const { config: autoConfig, setConfig: setAutoConfig, startAuto, stopAuto, recordRound } = useAutoBet(stake);

  const toggleMute = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  const { multiplier, winChance } = calculateDiceMultiplier(target, isRollUnder);
  const profitOnWin = Math.round(stake * (multiplier - 1) * 100) / 100;

  // Execute a Single Roll
  const rollDice = async (customBet?: number) => {
    const currentBet = customBet ?? (mode === "AUTO" ? autoConfig.currentBet : stake);
    setIsRolling(true);
    gameAudio.playDiceRoll();

    let rolled = Math.floor(Math.random() * 10000) / 100;
    let won = isRollUnder ? rolled < target : rolled > target;

    try {
      const res = await api<{
        winAmount: string;
        multiplier: number;
        gameResult: { rolledNumber: number; won: boolean; multiplier: number };
        provablyFair?: { serverSeedHash: string; clientSeed: string; nonce: number };
      }>(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: currentBet.toString(),
          gameData: { target, isRollUnder },
        }),
      });

      if (res.gameResult) {
        rolled = res.gameResult.rolledNumber;
        won = res.gameResult.won;
      }
      if (res.provablyFair) {
        setProvablyFairData(res.provablyFair);
      }
    } catch {}

    setLastRolled(rolled);
    setLastWon(won);
    setIsRolling(false);

    if (won) {
      gameAudio.playCashoutFanfare();
    } else {
      gameAudio.playLossThud();
    }

    setHistory((prev) => [{ rolled, won, multiplier }, ...prev.slice(0, 7)]);
    void refreshWallet();

    if (mode === "AUTO" && autoConfig.active) {
      const profit = won ? currentBet * (multiplier - 1) : -currentBet;
      const { shouldContinue, nextBet } = recordRound(won, profit);
      if (shouldContinue) {
        setTimeout(() => void rollDice(nextBet), 300);
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <RealityCheckBar />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Dice5 className="h-6 w-6 text-cyan-400" />
              {game.title}
            </h1>
            <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
              Theoretical RTP (sandbox)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Customizable win chance slider with roll under/over toggles, Martingale automated strategies, and instant payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className="h-8 border-white/10 bg-black/40 text-xs text-muted-foreground hover:text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4 mr-1 text-rose-400" /> : <Volume2 className="h-4 w-4 mr-1 text-emerald-400" />}
            {isMuted ? "Muted" : "Sound ON"}
          </Button>
          <ProvablyFairDialog
            serverSeedHash={provablyFairData.serverSeedHash}
            clientSeed={provablyFairData.clientSeed}
            nonce={provablyFairData.nonce}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card className="border-white/10 bg-card p-4 space-y-4">
            <div className="flex rounded-lg bg-black/40 p-1 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMode("MANUAL");
                  stopAuto();
                }}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                  mode === "MANUAL" ? "bg-gold text-black shadow" : "text-muted-foreground hover:text-white"
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setMode("AUTO")}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                  mode === "AUTO" ? "bg-gold text-black shadow" : "text-muted-foreground hover:text-white"
                }`}
              >
                Auto Strategy
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Bet Amount ($)</span>
                <span className="font-semibold text-white">Balance: {formatMoney(wallet?.available ?? 1000, currency)}</span>
              </div>
              <Input
                type="number"
                min="0.1"
                step="1"
                disabled={autoConfig.active}
                value={stake}
                onChange={(e) => setStake(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="h-10 text-xs bg-black/40 font-mono font-bold"
              />
              <div className="flex gap-1">
                {[1, 5, 10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={autoConfig.active}
                    onClick={() => setStake(amt)}
                    className="flex-1 rounded bg-white/5 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-white"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-black/40 border border-white/5 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Multiplier:</span>
                <span className="font-mono font-bold text-gold">{multiplier.toFixed(4)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit on Win:</span>
                <span className="font-mono font-bold text-emerald-400">+${profitOnWin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Chance:</span>
                <span className="font-mono font-bold text-cyan-400">{winChance.toFixed(2)}%</span>
              </div>
            </div>

            {mode === "AUTO" && (
              <AutoBettingPanel
                config={autoConfig}
                onChange={setAutoConfig}
                disabled={autoConfig.active}
              />
            )}

            {mode === "MANUAL" ? (
              <div className="pt-2">
                <Button
                  size="lg"
                  disabled={isRolling}
                  onClick={() => void rollDice()}
                  className="w-full h-12 bg-gradient-to-r from-gold via-yellow-400 to-amber-500 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:brightness-110"
                >
                  {isRolling ? "Rolling…" : `Roll Dice ($${stake})`}
                </Button>
              </div>
            ) : (
              <div className="pt-2">
                {autoConfig.active ? (
                  <Button
                    size="lg"
                    onClick={stopAuto}
                    className="w-full h-12 bg-rose-600 font-black text-sm uppercase text-white hover:bg-rose-700"
                  >
                    Stop Auto Bet
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => {
                      startAuto(stake);
                      void rollDice(stake);
                    }}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:brightness-110"
                  >
                    Start Auto Dice
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">Recent Rolls:</span>
            {history.map((h, idx) => (
              <span
                key={idx}
                className={`rounded-full px-3 py-1 text-xs font-mono font-bold ring-1 ${
                  h.won
                    ? "bg-emerald-950 text-emerald-300 ring-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    : "bg-rose-950 text-rose-400 ring-rose-500/40"
                }`}
              >
                {h.rolled.toFixed(2)}
              </span>
            ))}
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0b0f19] via-[#0d1322] to-[#070a12] p-8 text-center shadow-2xl space-y-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Rolled Outcome</p>
              <div className="flex items-center justify-center">
                <span
                  className={`text-7xl sm:text-8xl font-black font-mono tracking-tight drop-shadow-lg transition-all duration-300 ${
                    lastRolled === null
                      ? "text-slate-600"
                      : lastWon
                      ? "text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]"
                      : "text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.8)]"
                  }`}
                >
                  {lastRolled !== null ? lastRolled.toFixed(2) : "50.00"}
                </span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-2">
                Target: {isRollUnder ? `< ${target.toFixed(2)}` : `> ${target.toFixed(2)}`}
              </p>
            </div>

            <div className="space-y-4 max-w-xl mx-auto">
              <div className="relative h-6 w-full rounded-full overflow-hidden bg-slate-800 border border-white/10">
                <div
                  className="absolute inset-y-0 transition-all"
                  style={{
                    left: isRollUnder ? "0%" : `${target}%`,
                    width: isRollUnder ? `${target}%` : `${100 - target}%`,
                    backgroundColor: "#10b981",
                  }}
                />
                <div
                  className="absolute inset-y-0 transition-all"
                  style={{
                    left: isRollUnder ? `${target}%` : "0%",
                    width: isRollUnder ? `${100 - target}%` : `${target}%`,
                    backgroundColor: "#ef4444",
                  }}
                />

                {lastRolled !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-white ring-4 ring-black rounded-full shadow-lg transition-all duration-300 -translate-x-1/2"
                    style={{ left: `${Math.min(99.5, Math.max(0.5, lastRolled))}%` }}
                  />
                )}
              </div>

              <input
                type="range"
                min="1.0"
                max="98.0"
                step="0.01"
                disabled={autoConfig.active}
                value={target}
                onChange={(e) => setTarget(parseFloat(e.target.value))}
                className="w-full h-3 bg-transparent cursor-pointer accent-gold"
              />

              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>0.00</span>
                <span>25.00</span>
                <span>50.00</span>
                <span>75.00</span>
                <span>100.00</span>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRollUnder(!isRollUnder)}
                className="border-gold/40 bg-gold/10 text-xs font-bold text-gold hover:bg-gold/20"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Switch to Roll {isRollUnder ? "Over" : "Under"} ({isRollUnder ? `> ${(100 - target).toFixed(2)}` : `< ${target.toFixed(2)}`})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
