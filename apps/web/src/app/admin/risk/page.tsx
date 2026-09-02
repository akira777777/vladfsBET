"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

interface AdminAmlAlert {
  id: string;
  userId: string;
  ruleKey: string;
  severity: string;
  payload: any;
  open: boolean;
  createdAt: string;
  user: { email: string; country: string };
}

export default function AdminRiskPage() {
  const [alerts, setAlerts] = useState<AdminAmlAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<AdminAmlAlert | null>(null);
  const [notes, setNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchAlerts = () => {
    setLoading(true);
    api<{ items: AdminAmlAlert[] }>("/api/admin/risk/alerts")
      .then((data) => setAlerts(data.items || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async () => {
    if (!selectedAlert) return;
    setResolving(true);

    try {
      await api(`/api/admin/risk/alerts/${selectedAlert.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
      setSelectedAlert(null);
      setNotes("");
      fetchAlerts();
    } catch (err: any) {
      alert(err.message || "Failed to resolve alert");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Anti-Money Laundering & Fraud Prevention Engine</h1>
        <p className="text-xs text-muted-foreground">Real-time velocity triggers, high single-transaction flags, and risk scoring</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Trigger Rule</th>
                <th className="p-3.5">Player Email</th>
                <th className="p-3.5">Payload Details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Detected At</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading risk alerts…
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No active AML risk alerts detected.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          a.severity === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-gold">{a.ruleKey}</td>
                    <td className="p-3.5 font-semibold text-white">{a.user?.email}</td>
                    <td className="p-3.5 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(a.payload)}
                    </td>
                    <td className="p-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.open ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                        {a.open ? "OPEN" : "RESOLVED"}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="p-3.5 text-right">
                      {a.open ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAlert(a)}
                          className="h-7 text-[11px] border-white/10"
                        >
                          Resolve
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Resolve Dialog */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-white/10 bg-[#0d111a] p-6 text-white space-y-4 shadow-2xl">
            <h2 className="text-base font-bold">Resolve AML Alert: {selectedAlert.ruleKey}</h2>
            <p className="text-xs text-muted-foreground">
              Player: <strong className="text-white">{selectedAlert.user?.email}</strong>
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Resolution Notes & Findings</label>
              <Input
                type="text"
                placeholder="Compliance investigation summary..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs bg-black/40 border-white/10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelectedAlert(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                disabled={resolving}
                onClick={handleResolve}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Mark Alert Resolved
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
