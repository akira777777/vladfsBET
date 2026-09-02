"use client";

import React, { useState } from "react";
import { formatMoney } from "@/lib/format";
import { slotAudio } from "@/lib/slots/slot-audio";
import { Button } from "@/components/ui/button";

interface SlotControlsProps {
  betAmount: number;
  minBet?: number;
  maxBet?: number;
  currency: string;
  isSpinning: boolean;
  isTurbo: boolean;
  isAutoPlaying: boolean;
  autoPlayCount: number;
  anteBetActive: boolean;
  isMuted: boolean;
  inFreeSpins: boolean;
  freeSpinsRemaining: number;
  currentMultiplier: number;
  onSpin: () => void;
  onBetChange: (newBet: number) => void;
  onToggleTurbo: () => void;
  onStartAutoplay: (count: number) => void;
  onStopAutoplay: () => void;
  onToggleAnteBet: () => void;
  onBuyBonus: () => void;
  onToggleMute: () => void;
  onOpenPaytable: () => void;
}

const BET_PRESETS = [0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 250.0, 500.0];

export function SlotControls({
  betAmount,
  minBet = 0.2,
  maxBet = 500.0,
  currency,
  isSpinning,
  isTurbo,
  isAutoPlaying,
  autoPlayCount,
  anteBetActive,
  isMuted,
  inFreeSpins,
  freeSpinsRemaining,
  currentMultiplier,
  onSpin,
  onBetChange,
  onToggleTurbo,
  onStartAutoplay,
  onStopAutoplay,
  onToggleAnteBet,
  onBuyBonus,
  onToggleMute,
  onOpenPaytable,
}: SlotControlsProps) {
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);

  const effectiveBet = anteBetActive ? betAmount * 1.25 : betAmount;

  const handleStepDown = () => {
    slotAudio.playBetChange();
    const idx = BET_PRESETS.findIndex((b) => b >= betAmount);
    if (idx > 0) {
      onBetChange(BET_PRESETS[idx - 1]);
    } else {
      const next = Math.max(minBet, Number((betAmount - 1).toFixed(2)));
      onBetChange(next);
    }
  };

  const handleStepUp = () => {
    slotAudio.playBetChange();
    const idx = BET_PRESETS.findIndex((b) => b > betAmount);
    if (idx !== -1) {
      onBetChange(BET_PRESETS[idx]);
    } else {
      const next = Math.min(maxBet, Number((betAmount + 10).toFixed(2)));
      onBetChange(next);
    }
  };

  return (
    <div className="relative w-full space-y-3 select-none">
      {/* Upper Bar: Pragmatic Feature Buys, Multipliers & Ante Bet */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Left Side: Ante Bet & Feature Buy Banner Pills */}
        <div className="flex items-center gap-2">
          {!inFreeSpins && (
            <>
              {/* Ante Bet Pragmatic Card */}
              <button
                type="button"
                onClick={() => {
                  slotAudio.playButtonClick();
                  onToggleAnteBet();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
                  anteBetActive
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 border-yellow-200 text-black shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-105"
                    : "bg-black/60 border-yellow-500/40 text-yellow-400 hover:border-yellow-400 hover:bg-black/80"
                }`}
              >
                <span className="text-base animate-bounce">⚡</span>
                <div className="text-left">
                  <div className="leading-none text-[9px] font-bold text-black/80 dark:text-yellow-200">DOUBLE CHANCE</div>
                  <div className="leading-tight text-[11px] font-black">ANTE BET {anteBetActive ? "ON" : "OFF"}</div>
                </div>
              </button>

              {/* Pragmatic Bonus Buy Button */}
              <button
                type="button"
                onClick={() => {
                  slotAudio.playButtonClick();
                  onBuyBonus();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:brightness-110 hover:scale-105 active:scale-95 transition-all"
              >
                <span className="text-base">👑</span>
                <span>BUY FREE SPINS ({formatMoney(betAmount * 100, currency)})</span>
              </button>
            </>
          )}

          {inFreeSpins && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-900/90 to-amber-900/90 border-2 border-yellow-400 px-5 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse">
              <span className="text-xs font-black tracking-widest text-yellow-300 uppercase">
                FREE SPINS LEFT: {freeSpinsRemaining}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 text-black text-xs font-black">
                {currentMultiplier}X MULTIPLIER
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Turbo, Sound, Paytable */}
        <div className="flex items-center gap-1.5">
          {/* Turbo Toggle */}
          <button
            type="button"
            onClick={() => {
              slotAudio.playButtonClick();
              onToggleTurbo();
            }}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              isTurbo
                ? "bg-amber-500/30 border-amber-400 text-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                : "bg-black/50 border-white/10 text-muted-foreground hover:text-white"
            }`}
            title="Turbo Spin Mode"
          >
            <span>⚡</span>
            <span className="hidden sm:inline font-black text-[11px]">TURBO</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleMute();
              slotAudio.playButtonClick();
            }}
            className="p-2 sm:p-2.5 rounded-xl border bg-black/50 border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-colors"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          {/* Paytable info */}
          <button
            type="button"
            onClick={() => {
              slotAudio.playButtonClick();
              onOpenPaytable();
            }}
            className="p-2 sm:p-2.5 rounded-xl border bg-black/50 border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-colors"
            title="Paytable & Rules"
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* Main Bottom Control Dashboard (Pragmatic Gilded Style) */}
      <div className="relative rounded-3xl bg-gradient-to-b from-neutral-900 via-black to-neutral-950 border-2 border-yellow-500/40 p-3 sm:p-4 shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-xl flex items-center justify-between gap-3">
        {/* Left: Total Bet & Adjuster */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400/80">
              TOTAL BET {anteBetActive ? "(+25%)" : ""}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStepDown}
                disabled={isSpinning || betAmount <= minBet || inFreeSpins}
                className="h-10 w-10 p-0 rounded-full bg-neutral-900 border-2 border-yellow-500/40 text-amber-300 font-black text-xl hover:bg-yellow-500 hover:text-black hover:border-yellow-300 transition-all shadow-md"
              >
                -
              </Button>

              <button
                type="button"
                onClick={() => !inFreeSpins && setShowBetModal(!showBetModal)}
                disabled={inFreeSpins}
                className="h-10 px-4 rounded-2xl bg-black/80 border-2 border-yellow-500/40 text-amber-300 font-black text-base tabular-nums flex items-center justify-center min-w-[110px] shadow-inner hover:border-yellow-400 transition-colors"
              >
                {formatMoney(effectiveBet, currency)}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleStepUp}
                disabled={isSpinning || betAmount >= maxBet || inFreeSpins}
                className="h-10 w-10 p-0 rounded-full bg-neutral-900 border-2 border-yellow-500/40 text-amber-300 font-black text-xl hover:bg-yellow-500 hover:text-black hover:border-yellow-300 transition-all shadow-md"
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* Center: Bet Presets Dropdown */}
        {showBetModal && (
          <div className="absolute bottom-24 left-4 z-40 p-3 rounded-2xl bg-neutral-950 border-2 border-yellow-500/50 shadow-2xl grid grid-cols-4 gap-1.5 animate-fadeIn">
            {BET_PRESETS.map((preset) => (
              <button
                key={`preset-${preset}`}
                onClick={() => {
                  slotAudio.playBetChange();
                  onBetChange(preset);
                  setShowBetModal(false);
                }}
                className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all ${
                  betAmount === preset
                    ? "bg-gradient-to-r from-amber-400 to-yellow-300 text-black shadow-md"
                    : "bg-black/50 text-white/90 border border-white/5 hover:border-yellow-500/50"
                }`}
              >
                {formatMoney(preset, currency)}
              </button>
            ))}
          </div>
        )}

        {/* Right Side: Autoplay & PRAGMATIC ICONIC CIRCULAR SPIN BUTTON */}
        <div className="flex items-center gap-3">
          {/* Autoplay Toggle */}
          {!inFreeSpins && (
            <div className="relative">
              {isAutoPlaying ? (
                <Button
                  onClick={onStopAutoplay}
                  className="h-14 px-3 sm:px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center border-2 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse"
                >
                  <span className="text-[11px]">STOP</span>
                  <span className="text-[9px] text-red-200">({autoPlayCount})</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowAutoModal(!showAutoModal)}
                  disabled={isSpinning}
                  className="h-14 px-3 sm:px-4 rounded-2xl bg-neutral-900 border-2 border-white/15 text-white/80 hover:text-white hover:border-yellow-400/50 font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 shadow-md"
                >
                  <span className="text-sm">🔁</span>
                  <span className="text-[10px]">AUTO</span>
                </Button>
              )}

              {/* Autoplay Count Options */}
              {showAutoModal && (
                <div className="absolute bottom-16 right-0 z-40 p-3 rounded-2xl bg-neutral-950 border-2 border-yellow-500/50 shadow-2xl flex flex-col gap-1.5 w-36 animate-fadeIn">
                  <span className="text-[10px] font-black text-amber-400 uppercase px-1">
                    Auto Rounds
                  </span>
                  {[10, 25, 50, 100].map((count) => (
                    <button
                      key={`auto-${count}`}
                      onClick={() => {
                        slotAudio.playButtonClick();
                        onStartAutoplay(count);
                        setShowAutoModal(false);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-black text-left bg-black/60 text-white hover:bg-yellow-400 hover:text-black transition-colors"
                    >
                      {count} Spins
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRAGMATIC PLAY ICONIC ROUND GOLD SPIN BUTTON */}
          <button
            type="button"
            onClick={() => {
              if (!isSpinning && !isAutoPlaying) {
                onSpin();
              }
            }}
            disabled={isSpinning || isAutoPlaying}
            className={`relative group w-18 h-18 sm:w-20 sm:h-20 rounded-full font-black tracking-wider uppercase transition-all duration-200 flex flex-col items-center justify-center select-none ${
              isSpinning
                ? "bg-neutral-800 text-neutral-500 border-4 border-neutral-700 cursor-not-allowed"
                : "bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 text-black border-4 border-yellow-100 shadow-[0_0_35px_rgba(251,191,36,0.8)] hover:shadow-[0_0_55px_rgba(251,191,36,1)] hover:scale-108 active:scale-95 cursor-pointer"
            }`}
          >
            {/* Ambient Spinning Halo when Idle */}
            {!isSpinning && (
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-40 blur-md group-hover:opacity-80 animate-spin-ripple pointer-events-none" />
            )}

            {/* Inner Metallic Bevel Ring */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {isSpinning ? (
                <div className="w-8 h-8 rounded-full border-4 border-yellow-400/30 border-t-yellow-300 animate-spin" />
              ) : (
                <>
                  {/* Pragmatic Curved Arrows Icon */}
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-black fill-current drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)] transition-transform group-hover:rotate-180 duration-500">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                  </svg>
                  <span className="text-[10px] font-black text-black leading-none mt-0.5">SPIN</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
