"use client";

import React, { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/format";
import { slotAudio } from "@/lib/slots/slot-audio";
import { SlotParticles } from "./slot-particles";

interface SlotWinCelebrationProps {
  winAmount: number;
  betAmount: number;
  currency: string;
  onComplete: () => void;
}

export function SlotWinCelebration({
  winAmount,
  betAmount,
  currency,
  onComplete,
}: SlotWinCelebrationProps) {
  const [displayAmount, setDisplayAmount] = useState(0);
  const [phase, setPhase] = useState<"ENTERING" | "COUNTING" | "FINAL">("ENTERING");
  const [flashTick, setFlashTick] = useState(false);
  const prevAmountRef = useRef(0);

  const ratio = winAmount / (betAmount || 1);

  let tier: "BIG_WIN" | "MEGA_WIN" | "ULTRA_WIN" | "EPIC_WIN" = "BIG_WIN";
  let title = "BIG WIN";
  let titleColor = "from-amber-300 via-yellow-100 to-amber-400";
  let badgeBorder = "border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.8)]";
  let glowColor = "rgba(251,191,36,0.4)";

  if (ratio >= 75) {
    tier = "EPIC_WIN";
    title = "EPIC JACKPOT";
    titleColor = "from-purple-300 via-pink-100 to-amber-300";
    badgeBorder = "border-pink-500 shadow-[0_0_80px_rgba(236,72,153,0.9)]";
    glowColor = "rgba(236,72,153,0.5)";
  } else if (ratio >= 30) {
    tier = "ULTRA_WIN";
    title = "ULTRA WIN";
    titleColor = "from-cyan-300 via-sky-100 to-blue-400";
    badgeBorder = "border-cyan-400 shadow-[0_0_60px_rgba(6,182,212,0.8)]";
    glowColor = "rgba(6,182,212,0.4)";
  } else if (ratio >= 15) {
    tier = "MEGA_WIN";
    title = "MEGA WIN";
    titleColor = "from-emerald-300 via-yellow-100 to-emerald-400";
    badgeBorder = "border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.8)]";
    glowColor = "rgba(16,185,129,0.4)";
  }

  // Entrance phase
  useEffect(() => {
    const entranceTimer = setTimeout(() => setPhase("COUNTING"), 500);
    return () => clearTimeout(entranceTimer);
  }, []);

  // Play fanfare on mount
  useEffect(() => {
    if (tier === "EPIC_WIN" || tier === "ULTRA_WIN") {
      slotAudio.playEpicJackpotFanfare();
    } else if (tier === "MEGA_WIN") {
      slotAudio.playMegaWinFanfare();
    } else {
      slotAudio.playBigWinFanfare();
    }

    // Number counting ticker animation
    const duration = tier === "EPIC_WIN" ? 3200 : tier === "MEGA_WIN" ? 2400 : 1800;
    const startTime = performance.now();

    const updateTicker = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Easing out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = winAmount * easeOut;

      // Flash effect on major milestones
      if (Math.floor(current / (winAmount * 0.1)) > Math.floor(prevAmountRef.current / (winAmount * 0.1))) {
        setFlashTick(true);
        setTimeout(() => setFlashTick(false), 120);
      }
      prevAmountRef.current = current;
      setDisplayAmount(current);

      if (Math.random() < 0.4) {
        slotAudio.playCoinCountTick();
      }

      if (progress < 1) {
        requestAnimationFrame(updateTicker);
      } else {
        setDisplayAmount(winAmount);
        setPhase("FINAL");
        // Auto complete after 1.8s
        setTimeout(() => {
          onComplete();
        }, 1800);
      }
    };

    const animId = requestAnimationFrame(updateTicker);
    return () => cancelAnimationFrame(animId);
  }, [winAmount, betAmount, tier, onComplete]);

  // Click to skip/fast-forward
  const handleFastForward = () => {
    setDisplayAmount(winAmount);
    onComplete();
  };

  return (
    <div
      onClick={handleFastForward}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer select-none animate-fadeIn animate-tumble-shake"
    >
      <SlotParticles active={true} tier={tier} />
      {(tier === "MEGA_WIN" || tier === "ULTRA_WIN" || tier === "EPIC_WIN") && (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-white animate-celebration-flash" />
      )}

      {/* Animated Sunburst Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div
          className="w-[800px] h-[800px] rounded-full animate-sunburst"
          style={{
            background: `conic-gradient(from 0deg, ${glowColor}, transparent 15%, ${glowColor} 25%, transparent 40%, ${glowColor} 50%, transparent 65%, ${glowColor} 75%, transparent 90%)`,
          }}
        />
      </div>

      {/* Dynamic Multi-layered Shockwave Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="absolute rounded-full border border-white/20 animate-shatter-ring"
          style={{ width: "300px", height: "300px" }}
        />
        <div
          className="absolute rounded-full border-2 border-amber-400/40 animate-ping opacity-25"
          style={{ width: "480px", height: "480px", animationDuration: "2.8s" }}
        />
        <div
          className="absolute rounded-full border border-yellow-300/30 animate-pulse"
          style={{ width: "650px", height: "650px" }}
        />
      </div>

      {/* Main Celebration Banner Card */}
      <div
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-neutral-900/95 via-neutral-950/95 to-black/95 border-2 ${badgeBorder} max-w-lg w-full mx-4 text-center animate-celebration-zoom`}
      >
        <h2
          className={`text-5xl sm:text-7xl font-black tracking-wider uppercase bg-gradient-to-r ${titleColor} bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(250,204,21,0.9)] animate-multiplier-pop`}
          style={{ animationDelay: "0.15s" }}
        >
          {title}
        </h2>

        <p className="mt-2 text-xs uppercase tracking-widest text-white/60 font-semibold">
          {ratio.toFixed(1)}x Bet Multiplier
        </p>

        {/* Big Animated Win Amount */}
        <div className="my-6 py-3 px-6 rounded-2xl bg-black/60 border border-white/10 shadow-inner w-full relative overflow-hidden">
          {/* Background shimmer on final */}
          {phase === "FINAL" && (
            <div className="absolute inset-0 animate-win-shimmer pointer-events-none rounded-2xl" />
          )}
          <span
            className={`relative z-10 text-4xl sm:text-6xl font-black text-amber-400 tracking-tight tabular-nums drop-shadow-[0_0_18px_rgba(251,191,36,0.95)] transition-all duration-100 ${
              flashTick ? "animate-counter-flash scale-105" : ""
            }`}
          >
            {formatMoney(displayAmount, currency)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground animate-pulse">
          Click anywhere to collect & continue
        </p>
      </div>
    </div>
  );
}
