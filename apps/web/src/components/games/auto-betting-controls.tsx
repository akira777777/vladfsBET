"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AutoStrategy = "FIXED" | "MARTINGALE" | "DALEMBERT";

export interface AutoBetConfig {
  active: boolean;
  baseBet: number;
  currentBet: number;
  strategy: AutoStrategy;
  onLossMultiplier: number; // For Martingale (e.g. 2 for 100% increase)
  unitStep: number; // For D'Alembert
  stopProfit: number | null;
  stopLoss: number | null;
  maxBets: number; // 0 for infinite
  betsPlaced: number;
  totalProfit: number;
  winsCount: number;
  lossesCount: number;
}

export function useAutoBet(initialBaseBet = 10) {
  const [config, setConfig] = useState<AutoBetConfig>({
    active: false,
    baseBet: initialBaseBet,
    currentBet: initialBaseBet,
    strategy: "MARTINGALE",
    onLossMultiplier: 2.0,
    unitStep: initialBaseBet,
    stopProfit: null,
    stopLoss: null,
    maxBets: 0,
    betsPlaced: 0,
    totalProfit: 0,
    winsCount: 0,
    lossesCount: 0,
  });

  const startAuto = (baseBet: number) => {
    setConfig((prev) => ({
      ...prev,
      active: true,
      baseBet,
      currentBet: baseBet,
      unitStep: baseBet,
      betsPlaced: 0,
      totalProfit: 0,
      winsCount: 0,
      lossesCount: 0,
    }));
  };

  const stopAuto = () => {
    setConfig((prev) => ({ ...prev, active: false }));
  };

  const recordRound = (won: boolean, profit: number): { shouldContinue: boolean; nextBet: number } => {
    let shouldContinue = config.active;
    const newBetsPlaced = config.betsPlaced + 1;
    const newTotalProfit = config.totalProfit + profit;
    const newWins = config.winsCount + (won ? 1 : 0);
    const newLosses = config.lossesCount + (won ? 0 : 1);

    if (config.maxBets > 0 && newBetsPlaced >= config.maxBets) {
      shouldContinue = false;
    }
    if (config.stopProfit !== null && newTotalProfit >= config.stopProfit) {
      shouldContinue = false;
    }
    if (config.stopLoss !== null && newTotalProfit <= -Math.abs(config.stopLoss)) {
      shouldContinue = false;
    }

    let nextBet = config.currentBet;
    if (config.strategy === "MARTINGALE") {
      if (won) {
        nextBet = config.baseBet; // Reset to base bet on win
      } else {
        nextBet = Math.max(0.1, Math.round(config.currentBet * config.onLossMultiplier * 100) / 100);
      }
    } else if (config.strategy === "DALEMBERT") {
      if (won) {
        nextBet = Math.max(config.baseBet, Math.round((config.currentBet - config.unitStep) * 100) / 100);
      } else {
        nextBet = Math.round((config.currentBet + config.unitStep) * 100) / 100;
      }
    } else {
      nextBet = config.baseBet;
    }

    setConfig((prev) => ({
      ...prev,
      active: shouldContinue,
      currentBet: nextBet,
      betsPlaced: newBetsPlaced,
      totalProfit: newTotalProfit,
      winsCount: newWins,
      lossesCount: newLosses,
    }));

    return { shouldContinue, nextBet };
  };

  return { config, setConfig, startAuto, stopAuto, recordRound };
}

interface AutoBettingPanelProps {
  config: AutoBetConfig;
  onChange: (updater: (prev: AutoBetConfig) => AutoBetConfig) => void;
  disabled?: boolean;
}

export function AutoBettingPanel({ config, onChange, disabled }: AutoBettingPanelProps) {
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-4 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white">Auto Strategy Mode</span>
        <div className="flex rounded-lg bg-white/5 p-0.5">
          {(["MARTINGALE", "DALEMBERT", "FIXED"] as AutoStrategy[]).map((strat) => (
            <button
              key={strat}
              type="button"
              disabled={disabled || config.active}
              onClick={() => onChange((prev) => ({ ...prev, strategy: strat }))}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                config.strategy === strat
                  ? "bg-gold text-black shadow font-bold"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {strat === "MARTINGALE" ? "Martingale (2x)" : strat === "DALEMBERT" ? "D'Alembert" : "Flat"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {config.strategy === "MARTINGALE" && (
          <div>
            <label className="text-[11px] text-muted-foreground">On Loss Multiplier</label>
            <div className="mt-1 flex items-center gap-1">
              <Input
                type="number"
                step="0.1"
                min="1.1"
                max="10"
                disabled={disabled || config.active}
                value={config.onLossMultiplier}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 2.0;
                  onChange((prev) => ({ ...prev, onLossMultiplier: val }));
                }}
                className="h-8 text-xs bg-black/50"
              />
              <span className="text-muted-foreground">x</span>
            </div>
          </div>
        )}

        {config.strategy === "DALEMBERT" && (
          <div>
            <label className="text-[11px] text-muted-foreground">Unit Step ($)</label>
            <Input
              type="number"
              step="1"
              min="0.1"
              disabled={disabled || config.active}
              value={config.unitStep}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 10;
                onChange((prev) => ({ ...prev, unitStep: val }));
              }}
              className="mt-1 h-8 text-xs bg-black/50"
            />
          </div>
        )}

        <div>
          <label className="text-[11px] text-muted-foreground">Max Rounds (0 = ∞)</label>
          <Input
            type="number"
            min="0"
            disabled={disabled || config.active}
            value={config.maxBets}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 0;
              onChange((prev) => ({ ...prev, maxBets: val }));
            }}
            className="mt-1 h-8 text-xs bg-black/50"
          />
        </div>

        <div>
          <label className="text-[11px] text-muted-foreground">Stop on Profit ($)</label>
          <Input
            type="number"
            placeholder="No limit"
            disabled={disabled || config.active}
            value={config.stopProfit ?? ""}
            onChange={(e) => {
              const val = e.target.value ? parseFloat(e.target.value) : null;
              onChange((prev) => ({ ...prev, stopProfit: val }));
            }}
            className="mt-1 h-8 text-xs bg-black/50"
          />
        </div>

        <div>
          <label className="text-[11px] text-muted-foreground">Stop on Loss ($)</label>
          <Input
            type="number"
            placeholder="No limit"
            disabled={disabled || config.active}
            value={config.stopLoss ?? ""}
            onChange={(e) => {
              const val = e.target.value ? parseFloat(e.target.value) : null;
              onChange((prev) => ({ ...prev, stopLoss: val }));
            }}
            className="mt-1 h-8 text-xs bg-black/50"
          />
        </div>
      </div>

      {config.active && (
        <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-2.5 flex items-center justify-between">
          <div className="flex gap-3 text-[11px]">
            <span>Bets: <strong className="text-white">{config.betsPlaced}</strong></span>
            <span>W/L: <strong className="text-emerald-400">{config.winsCount}</strong>/<strong className="text-rose-400">{config.lossesCount}</strong></span>
            <span>Profit: <strong className={config.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {config.totalProfit >= 0 ? `+$${config.totalProfit.toFixed(2)}` : `-$${Math.abs(config.totalProfit).toFixed(2)}`}
            </strong></span>
          </div>
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
      )}
    </div>
  );
}
