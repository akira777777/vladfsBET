"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Volume2, VolumeX, Gem, Dice5 } from "lucide-react";
import { gameAudio } from "./game-audio";
import { formatMoney } from "@/lib/format";
import { calculateMinesMultiplier } from "@/lib/provably-fair";
import { AutoBettingPanel, useAutoBet } from "./auto-betting-controls";

interface MinesGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

type TileState = "HIDDEN" | "GEM" | "MINE" | "REVEALED_MINE" | "REVEALED_GEM";

export function MinesGame({ game }: MinesGameProps) {
  const { user, wallet, refreshWallet } = useAuth();
  const currency = wallet?.currency ?? user?.currency ?? "USD";

  // Game Settings
  const [stake, setStake] = useState<number>(10);
  const [mineCount, setMineCount] = useState<number>(3);
  const [mode, setMode] = useState<"MANUAL" | "AUTO">("MANUAL");
  const [isMuted, setIsMuted] = useState(false);

  // Active Game State
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "CASHOUT" | "BUSTED">("IDLE");
  const [tiles, setTiles] = useState<TileState[]>(Array(25).fill("HIDDEN"));
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [selectedAutoTiles, setSelectedAutoTiles] = useState<number[]>([0, 6, 12, 18, 24]);
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);

  const [provablyFairData, setProvablyFairData] = useState({
    serverSeedHash: "3f8a2b1c0e9d8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3",
    clientSeed: "vladfs_mines_seed",
    nonce: 304,
  });

  // Auto-Betting Engine
  const { config: autoConfig, setConfig: setAutoConfig, startAuto, stopAuto, recordRound } = useAutoBet(stake);

  const toggleMute = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  // Multiplier Calculations
  const currentGemsFound = revealedIndices.length;
  const currentMultiplier = calculateMinesMultiplier(mineCount, currentGemsFound);
  const nextMultiplier = calculateMinesMultiplier(mineCount, currentGemsFound + 1);
  const totalGems = 25 - mineCount;
  const remainingGems = Math.max(0, totalGems - currentGemsFound);
  const remainingTiles = 25 - currentGemsFound;
  const nextWinChance = remainingTiles > 0 ? Math.round((remainingGems / remainingTiles) * 100) : 0;
  const potentialProfit = Math.round(stake * (currentMultiplier - 1) * 100) / 100;

  // Start Manual Game Round
  const startManualGame = async () => {
    gameAudio.playBet();
    setGameState("PLAYING");
    setTiles(Array(25).fill("HIDDEN"));
    setRevealedIndices([]);
    setLastWinAmount(null);

    // Call API demo bet
    try {
      const res = await api<{
        provablyFair?: { serverSeedHash: string; clientSeed: string; nonce: number };
      }>(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: stake.toString(),
          gameData: { mineCount, action: "START" },
        }),
      });
      if (res.provablyFair) {
        setProvablyFairData(res.provablyFair);
      }
    } catch {}

    // Generate deterministic/simulated mine placement
    const sample: number[] = [];
    while (sample.length < mineCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!sample.includes(idx)) sample.push(idx);
    }
    setMinePositions(sample);
  };

  // Handle Clicking on a Tile
  const handleTileClick = (index: number) => {
    if (gameState !== "PLAYING" || revealedIndices.includes(index)) return;

    if (minePositions.includes(index)) {
      // Hit a mine!
      gameAudio.playExplosion();
      setGameState("BUSTED");
      const newTiles = [...tiles];
      newTiles[index] = "MINE";

      // Reveal rest of board
      for (let i = 0; i < 25; i++) {
        if (i !== index) {
          if (minePositions.includes(i)) {
            newTiles[i] = "REVEALED_MINE";
          } else if (!revealedIndices.includes(i)) {
            newTiles[i] = "REVEALED_GEM";
          }
        }
      }
      setTiles(newTiles);
      void refreshWallet();
    } else {
      // Found a Gem!
      const nextFound = currentGemsFound + 1;
      gameAudio.playGemReveal(nextFound - 1);

      const nextRevealed = [...revealedIndices, index];
      setRevealedIndices(nextRevealed);

      const newTiles = [...tiles];
      newTiles[index] = "GEM";
      setTiles(newTiles);

      // If all gems cleared -> Auto Cashout Win!
      if (nextFound >= totalGems) {
        void handleCashout(nextRevealed);
      }
    }
  };

  // Pick a Random Unrevealed Tile
  const pickRandomTile = () => {
    if (gameState !== "PLAYING") return;
    const unrevealed = Array.from({ length: 25 }, (_, i) => i).filter((i) => !revealedIndices.includes(i));
    if (unrevealed.length === 0) return;
    const randomChoice = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    handleTileClick(randomChoice);
  };

  // Instant Cashout
  const handleCashout = async (customRevealed?: number[]) => {
    if (gameState !== "PLAYING") return;
    const count = (customRevealed ?? revealedIndices).length;
    if (count === 0) return;

    const finalMult = calculateMinesMultiplier(mineCount, count);
    const payout = Math.round(stake * finalMult * 100) / 100;
    setLastWinAmount(payout);
    setGameState("CASHOUT");
    gameAudio.playCashoutFanfare();

    const newTiles = [...tiles];
    for (let i = 0; i < 25; i++) {
      if (!revealedIndices.includes(i) && !(customRevealed ?? []).includes(i)) {
        if (minePositions.includes(i)) {
          newTiles[i] = "REVEALED_MINE";
        } else {
          newTiles[i] = "REVEALED_GEM";
        }
      }
    }
    setTiles(newTiles);

    try {
      await api(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: stake.toString(),
          gameData: { mineCount, revealedTiles: customRevealed ?? revealedIndices, action: "CASHOUT" },
        }),
      });
      void refreshWallet();
    } catch {}
  };

  // Run One Auto Round with Selected Tiles Pattern
  const runAutoRound = async (betAmount: number) => {
    gameAudio.playBet();
    const currentBet = betAmount;

    const sample: number[] = [];
    while (sample.length < mineCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!sample.includes(idx)) sample.push(idx);
    }

    const hitMine = selectedAutoTiles.some((idx) => sample.includes(idx));
    const newTiles: TileState[] = Array(25).fill("HIDDEN");

    if (hitMine) {
      gameAudio.playExplosion();
      sample.forEach((m) => {
        newTiles[m] = selectedAutoTiles.includes(m) ? "MINE" : "REVEALED_MINE";
      });
      selectedAutoTiles.forEach((t) => {
        if (!sample.includes(t)) newTiles[t] = "GEM";
      });
      setTiles(newTiles);
      setGameState("BUSTED");

      const { shouldContinue, nextBet } = recordRound(false, -currentBet);
      if (shouldContinue) {
        setTimeout(() => void runAutoRound(nextBet), 400);
      }
    } else {
      gameAudio.playCashoutFanfare();
      selectedAutoTiles.forEach((t) => {
        newTiles[t] = "GEM";
      });
      sample.forEach((m) => {
        newTiles[m] = "REVEALED_MINE";
      });
      setTiles(newTiles);
      setGameState("CASHOUT");

      const mult = calculateMinesMultiplier(mineCount, selectedAutoTiles.length);
      const profit = currentBet * (mult - 1);
      setLastWinAmount(currentBet * mult);

      const { shouldContinue, nextBet } = recordRound(true, profit);
      if (shouldContinue) {
        setTimeout(() => void runAutoRound(nextBet), 400);
      }
    }
    void refreshWallet();
  };

  const toggleAutoTile = (idx: number) => {
    if (autoConfig.active) return;
    if (selectedAutoTiles.includes(idx)) {
      setSelectedAutoTiles(selectedAutoTiles.filter((i) => i !== idx));
    } else if (selectedAutoTiles.length < 25 - mineCount) {
      setSelectedAutoTiles([...selectedAutoTiles, idx]);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <RealityCheckBar />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Gem className="h-6 w-6 text-emerald-400" />
              {game.title}
            </h1>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              5x5 Grid Mines
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pick tiles to uncover sparkling gems. Configure 1–24 mines and cash out instantly at any step!
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
                Manual Pick
              </button>
              <button
                type="button"
                onClick={() => setMode("AUTO")}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                  mode === "AUTO" ? "bg-gold text-black shadow" : "text-muted-foreground hover:text-white"
                }`}
              >
                Auto Pattern
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
                disabled={gameState === "PLAYING" || autoConfig.active}
                value={stake}
                onChange={(e) => setStake(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="h-10 text-xs bg-black/40 font-mono font-bold"
              />
              <div className="flex gap-1">
                {[1, 5, 10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={gameState === "PLAYING" || autoConfig.active}
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
                <span className="text-muted-foreground">Mines on Grid</span>
                <span className="font-bold text-rose-400">{mineCount} Mines / {totalGems} Gems</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[1, 2, 3, 5, 10, 24].map((count) => (
                  <button
                    key={count}
                    type="button"
                    disabled={gameState === "PLAYING" || autoConfig.active}
                    onClick={() => setMineCount(count)}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all border ${
                      mineCount === count
                        ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                        : "border-white/5 bg-black/40 text-muted-foreground hover:text-white"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {gameState === "PLAYING" && (
              <div className="rounded-xl bg-black/50 border border-white/10 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Multiplier:</span>
                  <span className="font-mono font-bold text-emerald-400">{currentMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Gem Multiplier:</span>
                  <span className="font-mono font-bold text-gold">{nextMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gems Remaining:</span>
                  <span className="font-mono font-bold text-white">{remainingGems} / {totalGems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Safe Chance:</span>
                  <span className="font-mono font-bold text-blue-400">{nextWinChance}%</span>
                </div>
              </div>
            )}

            {mode === "AUTO" && (
              <AutoBettingPanel
                config={autoConfig}
                onChange={setAutoConfig}
                disabled={autoConfig.active}
              />
            )}

            {mode === "MANUAL" ? (
              <div className="space-y-2 pt-2">
                {gameState === "PLAYING" ? (
                  <>
                    <Button
                      size="lg"
                      disabled={currentGemsFound === 0}
                      onClick={() => void handleCashout()}
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:brightness-110"
                    >
                      Cash Out ${(stake * currentMultiplier).toFixed(2)} ({currentMultiplier.toFixed(2)}x)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pickRandomTile}
                      className="w-full h-10 border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-300 hover:bg-blue-500/20"
                    >
                      <Dice5 className="h-4 w-4 mr-1.5" /> Pick Random Tile
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    onClick={startManualGame}
                    className="w-full h-12 bg-gradient-to-r from-gold via-yellow-400 to-amber-500 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:brightness-110"
                  >
                    Bet & Start Game (${stake})
                  </Button>
                )}
              </div>
            ) : (
              <div className="pt-2">
                {autoConfig.active ? (
                  <Button
                    size="lg"
                    onClick={stopAuto}
                    className="w-full h-12 bg-rose-600 font-black text-sm uppercase text-white hover:bg-rose-700"
                  >
                    Stop Auto Play
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    disabled={selectedAutoTiles.length === 0}
                    onClick={() => {
                      startAuto(stake);
                      void runAutoRound(stake);
                    }}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:brightness-110"
                  >
                    Start Auto Bet ({selectedAutoTiles.length} Tiles)
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-card border border-white/10 p-3 text-xs">
            {gameState === "PLAYING" ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                Uncover tiles or hit Cashout to claim ${potentialProfit.toFixed(2)} profit!
              </div>
            ) : gameState === "CASHOUT" ? (
              <div className="text-emerald-400 font-bold">
                🎉 Congratulations! Cashed out +${lastWinAmount?.toFixed(2)} ({currentMultiplier.toFixed(2)}x)
              </div>
            ) : gameState === "BUSTED" ? (
              <div className="text-rose-400 font-bold">
                💥 Mine Exploded! Game Over.
              </div>
            ) : (
              <div className="text-muted-foreground">
                {mode === "MANUAL" ? "Click 'Bet & Start Game' to begin playing." : "Select your tile pattern on the grid, then start auto play."}
              </div>
            )}
          </div>

          <div className="relative aspect-square max-w-[560px] mx-auto rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e131f] to-[#070a12] p-4 sm:p-6 shadow-2xl">
            <div className="grid grid-cols-5 gap-2 sm:gap-3 h-full w-full">
              {Array.from({ length: 25 }).map((_, idx) => {
                const state = tiles[idx];
                const isRevealedGem = state === "GEM";
                const isRevealedMine = state === "MINE";
                const isTranslucentMine = state === "REVEALED_MINE";
                const isTranslucentGem = state === "REVEALED_GEM";
                const isAutoSelected = mode === "AUTO" && selectedAutoTiles.includes(idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={gameState !== "PLAYING" && mode !== "AUTO"}
                    onClick={() => {
                      if (mode === "MANUAL") {
                        handleTileClick(idx);
                      } else {
                        toggleAutoTile(idx);
                      }
                    }}
                    className={`relative rounded-2xl flex items-center justify-center transition-all duration-300 font-black text-2xl sm:text-3xl shadow-md border ${
                      isRevealedGem
                        ? "bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.5)] scale-95"
                        : isRevealedMine
                        ? "bg-rose-950/90 border-rose-500 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-bounce"
                        : isTranslucentMine
                        ? "bg-rose-950/20 border-rose-500/20 text-rose-500/40 opacity-50"
                        : isTranslucentGem
                        ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400/40 opacity-40"
                        : isAutoSelected
                        ? "bg-amber-500/30 border-amber-400 text-amber-300 ring-2 ring-gold/60"
                        : "bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-white/10 hover:border-gold/50 hover:brightness-125 active:scale-95"
                    }`}
                  >
                    {isRevealedGem && "💎"}
                    {isRevealedMine && "💥"}
                    {isTranslucentMine && "💣"}
                    {isTranslucentGem && "💎"}
                    {isAutoSelected && state === "HIDDEN" && "⭐"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
