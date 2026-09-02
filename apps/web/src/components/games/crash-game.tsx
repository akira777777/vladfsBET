"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProvablyFairDialog } from "./provably-fair-dialog";
import { RealityCheckBar } from "./reality-check-bar";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Rocket, Send, Volume2, VolumeX, Users, MessageSquare, ShieldCheck, Flame, Zap } from "lucide-react";
import { gameAudio } from "./game-audio";
import { formatMoney } from "@/lib/format";

interface CrashGameProps {
  game: { slug: string; title: string; minBet?: string | null; maxBet?: string | null };
}

interface ActivePlayer {
  id: string;
  name: string;
  avatar: string;
  avatarBg: string;
  betAmount: number;
  cashedOutAt: number | null;
  winAmount: number | null;
  isUser?: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isSystem?: boolean;
  highlight?: boolean;
}

const PRESET_EMOJIS = ["🚀", "🔥", "💎", "📈", "💰", "💀", "🍺", "💯", "🤑", "🎯", "🎉"];

const MOCK_NAMES = [
  "CryptoWhale", "AeroPilot_99", "LuckyStrike", "NeonViper", "CyberSamurai",
  "MoonRider", "DiamondHands", "VladHighRoller", "AlphaGambler", "StarGazer",
  "ShadowTrader", "ApexPredator", "CosmoQueen", "BitRunner", "QuantumKing"
];

const AVATAR_COLORS = [
  "bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600",
  "bg-cyan-600", "bg-indigo-600", "bg-orange-600", "bg-pink-600", "bg-teal-600"
];

export function CrashGame({ game }: CrashGameProps) {
  const { user, wallet, refreshWallet } = useAuth();
  const currency = wallet?.currency ?? user?.currency ?? "USD";

  // Bet 1 State
  const [bet1, setBet1] = useState(10);
  const [autoCashout1, setAutoCashout1] = useState("2.00");
  const [isBet1Active, setIsBet1Active] = useState(false);
  const [bet1CashedOut, setBet1CashedOut] = useState<number | null>(null);
  const [bet1Win, setBet1Win] = useState<number | null>(null);

  // Bet 2 State (Dual-betting feature)
  const [bet2, setBet2] = useState(25);
  const [autoCashout2, setAutoCashout2] = useState("5.00");
  const [isBet2Active, setIsBet2Active] = useState(false);
  const [bet2CashedOut, setBet2CashedOut] = useState<number | null>(null);
  const [bet2Win, setBet2Win] = useState<number | null>(null);

  // Room & Multiplier State
  const [roomState, setRoomState] = useState<"WAITING" | "COUNTDOWN" | "FLYING" | "CRASHED">("WAITING");
  const [countdown, setCountdown] = useState(5.0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [actualCrashPoint, setActualCrashPoint] = useState(2.35);
  const [history, setHistory] = useState<number[]>([1.84, 3.42, 1.15, 12.8, 2.05, 1.48, 5.2, 1.02, 8.44]);
  const [roundId, setRoundId] = useState<string>("rnd-" + Math.floor(Math.random() * 100000));
  const [provablyFairData, setProvablyFairData] = useState({
    serverSeedHash: "a7e8f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
    clientSeed: "vladfs_player_seed_crash",
    nonce: 142,
  });

  // Multiplayer Active Players in Room
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", sender: "System", avatar: "🛡️", text: "Welcome to Multiplayer Aero Crash Room #1", time: "12:00", isSystem: true },
    { id: "2", sender: "CryptoWhale", avatar: "CW", text: "LFG to the moon! 🚀🚀", time: "12:01" },
    { id: "3", sender: "NeonViper", avatar: "NV", text: "Targeting 5x this round 💰", time: "12:01" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"PLAYERS" | "CHAT">("PLAYERS");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const flightStartTimeRef = useRef<number>(0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Audio mute sync
  const toggleMute = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  // Generate simulated network players for each round
  const generateRoomPlayers = (includeUser1: boolean, includeUser2: boolean) => {
    const count = 8 + Math.floor(Math.random() * 8);
    const players: ActivePlayer[] = [];

    if (includeUser1) {
      players.push({
        id: "user-bet-1",
        name: user?.email ? user.email.split("@")[0] : "You (Bet 1)",
        avatar: "ME",
        avatarBg: "bg-amber-500 ring-2 ring-gold",
        betAmount: bet1,
        cashedOutAt: null,
        winAmount: null,
        isUser: true,
      });
    }
    if (includeUser2) {
      players.push({
        id: "user-bet-2",
        name: user?.email ? `${user.email.split("@")[0]} (Bet 2)` : "You (Bet 2)",
        avatar: "ME",
        avatarBg: "bg-amber-500 ring-2 ring-gold",
        betAmount: bet2,
        cashedOutAt: null,
        winAmount: null,
        isUser: true,
      });
    }

    for (let i = 0; i < count; i++) {
      const name = MOCK_NAMES[i % MOCK_NAMES.length];
      const initials = name.slice(0, 2).toUpperCase();
      const amounts = [5, 10, 20, 50, 100, 250, 500, 1000];
      const bet = amounts[Math.floor(Math.random() * amounts.length)];
      players.push({
        id: `bot-${i}`,
        name,
        avatar: initials,
        avatarBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
        betAmount: bet,
        cashedOutAt: null,
        winAmount: null,
      });
    }
    return players;
  };

  // Send a chat message
  const handleSendChat = (textToSend?: string) => {
    const text = textToSend || chatInput.trim();
    if (!text) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newMsg: ChatMessage = {
      id: "msg-" + Date.now() + Math.random(),
      sender: user?.email ? user.email.split("@")[0] : "You",
      avatar: "ME",
      text,
      time: timeStr,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setChatInput("");
    gameAudio.playClick();

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // Manual Cashout Handler for Bet 1
  const handleCashout1 = () => {
    if (roomState !== "FLYING" || !isBet1Active || bet1CashedOut !== null) return;
    const winAt = currentMultiplier;
    const payout = Math.round(bet1 * winAt * 100) / 100;
    setBet1CashedOut(winAt);
    setBet1Win(payout);
    gameAudio.playCashoutFanfare();

    setActivePlayers((prev) =>
      prev.map((p) => (p.id === "user-bet-1" ? { ...p, cashedOutAt: winAt, winAmount: payout } : p))
    );

    // Chat announcement
    handleSendChat(`🚀 Cashed out Bet 1 @ ${winAt.toFixed(2)}x (+$${payout.toFixed(2)})!`);
    void refreshWallet();
  };

  // Manual Cashout Handler for Bet 2
  const handleCashout2 = () => {
    if (roomState !== "FLYING" || !isBet2Active || bet2CashedOut !== null) return;
    const winAt = currentMultiplier;
    const payout = Math.round(bet2 * winAt * 100) / 100;
    setBet2CashedOut(winAt);
    setBet2Win(payout);
    gameAudio.playCashoutFanfare();

    setActivePlayers((prev) =>
      prev.map((p) => (p.id === "user-bet-2" ? { ...p, cashedOutAt: winAt, winAmount: payout } : p))
    );

    handleSendChat(`🔥 Cashed out Bet 2 @ ${winAt.toFixed(2)}x (+$${payout.toFixed(2)})!`);
    void refreshWallet();
  };

  // Start Game Round Loop
  const startNewRound = async () => {
    setRoomState("COUNTDOWN");
    setCountdown(5.0);
    setCurrentMultiplier(1.0);
    setBet1CashedOut(null);
    setBet1Win(null);
    setBet2CashedOut(null);
    setBet2Win(null);

    // Settle backend demo round if bets active
    let crashTarget = 2.0 + Math.random() * 4.0;
    if (Math.random() < 0.25) crashTarget = 1.1 + Math.random() * 0.8;
    if (Math.random() < 0.08) crashTarget = 1.0; // Instant crash

    try {
      if (isBet1Active || isBet2Active) {
        const totalStake = (isBet1Active ? bet1 : 0) + (isBet2Active ? bet2 : 0);
        const auto1 = parseFloat(autoCashout1) || 2.0;
        const res = await api<{
          winAmount: string;
          multiplier: number;
          gameResult: { crashPoint: number };
          provablyFair?: { serverSeedHash: string; clientSeed: string; nonce: number };
        }>(`/api/games/${game.slug}/play`, {
          method: "POST",
          body: JSON.stringify({
            betAmount: totalStake.toString(),
            gameData: { targetMultiplier: auto1 },
          }),
        });

        if (res.gameResult?.crashPoint) {
          crashTarget = res.gameResult.crashPoint;
        }
        if (res.provablyFair) {
          setProvablyFairData(res.provablyFair);
        }
      }
    } catch {
      // Fallback sandbox simulation if offline
    }

    setActualCrashPoint(crashTarget);
    setActivePlayers(generateRoomPlayers(isBet1Active, isBet2Active));

    // Countdown interval
    let cd = 5.0;
    const cdInterval = setInterval(() => {
      cd -= 0.1;
      if (cd <= 0) {
        clearInterval(cdInterval);
        launchRocket(crashTarget);
      } else {
        setCountdown(Math.max(0, Math.round(cd * 10) / 10));
      }
    }, 100);
  };

  // Launch Rocket Flight Animation
  const launchRocket = (crashAt: number) => {
    setRoomState("FLYING");
    flightStartTimeRef.current = Date.now();
    gameAudio.playBet();

    const speed = 0.055; // Multiplier growth rate
    const auto1Num = parseFloat(autoCashout1) || 0;
    const auto2Num = parseFloat(autoCashout2) || 0;

    let user1Done = false;
    let user2Done = false;

    const loop = () => {
      const elapsed = (Date.now() - flightStartTimeRef.current) / 1000;
      // Multiplier = e^(speed * elapsed * 2.5)
      const mult = Math.max(1.0, Math.floor(Math.pow(Math.E, speed * elapsed * 2.4) * 100) / 100);

      // Check Auto-Cashout for Bet 1
      if (isBet1Active && !user1Done && auto1Num > 1.0 && mult >= auto1Num && mult < crashAt) {
        user1Done = true;
        setBet1CashedOut(auto1Num);
        setBet1Win(Math.round(bet1 * auto1Num * 100) / 100);
        gameAudio.playCashoutFanfare();
        setActivePlayers((prev) =>
          prev.map((p) => (p.id === "user-bet-1" ? { ...p, cashedOutAt: auto1Num, winAmount: bet1 * auto1Num } : p))
        );
      }

      // Check Auto-Cashout for Bet 2
      if (isBet2Active && !user2Done && auto2Num > 1.0 && mult >= auto2Num && mult < crashAt) {
        user2Done = true;
        setBet2CashedOut(auto2Num);
        setBet2Win(Math.round(bet2 * auto2Num * 100) / 100);
        gameAudio.playCashoutFanfare();
        setActivePlayers((prev) =>
          prev.map((p) => (p.id === "user-bet-2" ? { ...p, cashedOutAt: auto2Num, winAmount: bet2 * auto2Num } : p))
        );
      }

      // Simulate Bot Player Cashouts as Multiplier rises
      setActivePlayers((prev) =>
        prev.map((p) => {
          if (p.isUser || p.cashedOutAt !== null) return p;
          // Random probability to cash out between 1.2x and currentMultiplier
          const target = 1.1 + Math.random() * (crashAt * 0.9);
          if (mult >= target && mult < crashAt) {
            return {
              ...p,
              cashedOutAt: mult,
              winAmount: Math.round(p.betAmount * mult * 100) / 100,
            };
          }
          return p;
        })
      );

      if (mult >= crashAt) {
        // Crashed!
        setCurrentMultiplier(crashAt);
        setRoomState("CRASHED");
        gameAudio.playExplosion();
        setHistory((prev) => [crashAt, ...prev.slice(0, 9)]);
        void refreshWallet();

        // High multiplier chat announcement
        if (crashAt >= 10.0) {
          setTimeout(() => {
            handleSendChat(`⚡ HUGE MULTIPLIER! Rocket reached ${crashAt.toFixed(2)}x! 🎉`);
          }, 500);
        }

        // Wait 4 seconds and restart room countdown
        setTimeout(() => {
          void startNewRound();
        }, 4000);
      } else {
        setCurrentMultiplier(mult);
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  // Initial boot
  useEffect(() => {
    void startNewRound();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Canvas Rocket Flight & Particles Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particleFrame: number;
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep space grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (roomState === "FLYING" || roomState === "CRASHED") {
        const progress = Math.min(1.0, (currentMultiplier - 1.0) / 10.0);
        const startX = 60;
        const startY = h - 60;
        const endX = startX + (w - 140) * Math.min(1.0, progress * 1.2 + 0.1);
        const endY = startY - (h - 140) * Math.pow(Math.min(1.0, progress), 0.75);

        // Control point for smooth quadratic curve
        const cpX = startX + (endX - startX) * 0.4;
        const cpY = startY;

        // Draw gradient area under curve
        const grad = ctx.createLinearGradient(0, endY, 0, startY);
        if (roomState === "CRASHED") {
          grad.addColorStop(0, "rgba(239, 68, 68, 0.3)");
          grad.addColorStop(1, "rgba(239, 68, 68, 0.0)");
        } else {
          grad.addColorStop(0, "rgba(234, 179, 8, 0.35)");
          grad.addColorStop(1, "rgba(59, 130, 246, 0.0)");
        }

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.lineTo(endX, startY);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw curve glow
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.strokeStyle = roomState === "CRASHED" ? "#ef4444" : "#f59e0b";
        ctx.lineWidth = 4;
        ctx.shadowColor = roomState === "CRASHED" ? "#ef4444" : "#f59e0b";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Exhaust Particles
        if (roomState === "FLYING") {
          for (let i = 0; i < 3; i++) {
            particles.push({
              x: endX - 10,
              y: endY + 8,
              vx: -(Math.random() * 4 + 2),
              vy: Math.random() * 3 - 1,
              life: 1.0,
              color: Math.random() > 0.5 ? "#f59e0b" : "#ef4444",
            });
          }
        }

        // Draw and update particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.04;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.life * 4), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Draw Rocket Icon
        if (roomState === "FLYING") {
          ctx.save();
          ctx.translate(endX, endY);
          ctx.rotate(-0.35);
          ctx.fillStyle = "#ffffff";
          ctx.font = "28px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🚀", 0, 0);
          ctx.restore();
        } else if (roomState === "CRASHED") {
          ctx.save();
          ctx.translate(endX, endY);
          ctx.fillStyle = "#ffffff";
          ctx.font = "34px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("💥", 0, 0);
          ctx.restore();
        }
      }

      particleFrame = requestAnimationFrame(render);
    };

    particleFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(particleFrame);
  }, [roomState, currentMultiplier]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <RealityCheckBar />

      {/* Top Header & Provably Fair Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Rocket className="h-6 w-6 text-gold" />
              {game.title}
            </h1>
            <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
              Multiplayer Room #1
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time provably fair multiplier room with live cashouts & active player room chat.
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

      {/* Recent Multipliers Pill Ticker */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
          <Zap className="h-3 w-3 text-gold" /> History:
        </span>
        {history.map((mult, idx) => {
          const isHuge = mult >= 10.0;
          const isGood = mult >= 2.0;
          return (
            <div
              key={idx}
              className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs font-bold ring-1 transition-all ${
                isHuge
                  ? "bg-purple-950/80 text-purple-300 ring-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                  : isGood
                  ? "bg-emerald-950/80 text-emerald-300 ring-emerald-500/40"
                  : "bg-slate-900 text-slate-400 ring-white/10"
              }`}
            >
              {mult.toFixed(2)}x
            </div>
          );
        })}
      </div>

      {/* Main Grid: Arena (Canvas & Controls) + Sidebar (Live Players & Chat) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Arena */}
        <div className="space-y-6">
          {/* Rocket Canvas Display */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0b0e17] via-[#0d121f] to-[#080a10] shadow-2xl">
            <canvas ref={canvasRef} width={800} height={450} className="h-full w-full object-cover" />

            {/* Central Multiplier HUD */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {roomState === "COUNTDOWN" && (
                <div className="text-center animate-pulse">
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Next Round In</p>
                  <p className="text-6xl font-black text-white font-mono drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                    {countdown.toFixed(1)}s
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Place your bets below</p>
                </div>
              )}

              {roomState === "FLYING" && (
                <div className="text-center">
                  <p className="text-7xl sm:text-8xl font-black tracking-tight font-mono text-white drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]">
                    {currentMultiplier.toFixed(2)}
                    <span className="text-4xl sm:text-5xl text-gold">x</span>
                  </p>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    Rocket Ascending Live
                  </p>
                </div>
              )}

              {roomState === "CRASHED" && (
                <div className="text-center animate-bounce">
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-500">Crashed</p>
                  <p className="text-7xl sm:text-8xl font-black tracking-tight font-mono text-rose-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                    {currentMultiplier.toFixed(2)}x
                  </p>
                  <p className="text-xs text-rose-400/80 mt-1">Preparing next launch…</p>
                </div>
              )}
            </div>

            {/* Active User Cashout Overlay Indicators */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {bet1CashedOut && (
                <div className="rounded-lg bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 backdrop-blur shadow-lg text-xs">
                  <span className="font-bold text-emerald-400">Bet 1 Cashed Out @ {bet1CashedOut.toFixed(2)}x!</span>
                  <p className="text-[11px] text-white">Won +${bet1Win?.toFixed(2)}</p>
                </div>
              )}
              {bet2CashedOut && (
                <div className="rounded-lg bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 backdrop-blur shadow-lg text-xs">
                  <span className="font-bold text-emerald-400">Bet 2 Cashed Out @ {bet2CashedOut.toFixed(2)}x!</span>
                  <p className="text-[11px] text-white">Won +${bet2Win?.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dual Bet Control Panels (Bet 1 & Bet 2) */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Bet 1 Panel */}
            <Card className="border-white/10 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" /> Bet Panel #1
                </span>
                <span className="text-[11px] text-muted-foreground">Balance: {formatMoney(wallet?.available ?? 1000, currency)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Stake ($)</label>
                  <Input
                    type="number"
                    min="0.1"
                    step="1"
                    disabled={roomState === "FLYING" && isBet1Active}
                    value={bet1}
                    onChange={(e) => setBet1(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="mt-1 h-9 text-xs bg-black/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Auto Cashout (x)</label>
                  <Input
                    type="number"
                    min="1.01"
                    step="0.1"
                    disabled={roomState === "FLYING" && isBet1Active}
                    value={autoCashout1}
                    onChange={(e) => setAutoCashout1(e.target.value)}
                    className="mt-1 h-9 text-xs bg-black/40"
                  />
                </div>
              </div>

              {/* Quick stake multipliers */}
              <div className="flex gap-1.5">
                {[5, 10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={roomState === "FLYING" && isBet1Active}
                    onClick={() => setBet1(amt)}
                    className="flex-1 rounded bg-white/5 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-white"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Action Button */}
              {roomState === "FLYING" && isBet1Active && bet1CashedOut === null ? (
                <Button
                  size="lg"
                  onClick={handleCashout1}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:brightness-110"
                >
                  Cash Out ${(bet1 * currentMultiplier).toFixed(2)} ({currentMultiplier.toFixed(2)}x)
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setIsBet1Active(!isBet1Active)}
                  className={`w-full h-11 font-bold text-xs uppercase transition-all ${
                    isBet1Active
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-gradient-to-r from-gold via-yellow-400 to-amber-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                  }`}
                >
                  {isBet1Active ? "Cancel Bet (Active for Next Round)" : `Place Bet 1 ($${bet1})`}
                </Button>
              )}
            </Card>

            {/* Bet 2 Panel */}
            <Card className="border-white/10 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Rocket className="h-3.5 w-3.5" /> Bet Panel #2
                </span>
                <span className="text-[11px] text-muted-foreground">Dual Betting</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Stake ($)</label>
                  <Input
                    type="number"
                    min="0.1"
                    step="1"
                    disabled={roomState === "FLYING" && isBet2Active}
                    value={bet2}
                    onChange={(e) => setBet2(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="mt-1 h-9 text-xs bg-black/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Auto Cashout (x)</label>
                  <Input
                    type="number"
                    min="1.01"
                    step="0.1"
                    disabled={roomState === "FLYING" && isBet2Active}
                    value={autoCashout2}
                    onChange={(e) => setAutoCashout2(e.target.value)}
                    className="mt-1 h-9 text-xs bg-black/40"
                  />
                </div>
              </div>

              <div className="flex gap-1.5">
                {[10, 25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={roomState === "FLYING" && isBet2Active}
                    onClick={() => setBet2(amt)}
                    className="flex-1 rounded bg-white/5 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-white"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {roomState === "FLYING" && isBet2Active && bet2CashedOut === null ? (
                <Button
                  size="lg"
                  onClick={handleCashout2}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-sm uppercase text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:brightness-110"
                >
                  Cash Out ${(bet2 * currentMultiplier).toFixed(2)} ({currentMultiplier.toFixed(2)}x)
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setIsBet2Active(!isBet2Active)}
                  className={`w-full h-11 font-bold text-xs uppercase transition-all ${
                    isBet2Active
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "border border-blue-500/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                  }`}
                >
                  {isBet2Active ? "Cancel Bet (Active for Next Round)" : `Place Bet 2 ($${bet2})`}
                </Button>
              )}
            </Card>
          </div>
        </div>

        {/* Right Sidebar: Active Players & Live Chat Room */}
        <Card className="flex flex-col h-[640px] border-white/10 bg-card overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("PLAYERS")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "PLAYERS"
                  ? "bg-white/10 text-white shadow"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-gold" />
              Players ({activePlayers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CHAT")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "CHAT"
                  ? "bg-white/10 text-white shadow"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
              Live Chat
            </button>
          </div>

          {/* Tab 1: Live Players List */}
          {activeTab === "PLAYERS" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground px-2 pb-1 border-b border-white/5">
                <span>Player</span>
                <span>Bet / Payout</span>
              </div>
              {activePlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-xl p-2.5 transition-all ring-1 ${
                    player.isUser
                      ? "bg-amber-950/30 ring-gold/40 border border-gold/30"
                      : "bg-black/30 ring-white/5 hover:bg-black/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${player.avatarBg}`}
                    >
                      {player.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white truncate max-w-[110px]">
                        {player.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Bet ${player.betAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {player.cashedOutAt !== null ? (
                      <span className="rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                        {player.cashedOutAt.toFixed(2)}x (+${player.winAmount?.toFixed(2)})
                      </span>
                    ) : roomState === "CRASHED" ? (
                      <span className="font-mono text-[11px] font-semibold text-rose-500">Crashed</span>
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground">In Flight…</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Interactive Live Chat Room */}
          {activeTab === "CHAT" && (
            <div className="flex flex-1 flex-col justify-between overflow-hidden p-3">
              {/* Messages Feed */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-2.5 ${
                      msg.isSystem
                        ? "bg-blue-950/40 border border-blue-500/20 text-blue-300"
                        : "bg-black/40 ring-1 ring-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span className="font-bold text-white flex items-center gap-1">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[9px]">
                          {msg.avatar}
                        </span>
                        {msg.sender}
                      </span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="text-white/90 break-words">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Emoji Quick Bar */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendChat(emoji)}
                      className="shrink-0 rounded-lg bg-white/5 px-2 py-1 text-sm hover:bg-white/15 hover:scale-110 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Input & Send Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Send message or emoji..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="h-9 text-xs bg-black/50"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3 bg-gold text-black hover:brightness-110">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
