"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/game-card";
import { api, type Game } from "@/lib/api";
import { CATALOG_FALLBACK, mergeCatalog } from "@/lib/games-catalog";
import { Skeleton } from "@/components/ui/skeleton";

export function GameRail({
  title,
  href,
  category,
  slugs,
}: {
  title: string;
  href?: string;
  category?: string;
  slugs?: string[];
}) {
  const [games, setGames] = useState<Game[] | null>(null);

  useEffect(() => {
    api<{ items: Game[] }>("/api/games")
      .then((data) => setGames(mergeCatalog(data.items)))
      .catch(() => setGames(CATALOG_FALLBACK));
  }, []);

  const visible = useMemo(() => {
    if (!games) return [];
    if (slugs?.length) {
      const order = new Map(slugs.map((slug, index) => [slug, index]));
      return games
        .filter((game) => order.has(game.slug))
        .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
    }
    if (category) {
      const filtered = games.filter((game) => game.category === category);
      return filtered.length > 0 ? filtered : games;
    }
    return games;
  }, [games, category, slugs]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-heading text-xl font-bold tracking-tight text-white">{title}</h2>
        {href ? (
          <Link href={href} className="text-xs font-semibold text-gold hover:underline">
            View all
          </Link>
        ) : null}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {games === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-44 shrink-0 rounded-xl" />
            ))
          : visible.map((game) => (
              <div key={game.slug} className="w-44 shrink-0 snap-start">
                <GameCard game={game} />
              </div>
            ))}
      </div>
    </section>
  );
}
