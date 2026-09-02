"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { api, type Game } from "@/lib/api";
import { CATALOG_FALLBACK } from "@/lib/games-catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    api<{ items: Game[] }>("/api/games")
      .then((data) => setGames(data.items.length ? data.items : CATALOG_FALLBACK))
      .catch(() => setGames(CATALOG_FALLBACK));
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return games;
    }
    return games.filter((game) =>
      [game.title, game.provider, game.category, game.slug].some((value) =>
        value.toLowerCase().includes(q),
      ),
    );
  }, [games, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="hidden h-10 gap-2 md:inline-flex">
          <Search className="size-4" />
          Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search games</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Roulette, blackjack, slots…"
          className="h-11"
        />
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {results.length === 0 ? (
            <li className="px-2 py-6 text-sm text-muted-foreground">
              No games match. Try roulette, blackjack, or slots.
            </li>
          ) : (
            results.map((game) => (
              <li key={game.slug}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/casino/${game.slug}`);
                  }}
                >
                  <span>{game.title}</span>
                  <span className="text-muted-foreground">{game.provider}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
