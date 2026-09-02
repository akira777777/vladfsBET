"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Volume2, VolumeX, Rocket } from "lucide-react";
import { gameAudio } from "./game-audio";
import { formatMoney } from "@/lib/format";
import { AutoBettingPanel, useAutoBet } from "./auto-betting-controls";

interface LimboGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

export function LimboGame({ game }: LimboGameProps) {
  const { user, wallet, refreshWallet } = useAuth();
  const currency = wallet?.currency ?? user?.currency ?? "USD";

  // Game Settings
  const [stake, setStake] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.0);
  const [mode, setMode] = useState<"MANUAL" | "AUTO">("MANUAL");
  const [isMuted, setIsMuted] = useState(false);

  // Result State
  const [currentRolled, setCurrentRolled] = useState<number | null>(null);
  const [isWon, setIsWon] = useState<boolean | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<{ rolled: number; won: boolean; target: number }[]>([
    { rolled: 1.45, won: false, target: 2.0 },
    { rolled: 3.12, won: true, target: 2.0 },
    { rolled: 12.8, won: true, target: 5.0 },
    { rolled: 1.05, won: false, target: 2.0 },
    { rolled: 4.88, won: true, target: 2.0 },
  ]);

  const [provablyFairData, setProvablyFairData] = useState({
    serverSeedHash: "7b8a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8",
    clientSeed: "vladfs_limbo_seed",
    nonce: 712,
  });

  // Auto-Betting Engine
  const { config: autoConfig, setConfig: setAutoConfig, startAuto, stopAuto, recordRound } = useAutoBet(stake);

  const toggleMute = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  const clampedTarget = Math.max(1.01, Math.min(1000000, targetMultiplier));
  const winChance = Math.min(98.0, Math.floor((99.0 / clampedTarget) * 100) / 100);
  const profitOnWin = Math.round(stake * (clampedTarget - 1) * 100) / 100;

  // Single Limbo Play
  const playLimbo = async (customBet?: number) => {
    const currentBet = customBet ?? (mode === "AUTO" ? autoConfig.currentBet : stake);
    setIsRolling(true);
    gameAudio.playDiceRoll();

    let rolled = 1.0;
    let won = false;

    try {
      const res = await api<{
        winAmount: string;
        multiplier: number;
        gameResult: { rolledMultiplier: number; won: boolean; multiplier: number };
        provablyFair?: { serverSeedHash: string; clientSeed: string; nonce: number };
      }>(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: currentBet.toString(),
          gameData: { targetMultiplier: clampedTarget },
        }),
      });

      if (res.gameResult) {
        rolled = res.gameResult.rolledMultiplier;
        won = res.gameResult.won;
      }
      if (res.provablyFair) {
        setProvablyFairData(res.provablyFair);
      }
    } catch {
      const rand = Math.random();
      rolled = rand >= 0.99 ? Math.min(1000000, Math.floor((99 / (1 - rand)) * 100) / 100) : Math.max(1.0, Math.floor((99 / (100 - rand * 100)) * 100) / 100);
      won = rolled >= clampedTarget;
    }

    setCurrentRolled(rolled);
    setIsWon(won);
    setIsRolling(false);

    if (won) {
      gameAudio.playCashoutFanfare();
    } else {
      gameAudio.playLossThud();
    }

    setHistory((prev) => [{ rolled, won, target: clampedTarget }, ...prev.slice(0, 7)]);
    void refreshWallet();

    if (mode === "AUTO" && autoConfig.active) {
      const profit = won ? currentBet * (clampedTarget - 1) : -currentBet;
      const { shouldContinue, nextBet } = recordRound(won, profit);
      if (shouldContinue) {
        setTimeout(() => void playLimbo(nextBet), 300);
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <RealityCheckBar />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-purple-400 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Rocket className="h-6 w-6 text-purple-400" />
              {game.title}
            </h1>
            <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/30">
              Payouts up to 1,000,000x
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Target your multiplier, launch the neon rocket burst, and auto-bet with Martingale strategies.
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

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Target Multiplier</span>
                <span className="font-mono font-bold text-purple-400">Win Chance: {winChance}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1.01"
                  max="1000000"
                  step="0.1"
                  disabled={autoConfig.active}
                  value={targetMultiplier}
                  onChange={(e) => setTargetMultiplier(parseFloat(e.target.value) || 1.01)}
                  className="h-10 text-xs bg-black/40 font-mono font-bold"
                />
                <span className="text-muted-foreground font-bold">x</span>
              </div>
              <div className="flex gap-1">
                {[1.5, 2.0, 5.0, 10.0, 50.0, 100.0].map((mult) => (
                  <button
                    key={mult}
                    type="button"
                    disabled={autoConfig.active}
                    onClick={() => setTargetMultiplier(mult)}
                    className="flex-1 rounded bg-white/5 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-white"
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-black/40 border border-white/5 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payout Multiplier:</span>
                <span className="font-mono font-bold text-purple-300">{clampedTarget.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit on Win:</span>
                <span className="font-mono font-bold text-emerald-400">+${profitOnWin.toFixed(2)}</span>
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
                  onClick={() => void playLimbo()}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 font-black text-sm uppercase text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:brightness-110"
                >
                  {isRolling ? "Launching…" : `Launch Limbo ($${stake})`}
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
                      void playLimbo(stake);
                    }}
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-fuchsia-600 font-black text-sm uppercase text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:brightness-110"
                  >
                    Start Auto Limbo
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">Recent:</span>
            {history.map((h, idx) => (
              <span
                key={idx}
                className={`rounded-full px-3 py-1 text-xs font-mono font-bold ring-1 ${
                  h.won
                    ? "bg-purple-950 text-purple-300 ring-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                    : "bg-rose-950 text-rose-400 ring-rose-500/40"
                }`}
              >
                {h.rolled.toFixed(2)}x
              </span>
            ))}
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#100d1f] via-[#16102b] to-[#0a0714] p-12 text-center shadow-2xl flex flex-col items-center justify-center min-h-[360px]">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Multiplied Result</p>
            
            <div className="relative">
              <span
                className={`text-8xl sm:text-9xl font-black font-mono tracking-tight transition-all duration-300 ${
                  currentRolled === null
                    ? "text-slate-600"
                    : isWon
                    ? "text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.9)] scale-105"
                    : "text-rose-500 drop-shadow-[0_0_40px_rgba(244,63,94,0.9)]"
                }`}
              >
                {currentRolled !== null ? currentRolled.toFixed(2) : "1.00"}
                <span className="text-5xl sm:text-6xl text-purple-400">x</span>
              </span>
            </div>

            <div className="mt-8 rounded-full bg-black/40 border border-white/10 px-6 py-2 text-xs text-muted-foreground">
              Targeted Multiplier: <strong className="text-purple-300 font-mono font-bold">{clampedTarget.toFixed(2)}x</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
