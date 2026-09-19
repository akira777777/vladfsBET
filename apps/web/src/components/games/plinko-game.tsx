"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Volume2, VolumeX, Sparkles, Play } from "lucide-react";
import { gameAudio } from "./game-audio";
import { formatMoney } from "@/lib/format";
import {
  type PlinkoRisk,
  getPlinkoMultipliers,
} from "@/lib/provably-fair";
import { AutoBettingPanel, useAutoBet } from "./auto-betting-controls";

interface PlinkoGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  targetBin: number;
  targetMultiplier: number;
  betAmount: number;
  completed: boolean;
  currentRow: number;
  path: number[];
  step: number;
  trail: { x: number; y: number }[];
  landedAt: number | null;
}

interface Peg {
  x: number;
  y: number;
  radius: number;
  row: number;
  col: number;
  highlightTime: number;
}

type BoardLayout = {
  w: number;
  h: number;
  rowCount: number;
  binCount: number;
  topY: number;
  lastPegY: number;
  binY: number;
  binH: number;
  spacing: number;
  startX: number;
  verticalSpacing: number;
};

function plinkoLayout(w: number, h: number, rowCount: number): BoardLayout {
  const pegsInLastRow = rowCount + 2;
  const binCount = rowCount + 1;
  const padX = 16;
  const binH = 30;
  const binY = h - 12 - binH;
  const topY = 30;
  const lastPegY = binY - 20;
  const verticalSpacing = (lastPegY - topY) / Math.max(1, rowCount - 1);
  const spacing = Math.min(40, (w - padX * 2) / (pegsInLastRow - 1));
  const lastRowWidth = (pegsInLastRow - 1) * spacing;
  const startX = (w - lastRowWidth) / 2;
  return { w, h, rowCount, binCount, topY, lastPegY, binY, binH, spacing, startX, verticalSpacing };
}

export function PlinkoGame({ game }: PlinkoGameProps) {
  const { user, wallet, refreshWallet } = useAuth();
  const currency = wallet?.currency ?? user?.currency ?? "USD";

  // Configuration
  const [stake, setStake] = useState<number>(10);
  const [rows, setRows] = useState<number>(16);
  const [risk, setRisk] = useState<PlinkoRisk>("HIGH");
  const [mode, setMode] = useState<"MANUAL" | "AUTO">("MANUAL");
  const [isMuted, setIsMuted] = useState(false);
  const [activeBallsCount, setActiveBallsCount] = useState<number>(0);
  const [history, setHistory] = useState<{ multiplier: number; payout: number }[]>([
    { multiplier: 2.0, payout: 20 },
    { multiplier: 0.2, payout: 2 },
    { multiplier: 26.0, payout: 260 },
    { multiplier: 4.0, payout: 40 },
    { multiplier: 0.2, payout: 2 },
  ]);

  const [highlightedBin, setHighlightedBin] = useState<number | null>(null);
  const [provablyFairData, setProvablyFairData] = useState({
    serverSeedHash: "8f7e6d5c4b3a2109fedcba9876543210abcdef0123456789abcdef0123456789",
    clientSeed: "vladfs_plinko_seed",
    nonce: 88,
  });

  // Auto-Betting Engine Hook
  const { config: autoConfig, setConfig: setAutoConfig, startAuto, stopAuto, recordRound } = useAutoBet(stake);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const layoutRef = useRef<BoardLayout>(plinkoLayout(680, 520, 16));
  const animIdRef = useRef<number | null>(null);

  const multipliers = getPlinkoMultipliers(rows, risk);

  const toggleMute = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  const buildPegs = (layout: BoardLayout) => {
    const pegs: Peg[] = [];
    for (let r = 0; r < layout.rowCount; r++) {
      const pegsInRow = r + 3;
      const rowY = layout.topY + r * layout.verticalSpacing;
      const rowWidth = (pegsInRow - 1) * layout.spacing;
      const rowStartX = (layout.w - rowWidth) / 2;
      for (let c = 0; c < pegsInRow; c++) {
        pegs.push({
          x: rowStartX + c * layout.spacing,
          y: rowY,
          radius: Math.max(2.6, Math.min(4, layout.spacing * 0.11)),
          row: r,
          col: c,
          highlightTime: 0,
        });
      }
    }
    pegsRef.current = pegs;
    layoutRef.current = layout;
  };

  // Trigger a single drop
  const dropBall = async (customBet?: number) => {
    const currentBet = customBet ?? (mode === "AUTO" ? autoConfig.currentBet : stake);
    gameAudio.playClick();

    let targetBin = Math.floor(Math.random() * (rows + 1));
    let multiplier = multipliers[targetBin] || 1.0;
    let path: number[] = [];

    try {
      const res = await api<{
        winAmount: string;
        multiplier: number;
        gameResult: { path: number[]; binIndex: number; multiplier: number };
        provablyFair?: { serverSeedHash: string; clientSeed: string; nonce: number };
      }>(`/api/games/${game.slug}/play`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: currentBet.toString(),
          gameData: { rows, risk },
        }),
      });

      if (res.gameResult) {
        targetBin = Math.max(0, Math.min(multipliers.length - 1, res.gameResult.binIndex));
        multiplier = res.gameResult.multiplier;
        path = res.gameResult.path;
      }
      if (res.provablyFair) {
        setProvablyFairData(res.provablyFair);
      }
    } catch {
      let right = 0;
      for (let i = 0; i < rows; i++) {
        const d = Math.random() >= 0.5 ? 1 : 0;
        path.push(d);
        if (d === 1) right++;
      }
      targetBin = right;
      multiplier = multipliers[targetBin] ?? 1.0;
    }

    const layout = layoutRef.current;
    const ballColors = ["#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#06b6d4"];
    const chosenColor = ballColors[Math.floor(Math.random() * ballColors.length)];

    const newBall: Ball = {
      id: `ball-${Date.now()}-${Math.random()}`,
      x: layout.w / 2 + (Math.random() * 6 - 3),
      y: 12,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 1.5,
      radius: Math.max(5, Math.min(7, layout.spacing * 0.18)),
      color: chosenColor,
      targetBin,
      targetMultiplier: multiplier,
      betAmount: currentBet,
      completed: false,
      currentRow: 0,
      path,
      step: 0,
      trail: [],
      landedAt: null,
    };

    ballsRef.current.push(newBall);
    setActiveBallsCount(ballsRef.current.length);
  };

  // Main 2D Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const syncSize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = Math.max(320, parent.clientWidth);
      const cssH = Math.max(240, parent.clientHeight);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildPegs(plinkoLayout(cssW, cssH, rows));
    };

    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(parent);

    const gravity = 0.22;
    const restitution = 0.55;
    const damping = 0.985;

    const animate = () => {
      const layout = layoutRef.current;
      const w = layout.w;
      const h = layout.h;
      ctx.clearRect(0, 0, w, h);

      const pegs = pegsRef.current;
      const balls = ballsRef.current;

      // Draw Pegs
      const now = Date.now();
      pegs.forEach((peg) => {
        const hitAge = now - peg.highlightTime;
        const isLit = hitAge < 280;

        // Neon shockwave rings on collision
        if (isLit) {
          const ringProgress = hitAge / 280;
          for (let ring = 0; ring < 3; ring++) {
            const ringDelay = ring * 0.25;
            const rp = Math.max(0, Math.min(1, (ringProgress - ringDelay) * 2));
            if (rp <= 0) continue;
            const ringR = peg.radius * (1.5 + rp * 3.5 + ring * 1.2);
            const ringAlpha = (1 - rp) * (0.7 - ring * 0.2);
            ctx.beginPath();
            ctx.arc(peg.x, peg.y, ringR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(251,191,36,${ringAlpha})`;
            ctx.lineWidth = 2 - ring * 0.4;
            ctx.shadowColor = "#f59e0b";
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        const pr = isLit ? peg.radius * 1.8 : peg.radius;
        const pegGrad = ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0.4, peg.x, peg.y, pr);
        pegGrad.addColorStop(0, isLit ? "#ffffff" : "rgba(248,250,252,0.95)");
        pegGrad.addColorStop(0.45, isLit ? "#fde68a" : "rgba(148,163,184,0.85)");
        pegGrad.addColorStop(1, isLit ? "#f59e0b" : "rgba(51,65,85,0.9)");
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = pegGrad;
        if (isLit) {
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 18;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Physics & Ball Updating
      const completedIndices: number[] = [];

      balls.forEach((ball, idx) => {
        if (ball.completed) return;

        if (ball.landedAt) {
          if (Date.now() - ball.landedAt > 280) {
            ball.completed = true;
            completedIndices.push(idx);
          }
        } else {
        ball.vy += gravity;
        ball.vx *= damping;
        ball.vy *= damping;
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 14) ball.trail.shift();

        if (ball.x < ball.radius + 4) {
          ball.x = ball.radius + 4;
          ball.vx = Math.abs(ball.vx) * restitution;
        }
        if (ball.x > w - ball.radius - 4) {
          ball.x = w - ball.radius - 4;
          ball.vx = -Math.abs(ball.vx) * restitution;
        }

        if (ball.path.length > 0) {
          const currentStep = Math.min(
            rows - 1,
            Math.floor((ball.y - layout.topY) / Math.max(1, layout.verticalSpacing)),
          );
          if (currentStep >= 0 && currentStep > ball.step && currentStep < ball.path.length) {
            ball.step = currentStep;
            const desiredDirection = ball.path[currentStep] === 1 ? 1 : -1;
            ball.vx += desiredDirection * 0.9;
          }
        }

        // Peg Collisions
        pegs.forEach((peg) => {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const dist = Math.hypot(dx, dy);
          const minDist = ball.radius + peg.radius;

          if (dist < minDist) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);

            const overlap = minDist - dist;
            ball.x += nx * overlap;
            ball.y += ny * overlap;

            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
              ball.vx = (ball.vx - (1 + restitution) * dot * nx) + (Math.random() - 0.5) * 0.4;
              ball.vy = (ball.vy - (1 + restitution) * dot * ny) + (Math.random() - 0.5) * 0.2;
            }

            peg.highlightTime = Date.now();
            const pitchFactor = 0.8 + (peg.row / rows) * 0.8;
            gameAudio.playPegBounce(pitchFactor);
          }
        });

        const binCenterX = layout.startX + ball.targetBin * layout.spacing + layout.spacing / 2;
        if (ball.y > layout.lastPegY) {
          ball.x += (binCenterX - ball.x) * 0.22;
          ball.vx *= 0.7;
          if (ball.vy < 0) ball.vy = Math.abs(ball.vy) * 0.4;
        }

        if (ball.y + ball.radius >= layout.binY + 4 && !ball.landedAt) {
          ball.x = binCenterX;
          ball.y = layout.binY + layout.binH * 0.42;
          ball.vx = 0;
          ball.vy = 0;
          ball.landedAt = Date.now();
          setHighlightedBin(ball.targetBin);
          setTimeout(() => setHighlightedBin(null), 350);

          const winPayout = Math.round(ball.betAmount * ball.targetMultiplier * 100) / 100;
          gameAudio.playPlinkoSlot(ball.targetMultiplier);

          setHistory((prev) => [{ multiplier: ball.targetMultiplier, payout: winPayout }, ...prev.slice(0, 5)]);
          void refreshWallet();

          if (mode === "AUTO" && autoConfig.active) {
            const won = ball.targetMultiplier >= 1.0;
            const profit = winPayout - ball.betAmount;
            const { shouldContinue, nextBet } = recordRound(won, profit);
            if (shouldContinue) {
              setTimeout(() => {
                void dropBall(nextBet);
              }, 300);
            }
          }
        }

        }

        for (let t = 0; t < ball.trail.length; t++) {
          const p = ball.trail[t];
          const a = (t + 1) / ball.trail.length;
          ctx.beginPath();
          ctx.arc(p.x, p.y, ball.radius * (0.25 + a * 0.55), 0, Math.PI * 2);
          ctx.fillStyle = ball.color;
          ctx.globalAlpha = a * 0.35;
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.radius);
        ballGrad.addColorStop(0, "#ffffff");
        ballGrad.addColorStop(0.35, ball.color);
        ballGrad.addColorStop(1, "#0f172a");
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (completedIndices.length > 0) {
        ballsRef.current = ballsRef.current.filter((_, i) => !completedIndices.includes(i));
        setActiveBallsCount(ballsRef.current.length);
      }

      const binWidth = layout.spacing;
      const startBinX = layout.startX;
      const by = layout.binY;

      for (let i = 0; i < layout.binCount; i++) {
        const bx = startBinX + i * binWidth;
        const mult = multipliers[i] ?? 1.0;
        const isLit = highlightedBin === i;

        let binColor = "#3b82f6";
        if (mult >= 100) binColor = "#ef4444";
        else if (mult >= 20) binColor = "#f97316";
        else if (mult >= 4) binColor = "#eab308";
        else if (mult >= 1.5) binColor = "#10b981";

        // Spotlight beam above lit bin
        if (isLit) {
          const beamGrad = ctx.createLinearGradient(bx + binWidth / 2, by - 80, bx + binWidth / 2, by);
          beamGrad.addColorStop(0, "rgba(255,255,255,0)");
          beamGrad.addColorStop(1, `${binColor}44`);
          ctx.beginPath();
          ctx.moveTo(bx + binWidth * 0.1, by);
          ctx.lineTo(bx + binWidth * 0.9, by);
          ctx.lineTo(bx + binWidth * 0.7, by - 80);
          ctx.lineTo(bx + binWidth * 0.3, by - 80);
          ctx.closePath();
          ctx.fillStyle = beamGrad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.roundRect(bx + 1, by + (isLit ? 3 : 0), binWidth - 2, layout.binH, 6);
        ctx.fillStyle = isLit ? "#ffffff" : binColor;
        if (isLit) {
          ctx.shadowColor = binColor;
          ctx.shadowBlur = 20;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = isLit ? "#000000" : "#ffffff";
        ctx.font = binWidth > 28 ? "bold 10px sans-serif" : "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${mult}x`, bx + binWidth / 2, by + layout.binH / 2 + (isLit ? 3 : 0));
      }

      animIdRef.current = requestAnimationFrame(animate);
    };

    animIdRef.current = requestAnimationFrame(animate);
    return () => {
      observer.disconnect();
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- canvas loop intentionally excludes dropBall/recordRound/refreshWallet
  }, [rows, risk, multipliers, highlightedBin, mode, autoConfig.active]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <RealityCheckBar />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-gold" />
              {game.title}
            </h1>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
              Rigid Body 2D Physics
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Customizable 8–16 row pegboard with 3 risk profiles, multi-ball spamming, and certified provably fair outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className="h-8 border-white/10 bg-black/40 text-xs text-muted-foreground hover:text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4 mr-1 text-rose-400" /> : <Volume2 className="h-4 w-4 mr-1 text-emerald-400" />}
            {isMuted ? "Muted" : "Sound ON"}
          </Button>
          <ProvablyFairDialog
            serverSeedHash={provablyFairData.serverSeedHash}
            clientSeed={provablyFairData.clientSeed}
            nonce={provablyFairData.nonce}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card className="border-white/10 bg-card p-4 space-y-4">
            <div className="flex rounded-lg bg-black/40 p-1 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMode("MANUAL");
                  stopAuto();
                }}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                  mode === "MANUAL" ? "bg-gold text-black shadow" : "text-muted-foreground hover:text-white"
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setMode("AUTO")}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                  mode === "AUTO" ? "bg-gold text-black shadow" : "text-muted-foreground hover:text-white"
                }`}
              >
                Auto Strategy
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Bet Amount ($)</span>
                <span className="font-semibold text-white">Balance: {formatMoney(wallet?.available ?? 1000, currency)}</span>
              </div>
              <Input
                type="number"
                min="0.1"
                step="1"
                disabled={autoConfig.active}
                value={stake}
                onChange={(e) => setStake(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="h-10 text-xs bg-black/40 font-mono font-bold"
              />
              <div className="flex gap-1">
                {[1, 5, 10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={autoConfig.active}
                    onClick={() => setStake(amt)}
                    className="flex-1 rounded bg-white/5 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-white"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Risk Profile</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(["LOW", "MEDIUM", "HIGH"] as PlinkoRisk[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={autoConfig.active}
                    onClick={() => setRisk(r)}
                    className={`rounded-lg py-2 text-xs font-bold transition-all border ${
                      risk === r
                        ? "bg-gold/20 border-gold text-gold shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        : "border-white/5 bg-black/40 text-muted-foreground hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Board Rows</span>
                <span className="font-bold text-gold">{rows} Rows</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[8, 10, 12, 14, 16].map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={autoConfig.active}
                    onClick={() => setRows(r)}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all border ${
                      rows === r
                        ? "bg-white/20 border-white text-white"
                        : "border-white/5 bg-black/40 text-muted-foreground hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {mode === "AUTO" && (
              <AutoBettingPanel
                config={autoConfig}
                onChange={setAutoConfig}
                disabled={autoConfig.active}
              />
            )}

            {mode === "MANUAL" ? (
              <div className="space-y-2 pt-2">
                <Button
                  size="lg"
                  onClick={() => void dropBall()}
                  className="w-full h-12 bg-gradient-to-r from-gold via-yellow-400 to-amber-500 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:brightness-110"
                >
                  <Play className="h-4 w-4 mr-1 fill-black" />
                  Drop Ball (${stake})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    for (let i = 0; i < 5; i++) {
                      setTimeout(() => void dropBall(), i * 150);
                    }
                  }}
                  className="w-full h-9 border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
                >
                  Rapid drop 5 balls
                </Button>
              </div>
            ) : (
              <div className="pt-2">
                {autoConfig.active ? (
                  <Button
                    size="lg"
                    onClick={stopAuto}
                    className="w-full h-12 bg-rose-600 font-black text-sm uppercase text-white hover:bg-rose-700 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                  >
                    Stop Auto Bet
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => {
                      startAuto(stake);
                      void dropBall(stake);
                    }}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:brightness-110"
                  >
                    Start Auto Drop
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">Recent:</span>
            {history.map((h, idx) => (
              <span
                key={idx}
                className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
                  h.multiplier >= 10
                    ? "bg-purple-950 text-purple-300 ring-1 ring-purple-500/50"
                    : h.multiplier >= 2
                    ? "bg-emerald-950 text-emerald-300 ring-1 ring-emerald-500/50"
                    : "bg-slate-900 text-slate-400 ring-1 ring-white/10"
                }`}
              >
                {h.multiplier}x (+${h.payout})
              </span>
            ))}
            {activeBallsCount > 0 && (
              <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                {activeBallsCount} in flight
              </span>
            )}
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0a0d14] via-[#0d121c] to-[#07090f] shadow-2xl">
            <canvas ref={canvasRef} className="block h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
