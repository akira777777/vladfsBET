import Link from "next/link";
import { GameCard } from "@/components/game-card";
import { CATALOG_FALLBACK, selectRailGames } from "@/lib/games-catalog";

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
  const visible = selectRailGames(CATALOG_FALLBACK, { category, slugs });

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
        {visible.map((game) => (
          <div key={game.slug} className="w-44 shrink-0 snap-start">
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </section>
  );
}
