"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

interface BaccaratGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

interface CardType {
  rank: string;
  suit: "♠" | "♥" | "♦" | "♣";
  color: "RED" | "BLACK";
}

export function BaccaratGame({ game }: BaccaratGameProps) {
  const { refreshWallet } = useAuth();
  const [betSide, setBetSide] = useState<"PLAYER" | "BANKER" | "TIE">("PLAYER");
  const [chip, setChip] = useState(25);
  const [dealing, setDealing] = useState(false);
  const [playerCards, setPlayerCards] = useState<CardType[]>([]);
  const [bankerCards, setBankerCards] = useState<CardType[]>([]);
  const [roundResult, setRoundResult] = useState<{
    winner: "PLAYER" | "BANKER" | "TIE";
    pScore: number;
    bScore: number;
    won: boolean;
    winAmount: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getBaccaratCardValue = (rank: string) => {
    if (["10", "J", "Q", "K"].includes(rank)) return 0;
    if (rank === "A") return 1;
    return parseInt(rank) || 0;
  };

  const calculateBaccaratScore = (cards: CardType[]) => {
    const total = cards.reduce((acc, c) => acc + getBaccaratCardValue(c.rank), 0);
    return total % 10;
  };

  const getRandomCard = (): CardType => {
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const suits: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const color = suit === "♥" || suit === "♦" ? "RED" : "BLACK";
    return { rank, suit, color };
  };

  const handleDeal = async () => {
    if (dealing) return;
    setDealing(true);
    setErrorMsg(null);
    setRoundResult(null);

    try {
      const p1 = getRandomCard();
      const p2 = getRandomCard();
      const b1 = getRandomCard();
      const b2 = getRandomCard();

      const pHand = [p1, p2];
      const bHand = [b1, b2];

      const pScore = calculateBaccaratScore(pHand);
      const bScore = calculateBaccaratScore(bHand);

      const winner: "PLAYER" | "BANKER" | "TIE" =
        pScore > bScore ? "PLAYER" : bScore > pScore ? "BANKER" : "TIE";
      const won = winner === betSide;

      setPlayerCards(pHand);
      setBankerCards(bHand);

      const res = await api<{
        winAmount: string;
      }>(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: chip.toString(),
          gameData: { betSide, won },
        }),
      });

      setRoundResult({
        winner,
        pScore,
        bScore,
        won,
        winAmount: res.winAmount,
      });

      await refreshWallet();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to deal baccarat round");
    } finally {
      setDealing(false);
    }
  };

  return (
    <div className="space-y-4">
      <RealityCheckBar />

      <Card className="border-amber-500/20 bg-gradient-to-b from-[#19150d] via-[#120f0a] to-[#0a0d14] p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gold">{game.title}</h3>
            <p className="text-xs text-muted-foreground">Standard Punto Banco • Player (1:1) • Banker (0.95:1) • Tie (8:1)</p>
          </div>
          <ProvablyFairDialog />
        </div>

        {/* Baccarat Felt Layout */}
        <div className="grid md:grid-cols-2 gap-8 my-6">
          {/* Player Box */}
          <div className={`rounded-xl p-5 border flex flex-col items-center transition-all ${
            roundResult?.winner === "PLAYER" ? "border-blue-500 bg-blue-950/40 ring-2 ring-blue-400" : "border-white/10 bg-black/30"
          }`}>
            <span className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-3">
              Player Hand {roundResult ? `(${roundResult.pScore})` : ""}
            </span>
            <div className="flex gap-3 min-h-[90px] items-center">
              {playerCards.length === 0 ? (
                <div className="h-24 w-16 rounded border border-dashed border-white/20 flex items-center justify-center text-xs text-muted-foreground">
                  Player
                </div>
              ) : (
                playerCards.map((c, i) => (
                  <div key={i} className={`h-24 w-16 rounded-lg bg-white p-2 text-black shadow-lg flex flex-col justify-between font-bold ${c.color === "RED" ? "text-red-600" : "text-zinc-900"}`}>
                    <span className="text-sm leading-none">{c.rank}</span>
                    <span className="text-xl self-center leading-none">{c.suit}</span>
                    <span className="text-sm self-end leading-none">{c.rank}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Banker Box */}
          <div className={`rounded-xl p-5 border flex flex-col items-center transition-all ${
            roundResult?.winner === "BANKER" ? "border-amber-500 bg-amber-950/40 ring-2 ring-amber-400" : "border-white/10 bg-black/30"
          }`}>
            <span className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-3">
              Banker Hand {roundResult ? `(${roundResult.bScore})` : ""}
            </span>
            <div className="flex gap-3 min-h-[90px] items-center">
              {bankerCards.length === 0 ? (
                <div className="h-24 w-16 rounded border border-dashed border-white/20 flex items-center justify-center text-xs text-muted-foreground">
                  Banker
                </div>
              ) : (
                bankerCards.map((c, i) => (
                  <div key={i} className={`h-24 w-16 rounded-lg bg-white p-2 text-black shadow-lg flex flex-col justify-between font-bold ${c.color === "RED" ? "text-red-600" : "text-zinc-900"}`}>
                    <span className="text-sm leading-none">{c.rank}</span>
                    <span className="text-xl self-center leading-none">{c.suit}</span>
                    <span className="text-sm self-end leading-none">{c.rank}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center Result Banner */}
        {roundResult && (
          <div className="text-center my-3 animate-in zoom-in">
            <span className={`inline-flex items-center gap-2 rounded-full px-6 py-1.5 text-sm font-bold shadow-lg ${
              roundResult.won ? "bg-emerald-600 text-white" : "bg-zinc-800 text-muted-foreground"
            }`}>
              {roundResult.winner} WINS ({roundResult.pScore} vs {roundResult.bScore}) — {roundResult.won ? `You Won $${roundResult.winAmount}!` : "No Win"}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="my-2 rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400 text-center">
            {errorMsg}
          </div>
        )}

        {/* Bet Selection & Chips */}
        <div className="space-y-4 border-t border-white/10 pt-4 mt-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { side: "PLAYER" as const, label: "PLAYER (1:1)", color: "border-blue-500/40 hover:bg-blue-900/30" },
              { side: "TIE" as const, label: "TIE (8:1)", color: "border-emerald-500/40 hover:bg-emerald-900/30" },
              { side: "BANKER" as const, label: "BANKER (0.95:1)", color: "border-amber-500/40 hover:bg-amber-900/30" },
            ].map((s) => (
              <button
                key={s.side}
                onClick={() => setBetSide(s.side)}
                className={`rounded-lg border p-4 text-center font-bold text-sm transition-all ${s.color} ${
                  betSide === s.side ? "ring-2 ring-gold bg-gold/10 text-white scale-[1.02]" : "text-muted-foreground opacity-80"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Chip:</span>
              {[5, 25, 100, 250, 500].map((val) => (
                <button
                  key={val}
                  disabled={dealing}
                  onClick={() => setChip(val)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs shadow-md transition-all ${
                    chip === val ? "scale-110 ring-2 ring-gold bg-gold text-black" : "bg-black/50 border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            <Button
              onClick={handleDeal}
              disabled={dealing}
              size="lg"
              className="px-8 bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold hover:brightness-110 shadow-lg shadow-gold/20"
            >
              {dealing ? "DEALING..." : `DEAL ON ${betSide} ($${chip})`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
