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
  hidden?: boolean;
}

function PlayingCard({ card, delay = 0 }: { card: CardType; delay?: number }) {
  if (card.hidden) {
    return (
      <div
        className="card-back relative h-28 w-[4.6rem] rounded-xl border border-gold/40 shadow-lg ring-1 ring-white/10 animate-card-deal"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="absolute inset-1 rounded-lg border border-gold/30" />
        <span className="absolute inset-0 flex items-center justify-center text-lg text-gold/80">♠</span>
      </div>
    );
  }

  return (
    <div
      className={`relative h-28 w-[4.6rem] rounded-xl bg-white p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.35)] flex flex-col justify-between font-bold animate-card-deal ${
        card.color === "RED" ? "text-red-600" : "text-zinc-900"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="leading-none">
        <div className="text-sm">{card.rank}</div>
        <div className="text-xs">{card.suit}</div>
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-3xl opacity-90">{card.suit}</span>
      <div className="self-end rotate-180 leading-none text-right">
        <div className="text-sm">{card.rank}</div>
        <div className="text-xs">{card.suit}</div>
      </div>
    </div>
  );
}

export function BlackjackGame({ game }: BlackjackGameProps) {
  const { refreshWallet } = useAuth();
  const [bet, setBet] = useState(10);
  const [inRound, setInRound] = useState(false);
  const [playerCards, setPlayerCards] = useState<CardType[]>([]);
  const [splitCards, setSplitCards] = useState<CardType[] | null>(null);
  const [activeHand, setActiveHand] = useState<"MAIN" | "SPLIT">("MAIN");
  const [dealerCards, setDealerCards] = useState<CardType[]>([]);
  const [roundStatus, setRoundStatus] = useState<"DEALING" | "PLAYER_TURN" | "RESOLVED">("RESOLVED");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [lastWin, setLastWin] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doubled, setDoubled] = useState(false);
  const [splitActive, setSplitActive] = useState(false);

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
    setDoubled(false);
    setSplitActive(false);
    setSplitCards(null);
    setActiveHand("MAIN");

    try {
      const p1 = getRandomCard();
      const p2 = getRandomCard();
      const d1 = getRandomCard();
      const dHidden: CardType = { ...getRandomCard(), hidden: true };

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

  const currentHand = activeHand === "SPLIT" && splitCards ? splitCards : playerCards;
  const setCurrentHand = (cards: CardType[]) => {
    if (activeHand === "SPLIT") setSplitCards(cards);
    else setPlayerCards(cards);
  };

  const handleHit = () => {
    if (roundStatus !== "PLAYER_TURN") return;
    const nextCard = getRandomCard();
    const updated = [...currentHand, nextCard];
    setCurrentHand(updated);
    const score = calculateHandValue(updated);
    if (score > 21) {
      if (splitActive && activeHand === "MAIN" && splitCards) {
        setActiveHand("SPLIT");
        return;
      }
      void finishRound(updated, dealerCards, false, "Player Busted (Over 21)!");
    }
  };

  const compareHand = (pHand: CardType[], dHand: CardType[]) => {
    const pScore = calculateHandValue(pHand);
    const dScore = calculateHandValue(dHand);
    if (pScore > 21) return { won: false, push: false, text: `Bust ${pScore}` };
    if (dScore > 21) return { won: true, push: false, text: `Dealer bust ${dScore}` };
    if (pScore > dScore) return { won: true, push: false, text: `${pScore} vs ${dScore}` };
    if (pScore === dScore) return { won: false, push: true, text: `Push ${pScore}` };
    return { won: false, push: false, text: `${pScore} vs ${dScore}` };
  };

  const handleStand = async (customP = currentHand, initialD = dealerCards[0]) => {
    if (roundStatus !== "PLAYER_TURN") return;

    if (splitActive && activeHand === "MAIN" && splitCards) {
      setActiveHand("SPLIT");
      return;
    }

    setRoundStatus("RESOLVED");
    const hole = dealerCards[1] ? { ...dealerCards[1], hidden: false } : getRandomCard();
    const dHand = [initialD, hole];
    let dScore = calculateHandValue(dHand);
    while (dScore < 17) {
      dHand.push(getRandomCard());
      dScore = calculateHandValue(dHand);
    }
    setDealerCards(dHand);

    if (splitActive && splitCards) {
      const main = compareHand(playerCards, dHand);
      const split = compareHand(splitCards, dHand);
      const won = main.won || split.won;
      const msg = `Hand 1: ${main.text} · Hand 2: ${split.text}`;
      await finishRound(customP, dHand, won, msg);
      return;
    }

    const result = compareHand(customP, dHand);
    const msg = result.push
      ? `Push / Tie (${result.text})`
      : result.won
        ? `You Win! (${result.text})`
        : `Dealer Wins (${result.text})`;
    await finishRound(customP, dHand, result.won, msg);
  };

  const handleDouble = () => {
    if (roundStatus !== "PLAYER_TURN" || currentHand.length !== 2 || doubled) return;
    setDoubled(true);
    const nextCard = getRandomCard();
    const updated = [...currentHand, nextCard];
    setCurrentHand(updated);
    if (calculateHandValue(updated) > 21) {
      if (splitActive && activeHand === "MAIN" && splitCards) {
        setActiveHand("SPLIT");
        return;
      }
      void finishRound(updated, dealerCards, false, "Player Busted on Double!");
      return;
    }
    void handleStand(updated, dealerCards[0]);
  };

  const handleSplit = () => {
    if (roundStatus !== "PLAYER_TURN" || playerCards.length !== 2 || splitActive) return;
    if (playerCards[0].rank !== playerCards[1].rank) return;
    setSplitActive(true);
    setPlayerCards([playerCards[0], getRandomCard()]);
    setSplitCards([playerCards[1], getRandomCard()]);
    setActiveHand("MAIN");
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
          betAmount: (bet * (doubled ? 2 : 1) * (splitActive ? 2 : 1)).toString(),
          gameData: { won },
        }),
      });

      if (won) {
        const stake = bet * (doubled ? 2 : 1) * (splitActive ? 2 : 1);
        setLastWin(`+$${(stake * 2).toFixed(2)}`);
      }
      await refreshWallet();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to settle round");
    } finally {
      setInRound(false);
    }
  };

  const playerScore = calculateHandValue(playerCards);
  const dealerHoleHidden = dealerCards.some((c) => c.hidden);
  const dealerScore =
    dealerCards.length === 0
      ? null
      : dealerHoleHidden
        ? calculateHandValue(dealerCards.filter((c) => !c.hidden))
        : calculateHandValue(dealerCards);

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
            <div className="flex gap-3 min-h-[112px] items-center">
              {dealerCards.length === 0 ? (
                <div className="h-28 w-[4.6rem] rounded-xl border border-dashed border-emerald-500/30 flex items-center justify-center text-xs text-emerald-300/40">
                  Dealer
                </div>
              ) : (
                dealerCards.map((c, idx) => <PlayingCard key={`${c.rank}-${idx}`} card={c} delay={idx * 90} />)
              )}
            </div>
          </div>

          {/* Table Center / Result Banner */}
          <div className="flex justify-center min-h-[32px]">
            {/* Natural 21 Golden Banner */}
            {playerCards.length === 2 && playerScore === 21 && roundStatus !== "RESOLVED" && (
              <div className="inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-black text-black ring-2 ring-yellow-400/60 animate-natural-21"
                style={{ background: "linear-gradient(90deg, #f59e0b, #fde68a, #f59e0b)", boxShadow: "0 0 30px rgba(251,191,36,0.8)" }}>
                ♠ BLACKJACK! Natural 21 ♠
              </div>
            )}
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
            <div className={`flex flex-col items-center gap-3 ${splitActive ? "sm:flex-row sm:items-end" : ""}`}>
              <div className={`flex gap-3 min-h-[112px] items-center rounded-2xl p-2 ${splitActive && activeHand === "MAIN" && roundStatus === "PLAYER_TURN" ? "ring-2 ring-gold/70 bg-black/20" : ""}`}>
                {playerCards.length === 0 ? (
                  <div className="h-28 w-[4.6rem] rounded-xl border border-dashed border-gold/30 flex items-center justify-center text-xs text-gold/40">
                    Player
                  </div>
                ) : (
                  playerCards.map((c, idx) => <PlayingCard key={`m-${c.rank}-${idx}`} card={c} delay={idx * 90 + 45} />)
                )}
              </div>
              {splitCards && (
                <div className={`flex gap-3 min-h-[112px] items-center rounded-2xl p-2 ${activeHand === "SPLIT" && roundStatus === "PLAYER_TURN" ? "ring-2 ring-gold/70 bg-black/20" : ""}`}>
                  {splitCards.map((c, idx) => <PlayingCard key={`s-${c.rank}-${idx}`} card={c} delay={idx * 90 + 90} />)}
                </div>
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
                  onClick={() => void handleStand()}
                  size="lg"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-6"
                >
                  STAND
                </Button>
                <Button
                  onClick={handleDouble}
                  disabled={currentHand.length !== 2 || doubled}
                  size="lg"
                  variant="outline"
                  className="border-gold/40 bg-gold/15 text-gold font-bold px-5 disabled:opacity-40"
                >
                  DOUBLE
                </Button>
                <Button
                  onClick={handleSplit}
                  disabled={splitActive || playerCards.length !== 2 || playerCards[0]?.rank !== playerCards[1]?.rank}
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white font-bold px-5 disabled:opacity-40"
                >
                  SPLIT
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
