"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BetSelection, BetSlip } from "@/components/sports/bet-slip";
import { MatchTracker } from "@/components/sports/match-tracker";
import { api } from "@/lib/api";
import { Trophy, Flame, Clock } from "lucide-react";

interface SportsEvent {
  id: string;
  sport: string;
  name: string;
  startsAt: string;
  status: string;
  markets: {
    id: string;
    name: string;
    status: string;
    odds: { id: string; name: string; odds: number }[];
  }[];
}

interface SettledBet {
  id: string;
  stake: string;
  odds: string;
  payout: string;
  status: string;
  createdAt: string;
  event: { name: string; sport: string };
  market: { name: string };
}

export default function SportsPage() {
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [myBets, setMyBets] = useState<SettledBet[]>([]);
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [activeTab, setActiveTab] = useState<"EVENTS" | "MY_BETS">("EVENTS");
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async (sport: string) => {
    setLoading(true);
    const url = sport === "ALL" ? "/api/sports/events" : `/api/sports/events?sport=${sport}`;
    try {
      const data = await api<{ items: SportsEvent[] }>(url);
      setEvents(data.items || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyBets = useCallback(async () => {
    try {
      const data = await api<{ items: SettledBet[] }>("/api/sports/my-bets");
      setMyBets(data.items || []);
    } catch {
      setMyBets([]);
    }
  }, []);

  useEffect(() => {
    void fetchEvents(selectedSport);
  }, [selectedSport, fetchEvents]);

  useEffect(() => {
    if (activeTab === "MY_BETS") {
      void fetchMyBets();
    }
  }, [activeTab, fetchMyBets]);

  const handleToggleOdds = (
    event: SportsEvent,
    market: SportsEvent["markets"][0],
    selection: { id: string; name: string; odds: number },
  ) => {
    const selId = `${market.id}_${selection.id}`;
    const exists = selections.some((s) => s.selectionId === selId);

    if (exists) {
      setSelections((prev) => prev.filter((s) => s.selectionId !== selId));
    } else {
      setSelections([
        {
          eventId: event.id,
          eventName: event.name,
          marketId: market.id,
          marketName: market.name,
          selectionId: selId,
          selectionName: selection.name,
          odds: selection.odds,
        },
      ]);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-r from-[#0d162a] via-[#091124] to-[#0d131f] p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            <Flame className="h-3.5 w-3.5" />
            <span>VLADFSBET SPORTSBOOK • SANDBOX ODDS</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Sportsbook
          </h1>
          <p className="text-sm text-neutral-300 md:text-base">
            Wager on Premier League, Champions League, NBA, CS2 Majors, ATP Tennis and more with competitive virtual odds.
          </p>
        </div>
      </div>

      {/* Featured Live Match Visualizer */}
      <MatchTracker
        homeTeam="Real Madrid"
        awayTeam="Manchester City"
        homeScore={2}
        awayScore={1}
        minute={68}
      />

      {/* Main Grid: Sports Lobby vs Bet Slip */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Side: Sports Categories & Event Cards */}
        <div className="space-y-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All" },
                { id: "Soccer", label: "Soccer" },
                { id: "Basketball", label: "Basketball" },
                { id: "Esports", label: "Esports" },
                { id: "Tennis", label: "Tennis" },
              ].map((s) => (
                <Button
                  key={s.id}
                  size="sm"
                  variant={selectedSport === s.id ? "default" : "outline"}
                  onClick={() => setSelectedSport(s.id)}
                  className={`text-xs ${
                    selectedSport === s.id
                      ? "bg-gold text-black font-bold"
                      : "border-white/10 text-muted-foreground hover:text-white"
                  }`}
                >
                  {s.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={activeTab === "EVENTS" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("EVENTS")}
                className="text-xs"
              >
                Match Lobby
              </Button>
              <Button
                size="sm"
                variant={activeTab === "MY_BETS" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("MY_BETS")}
                className="text-xs"
              >
                My Bets
              </Button>
            </div>
          </div>

          {activeTab === "EVENTS" ? (
            <div className="space-y-4">
              {loading ? (
                <div className="py-16 text-center text-sm text-muted-foreground">Loading sports fixtures…</div>
              ) : events.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-[#0A0E17] p-12 text-center text-sm text-muted-foreground">
                  No events found for the selected category.
                </div>
              ) : (
                events.map((evt) => (
                  <Card
                    key={evt.id}
                    className="border-white/10 bg-[#0A0E17] p-5 text-white transition-all hover:border-white/20"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3 mb-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-gold" />
                        <span className="font-semibold text-white">{evt.sport}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="h-3.5 w-3.5 text-blue-400" />
                        <span>{new Date(evt.startsAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mb-4">{evt.name}</h3>

                    {/* Markets */}
                    <div className="space-y-3">
                      {evt.markets.map((mkt) => (
                        <div key={mkt.id} className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                            {mkt.name}
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {mkt.odds.map((odd) => {
                              const selId = `${mkt.id}_${odd.id}`;
                              const isSelected = selections.some((s) => s.selectionId === selId);
                              return (
                                <button
                                  key={odd.id}
                                  onClick={() => handleToggleOdds(evt, mkt, odd)}
                                  className={`flex items-center justify-between rounded-lg p-2.5 text-xs font-semibold transition-all ${
                                    isSelected
                                      ? "bg-gold text-black shadow-lg scale-[1.02] ring-2 ring-gold"
                                      : "bg-black/50 border border-white/10 text-white hover:bg-white/10"
                                  }`}
                                >
                                  <span className="truncate pr-2">{odd.name}</span>
                                  <span className={`font-mono font-bold ${isSelected ? "text-black" : "text-gold"}`}>
                                    {odd.odds.toFixed(2)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">Placed &amp; Settled Bets</h2>
              {myBets.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-[#0A0E17] p-12 text-center text-sm text-muted-foreground">
                  You have not placed any sports bets yet.
                </div>
              ) : (
                myBets.map((b) => (
                  <Card key={b.id} className="border-white/10 bg-[#0A0E17] p-4 text-white">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">{b.event?.name} • {b.market?.name}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        b.status === "SETTLED_WIN"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : b.status === "SETTLED_LOSS"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>Stake: ${parseFloat(b.stake).toFixed(2)} @ {parseFloat(b.odds).toFixed(2)}</span>
                      <span className="text-emerald-400">Payout: ${parseFloat(b.payout).toFixed(2)}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Side: Interactive Bet Slip */}
        <div className="lg:col-span-4">
          <div className="sticky top-20">
            <BetSlip
              selections={selections}
              onRemoveSelection={(id) => setSelections((prev) => prev.filter((s) => s.selectionId !== id))}
              onClearAll={() => setSelections([])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
