"use client";

import { useEffect, useState } from "react";
import { Radio, Users, MessageSquare, Timer, Sparkles, Volume2, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface LiveDealerProps {
  tableName: string;
  gameType: "ROULETTE" | "BLACKJACK" | "BACCARAT";
  dealerName: string;
  minBet: string;
  maxBet: string;
}

interface ChatMessage {
  id: string;
  user: string;
  badge?: string;
  message: string;
  isDealer?: boolean;
}

export function LiveDealerTable({
  tableName,
  gameType,
  dealerName,
  minBet,
  maxBet,
}: LiveDealerProps) {
  const [timerSeconds, setTimerSeconds] = useState(12);
  const [roundState, setRoundState] = useState<"PLACE_BETS" | "NO_MORE_BETS" | "DEALING" | "PAYOUT">("PLACE_BETS");
  const [activeSeats, setActiveSeats] = useState<{ seat: number; player: string; bet: string | null }[]>([
    { seat: 1, player: "CryptoWhale", bet: "$250" },
    { seat: 2, player: "You (Vlad)", bet: null },
    { seat: 3, player: "NordicAce", bet: "$50" },
    { seat: 4, player: "Open Seat", bet: null },
    { seat: 5, player: "DiamondLady", bet: "$100" },
    { seat: 6, player: "Open Seat", bet: null },
    { seat: 7, player: "AlphaTrader", bet: "$500" },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", user: dealerName, isDealer: true, message: "Welcome to VladfsBET VIP Salon! Place your bets please." },
    { id: "2", user: "CryptoWhale", badge: "VIP", message: "Good evening Elena, let's hit a natural 9 today!" },
    { id: "3", user: "AlphaTrader", badge: "PRO", message: "Red 7 on roulette please" },
  ]);

  const [userChatInput, setUserChatInput] = useState("");

  // Live round countdown loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (roundState === "PLACE_BETS") {
            setRoundState("NO_MORE_BETS");
            return 3;
          } else if (roundState === "NO_MORE_BETS") {
            setRoundState("DEALING");
            return 8;
          } else if (roundState === "DEALING") {
            setRoundState("PAYOUT");
            return 4;
          } else {
            setRoundState("PLACE_BETS");
            return 15;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [roundState]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      badge: "VIP",
      message: userChatInput.trim(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setUserChatInput("");
  };

  return (
    <div className="space-y-4">
      {/* Live Stream Viewport & Interactive Overlay */}
      <div className="relative aspect-[16/9] min-h-[380px] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e071c] via-[#080410] to-[#040108] shadow-2xl">
        {/* Simulated HD Live Dealer Broadcast Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600/20 via-purple-900/10 to-transparent animate-pulse" />
        </div>

        {/* Top HUD: Studio Feed Status, Dealer Info & Timer */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 text-white px-2.5 py-0.5 text-xs font-black uppercase tracking-wider animate-pulse">
              <Radio className="h-3 w-3" /> LIVE 1080P
            </span>
            <div className="text-xs">
              <span className="font-extrabold text-white">{tableName}</span>
              <span className="text-muted-foreground ml-2">Dealer: <strong className="text-gold">{dealerName}</strong></span>
            </div>
          </div>

          {/* Round Timer Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-mono font-black text-amber-300">
              <Timer className="h-3.5 w-3.5 text-amber-400" />
              <span>{roundState.replace(/_/g, " ")}: {timerSeconds}s</span>
            </div>

            <div className="text-[11px] text-muted-foreground hidden sm:block">
              Limits: {minBet} - {maxBet}
            </div>
          </div>
        </div>

        {/* Center Live Dealer Virtual Table Simulation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="relative flex flex-col items-center justify-center">
            {/* Dealer Avatar & Podium */}
            <div className="w-24 h-24 rounded-full border-2 border-gold/60 bg-gradient-to-tr from-amber-900 to-yellow-600 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(251,191,36,0.4)] mb-2">
              👩‍💼
            </div>
            <span className="text-xs font-bold text-white bg-black/70 px-3 py-0.5 rounded-full border border-white/10">
              {dealerName} • Shoe Deck #4/8
            </span>

            {/* Round Status Banner */}
            <div className="mt-4">
              <span
                className={`inline-block rounded-xl px-6 py-2 text-sm font-black uppercase tracking-widest backdrop-blur-md shadow-2xl transition-all duration-300 ${
                  roundState === "PLACE_BETS"
                    ? "bg-emerald-600/90 text-white animate-bounce"
                    : roundState === "NO_MORE_BETS"
                    ? "bg-red-600/90 text-white scale-105"
                    : "bg-blue-600/90 text-white"
                }`}
              >
                {roundState === "PLACE_BETS"
                  ? "★ PLACE YOUR BETS ★"
                  : roundState === "NO_MORE_BETS"
                  ? "⛔ NO MORE BETS"
                  : roundState === "DEALING"
                  ? "🃏 DEALING CARDS..."
                  : "🏆 WINNERS PAID"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Multi-Seat HUD */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center gap-2 sm:gap-3">
          {activeSeats.map((s) => (
            <div
              key={s.seat}
              className={`flex flex-col items-center justify-center rounded-xl p-2 border backdrop-blur-md text-[10px] transition-all ${
                s.player.includes("You")
                  ? "bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-105"
                  : s.player === "Open Seat"
                  ? "bg-black/40 border-white/5 opacity-60 hover:opacity-100 cursor-pointer"
                  : "bg-black/60 border-white/10"
              }`}
            >
              <span className="font-bold text-white truncate max-w-[80px]">{s.player}</span>
              <span className="font-mono text-gold font-bold">{s.bet || "No Bet"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Table Interactive Chat & Roadmaps */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left: Roadmaps & Statistical Ticker (Big Road) */}
        <Card className="p-4 border-white/10 bg-[#0A0E17] lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gold uppercase tracking-wider">Live Shoe Roadmap History</span>
            <div className="flex gap-2 text-[10px] font-bold">
              <span className="text-blue-400">Player: 48%</span>
              <span className="text-red-400">Banker: 44%</span>
              <span className="text-emerald-400">Tie: 8%</span>
            </div>
          </div>

          {/* Bead Road Display */}
          <div className="grid grid-cols-12 gap-1 bg-black/60 p-2.5 rounded-xl border border-white/5 overflow-x-auto">
            {["P", "B", "B", "P", "T", "P", "P", "B", "P", "B", "B", "B"].map((res, i) => (
              <div
                key={i}
                className={`flex h-7 w-7 items-center justify-center rounded-full font-black text-xs text-white shadow-sm ${
                  res === "P"
                    ? "bg-blue-600"
                    : res === "B"
                    ? "bg-red-600"
                    : "bg-emerald-600"
                }`}
              >
                {res}
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Live Dealer Room Chat */}
        <Card className="p-4 border-white/10 bg-[#0A0E17] lg:col-span-4 flex flex-col justify-between h-56">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-white">
              <MessageSquare className="h-3.5 w-3.5 text-gold" /> Table Chat
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" /> 42 Players
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {chatMessages.map((m) => (
              <div key={m.id} className="leading-snug">
                <span className={`font-bold ${m.isDealer ? "text-amber-400" : "text-sky-300"}`}>
                  {m.badge ? `[${m.badge}] ` : ""}{m.user}:{" "}
                </span>
                <span className="text-neutral-300">{m.message}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-white/10 mt-2">
            <Input
              value={userChatInput}
              onChange={(e) => setUserChatInput(e.target.value)}
              placeholder="Chat with dealer..."
              className="h-8 text-xs bg-black/40 border-white/10"
            />
            <Button type="submit" size="sm" className="h-8 px-3 text-xs bg-gold text-black font-bold">
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
