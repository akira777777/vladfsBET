"use client";

import { useState } from "react";
import { Package, Sparkles, Crown, Gift, CheckCircle2, Lock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";

interface LootCrate {
  id: string;
  name: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";
  costPoints: number;
  topPrize: string;
  color: string;
  glow: string;
  possiblePrizes: { label: string; amount: number; chance: string }[];
}

const CRATES: LootCrate[] = [
  {
    id: "crate-bronze",
    name: "Bronze Starter Crate",
    tier: "BRONZE",
    costPoints: 100,
    topPrize: "$100.00",
    color: "from-amber-900 to-amber-700 border-amber-700/50",
    glow: "rgba(180,83,9,0.3)",
    possiblePrizes: [
      { label: "$5 Credits", amount: 5, chance: "50%" },
      { label: "$15 Credits", amount: 15, chance: "30%" },
      { label: "$50 Credits", amount: 50, chance: "15%" },
      { label: "$100 Top Prize", amount: 100, chance: "5%" },
    ],
  },
  {
    id: "crate-silver",
    name: "Silver Prestige Crate",
    tier: "SILVER",
    costPoints: 250,
    topPrize: "$500.00",
    color: "from-slate-800 to-slate-600 border-slate-400/50",
    glow: "rgba(148,163,184,0.3)",
    possiblePrizes: [
      { label: "$25 Credits", amount: 25, chance: "45%" },
      { label: "$75 Credits", amount: 75, chance: "35%" },
      { label: "$200 Credits", amount: 200, chance: "15%" },
      { label: "$500 Top Prize", amount: 500, chance: "5%" },
    ],
  },
  {
    id: "crate-gold",
    name: "Gold High Roller Crate",
    tier: "GOLD",
    costPoints: 750,
    topPrize: "$2,500.00",
    color: "from-amber-700 to-yellow-600 border-amber-400/50",
    glow: "rgba(250,204,21,0.4)",
    possiblePrizes: [
      { label: "$100 Credits", amount: 100, chance: "40%" },
      { label: "$350 Credits", amount: 350, chance: "35%" },
      { label: "$1,000 Credits", amount: 1000, chance: "20%" },
      { label: "$2,500 Top Prize", amount: 2500, chance: "5%" },
    ],
  },
  {
    id: "crate-diamond",
    name: "Diamond Legend Vault",
    tier: "DIAMOND",
    costPoints: 2000,
    topPrize: "$10,000.00",
    color: "from-purple-900 via-pink-900 to-purple-950 border-purple-500/60",
    glow: "rgba(217,70,239,0.5)",
    possiblePrizes: [
      { label: "$500 Credits", amount: 500, chance: "40%" },
      { label: "$1,500 Credits", amount: 1500, chance: "35%" },
      { label: "$4,000 Credits", amount: 4000, chance: "20%" },
      { label: "$10,000 GRAND PRIZE", amount: 10000, chance: "5%" },
    ],
  },
];

export default function LootBoxesPage() {
  const { user, refreshWallet } = useAuth();
  const [userVipPoints, setUserVipPoints] = useState(1250);
  const [opening, setOpening] = useState<string | null>(null);
  const [unboxedPrize, setUnboxedPrize] = useState<{ crateName: string; label: string; amount: number } | null>(null);

  const handleOpenCrate = async (crate: LootCrate) => {
    if (opening || userVipPoints < crate.costPoints) return;

    setOpening(crate.id);
    setUserVipPoints((prev) => prev - crate.costPoints);

    // Roll random prize
    const rand = Math.random();
    let won = crate.possiblePrizes[0];
    if (rand > 0.95) won = crate.possiblePrizes[3];
    else if (rand > 0.75) won = crate.possiblePrizes[2];
    else if (rand > 0.45) won = crate.possiblePrizes[1];

    setTimeout(async () => {
      setOpening(null);
      setUnboxedPrize({
        crateName: crate.name,
        label: won.label,
        amount: won.amount,
      });

      // Credit wallet
      try {
        await api("/api/wallet/demo-credit", {
          method: "POST",
          body: JSON.stringify({ amount: won.amount.toString() }),
        });
        void refreshWallet();
      } catch {}
    }, 3000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-gradient-to-r from-[#170524] via-[#240838] to-[#0d0214] p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 border border-purple-500/40 px-4 py-1 text-xs font-bold text-purple-300">
            <Package className="h-4 w-4" /> VIP LOOT BOX UNBOXING
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Unlock Mystery Crates &amp; Win up to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-purple-400">$10,000</span>
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Redeem your accumulated VIP loyalty points for high-tier mystery crates with guaranteed credit drop rates.
          </p>
        </div>

        {/* User Points Display Badge */}
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-black/60 border border-white/10 px-5 py-2.5 backdrop-blur-md">
          <Crown className="h-5 w-5 text-gold" />
          <div className="text-xs">
            <span className="text-muted-foreground uppercase font-bold block">Available VIP Points</span>
            <span className="font-mono text-lg font-black text-gold">{userVipPoints.toLocaleString()} PTS</span>
          </div>
        </div>
      </div>

      {/* Crates Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CRATES.map((crate) => {
          const isOpeningThis = opening === crate.id;
          const canAfford = userVipPoints >= crate.costPoints;

          return (
            <Card
              key={crate.id}
              className={`relative overflow-hidden p-6 border-2 bg-gradient-to-b ${crate.color} text-white space-y-4 shadow-2xl transition-all duration-300 ${
                isOpeningThis ? "animate-pulse scale-105" : "hover:scale-[1.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-black/60 px-3 py-1 font-mono text-xs font-black text-gold">
                  {crate.costPoints} PTS
                </span>
                <span className="text-[10px] uppercase font-bold text-white/80">
                  Top: {crate.topPrize}
                </span>
              </div>

              {/* 3D Crate Graphic */}
              <div className="flex flex-col items-center justify-center my-4">
                <div
                  className={`w-28 h-28 rounded-3xl bg-black/40 border-2 border-white/20 flex items-center justify-center text-5xl shadow-2xl ${
                    isOpeningThis ? "animate-bounce" : ""
                  }`}
                >
                  📦
                </div>
                <h3 className="font-extrabold text-base text-white mt-3 text-center">{crate.name}</h3>
              </div>

              {/* Possible Drops */}
              <div className="rounded-xl bg-black/50 p-3 border border-white/10 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Possible Drops:</span>
                {crate.possiblePrizes.map((p, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="text-neutral-300">{p.label}</span>
                    <span className="font-mono text-gold font-semibold">{p.chance}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleOpenCrate(crate)}
                disabled={Boolean(opening) || !canAfford}
                className={`w-full h-11 text-xs font-black uppercase tracking-wider ${
                  canAfford
                    ? "bg-gradient-to-r from-gold to-yellow-400 text-black hover:brightness-110 shadow-lg shadow-gold/20"
                    : "bg-black/60 text-muted-foreground cursor-not-allowed border border-white/10"
                }`}
              >
                {isOpeningThis
                  ? "UNBOXING..."
                  : canAfford
                  ? `OPEN CRATE (${crate.costPoints} PTS)`
                  : "INSUFFICIENT POINTS"}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Unboxed Winner Modal */}
      {unboxedPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-md w-full rounded-3xl bg-neutral-950 border-2 border-amber-400 p-8 text-center space-y-6 shadow-2xl animate-in zoom-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-black mx-auto flex items-center justify-center text-4xl shadow-2xl animate-bounce">
              🎉
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-gold">
                {unboxedPrize.crateName}
              </span>
              <h3 className="text-3xl font-black text-white">{unboxedPrize.label}</h3>
              <p className="text-xs text-muted-foreground">
                +${unboxedPrize.amount.toFixed(2)} has been credited instantly to your demo balance!
              </p>
            </div>

            <Button
              onClick={() => setUnboxedPrize(null)}
              className="w-full h-12 text-base font-bold bg-gold text-black hover:brightness-110"
            >
              COLLECT REWARD
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
