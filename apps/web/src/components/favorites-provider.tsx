"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";

type FavoritesState = {
  slugs: Set<string>;
  ready: boolean;
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [slugs, setSlugs] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setSlugs(new Set());
      setReady(true);
      return;
    }
    let active = true;
    api<{ slugs: string[] }>("/api/games/favorites")
      .then((data) => {
        if (active) setSlugs(new Set(data.slugs ?? []));
      })
      .catch(() => {
        if (active) setSlugs(new Set());
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [authReady, user]);

  const isFavorite = useCallback((slug: string) => slugs.has(slug), [slugs]);

  const toggle = useCallback(async (slug: string) => {
    if (!user) return;
    setSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    try {
      const data = await api<{ favorited: boolean; slugs: string[] }>(`/api/games/${slug}/favorite`, {
        method: "POST",
      });
      setSlugs(new Set(data.slugs ?? []));
    } catch {
      setSlugs((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) next.delete(slug);
        else next.add(slug);
        return next;
      });
    }
  }, [user]);

  const value = useMemo(
    () => ({ slugs, ready, isFavorite, toggle }),
    [slugs, ready, isFavorite, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
