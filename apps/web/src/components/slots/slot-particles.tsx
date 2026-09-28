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
  type: "COIN" | "CONFETTI" | "SPARKLE" | "STAR" | "GEM";
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

const GEM_COLORS = [
  { fill: "#38bdf8", stroke: "#e0f2fe" }, // Diamond / Sapphire
  { fill: "#ef4444", stroke: "#fecaca" }, // Ruby
  { fill: "#10b981", stroke: "#a7f3d0" }, // Emerald
  { fill: "#a855f7", stroke: "#f3e8ff" }, // Amethyst
  { fill: "#fbbf24", stroke: "#fef08a" }, // Topaz
];

export const SlotParticles = React.memo(function SlotParticles({ active, tier = "BIG_WIN" }: SlotParticlesProps) {
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
    const maxParticles = tier === "EPIC_WIN" ? 220 : tier === "ULTRA_WIN" ? 170 : tier === "MEGA_WIN" ? 130 : 90;

    // Spawn normal falling particle
    const spawnParticle = (initial = false): Particle => {
      const typeChoice = Math.random();
      const type: Particle["type"] =
        typeChoice < 0.35 ? "COIN" : typeChoice < 0.55 ? "GEM" : typeChoice < 0.8 ? "CONFETTI" : "STAR";

      return {
        x: initial ? Math.random() * width : Math.random() * width,
        y: initial ? Math.random() * height * 0.7 : -25,
        vx: (Math.random() - 0.5) * (tier === "EPIC_WIN" ? 8 : 4),
        vy: Math.random() * 4 + (type === "COIN" || type === "GEM" ? 3.5 : 2),
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 8,
        size:
          type === "COIN"
            ? Math.random() * 8 + 11
            : type === "GEM"
              ? Math.random() * 6 + 9
              : Math.random() * 6 + 6,
        color:
          type === "COIN"
            ? "#facc15"
            : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        type,
        alpha: 1,
        decay: Math.random() * 0.003 + 0.001,
      };
    };

    // Cannon burst from bottom corners
    const spawnCannonParticle = (side: "LEFT" | "RIGHT"): Particle => {
      const typeChoice = Math.random();
      const type: Particle["type"] =
        typeChoice < 0.4 ? "COIN" : typeChoice < 0.65 ? "GEM" : typeChoice < 0.85 ? "CONFETTI" : "STAR";
      const isLeft = side === "LEFT";
      const vx = isLeft ? Math.random() * 9 + 4 : -(Math.random() * 9 + 4);
      const vy = -(Math.random() * 11 + 10);

      return {
        x: isLeft ? 10 : width - 10,
        y: height - 10,
        vx,
        vy,
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 12,
        size: type === "COIN" ? Math.random() * 6 + 10 : Math.random() * 6 + 7,
        color:
          type === "COIN"
            ? "#facc15"
            : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        type,
        alpha: 1,
        decay: Math.random() * 0.002 + 0.001,
      };
    };

    // Interactive user click burst
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const maxCap = maxParticles + 50;
      if (particles.length > maxCap) return;
      const count = Math.min(24, maxCap - particles.length);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        particles.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          rotation: Math.random() * 360,
          vRotation: (Math.random() - 0.5) * 14,
          size: Math.random() * 8 + 8,
          color: Math.random() < 0.5 ? "#facc15" : "#ffffff",
          type: Math.random() < 0.5 ? "COIN" : "STAR",
          alpha: 1,
          decay: 0.008,
        });
      }
    };
    canvas.addEventListener("click", handleCanvasClick);

    // Pre-populate particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(spawnParticle(true));
    }

    let animId: number;
    let cannonCounter = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(Math.max((now - lastTime) / 16.67, 0.4), 2.2);
      lastTime = now;
      ctx.clearRect(0, 0, width, height);

      // Periodically fire corner cannons for big celebrations
      if (tier === "EPIC_WIN" || tier === "ULTRA_WIN" || tier === "MEGA_WIN") {
        cannonCounter++;
        if (cannonCounter % 5 === 0 && particles.length < maxParticles + 30) {
          particles.push(spawnCannonParticle(Math.random() < 0.5 ? "LEFT" : "RIGHT"));
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.vRotation * dt;
        p.alpha -= p.decay * dt;

        // Gravity scaled by delta time
        p.vy += 0.14 * dt;

        // Reset if off-screen
        if (p.y > height + 35 || p.alpha <= 0) {
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
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fill();
          }
        } else if (p.type === "GEM") {
          // 3D Faceted Crystal Gemstone
          const gemTheme = GEM_COLORS[Math.floor(p.size) % GEM_COLORS.length];
          const half = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -half);
          ctx.lineTo(half * 0.85, -half * 0.35);
          ctx.lineTo(half * 0.65, half);
          ctx.lineTo(-half * 0.65, half);
          ctx.lineTo(-half * 0.85, -half * 0.35);
          ctx.closePath();
          ctx.fillStyle = gemTheme.fill;
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = gemTheme.stroke;
          ctx.stroke();

          // Inner facet shine
          ctx.beginPath();
          ctx.moveTo(0, -half * 0.6);
          ctx.lineTo(half * 0.4, -half * 0.1);
          ctx.lineTo(0, half * 0.5);
          ctx.lineTo(-half * 0.4, -half * 0.1);
          ctx.closePath();
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.fill();
        } else if (p.type === "STAR") {
          // 4-point Diamond Twinkle
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
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
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [active, tier]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer z-40"
    />
  );
});
