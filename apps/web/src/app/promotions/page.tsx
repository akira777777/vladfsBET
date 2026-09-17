"use client";

import { useEffect, useState } from "react";
import { Gift, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

interface BonusTemplate {
  id: string;
  name: string;
  type: string;
  amount: string;
  terms: string;
}

export default function PromotionsPage() {
  const [templates, setTemplates] = useState<BonusTemplate[]>([]);

  useEffect(() => {
    void api<{ items: BonusTemplate[] }>("/api/bonuses/templates")
      .then((data) => setTemplates(data.items ?? []))
      .catch(() => setTemplates([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-[#170a2c] to-[#0a0d14] p-8">
        <div className="flex items-center gap-2 text-purple-300"><Gift className="h-5 w-5" /><span className="text-xs font-bold">PROMOTIONS SHOWCASE</span></div>
        <h1 className="mt-3 font-heading text-4xl font-black text-white">Promotions</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Promotion cards remain available as a preview. Claims, promo-code credits, and balance top-ups are disabled.</p>
      </div>

      <Card className="flex items-start gap-3 border-gold/20 bg-gold/5 p-5 text-sm text-amber-100">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        Every account receives one $1,000 starting balance. These offers cannot add funds.
      </Card>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="space-y-3 border-white/10 bg-card p-6 text-white">
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">{template.type}</span>
            <h2 className="text-lg font-bold">{template.name}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{template.terms}</p>
            <p className="text-xs font-semibold text-gold">Preview only</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
