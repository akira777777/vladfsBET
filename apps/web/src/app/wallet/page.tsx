"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { DemoBadge } from "@/components/demo-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type Transaction } from "@/lib/api";
import { formatMoney, formatWhen, transactionLabel } from "@/lib/format";
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  Coins,
} from "lucide-react";

interface CryptoAsset {
  symbol: string;
  name: string;
  network: string;
  address: string;
  icon: string;
  color: string;
}

const CRYPTO_ASSETS: CryptoAsset[] = [
  {
    symbol: "USDT",
    name: "Tether USD",
    network: "TRC-20 (Tron)",
    address: "TX9vLAdFsBeT888TRC20doUbLeEnTrY99",
    icon: "₮",
    color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/20",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin Mainnet",
    address: "bc1qvladfsbet777cryptoprovablyfair999",
    icon: "₿",
    color: "text-amber-400 border-amber-500/40 bg-amber-950/20",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    network: "ERC-20 (Ethereum)",
    address: "0x71C...VLADFSBET999a8b1c4e6f8b2c5d",
    icon: "Ξ",
    color: "text-blue-400 border-blue-500/40 bg-blue-950/20",
  },
  {
    symbol: "SOL",
    name: "Solana",
    network: "Solana Network",
    address: "VLADsolANA888provablyfaircasinowallet",
    icon: "◎",
    color: "text-purple-400 border-purple-500/40 bg-purple-950/20",
  },
];

export default function WalletPage() {
  const { user, wallet, ready, refreshWallet } = useAuth();
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "DEPOSIT" | "CRYPTO" | "WITHDRAW" | "HISTORY">("OVERVIEW");
  const [items, setItems] = useState<Transaction[]>([]);
  const [methods, setMethods] = useState<{ id: string; slug: string; name: string }[]>([]);

  // Deposit State
  const [depAmount, setDepAmount] = useState("100");
  const [selectedMethod, setSelectedMethod] = useState("sandbox-card");
  const [depositing, setDepositing] = useState(false);
  const [depMsg, setDepMsg] = useState<string | null>(null);

  // Crypto Cashier State
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset>(CRYPTO_ASSETS[0]);
  const [copied, setCopied] = useState(false);
  const [simulatedConfirmations, setSimulatedConfirmations] = useState(3);

  // Withdrawal State
  const [wdAmount, setWdAmount] = useState("50");
  const [withdrawing, setWithdrawing] = useState(false);
  const [wdMsg, setWdMsg] = useState<string | null>(null);
  const [wdError, setWdError] = useState<string | null>(null);

  // Faucet state
  const [faucetLoading, setFaucetLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api<{ items: Transaction[] }>("/api/wallet/transactions")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));

    api<{ items: { id: string; slug: string; name: string }[] }>("/api/wallet/payment-methods")
      .then((data) => {
        setMethods(data.items || []);
        if (data.items?.length > 0) setSelectedMethod(data.items[0].slug);
      })
      .catch(() => {
        setMethods([
          { id: "1", slug: "sandbox-card", name: "Credit / Debit Card (Sandbox)" },
          { id: "2", slug: "sandbox-bank", name: "Instant Bank Wire (Sandbox)" },
          { id: "3", slug: "sandbox-crypto", name: "Crypto Gateway USDT/BTC (Sandbox)" },
        ]);
      });
  }, [user]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(selectedCrypto.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setDepositing(true);
    setDepMsg(null);

    try {
      const selectedProv = methods.find((m) => m.slug === selectedMethod);
      await api("/api/wallet/deposit", {
        method: "POST",
        body: JSON.stringify({
          providerId: selectedProv?.id ?? "1",
          method: selectedProv?.name ?? selectedMethod,
          amount: depAmount,
        }),
      });

      setDepMsg(`Deposit of $${parseFloat(depAmount).toFixed(2)} completed! Funds posted to available balance.`);
      await refreshWallet();
      const data = await api<{ items: Transaction[] }>("/api/wallet/transactions");
      setItems(data.items || []);
    } catch (err: any) {
      alert(err.message || "Failed to process deposit");
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setWithdrawing(true);
    setWdMsg(null);
    setWdError(null);

    try {
      const selectedProv = methods.find((m) => m.slug === selectedMethod);
      await api("/api/wallet/withdrawal", {
        method: "POST",
        body: JSON.stringify({
          providerId: selectedProv?.id ?? "1",
          method: selectedProv?.name ?? selectedMethod,
          amount: wdAmount,
        }),
      });

      setWdMsg(`Withdrawal of $${parseFloat(wdAmount).toFixed(2)} requested! Balance reserved in Pending account.`);
      await refreshWallet();
      const data = await api<{ items: Transaction[] }>("/api/wallet/transactions");
      setItems(data.items || []);
    } catch (err: any) {
      setWdError(err.message || "Failed to submit withdrawal request");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleFaucetCredit = async (amount: string) => {
    setFaucetLoading(true);
    try {
      await api("/api/wallet/demo-credit", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      await refreshWallet();
      const data = await api<{ items: Transaction[] }>("/api/wallet/transactions");
      setItems(data.items || []);
    } catch (err: any) {
      alert(err.message || "Failed to credit faucet");
    } finally {
      setFaucetLoading(false);
    }
  };

  if (!ready) {
    return <div className="px-4 py-16 text-sm text-muted-foreground text-center">Loading cashier…</div>;
  }

  if (!user || !wallet) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h1 className="font-heading text-3xl font-bold text-white">Cashier</h1>
        <p className="text-sm text-muted-foreground">Sign in to view your ledger breakdown and deposit test credits.</p>
        <Button size="lg" className="bg-gold text-black font-bold" asChild>
          <Link href="/login">Sign in to Continue</Link>
        </Button>
      </div>
    );
  }

  const currency = wallet.currency ?? user.currency ?? "USD";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-white">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-black tracking-tight">Cashier</h1>
            <DemoBadge />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Double-entry accounting engine. Real-money settlement remains locked until operator licensing is active.
          </p>
        </div>

        {/* Faucet Top-up */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleFaucetCredit("500")}
            disabled={faucetLoading}
            className="bg-gold text-black font-bold text-xs hover:bg-gold/90 shadow-md"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> +$500 Demo Faucet
          </Button>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gold/30 bg-[#0f1422] p-5 text-white shadow-lg">
          <span className="text-[11px] uppercase font-bold text-gold">Available Balance</span>
          <p className="font-mono text-2xl font-black text-white mt-1">
            {formatMoney(wallet.available, currency)}
          </p>
          <span className="text-[10px] text-muted-foreground block mt-1">Directly usable for games &amp; sports</span>
        </Card>

        <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
          <span className="text-[11px] uppercase font-bold text-purple-400">Bonus Balance</span>
          <p className="font-mono text-2xl font-bold text-purple-300 mt-1">
            {formatMoney(wallet.bonus, currency)}
          </p>
          <span className="text-[10px] text-muted-foreground block mt-1">Undergoing active wagering</span>
        </Card>

        <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
          <span className="text-[11px] uppercase font-bold text-blue-400">Pending Reserved</span>
          <p className="font-mono text-2xl font-bold text-blue-300 mt-1">
            {formatMoney(wallet.pending, currency)}
          </p>
          <span className="text-[10px] text-muted-foreground block mt-1">Reserved for withdrawal review</span>
        </Card>

        <Card className="border-white/10 bg-[#0A0E17] p-5 text-white">
          <span className="text-[11px] uppercase font-bold text-amber-400">Locked Balance</span>
          <p className="font-mono text-2xl font-bold text-amber-300 mt-1">
            {formatMoney(wallet.locked, currency)}
          </p>
          <span className="text-[10px] text-muted-foreground block mt-1">Restricted funds</span>
        </Card>
      </div>

      {/* Cashier Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {[
          { id: "OVERVIEW" as const, label: "Overview" },
          { id: "DEPOSIT" as const, label: "Fiat Sandbox" },
          { id: "CRYPTO" as const, label: "🪙 Crypto QR Cashier" },
          { id: "WITHDRAW" as const, label: "Withdraw Funds" },
          { id: "HISTORY" as const, label: "Ledger Receipts" },
        ].map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs ${
              activeTab === tab.id
                ? "bg-gold text-black font-bold"
                : "border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "OVERVIEW" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-white/10 bg-[#0A0E17] p-6 text-white space-y-4">
            <h3 className="text-base font-bold">Quick Sandbox Deposit</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Test payment provider integrations with sandbox Visa/Mastercard, instant bank wires, or crypto payments.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab("DEPOSIT")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                <ArrowDownLeft className="mr-1.5 h-4 w-4" /> Fiat Cashier
              </Button>
              <Button
                onClick={() => setActiveTab("CRYPTO")}
                variant="outline"
                className="border-gold/40 text-gold bg-gold/10 font-bold text-xs"
              >
                <Coins className="mr-1.5 h-4 w-4" /> Crypto QR Gateway
              </Button>
            </div>
          </Card>

          <Card className="border-white/10 bg-[#0A0E17] p-6 text-white space-y-4">
            <h3 className="text-base font-bold">Withdrawal Request</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Request a test withdrawal. The double-entry engine will reserve funds into Pending state pending compliance review.
            </p>
            <Button
              onClick={() => setActiveTab("WITHDRAW")}
              variant="outline"
              className="border-white/10 text-xs font-bold"
            >
              <ArrowUpRight className="mr-1.5 h-4 w-4 text-gold" /> Request Withdrawal
            </Button>
          </Card>
        </div>
      )}

      {/* CRYPTO QR CODE CASHIER TAB */}
      {activeTab === "CRYPTO" && (
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white space-y-6">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-gold" /> Multi-Currency Crypto Cashier
            </h2>
            <p className="text-xs text-muted-foreground">Select a cryptocurrency to generate your dedicated sandbox deposit address.</p>
          </div>

          {/* Asset Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CRYPTO_ASSETS.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => setSelectedCrypto(asset)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedCrypto.symbol === asset.symbol
                    ? "border-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-[1.02]"
                    : "border-white/10 bg-black/40 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black">{asset.icon}</span>
                  <div>
                    <p className="font-bold text-xs text-white">{asset.symbol}</p>
                    <span className="text-[10px] text-muted-foreground block">{asset.name}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* QR Code & Address Display */}
          <div className="grid gap-6 sm:grid-cols-12 bg-black/60 p-6 rounded-3xl border border-white/5 items-center">
            {/* Mock QR Code Graphic */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-neutral-300 shadow-xl">
              <QrCode className="h-36 w-36 text-black" />
              <span className="text-[10px] font-bold text-neutral-800 mt-2 uppercase">Scan to Deposit {selectedCrypto.symbol}</span>
            </div>

            {/* Address & Network Info */}
            <div className="sm:col-span-8 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-muted-foreground block">Network</span>
                <span className="font-bold text-white text-sm">{selectedCrypto.network}</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase text-muted-foreground block">Deposit Address</span>
                <div className="flex gap-2">
                  <Input
                    value={selectedCrypto.address}
                    readOnly
                    className="font-mono text-xs bg-black/80 border-white/10 text-amber-300"
                  />
                  <Button
                    onClick={handleCopyAddress}
                    size="sm"
                    className="bg-gold text-black font-bold shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Instant Credit Test Trigger */}
              <div className="pt-2">
                <Button
                  onClick={() => handleFaucetCredit("250")}
                  disabled={faucetLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" /> Simulate Blockchain Deposit (+$250 {selectedCrypto.symbol})
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "DEPOSIT" && (
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white max-w-xl space-y-6">
          <div>
            <h2 className="text-base font-bold">Deposit Virtual Credits</h2>
            <p className="text-xs text-muted-foreground">Select a test payment method and enter the deposit amount.</p>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {methods.map((m) => (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => setSelectedMethod(m.slug)}
                    className={`rounded-lg border p-3 text-left text-xs font-semibold transition-all ${
                      selectedMethod === m.slug
                        ? "border-gold bg-gold/10 text-white ring-1 ring-gold"
                        : "border-white/10 bg-black/40 text-muted-foreground hover:bg-white/5"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Deposit Amount ($)</label>
              <Input
                type="number"
                min="10"
                max="5000"
                value={depAmount}
                required
                onChange={(e) => setDepAmount(e.target.value)}
                className="h-10 text-xs font-mono bg-black/40 border-white/10"
              />
              <div className="flex gap-2 pt-1">
                {[50, 100, 250, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepAmount(val.toString())}
                    className="rounded px-2.5 py-1 text-[11px] font-bold bg-white/5 border border-white/10 hover:bg-white/15"
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {depMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{depMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={depositing}
              className="w-full bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold hover:brightness-110 shadow-lg shadow-gold/20"
            >
              {depositing ? "Processing Deposit..." : `Confirm Deposit of $${parseFloat(depAmount || "0").toFixed(2)}`}
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "WITHDRAW" && (
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white max-w-xl space-y-6">
          <div>
            <h2 className="text-base font-bold">Withdraw Funds</h2>
            <p className="text-xs text-muted-foreground">Request a payout to your registered bank account or crypto wallet.</p>
          </div>

          <div className="rounded-lg bg-black/40 p-3 text-xs space-y-1 ring-1 ring-white/5">
            <span className="text-muted-foreground block text-[11px]">Available to Withdraw:</span>
            <strong className="font-mono text-gold text-lg">{formatMoney(wallet.available, currency)}</strong>
          </div>

          <form onSubmit={handleWithdrawal} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Payout Method</label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full h-10 rounded-md border border-white/10 bg-black/40 px-3 text-xs text-white"
              >
                {methods.map((m) => (
                  <option key={m.slug} value={m.slug}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Withdrawal Amount ($)</label>
              <Input
                type="number"
                min="20"
                max={parseFloat(wallet.available) || 1000}
                value={wdAmount}
                required
                onChange={(e) => setWdAmount(e.target.value)}
                className="h-10 text-xs font-mono bg-black/40 border-white/10"
              />
            </div>

            {wdError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
                {wdError}
              </div>
            )}

            {wdMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{wdMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={withdrawing}
              className="w-full bg-gold text-black font-bold hover:bg-gold/90"
            >
              {withdrawing ? "Submitting Request..." : `Request Payout of $${parseFloat(wdAmount || "0").toFixed(2)}`}
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "HISTORY" && (
        <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="p-3.5">Transaction Type</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Currency</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 font-semibold text-white">{transactionLabel(item.type)}</td>
                      <td className="p-3.5 font-mono font-bold text-gold">{formatMoney(item.amount, item.currency)}</td>
                      <td className="p-3.5 uppercase">{item.currency}</td>
                      <td className="p-3.5">
                        <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted-foreground">{formatWhen(item.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
