"use client";

import React, { useEffect, useRef, useState } from "react";
import { MegawaysSpinResult, SymbolId } from "@/lib/slots/slot-engine";
import { SlotTheme } from "@/lib/slots/slot-themes";
import { SlotSymbolIcon } from "./slot-symbols";

interface SlotMegawaysGridProps {
  result: MegawaysSpinResult | null;
  theme: SlotTheme;
  isSpinning: boolean;
  spinningColumns?: boolean[];
  flashingColumns?: boolean[];
  isTurbo?: boolean;
}

function megaStrip(theme: SlotTheme, count: number): SymbolId[] {
  const pool = Object.keys(theme.symbols) as SymbolId[];
  const half = Array.from({ length: count }, () => pool[Math.floor(Math.random() * pool.length)]);
  return [...half, ...half];
}

export function SlotMegawaysGrid({
  result,
  theme,
  isSpinning,
  spinningColumns = [false, false, false, false, false, false],
  flashingColumns = [false, false, false, false, false, false],
  isTurbo = false,
}: SlotMegawaysGridProps) {
  const reelHeights = result?.reelHeights || [4, 5, 4, 6, 5, 4];
  const totalWays = result?.totalWays || 9600;
  const grid = result?.grid;
  const [revealed, setRevealed] = useState(false);
  const [waysAnimated, setWaysAnimated] = useState(totalWays);
  const stripsRef = useRef<SymbolId[][]>([0, 1, 2, 3, 4, 5].map((i) => megaStrip(theme, reelHeights[i] || 4)));
  const anySpinning = spinningColumns.some(Boolean);

  useEffect(() => {
    if (anySpinning) {
      const heights = result?.reelHeights || [4, 5, 4, 6, 5, 4];
      stripsRef.current = [0, 1, 2, 3, 4, 5].map((i) => megaStrip(theme, heights[i] || 4));
    }
  }, [anySpinning, theme, result]);

  const winningPositions = result?.wayHits.flatMap((w) => w.positions) || [];

  const isWinning = (col: number, row: number) => {
    return winningPositions.some((p) => p.col === col && p.row === row);
  };

  // Animate reveal of symbols after spin stops
  useEffect(() => {
    if (!isSpinning && result) {
      const t1 = setTimeout(() => setRevealed(false), 0);
      const timer = setTimeout(() => setRevealed(true), 80);
      return () => {
        clearTimeout(t1);
        clearTimeout(timer);
      };
    }
    if (isSpinning) {
      const t = setTimeout(() => setRevealed(false), 0);
      return () => clearTimeout(t);
    }
  }, [isSpinning, result]);

  // Animate the ways counter
  useEffect(() => {
    if (!result) return;
    const target = result.totalWays;
    const duration = 600;
    const startTime = performance.now();
    const startVal = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setWaysAnimated(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [result]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none">
      {/* Dynamic Ways to Win Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-black/60 rounded-xl border border-yellow-500/30 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Engine:</span>
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-wider">
            MEGAWAYS™ DYNAMIC REELS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Ways:</span>
          <span
            key={`ways-${totalWays}`}
            className="rounded-md bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 border border-yellow-400/40 px-3 py-0.5 font-mono text-sm font-black text-yellow-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-multiplier-pop"
          >
            {waysAnimated.toLocaleString()} WAYS
          </span>
        </div>
      </div>

      {/* Dynamic 6-Reel Grid Area */}
      <div className="relative flex-1 grid grid-cols-6 gap-1 sm:gap-2 h-full w-full p-2 bg-neutral-950/90 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {[0, 1, 2, 3, 4, 5].map((colIdx) => {
          const height = reelHeights[colIdx];
          const colCells = grid?.[colIdx] || [];

          return (
            <div
              key={`megaways-col-${colIdx}`}
              className={`flex flex-col justify-between gap-1 sm:gap-1.5 h-full overflow-hidden rounded-xl bg-black/30 p-1 border border-white/5 transition-all duration-300 ${
                flashingColumns[colIdx] ? "animate-column-flash" : ""
              } ${spinningColumns[colIdx] ? "" : isSpinning ? "animate-reel-spring" : ""}`}
            >
              {spinningColumns[colIdx] ? (
                <div className={`flex h-[200%] flex-col ${isTurbo ? "animate-reel-strip-fast" : "animate-reel-strip"}`}>
                  {(stripsRef.current[colIdx] || []).map((id, idx) => (
                    <div key={`mspin-${colIdx}-${idx}`} className="flex flex-1 items-center justify-center">
                      <SlotSymbolIcon id={id} theme={theme} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
              Array.from({ length: height }).map((_, rowIdx) => {
                const cell = colCells[rowIdx];
                const win = !spinningColumns[colIdx] && isWinning(colIdx, rowIdx);
                const showScatterBeam =
                  cell?.id === "SCATTER" && flashingColumns[colIdx] && !spinningColumns[colIdx];

                if (!cell) {
                  return (
                    <div
                      key={`empty-${colIdx}-${rowIdx}`}
                      className="flex-1 rounded-lg bg-white/5 border border-white/5"
                    />
                  );
                }

                return (
                  <div
                    key={cell.key || `cell-${colIdx}-${rowIdx}`}
                    className={`relative flex-1 flex items-center justify-center rounded-lg p-0.5 transition-all ${
                      win
                        ? "bg-yellow-400/20 border border-yellow-400 scale-[1.03] z-10 animate-win-glow"
                        : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]"
                    } ${
                      revealed ? `animate-slot-drop cascade-delay-${colIdx}` : ""
                    }`}
                  >
                    {win && (
                      <div className="absolute inset-0 rounded-lg animate-win-shimmer pointer-events-none z-[1]" />
                    )}
                    {showScatterBeam && (
                      <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none z-20">
                        <div className="absolute inset-x-1 top-0 h-full bg-gradient-to-b from-white via-cyan-300/70 to-transparent animate-gem-beam" />
                      </div>
                    )}
                    <SlotSymbolIcon
                      id={cell.id}
                      theme={theme}
                      isWinning={win}
                      size="sm"
                    />
                  </div>
                );
              })
              )}
            </div>
          );
        })}


      </div>
    </div>
  );
}
