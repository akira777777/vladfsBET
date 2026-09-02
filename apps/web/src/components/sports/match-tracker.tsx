"use client";

import { useEffect, useState } from "react";
import { Radio, Flame, Shield, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MatchTrackerProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
}

export function MatchTracker({
  homeTeam = "Real Madrid",
  awayTeam = "Manchester City",
  homeScore = 2,
  awayScore = 1,
  minute = 68,
}: MatchTrackerProps) {
  const [activeTab, setActiveTab] = useState<"TRACKER" | "BUILDER" | "STATS">("TRACKER");
  const [actionText, setActionText] = useState("🔥 DANGEROUS ATTACK - REAL MADRID");
  const [ballX, setBallX] = useState(72);
  const [ballY, setBallY] = useState(48);

  // SGP Bet Builder selections
  const [sgpSelections, setSgpSelections] = useState<string[]>(["HOME_WIN"]);

  const toggleSgp = (id: string) => {
    setSgpSelections((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Dynamic SGP compound odds calculator
  const calculateSgpOdds = () => {
    let base = 1.0;
    if (sgpSelections.includes("HOME_WIN")) base *= 2.1;
    if (sgpSelections.includes("OVER_2_5")) base *= 1.75;
    if (sgpSelections.includes("BTTS_YES")) base *= 1.65;
    if (sgpSelections.includes("VINICIUS_GOAL")) base *= 2.4;
    return Math.max(1.0, Math.floor(base * 100) / 100);
  };

  // Live pitch ball animation loop
  useEffect(() => {
    const actions = [
      { text: "⚽ DANGEROUS ATTACK - REAL MADRID", x: 78, y: 52 },
      { text: "⛳ CORNER KICK - REAL MADRID", x: 92, y: 15 },
      { text: "🛡️ COUNTER ATTACK - MAN CITY", x: 35, y: 60 },
      { text: "🎯 SHOT ON TARGET - VINICIUS JR", x: 86, y: 50 },
      { text: "🧤 SAVED BY EDERSON", x: 94, y: 50 },
    ];

    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % actions.length;
      setActionText(actions[idx].text);
      setBallX(actions[idx].x);
      setBallY(actions[idx].y);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="overflow-hidden border-white/10 bg-[#0A0E17] shadow-2xl">
      {/* Header Tabs */}
      <div className="flex border-b border-white/10 bg-black/40 px-4">
        <button
          onClick={() => setActiveTab("TRACKER")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "TRACKER" ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          2D Live Match Tracker
        </button>
        <button
          onClick={() => setActiveTab("BUILDER")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "BUILDER" ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          Bet builder
        </button>
        <button
          onClick={() => setActiveTab("STATS")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "STATS" ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          Live Match Stats
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* TAB 1: 2D PITCH TRACKER */}
        {activeTab === "TRACKER" && (
          <div className="space-y-3">
            {/* Live Score Banner */}
            <div className="flex items-center justify-between bg-black/60 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                  <Radio className="h-3 w-3" /> LIVE {minute}&apos;
                </span>
                <span className="font-bold text-xs text-white">{homeTeam} vs {awayTeam}</span>
              </div>
              <span className="font-mono text-lg font-black text-gold">
                {homeScore} - {awayScore}
              </span>
            </div>

            {/* Simulated 2D Football Pitch SVG */}
            <div className="relative aspect-[2/1] w-full rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border-2 border-white/20 p-2 shadow-inner overflow-hidden">
              {/* Pitch markings */}
              <div className="absolute inset-2 border border-white/30 rounded-xl" />
              <div className="absolute top-2 bottom-2 left-1/2 w-0.5 bg-white/30 -translate-x-1/2" />
              <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
              {/* Penalty boxes */}
              <div className="absolute top-1/4 bottom-1/4 left-2 w-14 border-r border-t border-b border-white/30" />
              <div className="absolute top-1/4 bottom-1/4 right-2 w-14 border-l border-t border-b border-white/30" />

              {/* Animated Live Ball */}
              <div
                className="absolute w-4 h-4 rounded-full bg-yellow-300 border-2 border-black shadow-[0_0_15px_rgba(251,191,36,1)] transition-all duration-700 ease-out -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${ballX}%`, top: `${ballY}%` }}
              >
                <div className="w-full h-full rounded-full animate-ping bg-yellow-400 opacity-75" />
              </div>

              {/* Live Action Ticker Banner at Bottom of Pitch */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/80 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 shadow-lg">
                <span className="font-bold text-[11px] text-amber-300 tracking-wider">
                  {actionText}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BET BUILDER (SAME GAME PARLAY) */}
        {activeTab === "BUILDER" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">Same Game Parlay Builder</h4>
                <p className="text-xs text-muted-foreground">Combine multiple outcomes in this match for boosted odds</p>
              </div>
              <div className="rounded-xl bg-gold/20 border border-gold/40 px-3 py-1 text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Combined Odds</span>
                <span className="font-mono text-base font-black text-gold">{calculateSgpOdds().toFixed(2)}</span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { id: "HOME_WIN", label: "Real Madrid to Win", odds: "2.10" },
                { id: "OVER_2_5", label: "Over 2.5 Total Goals", odds: "1.75" },
                { id: "BTTS_YES", label: "Both Teams to Score (Yes)", odds: "1.65" },
                { id: "VINICIUS_GOAL", label: "Vinicius Jr. Anytime Goalscorer", odds: "2.40" },
              ].map((opt) => {
                const isSelected = sgpSelections.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleSgp(opt.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                        : "bg-black/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{opt.label}</p>
                      <span className="font-mono text-[11px] text-gold font-bold">{opt.odds}</span>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        isSelected ? "bg-gold border-gold text-black" : "border-white/20"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button className="w-full h-11 bg-gold text-black font-black hover:brightness-110">
              ADD PARLAY TO BET SLIP ({calculateSgpOdds().toFixed(2)})
            </Button>
          </div>
        )}

        {/* TAB 3: STATS */}
        {activeTab === "STATS" && (
          <div className="space-y-3 text-xs">
            {[
              { label: "Possession", home: "54%", away: "46%" },
              { label: "Total Shots", home: "14", away: "9" },
              { label: "Shots on Target", home: "7", away: "4" },
              { label: "Corner Kicks", home: "6", away: "3" },
              { label: "Fouls", home: "8", away: "11" },
            ].map((st, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between font-bold text-muted-foreground">
                  <span className="text-white">{st.home}</span>
                  <span>{st.label}</span>
                  <span className="text-white">{st.away}</span>
                </div>
                <div className="flex h-2 w-full rounded-full bg-black/60 overflow-hidden border border-white/5">
                  <div
                    className="bg-gold"
                    style={{ width: `${(parseInt(st.home) / (parseInt(st.home) + parseInt(st.away))) * 100}%` }}
                  />
                  <div
                    className="bg-blue-500"
                    style={{ width: `${(parseInt(st.away) / (parseInt(st.home) + parseInt(st.away))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
