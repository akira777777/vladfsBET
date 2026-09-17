"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { formatMoney } from "@/lib/format";

interface RouletteGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export function RouletteGame({ game }: RouletteGameProps) {
  const { refreshWallet, wallet, user } = useAuth();
  const currency = wallet?.currency ?? user?.currency ?? "USD";
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
  const [ballPhase, setBallPhase] = useState<"IDLE" | "SPINNING" | "SETTLED">("IDLE");
  const [ballOrbitDur, setBallOrbitDur] = useState(0.5);
  const ballAnimRef = useRef<number[]>([]);
  const settleTimerRef = useRef<number | null>(null);

  const clearBallTimers = () => {
    ballAnimRef.current.forEach((id) => window.clearTimeout(id));
    ballAnimRef.current = [];
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setErrorMsg(null);
    setLastResult(null);
    clearBallTimers();

    setBallPhase("SPINNING");
    setBallOrbitDur(0.32);
    ballAnimRef.current.push(window.setTimeout(() => setBallOrbitDur(0.55), 700));
    ballAnimRef.current.push(window.setTimeout(() => setBallOrbitDur(0.95), 1600));
    ballAnimRef.current.push(window.setTimeout(() => setBallOrbitDur(1.8), 2500));
    ballAnimRef.current.push(window.setTimeout(() => setBallOrbitDur(2.8), 3100));

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
      const numIndex = Math.max(0, WHEEL_NUMBERS.indexOf(winNum));
      const degreesPerNumber = 360 / WHEEL_NUMBERS.length;
      const aligned = (360 - numIndex * degreesPerNumber) % 360;
      setWheelRotation((prev) => {
        const normalized = ((prev % 360) + 360) % 360;
        const delta = (aligned - normalized + 360) % 360;
        return prev + 360 * 5 + delta;
      });

      settleTimerRef.current = window.setTimeout(() => {
        setBallPhase("SETTLED");
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
        void refreshWallet();
      }, 3500);
    } catch (err) {
      setSpinning(false);
      setBallPhase("IDLE");
      setErrorMsg(err instanceof Error ? err.message : "Failed to place bet");
    }
  };

  useEffect(() => {
    return () => clearBallTimers();
  }, []);

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

          <div className="relative flex items-center justify-center h-64 w-64 md:h-80 md:w-80">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500 via-yellow-800 to-amber-950 p-[6px] shadow-[0_0_40px_rgba(212,175,55,0.25)] ring-1 ring-yellow-200/20" />
            <div className="absolute inset-[6px] rounded-full bg-[#0b0d12]" />
            <div
              className="relative h-[92%] w-[92%] rounded-full transition-transform duration-[3500ms] ease-out flex items-center justify-center"
              style={{ transform: `rotate(${wheelRotation}deg)`, transformOrigin: "50% 50%" }}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <circle cx="50" cy="50" r="49" fill="#111827" stroke="#d4af37" strokeWidth="1.2" />
                {WHEEL_NUMBERS.map((num, i) => {
                  const angle = (i * 360) / WHEEL_NUMBERS.length;
                  const isRed = RED_NUMBERS.includes(num);
                  const isGreen = num === 0;
                  const fill = isGreen ? "#059669" : isRed ? "#dc2626" : "#1f2937";
                  return (
                    <g key={num} transform={`rotate(${angle} 50 50)`}>
                      <path
                        d="M 50 50 L 46 3.5 A 48 48 0 0 1 54 3.5 Z"
                        fill={fill}
                        stroke="#000"
                        strokeWidth="0.25"
                      />
                      <text
                        x="50"
                        y="10.8"
                        fontSize="3.5"
                        fontWeight="bold"
                        fill="#ffffff"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {num}
                      </text>
                    </g>
                  );
                })}
                <circle cx="50" cy="50" r="18" fill="#0f172a" stroke="#d4af37" strokeWidth="1.2" />
                <circle cx="50" cy="50" r="14" fill="#d4af37" stroke="#b45309" strokeWidth="1.2" />
                <circle cx="50" cy="50" r="5.5" fill="#18181b" />
              </svg>
            </div>
            <div className="absolute top-1 z-20 h-5 w-3.5 bg-gold shadow-md" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />

            {ballPhase !== "IDLE" && (
              <div
                className="absolute inset-0 pointer-events-none z-10 origin-center"
                style={
                  ballPhase === "SPINNING"
                    ? ({
                        animation: `ballOrbit ${ballOrbitDur}s linear infinite reverse`,
                        "--orbit-r": "42%",
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <div
                  className={`absolute left-1/2 h-3 w-3 -ml-1.5 rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.85)] ${
                    ballPhase === "SETTLED" ? "top-[9%]" : "top-1/2 -mt-1.5"
                  }`}
                  style={{ background: "radial-gradient(circle at 35% 35%, #ffffff, #a3a3a3)" }}
                />
              </div>
            )}
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
                {lastResult.won ? `You won ${formatMoney(lastResult.winAmount, currency)}!` : "No win this round"}
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

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { type: "RED", label: "RED (1:1)", color: "bg-red-600 hover:bg-red-500" },
                { type: "BLACK", label: "BLACK (1:1)", color: "bg-zinc-800 hover:bg-zinc-700" },
                { type: "EVEN", label: "EVEN (1:1)", color: "bg-blue-900/60 hover:bg-blue-800/60 border border-blue-500/30" },
                { type: "ODD", label: "ODD (1:1)", color: "bg-purple-900/60 hover:bg-purple-800/60 border border-purple-500/30" },
                { type: "LOW", label: "1–18 (1:1)", color: "bg-slate-800 hover:bg-slate-700 border border-white/10" },
                { type: "HIGH", label: "19–36 (1:1)", color: "bg-slate-800 hover:bg-slate-700 border border-white/10" },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => setSelectedBet({ type: b.type, label: b.label })}
                  className={`rounded-lg p-3 text-xs font-bold text-white transition-all shadow-sm ${b.color} ${
                    selectedBet.label === b.label ? "ring-2 ring-gold scale-[1.02]" : "opacity-85"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { type: "DOZEN", value: 1, label: "1st 12 (2:1)" },
                { type: "DOZEN", value: 2, label: "2nd 12 (2:1)" },
                { type: "DOZEN", value: 3, label: "3rd 12 (2:1)" },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => setSelectedBet({ type: b.type, value: b.value, label: b.label })}
                  className={`rounded-lg p-2.5 text-xs font-bold text-white transition-all bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-500/30 ${
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
