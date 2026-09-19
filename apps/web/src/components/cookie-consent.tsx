"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Shield, Check, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
};

const STORAGE_KEY = "vladfsbet_cookie_consent";

export function getStoredCookieConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookiePreferences) : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- check initial consent status on mount
    setMounted(true);
    const existing = getStoredCookieConsent();
    if (!existing) {
      setVisible(true);
    } else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }

    const handleOpenSettings = () => {
      setVisible(true);
      setShowDetails(true);
    };

    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => window.removeEventListener("open-cookie-settings", handleOpenSettings);
  }, []);

  const saveConsent = (prefs: { analytics: boolean; marketing: boolean }) => {
    const record: CookiePreferences = {
      necessary: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: record }));
    } catch {
      // ignore storage errors
    }
    setAnalytics(prefs.analytics);
    setMarketing(prefs.marketing);
    setVisible(false);
    setShowDetails(false);
  };

  if (!mounted || !visible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Preferences"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-2xl rounded-2xl border border-gold/30 bg-[#080c14]/95 p-5 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:p-6"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/30 text-gold">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold tracking-wide text-white sm:text-base">
              Cookie & Privacy Preferences
            </h3>
            <button
              onClick={() => saveConsent({ analytics: false, marketing: false })}
              className="text-muted-foreground hover:text-white"
              aria-label="Close and reject non-essential"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            VladfsBET uses strictly necessary cookies for authentication and platform security. Optional cookies help us analyze gaming performance and deliver tailored bonuses. Review our{" "}
            <Link href="/cookies" className="text-gold underline hover:text-gold/80">
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-gold underline hover:text-gold/80">
              Privacy Policy
            </Link>.
          </p>

          {showDetails && (
            <div className="my-4 space-y-3 rounded-xl border border-white/10 bg-black/40 p-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Strictly Necessary</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                      Always Active
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Essential for secure login, CSRF protection, and ledger balance projection.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="h-4 w-4 rounded accent-gold cursor-not-allowed opacity-70"
                />
              </div>

              <div className="border-t border-white/5 pt-2.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">Performance & Analytics</span>
                  <p className="text-muted-foreground text-[11px]">
                    Helps us aggregate anonymous turnover metrics and detect game loading bottlenecks.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="analytics-toggle"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="h-4 w-4 rounded accent-gold cursor-pointer"
                />
              </div>

              <div className="border-t border-white/5 pt-2.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">Marketing & Promotions</span>
                  <p className="text-muted-foreground text-[11px]">
                    Used to display relevant VIP tournaments, cashback campaigns, and bonus alerts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="marketing-toggle"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="h-4 w-4 rounded accent-gold cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs border-white/10"
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              {showDetails ? "Hide Preferences" : "Customize"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => saveConsent({ analytics: false, marketing: false })}
              className="text-xs border-white/10 hover:border-white/30"
            >
              Reject Non-Essential
            </Button>
            {showDetails ? (
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={() => saveConsent({ analytics, marketing })}
                className="text-xs"
              >
                <Check className="mr-1 h-3.5 w-3.5" /> Save Choices
              </Button>
            ) : (
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={() => saveConsent({ analytics: true, marketing: true })}
                className="text-xs"
              >
                Accept All
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
