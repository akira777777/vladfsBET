import { Card } from "@/components/ui/card";
import { Shield, Lock, Scale } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 text-white">
      <div className="space-y-3 text-center">
        <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-gold">Architecture & Standards</span>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">About VladfsBET</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          A high-performance, provably fair gaming and sportsbook architecture built with financial-grade precision, double-entry ledgering, and proactive compliance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Shield,
            title: "Double-Entry Ledger",
            body: "Every single bet, win, deposit, and bonus is immutably posted across double-entry balance accounts with zero balance trust on the frontend.",
          },
          {
            icon: Lock,
            title: "Provably Fair RNG",
            body: "All game outcomes are deterministically generated via HMAC-SHA256 with verifiable server seeds, client seeds, and round nonces.",
          },
          {
            icon: Scale,
            title: "Strict Compliance",
            body: "Architected for multi-jurisdiction licensing, automated AML velocity rules, complete KYC document workflows, and responsible gaming controls.",
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="border-white/10 bg-[#0A0E17] p-6 text-white">
              <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4 text-gold">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold mb-2">{item.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
            </Card>
          );
        })}
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-8 space-y-4 leading-relaxed text-sm text-muted-foreground">
        <h2 className="text-lg font-bold text-white">Regulatory Sandbox Disclosure</h2>
        <p>
          VladfsBET is operating in a full-scale demonstration environment. All financial balances, deposits, and game rounds utilize virtual sandbox credits. Real-money wagering and financial settlement remain strictly disabled until the platform operator secures all requisite gaming licenses, payment processor agreements, and regulatory approvals within applicable operating jurisdictions.
        </p>
        <p>
          We uphold the highest standard of responsible gaming, strictly prohibiting underage gambling (18+/21+ depending on jurisdiction) and offering voluntary deposit limits, loss limits, cooling-off periods, and self-exclusion tools.
        </p>
      </Card>
    </div>
  );
}
