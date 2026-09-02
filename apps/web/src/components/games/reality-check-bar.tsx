"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ShieldAlert } from "lucide-react";

export function RealityCheckBar() {
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/8 bg-black/40 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-white/90">
          <Clock className="h-3.5 w-3.5 text-gold" />
          <span>Session: <strong className="font-mono text-gold">{formatTime(sessionSeconds)}</strong></span>
        </div>
        <div className="hidden sm:inline-block h-3 w-px bg-white/10" />
        <span className="hidden sm:inline text-white/60">Demo Mode • 18+ Play Responsibly</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/responsible-gaming"
          className="flex items-center gap-1 text-xs text-amber-400/90 transition-colors hover:text-amber-300 hover:underline"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Set Gaming Limits</span>
        </Link>
      </div>
    </div>
  );
}
