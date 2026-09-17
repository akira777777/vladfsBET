"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { CreditCard } from "lucide-react";

interface AdminWithdrawal {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  createdAt: string;
  user: { email: string; kycStatus: string };
  provider: { name: string };
}

export default function AdminTransactionsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const [selectedWd, setSelectedWd] = useState<AdminWithdrawal | null>(null);
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);

  const fetchWithdrawals = () => {
    setLoading(true);
    api<{ items: AdminWithdrawal[] }>("/api/admin/withdrawals")
      .then((data) => setWithdrawals(data.items || []))
      .catch(() => setWithdrawals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    void api<{ items: AdminWithdrawal[] }>("/api/admin/withdrawals")
      .then((data) => { if (active) setWithdrawals(data.items || []); })
      .catch(() => { if (active) setWithdrawals([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSettleWithdrawal = async () => {
    if (!selectedWd || !decision) return;

    try {
      if (decision === "APPROVE") {
        await api(`/api/admin/withdrawals/${selectedWd.id}/approve`, {
          method: "POST",
          body: JSON.stringify({ reviewNote }),
        });
      } else {
        await api(`/api/admin/withdrawals/${selectedWd.id}/reject`, {
          method: "POST",
          body: JSON.stringify({ reason: reviewNote || "Compliance policy violation" }),
        });
      }

      setSelectedWd(null);
      setDecision(null);
      setReviewNote("");
      fetchWithdrawals();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to process withdrawal");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Cashier & Double-Entry Ledger Management</h1>
        <p className="text-xs text-muted-foreground">Review withdrawal requests, verify KYC status, and execute dual-control ledger adjustments</p>
      </div>

      {/* Withdrawals Review Queue */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gold" /> Pending Withdrawal Requests
        </h2>

        <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="p-3.5">Withdrawal ID</th>
                  <th className="p-3.5">Player Email</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">KYC Status</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading withdrawal records…
                    </td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No withdrawal requests found.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 font-mono text-muted-foreground">{w.id.substring(0, 8)}…</td>
                      <td className="p-3.5 font-semibold text-white">{w.user?.email}</td>
                      <td className="p-3.5">{w.method}</td>
                      <td className="p-3.5 font-mono font-bold text-gold">${parseFloat(w.amount).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            w.user?.kycStatus === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {w.user?.kycStatus ?? "NOT_STARTED"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {w.status === "REQUESTED" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedWd(w);
                                setDecision("APPROVE");
                              }}
                              className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedWd(w);
                                setDecision("REJECT");
                              }}
                              className="h-7 text-[11px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Decision Modal */}
      {selectedWd && decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-white/10 bg-[#0d111a] p-6 text-white space-y-4 shadow-2xl">
            <h2 className="text-base font-bold">
              {decision === "APPROVE" ? "Approve" : "Reject"} Withdrawal (${parseFloat(selectedWd.amount).toFixed(2)})
            </h2>
            <p className="text-xs text-muted-foreground">
              Player: <strong className="text-white">{selectedWd.user?.email}</strong> • KYC: <strong className="text-gold">{selectedWd.user?.kycStatus}</strong>
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {decision === "APPROVE" ? "Approval Notes" : "Mandatory Rejection Reason"}
              </label>
              <Input
                type="text"
                placeholder="Compliance note..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="h-9 text-xs bg-black/40 border-white/10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelectedWd(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                onClick={handleSettleWithdrawal}
                className={`text-xs font-bold text-white ${
                  decision === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                }`}
              >
                Confirm {decision === "APPROVE" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
