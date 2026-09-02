"use client";

import React, { useEffect } from "react";
import { formatMoney } from "@/lib/format";
import { slotAudio } from "@/lib/slots/slot-audio";
import { SlotParticles } from "./slot-particles";
import { Button } from "@/components/ui/button";

interface SlotBonusModalProps {
  type: "TRIGGER" | "RETRIGGER" | "COMPLETED";
  spinsAwarded?: number;
  totalSpinsWon?: number;
  totalBonusWin?: number;
  currency: string;
  onContinue: () => void;
}

export function SlotBonusModal({
  type,
  spinsAwarded = 10,
  totalBonusWin = 0,
  currency,
  onContinue,
}: SlotBonusModalProps) {
  useEffect(() => {
    if (type === "TRIGGER" || type === "RETRIGGER") {
      slotAudio.playBonusTrigger();
    } else {
      slotAudio.playMegaWinFanfare();
    }
  }, [type]);

  if (type === "RETRIGGER") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="p-8 rounded-2xl bg-gradient-to-b from-blue-950 to-neutral-950 border-2 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.8)] text-center max-w-md w-full mx-4 animate-bonus-entrance">
          <div className="text-4xl mb-2">⚡</div>
          <h3 className="text-3xl font-black text-cyan-300 uppercase tracking-wider">
            RETRIGGER!
          </h3>
          <p className="mt-2 text-xl font-bold text-white">
            +{spinsAwarded} EXTRA FREE SPINS
          </p>
          <Button
            onClick={onContinue}
            className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-bold hover:brightness-110"
          >
            CONTINUE
          </Button>
        </div>
      </div>
    );
  }

  if (type === "TRIGGER") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn">
        <SlotParticles active={true} tier="BONUS" />

        <div className="relative flex flex-col items-center p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-amber-950/90 via-neutral-950 to-black border-2 border-yellow-400 shadow-[0_0_60px_rgba(251,191,36,0.8)] text-center max-w-lg w-full mx-4 animate-celebration-zoom">
          <div className="text-5xl sm:text-6xl mb-3 animate-bounce">🏛️⚡</div>

          <h2 className="text-3xl sm:text-5xl font-black text-yellow-300 uppercase tracking-widest drop-shadow-[0_0_20px_rgba(250,204,21,0.9)]">
            FREE SPINS
          </h2>

          <p className="mt-1 text-sm font-semibold text-amber-200/80 tracking-wider">
            FEATURE ROUND UNLOCKED
          </p>

          <div className="my-6 py-4 px-8 rounded-2xl bg-amber-500/10 border border-yellow-400/40">
            <span className="text-4xl sm:text-6xl font-black text-yellow-400">
              {spinsAwarded}
            </span>
            <p className="text-xs uppercase font-bold text-yellow-200 tracking-widest mt-1">
              FREE SPINS AWARDED
            </p>
          </div>

          <div className="space-y-1 text-xs text-white/80 mb-6 bg-black/40 p-3 rounded-xl border border-white/5 w-full">
            <p className="font-semibold text-cyan-300">
              ✨ Progressive Multipliers Active (x2, x3, x5, x10, x25)
            </p>
            <p>3+ Scatters during bonus awards +5 Extra Spins</p>
          </div>

          <Button
            size="lg"
            onClick={onContinue}
            className="w-full h-14 text-lg font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black shadow-[0_0_30px_rgba(251,191,36,0.7)] hover:brightness-110"
          >
            START FREE SPINS
          </Button>
        </div>
      </div>
    );
  }

  // Bonus Completed Summary Card
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn">
      <SlotParticles active={true} tier="MEGA_WIN" />

      <div className="relative flex flex-col items-center p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.8)] text-center max-w-lg w-full mx-4 animate-celebration-zoom">
        <div className="text-4xl mb-2">🎉🏆</div>

        <h2 className="text-3xl sm:text-5xl font-black text-emerald-400 uppercase tracking-widest drop-shadow-[0_0_20px_rgba(16,185,129,0.9)]">
          BONUS COMPLETE!
        </h2>

        <p className="mt-1 text-xs uppercase font-semibold text-white/70 tracking-widest">
          TOTAL FEATURE WIN
        </p>

        <div className="my-6 py-4 px-8 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 w-full">
          <span className="text-3xl sm:text-5xl font-black text-emerald-300 tabular-nums">
            {formatMoney(totalBonusWin, currency)}
          </span>
        </div>

        <Button
          size="lg"
          onClick={onContinue}
          className="w-full h-13 text-base font-black tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-teal-500 text-black hover:brightness-110"
        >
          COLLECT & RETURN TO GAME
        </Button>
      </div>
    </div>
  );
}
