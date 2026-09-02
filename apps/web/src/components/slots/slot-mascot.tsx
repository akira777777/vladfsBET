"use client";

import React, { useEffect, useState } from "react";

interface SlotMascotProps {
  themeId: string;
  isSpinning: boolean;
  isBonus: boolean;
  lastWin: number;
  scatterCount: number;
}

export function SlotMascot({
  themeId,
  isSpinning,
  isBonus,
  lastWin,
  scatterCount,
}: SlotMascotProps) {
  const [charging, setCharging] = useState(false);
  const [striking, setStriking] = useState(false);

  useEffect(() => {
    if (scatterCount >= 2) {
      setCharging(true);
    } else {
      setCharging(false);
    }
  }, [scatterCount]);

  useEffect(() => {
    if (lastWin > 0) {
      setStriking(true);
      const timer = setTimeout(() => setStriking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastWin]);

  // Render Mascot based on Theme
  if (themeId === "gates-of-vladfs") {
    return (
      <div className="relative flex flex-col items-center justify-center select-none pointer-events-none w-48 sm:w-56">
        {/* Floating Animation Wrapper */}
        <div
          className={`relative flex flex-col items-center transition-all duration-500 ${
            isSpinning ? "translate-y-[-8px] scale-105" : "animate-[bounce_4s_ease-in-out_infinite]"
          } ${striking ? "scale-115" : ""}`}
        >
          {/* Lightning Aura Glow */}
          <div
            className={`absolute -inset-8 rounded-full blur-2xl transition-opacity duration-300 ${
              striking
                ? "bg-amber-400/60 opacity-100 animate-pulse"
                : charging
                ? "bg-cyan-400/50 opacity-90 animate-ping"
                : isBonus
                ? "bg-purple-500/40 opacity-80"
                : "bg-blue-600/30 opacity-60"
            }`}
          />

          {/* ZEUS SVG AVATAR (Pragmatic Style) */}
          <svg
            viewBox="0 0 200 240"
            className="w-44 h-56 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] filter transition-transform duration-300"
          >
            <defs>
              <linearGradient id="zeusGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2A3" />
                <stop offset="50%" stopColor="#E5A910" />
                <stop offset="100%" stopColor="#8A5A00" />
              </linearGradient>
              <linearGradient id="zeusToga" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#C4D0E5" />
                <stop offset="100%" stopColor="#6C7A9C" />
              </linearGradient>
              <linearGradient id="zeusCape" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#800020" />
                <stop offset="50%" stopColor="#B3002D" />
                <stop offset="100%" stopColor="#4A0013" />
              </linearGradient>
              <linearGradient id="lightningGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#67E8F9" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Crimson Cape */}
            <path
              d="M 50,90 Q 20,150 30,220 Q 90,240 100,220 Q 110,240 170,220 Q 180,150 150,90 Z"
              fill="url(#zeusCape)"
              stroke="#E5A910"
              strokeWidth="2"
            />

            {/* Muscular Torso & White Marble Toga */}
            <path
              d="M 60,95 Q 100,105 140,95 L 145,190 Q 100,210 55,190 Z"
              fill="url(#zeusToga)"
            />
            {/* Golden Belt & Buckle */}
            <rect x="58" y="160" width="84" height="14" rx="4" fill="url(#zeusGold)" />
            <circle cx="100" cy="167" r="10" fill="#FFF" stroke="#E5A910" strokeWidth="2" />

            {/* Zeus Head & Beard */}
            {/* Skin */}
            <ellipse cx="100" cy="65" rx="28" ry="32" fill="#FAD0AE" />
            {/* Majestic White Beard */}
            <path
              d="M 72,70 Q 60,110 80,140 Q 100,155 120,140 Q 140,110 128,70 Q 100,85 72,70 Z"
              fill="#FFFFFF"
              stroke="#D1D5DB"
              strokeWidth="2"
            />
            {/* Mustache */}
            <path
              d="M 80,82 Q 100,95 120,82 Q 100,88 80,82 Z"
              fill="#FFFFFF"
              stroke="#D1D5DB"
              strokeWidth="1.5"
            />
            {/* Eyes (Electric glowing when active) */}
            <circle
              cx="88"
              cy="60"
              r="4"
              fill={striking || charging ? "#67E8F9" : "#1E293B"}
              filter={striking || charging ? "url(#glow)" : undefined}
            />
            <circle
              cx="112"
              cy="60"
              r="4"
              fill={striking || charging ? "#67E8F9" : "#1E293B"}
              filter={striking || charging ? "url(#glow)" : undefined}
            />
            {/* Glowing Golden Laurel Crown */}
            <path
              d="M 68,45 Q 100,25 132,45 Q 120,38 100,38 Q 80,38 68,45 Z"
              fill="url(#zeusGold)"
              filter="url(#glow)"
            />
            <circle cx="100" cy="38" r="5" fill="#FFF" />

            {/* Right Hand Holding Crackling Lightning Bolt */}
            <g
              className={`transition-transform duration-300 origin-[150px_90px] ${
                striking ? "rotate-[-25deg] scale-125" : charging ? "animate-pulse" : ""
              }`}
            >
              {/* Arm */}
              <path d="M 140,100 Q 165,110 155,135" stroke="#FAD0AE" strokeWidth="14" strokeLinecap="round" />
              {/* Lightning Bolt */}
              <path
                d="M 175,40 L 148,110 L 165,115 L 135,200 L 155,130 L 138,125 Z"
                fill="url(#lightningGlow)"
                stroke="#FFFFFF"
                strokeWidth="2"
                filter="url(#glow)"
              />
            </g>
          </svg>

          {/* Dynamic Dialogue / Shout Bubble */}
          {striking && (
            <div className="absolute -top-10 -left-6 bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black text-[11px] px-3 py-1 rounded-full border-2 border-white shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-bounce tracking-wider uppercase">
              ⚡ BY ZEUS'S POWER!
            </div>
          )}
          {charging && !striking && (
            <div className="absolute -top-10 -left-6 bg-cyan-400 text-black font-black text-[10px] px-3 py-1 rounded-full border-2 border-white shadow-[0_0_20px_rgba(6,182,212,0.9)] animate-pulse tracking-wider uppercase">
              ⚡ THUNDER AWAKENS...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generic Mascot for other themes (Cyber, Pharaoh, Candy, Dragon)
  return (
    <div className="relative flex flex-col items-center justify-center select-none pointer-events-none w-40 sm:w-48">
      <div
        className={`relative flex flex-col items-center transition-all duration-500 ${
          isSpinning ? "scale-105" : "animate-[bounce_4s_ease-in-out_infinite]"
        }`}
      >
        <div
          className={`absolute -inset-6 rounded-full blur-2xl transition-opacity duration-300 ${
            striking
              ? "bg-amber-400/70 opacity-100 animate-pulse"
              : "bg-purple-600/30 opacity-60"
          }`}
        />

        <div className="relative p-4 rounded-3xl bg-neutral-950/80 border-2 border-amber-400/40 shadow-2xl flex flex-col items-center text-center">
          <span className="text-5xl drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
            {themeId === "cyber-neon-777" ? "🤖" : themeId === "pharaoh-gold-deluxe" ? "👑" : themeId === "sugar-rush-frenzy" ? "🍭" : "🐉"}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 mt-2">
            {themeId === "cyber-neon-777" ? "CYBER BOSS" : themeId === "pharaoh-gold-deluxe" ? "PHARAOH" : themeId === "sugar-rush-frenzy" ? "SUGAR QUEEN" : "GOLD DRAGON"}
          </span>
        </div>
      </div>
    </div>
  );
}
