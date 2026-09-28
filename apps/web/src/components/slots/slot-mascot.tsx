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
    glowColor: "rgba(56, 189, 248, 0.75)",
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
    glowColor: "rgba(236, 72, 153, 0.75)",
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
    glowColor: "rgba(245, 158, 11, 0.75)",
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
    glowColor: "rgba(244, 114, 182, 0.75)",
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
    glowColor: "rgba(239, 68, 68, 0.75)",
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

  // 3D Mouse Parallax state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to +1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to +1
    setTilt({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const triggerStrike = useCallback((isManual = false) => {
    setStriking(true);
    setQuoteIdx((prev) => (prev + 1) % mascot.strikeQuotes.length);

    if (isManual) {
      slotAudio.playMultiplierOrbCharge(80);
    }

    // Spawn 10 burst sparkles around character
    const newSparks = Array.from({ length: 10 }, () => {
      nextSparkleId.current++;
      return {
        id: nextSparkleId.current,
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 70,
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
      setSparkles((prev) => prev.slice(5));
    }, 1000);
    return () => clearTimeout(t);
  }, [sparkles]);

  // Compact circular mobile badge
  if (compact) {
    return (
      <div
        onClick={() => triggerStrike(true)}
        className="group relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-amber-400/90 bg-neutral-950 shadow-[0_0_12px_rgba(251,191,36,0.65)] transition-transform active:scale-95 pointer-events-auto"
        title={`${mascot.name} (${mascot.title}) · Tap for blessing!`}
      >
        <img
          src={mascot.imageSrc}
          alt={mascot.name}
          className={`h-full w-full object-cover object-top scale-135 transition-transform duration-300 ${
            striking
              ? "scale-160 brightness-135 animate-mascot-charge"
              : isSpinning
              ? "scale-145 brightness-110"
              : "group-hover:scale-145"
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

  // Dynamic Movement Class:
  // - striking: explosive attack lunge forward
  // - charging: rapid vibrating power charge
  // - isSpinning: leaning forward watching the reels
  // - idle: living organic breathing loop
  const movementClass = striking
    ? "animate-mascot-strike"
    : charging
    ? "animate-mascot-charge"
    : isSpinning
    ? "animate-mascot-lean"
    : "animate-mascot-breathe";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => triggerStrike(true)}
      className="group relative flex flex-col items-center justify-end select-none pointer-events-auto cursor-pointer w-52 sm:w-64 h-[420px] sm:h-[490px] transition-all perspective-[1000px]"
      title={`${mascot.name} · Click to command the God!`}
    >
      {/* ── Living 3D Floating Character Body ── */}
      <div
        className={`relative w-full h-full flex flex-col items-center justify-end transition-all duration-300 ${movementClass}`}
        style={{
          transform: !striking && !charging
            ? `rotateY(${tilt.x * 12}deg) rotateX(${-tilt.y * 8}deg)`
            : undefined,
          transformStyle: "preserve-3d",
        }}
      >
        {/* ── Radiant Backlight & Energy Aura ── */}
        <div
          className={`pointer-events-none absolute inset-2 rounded-full blur-3xl transition-all duration-500 ${
            striking
              ? "opacity-100 scale-135"
              : charging
              ? "opacity-95 scale-120 animate-pulse"
              : isBonus
              ? "opacity-95 scale-120"
              : "opacity-70 scale-105"
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

        {/* ── Volumetric Sunburst Light Rays ── */}
        <div className="pointer-events-none absolute -top-8 w-68 h-68 opacity-45 animate-[spin_28s_linear_infinite]">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${mascot.accentColor}33 30deg, transparent 60deg, ${mascot.accentColor}33 120deg, transparent 150deg, ${mascot.accentColor}33 210deg, transparent 240deg, ${mascot.accentColor}33 300deg, transparent 330deg)`,
            }}
          />
        </div>

        {/* ── Orbiting 3D Energy Spheres (circling the mascot) ── */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-mascot-orb-1 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_#38bdf8,0_0_24px_#fff]" />
          <div className="animate-mascot-orb-2 w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_#f59e0b,0_0_20px_#fde047]" />
        </div>

        {/* ── Shockwave Ring on Strike ── */}
        {striking && (
          <div
            className="pointer-events-none absolute inset-4 rounded-full border-2 animate-ping"
            style={{ borderColor: mascot.accentColor }}
          />
        )}

        {/* ── High-Detail 3D Mascot Character Art (Nana Banana Generated) ── */}
        <div className="relative w-full h-[340px] sm:h-[410px] flex items-center justify-center overflow-visible z-10">
          <img
            src={mascot.imageSrc}
            alt={mascot.name}
            className={`w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)] transition-all duration-300 ${
              striking
                ? "brightness-130 contrast-115 scale-105"
                : charging
                ? "brightness-120"
                : isSpinning
                ? "brightness-110"
                : "brightness-105"
            }`}
            style={{
              mixBlendMode: "screen",
              maskImage: "radial-gradient(ellipse 84% 92% at 50% 50%, black 72%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 84% 92% at 50% 50%, black 72%, transparent 100%)",
            }}
          />

          {/* ── Living Eyes Glow Flare ── */}
          <div
            className={`pointer-events-none absolute top-[19%] left-[49%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full blur-[2px] transition-all duration-300 ${
              striking || charging ? "opacity-100 scale-150" : isSpinning ? "opacity-90 scale-120" : "animate-mascot-eye-flare opacity-70"
            }`}
            style={{
              background: `radial-gradient(circle, #ffffff 0%, ${mascot.accentColor} 60%, transparent 100%)`,
              boxShadow: `0 0 16px ${mascot.accentColor}, 0 0 32px #ffffff`,
            }}
          />

          {/* ── Crackling Lightning Bolt Fired Towards the Slot Reels ── */}
          {striking && (
            <svg
              viewBox="0 0 400 300"
              className="pointer-events-none absolute -left-28 sm:-left-36 top-10 w-[420px] sm:w-[500px] h-[300px] z-30 overflow-visible"
            >
              <defs>
                <filter id="mascotLightningZap">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Main Lightning Bolt Spear heading directly left onto the slot reels */}
              <path
                d="M 280,110 L 220,135 L 180,95 L 120,150 L 70,110 L 0,165"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#mascotLightningZap)"
                className="animate-electric-arc"
              />
              <path
                d="M 280,110 L 220,135 L 180,95 L 120,150 L 70,110 L 0,165"
                fill="none"
                stroke={mascot.accentColor}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.6"
                filter="url(#mascotLightningZap)"
              />

              {/* Secondary Branching Lightning Arcs */}
              <path
                d="M 220,135 L 200,190 L 150,215"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-electric-arc"
              />
              <path
                d="M 120,150 L 105,75 L 50,55"
                fill="none"
                stroke="#facc15"
                strokeWidth="2"
                strokeLinecap="round"
                className="animate-electric-arc"
              />

              {/* Impact Flash at reel contact point */}
              <circle cx="0" cy="165" r="14" fill="#ffffff" className="animate-ping" />
              <circle cx="280" cy="110" r="10" fill="#fde047" className="animate-ping" />
            </svg>
          )}

          {/* Floating Sparkles from Clicks / Tumbles */}
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
          {/* Outer Runic Ring */}
          <div
            className="absolute inset-0 rounded-full border-2 animate-pedestal-spin opacity-85"
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

          {/* Dynamic Ground Hover Shadow */}
          <div
            className={`w-36 h-4 rounded-full bg-black/90 blur-md transition-all duration-500 ${
              isSpinning || striking ? "scale-90 opacity-60" : "scale-105 opacity-90"
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
