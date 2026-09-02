"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Play } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";
import { useAuth } from "@/components/auth-provider";
import { useFavorites } from "@/components/favorites-provider";
import { categoryLabel, isOriginal } from "@/lib/games-catalog";
import { gameArt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/api";

export function GameCard({ game }: { game: Game }) {
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const favorited = isFavorite(game.slug);

  return (
    <Link
      href={`/casino/${game.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-card ring-1 ring-white/8 transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-live"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={gameArt(game.slug)}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 220px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
        <DemoBadge className="absolute top-2 left-2" />
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {isOriginal(game.slug) ? (
            <span className="rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-gold backdrop-blur">
              Originals
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
            {categoryLabel(game.category)}
          </span>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full gold-cta px-4 py-2 text-xs font-extrabold uppercase tracking-wide">
            <Play className="h-3.5 w-3.5" />
            Play
          </span>
        </div>

        {user ? (
          <button
            type="button"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void toggle(game.slug);
            }}
            className={cn(
              "absolute bottom-12 right-2 z-10 rounded-full border p-1.5 backdrop-blur transition-colors",
              favorited
                ? "border-gold/50 bg-gold/20 text-gold"
                : "border-white/15 bg-black/40 text-white/80 hover:text-gold",
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", favorited && "fill-current")} />
          </button>
        ) : null}

        <div className="absolute right-2 bottom-2 left-2 space-y-0.5">
          <p className="truncate text-sm font-bold text-white group-hover:text-gold transition-colors">
            {game.title}
          </p>
          <p className="truncate text-[11px] text-white/70">{game.provider}</p>
        </div>
      </div>
    </Link>
  );
}
