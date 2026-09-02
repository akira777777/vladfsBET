"use client";

import React, { useState } from "react";
import { SlotTheme } from "@/lib/slots/slot-themes";
import { SlotSymbolIcon } from "./slot-symbols";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface SlotPaytableModalProps {
  theme: SlotTheme;
  betAmount: number;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SlotPaytableModal({
  theme,
  betAmount,
  currency,
  isOpen,
  onClose,
}: SlotPaytableModalProps) {
  const [activeTab, setActiveTab] = useState<"PAYOUTS" | "MULTIPLIERS" | "RULES">("PAYOUTS");

  if (!isOpen) return null;

  const symbolsList = Object.values(theme.symbols);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative flex flex-col max-h-[90vh] max-w-4xl w-full rounded-3xl bg-neutral-950 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6 bg-neutral-900/60">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{theme.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {theme.rtp} theoretical RTP (sandbox)
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">6x5 Cluster Pays &amp; Dynamic Megaways Engine</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full w-9 h-9 p-0 text-white/70 hover:text-white hover:bg-white/10"
          >
            ✕
          </Button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-white/10 bg-black/40 px-6">
          <button
            onClick={() => setActiveTab("PAYOUTS")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "PAYOUTS"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Cluster Payouts (8+)
          </button>
          <button
            onClick={() => setActiveTab("MULTIPLIERS")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "MULTIPLIERS"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Multiplier Orbs (2x - 500x)
          </button>
          <button
            onClick={() => setActiveTab("RULES")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "RULES"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Tumble Mechanics &amp; Megaways
          </button>
        </div>

        {/* Modal body scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CLUSTER PAYOUTS */}
          {activeTab === "PAYOUTS" && (
            <div>
              <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200/90 flex items-center justify-between">
                <span>Cluster wins pay anywhere on the 6x5 grid! Calculated for bet: <strong>{formatMoney(betAmount, currency)}</strong></span>
                <span>(Minimum 8 Matching Symbols)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {symbolsList.map((sym) => {
                  const p8 = sym.payouts ? betAmount * (sym.payouts.cluster8 || sym.payouts[3] * 0.4 || 1) : 0;
                  const p10 = sym.payouts ? betAmount * (sym.payouts.cluster10 || sym.payouts[4] * 0.6 || 2) : 0;
                  const p12 = sym.payouts ? betAmount * (sym.payouts.cluster12 || sym.payouts[5] * 1.0 || 5) : 0;

                  return (
                    <div
                      key={sym.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-white/20 transition-colors"
                    >
                      <div className="shrink-0">
                        <SlotSymbolIcon id={sym.id} theme={theme} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{sym.name}</p>
                        <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground tabular-nums">
                          <div className="flex justify-between">
                            <span>12+ Cluster:</span>
                            <span className="font-semibold text-amber-300">{formatMoney(p12, currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>10-11 Cluster:</span>
                            <span className="font-semibold text-white/80">{formatMoney(p10, currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>8-9 Cluster:</span>
                            <span className="font-semibold text-white/60">{formatMoney(p8, currency)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MULTIPLIER ORBS */}
          {activeTab === "MULTIPLIERS" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Multiplier Orbs can drop onto the 6x5 grid during any normal or free spin. When symbols tumble, multiplier orbs remain and charge with electric energy. At the end of all cascades, all multiplier values sum together and multiply the total tumble round win!
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { range: "2x, 3x, 5x", tier: "Electric Cyan", color: "border-sky-500/40 bg-sky-950/20 text-sky-300" },
                  { range: "10x, 25x", tier: "Arcane Violet", color: "border-purple-500/40 bg-purple-950/20 text-purple-300" },
                  { range: "50x, 100x", tier: "Golden Sunfire", color: "border-amber-500/40 bg-amber-950/20 text-amber-300" },
                  { range: "250x, 500x", tier: "Legendary Crimson", color: "border-red-500/40 bg-red-950/20 text-red-300" },
                ].map((orb, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border text-center space-y-2 ${orb.color}`}>
                    <span className="text-2xl font-black block">{orb.range}</span>
                    <span className="text-xs font-bold uppercase tracking-wider">{orb.tier}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RULES & MEGAWAYS */}
          {activeTab === "RULES" && (
            <div className="space-y-4 text-xs text-white/80 leading-relaxed">
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2">
                <h4 className="text-sm font-bold text-amber-300">CASCADING TUMBLE FEATURE</h4>
                <p>
                  Winning clusters explode and disappear with particle shatter effects. The remaining symbols drop to the bottom of the grid and new symbols cascade in from the top to fill empty positions. Tumbles chain indefinitely as long as new winning clusters form!
                </p>
              </div>

              <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2">
                <h4 className="text-sm font-bold text-pink-300">MEGAWAYS™ DYNAMIC REELS MODE</h4>
                <p>
                  In Megaways mode, each of the 6 reels dynamically varies between 2 and 7 symbols per spin, offering up to <strong>117,649 Ways to Win</strong>. Wins pay for matching adjacent symbols on any row from left to right.
                </p>
              </div>

              <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2">
                <h4 className="text-sm font-bold text-cyan-300">SCATTER &amp; FREE SPINS BONUS</h4>
                <p>
                  Landing 4 or more Scatter symbols anywhere on the grid awards up to <strong>20 Free Spins</strong> with persistent accumulated multiplier values that do not reset between spins!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 bg-neutral-900/60 flex justify-end">
          <Button onClick={onClose} className="font-bold">
            Close Paytable
          </Button>
        </div>
      </div>
    </div>
  );
}
