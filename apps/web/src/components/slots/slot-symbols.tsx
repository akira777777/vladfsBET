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

function Caption({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="mt-0.5 max-w-full truncate text-[8px] font-black uppercase tracking-wide sm:text-[9px]"
      style={{ color, textShadow: `0 0 8px ${color}` }}
    >
      {text}
    </span>
  );
}

function MultiplierOrb({ val }: { val: number }) {
  const orbTheme =
    val >= 250
      ? { ring: "#ef4444", fill1: "#f43f5e", fill2: "#881337", glow: "rgba(244,63,94,0.9)", text: "#ffffff" }
      : val >= 50
        ? { ring: "#facc15", fill1: "#fef08a", fill2: "#b45309", glow: "rgba(250,204,21,0.9)", text: "#000000" }
        : val >= 10
          ? { ring: "#c084fc", fill1: "#f3e8ff", fill2: "#6b21a8", glow: "rgba(192,132,252,0.9)", text: "#ffffff" }
          : { ring: "#38bdf8", fill1: "#e0f2fe", fill2: "#0369a1", glow: "rgba(56,189,248,0.9)", text: "#ffffff" };
  const gid = `orbGrad_${val}`;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="absolute inset-0 rounded-full blur-md animate-pulse" style={{ backgroundColor: orbTheme.glow }} />
      <svg viewBox="0 0 100 100" className="h-12 w-12 sm:h-14 sm:w-14 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
        <defs>
          <radialGradient id={gid} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={orbTheme.fill1} />
            <stop offset="60%" stopColor={orbTheme.ring} />
            <stop offset="100%" stopColor={orbTheme.fill2} />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="none" stroke={orbTheme.ring} strokeWidth="3.5" strokeDasharray="8 6" className="origin-center animate-orb-orbit" />
        <circle cx="50" cy="50" r="36" fill={`url(#${gid})`} stroke="#ffffff" strokeWidth="2.5" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black tracking-tighter sm:text-base" style={{ color: orbTheme.text, textShadow: "0 2px 4px rgba(0,0,0,0.9)" }}>
          {val}x
        </span>
      </div>
    </div>
  );
}

function ThemeArt({
  id,
  category,
  name,
  color,
  glow,
}: {
  id: SymbolId;
  category: SlotTheme["category"];
  name: string;
  color: string;
  glow: string;
}) {
  const gid = `${category}_${id}`;
  const svg = "h-11 w-11 sm:h-12 sm:w-12";
  const label = name.split(" ")[0];

  if (id === "WILD") {
    if (category === "CYBERPUNK") {
      return (
        <div className="relative flex flex-col items-center">
          <div className="absolute inset-0 rounded-2xl bg-fuchsia-500/30 blur-md animate-pulse" />
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <polygon points="50,6 94,28 94,72 50,94 6,72 6,28" fill="#0f0a1a" stroke="#f472b6" strokeWidth="3" />
            <path d="M22 50 L40 32 L50 58 L60 32 L78 50 L62 70 L38 70 Z" fill="#22d3ee" />
            <text x="50" y="86" textAnchor="middle" fill="#f472b6" fontSize="11" fontWeight="900">WILD</text>
          </svg>
        </div>
      );
    }
    if (category === "EGYPT") {
      return (
        <div className="relative flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <ellipse cx="50" cy="58" rx="28" ry="18" fill="#14532d" stroke="#fde047" strokeWidth="2" />
            <ellipse cx="50" cy="42" rx="22" ry="16" fill="#166534" stroke="#facc15" strokeWidth="2" />
            <circle cx="40" cy="40" r="4" fill="#fde047" />
            <circle cx="60" cy="40" r="4" fill="#fde047" />
            <path d="M30 58 Q50 78 70 58" fill="none" stroke="#facc15" strokeWidth="2" />
          </svg>
          <Caption text="WILD" color="#fde047" />
        </div>
      );
    }
    if (category === "CANDY") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <circle cx="50" cy="58" r="28" fill="#f472b6" stroke="#fff" strokeWidth="3" />
            <path d="M50 58 m-22 0 a22 22 0 0 1 44 0" fill="#facc15" opacity="0.7" />
            <path d="M50 58 m-22 0 a22 22 0 0 0 44 0" fill="#22d3ee" opacity="0.5" />
            <rect x="46" y="14" width="8" height="22" rx="3" fill="#fde68a" />
          </svg>
          <Caption text="WILD" color="#f9a8d4" />
        </div>
      );
    }
    if (category === "ASIAN") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <ellipse cx="50" cy="58" rx="32" ry="20" fill="#facc15" stroke="#fff7ed" strokeWidth="2" />
            <ellipse cx="50" cy="52" rx="18" ry="10" fill="#b45309" />
            <text x="50" y="56" textAnchor="middle" fill="#fef08a" fontSize="11" fontWeight="900">888</text>
          </svg>
          <Caption text="WILD" color="#fde047" />
        </div>
      );
    }
    if (category === "CLASSIC") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <polygon points="50,8 90,50 50,92 10,50" fill="#1c1917" stroke="#f59e0b" strokeWidth="3" />
            <polygon points="50,22 76,50 50,78 24,50" fill="#f59e0b" />
          </svg>
          <Caption text="WILD" color="#fbbf24" />
        </div>
      );
    }
    return (
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-yellow-300/40 to-amber-500/20 blur-md animate-pulse" />
        <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
          <defs>
            <linearGradient id={`${gid}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <polygon points="50,5 92,26 92,74 50,95 8,74 8,26" fill={`url(#${gid}_gold)`} stroke="#fef08a" strokeWidth="3" />
          <polygon points="50,12 85,30 85,70 50,88 15,70 15,30" fill="#1e1b4b" fillOpacity="0.85" stroke="#fde047" strokeWidth="1.5" />
          <path d="M28 42 L36 58 L50 32 L64 58 L72 42 L68 68 L32 68 Z" fill="#fff" />
        </svg>
        <Caption text="WILD" color="#fde047" />
      </div>
    );
  }

  if (id === "SCATTER") {
    if (category === "CYBERPUNK") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <rect x="18" y="18" width="64" height="64" rx="8" fill="#0ea5e9" stroke="#22d3ee" strokeWidth="3" transform="rotate(12 50 50)" />
            <polygon points="54,22 38,50 50,50 46,80 68,44 54,44" fill="#fff" />
          </svg>
          <Caption text="SCATTER" color="#67e8f9" />
        </div>
      );
    }
    if (category === "EGYPT") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <path d="M18 78 L50 18 L82 78 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="2.5" />
            <rect x="40" y="48" width="20" height="22" fill="#78350f" />
          </svg>
          <Caption text="SCATTER" color="#fde047" />
        </div>
      );
    }
    if (category === "CANDY") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <rect x="30" y="48" width="40" height="36" rx="8" fill="#db2777" stroke="#fbcfe8" strokeWidth="2" />
            <circle cx="50" cy="38" r="22" fill="#f472b6" stroke="#fff" strokeWidth="2" />
            <circle cx="42" cy="34" r="5" fill="#67e8f9" />
            <circle cx="58" cy="40" r="5" fill="#facc15" />
          </svg>
          <Caption text="SCATTER" color="#f9a8d4" />
        </div>
      );
    }
    if (category === "ASIAN") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <path d="M20 72 L50 18 L80 72 Z" fill="#b91c1c" stroke="#facc15" strokeWidth="2.5" />
            <rect x="36" y="50" width="28" height="22" fill="#facc15" />
          </svg>
          <Caption text="SCATTER" color="#fca5a5" />
        </div>
      );
    }
    if (category === "CLASSIC") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <circle cx="50" cy="50" r="32" fill="#292524" stroke="#f59e0b" strokeWidth="4" />
            <circle cx="50" cy="50" r="8" fill="#fbbf24" />
            <path d="M50 22 L54 50 L50 78 L46 50 Z" fill="#f59e0b" />
          </svg>
          <Caption text="SCATTER" color="#fbbf24" />
        </div>
      );
    }
    return (
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 rounded-full bg-sky-400/40 blur-lg animate-spin" style={{ animationDuration: "6s" }} />
        <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="6 4" className="origin-center animate-spin" style={{ animationDuration: "8s" }} />
          <circle cx="50" cy="50" r="36" fill="#0284c7" stroke="#e0f2fe" strokeWidth="2" />
          <polygon points="54,18 36,48 48,48 44,82 66,42 52,42" fill="#fff" stroke="#fef08a" strokeWidth="1.5" />
        </svg>
        <Caption text="SCATTER" color="#67e8f9" />
      </div>
    );
  }

  if (id === "HIGH_1") {
    if (category === "CYBERPUNK") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <rect x="8" y="12" width="84" height="76" rx="14" fill="#18181b" stroke="#f43f5e" strokeWidth="2.5" />
            <text x="50" y="65" textAnchor="middle" fill="#fda4af" fontSize="36" fontWeight="900">777</text>
          </svg>
          <Caption text="TRIPLE 7" color="#fb7185" />
        </div>
      );
    }
    if (category === "CANDY") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <circle cx="50" cy="54" r="34" fill="#d946ef" stroke="#f5d0fe" strokeWidth="2" />
            <path d="M50 14 Q56 6 66 10" stroke="#f97316" strokeWidth="3" fill="none" />
            <text x="50" y="62" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="900">100x</text>
          </svg>
          <Caption text="HEART" color="#f0abfc" />
        </div>
      );
    }
    if (category === "EGYPT") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <ellipse cx="50" cy="58" rx="26" ry="30" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
            <path d="M28 40 Q50 18 72 40" fill="#b45309" />
            <circle cx="40" cy="56" r="4" fill="#1c1917" />
            <circle cx="60" cy="56" r="4" fill="#1c1917" />
            <path d="M40 70 Q50 76 60 70" fill="none" stroke="#78350f" strokeWidth="2" />
          </svg>
          <Caption text="PHARAOH" color="#fde047" />
        </div>
      );
    }
    if (category === "ASIAN") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <path d="M18 62 Q50 12 82 62 Q70 82 50 88 Q30 82 18 62 Z" fill="#dc2626" stroke="#facc15" strokeWidth="2.5" />
            <path d="M30 58 Q50 40 70 58" fill="none" stroke="#fde047" strokeWidth="3" />
            <circle cx="38" cy="52" r="4" fill="#fef08a" />
            <circle cx="62" cy="52" r="4" fill="#fef08a" />
          </svg>
          <Caption text="DRAGON" color="#fca5a5" />
        </div>
      );
    }
    if (category === "CLASSIC") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
            <circle cx="50" cy="42" r="22" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2" />
            <path d="M32 58 Q50 92 68 58" fill="#e7e5e4" />
            <circle cx="42" cy="40" r="3" fill="#1c1917" />
            <circle cx="58" cy="40" r="3" fill="#1c1917" />
          </svg>
          <Caption text="SKULL" color="#d6d3d1" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
          <polygon points="50,8 86,30 80,85 50,96 20,85 14,30" fill="#1e3a8a" stroke="#fef08a" strokeWidth="2.5" />
          <path d="M28 35 Q50 20 72 35 L66 65 Q50 82 34 65 Z" fill="#0f172a" opacity="0.85" />
          <circle cx="40" cy="46" r="3.5" fill="#38bdf8" />
          <circle cx="60" cy="46" r="3.5" fill="#38bdf8" />
          <path d="M30 60 Q50 80 70 60" fill="none" stroke="#fef08a" strokeWidth="3" />
        </svg>
        <Caption text="ZEUS" color="#7dd3fc" />
      </div>
    );
  }

  if (id === "HIGH_2") {
    if (category === "CYBERPUNK") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <polygon points="50,10 88,50 50,90 12,50" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="2.5" />
            <polygon points="50,28 70,50 50,72 30,50" fill="#082f49" />
          </svg>
          <Caption text={label} color="#7dd3fc" />
        </div>
      );
    }
    if (category === "EGYPT") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <path d="M50 12 L58 42 L88 42 L64 60 L74 90 L50 72 L26 90 L36 60 L12 42 L42 42 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
            <path d="M50 30 V78" stroke="#78350f" strokeWidth="4" />
            <path d="M38 48 H62" stroke="#78350f" strokeWidth="4" />
          </svg>
          <Caption text="ANKH" color="#fbbf24" />
        </div>
      );
    }
    if (category === "CANDY") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <ellipse cx="50" cy="58" rx="28" ry="24" fill="#fb7185" />
            <circle cx="38" cy="40" r="12" fill="#fda4af" />
            <circle cx="62" cy="40" r="12" fill="#fda4af" />
            <ellipse cx="42" cy="54" rx="5" ry="7" fill="#1f2937" />
            <ellipse cx="58" cy="54" rx="5" ry="7" fill="#1f2937" />
          </svg>
          <Caption text="BEAR" color="#fda4af" />
        </div>
      );
    }
    if (category === "ASIAN") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <path d="M18 62 Q50 18 82 62 Q50 48 18 62 Z" fill="#f97316" stroke="#fdba74" strokeWidth="2" />
            <circle cx="50" cy="44" r="6" fill="#fde047" />
          </svg>
          <Caption text="FAN" color="#fdba74" />
        </div>
      );
    }
    if (category === "CLASSIC") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <path d="M22 62 A28 28 0 1 1 78 62" fill="none" stroke="#f59e0b" strokeWidth="8" />
            <rect x="46" y="58" width="8" height="22" fill="#f59e0b" />
          </svg>
          <Caption text="LUCK" color="#fbbf24" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
          <circle cx="50" cy="50" r="36" fill="#d97706" stroke="#fef08a" strokeWidth="3" />
          <circle cx="50" cy="50" r="16" fill="#facc15" stroke="#78350f" strokeWidth="2" />
          <circle cx="50" cy="50" r="6" fill="#fff" />
        </svg>
        <Caption text="AEGIS" color="#fbbf24" />
      </div>
    );
  }

  if (id === "HIGH_3") {
    if (category === "CYBERPUNK") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <rect x="14" y="38" width="72" height="24" rx="4" fill="#facc15" stroke="#fef08a" strokeWidth="2" />
            <rect x="22" y="44" width="12" height="12" fill="#0f172a" />
            <rect x="44" y="44" width="12" height="12" fill="#0f172a" />
            <rect x="66" y="44" width="12" height="12" fill="#0f172a" />
          </svg>
          <Caption text="BAR" color="#fde047" />
        </div>
      );
    }
    if (category === "EGYPT") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <ellipse cx="50" cy="48" rx="28" ry="18" fill="#fde047" stroke="#b45309" strokeWidth="2" />
            <circle cx="50" cy="48" r="8" fill="#1c1917" />
            <path d="M22 48 Q50 78 78 48" fill="none" stroke="#b45309" strokeWidth="3" />
          </svg>
          <Caption text="HORUS" color="#fde047" />
        </div>
      );
    }
    if (category === "CANDY") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <ellipse cx="50" cy="58" rx="30" ry="20" fill="#f9a8d4" />
            <path d="M28 50 Q50 18 72 50" fill="#fb7185" />
            <circle cx="50" cy="28" r="8" fill="#f472b6" />
          </svg>
          <Caption text="CUPCAKE" color="#f9a8d4" />
        </div>
      );
    }
    if (category === "ASIAN") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <rect x="38" y="48" width="24" height="32" rx="4" fill="#dc2626" />
            <path d="M24 52 Q50 18 76 52" fill="#facc15" />
          </svg>
          <Caption text="LANTERN" color="#fca5a5" />
        </div>
      );
    }
    if (category === "CLASSIC") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <circle cx="50" cy="38" r="14" fill="#a8a29e" />
            <rect x="46" y="50" width="8" height="28" fill="#78716c" />
            <path d="M50 78 L38 90 M50 78 L62 90" stroke="#a8a29e" strokeWidth="4" />
          </svg>
          <Caption text="KEY" color="#d6d3d1" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
          <path d="M50 8 L58 42 L90 42 L50 92 L42 52 L18 48 Z" fill="#a855f7" stroke="#e9d5ff" strokeWidth="2.5" />
        </svg>
        <Caption text="TRIDENT" color="#c084fc" />
      </div>
    );
  }

  if (id === "HIGH_4") {
    if (category === "CYBERPUNK") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <circle cx="50" cy="42" r="22" fill="#fb7185" />
            <path d="M42 58 Q50 78 58 58" fill="#be123c" />
            <ellipse cx="50" cy="36" rx="8" ry="5" fill="#fff" opacity="0.5" />
          </svg>
          <Caption text="CHERRY" color="#fda4af" />
        </div>
      );
    }
    if (category === "EGYPT") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <path d="M16 78 L50 18 L84 78 Z" fill="#eab308" stroke="#fef08a" strokeWidth="2" />
            <rect x="44" y="52" width="12" height="16" fill="#78350f" />
          </svg>
          <Caption text="PYRAMID" color="#fde047" />
        </div>
      );
    }
    if (category === "CANDY") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <path d="M40 18 Q70 30 58 88" fill="none" stroke="#fff" strokeWidth="10" />
            <path d="M40 18 Q70 30 58 88" fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray="8 8" />
          </svg>
          <Caption text="CANE" color="#fda4af" />
        </div>
      );
    }
    if (category === "ASIAN") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <circle cx="50" cy="50" r="28" fill="#facc15" stroke="#b45309" strokeWidth="3" />
            <text x="50" y="58" textAnchor="middle" fill="#7f1d1d" fontSize="22" fontWeight="900">8</text>
          </svg>
          <Caption text="COIN" color="#fde047" />
        </div>
      );
    }
    if (category === "CLASSIC") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
            <rect x="28" y="28" width="44" height="52" rx="8" fill="#92400e" stroke="#fbbf24" strokeWidth="2" />
            <path d="M28 48 H72" stroke="#f59e0b" strokeWidth="3" />
          </svg>
          <Caption text="VAULT" color="#fbbf24" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 10px ${glow})` }}>
          <path d="M30 22 L70 22 L64 52 Q50 78 36 52 Z" fill="#eab308" stroke="#fef08a" strokeWidth="2" />
          <rect x="34" y="80" width="32" height="8" rx="2" fill="#eab308" />
        </svg>
        <Caption text="CHALICE" color="#fde047" />
      </div>
    );
  }

  if (id === "MED_1" || id === "MED_2") {
    const isMed1 = id === "MED_1";
    if (category === "CYBERPUNK") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
            <path d="M30 28 H70 L78 48 L50 88 L22 48 Z" fill={isMed1 ? "#fb923c" : "#a855f7"} stroke="#fff" strokeWidth="2" />
          </svg>
          <Caption text={label} color={isMed1 ? "#fdba74" : "#c084fc"} />
        </div>
      );
    }
    if (category === "EGYPT") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
            {isMed1 ? (
              <path d="M28 70 Q50 20 72 70 Q50 58 28 70 Z" fill="#166534" stroke="#fde047" strokeWidth="2" />
            ) : (
              <ellipse cx="50" cy="52" rx="26" ry="16" fill="#6d28d9" stroke="#e9d5ff" strokeWidth="2" />
            )}
          </svg>
          <Caption text={isMed1 ? "SCARAB" : "LOTUS"} color={glow} />
        </div>
      );
    }
    if (category === "CANDY") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
            <rect x="28" y="28" width="44" height="44" rx={isMed1 ? 16 : 6} fill={isMed1 ? "#22d3ee" : "#facc15"} stroke="#fff" strokeWidth="3" />
          </svg>
          <Caption text={isMed1 ? "JELLY" : "STAR"} color={glow} />
        </div>
      );
    }
    if (category === "ASIAN") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
            {isMed1 ? (
              <polygon points="50,16 62,40 88,44 68,62 74,88 50,74 26,88 32,62 12,44 38,40" fill="#4ade80" stroke="#bbf7d0" strokeWidth="2" />
            ) : (
              <path d="M50 20 Q70 50 50 80 Q30 50 50 20 Z" fill="#ef4444" stroke="#facc15" strokeWidth="2" />
            )}
          </svg>
          <Caption text={isMed1 ? "JADE" : "KNOT"} color={glow} />
        </div>
      );
    }
    if (category === "CLASSIC") {
      return (
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
            {isMed1 ? (
              <path d="M50 18 L62 46 L50 82 L38 46 Z" fill="#1c1917" />
            ) : (
              <polygon points="50,18 82,50 50,82 18,50" fill="#dc2626" />
            )}
          </svg>
          <Caption text={isMed1 ? "SPADE" : "DIAMOND"} color={glow} />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 100" className={svg} style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
          <polygon points="50,14 86,50 50,86 14,50" fill={isMed1 ? "#dc2626" : "#059669"} stroke={isMed1 ? "#fca5a5" : "#6ee7b7"} strokeWidth="2.5" />
          <polygon points="50,28 72,50 50,72 28,50" fill={isMed1 ? "#7f1d1d" : "#064e3b"} />
        </svg>
        <Caption text={label} color={isMed1 ? "#fda4af" : "#6ee7b7"} />
      </div>
    );
  }

  const royalLetters: Record<string, { letter: string; color: string }> = {
    LOW_A: { letter: "A", color: color },
    LOW_K: { letter: "K", color: color },
    LOW_Q: { letter: "Q", color: color },
    LOW_J: { letter: "J", color: color },
    LOW_10: { letter: "10", color: color },
  };
  const royal = royalLetters[id] || { letter: "?", color: "#94a3b8" };
  const plate =
    category === "CYBERPUNK"
      ? "from-fuchsia-500/25 to-slate-950/60 border-cyan-400/30"
      : category === "EGYPT"
        ? "from-amber-500/25 to-stone-950/60 border-yellow-500/30"
        : category === "CANDY"
          ? "from-pink-500/25 to-fuchsia-950/60 border-pink-300/30"
          : category === "ASIAN"
            ? "from-red-600/25 to-red-950/60 border-amber-400/30"
            : category === "CLASSIC"
              ? "from-stone-500/25 to-stone-950/70 border-amber-700/40"
              : "from-indigo-500/20 to-slate-950/60 border-sky-400/25";

  return (
    <div className={`relative flex items-center justify-center rounded-xl border bg-gradient-to-b p-1.5 ${plate}`}>
      <span
        className="font-black tracking-tighter"
        style={{
          fontSize: royal.letter.length > 1 ? "20px" : "24px",
          color: royal.color,
          textShadow: `0 0 10px ${glow}, 0 2px 4px rgba(0,0,0,0.8)`,
        }}
      >
        {royal.letter}
      </span>
    </div>
  );
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
  };

  const dim = size === "sm" ? "w-9 h-9 sm:w-11 sm:h-11" : size === "lg" ? "w-20 h-20" : "w-11 h-11 sm:w-14 sm:h-14";

  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-300 ${dim} ${
        isExploding
          ? "z-30"
          : isWinning
            ? "z-20 scale-110 animate-win-glow"
            : isScatterTease
              ? "z-20 animate-scatter-tease"
              : id === "WILD" || id === "SCATTER" || id === "MULTIPLIER_ORB"
                ? "animate-symbol-breathe"
                : ""
      }`}
    >
      {isWinning && !isExploding && (
        <>
          <div className="pointer-events-none absolute -inset-1 z-[1] rounded-2xl border-2 border-yellow-400 bg-yellow-400/20 animate-shatter-ring" />
          <div className="pointer-events-none absolute inset-0 z-[1] rounded-2xl animate-win-shimmer" />
        </>
      )}
      {id === "MULTIPLIER_ORB" ? (
        <MultiplierOrb val={multiplierValue || 2} />
      ) : (
        <ThemeArt id={id} category={theme.category} name={def.name} color={def.color} glow={def.glowColor} />
      )}
    </div>
  );
}
