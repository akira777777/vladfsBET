"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, type Game } from "@/lib/api";
import { Gamepad2, Check, X } from "lucide-react";

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: Game[] }>("/api/games")
      .then((data) => setGames(data.items || []))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Casino & Games Catalog Management</h1>
        <p className="text-xs text-muted-foreground">Manage game availability, category categorization, and provider configurations</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5">Game Title</th>
                <th className="p-3.5">Slug</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Provider</th>
                <th className="p-3.5">Demo Mode</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading game catalog…
                  </td>
                </tr>
              ) : games.map((g) => (
                <tr key={g.slug} className="hover:bg-white/5 transition-colors">
                  <td className="p-3.5 font-bold text-white">{g.title}</td>
                  <td className="p-3.5 font-mono text-muted-foreground">{g.slug}</td>
                  <td className="p-3.5">
                    <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[10px] font-bold">
                      {g.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-gold font-medium">{g.provider}</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Enabled</td>
                  <td className="p-3.5">
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
