"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { slotAudio } from "@/lib/slots/slot-audio";

interface SlotMascotProps {
  themeId: string;
  isSpinning: boolean;
  isBonus: boolean;
  lastWin?: number;
  scatterCount: number;
  compact?: boolean;
  forceStrike?: boolean;
}

interface MascotData {
  id: string;
  name: string;
  title: string;
  imageSrc: string;
  accentColor: string;
  glowColor: string;
  strikeQuotes: string[];
  chargeQuotes: string[];
  bonusQuote: string;
  runes: string[];
}

const MASCOTS: Record<string, MascotData> = {
  zeus: {
    id: "zeus",
    name: "ZEUS",
    title: "GOD OF THUNDER",
    imageSrc: "/slots/mascots/zeus.jpg",
    accentColor: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.7)",
    strikeQuotes: [
      "⚡ BY ZEUS'S POWER!",
      "⚡ DIVINE THUNDER STRIKE!",
      "🔱 FEEL THE GODLY MULTIPLIER!",
      "⚡ OLYMPUS BLESSES THIS REEL!",
    ],
    chargeQuotes: ["⚡ THUNDER AWAKENS...", "⚡ OLYMPUS HEARS YOU!"],
    bonusQuote: "🔥 UNLEASH THE MULTIPLIERS!",
    runes: ["⚡", "🔱", "🏛️", "🦅"],
  },
  cyber: {
    id: "cyber",
    name: "CYBER SHOGUN",
    title: "SYSTEM OVERLORD",
    imageSrc: "/slots/mascots/cyber-boss.jpg",
    accentColor: "#f472b6",
    glowColor: "rgba(236, 72, 153, 0.7)",
    strikeQuotes: [
      "⚔️ CRITICAL SYSTEM OVERLOAD!",
      "⚡ NEON OVERDRIVE ACTIVATED!",
      "💾 MATRIX JACKPOT PROTOCOL!",
      "⚔️ SLICE THROUGH THE REELS!",
    ],
    chargeQuotes: ["⚡ OVERCLOCKING REELS...", "🔮 MATRIX RECONFIGURING..."],
    bonusQuote: "🔥 CYBER MATRIX UNLOCKED!",
    runes: ["⚡", "⚔️", "💾", "🔮"],
  },
  pharaoh: {
    id: "pharaoh",
    name: "AMUN-RA",
    title: "SUN GOD OF EGYPT",
    imageSrc: "/slots/mascots/pharaoh.jpg",
    accentColor: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.7)",
    strikeQuotes: [
      "✨ BLESSING OF THE SUN GOD!",
      "👑 ETERNAL GOLD OF THE NILE!",
      "🏺 SACRED TOMB UNSEALED!",
      "✨ GAZE UPON RA'S RICHES!",
    ],
    chargeQuotes: ["✨ PYRAMIDS ALIGN...", "🐍 ANUBIS WATCHES..."],
    bonusQuote: "🔥 PHARAOH'S TREASURE UNSEALED!",
    runes: ["☀️", "👑", "🐍", "🏺"],
  },
  candy: {
    id: "candy",
    name: "SUGAR QUEEN",
    title: "COTTON CANDY REALM",
    imageSrc: "/slots/mascots/sugar-queen.jpg",
    accentColor: "#f472b6",
    glowColor: "rgba(244, 114, 182, 0.7)",
    strikeQuotes: [
      "🍭 SWEET EXPLOSION!",
      "🍬 SUGAR BONANZA DROP!",
      "✨ DELICIOUS YUMMY HIT!",
      "🍭 TASTE THE RAINBOW WIN!",
    ],
    chargeQuotes: ["🍬 SUGAR RUSH CHARGING...", "🧁 FROSTING CASCADE..."],
    bonusQuote: "🔥 SUPER SWEET FREE SPINS!",
    runes: ["🍭", "🍬", "🧁", "🍩"],
  },
  dragon: {
    id: "dragon",
    name: "GOLDEN DRAGON",
    title: "EMPEROR OF FORTUNE",
    imageSrc: "/slots/mascots/dragon.jpg",
    accentColor: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.7)",
    strikeQuotes: [
      "🐉 DRAGON BREATH OF WEALTH!",
      "🔥 HEAVENLY FORTUNE SHOWER!",
      "🪙 888 IMPERIAL PROSPERITY!",
      "🐉 AWAKEN THE GOLDEN BEAST!",
    ],
    chargeQuotes: ["🐉 CELESTIAL SPIRIT RISES...", "🀄 JADE GATES OPEN..."],
    bonusQuote: "🔥 DRAGON FEAST SPINS!",
    runes: ["🐉", "🪙", "🀄", "🔥"],
  },
};

function getMascotForTheme(themeId: string): MascotData {
  if (themeId === "gates-of-vladfs" || themeId === "sandbox-slots") {
    return MASCOTS.zeus;
  }
  if (themeId === "cyber-neon-777" || themeId === "neon-cyber-slots") {
    return MASCOTS.cyber;
  }
  if (themeId === "pharaoh-gold-deluxe" || themeId === "dead-mans-vault") {
    return MASCOTS.pharaoh;
  }
  if (themeId === "sugar-rush-frenzy") {
    return MASCOTS.candy;
  }
  if (themeId.includes("dragon") || themeId.includes("asian") || themeId === "dragon-fortune-888") {
    return MASCOTS.dragon;
  }
  return MASCOTS.zeus;
}

export const SlotMascot = React.memo(function SlotMascot({
  themeId,
  isSpinning,
  isBonus,
  lastWin: _lastWin,
  scatterCount,
  compact = false,
  forceStrike = false,
}: SlotMascotProps) {
  const mascot = getMascotForTheme(themeId);
  const charging = scatterCount >= 2;
  const [striking, setStriking] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const nextSparkleId = useRef(0);

  const triggerStrike = useCallback((isManual = false) => {
    setStriking(true);
    setQuoteIdx((prev) => (prev + 1) % mascot.strikeQuotes.length);

    if (isManual) {
      slotAudio.playMultiplierOrbCharge(80);
    }

    // Spawn 8 burst sparkles
    const newSparks = Array.from({ length: 8 }, () => {
      nextSparkleId.current++;
      return {
        id: nextSparkleId.current,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
        size: Math.random() * 8 + 6,
      };
    });
    setSparkles((prev) => [...prev.slice(-16), ...newSparks]);

    const timer = setTimeout(() => {
      setStriking(false);
    }, 850);
    return () => clearTimeout(timer);
  }, [mascot.strikeQuotes.length]);

  useEffect(() => {
    if (!forceStrike) return;
    const cleanup = triggerStrike(false);
    return cleanup;
  }, [forceStrike, triggerStrike]);

  // Clean up sparkles periodically
  useEffect(() => {
    if (sparkles.length === 0) return;
    const t = setTimeout(() => {
      setSparkles((prev) => prev.slice(4));
    }, 1200);
    return () => clearTimeout(t);
  }, [sparkles]);

  // Compact circular mobile badge
  if (compact) {
    return (
      <div
        onClick={() => triggerStrike(true)}
        className="group relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-amber-400/90 bg-neutral-950 shadow-[0_0_12px_rgba(251,191,36,0.65)] transition-transform active:scale-95 pointer-events-auto"
        title={`${mascot.name} (${mascot.title}) · Click for blessing!`}
      >
        <img
          src={mascot.imageSrc}
          alt={mascot.name}
          className={`h-full w-full object-cover object-top scale-135 transition-transform duration-300 ${
            striking ? "scale-150 brightness-130" : "group-hover:scale-145"
          }`}
        />
        {charging && (
          <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-80" />
        )}
        {striking && (
          <span className="pointer-events-none absolute inset-0 rounded-full bg-white/40 animate-pulse" />
        )}
      </div>
    );
  }

  const currentQuote = isBonus
    ? mascot.bonusQuote
    : charging && !striking
    ? mascot.chargeQuotes[0]
    : mascot.strikeQuotes[quoteIdx];

  return (
    <div
      onClick={() => triggerStrike(true)}
      className="group relative flex flex-col items-center justify-end select-none pointer-events-auto cursor-pointer w-52 sm:w-60 h-[400px] sm:h-[480px] transition-all"
      title={`${mascot.name} · Click for divine blessing!`}
    >
      {/* Dynamic Floating Character Wrapper */}
      <div
        className={`relative w-full h-full flex flex-col items-center justify-end transition-all duration-500 ${
          isSpinning ? "translate-y-[-8px] scale-105" : "animate-mascot-float"
        } ${striking ? "animate-mascot-strike" : ""}`}
      >
        {/* ── Radiant Backlight & Energy Aura ── */}
        <div
          className={`pointer-events-none absolute inset-4 rounded-full blur-3xl transition-all duration-500 ${
            striking
              ? "opacity-100 scale-125"
              : charging
              ? "opacity-90 scale-110 animate-pulse"
              : isBonus
              ? "opacity-95 scale-115"
              : "opacity-65 scale-100"
          }`}
          style={{
            background: striking
              ? `radial-gradient(circle, #fde047 0%, ${mascot.accentColor} 50%, transparent 75%)`
              : charging
              ? "radial-gradient(circle, #67e8f9 0%, #0284c7 50%, transparent 75%)"
              : isBonus
              ? "radial-gradient(circle, #facc15 0%, #ec4899 50%, transparent 75%)"
              : `radial-gradient(circle, ${mascot.glowColor} 0%, rgba(0,0,0,0) 70%)`,
          }}
        />

        {/* ── Volumetric Light Rays (Zeus / Sun Aura) ── */}
        <div className="pointer-events-none absolute -top-8 w-64 h-64 opacity-40 animate-[spin_30s_linear_infinite]">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${mascot.accentColor}33 30deg, transparent 60deg, ${mascot.accentColor}33 120deg, transparent 150deg, ${mascot.accentColor}33 210deg, transparent 240deg, ${mascot.accentColor}33 300deg, transparent 330deg)`,
            }}
          />
        </div>

        {/* ── Shockwave Ring on Strike ── */}
        {striking && (
          <div
            className="pointer-events-none absolute inset-6 rounded-full border-2 animate-ping"
            style={{ borderColor: mascot.accentColor }}
          />
        )}

        {/* ── High-Detail 3D Mascot Character Art (Nana Banana Generated) ── */}
        <div className="relative w-full h-[320px] sm:h-[390px] flex items-center justify-center overflow-visible z-10">
          <img
            src={mascot.imageSrc}
            alt={mascot.name}
            className={`w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)] transition-all duration-300 ${
              striking ? "brightness-125 contrast-110" : "brightness-105"
            }`}
            style={{
              mixBlendMode: "screen",
              maskImage: "radial-gradient(ellipse 84% 92% at 50% 50%, black 72%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 84% 92% at 50% 50%, black 72%, transparent 100%)",
            }}
          />

          {/* Dynamic Electric / Energy Arcs on Mascot Weapon ── */}
          {striking && (
            <svg
              viewBox="0 0 200 240"
              className="pointer-events-none absolute inset-0 w-full h-full z-20 overflow-visible"
            >
              <defs>
                <filter id="mascotZapGlow">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M 50,40 L 70,80 L 55,100 L 95,140 L 80,165 L 120,210"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#mascotZapGlow)"
                className="animate-electric-arc"
              />
              <path
                d="M 140,50 L 125,95 L 145,115 L 115,165 L 135,185 L 100,225"
                fill="none"
                stroke={mascot.accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#mascotZapGlow)"
                className="animate-electric-arc"
              />
              <circle cx="50" cy="40" r="5" fill="#fff" className="animate-ping" />
              <circle cx="140" cy="50" r="4" fill="#fff" className="animate-ping" />
            </svg>
          )}

          {/* Floating Sparkles from Clicks */}
          {sparkles.map((sp) => (
            <span
              key={`mascot-sp-${sp.id}`}
              className="pointer-events-none absolute rounded-full bg-white animate-ping"
              style={{
                left: `${sp.x}%`,
                top: `${sp.y}%`,
                width: `${sp.size}px`,
                height: `${sp.size}px`,
                boxShadow: `0 0 12px ${mascot.accentColor}, 0 0 24px #fff`,
              }}
            />
          ))}
        </div>

        {/* ── 3D Holographic Summoning Pedestal at Feet ── */}
        <div className="absolute bottom-6 w-44 sm:w-52 h-10 pointer-events-none flex items-center justify-center z-0">
          {/* Outer Runic / Tech Ring */}
          <div
            className="absolute inset-0 rounded-full border-2 animate-pedestal-spin opacity-80"
            style={{
              borderColor: mascot.accentColor,
              boxShadow: `0 0 24px ${mascot.accentColor}88, inset 0 0 16px ${mascot.accentColor}55`,
            }}
          />

          {/* Inner Counter-Rotating Ring */}
          <div
            className="absolute w-32 h-6 rounded-full border border-white/80 animate-pedestal-spin-reverse opacity-90"
            style={{
              boxShadow: "0 0 12px rgba(255,255,255,0.7)",
            }}
          />

          {/* Ground Hover Shadow */}
          <div
            className={`w-36 h-4 rounded-full bg-black/90 blur-md transition-all duration-500 ${
              isSpinning ? "scale-90 opacity-60" : "scale-100 opacity-90"
            }`}
          />

          {/* Floating Base Runes */}
          <div className="absolute -bottom-1 flex items-center gap-4 text-xs opacity-75">
            {mascot.runes.map((rune, idx) => (
              <span
                key={`rune-${idx}`}
                className="animate-pulse"
                style={{ animationDelay: `${idx * 250}ms` }}
              >
                {rune}
              </span>
            ))}
          </div>
        </div>

        {/* ── Character Name & Title Pill ── */}
        <div className="relative z-20 mt-1 flex flex-col items-center">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/85 border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-transform group-hover:scale-105">
            <span
              className="h-2 w-2 rounded-full animate-ping"
              style={{ backgroundColor: mascot.accentColor }}
            />
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
              {mascot.name}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline border-l border-white/20 pl-2">
              {isBonus ? "★ SUPERCHARGED ★" : mascot.title}
            </span>
          </div>
        </div>

        {/* ── Dynamic Speech / Shout Bubble ── */}
        {(striking || charging || isBonus) && (
          <div
            className={`absolute -top-6 z-30 flex items-center gap-1.5 px-3.5 py-1 rounded-full border-2 shadow-2xl backdrop-blur-md animate-mascot-speech pointer-events-none ${
              striking
                ? "border-amber-300 bg-black/95 shadow-[0_0_30px_rgba(251,191,36,1)]"
                : charging
                ? "border-cyan-400 bg-black/90 shadow-[0_0_20px_rgba(6,182,212,0.9)]"
                : "border-pink-400 bg-black/90 shadow-[0_0_20px_rgba(236,72,153,0.8)]"
            }`}
          >
            <span
              className={`text-[10px] sm:text-[11px] font-black tracking-wider uppercase ${
                striking
                  ? "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                  : charging
                  ? "text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.9)]"
                  : "text-pink-300 drop-shadow-[0_0_6px_rgba(236,72,153,0.9)]"
              }`}
            >
              {currentQuote}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
