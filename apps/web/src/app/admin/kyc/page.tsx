"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { FileCheck, CheckCircle2, XCircle, AlertCircle, Eye } from "lucide-react";

interface AdminKycCase {
  id: string;
  userId: string;
  status: string;
  reviewNote?: string;
  createdAt: string;
  user: { email: string; country: string };
  documents: {
    id: string;
    type: string;
    status: string;
    storageKey: string;
    checksum: string;
    createdAt: string;
  }[];
}

export default function AdminKycPage() {
  const [cases, setCases] = useState<AdminKycCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<AdminKycCase | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchCases = () => {
    setLoading(true);
    api<{ items: AdminKycCase[] }>("/api/admin/kyc")
      .then((data) => setCases(data.items || []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleDecision = async (decision: "APPROVED" | "REJECTED" | "REQUIRES_INFORMATION") => {
    if (!selectedCase) return;
    setReviewing(true);

    try {
      await api(`/api/admin/kyc/${selectedCase.id}/review`, {
        method: "POST",
        body: JSON.stringify({ decision, reviewNote }),
      });
      setSelectedCase(null);
      setReviewNote("");
      fetchCases();
    } catch (err: any) {
      alert(err.message || "Failed to submit KYC review");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Know Your Customer (KYC) Queue</h1>
        <p className="text-xs text-muted-foreground">Inspect submitted government identification, proof of address, and make compliance decisions</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5">Case ID</th>
                <th className="p-3.5">Player Email</th>
                <th className="p-3.5">Country</th>
                <th className="p-3.5">Documents Uploaded</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Submitted</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading KYC cases…
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No pending KYC cases.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono text-muted-foreground">{c.id.substring(0, 8)}…</td>
                    <td className="p-3.5 font-semibold text-white">{c.user?.email}</td>
                    <td className="p-3.5 uppercase font-bold">{c.user?.country}</td>
                    <td className="p-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {c.documents.map((d) => (
                          <span key={d.id} className="rounded bg-black/50 border border-white/10 px-1.5 py-0.5 text-[10px]">
                            {d.type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : c.status === "UNDER_REVIEW"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCase(c)}
                        className="h-7 text-[11px] border-white/10"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl border-white/10 bg-[#0d111a] p-6 text-white space-y-4 shadow-2xl">
            <h2 className="text-base font-bold">Review KYC Case for {selectedCase.user?.email}</h2>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Uploaded Documents:</span>
              <div className="space-y-2">
                {selectedCase.documents.map((d) => (
                  <div key={d.id} className="rounded-lg bg-black/40 p-3 ring-1 ring-white/5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block">{d.type}</strong>
                      <span className="text-[10px] font-mono text-muted-foreground">Storage: {d.storageKey}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gold truncate max-w-[140px]">SHA256: {d.checksum.substring(0, 16)}…</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Compliance Review Notes</label>
              <Input
                type="text"
                placeholder="Notes sent to player or recorded on audit log..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="h-9 text-xs bg-black/40 border-white/10"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                disabled={reviewing}
                onClick={() => handleDecision("APPROVED")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Approve KYC
              </Button>
              <Button
                disabled={reviewing}
                onClick={() => handleDecision("REQUIRES_INFORMATION")}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
              >
                Request Additional Info
              </Button>
              <Button
                disabled={reviewing}
                onClick={() => handleDecision("REJECTED")}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Reject KYC
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedCase(null)}
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
