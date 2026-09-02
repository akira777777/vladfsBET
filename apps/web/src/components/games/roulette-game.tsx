"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

interface RouletteGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export function RouletteGame({ game }: RouletteGameProps) {
  const { refreshWallet } = useAuth();
  const [selectedBet, setSelectedBet] = useState<{ type: string; value?: number; label: string }>({
    type: "RED",
    label: "RED (1:1)",
  });
  const [chipValue, setChipValue] = useState<number>(5);
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastResult, setLastResult] = useState<{
    winningNumber: number;
    color: string;
    won: boolean;
    winAmount: string;
  } | null>(null);
  const [history, setHistory] = useState<{ num: number; color: string }[]>([
    { num: 14, color: "RED" },
    { num: 22, color: "BLACK" },
    { num: 0, color: "GREEN" },
    { num: 7, color: "RED" },
    { num: 33, color: "BLACK" },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setErrorMsg(null);
    setLastResult(null);

    try {
      const res = await api<{
        winAmount: string;
        betAmount: string;
        gameResult: { winningNumber: number; color: string; won: boolean };
      }>(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: chipValue.toString(),
          gameData: {
            betType: selectedBet.type,
            number: selectedBet.value,
          },
        }),
      });

      const winNum = res.gameResult.winningNumber;
      const numIndex = WHEEL_NUMBERS.indexOf(winNum);
      const degreesPerNumber = 360 / WHEEL_NUMBERS.length;
      const targetDegree = 360 * 5 + (360 - numIndex * degreesPerNumber);

      setWheelRotation((prev) => prev + targetDegree);

      setTimeout(async () => {
        setSpinning(false);
        const won = parseFloat(res.winAmount) > 0;
        const color = winNum === 0 ? "GREEN" : RED_NUMBERS.includes(winNum) ? "RED" : "BLACK";

        setLastResult({
          winningNumber: winNum,
          color,
          won,
          winAmount: res.winAmount,
        });

        setHistory((prev) => [{ num: winNum, color }, ...prev.slice(0, 9)]);
        await refreshWallet();
      }, 3500);
    } catch (err) {
      setSpinning(false);
      setErrorMsg(err instanceof Error ? err.message : "Failed to place bet");
    }
  };

  return (
    <div className="space-y-4">
      <RealityCheckBar />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Interactive Roulette Wheel */}
        <Card className="flex flex-col items-center justify-center p-6 border-white/10 bg-[#0A0E17] lg:col-span-5">
          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-gold">European Wheel</span>
            <div className="flex gap-1">
              {history.slice(0, 5).map((h, i) => (
                <span
                  key={i}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                    h.color === "GREEN" ? "bg-emerald-600" : h.color === "RED" ? "bg-red-600" : "bg-zinc-800 border border-white/20"
                  }`}
                >
                  {h.num}
                </span>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center h-64 w-64 md:h-72 md:w-72">
            {/* Outer Rim */}
            <div className="absolute inset-0 rounded-full border-4 border-amber-600/60 bg-gradient-to-br from-amber-700 via-yellow-900 to-amber-950 p-2 shadow-2xl ring-2 ring-yellow-500/20" />
            {/* Rotating SVG Wheel */}
            <div
              className="relative h-full w-full rounded-full transition-transform duration-[3500ms] ease-out flex items-center justify-center"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <circle cx="50" cy="50" r="48" fill="#111827" stroke="#d4af37" strokeWidth="1" />
                {WHEEL_NUMBERS.map((num, i) => {
                  const angle = (i * 360) / WHEEL_NUMBERS.length;
                  const isRed = RED_NUMBERS.includes(num);
                  const isGreen = num === 0;
                  const fill = isGreen ? "#059669" : isRed ? "#dc2626" : "#1f2937";
                  return (
                    <g key={num} transform={`rotate(${angle} 50 50)`}>
                      <path
                        d="M 50 50 L 46 4 A 48 48 0 0 1 54 4 Z"
                        fill={fill}
                        stroke="#000"
                        strokeWidth="0.3"
                      />
                      <text
                        x="50"
                        y="12"
                        fontSize="3.8"
                        fontWeight="bold"
                        fill="#ffffff"
                        textAnchor="middle"
                        transform={`rotate(180 50 12)`}
                      >
                        {num}
                      </text>
                    </g>
                  );
                })}
                {/* Center Hub */}
                <circle cx="50" cy="50" r="14" fill="#d4af37" stroke="#b45309" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="6" fill="#18181b" />
              </svg>
            </div>
            {/* Pointer / Marker */}
            <div className="absolute top-0 h-4 w-3 bg-gold clip-polygon shadow-md" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
          </div>

          {lastResult && (
            <div className="mt-4 text-center animate-in fade-in zoom-in">
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg ${
                  lastResult.color === "GREEN" ? "bg-emerald-600" : lastResult.color === "RED" ? "bg-red-600" : "bg-zinc-800"
                }`}
              >
                Number: {lastResult.winningNumber} ({lastResult.color})
              </div>
              <p className={`mt-1 text-sm font-semibold ${lastResult.won ? "text-emerald-400" : "text-muted-foreground"}`}>
                {lastResult.won ? `🎉 You Won $${lastResult.winAmount}!` : "No Win this round"}
              </p>
            </div>
          )}
        </Card>

        {/* Right: Betting Grid & Chips */}
        <Card className="flex flex-col justify-between p-6 border-white/10 bg-[#0A0E17] lg:col-span-7">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">{game.title}</h3>
                <p className="text-xs text-muted-foreground">Select bet type or single number, pick chip amount and spin!</p>
              </div>
              <ProvablyFairDialog />
            </div>

            {/* Outside Bet Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { type: "RED", label: "RED (1:1)", color: "bg-red-600 hover:bg-red-500" },
                { type: "BLACK", label: "BLACK (1:1)", color: "bg-zinc-800 hover:bg-zinc-700" },
                { type: "EVEN", label: "EVEN (1:1)", color: "bg-blue-900/60 hover:bg-blue-800/60 border border-blue-500/30" },
                { type: "ODD", label: "ODD (1:1)", color: "bg-purple-900/60 hover:bg-purple-800/60 border border-purple-500/30" },
                { type: "STRAIGHT", value: 0, label: "ZERO (35:1)", color: "bg-emerald-700 hover:bg-emerald-600" },
                { type: "STRAIGHT", value: 7, label: "LUCKY 7 (35:1)", color: "bg-amber-600 hover:bg-amber-500" },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => setSelectedBet({ type: b.type, value: b.value, label: b.label })}
                  className={`rounded-lg p-3 text-xs font-bold text-white transition-all shadow-sm ${b.color} ${
                    selectedBet.label === b.label ? "ring-2 ring-gold scale-[1.02]" : "opacity-85"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Numbers Grid (0..36) */}
            <div className="mb-4 rounded-lg bg-black/40 p-3 ring-1 ring-white/5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 block">Direct Number Bet (35:1 Payout)</span>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                {Array.from({ length: 37 }).map((_, i) => {
                  const isRed = RED_NUMBERS.includes(i);
                  const isGreen = i === 0;
                  const bg = isGreen ? "bg-emerald-700" : isRed ? "bg-red-600" : "bg-zinc-800";
                  const isSelected = selectedBet.type === "STRAIGHT" && selectedBet.value === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedBet({ type: "STRAIGHT", value: i, label: `Number ${i} (35:1)` })}
                      className={`h-7 rounded text-[11px] font-bold text-white transition-all ${bg} ${
                        isSelected ? "ring-2 ring-gold scale-110 z-10" : "hover:opacity-80"
                      }`}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chip Selector */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-muted-foreground mr-2">Chip Bet:</span>
              {[1, 5, 25, 100, 250].map((val) => (
                <button
                  key={val}
                  onClick={() => setChipValue(val)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-xs shadow-md transition-all ${
                    chipValue === val ? "scale-110 ring-2 ring-gold bg-gold text-black" : "bg-card border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400 mb-4">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div className="text-xs">
              <span className="text-muted-foreground block">Active Bet:</span>
              <strong className="text-white text-sm">{selectedBet.label} • ${chipValue}</strong>
            </div>
            <Button
              onClick={handleSpin}
              disabled={spinning}
              size="lg"
              className="px-8 bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold hover:brightness-110 shadow-lg shadow-gold/20"
            >
              {spinning ? "SPINNING..." : "SPIN WHEEL"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
