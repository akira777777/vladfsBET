"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  size: number;
  color: string;
  type: "COIN" | "CONFETTI" | "SPARKLE" | "STAR";
  alpha: number;
  decay: number;
}

interface SlotParticlesProps {
  active: boolean;
  tier?: "BIG_WIN" | "MEGA_WIN" | "ULTRA_WIN" | "EPIC_WIN" | "BONUS";
}

const CONFETTI_COLORS = [
  "#fbbf24", // Gold
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#a855f7", // Purple
  "#06b6d4", // Cyan
  "#ffffff", // White
];

export function SlotParticles({ active, tier = "BIG_WIN" }: SlotParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Particle[] = [];
    const maxParticles = tier === "EPIC_WIN" ? 180 : tier === "MEGA_WIN" ? 120 : 80;

    // Spawn a particle
    const spawnParticle = (initial = false): Particle => {
      const typeChoice = Math.random();
      const type: Particle["type"] =
        typeChoice < 0.4 ? "COIN" : typeChoice < 0.7 ? "CONFETTI" : "STAR";

      return {
        x: initial ? Math.random() * width : Math.random() * width,
        y: initial ? Math.random() * height * 0.7 : -20,
        vx: (Math.random() - 0.5) * (tier === "EPIC_WIN" ? 8 : 4),
        vy: Math.random() * 4 + (type === "COIN" ? 4 : 2),
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 8,
        size: type === "COIN" ? Math.random() * 8 + 10 : Math.random() * 6 + 6,
        color:
          type === "COIN"
            ? "#facc15"
            : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        type,
        alpha: 1,
        decay: Math.random() * 0.003 + 0.001,
      };
    };

    // Pre-populate particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(spawnParticle(true));
    }

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRotation;
        p.alpha -= p.decay;

        // Gravity
        p.vy += 0.12;

        // Reset if off-screen
        if (p.y > height + 30 || p.alpha <= 0) {
          particles[i] = spawnParticle(false);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);

        if (p.type === "COIN") {
          // Draw shiny gold coin
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#fbbf24";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          // Coin rim
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.35, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "#d97706";
          ctx.stroke();
        } else if (p.type === "STAR") {
          // Draw sparkling star
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(
              Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size,
              -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size,
            );
            ctx.lineTo(
              Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.4),
              -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.4),
            );
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Draw confetti rectangle
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, tier]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-40"
    />
  );
}
