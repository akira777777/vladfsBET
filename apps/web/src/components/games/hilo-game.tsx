"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Volume2, VolumeX, ArrowUp, ArrowDown, SkipForward, Layers } from "lucide-react";
import { gameAudio } from "./game-audio";
import { formatMoney } from "@/lib/format";
import { getHiloOdds, type HiloCard } from "@/lib/provably-fair";

interface HiloGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

export function HiloGame({ game }: HiloGameProps) {
  const { user, wallet, refreshWallet } = useAuth();
  const currency = wallet?.currency ?? user?.currency ?? "USD";

  // Configuration
  const [stake, setStake] = useState<number>(10);
  const [isMuted, setIsMuted] = useState(false);

  // Active Game State
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "CASHOUT" | "BUSTED">("IDLE");
  const [currentCard, setCurrentCard] = useState<HiloCard>({ suit: "♠", rank: "7", value: 7 });
  const [accumulatedMultiplier, setAccumulatedMultiplier] = useState<number>(1.0);
  const [skipsRemaining, setSkipsRemaining] = useState<number>(3);
  const [cardHistory, setCardHistory] = useState<{ card: HiloCard; won: boolean; mult: number }[]>([]);
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);

  const [provablyFairData, setProvablyFairData] = useState({
    serverSeedHash: "1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
    clientSeed: "vladfs_hilo_seed",
    nonce: 924,
  });

  const toggleMute = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  const odds = getHiloOdds(currentCard.value);

  // Start Hilo Game
  const startHilo = async () => {
    gameAudio.playBet();
    setGameState("PLAYING");
    setAccumulatedMultiplier(1.0);
    setSkipsRemaining(3);
    setLastWinAmount(null);

    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const suits: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
    const randomRankIdx = Math.floor(Math.random() * ranks.length);
    const startCard: HiloCard = {
      rank: ranks[randomRankIdx],
      suit: suits[Math.floor(Math.random() * suits.length)],
      value: randomRankIdx + 2,
    };

    setCurrentCard(startCard);
    setCardHistory([{ card: startCard, won: true, mult: 1.0 }]);

    try {
      const res = await api<{
        provablyFair?: { serverSeedHash: string; clientSeed: string; nonce: number };
      }>(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: stake.toString(),
          gameData: { currentCardValue: startCard.value, guess: "START" },
        }),
      });
      if (res.provablyFair) {
        setProvablyFairData(res.provablyFair);
      }
    } catch {}
  };

  // Guess Higher or Lower
  const makeGuess = async (guess: "HIGHER" | "LOWER" | "SAME") => {
    if (gameState !== "PLAYING") return;
    gameAudio.playCardFlip();

    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const suits: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
    const nextRankIdx = Math.floor(Math.random() * ranks.length);
    const nextCard: HiloCard = {
      rank: ranks[nextRankIdx],
      suit: suits[Math.floor(Math.random() * suits.length)],
      value: nextRankIdx + 2,
    };

    let won = false;
    let stepMult = 1.0;

    if (guess === "HIGHER") {
      won = nextCard.value >= currentCard.value;
      stepMult = odds.higherMultiplier;
    } else if (guess === "LOWER") {
      won = nextCard.value <= currentCard.value;
      stepMult = odds.lowerMultiplier;
    } else {
      won = nextCard.value === currentCard.value;
      stepMult = odds.sameMultiplier;
    }

    if (won) {
      const nextAcc = Math.round(accumulatedMultiplier * stepMult * 100) / 100;
      setAccumulatedMultiplier(nextAcc);
      setCurrentCard(nextCard);
      setCardHistory((prev) => [{ card: nextCard, won: true, mult: nextAcc }, ...prev]);
      gameAudio.playGemReveal(cardHistory.length);
    } else {
      setGameState("BUSTED");
      setCurrentCard(nextCard);
      setCardHistory((prev) => [{ card: nextCard, won: false, mult: 0 }, ...prev]);
      gameAudio.playLossThud();
      void refreshWallet();
    }
  };

  // Skip Card
  const skipCard = () => {
    if (gameState !== "PLAYING" || skipsRemaining <= 0) return;
    gameAudio.playCardFlip();
    setSkipsRemaining((prev) => prev - 1);

    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const suits: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
    const randomRankIdx = Math.floor(Math.random() * ranks.length);
    const newCard: HiloCard = {
      rank: ranks[randomRankIdx],
      suit: suits[Math.floor(Math.random() * suits.length)],
      value: randomRankIdx + 2,
    };
    setCurrentCard(newCard);
  };

  // Cashout
  const handleCashout = async () => {
    if (gameState !== "PLAYING" || accumulatedMultiplier <= 1.0) return;
    const payout = Math.round(stake * accumulatedMultiplier * 100) / 100;
    setLastWinAmount(payout);
    setGameState("CASHOUT");
    gameAudio.playCashoutFanfare();

    try {
      await api(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: stake.toString(),
          gameData: { accumulatedMultiplier, guess: "CASHOUT" },
        }),
      });
      void refreshWallet();
    } catch {}
  };

  const isRedSuit = currentCard.suit === "♥" || currentCard.suit === "♦";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <RealityCheckBar />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-gold" />
              {game.title}
            </h1>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-gold border border-gold/30">
              Card Streak Multiplier
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Guess Higher or Lower card values. Chain consecutive winning streaks and cash out anytime.
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
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Bet Amount ($)</span>
                <span className="font-semibold text-white">Balance: {formatMoney(wallet?.available ?? 1000, currency)}</span>
              </div>
              <Input
                type="number"
                min="0.1"
                step="1"
                disabled={gameState === "PLAYING"}
                value={stake}
                onChange={(e) => setStake(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="h-10 text-xs bg-black/40 font-mono font-bold"
              />
              <div className="flex gap-1">
                {[1, 5, 10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={gameState === "PLAYING"}
                    onClick={() => setStake(amt)}
                    className="flex-1 rounded bg-white/5 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-white"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {gameState === "PLAYING" && (
              <div className="rounded-xl bg-black/50 border border-white/10 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Multiplier:</span>
                  <span className="font-mono font-bold text-gold text-sm">{accumulatedMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashout Value:</span>
                  <span className="font-mono font-bold text-emerald-400">${(stake * accumulatedMultiplier).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Skips Available:</span>
                  <span className="font-mono font-bold text-cyan-400">{skipsRemaining} / 3</span>
                </div>
              </div>
            )}

            {gameState === "PLAYING" ? (
              <div className="space-y-2 pt-2">
                <Button
                  size="lg"
                  onClick={() => void makeGuess("HIGHER")}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-xs uppercase text-black hover:brightness-110 flex items-center justify-between px-4"
                >
                  <span className="flex items-center gap-1.5"><ArrowUp className="h-4 w-4" /> Higher or Equal</span>
                  <span className="font-mono">{odds.higherMultiplier.toFixed(2)}x ({odds.higherChance}%)</span>
                </Button>

                <Button
                  size="lg"
                  onClick={() => void makeGuess("LOWER")}
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 font-black text-xs uppercase text-white hover:brightness-110 flex items-center justify-between px-4"
                >
                  <span className="flex items-center gap-1.5"><ArrowDown className="h-4 w-4" /> Lower or Equal</span>
                  <span className="font-mono">{odds.lowerMultiplier.toFixed(2)}x ({odds.lowerChance}%)</span>
                </Button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    disabled={skipsRemaining <= 0}
                    onClick={skipCard}
                    className="h-10 text-xs font-bold border-white/10 hover:bg-white/10"
                  >
                    <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip ({skipsRemaining})
                  </Button>
                  <Button
                    disabled={accumulatedMultiplier <= 1.0}
                    onClick={() => void handleCashout()}
                    className="h-10 bg-gold text-black font-bold text-xs hover:brightness-110"
                  >
                    Cash Out (${(stake * accumulatedMultiplier).toFixed(2)})
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={startHilo}
                  className="w-full h-12 bg-gradient-to-r from-gold via-yellow-400 to-amber-500 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:brightness-110"
                >
                  Deal Card & Start (${stake})
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">Card Sequence:</span>
            {cardHistory.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-mono font-bold ring-1 ${
                  item.won ? "bg-black/60 ring-emerald-500/40 text-emerald-300" : "bg-rose-950/80 ring-rose-500 text-rose-400"
                }`}
              >
                <span>{item.card.rank}</span>
                <span className={item.card.suit === "♥" || item.card.suit === "♦" ? "text-rose-500" : "text-white"}>
                  {item.card.suit}
                </span>
                {item.mult > 0 && <span className="text-gold text-[10px]">({item.mult.toFixed(2)}x)</span>}
              </div>
            ))}
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0d101c] via-[#101424] to-[#080a12] p-10 flex flex-col items-center justify-center min-h-[420px] shadow-2xl">
            <div
              className={`relative h-64 w-44 rounded-2xl border-2 bg-white text-slate-900 shadow-2xl p-4 flex flex-col justify-between transition-all duration-300 ${
                isRedSuit ? "text-rose-600 border-rose-200" : "text-slate-900 border-slate-200"
              }`}
            >
              <div className="text-left font-black text-2xl leading-none">
                {currentCard.rank}
                <div className="text-lg">{currentCard.suit}</div>
              </div>

              <div className="text-center text-6xl select-none">{currentCard.suit}</div>

              <div className="text-right font-black text-2xl leading-none rotate-180">
                {currentCard.rank}
                <div className="text-lg">{currentCard.suit}</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              {gameState === "PLAYING" ? (
                <p className="text-xs text-muted-foreground font-medium">
                  Will the next card rank be Higher or Lower than <strong className="text-white">{currentCard.rank}</strong>?
                </p>
              ) : gameState === "CASHOUT" ? (
                <p className="text-sm font-bold text-emerald-400">
                  🎉 Cashed Out +${lastWinAmount?.toFixed(2)} ({accumulatedMultiplier.toFixed(2)}x)!
                </p>
              ) : gameState === "BUSTED" ? (
                <p className="text-sm font-bold text-rose-500">
                  ❌ Incorrect Guess! Streak Ended.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Click Deal Card to begin your streak.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
