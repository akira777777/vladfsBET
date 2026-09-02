"use client";

import Image from "next/image";
import Link from "next/link";
import { GameRail } from "@/components/game-rail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Trophy,
  Shield,
  Crown,
  Gift,
  Radio,
  Award,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { LIVE_SLUGS, ORIGINALS_SLUGS, SLOT_SLUGS } from "@/lib/games-catalog";
import { JackpotTicker } from "@/components/jackpot-ticker";
import { LiveBetsTable } from "@/components/live-bets-table";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      <section className="relative isolate min-h-[75vh] overflow-hidden">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/75 to-black/40" />

        <div className="relative mx-auto flex min-h-[75vh] max-w-7xl flex-col justify-end gap-6 px-4 pb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 border border-gold/40 px-3 py-1 text-xs font-bold text-gold backdrop-blur-sm w-fit">
            <Sparkles className="h-3.5 w-3.5" />
            <span>DEMO CASINO · VIRTUAL CREDITS</span>
          </div>

          <h1 className="font-heading max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
            THE GAME <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-amber-500">STARTS HERE</span>
          </h1>

          <p className="max-w-xl text-base text-white/85 sm:text-lg">
            Premium casino entertainment. Built around you. Provably fair originals, live tables, and a global sportsbook — sandbox only.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button size="lg" variant="gold" className="h-12 px-8 text-base" asChild>
              <Link href="/casino">Play now</Link>
            </Button>
            {!user ? (
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/20 bg-black/40 text-white font-bold backdrop-blur-sm hover:bg-white/10" asChild>
                <Link href="/register">Create demo account</Link>
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/20 bg-black/40 text-white font-bold backdrop-blur-sm hover:bg-white/10" asChild>
                <Link href="/wallet">Cashier</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Slots", href: "/casino?category=SLOTS", icon: Sparkles, image: "/games/gates-of-vladfs.jpg", desc: "Studio reels" },
            { label: "Live", href: "/live-casino", icon: Radio, image: "/games/lightning-roulette.jpg", desc: "Tables & studios" },
            { label: "Sports", href: "/sports", icon: Trophy, image: "/hero.jpg", desc: "Live odds" },
            { label: "VIP", href: "/vip", icon: Crown, image: "/games/quantum-blackjack.jpg", desc: "Sandbox cashback" },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className="group relative overflow-hidden rounded-2xl border border-white/10 min-h-[140px]"
              >
                <Image src={cat.image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
                <div className="relative z-10 flex h-full flex-col justify-end p-5">
                  <div className="mb-2 h-9 w-9 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-bold text-white group-hover:text-gold transition-colors">{cat.label}</h2>
                  <p className="text-xs text-white/70">{cat.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Live Progressive Jackpot Vault */}
        <JackpotTicker />

        <GameRail title="VladfsBET Originals" href="/casino?category=ORIGINALS" slugs={[...ORIGINALS_SLUGS]} />
        <GameRail title="Featured slots" href="/casino?category=SLOTS" slugs={[...SLOT_SLUGS]} />
        <GameRail title="Live tables" href="/live-casino" slugs={[...LIVE_SLUGS]} />

        {/* Live Community Bets Feed */}
        <LiveBetsTable />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-purple-500/30 bg-gradient-to-br from-[#1b0a2f] to-[#0A0E17] p-8 text-white space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
              <Gift className="h-3.5 w-3.5" />
              <span>WELCOME</span>
            </div>
            <h2 className="font-heading text-2xl font-bold">100% match up to $500 virtual</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              First sandbox deposit is matched in bonus credits. 30x wagering on eligible slots. Terms before activation.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold" asChild>
              <Link href="/promotions">View offers</Link>
            </Button>
          </Card>

          <Card className="border-gold/30 bg-gradient-to-br from-[#241a05] to-[#0A0E17] p-8 text-white space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold">
              <Crown className="h-3.5 w-3.5" />
              <span>VIP</span>
            </div>
            <h2 className="font-heading text-2xl font-bold">VladfsBET VIP Club</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Points on every sandbox bet. Bronze to Diamond. Weekly cashback is virtual and not payable in cash.
            </p>
            <Button variant="gold" asChild>
              <Link href="/vip">Explore tiers</Link>
            </Button>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-gold">The VladfsBET Advantage</span>
            <h2 className="font-heading text-3xl font-extrabold text-white">Engineered for transparency</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Double-entry ledger",
                body: "Available, bonus, locked, and pending balances post as immutable journals. The client never owns the balance.",
              },
              {
                icon: Zap,
                title: "Provably fair RNG",
                body: "HMAC-SHA256 with a published server-seed hash. Verify any original round in the fairness dialog.",
              },
              {
                icon: Award,
                title: "AML monitoring",
                body: "Velocity rules and risk scoring on sandbox flows so the operator console can be exercised end to end.",
              },
              {
                icon: CheckCircle2,
                title: "Responsible gaming",
                body: "Deposit, loss, and wager limits, reality checks, cooling-off, and self-exclusion — self-service.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-white/10 bg-[#0A0E17] p-6 text-white space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
