"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

interface BlackjackGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

interface CardType {
  rank: string;
  suit: "♠" | "♥" | "♦" | "♣";
  color: "RED" | "BLACK";
}

export function BlackjackGame({ game }: BlackjackGameProps) {
  const { refreshWallet } = useAuth();
  const [bet, setBet] = useState(10);
  const [inRound, setInRound] = useState(false);
  const [playerCards, setPlayerCards] = useState<CardType[]>([]);
  const [dealerCards, setDealerCards] = useState<CardType[]>([]);
  const [roundStatus, setRoundStatus] = useState<"DEALING" | "PLAYER_TURN" | "RESOLVED">("RESOLVED");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [lastWin, setLastWin] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calculateHandValue = (cards: CardType[]) => {
    let sum = 0;
    let aces = 0;
    for (const c of cards) {
      if (c.rank === "A") {
        aces++;
        sum += 11;
      } else if (["K", "Q", "J", "10"].includes(c.rank)) {
        sum += 10;
      } else {
        sum += parseInt(c.rank) || 0;
      }
    }
    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces--;
    }
    return sum;
  };

  const getRandomCard = (): CardType => {
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const suits: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const color = suit === "♥" || suit === "♦" ? "RED" : "BLACK";
    return { rank, suit, color };
  };

  const handleDeal = async () => {
    if (inRound) return;
    setInRound(true);
    setErrorMsg(null);
    setResultMessage(null);
    setLastWin(null);

    try {
      const p1 = getRandomCard();
      const p2 = getRandomCard();
      const d1 = getRandomCard();
      const dHidden: CardType = { rank: "?", suit: "♠", color: "BLACK" };

      setPlayerCards([p1, p2]);
      setDealerCards([d1, dHidden]);
      setRoundStatus("PLAYER_TURN");

      // Auto check blackjack
      const pScore = calculateHandValue([p1, p2]);
      if (pScore === 21) {
        await handleStand([p1, p2], d1);
      }
    } catch (err) {
      setInRound(false);
      setErrorMsg(err instanceof Error ? err.message : "Failed to start hand");
    }
  };

  const handleHit = () => {
    if (roundStatus !== "PLAYER_TURN") return;
    const nextCard = getRandomCard();
    const updated = [...playerCards, nextCard];
    setPlayerCards(updated);
    const score = calculateHandValue(updated);
    if (score > 21) {
      // Player Busts
      void finishRound(updated, dealerCards, false, "Player Busted (Over 21)!");
    }
  };

  const handleStand = async (customP = playerCards, initialD = dealerCards[0]) => {
    if (roundStatus !== "PLAYER_TURN") return;
    setRoundStatus("RESOLVED");

    // Dealer draws to 17
    const dHand = [initialD, getRandomCard()];
    let dScore = calculateHandValue(dHand);
    while (dScore < 17) {
      dHand.push(getRandomCard());
      dScore = calculateHandValue(dHand);
    }
    setDealerCards(dHand);

    const pScore = calculateHandValue(customP);
    let won = false;
    let msg = "";

    if (dScore > 21) {
      won = true;
      msg = `Dealer Busted (${dScore})! You Win!`;
    } else if (pScore > dScore) {
      won = true;
      msg = `You Win! (${pScore} vs ${dScore})`;
    } else if (pScore === dScore) {
      msg = `Push / Tie (${pScore} vs ${dScore})`;
    } else {
      msg = `Dealer Wins (${dScore} vs ${pScore})`;
    }

    await finishRound(customP, dHand, won, msg);
  };

  const finishRound = async (pCards: CardType[], dCards: CardType[], won: boolean, msg: string) => {
    setRoundStatus("RESOLVED");
    setResultMessage(msg);

    try {
      await api<{
        winAmount: string;
      }>(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: bet.toString(),
          gameData: { won },
        }),
      });

      if (won) {
        setLastWin(`+$${(bet * 2).toFixed(2)}`);
      }
      await refreshWallet();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to settle round");
    } finally {
      setInRound(false);
    }
  };

  const playerScore = calculateHandValue(playerCards);
  const dealerScore = dealerCards.length > 0 && dealerCards[1]?.rank !== "?" ? calculateHandValue(dealerCards) : null;

  return (
    <div className="space-y-4">
      <RealityCheckBar />

      <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-b from-[#062c1d] via-[#091e17] to-[#0a1017] p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-emerald-300">{game.title}</h3>
            <p className="text-xs text-emerald-200/60">Vegas Rules • Dealer stands on 17 • Blackjack pays 3:2</p>
          </div>
          <ProvablyFairDialog />
        </div>

        {/* Felt Table Area */}
        <div className="space-y-8 my-4">
          {/* Dealer Area */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200/70 mb-2">
              Dealer Hand {dealerScore ? `(${dealerScore})` : ""}
            </span>
            <div className="flex gap-3 min-h-[90px] items-center">
              {dealerCards.length === 0 ? (
                <div className="h-24 w-16 rounded-md border border-dashed border-emerald-500/30 flex items-center justify-center text-xs text-emerald-300/40">
                  Dealer
                </div>
              ) : (
                dealerCards.map((c, idx) => (
                  <div
                    key={idx}
                    className={`h-24 w-16 rounded-lg bg-white p-2 text-black shadow-lg flex flex-col justify-between font-bold animate-in fade-in slide-in-from-top-2 ${
                      c.color === "RED" ? "text-red-600" : "text-zinc-900"
                    }`}
                  >
                    <span className="text-sm leading-none">{c.rank}</span>
                    <span className="text-xl self-center leading-none">{c.suit}</span>
                    <span className="text-sm self-end leading-none">{c.rank}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Table Center / Result Banner */}
          <div className="flex justify-center min-h-[32px]">
            {resultMessage && (
              <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-5 py-1.5 text-sm font-bold text-gold ring-1 ring-gold/30 animate-in zoom-in">
                {resultMessage} {lastWin && <span className="text-emerald-400">{lastWin}</span>}
              </div>
            )}
          </div>

          {/* Player Area */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold mb-2">
              Player Hand {playerCards.length > 0 ? `(${playerScore})` : ""}
            </span>
            <div className="flex gap-3 min-h-[90px] items-center">
              {playerCards.length === 0 ? (
                <div className="h-24 w-16 rounded-md border border-dashed border-gold/30 flex items-center justify-center text-xs text-gold/40">
                  Player
                </div>
              ) : (
                playerCards.map((c, idx) => (
                  <div
                    key={idx}
                    className={`h-24 w-16 rounded-lg bg-white p-2 text-black shadow-lg flex flex-col justify-between font-bold animate-in fade-in slide-in-from-bottom-2 ${
                      c.color === "RED" ? "text-red-600" : "text-zinc-900"
                    }`}
                  >
                    <span className="text-sm leading-none">{c.rank}</span>
                    <span className="text-xl self-center leading-none">{c.suit}</span>
                    <span className="text-sm self-end leading-none">{c.rank}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="my-3 rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400 text-center">
            {errorMsg}
          </div>
        )}

        {/* Action Controls & Chips */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 mt-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Bet Size:</span>
            {[5, 10, 25, 50, 100].map((val) => (
              <button
                key={val}
                disabled={inRound}
                onClick={() => setBet(val)}
                className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs shadow-md transition-all ${
                  bet === val
                    ? "scale-110 ring-2 ring-gold bg-gold text-black"
                    : "bg-black/50 border border-white/20 text-white hover:bg-white/10 disabled:opacity-40"
                }`}
              >
                ${val}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!inRound ? (
              <Button
                onClick={handleDeal}
                size="lg"
                className="px-8 bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold hover:brightness-110 shadow-lg shadow-gold/20"
              >
                DEAL (${bet})
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleHit}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6"
                >
                  HIT
                </Button>
                <Button
                  onClick={() => handleStand()}
                  size="lg"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-6"
                >
                  STAND
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
