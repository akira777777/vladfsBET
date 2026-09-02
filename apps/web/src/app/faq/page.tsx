"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    category: "General & Account",
    questions: [
      {
        q: "What is VladfsBET?",
        a: "VladfsBET is a next-generation casino and sportsbook demonstration platform featuring double-entry ledger architecture, provably fair gaming, and comprehensive compliance controls.",
      },
      {
        q: "Are the games fair?",
        a: "Yes. All games use cryptographic Provably Fair RNG (HMAC-SHA256) where you can verify the server seed hash, client seed, and round nonce for every single spin and deal.",
      },
      {
        q: "How old do I need to be to register?",
        a: "You must be at least 18 years of age (or 21 depending on the legal age of majority in your jurisdiction). Underage gambling is strictly forbidden.",
      },
    ],
  },
  {
    category: "Deposits & Wallet",
    questions: [
      {
        q: "How do virtual deposits work in sandbox mode?",
        a: "In sandbox mode, you can test credit cards, instant bank transfers, and crypto gateways. Transactions update your available balance instantly without real monetary charges.",
      },
      {
        q: "What are Available, Bonus, and Pending balances?",
        a: "Available balance is your usable funds for play. Bonus balance holds active promotion rewards undergoing wagering requirements. Pending balance holds reserved funds during withdrawal reviews.",
      },
    ],
  },
  {
    category: "Responsible Gaming",
    questions: [
      {
        q: "How can I set gaming limits?",
        a: "Navigate to Play Limits or your Account Center. You can set daily/weekly deposit limits, loss limits, wager limits, session time reminders, or activate a cooling-off period (24 hours to 30 days).",
      },
      {
        q: "How does Self-Exclusion work?",
        a: "Self-exclusion closes your account for a selected period (6 months, 1 year, or permanent). All active sessions are immediately revoked, and account login is blocked.",
      },
    ],
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");

  const toggle = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 text-white">
      <div className="space-y-3 text-center">
        <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-gold">Help Center</span>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">Frequently Asked Questions</h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          Find answers to common questions regarding account management, provably fair games, wallet ledger, and responsible gaming.
        </p>
      </div>

      <div className="space-y-8">
        {FAQ_ITEMS.map((cat, catIdx) => (
          <div key={cat.category} className="space-y-3">
            <h2 className="text-base font-bold text-gold">{cat.category}</h2>
            <div className="space-y-2">
              {cat.questions.map((item, qIdx) => {
                const id = `${catIdx}-${qIdx}`;
                const isOpen = openIndex === id;
                return (
                  <Card
                    key={qIdx}
                    className="border-white/10 bg-[#0A0E17] text-white transition-all overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(id)}
                      className="flex w-full items-center justify-between p-4 text-left font-semibold text-sm hover:text-gold transition-colors"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-gold" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-white/5 bg-black/30 p-4 text-xs text-muted-foreground leading-relaxed animate-in fade-in">
                        {item.a}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
