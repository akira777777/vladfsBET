"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Gift, Timer, Trophy, Crown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";

const SEGMENTS = [
  { label: "$500 JACKPOT", color: "#facc15", text: "#000000", value: 500, type: "CASH" },
  { label: "+25 Free Spins", color: "#ec4899", text: "#ffffff", value: 25, type: "SPINS" },
  { label: "$100 Credits", color: "#38bdf8", text: "#ffffff", value: 100, type: "CASH" },
  { label: "2x VIP Boost", color: "#a855f7", text: "#ffffff", value: 2, type: "BOOST" },
  { label: "$50 Credits", color: "#10b981", text: "#ffffff", value: 50, type: "CASH" },
  { label: "+10 Free Spins", color: "#f97316", text: "#ffffff", value: 10, type: "SPINS" },
  { label: "$250 Credits", color: "#eab308", text: "#000000", value: 250, type: "CASH" },
  { label: "20% Cashback", color: "#ef4444", text: "#ffffff", value: 20, type: "CASHBACK" },
];

export default function RewardsPage() {
  const { user, refreshWallet } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<typeof SEGMENTS[0] | null>(null);
  const [canSpin, setCanSpin] = useState(true);

  const numSegments = SEGMENTS.length;
  const segmentAngle = 360 / numSegments;

  const handleSpin = async () => {
    if (spinning || !canSpin) return;

    setSpinning(true);
    setWonPrize(null);

    // Pick random winner segment
    const winningIndex = Math.floor(Math.random() * numSegments);
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    // Calculate final rotation to align winning segment with top indicator (270 deg)
    const targetAngle = 360 * extraSpins + (360 - winningIndex * segmentAngle - segmentAngle / 2);

    setRotation(targetAngle);

    setTimeout(async () => {
      setSpinning(false);
      setWonPrize(SEGMENTS[winningIndex]);
      setCanSpin(false);

      // Credit wallet if cash prize
      if (SEGMENTS[winningIndex].type === "CASH") {
        try {
          await api("/api/wallet/demo-credit", {
            method: "POST",
            body: JSON.stringify({ amount: SEGMENTS[winningIndex].value.toString() }),
          });
          void refreshWallet();
        } catch {}
      }
    }, 5000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-4 py-1 text-xs font-bold text-amber-300">
          <Gift className="h-4 w-4" /> DAILY LOYALTY REWARDS
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Daily Lucky Wheel of Fortune
        </h1>
        <p className="text-sm text-neutral-300 leading-relaxed">
          Spin the wheel once every 24 hours for guaranteed free demo credits, bonus spins, and VIP multiplier boosts.
        </p>
      </div>

      {/* Main Wheel Cabinet */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center p-4">
          {/* Wheel Pointer Indicator at Top */}
          <div className="absolute top-0 z-30 -translate-y-2">
            <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-amber-400 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" />
          </div>

          {/* Glowing Wheel Outer Rim */}
          <div className="relative h-80 w-80 sm:h-96 sm:w-96 rounded-full border-8 border-amber-500/80 bg-neutral-950 shadow-[0_0_50px_rgba(251,191,36,0.5)] overflow-hidden">
            <div
              className="h-full w-full rounded-full transition-all ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? "5s" : "0s",
                transitionTimingFunction: "cubic-bezier(0.15, 0.9, 0.2, 1.0)",
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {SEGMENTS.map((seg, idx) => {
                  const startAngle = (idx * segmentAngle * Math.PI) / 180;
                  const endAngle = (((idx + 1) * segmentAngle) * Math.PI) / 180;

                  const x1 = 50 + 50 * Math.cos(startAngle);
                  const y1 = 50 + 50 * Math.sin(startAngle);
                  const x2 = 50 + 50 * Math.cos(endAngle);
                  const y2 = 50 + 50 * Math.sin(endAngle);

                  const midAngle = startAngle + (endAngle - startAngle) / 2;
                  const textX = 50 + 32 * Math.cos(midAngle);
                  const textY = 50 + 32 * Math.sin(midAngle);
                  const textRot = (midAngle * 180) / Math.PI;

                  return (
                    <g key={idx}>
                      <path
                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                        fill={seg.color}
                        stroke="#0a0e17"
                        strokeWidth="0.8"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill={seg.text}
                        fontSize="3.8"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textRot}, ${textX}, ${textY})`}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Wheel Center Hub Button */}
            <button
              onClick={handleSpin}
              disabled={spinning || !canSpin}
              className={`absolute inset-0 m-auto h-20 w-20 rounded-full border-4 border-amber-300 font-black text-xs uppercase tracking-wider shadow-2xl transition-all flex flex-col items-center justify-center ${
                spinning
                  ? "bg-neutral-800 text-muted-foreground scale-95"
                  : canSpin
                  ? "bg-gradient-to-tr from-amber-500 to-yellow-300 text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.8)]"
                  : "bg-neutral-800 text-muted-foreground cursor-not-allowed"
              }`}
            >
              {spinning ? "SPINNING" : canSpin ? "SPIN NOW" : "CLAIMED"}
            </button>
          </div>
        </div>

        {/* Winner Announcement Banner */}
        {wonPrize && (
          <div className="mt-6 text-center space-y-2 animate-in zoom-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-6 py-2 text-sm sm:text-base font-black text-emerald-300 shadow-xl">
              <Sparkles className="h-5 w-5 text-gold" /> CONGRATULATIONS! YOU WON: {wonPrize.label}
            </span>
          </div>
        )}

        {/* Cooldown Info */}
        {!canSpin && !spinning && (
          <p className="mt-4 text-xs font-mono text-muted-foreground flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-amber-400" /> Next Free Spin in 23h 59m 42s
          </p>
        )}
      </div>

      {/* Additional Daily Quests & Streaks */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Daily Login Streak", desc: "Day 5 of 7 Completed", reward: "+$50 Bonus", icon: Trophy },
          { title: "Wager $100 on Slots", desc: "Progress: $100 / $100", reward: "+15 Free Spins", icon: Sparkles },
          { title: "Play 3 Live Dealer Hands", desc: "Progress: 3 / 3", reward: "+$25 Demo Chips", icon: Crown },
        ].map((q, idx) => (
          <Card key={idx} className="p-5 border-white/10 bg-[#0A0E17] text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">{q.title}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-xs text-muted-foreground">{q.desc}</p>
            <span className="inline-block font-mono text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
              {q.reward}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
