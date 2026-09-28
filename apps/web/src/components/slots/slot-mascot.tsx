"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { slotAudio } from "@/lib/slots/slot-audio";
import { MultiplierOrb } from "./slot-symbols";

interface SlotMascotProps {
  themeId: string;
  isSpinning: boolean;
  isBonus: boolean;
  lastWin?: number;
  scatterCount: number;
  compact?: boolean;
  forceStrike?: boolean;
}

interface MascotThemeProfile {
  id: string;
  name: string;
  title: string;
  imageSrc: string;
  accentColor: string;
  glowColor: string;
  flameColor: string;
  stageName: string;
  strikeQuotes: string[];
  chargeQuotes: string[];
  bonusQuote: string;
}

const MASCOTS: Record<string, MascotThemeProfile> = {
  zeus: {
    id: "zeus",
    name: "ZEUS",
    title: "GOD OF THUNDER",
    stageName: "MOUNT OLYMPUS",
    imageSrc: "/slots/mascots/zeus.jpg",
    accentColor: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.8)",
    flameColor: "#38bdf8",
    strikeQuotes: [
      "⚡ BY ZEUS'S POWER!",
      "⚡ DIVINE THUNDER STRIKE!",
      "🔱 WITNESS OLYMPIAN WRATH!",
      "⚡ MULTIPLIER UNLEASHED!",
    ],
    chargeQuotes: ["⚡ THUNDER AWAKENS...", "⚡ OLYMPUS HEARS YOU!"],
    bonusQuote: "🔥 SUPERCHARGED FREE SPINS!",
  },
  cyber: {
    id: "cyber",
    name: "CYBER SHOGUN",
    title: "SYSTEM OVERLORD",
    stageName: "NEON CITADEL",
    imageSrc: "/slots/mascots/cyber-boss.jpg",
    accentColor: "#f472b6",
    glowColor: "rgba(236, 72, 153, 0.8)",
    flameColor: "#22d3ee",
    strikeQuotes: [
      "⚔️ CRITICAL SYSTEM OVERLOAD!",
      "⚡ NEON OVERDRIVE ACTIVATED!",
      "💾 MATRIX JACKPOT PROTOCOL!",
      "⚔️ SLICE THROUGH THE REELS!",
    ],
    chargeQuotes: ["⚡ OVERCLOCKING REELS...", "🔮 MATRIX RECONFIGURING..."],
    bonusQuote: "🔥 CYBER MATRIX UNLOCKED!",
  },
  pharaoh: {
    id: "pharaoh",
    name: "AMUN-RA",
    title: "SUN GOD OF EGYPT",
    stageName: "VALLEY OF KINGS",
    imageSrc: "/slots/mascots/pharaoh.jpg",
    accentColor: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.8)",
    flameColor: "#f59e0b",
    strikeQuotes: [
      "✨ BLESSING OF THE SUN GOD!",
      "👑 ETERNAL GOLD OF THE NILE!",
      "🏺 SACRED TOMB UNSEALED!",
      "✨ GAZE UPON RA'S RICHES!",
    ],
    chargeQuotes: ["✨ PYRAMIDS ALIGN...", "🐍 ANUBIS WATCHES..."],
    bonusQuote: "🔥 PHARAOH'S TREASURE UNSEALED!",
  },
  candy: {
    id: "candy",
    name: "SUGAR QUEEN",
    title: "COTTON CANDY REALM",
    stageName: "CANDYLAND THRONE",
    imageSrc: "/slots/mascots/sugar-queen.jpg",
    accentColor: "#f472b6",
    glowColor: "rgba(244, 114, 182, 0.8)",
    flameColor: "#ec4899",
    strikeQuotes: [
      "🍭 SWEET EXPLOSION!",
      "🍬 SUGAR BONANZA DROP!",
      "✨ DELICIOUS YUMMY HIT!",
      "🍭 TASTE THE RAINBOW WIN!",
    ],
    chargeQuotes: ["🍬 SUGAR RUSH CHARGING...", "🧁 FROSTING CASCADE..."],
    bonusQuote: "🔥 SUPER SWEET FREE SPINS!",
  },
  dragon: {
    id: "dragon",
    name: "GOLDEN DRAGON",
    title: "EMPEROR OF FORTUNE",
    stageName: "CELESTIAL PALACE",
    imageSrc: "/slots/mascots/dragon.jpg",
    accentColor: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.8)",
    flameColor: "#facc15",
    strikeQuotes: [
      "🐉 DRAGON BREATH OF WEALTH!",
      "🔥 HEAVENLY FORTUNE SHOWER!",
      "🪙 888 IMPERIAL PROSPERITY!",
      "🐉 AWAKEN THE GOLDEN BEAST!",
    ],
    chargeQuotes: ["🐉 CELESTIAL SPIRIT RISES...", "🀄 JADE GATES OPEN..."],
    bonusQuote: "🔥 DRAGON FEAST SPINS!",
  },
};

function getMascotForTheme(themeId: string): MascotThemeProfile {
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

/**
 * Client-side Alpha Segmentation Hook
 * Isolates character from solid black background using boundary-constrained BFS flood fill.
 * All interior character shadows, muscle contours, and darker robes remain 100% solid & opaque!
 */
const transparentCache = new Map<string, string>();

function useTransparentCutout(imageSrc: string): string {
  const [cutoutSrc, setCutoutSrc] = useState<string>(() => transparentCache.get(imageSrc) || imageSrc);

  useEffect(() => {
    if (transparentCache.has(imageSrc)) {
      setCutoutSrc(transparentCache.get(imageSrc)!);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      if (!isMounted) return;
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setCutoutSrc(imageSrc);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // BFS flood-fill from border pixels
        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        const threshold = 28;
        const feather = 32;

        for (let x = 0; x < w; x++) {
          queue.push(x, (h - 1) * w + x);
        }
        for (let y = 1; y < h - 1; y++) {
          queue.push(y * w, y * w + (w - 1));
        }

        let head = 0;
        while (head < queue.length) {
          const idx = queue[head++];
          if (visited[idx]) continue;
          visited[idx] = 1;

          const pIdx = idx * 4;
          const maxChan = Math.max(d[pIdx], d[pIdx + 1], d[pIdx + 2]);

          if (maxChan <= threshold + feather) {
            if (maxChan <= threshold) {
              d[pIdx + 3] = 0;
            } else {
              const alphaT = (maxChan - threshold) / feather;
              d[pIdx + 3] = Math.round(alphaT * 255);
            }

            const x = idx % w;
            const y = (idx / w) | 0;

            if (x > 0 && !visited[idx - 1]) queue.push(idx - 1);
            if (x < w - 1 && !visited[idx + 1]) queue.push(idx + 1);
            if (y > 0 && !visited[idx - w]) queue.push(idx - w);
            if (y < h - 1 && !visited[idx + w]) queue.push(idx + w);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        transparentCache.set(imageSrc, dataUrl);
        if (isMounted) {
          setCutoutSrc(dataUrl);
        }
      } catch {
        if (isMounted) setCutoutSrc(imageSrc);
      }
    };

    img.onerror = () => {
      if (isMounted) setCutoutSrc(imageSrc);
    };

    return () => {
      isMounted = false;
    };
  }, [imageSrc]);

  return cutoutSrc;
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
  const solidCutoutSrc = useTransparentCutout(mascot.imageSrc);

  const charging = scatterCount >= 2;
  const [striking, setStriking] = useState(false);
  const [hurlingOrb, setHurlingOrb] = useState(false);
  const [hurledMultiplier, setHurledMultiplier] = useState(25);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const nextSparkleId = useRef(0);

  // 3D Mouse Parallax
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  // Multiplier Orb Values randomizer (Pragmatic style: 5x, 10x, 25x, 50x, 100x, 250x, 500x)
  const MULTIPLIER_POOL = useMemo(() => [5, 10, 15, 25, 50, 100, 250, 500], []);

  const triggerStrike = useCallback((isManual = false) => {
    setStriking(true);
    setHurlingOrb(true);
    setQuoteIdx((prev) => (prev + 1) % mascot.strikeQuotes.length);

    // Pick a dramatic random multiplier for the hurled orb
    const randomMult = MULTIPLIER_POOL[Math.floor(Math.random() * MULTIPLIER_POOL.length)];
    setHurledMultiplier(randomMult);

    if (isManual) {
      slotAudio.playMultiplierOrbCharge(randomMult);
    } else {
      slotAudio.playMultiplierBlast();
    }

    // Spawn 12 intense sparks
    const newSparks = Array.from({ length: 12 }, () => {
      nextSparkleId.current++;
      return {
        id: nextSparkleId.current,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: Math.random() * 9 + 5,
      };
    });
    setSparkles((prev) => [...prev.slice(-20), ...newSparks]);

    const timer = setTimeout(() => {
      setStriking(false);
      setHurlingOrb(false);
    }, 950);
    return () => clearTimeout(timer);
  }, [mascot.strikeQuotes.length, MULTIPLIER_POOL]);

  useEffect(() => {
    if (!forceStrike) return;
    const cleanup = triggerStrike(false);
    return cleanup;
  }, [forceStrike, triggerStrike]);

  useEffect(() => {
    if (sparkles.length === 0) return;
    const t = setTimeout(() => {
      setSparkles((prev) => prev.slice(6));
    }, 900);
    return () => clearTimeout(t);
  }, [sparkles]);

  // Compact circular mobile badge
  if (compact) {
    return (
      <div
        onClick={() => triggerStrike(true)}
        className="group relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-amber-400 bg-neutral-950 shadow-[0_0_12px_rgba(251,191,36,0.7)] transition-transform active:scale-95 pointer-events-auto"
        title={`${mascot.name} (${mascot.title}) · Click for divine multiplier!`}
      >
        <img
          src={solidCutoutSrc}
          alt={mascot.name}
          className={`h-full w-full object-cover object-top scale-135 transition-transform duration-300 ${
            striking ? "scale-160 brightness-135 animate-mascot-charge" : "group-hover:scale-145"
          }`}
        />
        {charging && (
          <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-80" />
        )}
      </div>
    );
  }

  const currentQuote = isBonus
    ? mascot.bonusQuote
    : charging && !striking
    ? mascot.chargeQuotes[0]
    : mascot.strikeQuotes[quoteIdx];

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
      className="group relative flex flex-col items-center justify-end select-none pointer-events-auto cursor-pointer w-56 sm:w-64 h-[440px] sm:h-[510px] perspective-[1000px] transition-all"
      title={`${mascot.name} · Click to unleash divine lightning!`}
    >
      {/* ── PRAGMATIC GATES OF OLYMPUS STAGE ── */}
      <div
        className={`relative w-full h-full flex flex-col items-center justify-end transition-all duration-300 ${movementClass}`}
        style={{
          transform: !striking && !charging
            ? `rotateY(${tilt.x * 12}deg) rotateX(${-tilt.y * 8}deg)`
            : undefined,
          transformStyle: "preserve-3d",
        }}
      >
        {/* ── Volumetric Divine Backlight / Halo ── */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-full blur-3xl transition-all duration-500 ${
            striking
              ? "opacity-100 scale-140"
              : charging
              ? "opacity-95 scale-120 animate-pulse"
              : isBonus
              ? "opacity-95 scale-120"
              : "opacity-65 scale-100"
          }`}
          style={{
            background: striking
              ? `radial-gradient(circle, #fde047 0%, ${mascot.accentColor} 45%, transparent 75%)`
              : charging
              ? "radial-gradient(circle, #67e8f9 0%, #0284c7 45%, transparent 75%)"
              : isBonus
              ? "radial-gradient(circle, #facc15 0%, #ec4899 45%, transparent 75%)"
              : `radial-gradient(circle, ${mascot.glowColor} 0%, rgba(0,0,0,0) 70%)`,
          }}
        />

        {/* ── Golden Sunburst Celestial Wheel ── */}
        <div className="pointer-events-none absolute top-4 w-72 h-72 opacity-35 animate-[spin_32s_linear_infinite]">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${mascot.accentColor}33 25deg, transparent 50deg, ${mascot.accentColor}33 115deg, transparent 140deg, ${mascot.accentColor}33 205deg, transparent 230deg, ${mascot.accentColor}33 295deg, transparent 320deg)`,
            }}
          />
        </div>

        {/* ── Zero-G Levitating Temple Ruins / Marble Stones ── */}
        <div className="pointer-events-none absolute inset-0 overflow-visible">
          <div
            className="absolute top-16 -left-6 w-5 h-7 rounded border border-amber-300/40 bg-gradient-to-br from-amber-200/30 to-black/60 shadow-[0_0_12px_rgba(251,191,36,0.4)] animate-float-debris backdrop-blur-sm"
            style={{ animationDuration: "5.5s" }}
          />
          <div
            className="absolute top-36 -right-4 w-6 h-6 rounded-full border border-sky-300/40 bg-gradient-to-br from-sky-200/30 to-black/60 shadow-[0_0_12px_rgba(56,189,248,0.4)] animate-float-debris backdrop-blur-sm"
            style={{ animationDuration: "7.2s", animationDelay: "-2s" }}
          />
          <div
            className="absolute bottom-28 -left-3 w-4 h-5 rounded border border-amber-400/30 bg-black/70 shadow-[0_0_8px_rgba(251,191,36,0.3)] animate-float-debris"
            style={{ animationDuration: "6.4s", animationDelay: "-4s" }}
          />
        </div>

        {/* ── THE SIGNATURE PRAGMATIC MULTIPLIER ORB HURL ── */}
        {hurlingOrb && (
          <div className="pointer-events-none absolute left-8 top-28 z-40 animate-hurl-multiplier">
            <div className="scale-125 filter drop-shadow-[0_0_24px_rgba(251,191,36,1)]">
              <MultiplierOrb val={hurledMultiplier} />
            </div>
            {/* Blazing Comet Spark Tail */}
            <div className="absolute top-1/2 left-full w-24 h-2 -translate-y-1/2 bg-gradient-to-r from-amber-300 via-sky-300 to-transparent blur-[1px] animate-pulse" />
          </div>
        )}

        {/* ── SOLID OPAQUE CHARACTER SPRITE (Clean Cutout) ── */}
        <div className="relative w-full h-[360px] sm:h-[420px] flex items-center justify-center overflow-visible z-10">
          <img
            src={solidCutoutSrc}
            alt={mascot.name}
            className={`w-full h-full object-contain filter transition-all duration-300 ${
              striking
                ? "brightness-130 contrast-115 scale-105 drop-shadow-[0_15px_40px_rgba(251,191,36,0.9)]"
                : charging
                ? "brightness-120 drop-shadow-[0_15px_35px_rgba(56,189,248,0.9)]"
                : isSpinning
                ? "brightness-110 drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
                : "brightness-105 drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
            }`}
          />

          {/* ── Living Eyes Electric Glow ── */}
          <div
            className={`pointer-events-none absolute top-[19%] left-[49%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full blur-[2px] transition-all duration-300 ${
              striking || charging ? "opacity-100 scale-150" : isSpinning ? "opacity-90 scale-125" : "animate-mascot-eye-flare opacity-70"
            }`}
            style={{
              background: `radial-gradient(circle, #ffffff 0%, ${mascot.accentColor} 60%, transparent 100%)`,
              boxShadow: `0 0 16px ${mascot.accentColor}, 0 0 32px #ffffff`,
            }}
          />

          {/* ── Massive Lightning Bolt connecting from Zeus to the Slot Machine Grid ── */}
          {striking && (
            <svg
              viewBox="0 0 460 320"
              className="pointer-events-none absolute -left-44 sm:-left-56 top-6 w-[480px] sm:w-[580px] h-[340px] z-30 overflow-visible"
            >
              <defs>
                <filter id="olympusLightningBeam">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Main Core Discharge */}
              <path
                d="M 320,105 L 250,135 L 205,85 L 140,155 L 80,105 L 0,165"
                fill="none"
                stroke="#ffffff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#olympusLightningBeam)"
                className="animate-electric-arc"
              />
              {/* Outer Radiant Glow */}
              <path
                d="M 320,105 L 250,135 L 205,85 L 140,155 L 80,105 L 0,165"
                fill="none"
                stroke={mascot.accentColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.65"
                filter="url(#olympusLightningBeam)"
              />
              {/* Secondary Forks */}
              <path
                d="M 250,135 L 230,195 L 175,220"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="3"
                strokeLinecap="round"
                className="animate-electric-arc"
              />
              <path
                d="M 140,155 L 120,70 L 60,50"
                fill="none"
                stroke="#facc15"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-electric-arc"
              />
              {/* Explosive contact point on reel */}
              <circle cx="0" cy="165" r="16" fill="#ffffff" className="animate-ping" />
              <circle cx="320" cy="105" r="12" fill="#fde047" className="animate-ping" />
            </svg>
          )}

          {/* Floating Sparkles */}
          {sparkles.map((sp) => (
            <span
              key={`mascot-sp-${sp.id}`}
              className="pointer-events-none absolute rounded-full bg-white animate-ping"
              style={{
                left: `${sp.x}%`,
                top: `${sp.y}%`,
                width: `${sp.size}px`,
                height: `${sp.size}px`,
                boxShadow: `0 0 14px ${mascot.accentColor}, 0 0 28px #fff`,
              }}
            />
          ))}
        </div>

        {/* ── PRAGMATIC OLYMPUS MARBLE CAPITAL & BRAZIERS ── */}
        <div className="relative w-full flex flex-col items-center z-20 -mt-6">
          {/* Billowing Storm Clouds Beneath Feet */}
          <div className="absolute -top-6 w-52 h-14 pointer-events-none overflow-hidden rounded-full blur-md opacity-75">
            <div
              className="w-full h-full animate-pulse"
              style={{
                background: "radial-gradient(ellipse at 50% 50%, rgba(224,242,254,0.45), rgba(56,189,248,0.2) 60%, transparent 80%)",
              }}
            />
          </div>

          {/* Flanking Olympian Braziers */}
          <div className="w-full flex items-center justify-between px-2 pointer-events-none">
            {/* Left Brazier */}
            <div className="relative flex flex-col items-center">
              {/* Animated Divine Flame */}
              <div
                className="w-4 h-9 rounded-t-full animate-olympus-flame"
                style={{
                  background: `linear-gradient(180deg, #ffffff 0%, ${mascot.flameColor} 50%, #1e3a8a 100%)`,
                }}
              />
              {/* Golden Bronze Brazier Bowl */}
              <div className="w-7 h-3 rounded-b-lg border border-amber-300 bg-gradient-to-b from-amber-400 to-amber-800 shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
              <div className="w-2 h-4 bg-amber-700 border-x border-amber-500" />
            </div>

            {/* Right Brazier */}
            <div className="relative flex flex-col items-center">
              {/* Animated Divine Flame */}
              <div
                className="w-4 h-9 rounded-t-full animate-olympus-flame"
                style={{
                  background: `linear-gradient(180deg, #ffffff 0%, ${mascot.flameColor} 50%, #1e3a8a 100%)`,
                  animationDelay: "-0.4s",
                }}
              />
              {/* Golden Bronze Brazier Bowl */}
              <div className="w-7 h-3 rounded-b-lg border border-amber-300 bg-gradient-to-b from-amber-400 to-amber-800 shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
              <div className="w-2 h-4 bg-amber-700 border-x border-amber-500" />
            </div>
          </div>

          {/* Carved Greek Marble Plinth / Capital */}
          <div className="relative w-48 sm:w-56 h-12 flex flex-col items-center justify-center rounded-xl border-2 border-amber-400/80 bg-gradient-to-b from-stone-900 via-neutral-950 to-black shadow-[0_0_25px_rgba(251,191,36,0.6)] overflow-hidden">
            {/* Greek Key / Meander Frieze Top Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 shadow-[0_0_6px_rgba(251,191,36,1)]" />

            {/* Classical Embossed Gold Lettering */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {mascot.name}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-amber-300/80">
                {isBonus ? "★ SUPERCHARGED ★" : mascot.stageName}
              </span>
            </div>

            {/* Bottom Gold Line */}
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500/60" />
          </div>
        </div>

        {/* ── Dynamic Speech / Shout Banner ── */}
        {(striking || charging || isBonus) && (
          <div
            className={`absolute -top-7 z-40 flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 shadow-2xl backdrop-blur-md animate-mascot-speech pointer-events-none ${
              striking
                ? "border-amber-300 bg-black/95 shadow-[0_0_35px_rgba(251,191,36,1)]"
                : charging
                ? "border-cyan-400 bg-black/90 shadow-[0_0_25px_rgba(6,182,212,0.9)]"
                : "border-pink-400 bg-black/90 shadow-[0_0_25px_rgba(236,72,153,0.9)]"
            }`}
          >
            <span
              className={`text-[10px] sm:text-xs font-black tracking-wider uppercase ${
                striking
                  ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,1)]"
                  : charging
                  ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,1)]"
                  : "text-pink-300 drop-shadow-[0_0_8px_rgba(236,72,153,1)]"
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
