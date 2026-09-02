"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Gift, Sparkles, CheckCircle2, Ticket } from "lucide-react";

interface BonusTemplate {
  id: string;
  slug: string;
  name: string;
  type: string;
  amount: string;
  wageringMultiplier: number;
  terms: string;
}

export default function PromotionsPage() {
  const { user, refreshWallet } = useAuth();
  const [templates, setTemplates] = useState<BonusTemplate[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api<{ items: BonusTemplate[] }>("/api/bonuses/templates")
      .then((data) => setTemplates(data.items || []))
      .catch(() => setTemplates([]));
  }, []);

  const handleClaim = async (slug: string) => {
    if (!user) return;
    setClaiming(slug);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api("/api/bonuses/claim", {
        method: "POST",
        body: JSON.stringify({ templateSlug: slug }),
      });
      setSuccessMsg("Bonus successfully activated to your bonus wallet!");
      await refreshWallet();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to claim bonus");
    } finally {
      setClaiming(null);
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !promoCode) return;
    setRedeeming(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api<{ result: { reward: string; title: string } }>("/api/bonuses/redeem-code", {
        method: "POST",
        body: JSON.stringify({ code: promoCode }),
      });
      setSuccessMsg(`Promo code redeemed! +$${res.result.reward} credited (${res.result.title}).`);
      setPromoCode("");
      await refreshWallet();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid or expired promotional code");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-[#170a2c] via-[#0f091f] to-[#0a0d14] p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
            <Gift className="h-3.5 w-3.5 text-purple-400" />
            <span>VLADFSBET REWARDS & PROMOTIONS</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Promotions
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Sandbox deposit matches, reloads, and promo codes. Wagering applies. Virtual credits only.
          </p>
        </div>
      </div>

      {/* Promo Code Input Bar */}
      <Card className="border-gold/30 bg-[#0A0E17] p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-gold" />
              <h2 className="text-base font-bold text-white">Have a Promotional Code?</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter codes like <code className="text-gold">VLADFSVIP</code> or <code className="text-gold">NEON777</code> to unlock instant sandbox credits.
            </p>
          </div>

          <form onSubmit={handleRedeemCode} className="flex gap-2 w-full md:w-auto">
            <Input
              type="text"
              placeholder="ENTER PROMO CODE"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="h-10 text-xs font-mono uppercase bg-black/40 border-white/10 w-full md:w-56"
            />
            <Button
              type="submit"
              disabled={redeeming || !promoCode}
              className="bg-gold text-black font-bold text-xs hover:bg-gold/90 shrink-0"
            >
              {redeeming ? "Redeeming..." : "Redeem Code"}
            </Button>
          </form>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </Card>

      {/* Active Bonus Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" /> Available Bonus Campaigns
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              className="flex flex-col justify-between border-white/10 bg-[#0A0E17] p-6 text-white transition-all hover:border-gold/30 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-[10px] font-extrabold text-gold uppercase tracking-wider">
                    {tpl.type}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {tpl.wageringMultiplier}x Wagering
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{tpl.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {tpl.terms}
                </p>
              </div>

              <div className="border-t border-white/5 pt-4 mt-2 flex items-center justify-between">
                <span className="font-mono font-bold text-gold text-lg">
                  {tpl.amount ? `$${parseFloat(tpl.amount).toFixed(2)}` : "Match Boost"}
                </span>

                <Button
                  onClick={() => handleClaim(tpl.slug)}
                  disabled={claiming === tpl.slug}
                  size="sm"
                  className="bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold hover:brightness-110 shadow"
                >
                  {claiming === tpl.slug ? "Claiming..." : "Claim Bonus"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
