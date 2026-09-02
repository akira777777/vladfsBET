"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import {
  Shield,
  Clock,
  AlertTriangle,
  Ban,
  TrendingDown,
  Timer,
  CheckCircle2,
  Info,
  Sparkles,
  Lock,
  ShieldAlert,
  Heart,
} from "lucide-react";

interface RgLimit {
  id: string;
  type: string;
  amount: string | null;
  minutes: number | null;
  periodHours: number;
  active: boolean;
}

interface RgSummary {
  limits: RgLimit[];
  coolingOff: { active: boolean; until?: string } | null;
  selfExclusion: { active: boolean; until?: string; permanent?: boolean } | null;
  totalBetsLast7Days: string;
  totalLossesLast7Days: string;
  sessionCountLast7Days: number;
}

export default function ResponsibleGamingPage() {
  const { user, ready, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"LIMITS" | "COOLING" | "EXCLUSION" | "ACTIVITY">("LIMITS");
  const [summary, setSummary] = useState<RgSummary | null>(null);

  // Limit Form State
  const [limitType, setLimitType] = useState<"DEPOSIT" | "LOSS" | "WAGER" | "SESSION_TIME">("DEPOSIT");
  const [limitAmount, setLimitAmount] = useState("500");
  const [limitPeriod, setLimitPeriod] = useState(24);
  const [limitMinutes, setLimitMinutes] = useState(120);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [settingLimit, setSettingLimit] = useState(false);

  // Cooling-Off State
  const [coolingHours, setCoolingHours] = useState(24);
  const [coolingReason, setCoolingReason] = useState("");
  const [coolingMsg, setCoolingMsg] = useState<string | null>(null);
  const [coolingError, setCoolingError] = useState<string | null>(null);
  const [applyingCooling, setApplyingCooling] = useState(false);

  // Self-Exclusion State
  const [exclusionMonths, setExclusionMonths] = useState(6);
  const [exclusionPermanent, setExclusionPermanent] = useState(false);
  const [exclusionReason, setExclusionReason] = useState("");
  const [exclusionMsg, setExclusionMsg] = useState<string | null>(null);
  const [exclusionError, setExclusionError] = useState<string | null>(null);
  const [applyingExclusion, setApplyingExclusion] = useState(false);
  const [confirmExclusion, setConfirmExclusion] = useState(false);

  useEffect(() => {
    if (!user) return;
    api<{ summary: RgSummary }>("/api/responsible-gaming/summary")
      .then((data) => setSummary(data.summary))
      .catch(() =>
        setSummary({
          limits: [],
          coolingOff: null,
          selfExclusion: null,
          totalBetsLast7Days: "0.00",
          totalLossesLast7Days: "0.00",
          sessionCountLast7Days: 0,
        }),
      );
  }, [user]);

  const handleSetLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingLimit(true);
    setLimitMsg(null);
    setLimitError(null);

    try {
      const payload: Record<string, unknown> = {
        type: limitType,
        periodHours: limitPeriod,
      };
      if (limitType === "SESSION_TIME") {
        payload.minutes = limitMinutes;
      } else {
        payload.amount = limitAmount;
      }

      await api("/api/responsible-gaming/limit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setLimitMsg(
        limitType === "SESSION_TIME"
          ? `Session time limit set to ${limitMinutes} minutes. You will receive a reminder.`
          : `${limitType} limit of $${parseFloat(limitAmount).toFixed(2)} per ${limitPeriod}h period is now active.`,
      );

      // Refresh summary
      const data = await api<{ summary: RgSummary }>("/api/responsible-gaming/summary");
      setSummary(data.summary);
    } catch (err: unknown) {
      setLimitError(err instanceof Error ? err.message : "Failed to set limit. Please try again.");
    } finally {
      setSettingLimit(false);
    }
  };

  const handleCoolingOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyingCooling(true);
    setCoolingMsg(null);
    setCoolingError(null);

    try {
      await api("/api/responsible-gaming/cooling-off", {
        method: "POST",
        body: JSON.stringify({ hours: coolingHours, reason: coolingReason || undefined }),
      });
      setCoolingMsg(
        `Cooling-off period of ${coolingHours} hours activated. Your account is now temporarily suspended. You have been logged out.`,
      );
      setTimeout(() => logout(), 2000);
    } catch (err: unknown) {
      setCoolingError(err instanceof Error ? err.message : "Failed to apply cooling-off period.");
    } finally {
      setApplyingCooling(false);
    }
  };

  const handleSelfExclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmExclusion) {
      setConfirmExclusion(true);
      return;
    }

    setApplyingExclusion(true);
    setExclusionMsg(null);
    setExclusionError(null);

    try {
      await api("/api/responsible-gaming/self-exclude", {
        method: "POST",
        body: JSON.stringify({
          months: exclusionPermanent ? undefined : exclusionMonths,
          permanent: exclusionPermanent,
          reason: exclusionReason || undefined,
        }),
      });
      setExclusionMsg(
        exclusionPermanent
          ? "Permanent self-exclusion activated. Your account is permanently closed. You have been logged out."
          : `Self-exclusion for ${exclusionMonths} months activated. Your account is now locked. You have been logged out.`,
      );
      setTimeout(() => logout(), 3000);
    } catch (err: unknown) {
      setExclusionError(err instanceof Error ? err.message : "Failed to apply self-exclusion.");
    } finally {
      setApplyingExclusion(false);
      setConfirmExclusion(false);
    }
  };

  const LIMIT_TYPES = [
    {
      id: "DEPOSIT" as const,
      label: "Deposit Limit",
      icon: TrendingDown,
      desc: "Cap the maximum amount you can deposit within a given time period.",
    },
    {
      id: "LOSS" as const,
      label: "Loss Limit",
      icon: AlertTriangle,
      desc: "Set the maximum net loss amount before gameplay is suspended.",
    },
    {
      id: "WAGER" as const,
      label: "Wager Limit",
      icon: Shield,
      desc: "Restrict total bet volume within a time period.",
    },
    {
      id: "SESSION_TIME" as const,
      label: "Session Time",
      icon: Timer,
      desc: "Set automatic reminders after continuous play time.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 text-white">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-[#061a12] via-[#081210] to-[#0a0d14] p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),_transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-400">
            <Heart className="h-3.5 w-3.5" />
            <span>RESPONSIBLE GAMING CENTER</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Play Limits &amp; Self-Service Controls
          </h1>
          <p className="text-sm text-neutral-300 md:text-base leading-relaxed">
            Your wellbeing matters more than any game. Configure deposit, loss, wager, and session
            limits. Activate cooling-off periods or self-exclusion at any time. All limits are{" "}
            <strong className="text-emerald-400">enforced server-side</strong> and cannot be
            bypassed.
          </p>
        </div>
      </div>

      {/* Information Banner */}
      <Card className="border-blue-500/20 bg-blue-950/30 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-200 leading-relaxed">
          <strong className="text-white">This is a demo environment.</strong> All balances are
          virtual credits. However, the responsible gaming controls below are fully functional and
          demonstrate the same server-enforced mechanisms that protect players in a production
          deployment. Limit increases have a mandatory cooling period. Decreases and exclusions take
          effect immediately.
        </div>
      </Card>

      {/* Quick Stats Summary */}
      {user && summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
            <span className="text-[11px] uppercase font-bold text-muted-foreground">
              Wagered (Last 7 Days)
            </span>
            <p className="font-mono text-xl font-bold text-gold mt-1">
              ${parseFloat(summary.totalBetsLast7Days || "0").toFixed(2)}
            </p>
          </Card>
          <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
            <span className="text-[11px] uppercase font-bold text-muted-foreground">
              Net Losses (Last 7 Days)
            </span>
            <p className="font-mono text-xl font-bold text-red-400 mt-1">
              ${parseFloat(summary.totalLossesLast7Days || "0").toFixed(2)}
            </p>
          </Card>
          <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
            <span className="text-[11px] uppercase font-bold text-muted-foreground">
              Sessions (Last 7 Days)
            </span>
            <p className="font-mono text-xl font-bold text-white mt-1">
              {summary.sessionCountLast7Days ?? 0}
            </p>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "LIMITS" as const, label: "Set Limits", icon: Shield },
          { id: "COOLING" as const, label: "Cooling-Off", icon: Clock },
          { id: "EXCLUSION" as const, label: "Self-Exclusion", icon: Ban },
          { id: "ACTIVITY" as const, label: "Active Limits", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              size="sm"
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs gap-1.5 ${
                activeTab === tab.id
                  ? tab.id === "EXCLUSION"
                    ? "bg-red-600 text-white font-bold"
                    : "bg-emerald-600 text-white font-bold"
                  : "border-white/10 text-muted-foreground hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* LIMITS TAB */}
      {activeTab === "LIMITS" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Limit Type Selector */}
          <div className="space-y-3 lg:col-span-5">
            <h2 className="text-base font-bold text-white">Choose Limit Type</h2>
            {LIMIT_TYPES.map((lt) => {
              const Icon = lt.icon;
              const isActive = limitType === lt.id;
              return (
                <button
                  key={lt.id}
                  type="button"
                  onClick={() => setLimitType(lt.id)}
                  className={`w-full text-left rounded-xl p-4 transition-all flex items-start gap-3 ${
                    isActive
                      ? "bg-emerald-500/10 border-2 border-emerald-500/50 ring-1 ring-emerald-500/20"
                      : "bg-black/40 border border-white/10 hover:border-white/20"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${isActive ? "text-emerald-400" : "text-white"}`}>
                      {lt.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{lt.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Limit Configuration Form */}
          <Card className="border-white/10 bg-[#0A0E17] p-6 text-white lg:col-span-7 space-y-5">
            <div>
              <h2 className="text-base font-bold">
                Configure{" "}
                {LIMIT_TYPES.find((l) => l.id === limitType)?.label ?? "Limit"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {limitType === "SESSION_TIME"
                  ? "Set how many minutes of continuous play before you receive a break reminder."
                  : "Set the maximum monetary amount for this limit within your chosen time period."}
              </p>
            </div>

            <form onSubmit={handleSetLimit} className="space-y-4">
              {limitType !== "SESSION_TIME" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Maximum Amount ($)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={limitAmount}
                      required
                      onChange={(e) => setLimitAmount(e.target.value)}
                      className="h-10 text-xs font-mono bg-black/40 border-white/10"
                    />
                    <div className="flex gap-2 pt-1">
                      {[100, 250, 500, 1000, 2500].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setLimitAmount(val.toString())}
                          className={`rounded px-2.5 py-1 text-[11px] font-bold border transition-all ${
                            limitAmount === val.toString()
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Time Period
                    </label>
                    <div className="flex gap-2">
                      {[
                        { hours: 24, label: "Daily (24h)" },
                        { hours: 168, label: "Weekly (7d)" },
                        { hours: 720, label: "Monthly (30d)" },
                      ].map((p) => (
                        <button
                          key={p.hours}
                          type="button"
                          onClick={() => setLimitPeriod(p.hours)}
                          className={`flex-1 rounded-lg p-2.5 text-xs font-bold transition-all ${
                            limitPeriod === p.hours
                              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                              : "bg-black/40 border border-white/10 text-muted-foreground hover:text-white"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Session Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={limitMinutes}
                    required
                    onChange={(e) => setLimitMinutes(parseInt(e.target.value) || 60)}
                    className="h-10 text-xs font-mono bg-black/40 border-white/10"
                  />
                  <div className="flex gap-2 pt-1">
                    {[30, 60, 120, 180, 240].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLimitMinutes(val)}
                        className={`rounded px-2.5 py-1 text-[11px] font-bold border transition-all ${
                          limitMinutes === val
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {val >= 60 ? `${val / 60}h` : `${val}m`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {limitError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
                  {limitError}
                </div>
              )}

              {limitMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{limitMsg}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={settingLimit}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
              >
                <Shield className="mr-1.5 h-4 w-4" />
                {settingLimit ? "Applying Limit..." : "Apply Limit Now"}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* COOLING-OFF TAB */}
      {activeTab === "COOLING" && (
        <Card className="border-amber-500/20 bg-[#0A0E17] p-6 text-white max-w-xl space-y-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Cooling-Off Period</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Temporarily suspend your account for a cooling-off period (1 to 30 days). During
                this time you cannot log in, place bets, or make deposits. This action takes effect{" "}
                <strong className="text-amber-400">immediately</strong>.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
            <strong>⚠ Warning:</strong> Activating cooling-off will log you out immediately and
            lock your account for the selected duration. You cannot reverse this action.
          </div>

          <form onSubmit={handleCoolingOff} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { hours: 24, label: "24 Hours" },
                  { hours: 72, label: "3 Days" },
                  { hours: 168, label: "7 Days" },
                  { hours: 720, label: "30 Days" },
                ].map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setCoolingHours(opt.hours)}
                    className={`rounded-lg p-2.5 text-xs font-bold transition-all ${
                      coolingHours === opt.hours
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                        : "bg-black/40 border border-white/10 text-muted-foreground hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Reason (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Why are you taking a break? (optional)"
                value={coolingReason}
                onChange={(e) => setCoolingReason(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {coolingError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
                {coolingError}
              </div>
            )}

            {coolingMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{coolingMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={applyingCooling || !user}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
            >
              <Clock className="mr-1.5 h-4 w-4" />
              {applyingCooling ? "Activating..." : `Activate ${coolingHours}h Cooling-Off`}
            </Button>
          </form>
        </Card>
      )}

      {/* SELF-EXCLUSION TAB */}
      {activeTab === "EXCLUSION" && (
        <Card className="border-red-500/20 bg-[#0A0E17] p-6 text-white max-w-xl space-y-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-400">Self-Exclusion</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Self-exclusion permanently or temporarily closes your account. All active sessions
                are revoked, bets are voided where possible, and you cannot create a new account
                using the same email, phone, or device fingerprint.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
            <strong>🛑 This action is irreversible.</strong> Once self-exclusion is activated, you
            cannot access your account until the exclusion period expires (or never, if permanent).
            Seek professional help if gambling is causing harm.
          </div>

          <form onSubmit={handleSelfExclusion} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Exclusion Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { months: 6, label: "6 Months", permanent: false },
                  { months: 12, label: "12 Months", permanent: false },
                  { months: 24, label: "2 Years", permanent: false },
                  { months: 0, label: "Permanent", permanent: true },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setExclusionPermanent(opt.permanent);
                      if (!opt.permanent) setExclusionMonths(opt.months);
                      setConfirmExclusion(false);
                    }}
                    className={`rounded-lg p-3 text-xs font-bold transition-all ${
                      (opt.permanent && exclusionPermanent) ||
                      (!opt.permanent && !exclusionPermanent && exclusionMonths === opt.months)
                        ? "bg-red-500/20 border border-red-500/40 text-red-400"
                        : "bg-black/40 border border-white/10 text-muted-foreground hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Reason (optional)
              </label>
              <textarea
                rows={2}
                placeholder="You can share a reason if you wish..."
                value={exclusionReason}
                onChange={(e) => setExclusionReason(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            {exclusionError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
                {exclusionError}
              </div>
            )}

            {exclusionMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{exclusionMsg}</span>
              </div>
            )}

            {confirmExclusion && (
              <div className="rounded-lg bg-red-900/40 border border-red-500/50 p-4 text-xs text-red-200 space-y-2">
                <p className="font-bold text-red-400">
                  ⚠ Are you absolutely sure?
                </p>
                <p>
                  {exclusionPermanent
                    ? "Your account will be permanently closed. This cannot be undone."
                    : `Your account will be locked for ${exclusionMonths} months. You will not be able to log in or play.`}
                </p>
                <p>Click the button again to confirm.</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={applyingExclusion || !user}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
            >
              <Ban className="mr-1.5 h-4 w-4" />
              {applyingExclusion
                ? "Processing..."
                : confirmExclusion
                  ? "CONFIRM SELF-EXCLUSION"
                  : `Self-Exclude ${exclusionPermanent ? "Permanently" : `for ${exclusionMonths} Months`}`}
            </Button>
          </form>
        </Card>
      )}

      {/* ACTIVE LIMITS TAB */}
      {activeTab === "ACTIVITY" && (
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white space-y-5">
          <div>
            <h2 className="text-base font-bold">Your Active Play Limits</h2>
            <p className="text-xs text-muted-foreground mt-1">
              All currently enforced responsible gaming limits on your account.
            </p>
          </div>

          {!user ? (
            <div className="text-center py-12 space-y-4">
              <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Sign in to view and manage your responsible gaming limits.
              </p>
              <Button asChild className="bg-gold text-black font-bold">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          ) : !summary || summary.limits.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Shield className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No active limits configured. We recommend setting at least a deposit limit.
              </p>
              <Button
                onClick={() => setActiveTab("LIMITS")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Configure Your First Limit
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.limits.map((lim) => (
                <div
                  key={lim.id}
                  className="rounded-lg bg-black/40 p-4 ring-1 ring-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">{lim.type} Limit</span>
                      <span className="text-[10px] text-muted-foreground">
                        Period: {lim.periodHours}h
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 block">
                      {lim.type === "SESSION_TIME"
                        ? `${lim.minutes ?? 0} min`
                        : `$${parseFloat(lim.amount ?? "0").toFixed(2)}`}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${lim.active ? "text-emerald-400" : "text-muted-foreground"}`}
                    >
                      {lim.active ? "✓ Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cooling-Off / Exclusion Status */}
          {summary?.coolingOff?.active && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-300">
              <strong className="block mb-1">Cooling-Off Active</strong>
              Your account is temporarily suspended until{" "}
              {summary.coolingOff.until
                ? new Date(summary.coolingOff.until).toLocaleString()
                : "the cooling period expires"}
              .
            </div>
          )}

          {summary?.selfExclusion?.active && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-300">
              <strong className="block mb-1">Self-Exclusion Active</strong>
              {summary.selfExclusion.permanent
                ? "Your account is permanently self-excluded."
                : `Your account is self-excluded until ${summary.selfExclusion.until ? new Date(summary.selfExclusion.until).toLocaleString() : "the exclusion period expires"}.`}
            </div>
          )}
        </Card>
      )}

      {/* Help Resources Section */}
      <Card className="border-white/10 bg-[#0A0E17] p-6 text-white space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-400" />
          Need Help? Professional Support Resources
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          If gambling is causing you financial difficulties, stress, or affecting your relationships,
          please reach out to professional support organizations. You are not alone.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              name: "GamCare",
              url: "https://www.gamcare.org.uk",
              desc: "Free information, support, and counselling",
            },
            {
              name: "BeGambleAware",
              url: "https://www.begambleaware.org",
              desc: "National Gambling Helpline (UK)",
            },
            {
              name: "Gamblers Anonymous",
              url: "https://www.gamblersanonymous.org",
              desc: "Peer support fellowship worldwide",
            },
          ].map((resource) => (
            <a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-black/40 border border-white/10 p-4 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
            >
              <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                {resource.name}
              </span>
              <p className="text-xs text-muted-foreground mt-1">{resource.desc}</p>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
