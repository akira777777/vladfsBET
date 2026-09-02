"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Gift, Sparkles } from "lucide-react";

interface AdminBonusTemplate {
  id: string;
  slug: string;
  name: string;
  type: string;
  amount: string;
  wageringMultiplier: number;
  active: boolean;
  terms: string;
}

export default function AdminBonusesPage() {
  const [templates, setTemplates] = useState<AdminBonusTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: AdminBonusTemplate[] }>("/api/bonuses/templates")
      .then((data) => setTemplates(data.items || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Promotions & Bonus Engine Administration</h1>
        <p className="text-xs text-muted-foreground">Configure wagering multipliers, promotional templates, and campaign rules</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5">Campaign Name</th>
                <th className="p-3.5">Slug</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Base Reward</th>
                <th className="p-3.5">Wagering Requirement</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading templates…
                  </td>
                </tr>
              ) : templates.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3.5 font-bold text-white">{t.name}</td>
                  <td className="p-3.5 font-mono text-muted-foreground">{t.slug}</td>
                  <td className="p-3.5">
                    <span className="rounded bg-gold/10 text-gold px-2 py-0.5 text-[10px] font-bold">
                      {t.type}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-emerald-400">
                    {t.amount ? `$${parseFloat(t.amount).toFixed(2)}` : "Match Boost"}
                  </td>
                  <td className="p-3.5 font-mono text-white">{t.wageringMultiplier}x</td>
                  <td className="p-3.5">
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
