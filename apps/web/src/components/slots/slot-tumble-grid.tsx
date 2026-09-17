"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Grid, SymbolCell, SymbolId } from "@/lib/slots/slot-engine";
import { SlotTheme } from "@/lib/slots/slot-themes";
import { SlotSymbolIcon } from "./slot-symbols";

interface SlotTumbleGridProps {
  grid: Grid;
  theme: SlotTheme;
  isTumbling: boolean;
  shatteredPositions: { col: number; row: number }[];
  winHoldPositions?: { col: number; row: number }[];
  spinningColumns?: boolean[];
  anticipatingColumns?: boolean[];
  flashingColumns?: boolean[];
  collectingOrbs?: { col: number; row: number }[];
  hudTargetRef?: React.RefObject<HTMLElement | null>;
  currentMultiplier: number;
  tumbleStepIndex: number;
  isTurbo?: boolean;
}

function generateDebris(count: number, color: string) {
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
      color,
    };
  });
}

function CollectingOrbShell({
  active,
  hudTargetRef,
  children,
}: {
  active: boolean;
  hudTargetRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [delta, setDelta] = useState({ dx: 0, dy: -90 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }
    const cell = ref.current;
    const hud = hudTargetRef?.current;
    if (!cell) return;
    const a = cell.getBoundingClientRect();
    if (hud) {
      const b = hud.getBoundingClientRect();
      setDelta({
        dx: b.left + b.width / 2 - (a.left + a.width / 2),
        dy: b.top + b.height / 2 - (a.top + a.height / 2),
      });
    } else {
      setDelta({ dx: 0, dy: -90 });
    }
    setReady(true);
  }, [active, hudTargetRef]);

  return (
    <div
      ref={ref}
      className={active && ready ? "animate-orb-collect" : ""}
      style={
        active
          ? ({ "--orb-dx": `${delta.dx}px`, "--orb-dy": `${delta.dy}px` } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}

function makeLoopStrip(theme: SlotTheme): SymbolId[] {
  const pool = Object.keys(theme.symbols) as SymbolId[];
  const half = Array.from({ length: 5 }, () => pool[Math.floor(Math.random() * pool.length)]);
  return [...half, ...half];
}

export function SlotTumbleGrid({
  grid,
  theme,
  isTumbling,
  shatteredPositions,
  winHoldPositions = [],
  spinningColumns = [false, false, false, false, false, false],
  anticipatingColumns = [false, false, false, false, false, false],
  flashingColumns = [false, false, false, false, false, false],
  collectingOrbs = [],
  hudTargetRef,
  currentMultiplier,
  tumbleStepIndex,
  isTurbo = false,
}: SlotTumbleGridProps) {
  // Track shatter particles with unique keys
  const [activeShatterKey, setActiveShatterKey] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [sparkles, setSparkles] = useState<
    { id: number; col: number; row: number; offsetX: number; offsetY: number; color: string }[]
  >([]);
  const prevGridRef = useRef<Grid>(grid);
  const [fallFrom, setFallFrom] = useState<Map<string, number>>(new Map());
  const stripsRef = useRef<SymbolId[][]>([0, 1, 2, 3, 4, 5].map(() => makeLoopStrip(theme)));

  const anySpinning = spinningColumns.some(Boolean);

  useEffect(() => {
    if (anySpinning) {
      stripsRef.current = [0, 1, 2, 3, 4, 5].map(() => makeLoopStrip(theme));
    }
  }, [anySpinning, theme]);

  useEffect(() => {
    const prev = prevGridRef.current;
    const next = new Map<string, number>();
    for (let col = 0; col < 6; col++) {
      for (let row = 0; row < 5; row++) {
        const cell = grid[col]?.[row];
        if (!cell) continue;
        if (cell.isNew) {
          next.set(cell.key, -(row + 1));
          continue;
        }
        let oldRow = -1;
        for (let r = 0; r < 5; r++) {
          if (prev[col]?.[r]?.key === cell.key) {
            oldRow = r;
            break;
          }
        }
        if (oldRow >= 0 && oldRow !== row) {
          next.set(cell.key, oldRow - row);
        }
      }
    }
    setFallFrom(next);
    prevGridRef.current = grid;
  }, [grid]);

  // Trigger screen shake on tumble hit
  useEffect(() => {
    if (shatteredPositions.length > 0) {
      const timer1 = setTimeout(() => {
        setActiveShatterKey((k) => k + 1);
        setShaking(true);
      }, 0);
      const timer2 = setTimeout(() => setShaking(false), 400);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [shatteredPositions]);

  // Generate floating sparkles on winning positions
  useEffect(() => {
    if (shatteredPositions.length > 0) {
      const newSparkles = shatteredPositions.flatMap((pos, idx) => {
        const cell = grid[pos.col]?.[pos.row];
        const color = (cell && theme.symbols[cell.id]?.glowColor) || "#fbbf24";
        return Array.from({ length: 3 }, (_, i) => ({
          id: Date.now() + idx * 10 + i,
          col: pos.col,
          row: pos.row,
          offsetX: (Math.random() - 0.5) * 30,
          offsetY: Math.random() * -10,
          color,
        }));
      });
      const timer1 = setTimeout(() => setSparkles(newSparkles), 0);
      const timer2 = setTimeout(() => setSparkles([]), 1000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [shatteredPositions]);

  // Memoize debris patterns for shattered positions
  const debrisMap = useMemo(() => {
    if (shatteredPositions.length === 0) return new Map<string, ReturnType<typeof generateDebris>>();
    const map = new Map<string, ReturnType<typeof generateDebris>>();
    shatteredPositions.forEach((pos) => {
      const cell = grid[pos.col]?.[pos.row];
      const color = (cell && theme.symbols[cell.id]?.glowColor) || "#fbbf24";
      map.set(`${pos.col}-${pos.row}`, generateDebris(8, color));
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShatterKey]);

  const isPositionWinning = (col: number, row: number) => {
    return (
      shatteredPositions.some((p) => p.col === col && p.row === row) ||
      winHoldPositions.some((p) => p.col === col && p.row === row)
    );
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
          <div
            key={`col-${colIdx}`}
            className={`relative flex flex-col justify-between gap-1 sm:gap-1.5 h-full overflow-hidden rounded-xl ${
              anticipatingColumns[colIdx] ? "animate-scatter-anticipation ring-1 ring-amber-400/70" : ""
            } ${flashingColumns[colIdx] ? "animate-column-flash" : ""} ${
              !spinningColumns[colIdx] && isTumbling ? "animate-reel-spring" : ""
            }`}
          >
            {spinningColumns[colIdx] ? (
              <div className={`flex flex-col h-[200%] ${isTurbo ? "animate-reel-strip-fast" : "animate-reel-strip"}`}>
                {stripsRef.current[colIdx].map((id, idx) => (
                  <div key={`spin-${colIdx}-${idx}`} className="flex h-[10%] items-center justify-center">
                    <SlotSymbolIcon id={id} theme={theme} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
            <>
            {[0, 1, 2, 3, 4].map((rowIdx) => {
              const cell: SymbolCell | undefined = grid[colIdx]?.[rowIdx];
              const isWin = isPositionWinning(colIdx, rowIdx);
              const isShattering = shatteredPositions.some((p) => p.col === colIdx && p.row === rowIdx);
              const isCollecting = collectingOrbs.some((p) => p.col === colIdx && p.row === rowIdx);
              const showScatterBeam =
                cell?.id === "SCATTER" && flashingColumns[colIdx] && !spinningColumns[colIdx];
              const debrisParticles = debrisMap.get(`${colIdx}-${rowIdx}`) || [];
              const rowsMoved = cell ? fallFrom.get(cell.key) : undefined;
              const shouldFall = typeof rowsMoved === "number" && rowsMoved !== 0 && !isShattering;

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
                  } ${shouldFall ? "animate-symbol-fall" : ""}`}
                  style={shouldFall ? ({ "--fall-from": `${rowsMoved * 110}%` } as React.CSSProperties) : undefined}
                >
                  {isWin && !isShattering && (
                    <div className="absolute inset-0 rounded-xl animate-win-shimmer pointer-events-none z-[1]" />
                  )}

                  {showScatterBeam && (
                    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-20">
                      <div className="absolute inset-x-1 top-0 h-full bg-gradient-to-b from-white via-cyan-300/70 to-transparent animate-gem-beam" />
                    </div>
                  )}

                  {isShattering && (
                    <>
                      <div className="absolute inset-0 rounded-xl animate-cell-flash pointer-events-none z-20" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="w-full h-full rounded-xl border-2 border-yellow-400 animate-shatter-ring" />
                      </div>
                    </>
                  )}

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
                          className="rounded-sm"
                          style={{
                            width: `${d.size}px`,
                            height: `${d.size}px`,
                            transform: `rotate(${d.rotation}deg)`,
                            background: `linear-gradient(135deg, #fff, ${d.color})`,
                            boxShadow: `0 0 6px ${d.color}`,
                          }}
                        />
                      </div>
                    ))}

                  <CollectingOrbShell active={isCollecting} hudTargetRef={hudTargetRef}>
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
                  </CollectingOrbShell>
                </div>
              );
            })}
            </>
            )}
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
            <span
              className="block h-1.5 w-1.5 rounded-full"
              style={{
                background: s.color,
                boxShadow: `0 0 8px ${s.color}, 0 0 14px ${s.color}`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
