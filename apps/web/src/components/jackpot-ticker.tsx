"use client";

import { useEffect, useState } from "react";
import { Sparkles, Crown, Zap, Flame } from "lucide-react";

export function JackpotTicker() {
  const [grand, setGrand] = useState(1284592.45);
  const [major, setMajor] = useState(148231.1);
  const [minor, setMinor] = useState(12480.25);
  const [mini, setMini] = useState(1890.6);

  useEffect(() => {
    const interval = setInterval(() => {
      setGrand((prev) => prev + Math.random() * 0.45);
      setMajor((prev) => prev + Math.random() * 0.15);
      setMinor((prev) => prev + Math.random() * 0.05);
      setMini((prev) => prev + Math.random() * 0.02);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-[#170a00] via-[#241000] to-[#0c0500] p-4 sm:p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-gold animate-bounce" />
          <span className="font-extrabold text-sm sm:text-base tracking-wider text-white">
            VLADFSBET PROGRESSIVE JACKPOT VAULT
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 animate-pulse">
          <Zap className="h-3.5 w-3.5" /> LIVE COMMUNITY ACCUMULATOR
        </span>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          {
            tier: "MEGA GRAND",
            amount: grand,
            color: "from-amber-400 via-yellow-200 to-amber-500",
            border: "border-amber-400/50 bg-amber-950/40",
            icon: "👑",
          },
          {
            tier: "MAJOR",
            amount: major,
            color: "from-purple-300 via-pink-200 to-purple-400",
            border: "border-purple-500/40 bg-purple-950/40",
            icon: "💎",
          },
          {
            tier: "MINOR",
            amount: minor,
            color: "from-sky-300 via-cyan-200 to-sky-400",
            border: "border-sky-500/40 bg-sky-950/40",
            icon: "⚡",
          },
          {
            tier: "MINI",
            amount: mini,
            color: "from-emerald-300 via-teal-200 to-emerald-400",
            border: "border-emerald-500/40 bg-emerald-950/40",
            icon: "🪙",
          },
        ].map((jp, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-3 sm:p-4 text-center space-y-1 backdrop-blur-md transition-transform hover:scale-[1.02] ${jp.border}`}
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-white/80 uppercase tracking-wider">
              <span>{jp.icon}</span>
              <span>{jp.tier}</span>
            </div>
            <p
              className={`font-mono text-base sm:text-xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r ${jp.color} drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]`}
            >
              {formatNumber(jp.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
