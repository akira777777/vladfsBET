"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Shield, Lock, CheckCircle2 } from "lucide-react";

interface JurisdictionSetting {
  country: string;
  name: string;
  minAge: number;
  registration: boolean;
  deposits: boolean;
  games: boolean;
}

export default function AdminSettingsPage() {
  const [jurisdictions, setJurisdictions] = useState<JurisdictionSetting[]>([
    { country: "ZZ", name: "International Sandbox", minAge: 18, registration: true, deposits: true, games: true },
    { country: "US", name: "United States (Demo Mode)", minAge: 21, registration: true, deposits: true, games: true },
    { country: "GB", name: "United Kingdom (Demo)", minAge: 18, registration: true, deposits: true, games: true },
    { country: "DE", name: "Germany (Demo)", minAge: 18, registration: true, deposits: true, games: true },
    { country: "CA", name: "Canada (Demo)", minAge: 19, registration: true, deposits: true, games: true },
    { country: "AU", name: "Australia (Demo)", minAge: 18, registration: true, deposits: true, games: true },
  ]);

  const [saved, setSaved] = useState(false);

  const toggleReg = (country: string) => {
    setJurisdictions((prev) =>
      prev.map((j) => (j.country === country ? { ...j, registration: !j.registration } : j)),
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Jurisdictional Gating & Compliance Controls</h1>
        <p className="text-xs text-muted-foreground">Configure registration availability, minimum gambling age requirements, and feature blocking per country</p>
      </div>

      {/* Global Licensing Status Banner */}
      <Card className="border-amber-500/30 bg-gradient-to-r from-[#211604] to-[#0A0E17] p-6 text-white space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Real-Money Operational State: RESTRICTED (SANDBOX DEMO)</h2>
            <p className="text-xs text-muted-foreground">
              Real-money transactions remain locked until the platform operator submits valid jurisdiction licensing and payment clearing certifications.
            </p>
          </div>
        </div>
      </Card>

      {/* Jurisdictions Table */}
      <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gold">Configured Jurisdictions</span>
          <Button onClick={handleSave} size="sm" className="bg-gold text-black font-bold text-xs hover:bg-gold/90">
            Save Jurisdiction Rules
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5">Country Code</th>
                <th className="p-3.5">Region / Name</th>
                <th className="p-3.5">Enforced Minimum Age</th>
                <th className="p-3.5">Registration</th>
                <th className="p-3.5">Deposits</th>
                <th className="p-3.5">Games Open</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jurisdictions.map((j) => (
                <tr key={j.country} className="hover:bg-white/5 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-gold uppercase">{j.country}</td>
                  <td className="p-3.5 font-semibold text-white">{j.name}</td>
                  <td className="p-3.5 font-bold">{j.minAge}+</td>
                  <td className="p-3.5">
                    <button
                      onClick={() => toggleReg(j.country)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        j.registration ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {j.registration ? "ALLOWED" : "BLOCKED"}
                    </button>
                  </td>
                  <td className="p-3.5 text-emerald-400 font-medium">Enabled (Demo)</td>
                  <td className="p-3.5 text-emerald-400 font-medium">Enabled (Demo)</td>
                  <td className="p-3.5 text-right text-muted-foreground">Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Jurisdiction settings successfully updated!</span>
        </div>
      )}
    </div>
  );
}
