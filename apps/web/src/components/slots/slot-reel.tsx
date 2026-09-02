"use client";

import React, { useEffect, useState, useRef } from "react";
import { SymbolId, generateReelStrip } from "@/lib/slots/slot-engine";
import { SlotTheme } from "@/lib/slots/slot-themes";
import { SlotSymbolIcon } from "./slot-symbols";
import { slotAudio } from "@/lib/slots/slot-audio";

interface SlotReelProps {
  colIndex: number;
  currentSymbols: SymbolId[]; // 3 symbols [row0, row1, row2]
  isSpinning: boolean;
  isTurbo: boolean;
  isAnticipating: boolean; // Anticipation tease on this reel
  winningRows: number[]; // e.g. [0, 1] if row 0 & 1 are in a win
  theme: SlotTheme;
  onReelStopped: (colIndex: number) => void;
}

const STRIP_LENGTH = 32;

export function SlotReel({
  colIndex,
  currentSymbols,
  isSpinning,
  isTurbo,
  isAnticipating,
  winningRows,
  theme,
  onReelStopped,
}: SlotReelProps) {
  const [stripSymbols, setStripSymbols] = useState<SymbolId[]>(() =>
    generateReelStrip(currentSymbols, STRIP_LENGTH),
  );
  const [animState, setAnimState] = useState<"IDLE" | "SPINNING" | "STOPPING">("IDLE");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isSpinning) {
      return;
    }

    // Prepare spinning strip
    const newStrip = generateReelStrip(currentSymbols, STRIP_LENGTH);
    const startTimer = setTimeout(() => {
      setStripSymbols(newStrip);
      setAnimState("SPINNING");
    }, 0);

    let stopDelay = isTurbo ? 150 + colIndex * 100 : 700 + colIndex * 280;

    if (isAnticipating) {
      stopDelay += 1600;
      slotAudio.startAnticipation();
    }

    timeoutRef.current = setTimeout(() => {
      setAnimState("STOPPING");
      slotAudio.playReelStop(colIndex);

      if (isAnticipating) {
        slotAudio.stopAnticipation();
      }

      const landedScatters = currentSymbols.filter((s) => s === "SCATTER").length;
      if (landedScatters > 0) {
        slotAudio.playScatterLand(colIndex + 1);
      }

      setTimeout(() => {
        setAnimState("IDLE");
        onReelStopped(colIndex);
      }, isTurbo ? 100 : 250);
    }, stopDelay);

    return () => {
      clearTimeout(startTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isSpinning, currentSymbols, colIndex, isTurbo, isAnticipating, onReelStopped]);

  // If idle, render static symbols
  if (animState === "IDLE" && !isSpinning) {
    return (
      <div
        className={`relative flex flex-col items-center justify-around h-full w-full rounded-xl bg-black/40 border border-white/5 backdrop-blur-md overflow-hidden transition-all duration-300 ${
          isAnticipating
            ? "border-amber-400 animate-scatter-anticipation"
            : ""
        }`}
      >
        {currentSymbols.map((symbolId, rowIdx) => {
          const isWinning = winningRows.includes(rowIdx);
          return (
            <div
              key={`static-${colIndex}-${rowIdx}`}
              className={`relative flex items-center justify-center w-full h-1/3 py-1 transition-transform duration-300 animate-reel-stop ${
                isWinning ? "z-10" : ""
              }`}
              style={{ animationDelay: `${rowIdx * 50}ms` }}
            >
              <SlotSymbolIcon
                id={symbolId}
                theme={theme}
                isWinning={isWinning}
                size="md"
              />
            </div>
          );
        })}
      </div>
    );
  }

  // During spinning / stopping, render animated vertical reel strip
  const targetOffset = (stripSymbols.length - 3) * 33.333;

  return (
    <div
      className={`relative flex flex-col h-full w-full rounded-xl bg-black/50 border border-white/10 backdrop-blur-md overflow-hidden ${
        isAnticipating
          ? "border-amber-400 animate-scatter-anticipation"
          : ""
      }`}
    >
      {/* Top and Bottom Blur Vignette for authentic mechanical depth */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none" />

      {/* Anticipation Tease Flare Banner */}
      {isAnticipating && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center">
          <div className="px-2 py-0.5 rounded bg-amber-500/90 text-[10px] font-black tracking-widest text-black uppercase shadow-[0_0_15px_rgba(245,158,11,1)] animate-multiplier-pop">
            TEASE!
          </div>
        </div>
      )}

      {/* Spinning Strip Container */}
      <div
        className="flex flex-col w-full"
        style={{
          transform:
            animState === "SPINNING"
              ? `translateY(-${(stripSymbols.length - 6) * 33.333}%)`
              : animState === "STOPPING"
              ? `translateY(-${targetOffset}%)`
              : `translateY(-${targetOffset}%)`,
          transition:
            animState === "SPINNING"
              ? `transform ${isTurbo ? "0.3s" : "0.7s"} linear infinite`
              : `transform ${isTurbo ? "0.2s" : "0.45s"} cubic-bezier(0.15, 0.85, 0.35, 1.15)`,
          filter: animState === "SPINNING" ? "blur(1.5px)" : "none",
        }}
      >
        {stripSymbols.map((symbolId, idx) => (
          <div
            key={`strip-${colIndex}-${idx}`}
            className="flex items-center justify-center w-full py-2 shrink-0"
            style={{ height: "33.333%" }}
          >
            <SlotSymbolIcon id={symbolId} theme={theme} size="md" />
          </div>
        ))}
      </div>
    </div>
  );
}
