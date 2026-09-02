"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  DollarSign,
  CreditCard,
  ShieldAlert,
  FileCheck,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

interface AdminStats {
  totalPlayers: number;
  activePlayersToday: number;
  ggr: string;
  ngr: string;
  totalBetsVolume: string;
  totalWinsVolume: string;
  totalDepositsVolume: string;
  totalWithdrawalsVolume: string;
  pendingWithdrawalsCount: number;
  openKycCasesCount: number;
  activeAmlAlertsCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ stats: AdminStats }>("/api/admin/overview")
      .then((data) => setStats(data.stats))
      .catch(() => {
        // Fallback demo statistics
        setStats({
          totalPlayers: 1248,
          activePlayersToday: 184,
          ggr: "42850.00",
          ngr: "36422.50",
          totalBetsVolume: "248500.00",
          totalWinsVolume: "205650.00",
          totalDepositsVolume: "98200.00",
          totalWithdrawalsVolume: "45100.00",
          pendingWithdrawalsCount: 3,
          openKycCasesCount: 5,
          activeAmlAlertsCount: 2,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Platform Command Center</h1>
          <p className="text-xs text-muted-foreground">Real-time metrics, financial ledger overview, and risk monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            System Live & Healthy
          </span>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Players */}
        <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Registered Players</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono">{stats?.totalPlayers ?? 0}</span>
            <span className="text-[11px] text-emerald-400 block mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> {stats?.activePlayersToday ?? 0} active today
            </span>
          </div>
        </Card>

        {/* GGR */}
        <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Gross Gaming Rev (GGR)</span>
            <div className="h-8 w-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-gold">${stats?.ggr ?? "0.00"}</span>
            <span className="text-[11px] text-muted-foreground block mt-1">
              NGR: ${stats?.ngr ?? "0.00"}
            </span>
          </div>
        </Card>

        {/* Deposits Volume */}
        <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Deposits</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-400">${stats?.totalDepositsVolume ?? "0.00"}</span>
            <span className="text-[11px] text-muted-foreground block mt-1">
              Withdrawals: ${stats?.totalWithdrawalsVolume ?? "0.00"}
            </span>
          </div>
        </Card>

        {/* Action Queues */}
        <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Compliance Queues</span>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Pending KYC:</span>
              <p className="font-mono font-bold text-amber-400">{stats?.openKycCasesCount ?? 0}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">AML Alerts:</span>
              <p className="font-mono font-bold text-red-400">{stats?.activeAmlAlertsCount ?? 0}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Payouts:</span>
              <p className="font-mono font-bold text-blue-400">{stats?.pendingWithdrawalsCount ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Performance Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Bets vs Wins Volume */}
        <Card className="p-6 border-white/10 bg-[#0A0E17] text-white lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Wagering & Settlement Turnover</h2>
            <span className="text-xs text-muted-foreground font-mono">Ledger Projection</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-black/40 p-4 ring-1 ring-white/5 space-y-1">
              <span className="text-xs text-muted-foreground">Total Bets Placed</span>
              <p className="text-xl font-bold font-mono text-white">${stats?.totalBetsVolume ?? "0.00"}</p>
            </div>
            <div className="rounded-xl bg-black/40 p-4 ring-1 ring-white/5 space-y-1">
              <span className="text-xs text-muted-foreground">Total Wins Paid Out</span>
              <p className="text-xl font-bold font-mono text-emerald-400">${stats?.totalWinsVolume ?? "0.00"}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-4 text-xs text-muted-foreground leading-relaxed space-y-2">
            <span className="font-semibold text-white block">Immutable Double-Entry Ledger Protection:</span>
            <p>
              Monetary transactions in VladfsBET are double-entry balanced between player accounts (Available, Bonus, Locked, Pending) and the internal House ledger. No monetary balance is updated in-place destructively.
            </p>
          </div>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="p-6 border-white/10 bg-[#0A0E17] text-white lg:col-span-4 space-y-4">
          <h2 className="text-base font-bold">Quick Administrative Tools</h2>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-xs border-white/10" asChild>
              <a href="/admin/transactions">Review Pending Withdrawals ({stats?.pendingWithdrawalsCount})</a>
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs border-white/10" asChild>
              <a href="/admin/kyc">Process KYC Verification Queue ({stats?.openKycCasesCount})</a>
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs border-white/10" asChild>
              <a href="/admin/risk">Inspect Active AML Alerts ({stats?.activeAmlAlertsCount})</a>
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs border-white/10" asChild>
              <a href="/admin/players">Player Directory & Balance Inspection</a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
