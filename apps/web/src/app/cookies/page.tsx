"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function CookiesPage() {
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("vladfsbet_cookie_consent", JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 text-white">
      <div className="space-y-2">
        <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-gold">User Privacy</span>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Cookie Policy & Preferences</h1>
        <p className="text-xs text-muted-foreground">Manage your cookie consents and data tracking preferences.</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>
          Cookies are small text files placed on your device to ensure our platform functions correctly, maintain your authenticated session, remember your preferences, and protect against brute-force attacks and session hijacking.
        </p>

        <div className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="text-base font-bold text-white">Customize Cookie Settings</h2>

          <div className="space-y-4">
            {/* Necessary */}
            <div className="flex items-start justify-between gap-4 rounded-lg bg-black/40 p-4 ring-1 ring-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">Strictly Necessary Cookies</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Required for user authentication, double-entry ledger state, CSRF security, and session management. Cannot be disabled.
                </p>
              </div>
              <input type="checkbox" checked disabled className="h-5 w-5 accent-gold cursor-not-allowed" />
            </div>

            {/* Functional */}
            <div className="flex items-start justify-between gap-4 rounded-lg bg-black/40 p-4 ring-1 ring-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">Functional Preferences</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Remembers your selected game volume, language, theme preferences, and table view modes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="h-5 w-5 accent-gold cursor-pointer"
              />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4 rounded-lg bg-black/40 p-4 ring-1 ring-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">Performance & Analytics</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Helps us understand platform usage, error frequency, and page load performance anonymously.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="h-5 w-5 accent-gold cursor-pointer"
              />
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4 rounded-lg bg-black/40 p-4 ring-1 ring-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">Marketing & Tailored Promotions</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Used to deliver personalized VIP promotions and game recommendations suited to your gameplay style.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                className="h-5 w-5 accent-gold cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <Button
              onClick={handleSave}
              className="bg-gold text-black font-bold text-xs hover:bg-gold/90"
            >
              Save Cookie Preferences
            </Button>

            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" /> Preferences saved!
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
