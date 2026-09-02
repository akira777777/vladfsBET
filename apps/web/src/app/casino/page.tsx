"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GameCard } from "@/components/game-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, type Game } from "@/lib/api";
import { CATALOG_FALLBACK, isOriginal, mergeCatalog } from "@/lib/games-catalog";
import { gameArt } from "@/lib/format";
import { SlidersHorizontal, Sparkles, Flame, Trophy, Crown, Check, Search } from "lucide-react";

const CATEGORIES = ["ALL", "ORIGINALS", "SLOTS", "CRASH", "TABLE", "LIVE"] as const;

export default function CasinoPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground">Loading lobby…</div>}>
      <CasinoLobby />
    </Suspense>
  );
}

function CasinoLobby() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("category") ?? "ALL";
  const [games, setGames] = useState<Game[]>(CATALOG_FALLBACK);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initial);

  // Advanced Filters
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [selectedFeature, setSelectedFeature] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"POPULAR" | "RTP" | "NAME">("POPULAR");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  useEffect(() => {
    setCategory(searchParams.get("category") ?? "ALL");
  }, [searchParams]);

  useEffect(() => {
    api<{ items: Game[] }>("/api/games")
      .then((data) => setGames(mergeCatalog(data.items)))
      .catch(() => setGames(CATALOG_FALLBACK));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = games.filter((game) => {
      const matchesQuery =
        !q ||
        [game.title, game.provider, game.category, game.slug].some((value) =>
          value.toLowerCase().includes(q),
        );

      let matchesCat = true;
      if (category === "ORIGINALS") matchesCat = isOriginal(game.slug);
      else if (category === "TABLE") matchesCat = ["TABLE_GAMES", "ROULETTE", "BLACKJACK", "BACCARAT", "POKER"].includes(game.category);
      else if (category === "LIVE") matchesCat = game.category === "LIVE_CASINO" || game.tags?.includes("live") === true;
      else if (category !== "ALL") matchesCat = game.category === category;

      let matchesProv = true;
      if (selectedProvider !== "ALL") {
        matchesProv = game.provider.toLowerCase().includes(selectedProvider.toLowerCase());
      }

      return matchesQuery && matchesCat && matchesProv;
    });

    if (sortBy === "RTP") {
      result = [...result].sort((a, b) => ((b.rtpBps ?? 9600) - (a.rtpBps ?? 9600)));
    } else if (sortBy === "NAME") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [games, query, category, selectedProvider, sortBy]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
      {/* Featured Header Showcase */}
      <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-r from-[#170c00] via-[#241300] to-[#0d0700] p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/20 px-3 py-1 text-xs font-bold text-gold">
            <Sparkles className="h-3.5 w-3.5" /> PROVABLY FAIR ORIGINALS &amp; MODERN SLOTS
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            VladfsBET Casino Lobby
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Over 50+ casino classics, 6x5 cascading tumble slots with multiplier orbs, physics plinko, 5x5 mines, and 1080P live dealer studios.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link href="/casino/gates-of-vladfs" className="inline-flex h-10 items-center rounded-xl bg-gold text-black font-extrabold px-4 text-xs tracking-wider uppercase shadow-lg shadow-gold/20 hover:brightness-110">
              ⚡ Gates of Vladfs
            </Link>
            <Link href="/casino/plinko" className="inline-flex h-10 items-center rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 text-xs font-bold text-sky-300 hover:bg-blue-500/20">
              🪙 Plinko Deluxe
            </Link>
            <Link href="/casino/mines" className="inline-flex h-10 items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20">
              💣 Cyber Mines
            </Link>
            <Link href="/casino/dice" className="inline-flex h-10 items-center rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 text-xs font-bold text-purple-300 hover:bg-purple-500/20">
              🎲 Quantum Dice
            </Link>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search 50+ slots, crash, table games, providers…"
            className="h-11 pl-10 rounded-2xl bg-black/40 border-white/10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-11 rounded-2xl border border-white/10 bg-black/40 px-4 text-xs font-bold text-white"
          >
            <option value="POPULAR">🔥 Most Popular</option>
            <option value="RTP">📈 Highest RTP %</option>
            <option value="NAME">🔤 Alphabetical (A-Z)</option>
          </select>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`h-11 rounded-2xl border-white/10 text-xs gap-1.5 ${
              showFiltersDrawer ? "bg-gold text-black font-bold" : "text-white bg-black/40"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {showFiltersDrawer && (
        <div className="rounded-2xl bg-neutral-950/90 border border-white/10 p-4 space-y-4 animate-in slide-in-from-top-2">
          <div>
            <span className="text-xs uppercase font-bold text-gold tracking-wider block mb-2">Game Providers</span>
            <div className="flex flex-wrap gap-2">
              {["ALL", "VladfsBET Originals", "Pragmatic", "Evolution", "NetEnt"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvider(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedProvider === p
                      ? "bg-gold text-black shadow-md"
                      : "bg-black/40 border border-white/10 text-muted-foreground hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 sticky top-16 z-20 py-2.5 bg-[#07080C]/90 backdrop-blur-md border-y border-white/5">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all ring-1 ${
              category === item
                ? "bg-gradient-to-r from-gold to-amber-500 text-black ring-gold shadow-md shadow-gold/20"
                : "text-muted-foreground ring-white/10 hover:text-white hover:bg-white/5"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Games Catalog Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-16 text-center text-sm text-muted-foreground space-y-2">
          <p className="text-base font-bold text-white">No games found matching your search.</p>
          <p>Try searching for &quot;Gates of Vladfs&quot;, &quot;Plinko&quot;, or &quot;Roulette&quot;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
