"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Grid, SymbolCell } from "@/lib/slots/slot-engine";
import { SlotTheme } from "@/lib/slots/slot-themes";
import { SlotSymbolIcon } from "./slot-symbols";

interface SlotTumbleGridProps {
  grid: Grid;
  theme: SlotTheme;
  isTumbling: boolean;
  shatteredPositions: { col: number; row: number }[];
  currentMultiplier: number;
  tumbleStepIndex: number;
}

// Generate random debris particles for shatter effects
function generateDebris(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const distance = 20 + Math.random() * 35;
    return {
      id: i,
      px: Math.cos(angle) * distance,
      py: Math.sin(angle) * distance - 15,
      rotation: Math.random() * 360,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 80,
    };
  });
}

export function SlotTumbleGrid({
  grid,
  theme,
  isTumbling,
  shatteredPositions,
  currentMultiplier,
  tumbleStepIndex,
}: SlotTumbleGridProps) {
  // Track shatter particles with unique keys
  const [activeShatterKey, setActiveShatterKey] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [sparkles, setSparkles] = useState<
    { id: number; col: number; row: number; offsetX: number; offsetY: number }[]
  >([]);

  // Trigger screen shake on tumble hit
  useEffect(() => {
    if (shatteredPositions.length > 0) {
      setActiveShatterKey((k) => k + 1);
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 400);
      return () => clearTimeout(timer);
    }
  }, [shatteredPositions]);

  // Generate floating sparkles on winning positions
  useEffect(() => {
    if (shatteredPositions.length > 0) {
      const newSparkles = shatteredPositions.flatMap((pos, idx) =>
        Array.from({ length: 3 }, (_, i) => ({
          id: Date.now() + idx * 10 + i,
          col: pos.col,
          row: pos.row,
          offsetX: (Math.random() - 0.5) * 30,
          offsetY: Math.random() * -10,
        }))
      );
      setSparkles(newSparkles);
      const timer = setTimeout(() => setSparkles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [shatteredPositions]);

  // Memoize debris patterns for shattered positions
  const debrisMap = useMemo(() => {
    if (shatteredPositions.length === 0) return new Map<string, ReturnType<typeof generateDebris>>();
    const map = new Map<string, ReturnType<typeof generateDebris>>();
    shatteredPositions.forEach((pos) => {
      map.set(`${pos.col}-${pos.row}`, generateDebris(8));
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShatterKey]);

  const isPositionWinning = (col: number, row: number) => {
    return shatteredPositions.some((p) => p.col === col && p.row === row);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none">
      {/* Top Tumble & Multiplier Status Bar */}
      <div className="flex items-center justify-between px-2 py-1 mb-2 bg-black/40 rounded-xl border border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Grid Mode:</span>
          <span className="font-extrabold text-amber-300">6x5 CLUSTER PAYS (8+ ANYWHERE)</span>
        </div>

        <div className="flex items-center gap-3">
          {tumbleStepIndex > 0 && (
            <span
              key={`tumble-badge-${tumbleStepIndex}`}
              className="rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/40 px-2 py-0.5 text-[10px] font-extrabold animate-tumble-badge"
            >
              TUMBLE #{tumbleStepIndex}
            </span>
          )}

          {currentMultiplier > 1 && (
            <span
              key={`mult-${currentMultiplier}`}
              className="rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 px-2.5 py-0.5 text-[11px] font-black tracking-wider shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-multiplier-pop"
            >
              ⚡ {currentMultiplier}X TOTAL MULTIPLIER
            </span>
          )}
        </div>
      </div>

      {/* 6x5 Grid Area with tumble shake */}
      <div
        className={`relative flex-1 grid grid-cols-6 gap-1 sm:gap-2 h-full w-full p-1.5 bg-neutral-950/80 rounded-2xl border border-white/10 overflow-hidden shadow-inner ${
          shaking ? "animate-tumble-shake" : ""
        }`}
      >
        {[0, 1, 2, 3, 4, 5].map((colIdx) => (
          <div key={`col-${colIdx}`} className="flex flex-col justify-between gap-1 sm:gap-1.5 h-full">
            {[0, 1, 2, 3, 4].map((rowIdx) => {
              const cell: SymbolCell | undefined = grid[colIdx]?.[rowIdx];
              const isWin = isPositionWinning(colIdx, rowIdx);
              const isShattering = isWin && isTumbling;
              const debrisParticles = debrisMap.get(`${colIdx}-${rowIdx}`) || [];

              if (!cell) {
                return (
                  <div
                    key={`empty-${colIdx}-${rowIdx}`}
                    className="flex-1 rounded-xl bg-white/5 border border-white/5"
                  />
                );
              }

              return (
                <div
                  key={cell.key || `cell-${colIdx}-${rowIdx}`}
                  className={`relative flex-1 flex items-center justify-center rounded-xl p-1 transition-all ${
                    cell.id === "MULTIPLIER_ORB"
                      ? "bg-gradient-to-b from-amber-500/20 via-purple-500/10 to-transparent border border-amber-400/40 ring-1 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      : isWin
                      ? "bg-yellow-400/20 border-2 border-yellow-400 scale-105 z-10 animate-win-glow"
                      : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]"
                  } ${
                    cell.isNew
                      ? `animate-slot-drop cascade-delay-${colIdx}`
                      : !isWin && !isShattering
                      ? ""
                      : ""
                  }`}
                >
                  {/* Win shimmer overlay */}
                  {isWin && !isShattering && (
                    <div className="absolute inset-0 rounded-xl animate-win-shimmer pointer-events-none z-[1]" />
                  )}

                  {/* Shatter ring effect */}
                  {isShattering && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="w-full h-full rounded-xl border-2 border-yellow-400 animate-shatter-ring" />
                    </div>
                  )}

                  {/* Debris particles on shatter */}
                  {isShattering &&
                    debrisParticles.map((d) => (
                      <div
                        key={`debris-${d.id}`}
                        className="absolute pointer-events-none z-30 animate-particle-burst"
                        style={
                          {
                            "--px": `${d.px}px`,
                            "--py": `${d.py}px`,
                            animationDelay: `${d.delay}ms`,
                            top: "50%",
                            left: "50%",
                          } as React.CSSProperties
                        }
                      >
                        <div
                          className="rounded-sm bg-gradient-to-br from-yellow-300 to-amber-500"
                          style={{
                            width: `${d.size}px`,
                            height: `${d.size}px`,
                            transform: `rotate(${d.rotation}deg)`,
                          }}
                        />
                      </div>
                    ))}

                  {/* Symbol with shatter animation */}
                  <div className={isShattering ? "animate-slot-shatter" : ""}>
                    <SlotSymbolIcon
                      id={cell.id}
                      multiplierValue={cell.multiplierValue}
                      theme={theme}
                      isWinning={isWin}
                      isExploding={isShattering}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Floating sparkle particles from winning positions */}
        {sparkles.map((s) => (
          <div
            key={s.id}
            className="absolute pointer-events-none z-30 animate-sparkle-float"
            style={{
              left: `${(s.col / 6) * 100 + 8 + s.offsetX * 0.3}%`,
              top: `${(s.row / 5) * 100 + 10 + s.offsetY * 0.2}%`,
            }}
          >
            <span className="text-yellow-300 text-sm drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]">
              ✦
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
