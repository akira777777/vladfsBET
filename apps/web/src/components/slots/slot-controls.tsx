"use client";

import React, { useState } from "react";
import { formatMoney } from "@/lib/format";
import { slotAudio } from "@/lib/slots/slot-audio";
import { Button } from "@/components/ui/button";

export type AutoplayConfig = {
  count: number;
  stopOnBonus: boolean;
  stopOnSingleWin?: number;
  stopOnLoss?: number;
};

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
  onSlamStop?: () => void;
  onBetChange: (newBet: number) => void;
  onToggleTurbo: () => void;
  onStartAutoplay: (config: number | AutoplayConfig) => void;
  onStopAutoplay: () => void;
  onToggleAnteBet: () => void;
  onBuyBonus: () => void;
  onToggleMute: () => void;
  onOpenPaytable: () => void;
  onOpenFairness?: () => void;
}

export const BET_PRESETS = [0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 250.0, 500.0];

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
  currentMultiplier: _currentMultiplier,
  onSpin,
  onSlamStop,
  onBetChange,
  onToggleTurbo,
  onStartAutoplay,
  onStopAutoplay,
  onToggleAnteBet,
  onBuyBonus,
  onToggleMute,
  onOpenPaytable,
  onOpenFairness,
}: SlotControlsProps) {
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);
  const [autoStopOnBonus, setAutoStopOnBonus] = useState(true);
  const [autoWinLimit, setAutoWinLimit] = useState<number | undefined>(50);

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
                disabled={isSpinning || isAutoPlaying}
                className={`group relative overflow-hidden flex items-center gap-2.5 px-3 py-2 rounded-2xl border-2 transition-all duration-300 ${
                  anteBetActive
                    ? "bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-950 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)] scale-102"
                    : "bg-black/60 border-white/15 hover:border-emerald-500/50 hover:bg-emerald-950/20"
                } ${isSpinning || isAutoPlaying ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
                    anteBetActive
                      ? "bg-emerald-400 text-black shadow-md"
                      : "bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700"
                  }`}
                >
                  ⚡
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      ANTE BET
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      25x
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-semibold">
                    DOUBLE CHANCE TO WIN FEATURE
                  </span>
                </div>
              </button>

              {/* Buy Free Spins Feature */}
              <button
                type="button"
                onClick={() => {
                  slotAudio.playButtonClick();
                  onBuyBonus();
                }}
                disabled={isSpinning || isAutoPlaying}
                className={`group relative overflow-hidden flex items-center gap-2.5 px-3 py-2 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-950 via-yellow-900/60 to-amber-950 shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-102 transition-all duration-300 ${
                  isSpinning || isAutoPlaying ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-black flex items-center justify-center font-black text-xs shadow-md">
                  ★
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
                      BUY FREE SPINS
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-yellow-400/20 text-yellow-300 font-bold">
                      100x
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-200/90 font-black tabular-nums">
                    {formatMoney(betAmount * 100, currency)}
                  </span>
                </div>
              </button>
            </>
          )}

          {inFreeSpins && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-950 border-2 border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.5)] animate-pulse">
              <span className="text-xl">🌀</span>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-purple-300">
                  FREE SPINS FEATURE
                </p>
                <p className="text-sm font-black text-white">
                  {freeSpinsRemaining} SPINS REMAINING
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Turbo, Provably Fair, Sound & Paytable Quick Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Turbo Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleTurbo();
              slotAudio.playButtonClick();
            }}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              isTurbo
                ? "bg-amber-500/30 border-amber-400 text-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                : "bg-black/50 border-white/10 text-muted-foreground hover:text-white"
            }`}
            title="Turbo Spin Mode (Hot-key: T)"
          >
            <span>⚡</span>
            <span className="hidden sm:inline font-black text-[11px]">TURBO</span>
          </button>

          {/* Provably Fair */}
          {onOpenFairness && (
            <button
              type="button"
              onClick={() => {
                slotAudio.playButtonClick();
                onOpenFairness();
              }}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl border bg-black/50 border-gold/40 text-gold hover:bg-gold/10 hover:border-gold transition-colors flex items-center gap-1"
              title="Cryptographic Provably Fair RNG details"
            >
              <span className="text-xs">🛡️</span>
              <span className="hidden md:inline font-bold text-[10px]">FAIRNESS</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleMute();
              slotAudio.playButtonClick();
            }}
            className="p-2 sm:p-2.5 rounded-xl border bg-black/50 border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-colors"
            title={isMuted ? "Unmute Sound (Hot-key: M)" : "Mute Sound (Hot-key: M)"}
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
            title="Paytable & Rules (Hot-key: P)"
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

        {/* Right Side: Autoplay & PRAGMATIC ICONIC CIRCULAR SPIN / SLAM-STOP BUTTON */}
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

              {/* Responsible Gaming Autoplay Modal */}
              {showAutoModal && (
                <div className="absolute bottom-16 right-0 z-40 p-4 rounded-2xl bg-neutral-950 border-2 border-yellow-500/60 shadow-2xl flex flex-col gap-2.5 w-56 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                      Autoplay Settings
                    </span>
                    <button
                      onClick={() => setShowAutoModal(false)}
                      className="text-muted-foreground hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold">SPIN COUNT</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[10, 25, 50, 100].map((count) => (
                        <button
                          key={`auto-${count}`}
                          onClick={() => {
                            slotAudio.playButtonClick();
                            onStartAutoplay({
                              count,
                              stopOnBonus: autoStopOnBonus,
                              stopOnSingleWin: autoWinLimit ? betAmount * autoWinLimit : undefined,
                            });
                            setShowAutoModal(false);
                          }}
                          className="px-2 py-1.5 rounded-lg text-xs font-black text-center bg-black/60 text-white hover:bg-yellow-400 hover:text-black transition-colors border border-white/5"
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Responsible Gaming Limits */}
                  <div className="space-y-2 border-t border-white/10 pt-2 text-[11px]">
                    <label className="flex items-center gap-2 cursor-pointer text-white/90">
                      <input
                        type="checkbox"
                        checked={autoStopOnBonus}
                        onChange={(e) => setAutoStopOnBonus(e.target.checked)}
                        className="rounded accent-gold h-3.5 w-3.5"
                      />
                      <span>Stop on Bonus Feature</span>
                    </label>

                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">STOP IF WIN EXCEEDS:</span>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        {[20, 50, 100].map((mult) => (
                          <button
                            key={`win-lim-${mult}`}
                            type="button"
                            onClick={() => setAutoWinLimit(autoWinLimit === mult ? undefined : mult)}
                            className={`py-1 rounded border text-center font-bold ${
                              autoWinLimit === mult
                                ? "bg-amber-400/20 border-gold text-gold"
                                : "bg-black/40 border-white/10 text-muted-foreground"
                            }`}
                          >
                            {mult}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRAGMATIC PLAY ICONIC ROUND GOLD SPIN / SLAM-STOP BUTTON */}
          <button
            type="button"
            onClick={() => {
              if (isSpinning) {
                if (onSlamStop) onSlamStop();
              } else if (!isAutoPlaying) {
                onSpin();
              }
            }}
            disabled={isAutoPlaying}
            className={`relative group w-18 h-18 sm:w-20 sm:h-20 rounded-full font-black tracking-wider uppercase transition-all duration-200 flex flex-col items-center justify-center select-none ${
              isSpinning
                ? "bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-700 text-white border-4 border-amber-200 shadow-[0_0_35px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
                : "bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 text-black border-4 border-yellow-100 shadow-[0_0_35px_rgba(251,191,36,0.8)] hover:shadow-[0_0_55px_rgba(251,191,36,1)] hover:scale-108 active:scale-95 cursor-pointer"
            }`}
          >
            {/* Ambient Spinning Halo when Idle */}
            {!isSpinning && (
              <>
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-40 blur-md group-hover:opacity-80 animate-spin-ripple pointer-events-none" />
                <div className="pointer-events-none absolute inset-[-7px] rounded-full border-2 border-dashed border-yellow-100/40 animate-spin-ring" />
              </>
            )}

            {/* Inner Metallic Bevel Ring */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {isSpinning ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xl">⚡</span>
                  <span className="text-[10px] font-black text-white leading-none mt-0.5 tracking-widest">
                    STOP
                  </span>
                </div>
              ) : (
                <>
                  {/* Pragmatic Curved Arrows Icon */}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-8 h-8 text-black fill-current drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)] transition-transform group-hover:rotate-180 duration-500"
                  >
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                  </svg>
                  <span className="text-[10px] font-black text-black leading-none mt-0.5">SPIN</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Helper Ribbon */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground px-2 pt-0.5 font-mono">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white/90 text-[10px]">SPACE</kbd>{" "}
            {isSpinning ? "Quick Stop" : "Spin"}
          </span>
          <span className="hidden sm:inline">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white/90 text-[10px]">T</kbd> Turbo
          </span>
          <span className="hidden sm:inline">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white/90 text-[10px]">M</kbd> Mute
          </span>
          <span className="hidden sm:inline">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white/90 text-[10px]">P</kbd> Paytable
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Provably Fair RNG Active</span>
        </div>
      </div>
    </div>
  );
}
