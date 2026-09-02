"use client";

import React from "react";
import { SymbolId } from "@/lib/slots/slot-engine";
import { SlotTheme } from "@/lib/slots/slot-themes";

interface SymbolIconProps {
  id: SymbolId;
  multiplierValue?: number;
  theme: SlotTheme;
  isWinning?: boolean;
  isScatterTease?: boolean;
  isExploding?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SlotSymbolIcon({
  id,
  multiplierValue,
  theme,
  isWinning = false,
  isScatterTease = false,
  isExploding = false,
  size = "md",
}: SymbolIconProps) {
  const def = theme.symbols[id] || {
    name: id,
    color: "#eab308",
    glowColor: "#fde047",
    isWild: id === "WILD",
    isScatter: id === "SCATTER",
    isMultiplier: id === "MULTIPLIER_ORB",
  };

  const dim = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-20 h-20" : "w-14 h-14 sm:w-16 sm:h-16";
  const category = theme.category;

  const renderIconGraphic = () => {
    // --- 1. MULTIPLIER ORBS (Zeus Electric / Sugar Bomb / Cyber Core / Dragon Pearl) ---
    if (id === "MULTIPLIER_ORB") {
      const val = multiplierValue || 2;

      // Color themes based on multiplier magnitude:
      // 2x - 5x: Electric Cyan / Lime
      // 10x - 25x: Arcane Violet / Magenta
      // 50x - 100x: Golden Sunfire / Amber
      // 250x - 500x: Legendary Crimson / Rainbow Cosmic
      const orbTheme =
        val >= 250
          ? { ring: "#ef4444", fill1: "#f43f5e", fill2: "#881337", glow: "rgba(244,63,94,0.9)", text: "#ffffff" }
          : val >= 50
          ? { ring: "#facc15", fill1: "#fef08a", fill2: "#b45309", glow: "rgba(250,204,21,0.9)", text: "#000000" }
          : val >= 10
          ? { ring: "#c084fc", fill1: "#f3e8ff", fill2: "#6b21a8", glow: "rgba(192,132,252,0.9)", text: "#ffffff" }
          : { ring: "#38bdf8", fill1: "#e0f2fe", fill2: "#0369a1", glow: "rgba(56,189,248,0.9)", text: "#ffffff" };

      return (
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in">
          {/* Pulsing Aura */}
          <div
            className="absolute inset-0 rounded-full blur-md animate-pulse"
            style={{ backgroundColor: orbTheme.glow, animationDuration: "1.2s" }}
          />

          <svg viewBox="0 0 100 100" className="w-13 h-13 sm:w-15 sm:h-15 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
            <defs>
              <radialGradient id={`orbGrad_${val}`} cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor={orbTheme.fill1} />
                <stop offset="60%" stopColor={orbTheme.ring} />
                <stop offset="100%" stopColor={orbTheme.fill2} />
              </radialGradient>
            </defs>

            {/* Rotating Energy Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={orbTheme.ring}
              strokeWidth="3.5"
              strokeDasharray="8 6"
              className="animate-spin origin-center"
              style={{ animationDuration: "4s" }}
            />

            {/* Glowing Core Sphere */}
            <circle cx="50" cy="50" r="36" fill={`url(#orbGrad_${val})`} stroke="#ffffff" strokeWidth="2.5" />

            {/* Energy Sparks / Lightning Wings */}
            <path
              d="M16 50 Q30 30 50 20 Q70 30 84 50 Q70 70 50 80 Q30 70 16 50 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              opacity="0.75"
            />
          </svg>

          {/* Bold Centered Multiplier Badge */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="font-black text-sm sm:text-base tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              style={{ color: orbTheme.text }}
            >
              {val}x
            </span>
          </div>
        </div>
      );
    }

    // --- 2. WILD SYMBOL ---
    if (id === "WILD") {
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-yellow-300/40 to-amber-500/20 blur-md animate-pulse" />
          <svg viewBox="0 0 100 100" className="w-13 h-13 sm:w-15 sm:h-15 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="wildCrown" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <polygon points="50,5 92,26 92,74 50,95 8,74 8,26" fill="url(#goldGrad)" stroke="#fef08a" strokeWidth="3" />
            <polygon points="50,12 85,30 85,70 50,88 15,70 15,30" fill="#1e1b4b" fillOpacity="0.85" stroke="#fde047" strokeWidth="1.5" />
            <path d="M28 42 L36 58 L50 32 L64 58 L72 42 L68 68 L32 68 Z" fill="url(#wildCrown)" />
            <circle cx="28" cy="40" r="3" fill="#ffffff" />
            <circle cx="50" cy="30" r="4" fill="#ffffff" />
            <circle cx="72" cy="40" r="3" fill="#ffffff" />
          </svg>
          <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,1)] bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent uppercase">
            WILD
          </span>
        </div>
      );
    }

    // --- 3. SCATTER SYMBOL ---
    if (id === "SCATTER") {
      return (
        <div className={`relative flex flex-col items-center justify-center ${isScatterTease ? "scale-115" : ""}`}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/40 via-cyan-300/50 to-blue-600/40 blur-lg animate-spin" style={{ animationDuration: "6s" }} />
          <svg viewBox="0 0 100 100" className="w-13 h-13 sm:w-15 sm:h-15 drop-shadow-[0_0_15px_rgba(56,189,248,0.95)]">
            <defs>
              <radialGradient id="orbGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="40%" stopColor="#38bdf8" />
                <stop offset="80%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="6 4" className="animate-spin origin-center" style={{ animationDuration: "8s" }} />
            <circle cx="50" cy="50" r="36" fill="url(#orbGrad)" stroke="#e0f2fe" strokeWidth="2" />
            <polygon points="54,18 36,48 48,48 44,82 66,42 52,42" fill="#ffffff" stroke="#fef08a" strokeWidth="1.5" />
          </svg>
          <span className="text-[9px] sm:text-[10px] font-black tracking-wider text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,1)] bg-gradient-to-r from-sky-200 to-cyan-300 bg-clip-text text-transparent uppercase">
            SCATTER
          </span>
        </div>
      );
    }

    // --- 4. HIGH 1 (THEME HERO) ---
    if (id === "HIGH_1") {
      if (category === "CYBERPUNK") {
        return (
          <div className="flex flex-col items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-13 h-13 sm:w-15 sm:h-15 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]">
              <defs>
                <linearGradient id="neon777" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffe4e6" />
                  <stop offset="50%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#9f1239" />
                </linearGradient>
              </defs>
              <rect x="8" y="12" width="84" height="76" rx="14" fill="#18181b" stroke="#f43f5e" strokeWidth="2.5" />
              <text x="50" y="65" textAnchor="middle" fill="url(#neon777)" fontSize="44" fontWeight="900" fontFamily="sans-serif" letterSpacing="-2">
                777
              </text>
            </svg>
            <span className="text-[9px] font-bold text-rose-400">TRIPLE 7</span>
          </div>
        );
      }
      if (category === "CANDY") {
        return (
          <div className="flex flex-col items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-13 h-13 sm:w-15 sm:h-15 drop-shadow-[0_0_12px_rgba(217,70,239,0.9)]">
              <radialGradient id="bombGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fdf4ff" />
                <stop offset="40%" stopColor="#d946ef" />
                <stop offset="90%" stopColor="#701a75" />
              </radialGradient>
              <circle cx="50" cy="54" r="34" fill="url(#bombGrad)" stroke="#f5d0fe" strokeWidth="2" />
              <rect x="46" y="14" width="8" height="10" fill="#facc15" rx="2" />
              <path d="M50 14 Q56 6 66 10" stroke="#f97316" strokeWidth="3" fill="none" />
              <circle cx="68" cy="10" r="4" fill="#ef4444" className="animate-ping" />
              <text x="50" y="62" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="900">
                100x
              </text>
            </svg>
            <span className="text-[9px] font-bold text-fuchsia-300">CANDY HEART</span>
          </div>
        );
      }
      // Olympus Hero: Zeus
      return (
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-13 h-13 sm:w-15 sm:h-15 drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]">
            <defs>
              <linearGradient id="zeusGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
            </defs>
            <polygon points="50,8 86,30 80,85 50,96 20,85 14,30" fill="url(#zeusGrad)" stroke="#fef08a" strokeWidth="2.5" />
            <path d="M28 35 Q50 20 72 35 L66 65 Q50 82 34 65 Z" fill="#0f172a" opacity="0.8" />
            <circle cx="40" cy="46" r="3.5" fill="#38bdf8" />
            <circle cx="60" cy="46" r="3.5" fill="#38bdf8" />
            <path d="M30 60 Q50 80 70 60" fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-[9px] font-bold text-sky-300">ZEUS</span>
        </div>
      );
    }

    // --- 5. HIGH 2, 3, 4 ---
    if (id === "HIGH_2") {
      return (
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
            <polygon points="50,10 88,25 82,75 50,92 18,75 12,25" fill="#d97706" stroke="#fef08a" strokeWidth="2" />
            <circle cx="50" cy="50" r="20" fill="#facc15" stroke="#78350f" strokeWidth="2" />
          </svg>
          <span className="text-[9px] font-bold text-amber-300">{def.name.split(" ")[0]}</span>
        </div>
      );
    }

    if (id === "HIGH_3") {
      return (
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
            <polygon points="50,12 85,38 72,88 28,88 15,38" fill="#a855f7" stroke="#e9d5ff" strokeWidth="2" />
            <polygon points="50,22 75,42 65,78 35,78 25,42" fill="#3b0764" opacity="0.6" />
          </svg>
          <span className="text-[9px] font-bold text-purple-300">{def.name.split(" ")[0]}</span>
        </div>
      );
    }

    if (id === "HIGH_4") {
      return (
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">
            <path d="M30 25 L70 25 L65 55 Q50 75 35 55 Z" fill="#eab308" stroke="#fef08a" strokeWidth="2" />
            <rect x="34" y="80" width="32" height="8" rx="2" fill="#eab308" stroke="#fef08a" strokeWidth="1" />
          </svg>
          <span className="text-[9px] font-bold text-yellow-300">{def.name.split(" ")[0]}</span>
        </div>
      );
    }

    // --- 6. MED 1 / MED 2 ---
    if (id === "MED_1" || id === "MED_2") {
      const isRed = id === "MED_1";
      return (
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-11 h-11 sm:w-13 sm:h-13 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">
            <polygon
              points="50,15 85,50 50,85 15,50"
              fill={isRed ? "#dc2626" : "#059669"}
              stroke={isRed ? "#fca5a5" : "#6ee7b7"}
              strokeWidth="2.5"
            />
            <polygon points="50,28 72,50 50,72 28,50" fill={isRed ? "#7f1d1d" : "#064e3b"} />
          </svg>
          <span className={`text-[9px] font-bold ${isRed ? "text-rose-300" : "text-emerald-300"}`}>
            {def.name.split(" ")[0]}
          </span>
        </div>
      );
    }

    // --- 7. LOW PAYING ROYALS ---
    const royalLetters: Record<string, { letter: string; color: string; stroke: string; bg: string }> = {
      LOW_A: { letter: "A", color: "#f43f5e", stroke: "#fda4af", bg: "from-rose-500/20 to-rose-950/40" },
      LOW_K: { letter: "K", color: "#f97316", stroke: "#fdba74", bg: "from-orange-500/20 to-orange-950/40" },
      LOW_Q: { letter: "Q", color: "#eab308", stroke: "#fde047", bg: "from-yellow-500/20 to-yellow-950/40" },
      LOW_J: { letter: "J", color: "#10b981", stroke: "#6ee7b7", bg: "from-emerald-500/20 to-emerald-950/40" },
      LOW_10: { letter: "10", color: "#06b6d4", stroke: "#67e8f9", bg: "from-cyan-500/20 to-cyan-950/40" },
    };

    const royal = royalLetters[id] || { letter: "?", color: "#94a3b8", stroke: "#cbd5e1", bg: "from-slate-500/20 to-slate-950/40" };

    return (
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-b ${royal.bg} border border-white/10 p-1.5`}>
        <span
          className="font-black tracking-tighter"
          style={{
            fontSize: royal.letter.length > 1 ? "22px" : "26px",
            color: royal.color,
            textShadow: `0 0 10px ${royal.stroke}, 0 2px 4px rgba(0,0,0,0.8)`,
          }}
        >
          {royal.letter}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-300 ${dim} ${
        isExploding
          ? "z-30"
          : isWinning
          ? "scale-110 z-20 animate-win-glow"
          : id === "WILD" || id === "SCATTER" || id === "MULTIPLIER_ORB"
          ? "animate-symbol-breathe"
          : ""
      }`}
    >
      {isWinning && !isExploding && (
        <>
          <div className="absolute -inset-1 rounded-2xl border-2 border-yellow-400 bg-yellow-400/20 animate-shatter-ring pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl animate-win-shimmer pointer-events-none z-[1]" />
        </>
      )}
      {renderIconGraphic()}
    </div>
  );
}

