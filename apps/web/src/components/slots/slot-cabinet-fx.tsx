"use client";

import React from "react";
import { SlotTheme } from "@/lib/slots/slot-themes";

const LED_COUNT = 28;

function atmosphereFor(category: SlotTheme["category"]) {
  switch (category) {
    case "CYBERPUNK":
      return {
        motes: "from-fuchsia-400/25 via-cyan-300/15 to-transparent",
        overlay:
          "repeating-linear-gradient(180deg, rgba(34,211,238,0.05) 0 1px, transparent 1px 7px)",
      };
    case "EGYPT":
      return {
        motes: "from-amber-200/30 via-yellow-600/10 to-transparent",
        overlay: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.16), transparent 55%)",
      };
    case "CANDY":
      return {
        motes: "from-pink-300/35 via-fuchsia-400/15 to-transparent",
        overlay: "radial-gradient(circle at 20% 20%, rgba(244,114,182,0.18), transparent 40%)",
      };
    case "ASIAN":
      return {
        motes: "from-red-400/30 via-amber-300/15 to-transparent",
        overlay: "radial-gradient(ellipse at 80% 10%, rgba(239,68,68,0.2), transparent 50%)",
      };
    case "CLASSIC":
      return {
        motes: "from-amber-600/25 via-stone-400/10 to-transparent",
        overlay: "radial-gradient(ellipse at 50% 100%, rgba(180,83,9,0.2), transparent 50%)",
      };
    default:
      return {
        motes: "from-sky-300/30 via-amber-200/10 to-transparent",
        overlay: "radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.16), transparent 55%)",
      };
  }
}

interface SlotCabinetStageProps {
  theme: SlotTheme;
  spinning: boolean;
  inFreeSpins: boolean;
  freeSpinsRemaining: number;
  tumbleHit: boolean;
  strike?: boolean;
  anticipating?: boolean;
  punch?: boolean;
  accessory?: React.ReactNode;
  children: React.ReactNode;
}

function StrikeOverlay({
  active,
  category,
  accent,
}: {
  active: boolean;
  category: SlotTheme["category"];
  accent: string;
}) {
  if (!active) return null;
  if (category === "CYBERPUNK") {
    return (
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        <div
          className="absolute left-[8%] top-[-10%] h-[140%] w-10 origin-center rounded-full blur-[1px] animate-scan-slash"
          style={{
            background: `linear-gradient(180deg, transparent, ${accent}, #22d3ee, transparent)`,
            boxShadow: `0 0 24px ${accent}`,
          }}
        />
        <div className="absolute inset-0 bg-fuchsia-400/20 animate-lightning-flash" />
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <svg viewBox="0 0 200 240" className="absolute inset-0 h-full w-full animate-lightning-strike">
        <path
          d="M108 8 L72 96 L102 96 L78 232 L148 88 L112 88 Z"
          fill={accent}
          stroke="#fff"
          strokeWidth="3"
          filter="url(#boltGlow)"
        />
        <defs>
          <filter id="boltGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <div className="absolute inset-0 bg-sky-100/25 animate-lightning-flash" />
    </div>
  );
}

export function SlotCabinetStage({
  theme,
  spinning,
  inFreeSpins,
  freeSpinsRemaining,
  tumbleHit,
  strike = false,
  anticipating = false,
  punch = false,
  accessory,
  children,
}: SlotCabinetStageProps) {
  const atmosphere = atmosphereFor(theme.category);
  const intensity = inFreeSpins ? 1 : spinning ? 0.72 : 0.4;
  const hit = tumbleHit || strike;
  const bonusFrame =
    theme.category === "CYBERPUNK"
      ? "border-fuchsia-400/80 shadow-[0_0_48px_rgba(244,63,94,0.5)]"
      : "border-yellow-300/80 shadow-[0_0_48px_rgba(168,85,247,0.45)]";

  return (
    <div
      className={`relative aspect-[6/5] min-h-[380px] max-h-[560px] w-full overflow-hidden rounded-2xl border-2 bg-neutral-950/95 p-2 shadow-2xl ${
        inFreeSpins ? bonusFrame : "border-white/15"
      } ${anticipating ? "brightness-90" : ""} ${punch || hit ? "animate-grid-punch" : ""}`}
      style={{ boxShadow: spinning ? `0 0 36px ${theme.glowColor}` : undefined }}
    >
      <div
        className="pointer-events-none absolute inset-0 animate-atmosphere-drift"
        style={{
          background: atmosphere.overlay,
          opacity: intensity,
        }}
      />

      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={`mote-${i}`}
          className={`pointer-events-none absolute h-8 w-8 rounded-full bg-gradient-to-b blur-md animate-atmosphere-drift ${atmosphere.motes}`}
          style={{
            left: `${8 + (i * 11) % 84}%`,
            top: `${12 + (i * 17) % 70}%`,
            animationDelay: `${i * 0.4}s`,
            opacity: 0.35 * intensity,
          }}
        />
      ))}

      {inFreeSpins && (
        <div
          className="pointer-events-none absolute inset-0 z-[5] animate-bonus-storm"
          style={{
            background:
              theme.category === "CYBERPUNK"
                ? "linear-gradient(180deg, rgba(244,63,94,0.2), transparent 40%, rgba(34,211,238,0.15))"
                : "linear-gradient(180deg, rgba(251,191,36,0.18), transparent 45%, rgba(168,85,247,0.2))",
          }}
        />
      )}

      <StrikeOverlay active={hit} category={theme.category} accent={theme.accentColor} />

      <div
        className={`relative z-10 mb-1.5 flex items-center justify-center gap-2 rounded-xl border px-3 py-1 text-center ${
          inFreeSpins ? "border-yellow-300/50 bg-amber-500/15" : "border-white/10 bg-black/55"
        }`}
      >
        <span
          className="animate-marquee-shimmer min-w-0 flex-1 truncate bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text text-[10px] font-black uppercase tracking-[0.28em] text-transparent sm:text-xs"
          style={{
            backgroundImage: `linear-gradient(90deg, ${theme.accentColor}, #fff, ${theme.accentColor})`,
          }}
        >
          {inFreeSpins ? `Free Spins · ${freeSpinsRemaining} left` : theme.name}
        </span>
        {accessory ? <div className="lg:hidden shrink-0">{accessory}</div> : null}
      </div>

      <div className="relative z-10 h-[calc(100%-2.1rem)] overflow-hidden rounded-xl">
        <div className="pointer-events-none absolute inset-x-1 top-0 z-20 flex justify-between">
          {Array.from({ length: LED_COUNT }).map((_, i) => (
            <span
              key={`led-t-${i}`}
              className={`h-1.5 w-1.5 rounded-full ${spinning || anticipating ? "animate-led-chase" : "animate-led-breathe"}`}
              style={{
                background: theme.accentColor,
                boxShadow: `0 0 6px ${theme.accentColor}`,
                animationDelay: `${(i / LED_COUNT) * 0.7}s`,
              }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-2 left-0 z-20 flex flex-col justify-between">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={`led-l-${i}`}
              className={`h-1.5 w-1.5 rounded-full ${spinning ? "animate-led-chase" : "animate-led-breathe"}`}
              style={{
                background: theme.accentColor,
                boxShadow: `0 0 6px ${theme.accentColor}`,
                animationDelay: `${0.2 + (i / 12) * 0.7}s`,
              }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-2 right-0 z-20 flex flex-col justify-between">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={`led-r-${i}`}
              className={`h-1.5 w-1.5 rounded-full ${spinning ? "animate-led-chase" : "animate-led-breathe"}`}
              style={{
                background: theme.accentColor,
                boxShadow: `0 0 6px ${theme.accentColor}`,
                animationDelay: `${0.35 + (i / 12) * 0.7}s`,
              }}
            />
          ))}
        </div>

        <div className="reel-stage-3d relative h-full px-2 py-2">{children}</div>
        <div className="cabinet-glass-vignette absolute inset-0 z-10 rounded-xl" />
      </div>
    </div>
  );
}
