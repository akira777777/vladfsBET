"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, History, ShieldCheck, WalletCards } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { DemoBadge } from "@/components/demo-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type Transaction } from "@/lib/api";
import { formatMoney, formatWhen, transactionLabel } from "@/lib/format";

export default function WalletPage() {
  const { user, wallet, ready, refreshWallet } = useAuth();
  const [items, setItems] = useState<Transaction[]>([]);
  const [providerId, setProviderId] = useState("");
  const [amount, setAmount] = useState("50");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void api<{ items: Transaction[] }>("/api/wallet/transactions")
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]));
    void api<{ items: Array<{ id: string }> }>("/api/wallet/payment-methods")
      .then((data) => setProviderId(data.items[0]?.id ?? ""))
      .catch(() => setProviderId(""));
  }, [user]);

  async function requestWithdrawal(event: React.FormEvent) {
    event.preventDefault();
    if (!providerId) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api("/api/wallet/withdrawal", {
        method: "POST",
        body: JSON.stringify({ providerId, method: "sandbox", amount }),
      });
      setMessage("Withdrawal request created. The amount is now reserved for review.");
      await refreshWallet();
      const data = await api<{ items: Transaction[] }>("/api/wallet/transactions");
      setItems(data.items ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Withdrawal request failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return <div className="px-4 py-16 text-center text-sm text-muted-foreground">Loading wallet…</div>;
  if (!user || !wallet) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <h1 className="font-heading text-3xl font-bold text-white">Demo wallet</h1>
        <p className="text-sm text-muted-foreground">Sign in to use your one-time $1,000 starting balance.</p>
        <Button asChild variant="gold"><Link href="/login">Sign in</Link></Button>
      </div>
    );
  }

  const currency = wallet.currency ?? user.currency ?? "USD";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-white">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-3xl font-black tracking-tight">Demo wallet</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Every new account receives one $1,000 starting balance. Deposits and manual top-ups are disabled.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Available", wallet.available, "text-gold"],
          ["Bonus", wallet.bonus, "text-purple-300"],
          ["Pending", wallet.pending, "text-blue-300"],
          ["Locked", wallet.locked, "text-amber-300"],
        ].map(([label, value, color]) => (
          <Card key={label} className="border-white/10 bg-card p-5 text-white">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">{label}</span>
            <p className={`mt-1 font-mono text-2xl font-black ${color}`}>{formatMoney(value, currency)}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-5 border-white/10 bg-card p-6 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h2 className="font-bold">Balance policy</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The initial $1,000 is credited once when the account is created. There is no faucet, card deposit,
            crypto deposit, or administrator balance adjustment.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 p-4 text-xs text-amber-100">
            <WalletCards className="h-5 w-5 shrink-0 text-gold" />
            Game stakes and winnings continue to use the immutable demo ledger.
          </div>
        </Card>

        <Card className="space-y-5 border-white/10 bg-card p-6 text-white">
          <div className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-gold" /><h2 className="font-bold">Withdrawal</h2></div>
          <form onSubmit={requestWithdrawal} className="space-y-3">
            <Input type="number" min="1" max={wallet.available} value={amount} onChange={(event) => setAmount(event.target.value)} required className="border-white/10 bg-black/40" />
            <Button type="submit" variant="gold" disabled={submitting || !providerId} className="w-full">
              {submitting ? "Submitting…" : "Request withdrawal"}
            </Button>
          </form>
          {message && <p className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-gold" />{message}</p>}
        </Card>
      </div>

      <Card className="overflow-hidden border-white/10 bg-card text-white">
        <div className="flex items-center gap-2 border-b border-white/10 p-5"><History className="h-5 w-5 text-gold" /><h2 className="font-bold">Ledger history</h2></div>
        <div className="divide-y divide-white/5">
          {items.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No transactions yet.</p> : items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 p-4 text-sm">
              <div><p className="font-semibold">{transactionLabel(item.type)}</p><p className="text-xs text-muted-foreground">{formatWhen(item.createdAt)}</p></div>
              <p className="font-mono font-bold">{formatMoney(item.amount, item.currency)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
