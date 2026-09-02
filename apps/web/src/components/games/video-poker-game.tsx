"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

interface VideoPokerProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

interface CardType {
  rank: string;
  suit: "♠" | "♥" | "♦" | "♣";
  color: "RED" | "BLACK";
}

const PAYTABLE = [
  { hand: "Royal Flush", payout: 800 },
  { hand: "Straight Flush", payout: 50 },
  { hand: "Four of a Kind", payout: 25 },
  { hand: "Full House", payout: 9 },
  { hand: "Flush", payout: 6 },
  { hand: "Straight", payout: 4 },
  { hand: "Three of a Kind", payout: 3 },
  { hand: "Two Pair", payout: 2 },
  { hand: "Jacks or Better", payout: 1 },
];

export function VideoPokerGame({ game }: VideoPokerProps) {
  const { refreshWallet } = useAuth();
  const [bet, setBet] = useState(5);
  const [stage, setStage] = useState<"DEAL" | "DRAW">("DEAL");
  const [cards, setCards] = useState<CardType[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [winningHand, setWinningHand] = useState<string | null>(null);
  const [winAmount, setWinAmount] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getRandomCard = (): CardType => {
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const suits: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const color = suit === "♥" || suit === "♦" ? "RED" : "BLACK";
    return { rank, suit, color };
  };

  const toggleHold = (index: number) => {
    if (stage !== "DRAW") return;
    setHeld((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleFirstDeal = () => {
    setErrorMsg(null);
    setWinningHand(null);
    setWinAmount(null);

    const dealCards = [getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard()];
    setCards(dealCards);
    setHeld([false, false, false, false, false]);
    setStage("DRAW");
  };

  const handleDraw = async () => {
    const finalCards = cards.map((c, i) => (held[i] ? c : getRandomCard()));
    setCards(finalCards);
    setStage("DEAL");

    try {
      const res = await api<{
        winAmount: string;
        multiplier: number;
      }>(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: bet.toString(),
          gameData: { heldCards: held },
        }),
      });

      const winVal = parseFloat(res.winAmount) || 0;
      if (winVal > 0) {
        setWinningHand("Jacks or Better Win");
        setWinAmount(`+$${winVal.toFixed(2)}`);
      } else {
        setWinningHand("Game Over (No Win)");
      }
      await refreshWallet();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to complete draw");
    }
  };

  return (
    <div className="space-y-4">
      <RealityCheckBar />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Paytable Matrix */}
        <Card className="p-4 border-white/10 bg-[#070B14] lg:col-span-4">
          <span className="text-xs uppercase font-bold tracking-wider text-gold mb-3 block">
            Jacks or Better Paytable
          </span>
          <div className="space-y-1 text-xs">
            {PAYTABLE.map((p) => (
              <div
                key={p.hand}
                className={`flex justify-between p-1.5 rounded transition-colors ${
                  winningHand?.includes(p.hand) ? "bg-gold text-black font-bold" : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                <span>{p.hand}</span>
                <span className="font-mono">{p.payout * bet}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: 5-Card Draw Video Poker Machine */}
        <Card className="flex flex-col justify-between p-6 border-blue-500/20 bg-gradient-to-b from-[#09152e] to-[#070b14] lg:col-span-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-blue-300">{game.title}</h3>
                <p className="text-xs text-blue-200/60">Press DEAL, select cards to HOLD, then press DRAW</p>
              </div>
              <ProvablyFairDialog />
            </div>

            {/* 5 Cards Display */}
            <div className="grid grid-cols-5 gap-2 md:gap-4 my-6">
              {cards.length === 0
                ? Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-32 rounded-lg border-2 border-dashed border-blue-400/30 flex items-center justify-center text-xs text-blue-300/40"
                    >
                      CARD {idx + 1}
                    </div>
                  ))
                : cards.map((c, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <button
                        onClick={() => toggleHold(idx)}
                        disabled={stage !== "DRAW"}
                        className={`h-32 w-full rounded-lg bg-white p-2 text-black shadow-xl flex flex-col justify-between font-bold transition-all ${
                          held[idx] ? "ring-4 ring-gold -translate-y-2" : "hover:-translate-y-1"
                        } ${c.color === "RED" ? "text-red-600" : "text-zinc-900"}`}
                      >
                        <span className="text-sm leading-none">{c.rank}</span>
                        <span className="text-2xl self-center leading-none">{c.suit}</span>
                        <span className="text-sm self-end leading-none">{c.rank}</span>
                      </button>
                      <button
                        onClick={() => toggleHold(idx)}
                        disabled={stage !== "DRAW"}
                        className={`mt-2 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded transition-all ${
                          held[idx] ? "bg-gold text-black shadow" : "bg-black/50 text-white/60"
                        }`}
                      >
                        {held[idx] ? "HELD" : "HOLD"}
                      </button>
                    </div>
                  ))}
            </div>

            {winningHand && (
              <div className="text-center my-3 animate-in zoom-in">
                <span className="inline-flex items-center gap-2 rounded-full bg-gold/20 border border-gold/40 px-5 py-1 text-sm font-bold text-gold">
                  {winningHand} {winAmount && <span className="text-emerald-400">{winAmount}</span>}
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="my-2 rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400 text-center">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 mt-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Bet:</span>
              {[1, 5, 10, 25, 50].map((val) => (
                <button
                  key={val}
                  disabled={stage === "DRAW"}
                  onClick={() => setBet(val)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs shadow-md transition-all ${
                    bet === val ? "scale-110 ring-2 ring-gold bg-gold text-black" : "bg-black/50 border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            {stage === "DEAL" ? (
              <Button
                onClick={handleFirstDeal}
                size="lg"
                className="px-8 bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold hover:brightness-110 shadow-lg shadow-gold/20"
              >
                DEAL (${bet})
              </Button>
            ) : (
              <Button
                onClick={handleDraw}
                size="lg"
                className="px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20"
              >
                DRAW
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
