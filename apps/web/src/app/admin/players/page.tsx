"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Users, Search, Shield, Ban, CheckCircle, AlertTriangle } from "lucide-react";

interface AdminPlayer {
  id: string;
  email: string;
  name: string;
  country: string;
  currency: string;
  status: string;
  kycStatus: string;
  createdAt: string;
  availableBalance: string;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayer | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchPlayers = () => {
    setLoading(true);
    api<{ items: AdminPlayer[] }>(`/api/admin/players${search ? `?search=${search}` : ""}`)
      .then((data) => setPlayers(data.items || []))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlayers();
  }, [search]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedPlayer || !statusReason) return;
    setUpdating(true);

    try {
      await api(`/api/admin/players/${selectedPlayer.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus, reason: statusReason }),
      });
      setSelectedPlayer(null);
      setStatusReason("");
      fetchPlayers();
    } catch (err: any) {
      alert(err.message || "Failed to update player status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Player Directory & Account Control</h1>
          <p className="text-xs text-muted-foreground">Search players, inspect balances, enforce suspensions and responsible gaming locks</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs bg-black/40 border-white/10 w-64"
          />
        </div>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5">Player / Email</th>
                <th className="p-3.5">Country</th>
                <th className="p-3.5">Available Balance</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">KYC Status</th>
                <th className="p-3.5">Registered</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading player records…
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No players found.
                  </td>
                </tr>
              ) : (
                players.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-white block">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{p.email}</span>
                    </td>
                    <td className="p-3.5 font-bold uppercase">{p.country}</td>
                    <td className="p-3.5 font-mono font-bold text-gold">${p.availableBalance}</td>
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.kycStatus === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : p.kycStatus === "UNDER_REVIEW"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {p.kycStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPlayer(p)}
                        className="h-7 text-[11px] border-white/10"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal / Dialog to Update Player Status */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-white/10 bg-[#0d111a] p-6 text-white space-y-4 shadow-2xl">
            <h2 className="text-base font-bold">Manage Account: {selectedPlayer.email}</h2>

            <div className="rounded-lg bg-black/40 p-3 text-xs space-y-1 ring-1 ring-white/5">
              <p>Current Status: <strong className="text-gold">{selectedPlayer.status}</strong></p>
              <p>Available Balance: <strong className="font-mono text-emerald-400">${selectedPlayer.availableBalance}</strong></p>
              <p>KYC State: <strong className="text-blue-400">{selectedPlayer.kycStatus}</strong></p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mandatory Audit Reason / Notes</label>
              <Input
                type="text"
                placeholder="Reason for status change (e.g. AML suspicion, duplicate account)..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="h-9 text-xs bg-black/40 border-white/10"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                disabled={updating || !statusReason}
                onClick={() => handleUpdateStatus("ACTIVE")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Activate Account
              </Button>
              <Button
                disabled={updating || !statusReason}
                onClick={() => handleUpdateStatus("SUSPENDED")}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
              >
                Suspend Account
              </Button>
              <Button
                disabled={updating || !statusReason}
                onClick={() => handleUpdateStatus("LOCKED")}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Lock Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedPlayer(null)}
                className="ml-auto text-xs"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
