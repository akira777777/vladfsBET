"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Radio } from "lucide-react";
import { gameArt } from "@/lib/format";

const LIVE_TABLES = [
  {
    slug: "lightning-roulette",
    title: "Lightning Roulette",
    category: "ROULETTE",
    minBet: "$0.50",
    maxBet: "$2,000",
  },
  {
    slug: "infinite-blackjack",
    title: "Infinite Blackjack VIP",
    category: "BLACKJACK",
    minBet: "$1.00",
    maxBet: "$5,000",
  },
  {
    slug: "dragon-baccarat",
    title: "Dragon Speed Baccarat",
    category: "BACCARAT",
    minBet: "$1.00",
    maxBet: "$1,000",
  },
  {
    slug: "crazy-time-deluxe",
    title: "Studio Wheel Deluxe",
    category: "GAME_SHOW",
    minBet: "$0.10",
    maxBet: "$2,500",
  },
  {
    slug: "monopoly-live-studio",
    title: "Studio Board Live",
    category: "GAME_SHOW",
    minBet: "$0.10",
    maxBet: "$1,000",
  },
];

export default function LiveCasinoPage() {
  const [filter, setFilter] = useState("ALL");
  const filtered =
    filter === "ALL" ? LIVE_TABLES : LIVE_TABLES.filter((t) => t.category === filter);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl border border-red-500/20 min-h-[200px]">
        <Image src={gameArt("lightning-roulette")} alt="" fill className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1f0b0e] via-[#14080a]/90 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-3 p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
            <span className="live-dot animate-pulse" />
            <Radio className="h-3.5 w-3.5" />
            <span>LIVE STUDIO · SANDBOX</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Live casino
          </h1>
          <p className="text-sm text-white/75">
            RNG tables styled as live studios. Occupancy is not simulated. Virtual credits only.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "ROULETTE", "BLACKJACK", "BACCARAT", "GAME_SHOW"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ring-1 ${
              filter === item
                ? "bg-amber-400 text-black ring-amber-400"
                : "text-muted-foreground ring-white/10 hover:bg-white/5"
            }`}
          >
            {item.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((table) => (
          <Link
            key={table.slug}
            href={`/casino/${table.slug}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0A0E17] hover:border-gold/40 transition-colors"
          >
            <div className="relative aspect-[16/10]">
              <Image src={gameArt(table.slug)} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-red-600/80 px-2 py-0.5 text-[10px] font-bold text-white">
                <span className="live-dot" />
                LIVE
              </span>
            </div>
            <div className="p-4 space-y-1">
              <h2 className="font-bold text-white group-hover:text-gold">{table.title}</h2>
              <p className="text-xs text-muted-foreground">
                {table.category.replaceAll("_", " ")} · {table.minBet} – {table.maxBet}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
