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
          // 3D spinning coin with depth and specular rim
          const flipScale = Math.cos(p.rotation * 0.06);
          const absScale = Math.max(0.12, Math.abs(flipScale));
          
          // Outer gold rim
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * absScale, 0, 0, Math.PI * 2);
          ctx.fillStyle = flipScale >= 0 ? "#fbbf24" : "#d97706";
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          // Inner engraved emblem
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.65, p.size * 0.65 * absScale, 0, 0, Math.PI * 2);
          ctx.strokeStyle = flipScale >= 0 ? "#fef08a" : "#b45309";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Specular highlight glint
          if (absScale > 0.8) {
            ctx.beginPath();
            ctx.arc(p.size * 0.3, -p.size * absScale * 0.3, p.size * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            ctx.fill();
          }
        } else if (p.type === "STAR") {
          // 4-point Diamond Twinkle
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.4);
          ctx.quadraticCurveTo(0, 0, p.size * 1.4, 0);
          ctx.quadraticCurveTo(0, 0, 0, p.size * 1.4);
          ctx.quadraticCurveTo(0, 0, -p.size * 1.4, 0);
          ctx.quadraticCurveTo(0, 0, 0, -p.size * 1.4);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Confetti ribbon with 3D roll
          const roll = Math.cos(p.rotation * 0.04);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, (-p.size / 3) * roll, p.size, (p.size / 1.5) * Math.abs(roll));
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
