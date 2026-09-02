"use client";

import { useState } from "react";
import { Users, DollarSign, TrendingUp, Copy, Check, ShieldCheck, ArrowRight, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";

export default function AffiliatesPage() {
  const { user } = useAuth();
  const [customCode, setCustomCode] = useState("VLAD777");
  const [copied, setCopied] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const referralLink = `https://vladfsbet.com/r/${customCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = () => {
    setClaimed(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-[#00170a] via-[#002a14] to-[#000c05] p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-400">
            <Users className="h-4 w-4" /> VLADFSBET PARTNERS PROGRAM
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Earn up to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">45% Lifetime RevShare</span>
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Invite players with your custom referral link. Earn lifetime revenue share on every casino spin, table game bet, and sports wager with zero negative carryover.
          </p>
        </div>
      </div>

      {/* Referral Link Generator */}
      <Card className="p-6 border-white/10 bg-neutral-950/80 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-white">Your Unique Referral Link</h3>
            <p className="text-xs text-muted-foreground">Share this link across Telegram, Twitter, Twitch, or your website</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Active Tier: Gold (35% RevShare)
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={referralLink}
            readOnly
            className="font-mono text-sm bg-black/60 border-white/10 text-emerald-300"
          />
          <Button
            onClick={handleCopy}
            className="h-10 px-6 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" /> Copy Link
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* KPI Performance Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Clicks", value: "1,420", change: "+14% this week", icon: Share2 },
          { label: "Registered Signups", value: "86", change: "6.05% conversion", icon: Users },
          { label: "First Time Depositors (FTD)", value: "42", change: "48.8% FTD rate", icon: DollarSign },
          { label: "Net Gaming Revenue (NGR)", value: "$38,500.00", change: "Total Player Volume", icon: TrendingUp },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-5 border-white/10 bg-[#0A0E17] space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">{kpi.label}</span>
                <Icon className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="font-mono text-2xl font-black text-white">{kpi.value}</p>
              <p className="text-[11px] text-emerald-400 font-medium">{kpi.change}</p>
            </Card>
          );
        })}
      </div>

      {/* Commission Earnings & Cashout Box */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="p-6 border-white/10 bg-neutral-950/80 lg:col-span-8 space-y-4">
          <h3 className="font-bold text-base text-white">Tiered RevShare Commission Structure</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { tier: "Bronze", share: "25%", req: "1 - 10 FTDs", active: false },
              { tier: "Silver", share: "30%", req: "11 - 25 FTDs", active: false },
              { tier: "Gold", share: "35%", req: "26 - 50 FTDs", active: true },
              { tier: "Diamond VIP", share: "45%", req: "50+ FTDs", active: false },
            ].map((t, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-center space-y-1.5 transition-all ${
                  t.active
                    ? "bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] scale-105"
                    : "bg-black/40 border-white/5"
                }`}
              >
                <span className="text-xs font-bold text-muted-foreground uppercase">{t.tier}</span>
                <span className="font-mono text-2xl font-black text-white block">{t.share}</span>
                <span className="text-[10px] text-muted-foreground block">{t.req}</span>
                {t.active && (
                  <span className="inline-block text-[9px] font-black uppercase text-emerald-300 bg-emerald-500/30 px-2 py-0.5 rounded-full mt-1">
                    Current Tier
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Cashout Card */}
        <Card className="p-6 border-white/10 bg-[#0A0E17] lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Available Commission</span>
            <p className="font-mono text-3xl font-black text-white">$2,450.00</p>
            <p className="text-xs text-muted-foreground">Lifetime Paid: $11,025.00</p>
          </div>

          <Button
            onClick={handleClaim}
            disabled={claimed}
            size="lg"
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-500/20"
          >
            {claimed ? "✓ COMMISSION CLAIMED" : "CLAIM COMMISSION ($2,450)"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
