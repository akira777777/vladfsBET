"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, TrendingUp, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export interface BetSelection {
  eventId: string;
  eventName: string;
  marketId: string;
  marketName: string;
  selectionId: string;
  selectionName: string;
  odds: number;
}

interface BetSlipProps {
  selections: BetSelection[];
  onRemoveSelection: (selectionId: string) => void;
  onClearAll: () => void;
}

export function BetSlip({ selections, onRemoveSelection, onClearAll }: BetSlipProps) {
  const { user, refreshWallet } = useAuth();
  const [stake, setStake] = useState("10");
  const [placing, setPlacing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1);
  const stakeNum = parseFloat(stake) || 0;
  const potentialReturn = (stakeNum * totalOdds).toFixed(2);

  const handlePlaceBet = async () => {
    if (!user || selections.length === 0) return;
    setPlacing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const primary = selections[0];
      await api("/api/sports/bet", {
        method: "POST",
        body: JSON.stringify({
          eventId: primary.eventId,
          marketId: primary.marketId,
          selectionName: primary.selectionName,
          odds: primary.odds.toString(),
          stake: stakeNum.toString(),
        }),
      });

      setSuccessMsg(`Bet placed successfully! Potential win: $${potentialReturn}`);
      await refreshWallet();
      setTimeout(() => {
        onClearAll();
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Card className="flex flex-col justify-between border-white/10 bg-[#0A0E17] p-4 text-white shadow-xl">
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" />
            <span className="text-sm font-bold uppercase tracking-wider text-gold">Bet Slip</span>
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-extrabold text-gold">
              {selections.length}
            </span>
          </div>
          {selections.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {selections.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Your bet slip is empty.<br />Click on any odds to add selections.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {selections.map((sel) => (
              <div
                key={sel.selectionId}
                className="relative rounded-lg bg-black/40 p-3 ring-1 ring-white/5 group"
              >
                <button
                  onClick={() => onRemoveSelection(sel.selectionId)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <p className="text-[11px] text-muted-foreground truncate pr-6">{sel.eventName}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-white">{sel.selectionName}</span>
                  <span className="text-xs font-mono font-extrabold text-gold">{sel.odds.toFixed(2)}</span>
                </div>
                <span className="text-[10px] text-blue-400">{sel.marketName}</span>
              </div>
            ))}
          </div>
        )}

        {errorMsg && (
          <div className="my-2 rounded bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="my-2 flex items-center gap-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 p-2 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {selections.length > 0 && (
        <div className="border-t border-white/10 pt-3 mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Odds:</span>
            <span className="font-mono font-bold text-gold text-sm">{totalOdds.toFixed(2)}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Stake ($):</span>
              <span className="text-white font-mono font-bold">${stakeNum.toFixed(2)}</span>
            </div>
            <div className="flex gap-1.5">
              <Input
                type="number"
                min="1"
                max="1000"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="h-9 text-xs font-mono bg-black/40 border-white/10"
              />
              {[10, 25, 50, 100].map((val) => (
                <button
                  key={val}
                  onClick={() => setStake(val.toString())}
                  className="rounded px-2 text-[11px] font-bold bg-white/5 border border-white/10 hover:bg-white/15"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs rounded bg-white/5 p-2">
            <span className="text-muted-foreground font-medium">Potential Payout:</span>
            <span className="font-mono font-extrabold text-emerald-400 text-sm">${potentialReturn}</span>
          </div>

          <Button
            onClick={handlePlaceBet}
            disabled={placing || selections.length === 0}
            className="w-full h-11 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black hover:brightness-110 shadow-lg shadow-gold/20"
          >
            {placing ? "PLACING BET..." : `PLACE BET ($${stakeNum.toFixed(2)})`}
          </Button>
        </div>
      )}
    </Card>
  );
}
