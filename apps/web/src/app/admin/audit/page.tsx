"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { ScrollText, Shield } from "lucide-react";

interface AuditLogItem {
  id: string;
  actorType: string;
  adminId?: string;
  subjectId?: string;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  payload?: any;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: AuditLogItem[] }>("/api/admin/audit-logs")
      .then((data) => setLogs(data.items || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Immutable Administrative Audit Log Stream</h1>
        <p className="text-xs text-muted-foreground">Comprehensive, non-destructible log of every administrative and financial action executed on the platform</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor Type</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Payload & Audit Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading audit trail…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        log.actorType === "ADMIN" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {log.actorType}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-gold">{log.action}</td>
                    <td className="p-3.5 text-white font-medium">{log.entity}</td>
                    <td className="p-3.5 font-mono text-muted-foreground">{log.ip ?? "Internal"}</td>
                    <td className="p-3.5 font-mono text-[11px] text-muted-foreground max-w-sm truncate">
                      {log.payload ? JSON.stringify(log.payload) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
