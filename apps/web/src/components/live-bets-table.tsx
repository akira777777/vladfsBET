"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Sparkles, Trophy, Flame, ShieldCheck, ExternalLink } from "lucide-react";
import { formatMoney } from "@/lib/format";

interface LiveBet {
  id: string;
  gameSlug: string;
  gameTitle: string;
  gameIcon: string;
  player: string;
  vipTier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  betAmount: number;
  multiplier: number;
  payout: number;
  timestamp: string;
  isHighRoller: boolean;
  isLuckyWin: boolean;
}

const INITIAL_BETS: LiveBet[] = [
  {
    id: "bet-101",
    gameSlug: "aero-crash",
    gameTitle: "Aero Crash",
    gameIcon: "🚀",
    player: "Alex_Vip",
    vipTier: "Platinum",
    betAmount: 150,
    multiplier: 4.85,
    payout: 727.5,
    timestamp: "Just now",
    isHighRoller: true,
    isLuckyWin: false,
  },
  {
    id: "bet-102",
    gameSlug: "plinko",
    gameTitle: "Physics Plinko",
    gameIcon: "⚡",
    player: "CryptoWhale",
    vipTier: "Diamond",
    betAmount: 500,
    multiplier: 26.0,
    payout: 13000,
    timestamp: "1s ago",
    isHighRoller: true,
    isLuckyWin: true,
  },
  {
    id: "bet-103",
    gameSlug: "mines",
    gameTitle: "Cyber Mines",
    gameIcon: "💎",
    player: "LuckyNeko",
    vipTier: "Gold",
    betAmount: 25,
    multiplier: 8.44,
    payout: 211,
    timestamp: "3s ago",
    isHighRoller: false,
    isLuckyWin: false,
  },
  {
    id: "bet-104",
    gameSlug: "gates-of-vladfs",
    gameTitle: "Gates of Vladfs",
    gameIcon: "⚡",
    player: "ZeusGamer",
    vipTier: "Silver",
    betAmount: 20,
    multiplier: 125.0,
    payout: 2500,
    timestamp: "5s ago",
    isHighRoller: false,
    isLuckyWin: true,
  },
  {
    id: "bet-105",
    gameSlug: "dice",
    gameTitle: "Quantum Dice",
    gameIcon: "🎲",
    player: "Satoshi_Roll",
    vipTier: "Bronze",
    betAmount: 10,
    multiplier: 1.98,
    payout: 19.8,
    timestamp: "7s ago",
    isHighRoller: false,
    isLuckyWin: false,
  },
  {
    id: "bet-106",
    gameSlug: "limbo",
    gameTitle: "Limbo Rocket",
    gameIcon: "🎯",
    player: "Astronaut99",
    vipTier: "Gold",
    betAmount: 50,
    multiplier: 50.0,
    payout: 2500,
    timestamp: "9s ago",
    isHighRoller: false,
    isLuckyWin: true,
  },
  {
    id: "bet-107",
    gameSlug: "hilo",
    gameTitle: "Royal Hilo",
    gameIcon: "🃏",
    player: "KingOfCards",
    vipTier: "Silver",
    betAmount: 30,
    multiplier: 3.25,
    payout: 97.5,
    timestamp: "12s ago",
    isHighRoller: false,
    isLuckyWin: false,
  },
];

const GAME_POOL = [
  { slug: "aero-crash", title: "Aero Crash", icon: "🚀" },
  { slug: "plinko", title: "Physics Plinko", icon: "⚡" },
  { slug: "mines", title: "Cyber Mines", icon: "💎" },
  { slug: "dice", title: "Quantum Dice", icon: "🎲" },
  { slug: "limbo", title: "Limbo Rocket", icon: "🎯" },
  { slug: "hilo", title: "Royal Hilo", icon: "🃏" },
  { slug: "gates-of-vladfs", title: "Gates of Vladfs", icon: "⚡" },
  { slug: "cyber-neon-777", title: "Cyber Neon 777", icon: "🎰" },
  { slug: "european-roulette-deluxe", title: "European Roulette", icon: "🎡" },
  { slug: "quantum-blackjack", title: "Quantum Blackjack", icon: "♠️" },
];

const PLAYER_POOL = [
  { name: "ApexPredator", tier: "Diamond" as const },
  { name: "CyberSamurai", tier: "Platinum" as const },
  { name: "GoldDigger_88", tier: "Gold" as const },
  { name: "VegasVibes", tier: "Silver" as const },
  { name: "LuckyStrike", tier: "Bronze" as const },
  { name: "NeonRider", tier: "Gold" as const },
  { name: "WhaleWatcher", tier: "Diamond" as const },
  { name: "MatrixRunner", tier: "Platinum" as const },
];

export function LiveBetsTable() {
  const [tab, setTab] = useState<"ALL" | "HIGH_ROLLERS" | "LUCKY" | "MY_BETS">("ALL");
  const [bets, setBets] = useState<LiveBet[]>(INITIAL_BETS);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomGame = GAME_POOL[Math.floor(Math.random() * GAME_POOL.length)];
      const randomPlayer = PLAYER_POOL[Math.floor(Math.random() * PLAYER_POOL.length)];
      
      const isHigh = Math.random() > 0.7;
      const betAmount = isHigh ? Math.floor(Math.random() * 800 + 100) : Math.floor(Math.random() * 50 + 5);
      
      const isHugeWin = Math.random() > 0.8;
      const mult = isHugeWin
        ? Math.floor((Math.random() * 80 + 10) * 100) / 100
        : Math.floor((Math.random() * 4.5 + 0.2) * 100) / 100;
        
      const payout = mult >= 1.0 ? Math.round(betAmount * mult * 100) / 100 : 0;

      const newBet: LiveBet = {
        id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        gameSlug: randomGame.slug,
        gameTitle: randomGame.title,
        gameIcon: randomGame.icon,
        player: randomPlayer.name,
        vipTier: randomPlayer.tier,
        betAmount,
        multiplier: mult,
        payout,
        timestamp: "Just now",
        isHighRoller: betAmount >= 100,
        isLuckyWin: mult >= 10.0,
      };

      setBets((prev) => [newBet, ...prev.slice(0, 19)]);
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const filteredBets = bets.filter((b) => {
    if (tab === "HIGH_ROLLERS") return b.isHighRoller;
    if (tab === "LUCKY") return b.isLuckyWin;
    if (tab === "MY_BETS") return b.player === "Alex_Vip" || b.id.includes("101");
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h2 className="text-xl font-black uppercase tracking-wide text-white">Live Platform Bets</h2>
          <span className="text-xs text-muted-foreground">Real-Time Community Activity</span>
        </div>

        {/* Tab Filters */}
        <div className="flex rounded-xl bg-black/50 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setTab("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              tab === "ALL" ? "bg-gold text-black shadow" : "text-muted-foreground hover:text-white"
            }`}
          >
            All Bets
          </button>
          <button
            type="button"
            onClick={() => setTab("HIGH_ROLLERS")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
              tab === "HIGH_ROLLERS" ? "bg-gold text-black shadow" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Flame className="h-3 w-3 text-amber-500" /> High Rollers
          </button>
          <button
            type="button"
            onClick={() => setTab("LUCKY")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
              tab === "LUCKY" ? "bg-gold text-black shadow" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Trophy className="h-3 w-3 text-purple-400" /> Lucky Wins (10x+)
          </button>
          <button
            type="button"
            onClick={() => setTab("MY_BETS")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              tab === "MY_BETS" ? "bg-gold text-black shadow" : "text-muted-foreground hover:text-white"
            }`}
          >
            My Bets
          </button>
        </div>
      </div>

      <Card className="overflow-hidden border-white/10 bg-neutral-950/80 shadow-2xl">
        <Table>
          <TableHeader className="bg-black/60">
            <TableRow className="border-white/10 text-[11px] uppercase tracking-wider text-muted-foreground">
              <TableHead className="w-[180px]">Game</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Bet Amount</TableHead>
              <TableHead className="text-center">Multiplier</TableHead>
              <TableHead className="text-right">Payout</TableHead>
              <TableHead className="w-[80px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                  No bets in this category yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredBets.slice(0, 10).map((bet) => {
                const won = bet.payout > 0;
                return (
                  <TableRow
                    key={bet.id}
                    className="border-white/5 transition-colors hover:bg-white/5 text-xs"
                  >
                    <TableCell className="font-semibold text-white">
                      <Link
                        href={`/casino/${bet.gameSlug}`}
                        className="flex items-center gap-2 group-hover:text-gold transition-colors"
                      >
                        <span className="text-lg">{bet.gameIcon}</span>
                        <span className="truncate max-w-[130px]">{bet.gameTitle}</span>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase border ${
                            bet.vipTier === "Diamond"
                              ? "bg-cyan-950 border-cyan-400 text-cyan-300"
                              : bet.vipTier === "Platinum"
                              ? "bg-purple-950 border-purple-400 text-purple-300"
                              : bet.vipTier === "Gold"
                              ? "bg-amber-950 border-amber-400 text-amber-300"
                              : bet.vipTier === "Silver"
                              ? "bg-slate-800 border-slate-400 text-slate-200"
                              : "bg-orange-950 border-orange-400 text-orange-300"
                          }`}
                        >
                          {bet.vipTier}
                        </span>
                        <span className="text-white/80 font-medium truncate max-w-[100px]">{bet.player}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-white">
                      ${bet.betAmount.toFixed(2)}
                    </TableCell>

                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                          bet.multiplier >= 50
                            ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                            : bet.multiplier >= 10
                            ? "bg-amber-500/20 text-gold ring-1 ring-gold/50 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                            : bet.multiplier >= 2
                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                            : "bg-white/5 text-muted-foreground ring-1 ring-white/10"
                        }`}
                      >
                        {bet.multiplier.toFixed(2)}x
                      </span>
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold">
                      {won ? (
                        <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                          +${bet.payout.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">$0.00</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        href={`/casino/${bet.gameSlug}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-muted-foreground hover:bg-gold/20 hover:text-gold transition-colors"
                        title="Play Game"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
