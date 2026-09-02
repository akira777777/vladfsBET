"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { Crown, Sparkles, CheckCircle2 } from "lucide-react";

const VIP_TIERS = [
  {
    name: "Bronze",
    rank: 1,
    pointsRequired: 0,
    cashback: "0%",
    perks: ["Standard 24/7 Support", "Access to All Sandbox Games", "Basic Welcome Package"],
    badgeColor: "from-amber-700 to-amber-900",
  },
  {
    name: "Silver",
    rank: 2,
    pointsRequired: 5000,
    cashback: "2%",
    perks: ["2% Weekly Cashback", "Priority Ticket Support", "Monthly Reload Bonus"],
    badgeColor: "from-slate-400 to-slate-600",
  },
  {
    name: "Gold",
    rank: 3,
    pointsRequired: 25000,
    cashback: "5%",
    perks: ["5% Weekly Cashback", "Dedicated VIP Manager", "Birthday Bonus Reward", "Higher Table Limits"],
    badgeColor: "from-yellow-400 to-amber-600",
  },
  {
    name: "Platinum",
    rank: 4,
    pointsRequired: 100000,
    cashback: "10%",
    perks: ["10% Weekly Cashback", "Instant Withdrawal Approvals", "Exclusive Tournament Invites", "Custom High Roller Promos"],
    badgeColor: "from-cyan-400 to-blue-600",
  },
  {
    name: "Diamond Legend",
    rank: 5,
    pointsRequired: 500000,
    cashback: "15%",
    perks: ["15% Weekly Cashback", "Personal 24/7 Concierge", "Tailor-made High Roller Limits", "VIP Luxury Gifts"],
    badgeColor: "from-purple-400 via-pink-500 to-indigo-600",
  },
];

export default function VipPage() {
  const { user, refreshWallet } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentTier = user?.vipTier?.name ?? "Bronze";
  const points = parseInt(user?.vipTier?.points ?? "0") || 0;

  const handleClaimCashback = async () => {
    if (!user) return;
    setClaiming(true);
    setErrorMsg(null);
    setClaimMsg(null);

    try {
      const res = await api<{ result: { amount: string; tier: string } }>("/api/vip/claim-cashback", {
        method: "POST",
      });
      setClaimMsg(`Claimed $${res.result.amount} cashback for ${res.result.tier} VIP tier!`);
      await refreshWallet();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No cashback currently available to claim.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-[#1f1607] via-[#140e04] to-[#0a0d14] p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold">
            <Crown className="h-4 w-4 text-gold" />
            <span>VLADFSBET ELITE VIP CLUB</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            VIP Club
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Every $1 sandbox wager earns 1 VIP point. Weekly cashback is virtual credit, not payable cash.
          </p>
        </div>
      </div>

      {/* User Progress Card */}
      {user && (
        <Card className="border-gold/30 bg-[#0A0E17] p-6 text-white shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Current VIP Status</span>
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-gold" />
                <h2 className="text-2xl font-black text-gold">{currentTier}</h2>
                <span className="rounded-full bg-gold/20 px-3 py-0.5 text-xs font-mono font-bold text-gold">
                  {points.toLocaleString()} Points
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleClaimCashback}
                disabled={claiming}
                className="bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold text-xs hover:brightness-110 shadow-lg shadow-gold/20 h-11 px-6"
              >
                {claiming ? "Claiming..." : "Claim VIP Rakeback & Cashback"}
              </Button>
            </div>
          </div>

          {/* Progress to Next VIP Tier */}
          <div className="space-y-2 rounded-xl bg-black/40 border border-white/5 p-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">Progression to Next Tier:</span>
              <span className="font-mono font-bold text-gold">
                {points < 5000 ? `${((points / 5000) * 100).toFixed(1)}% to Silver` :
                 points < 25000 ? `${(((points - 5000) / 20000) * 100).toFixed(1)}% to Gold` :
                 points < 100000 ? `${(((points - 25000) / 75000) * 100).toFixed(1)}% to Platinum` :
                 points < 500000 ? `${(((points - 100000) / 400000) * 100).toFixed(1)}% to Diamond` : "MAX TIER ACHIEVED"}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-neutral-800 overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                style={{
                  width: `${Math.min(100, Math.max(5, (points / (points < 5000 ? 5000 : points < 25000 ? 25000 : points < 100000 ? 100000 : 500000)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {claimMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{claimMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
              {errorMsg}
            </div>
          )}
        </Card>
      )}

      {/* VIP Tiers Ladder */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" /> VIP Tier Ladder & Benefits
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {VIP_TIERS.map((tier) => {
            const isCurrent = currentTier.toLowerCase().includes(tier.name.toLowerCase());
            return (
              <Card
                key={tier.name}
                className={`flex flex-col justify-between border p-5 text-white transition-all ${
                  isCurrent ? "border-gold ring-2 ring-gold/50 bg-[#121622] scale-[1.03] shadow-2xl" : "border-white/10 bg-[#0A0E17] hover:border-white/20"
                }`}
              >
                <div>
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tier.badgeColor} flex items-center justify-center mb-4 shadow-lg`}>
                    <Crown className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-xs font-mono text-gold mb-4">
                    {tier.pointsRequired === 0 ? "0 Points" : `${tier.pointsRequired.toLocaleString()} Points`}
                  </p>

                  <div className="rounded bg-black/40 p-2.5 mb-4 text-center">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Weekly Cashback</span>
                    <strong className="text-sm font-extrabold text-emerald-400">{tier.cashback}</strong>
                  </div>

                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {tier.perks.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isCurrent && (
                  <div className="mt-4 border-t border-gold/30 pt-3 text-center">
                    <span className="text-xs font-bold text-gold">★ Your Current Tier ★</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
