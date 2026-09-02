"use client";

import React, { useEffect, useState } from "react";
import { PAYLINES, PaylineHit } from "@/lib/slots/slot-engine";
import { formatMoney } from "@/lib/format";

interface SlotPaylinesProps {
  paylineHits: PaylineHit[];
  activeLineIndex?: number | null; // Preview a specific line from paytable or cyclic display
  currency: string;
  isSpinning: boolean;
}

// Colors for distinct paylines
const PAYLINE_COLORS = [
  "#ef4444", // 1: Red
  "#3b82f6", // 2: Blue
  "#10b981", // 3: Emerald
  "#f59e0b", // 4: Amber
  "#a855f7", // 5: Purple
  "#ec4899", // 6: Pink
  "#06b6d4", // 7: Cyan
  "#84cc16", // 8: Lime
  "#f97316", // 9: Orange
  "#6366f1", // 10: Indigo
  "#14b8a6", // 11: Teal
  "#eab308", // 12: Yellow
  "#d946ef", // 13: Fuchsia
  "#0284c7", // 14: Sky
  "#8b5cf6", // 15: Violet
  "#f43f5e", // 16: Rose
  "#22c55e", // 17: Green
  "#e11d48", // 18: Crimson
  "#059669", // 19: Dark green
  "#7c3aed", // 20: Deep violet
];

export function SlotPaylines({
  paylineHits,
  activeLineIndex = null,
  currency,
  isSpinning,
}: SlotPaylinesProps) {
  const [cycleIndex, setCycleIndex] = useState<number>(0);

  // Cycle through winning lines every 1.5 seconds if multiple lines won
  useEffect(() => {
    if (isSpinning || paylineHits.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % (paylineHits.length + 1));
    }, 1600);

    return () => {
      clearInterval(timer);
    };
  }, [paylineHits.length, isSpinning]);

  if (isSpinning) return null;

  // Determine which lines to draw
  // If activeLineIndex is set (manual preview), show that
  // Otherwise if cycleIndex === 0 and paylineHits exist, show all hits together; if cycleIndex > 0, isolate the current hit!
  const linesToDraw: { lineIdx: number; color: string; hit?: PaylineHit }[] = [];

  if (activeLineIndex !== null && PAYLINES[activeLineIndex]) {
    linesToDraw.push({
      lineIdx: activeLineIndex,
      color: PAYLINE_COLORS[activeLineIndex % PAYLINE_COLORS.length],
    });
  } else if (paylineHits.length > 0) {
    if (cycleIndex === 0) {
      // Draw all winning lines
      paylineHits.forEach((hit) => {
        linesToDraw.push({
          lineIdx: hit.lineIndex,
          color: PAYLINE_COLORS[hit.lineIndex % PAYLINE_COLORS.length],
          hit,
        });
      });
    } else {
      // Draw single cycled winning line
      const selectedHit = paylineHits[cycleIndex - 1];
      if (selectedHit) {
        linesToDraw.push({
          lineIdx: selectedHit.lineIndex,
          color: PAYLINE_COLORS[selectedHit.lineIndex % PAYLINE_COLORS.length],
          hit: selectedHit,
        });
      }
    }
  }

  if (linesToDraw.length === 0) return null;

  // The 5x3 grid has 5 columns and 3 rows.
  // We compute normalized percentage coordinates for each cell center:
  // X: col 0 = 10%, col 1 = 30%, col 2 = 50%, col 3 = 70%, col 4 = 90%
  // Y: row 0 = 16.66%, row 1 = 50%, row 2 = 83.33%
  const getColX = (col: number) => 10 + col * 20;
  const getRowY = (row: number) => 16.66 + row * 33.33;

  const currentHighlightHit =
    linesToDraw.length === 1 && linesToDraw[0].hit ? linesToDraw[0].hit : null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {linesToDraw.map(({ lineIdx, color, hit }) => {
          const pattern = PAYLINES[lineIdx];
          if (!pattern) return null;

          // Points path string
          const points = pattern
            .map((row, col) => `${getColX(col)},${getRowY(row)}`)
            .join(" ");

          const isSolo = linesToDraw.length === 1;

          return (
            <g key={`payline-${lineIdx}`}>
              {/* Outer glow stroke */}
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={isSolo ? "1.8" : "1.2"}
                strokeOpacity={isSolo ? "0.9" : "0.7"}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#laserGlow)"
              />
              {/* Inner bright laser core */}
              <polyline
                points={points}
                fill="none"
                stroke="#ffffff"
                strokeWidth={isSolo ? "0.8" : "0.5"}
                strokeOpacity="0.95"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Glowing nodes on winning positions */}
              {pattern.map((row, col) => {
                const isMatchingPos = hit
                  ? hit.positions.some((p) => p.col === col && p.row === row)
                  : true;

                if (!isMatchingPos && hit) return null;

                return (
                  <circle
                    key={`node-${lineIdx}-${col}`}
                    cx={getColX(col)}
                    cy={getRowY(row)}
                    r={isSolo ? 2.5 : 1.8}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    className={isSolo ? "animate-ping" : ""}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Floating neon badge showing line info when single line is displayed */}
      {currentHighlightHit && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-4 py-1 border border-yellow-400/80 shadow-[0_0_15px_rgba(250,204,21,0.5)] backdrop-blur-md flex items-center gap-2 text-xs animate-bounce">
          <span className="font-bold text-yellow-400">
            LINE #{currentHighlightHit.lineIndex + 1}
          </span>
          <span className="text-white/80">({currentHighlightHit.matchCount}x {currentHighlightHit.symbolId})</span>
          <span className="font-extrabold text-emerald-400">
            +{formatMoney(currentHighlightHit.winAmount, currency)}
          </span>
        </div>
      )}
    </div>
  );
}
