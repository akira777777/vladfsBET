"use client";

import Link from "next/link";
import { useState } from "react";
import { Trophy, Flame, Timer, Sparkles, Medal, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";

interface Tournament {
  id: string;
  title: string;
  type: "SLOTS" | "CRASH" | "VIP";
  prizePool: string;
  endsIn: string;
  gameTitle: string;
  gameSlug: string;
  minBet: string;
  scoringRule: string;
  leaderboard: { rank: number; player: string; points: string; prize: string }[];
}

const TOURNAMENTS: Tournament[] = [
  {
    id: "olympus-sprint",
    title: "⚡ $25,000 Gates of Vladfs Grand Sprint",
    type: "SLOTS",
    prizePool: "$25,000 GTD",
    endsIn: "08h 42m 15s",
    gameTitle: "Gates of Vladfs: Olympus Gods",
    gameSlug: "gates-of-vladfs",
    minBet: "$1.00",
    scoringRule: "Highest Single Spin Win Multiplier (e.g. 500x = 50,000 pts)",
    leaderboard: [
      { rank: 1, player: "ZeusStriker99", points: "48,520 pts (485.2x)", prize: "$8,500.00" },
      { rank: 2, player: "CryptoViper_X", points: "36,200 pts (362.0x)", prize: "$4,500.00" },
      { rank: 3, player: "LuckyApe77", points: "29,850 pts (298.5x)", prize: "$2,500.00" },
      { rank: 4, player: "HighRoller_Vlad", points: "22,400 pts (224.0x)", prize: "$1,500.00" },
      { rank: 5, player: "NordicKing", points: "18,900 pts (189.0x)", prize: "$1,000.00" },
      { rank: 6, player: "AlphaTrader", points: "15,200 pts (152.0x)", prize: "$750.00" },
      { rank: 7, player: "CyberSamurai", points: "12,100 pts (121.0x)", prize: "$500.00" },
      { rank: 8, player: "NeonGhost", points: "9,800 pts (98.0x)", prize: "$350.00" },
    ],
  },
  {
    id: "crash-space-hunter",
    title: "🚀 $10,000 Aero Crash Space Hunter",
    type: "CRASH",
    prizePool: "$10,000 GTD",
    endsIn: "14h 10m 00s",
    gameTitle: "Aero Crash Multiplier",
    gameSlug: "aero-crash",
    minBet: "$0.50",
    scoringRule: "Consecutive Successful Cashouts >= 2.0x",
    leaderboard: [
      { rank: 1, player: "RocketPilot", points: "18 Consecutive", prize: "$3,500.00" },
      { rank: 2, player: "AeroAce", points: "15 Consecutive", prize: "$2,000.00" },
      { rank: 3, player: "MoonShot_99", points: "12 Consecutive", prize: "$1,200.00" },
      { rank: 4, player: "QuantumLeap", points: "10 Consecutive", prize: "$800.00" },
      { rank: 5, player: "StarDust", points: "8 Consecutive", prize: "$500.00" },
    ],
  },
  {
    id: "vip-highroller",
    title: "💎 $50,000 Weekly VIP Grand Master",
    type: "VIP",
    prizePool: "$50,000 GTD",
    endsIn: "3d 11h 22m",
    gameTitle: "All Casino & Live Dealer Games",
    gameSlug: "gates-of-vladfs",
    minBet: "$5.00",
    scoringRule: "Total Wager Volume ($1 Wagered = 1 Point)",
    leaderboard: [
      { rank: 1, player: "WhaleKing_VIP", points: "412,850 pts", prize: "$18,000.00" },
      { rank: 2, player: "MonacoBaron", points: "289,400 pts", prize: "$10,000.00" },
      { rank: 3, player: "DiamondHands", points: "194,500 pts", prize: "$6,500.00" },
      { rank: 4, player: "GoldenSultan", points: "135,200 pts", prize: "$4,000.00" },
      { rank: 5, player: "DubaiHighLife", points: "98,000 pts", prize: "$2,500.00" },
    ],
  },
];

export default function TournamentsPage() {
  const { user } = useAuth();
  const [selectedTourney, setSelectedTourney] = useState<Tournament>(TOURNAMENTS[0]);
  const [joined, setJoined] = useState<Record<string, boolean>>({});

  const handleJoin = (id: string) => {
    setJoined((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-[#170a00] via-[#2a1300] to-[#0c0500] p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300">
            <Trophy className="h-4 w-4" /> VLADFSBET LEADERBOARD ARENA
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Compete, Climb &amp; Win <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-300 to-amber-500">$85,000+</span> in Weekly Prizes
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Every spin, crash cashout, and bet earns tournament points automatically. Real-time leaderboards with transparent guaranteed prize distribution.
          </p>
        </div>
      </div>

      {/* Active Tournaments Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {TOURNAMENTS.map((t) => {
          const isSelected = selectedTourney.id === t.id;
          const isJoined = joined[t.id];

          return (
            <Card
              key={t.id}
              onClick={() => setSelectedTourney(t)}
              className={`relative cursor-pointer overflow-hidden p-6 transition-all duration-300 ${
                isSelected
                  ? "border-amber-400 bg-neutral-900/90 shadow-[0_0_25px_rgba(251,191,36,0.3)] scale-[1.02]"
                  : "border-white/10 bg-neutral-950/60 hover:border-white/20 hover:bg-neutral-900/40"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-black text-amber-300">
                  {t.prizePool}
                </span>
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5 text-amber-400" /> {t.endsIn}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{t.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t.gameTitle}</p>

              <div className="rounded-xl bg-black/40 p-3 border border-white/5 space-y-1.5 text-xs mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Bet:</span>
                  <span className="font-semibold text-white">{t.minBet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scoring:</span>
                  <span className="font-semibold text-amber-300 truncate max-w-[160px]">{t.scoringRule}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoin(t.id);
                  }}
                  variant={isJoined ? "outline" : "default"}
                  className={`flex-1 h-9 text-xs font-bold ${
                    isJoined
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      : "bg-gradient-to-r from-gold to-amber-500 text-black font-extrabold"
                  }`}
                >
                  {isJoined ? "✓ ENTERED" : "OPT IN FREE"}
                </Button>
                <Button size="sm" variant="ghost" asChild className="h-9 px-2 text-xs">
                  <Link href={`/casino/${t.gameSlug}`}>Play</Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Tournament Leaderboard */}
      <div className="rounded-3xl border border-white/10 bg-neutral-950/80 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-gold" /> {selectedTourney.title} Leaderboard
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Scoring Rule: {selectedTourney.scoringRule} • Ends in {selectedTourney.endsIn}
            </p>
          </div>

          <Button asChild className="bg-gold text-black font-bold hover:brightness-110">
            <Link href={`/casino/${selectedTourney.gameSlug}`}>
              PLAY QUALIFYING GAME <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {selectedTourney.leaderboard.slice(0, 3).map((lead) => {
            const isFirst = lead.rank === 1;
            const isSecond = lead.rank === 2;

            return (
              <div
                key={lead.rank}
                className={`relative flex flex-col items-center justify-center rounded-2xl p-5 text-center border transition-all ${
                  isFirst
                    ? "bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] order-1 sm:order-2 sm:-translate-y-2"
                    : isSecond
                    ? "bg-neutral-900/60 border-slate-400/30 order-2 sm:order-1"
                    : "bg-neutral-900/60 border-amber-700/30 order-3 sm:order-3"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-black text-lg mb-2 ${
                    isFirst
                      ? "bg-gradient-to-tr from-amber-400 to-yellow-200 text-black shadow-lg"
                      : isSecond
                      ? "bg-gradient-to-tr from-slate-300 to-white text-black"
                      : "bg-gradient-to-tr from-amber-700 to-amber-500 text-white"
                  }`}
                >
                  #{lead.rank}
                </div>
                <span className="font-bold text-white text-sm">{lead.player}</span>
                <span className="font-mono text-xs text-muted-foreground mt-0.5">{lead.points}</span>
                <span className="mt-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 font-mono text-xs font-black text-emerald-300">
                  Prize: {lead.prize}
                </span>
              </div>
            );
          })}
        </div>

        {/* Leaderboard Table (Ranks 4+) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Points</th>
                <th className="py-3 px-4 text-right">Guaranteed Prize</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {selectedTourney.leaderboard.map((lead) => (
                <tr key={lead.rank} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white">#{lead.rank}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-white">{lead.player}</td>
                  <td className="py-3 px-4 text-muted-foreground">{lead.points}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-400">{lead.prize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
