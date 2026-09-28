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
  anticipatingColumns?: boolean[];
  isTurbo?: boolean;
}

function megaStrip(theme: SlotTheme): SymbolId[] {
  const pool = Object.keys(theme.symbols) as SymbolId[];
  const unique = Array.from({ length: 10 }, () => pool[Math.floor(Math.random() * pool.length)]);
  return [...unique, ...unique];
}

export const SlotMegawaysGrid = React.memo(function SlotMegawaysGrid({
  result,
  theme,
  isSpinning,
  spinningColumns = [false, false, false, false, false, false],
  flashingColumns = [false, false, false, false, false, false],
  anticipatingColumns = [false, false, false, false, false, false],
  isTurbo = false,
}: SlotMegawaysGridProps) {
  const reelHeights = result?.reelHeights || [4, 5, 4, 6, 5, 4];
  const totalWays = result?.totalWays || reelHeights.reduce((a, b) => a * b, 1);
  const idleIds: SymbolId[] = ["LOW_A", "LOW_K", "LOW_Q", "LOW_J", "LOW_10", "MED_1", "MED_2", "HIGH_1"];
  const grid =
    result?.grid ||
    reelHeights.map((height, col) =>
      Array.from({ length: height }, (_, row) => ({
        id: idleIds[(col * 3 + row) % idleIds.length],
        key: `idle-mega-${col}-${row}`,
      })),
    );
  const [revealed, setRevealed] = useState(false);
  const [waysAnimated, setWaysAnimated] = useState(totalWays);
  const stripsRef = useRef<SymbolId[][]>([0, 1, 2, 3, 4, 5].map(() => megaStrip(theme)));
  const anySpinning = spinningColumns.some(Boolean);
  const scatterTeasing = anticipatingColumns.some(Boolean);

  useEffect(() => {
    if (anySpinning) {
      stripsRef.current = [0, 1, 2, 3, 4, 5].map(() => megaStrip(theme));
    }
  }, [anySpinning, theme]);

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
      <div
        className={`relative flex-1 grid grid-cols-6 gap-1 sm:gap-2 h-full w-full p-2 bg-neutral-950/90 rounded-2xl border border-white/10 overflow-hidden shadow-2xl ${
          revealed && winningPositions.length > 0 ? "animate-grid-punch" : ""
        }`}
      >
        {/* eslint-disable-next-line react-hooks/refs -- read-only access to a pre-seeded reel strip ref */}
        {[0, 1, 2, 3, 4, 5].map((colIdx) => {
          const height = reelHeights[colIdx];
          const colCells = grid?.[colIdx] || [];
          const colHasWin = !spinningColumns[colIdx] && colCells.some((_, rowIdx) => isWinning(colIdx, rowIdx));

          return (
            <div
              key={`megaways-col-${colIdx}`}
              className={`flex flex-col justify-end gap-1 sm:gap-1.5 h-full overflow-hidden rounded-xl bg-black/30 p-1 border border-white/5 transition-all duration-300 reel-window-mask ${
                anticipatingColumns[colIdx]
                  ? "animate-scatter-anticipation animate-anticipation-heartbeat ring-1 ring-amber-400/70"
                  : ""
              } ${flashingColumns[colIdx] ? "animate-column-flash" : ""} ${
                spinningColumns[colIdx] ? "" : isSpinning ? "animate-reel-spring" : ""
              } ${
                revealed && !isTurbo && !spinningColumns[colIdx] ? "animate-reel-expand" : ""
              } ${
                scatterTeasing &&
                !anticipatingColumns[colIdx] &&
                !spinningColumns[colIdx] &&
                !colCells.some((c) => c.id === "SCATTER")
                  ? "opacity-40"
                  : ""
              }`}
              style={{
                transform: `rotateY(${(colIdx - 2.5) * -4}deg)${spinningColumns[colIdx] ? " translateZ(18px)" : ""}`,
                boxShadow: colHasWin ? `inset 0 0 18px ${theme.glowColor}` : undefined,
              }}
            >
              {spinningColumns[colIdx] ? (
                <div
                  className={`flex flex-col ${isTurbo ? "animate-reel-strip-fast" : "animate-reel-strip"}`}
                  style={{ height: `${(20 / Math.max(2, height)) * 100}%` }}
                >
                  {(stripsRef.current[colIdx] || []).map((id, idx) => (
                    <div key={`mspin-${colIdx}-${idx}`} className="flex flex-1 items-center justify-center">
                      <SlotSymbolIcon id={id} theme={theme} size="md" />
                    </div>
                  ))}
                </div>
              ) : (
              colCells.map((cell, rowIdx) => {
                const win = !spinningColumns[colIdx] && isWinning(colIdx, rowIdx);
                const showScatterBeam =
                  cell?.id === "SCATTER" && flashingColumns[colIdx] && !spinningColumns[colIdx];

                return (
                  <div
                    key={cell.key || `cell-${colIdx}-${rowIdx}`}
                    className={`relative flex items-center justify-center rounded-lg p-0.5 transition-all ${
                      win
                        ? "bg-yellow-400/20 border border-yellow-400 scale-[1.03] z-10 animate-win-glow"
                        : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]"
                    } ${
                      revealed ? `animate-slot-drop cascade-delay-${colIdx}` : ""
                    }`}
                    style={{ flex: "0 0 auto", height: `${100 / Math.max(height, 2)}%` }}
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
                      isScatterTease={scatterTeasing && cell.id === "SCATTER"}
                      size="md"
                    />
                  </div>
                );
              })
              )}
            </div>
          );
        })}


        {/* Connecting Megaways Laser Paylines */}
        {revealed && !anySpinning && result?.wayHits && result.wayHits.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
            <defs>
              <filter id="megaLaserGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {result.wayHits.map((way, wIdx) => {
              if (way.positions.length < 2) return null;
              // Sort positions by column to draw left-to-right line
              const sorted = [...way.positions].sort((a, b) => a.col - b.col);
              const pts = sorted.map((p) => {
                const colH = reelHeights[p.col] || 4;
                return {
                  x: ((p.col + 0.5) / 6) * 100,
                  y: ((p.row + 0.5) / colH) * 100,
                };
              });
              const pathD = pts.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x}% ${pt.y}%`, "");
              const hitColor = theme.symbols[way.symbolId]?.glowColor || "#fbbf24";

              return (
                <g key={`way-line-${wIdx}`}>
                  {/* Outer Laser Glow */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={hitColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#megaLaserGlow)"
                    opacity="0.85"
                    className="animate-electric-arc"
                  />
                  {/* Inner Rapid Laser Pulse */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-laser-tracer"
                  />
                  {/* Glowing nodes */}
                  {pts.map((pt, pIdx) => (
                    <circle
                      key={`mpt-${pIdx}`}
                      cx={`${pt.x}%`}
                      cy={`${pt.y}%`}
                      r="4"
                      fill="#ffffff"
                      stroke={hitColor}
                      strokeWidth="2"
                      className="animate-ping"
                      style={{ animationDuration: "1.2s", animationDelay: `${pIdx * 80}ms` }}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        )}

        {/* Megaways Victory Floating Badges */}
        {revealed && !anySpinning && result?.wayHits && result.wayHits.map((way, idx) => {
          const avgCol = way.positions.reduce((sum, p) => sum + p.col, 0) / Math.max(1, way.positions.length);
          const p0 = way.positions[0];
          const colH = reelHeights[p0?.col || 0] || 4;
          const avgRow = way.positions.reduce((sum, p) => sum + p.row, 0) / Math.max(1, way.positions.length);
          const symDef = theme.symbols[way.symbolId];

          return (
            <div
              key={`way-badge-${idx}`}
              className="pointer-events-none absolute z-40 animate-prize-pill flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-yellow-400 bg-black/90 shadow-[0_0_24px_rgba(251,191,36,0.9)] backdrop-blur-md"
              style={{
                left: `${((avgCol + 0.5) / 6) * 100}%`,
                top: `${((avgRow + 0.5) / colH) * 100}%`,
              }}
            >
              <span className="text-[10px] font-black uppercase text-amber-300">
                {way.matchCount}OAK · {way.waysCount} WAYS
              </span>
              <span className="text-[10px] font-black text-white bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-400/50">
                {symDef?.name?.split(" ")[0] || way.symbolId}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
