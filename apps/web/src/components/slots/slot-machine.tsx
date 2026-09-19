"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { DemoBadge } from "@/components/demo-badge";
import { api } from "@/lib/api";
import { formatMoney, gameArt } from "@/lib/format";
import {
  generate6x5Grid,
  generateMegawaysSpin,
  resolveFullTumbleRound,
  ClusterHit,
  Grid,
  SymbolId,
  TumbleRoundResult,
  MegawaysSpinResult,
} from "@/lib/slots/slot-engine";
import { getSlotTheme, SlotEngineMode, SlotTheme } from "@/lib/slots/slot-themes";
import { slotAudio } from "@/lib/slots/slot-audio";
import { SlotTumbleGrid } from "./slot-tumble-grid";
import { SlotMegawaysGrid } from "./slot-megaways-grid";
import { SlotControls, type AutoplayConfig, BET_PRESETS } from "./slot-controls";
import { SlotWinCelebration } from "./slot-win-celebration";
import { SlotBonusModal } from "./slot-bonus-modal";
import { SlotPaytableModal } from "./slot-paytable-modal";
import { SlotMascot } from "./slot-mascot";
import { SlotCabinetStage } from "./slot-cabinet-fx";
import { ProvablyFairDialog } from "@/components/games/provably-fair-dialog";
import Image from "next/image";
import { Zap } from "lucide-react";

interface SlotMachineProps {
  initialSlug?: string;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const COMMUNITY_WINS = [
  { user: "cryptoking***", game: "Gates of Vladfs", amount: "$14,820.00", mult: "1,482x", time: "2m ago" },
  { user: "neon_shadow***", game: "Cyber Neon 777", amount: "$8,540.00", mult: "854x", time: "4m ago" },
  { user: "pharaoh_luck***", game: "Pharaoh's Gold", amount: "$22,100.00", mult: "2,210x", time: "6m ago" },
  { user: "sugar_bliss***", game: "Sugar Rush Frenzy", amount: "$5,320.00", mult: "532x", time: "9m ago" },
  { user: "dragon_slayer***", game: "Dragon Fortune 888", amount: "$38,400.00", mult: "3,840x", time: "11m ago" },
  { user: "vault_cracker***", game: "Dead Man's Vault", amount: "$11,250.00", mult: "1,125x", time: "14m ago" },
];

const THEME_RIBBON_ITEMS = [
  { slug: "gates-of-vladfs", label: "Gates of Vladfs", icon: "⚡", badge: "Cluster 6×5" },
  { slug: "cyber-neon-777", label: "Cyber Neon 777", icon: "🤖", badge: "Megaways" },
  { slug: "pharaoh-gold-deluxe", label: "Pharaoh's Gold", icon: "🏺", badge: "Cluster 6×5" },
  { slug: "sugar-rush-frenzy", label: "Sugar Rush Frenzy", icon: "🍬", badge: "Cluster 6×5" },
  { slug: "dragon-fortune-888", label: "Dragon Fortune 888", icon: "🐉", badge: "Megaways" },
  { slug: "dead-mans-vault", label: "Dead Man's Vault", icon: "💀", badge: "Cluster 6×5" },
];

export function SlotMachine({ initialSlug = "gates-of-vladfs" }: SlotMachineProps) {
  const { user, wallet, refreshWallet, applyWallet } = useAuth();

  // Active theme
  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
  const theme: SlotTheme = useMemo(() => getSlotTheme(selectedSlug), [selectedSlug]);

  const [engineMode, setEngineMode] = useState<SlotEngineMode>(theme.defaultEngine);

  // Local fallback balance
  const [demoBalance, setDemoBalance] = useState<number>(5000.0);
  const currency = wallet?.currency ?? user?.currency ?? "USD";
  const currentBalance = wallet ? parseFloat(wallet.available) : demoBalance;

  // Game Grid & Round States — idle grid is deterministic so SSR matches the client.
  const [grid, setGrid] = useState<Grid>(() => {
    const ids: SymbolId[] = ["LOW_A", "LOW_K", "LOW_Q", "LOW_J", "LOW_10", "MED_1", "MED_2", "HIGH_4"];
    return Array.from({ length: 6 }, (_, col) =>
      Array.from({ length: 5 }, (_, row) => ({
        id: ids[(col * 5 + row) % ids.length],
        key: `idle-${col}-${row}`,
      })),
    );
  });
  const [megawaysResult, setMegawaysResult] = useState<MegawaysSpinResult | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10.0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [anteBetActive, setAnteBetActive] = useState<boolean>(false);

  // Tumble Execution State
  const [tumbleStepIndex, setTumbleStepIndex] = useState<number>(0);
  const [shatteredPositions, setShatteredPositions] = useState<{ col: number; row: number }[]>([]);
  const [winHoldPositions, setWinHoldPositions] = useState<{ col: number; row: number }[]>([]);
  const [spinningColumns, setSpinningColumns] = useState<boolean[]>([false, false, false, false, false, false]);
  const [anticipatingColumns, setAnticipatingColumns] = useState<boolean[]>([false, false, false, false, false, false]);
  const [flashingColumns, setFlashingColumns] = useState<boolean[]>([false, false, false, false, false, false]);
  const [scatterCount, setScatterCount] = useState(0);
  const [collectingOrbs, setCollectingOrbs] = useState<{ col: number; row: number }[]>([]);
  const [activeClusterHits, setActiveClusterHits] = useState<ClusterHit[]>([]);
  const [megaStrike, setMegaStrike] = useState(false);
  const multiplierHudRef = useRef<HTMLDivElement>(null);
  const [accumulatedMultiplier, setAccumulatedMultiplier] = useState<number>(1);
  const [roundWinTarget, setRoundWinTarget] = useState<number>(0);
  const [roundWinDisplay, setRoundWinDisplay] = useState<number>(0);
  const roundWinDisplayRef = useRef(0);

  // Autoplay state & Responsible Gaming Configuration
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [autoPlayCount, setAutoPlayCount] = useState<number>(0);
  const autoplayConfigRef = useRef<AutoplayConfig | null>(null);
  const autoplayStartBalanceRef = useRef<number>(5000.0);

  // Slam-Stop Quick-Halt State
  const slamStopRef = useRef<boolean>(false);

  // Provably Fair Cryptographic Verification State
  const [isFairnessOpen, setIsFairnessOpen] = useState<boolean>(false);
  const [currentNonce, setCurrentNonce] = useState<number>(1);
  const [serverSeedHash] = useState<string>("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  const [clientSeed] = useState<string>("vladfs_player_seed_9824");

  // Free Spins Bonus state
  const [inFreeSpins, setInFreeSpins] = useState<boolean>(false);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
  const [totalFreeSpinsWon, setTotalFreeSpinsWon] = useState<number>(0);
  const [bonusTotalWin, setBonusTotalWin] = useState<number>(0);
  const [persistentBonusMultiplier, setPersistentBonusMultiplier] = useState<number>(1);

  // Modals & Celebrations
  const [activeBonusModal, setActiveBonusModal] = useState<"TRIGGER" | "RETRIGGER" | "COMPLETED" | null>(null);
  const [celebrationWin, setCelebrationWin] = useState<{ winAmount: number; betAmount: number } | null>(null);
  const [isPaytableOpen, setIsPaytableOpen] = useState<boolean>(false);

  // Synchronous Refs for Timers & Callbacks
  const inBonusRef = useRef<boolean>(false);
  const bonusSpinsLeftRef = useRef<number>(0);
  const isSpinningRef = useRef<boolean>(false);
  const isAutoPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    inBonusRef.current = inFreeSpins;
    bonusSpinsLeftRef.current = freeSpinsRemaining;
    isSpinningRef.current = isSpinning;
    isAutoPlayingRef.current = isAutoPlaying;
  }, [inFreeSpins, freeSpinsRemaining, isSpinning, isAutoPlaying]);

  // Quick-stop and wait helper
  const waitOrSlam = useCallback(
    async (ms: number) => {
      if (slamStopRef.current || prefersReducedMotion()) return;
      await wait(ms);
    },
    [],
  );

  const handleSlamStop = useCallback(() => {
    if (!isSpinningRef.current) return;
    slamStopRef.current = true;
    slotAudio.playReelStop(5);
  }, []);

  const handleSelectTheme = useCallback(
    (slug: string) => {
      if (isSpinningRef.current || inBonusRef.current) return;
      setSelectedSlug(slug);
      const newTheme = getSlotTheme(slug);
      setEngineMode(newTheme.defaultEngine);
      setAccumulatedMultiplier(1);
      setRoundWinDisplay(0);
      setRoundWinTarget(0);
      const ids: SymbolId[] = ["LOW_A", "LOW_K", "LOW_Q", "LOW_J", "LOW_10", "MED_1", "MED_2", "HIGH_4"];
      setGrid(
        Array.from({ length: 6 }, (_, col) =>
          Array.from({ length: 5 }, (_, row) => ({
            id: ids[(col * 5 + row) % ids.length],
            key: `idle-${slug}-${col}-${row}`,
          })),
        ),
      );
      slotAudio.playButtonClick();
    },
    [],
  );

  const handleStartAutoplay = useCallback(
    (config: number | AutoplayConfig) => {
      if (typeof config === "number") {
        autoplayConfigRef.current = { count: config, stopOnBonus: true };
        setAutoPlayCount(config);
      } else {
        autoplayConfigRef.current = config;
        setAutoPlayCount(config.count);
      }
      autoplayStartBalanceRef.current = currentBalance;
      setIsAutoPlaying(true);
    },
    [currentBalance],
  );

  const checkAutoplayStopConditions = useCallback(
    (roundWin: number, isBonusTriggered: boolean) => {
      const cfg = autoplayConfigRef.current;
      if (!cfg) return;
      if (cfg.stopOnBonus && isBonusTriggered) {
        setIsAutoPlaying(false);
        return;
      }
      if (cfg.stopOnSingleWin && roundWin >= cfg.stopOnSingleWin) {
        setIsAutoPlaying(false);
        return;
      }
      if (cfg.stopOnLoss && autoplayStartBalanceRef.current - currentBalance >= cfg.stopOnLoss) {
        setIsAutoPlaying(false);
        return;
      }
    },
    [currentBalance],
  );


  useEffect(() => {
    const dest = roundWinTarget;
    if (prefersReducedMotion()) {
      roundWinDisplayRef.current = dest;
      const raf = requestAnimationFrame(() => setRoundWinDisplay(dest));
      return () => cancelAnimationFrame(raf);
    }
    const start = roundWinDisplayRef.current;
    const duration = isTurbo ? 160 : 380;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const val = start + (dest - start) * (1 - (1 - p) ** 3);
      roundWinDisplayRef.current = val;
      setRoundWinDisplay(val);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [roundWinTarget, isTurbo]);

  // Execute Cascading Tumble Sequence
  const runTumbleAnimation = useCallback(
    async (roundResult: TumbleRoundResult, effectiveStake: number) => {
      const steps = roundResult.tumbleSteps;
      let currentMult = inBonusRef.current ? persistentBonusMultiplier : 1;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setTumbleStepIndex(i + 1);
        setGrid(step.grid);

        if (step.multiplierOrbs.length > 0) {
          setCollectingOrbs(step.multiplierOrbs.map((orb) => orb.position));
          step.multiplierOrbs.forEach((orb) => {
            currentMult += orb.value;
            slotAudio.playMultiplierOrbCharge(orb.value);
          });
          await waitOrSlam(prefersReducedMotion() ? 0 : isTurbo ? 180 : 420);
          setAccumulatedMultiplier(currentMult);
          setCollectingOrbs([]);
        }

        if (step.clusterHits.length > 0) {
          setActiveClusterHits(step.clusterHits);
          setWinHoldPositions(step.shatteredPositions);
          await waitOrSlam(isTurbo ? 120 : 280);
          setWinHoldPositions([]);
          setShatteredPositions(step.shatteredPositions);
          slotAudio.playTumbleShatter();
          slotAudio.playTumbleCascade(i);

          setRoundWinTarget(step.accumulatedStepWin * currentMult);

          await waitOrSlam(isTurbo ? 320 : 620);
          setShatteredPositions([]);
          setActiveClusterHits([]);
          await waitOrSlam(isTurbo ? 220 : 400);
        }
      }

      // Final multiplier blast if total multiplier applied
      if (roundResult.totalMultiplier > 1 && roundResult.totalBaseWin > 0) {
        slotAudio.playMultiplierBlast();
        setAccumulatedMultiplier(roundResult.totalMultiplier);
      }

      const finalWin = roundResult.finalWinAmount;
      setRoundWinTarget(finalWin);

      // Award balance
      if (finalWin > 0) {
        if (!wallet) {
          setDemoBalance((prev) => prev + finalWin);
        }
        if (roundResult.isBigWin || roundResult.isMegaWin || roundResult.isUltraWin || roundResult.isEpicWin) {
          setCelebrationWin({ winAmount: finalWin, betAmount: effectiveStake });
        }
      }

      // Check Free Spins trigger
      if (roundResult.isFreeSpinsTriggered) {
        slotAudio.playBonusTrigger();
        setTotalFreeSpinsWon(roundResult.freeSpinsAwarded);
        setFreeSpinsRemaining(roundResult.freeSpinsAwarded);
        setBonusTotalWin(0);
        setPersistentBonusMultiplier(currentMult > 1 ? currentMult : 2);
        setActiveBonusModal("TRIGGER");
      } else if (inBonusRef.current) {
        setBonusTotalWin((prev) => prev + finalWin);
        setPersistentBonusMultiplier(currentMult);
        const nextSpins = bonusSpinsLeftRef.current - 1;
        setFreeSpinsRemaining(nextSpins);

        if (nextSpins <= 0) {
          setInFreeSpins(false);
          setActiveBonusModal("COMPLETED");
        }
      }

      checkAutoplayStopConditions(finalWin, roundResult.isFreeSpinsTriggered);
      setTumbleStepIndex(0);
      setIsSpinning(false);
    },
    [isTurbo, persistentBonusMultiplier, wallet, waitOrSlam, checkAutoplayStopConditions],
  );

  // Main Spin Trigger
  const spin = useCallback(
    async (forcedFeature?: "FREE_SPINS" | "BIG_WIN" | "MULTIPLIER_BOMB" | "MEGA_JACKPOT") => {
      const isBonus = inBonusRef.current;
      const effectiveStake = isBonus ? 0 : anteBetActive ? betAmount * 1.25 : betAmount;

      if (currentBalance < effectiveStake && !isBonus) {
        alert("Insufficient demo balance.");
        setIsAutoPlaying(false);
        return;
      }

      slamStopRef.current = false;
      setCurrentNonce((prev) => prev + 1);
      setIsSpinning(true);
      setShatteredPositions([]);
      setWinHoldPositions([]);
      setSpinningColumns([false, false, false, false, false, false]);
      setAnticipatingColumns([false, false, false, false, false, false]);
      setFlashingColumns([false, false, false, false, false, false]);
      setScatterCount(0);
      setCollectingOrbs([]);
      setActiveClusterHits([]);
      setMegaStrike(false);
      setTumbleStepIndex(0);
      setAccumulatedMultiplier(isBonus ? persistentBonusMultiplier : 1);
      roundWinDisplayRef.current = 0;
      setRoundWinDisplay(0);
      setRoundWinTarget(0);
      slotAudio.playSpinStart();

      // Deduct stake
      if (!isBonus) {
        if (!wallet) {
          setDemoBalance((prev) => Math.max(0, prev - effectiveStake));
        } else {
          try {
            const settled = await api<{ wallet?: { walletId: string; currency: string; status: string; available: string; bonus: string; locked: string; pending: string } }>(
              `/api/games/${selectedSlug}/play`,
              {
                method: "POST",
                body: JSON.stringify({ betAmount: effectiveStake.toString() }),
              },
            );
            if (settled.wallet) applyWallet(settled.wallet);
            else void refreshWallet();
          } catch {
            setDemoBalance((prev) => Math.max(0, prev - effectiveStake));
            void refreshWallet();
          }
        }
      }

      if (engineMode === "CLUSTER_6X5") {
        const initialG = generate6x5Grid(undefined, forcedFeature);
        setGrid(initialG);

        if (!prefersReducedMotion()) {
          setSpinningColumns([true, true, true, true, true, true]);
          setAnticipatingColumns([false, false, false, false, false, false]);
          const stagger = isTurbo ? 85 : 230;
          await waitOrSlam(isTurbo ? 160 : 500);
          let landedScatters = 0;
          for (let col = 0; col < 6; col++) {
            if (col > 0) {
              if (landedScatters >= 2) {
                setAnticipatingColumns((prev) => prev.map((_, i) => i >= col));
                slotAudio.startAnticipation();
                await waitOrSlam(stagger + (isTurbo ? 180 : 650));
              } else {
                await waitOrSlam(stagger);
              }
            }
            if (slamStopRef.current) {
              setSpinningColumns([false, false, false, false, false, false]);
              setAnticipatingColumns([false, false, false, false, false, false]);
              setFlashingColumns([true, true, true, true, true, true]);
              slotAudio.stopAnticipation();
              slotAudio.playReelStop(5);
              break;
            }
            setSpinningColumns((prev) => {
              const next = [...prev];
              next[col] = false;
              return next;
            });
            setAnticipatingColumns((prev) => {
              const next = [...prev];
              next[col] = false;
              return next;
            });
            setFlashingColumns((prev) => {
              const next = [...prev];
              next[col] = true;
              return next;
            });
            slotAudio.playReelStop(col);
            const colScatters = initialG[col].filter((c) => c.id === "SCATTER").length;
            landedScatters += colScatters;
            setScatterCount(landedScatters);
            if (colScatters > 0) {
              slotAudio.playScatterLand(col + 1);
            }
          }
          slotAudio.stopAnticipation();
          setAnticipatingColumns([false, false, false, false, false, false]);
          await waitOrSlam(isTurbo ? 120 : 280);
        }

        const roundResult = resolveFullTumbleRound(
          initialG,
          effectiveStake > 0 ? effectiveStake : betAmount,
          theme.symbols,
        );

        await runTumbleAnimation(roundResult, effectiveStake);
      } else {
        slotAudio.playMegawaysExpand();
        const megaRes = generateMegawaysSpin(
          effectiveStake > 0 ? effectiveStake : betAmount,
          theme.symbols,
        );

        setMegawaysResult(megaRes);
        if (!prefersReducedMotion()) {
          setSpinningColumns([true, true, true, true, true, true]);
          setAnticipatingColumns([false, false, false, false, false, false]);
          const stagger = isTurbo ? 80 : 200;
          await waitOrSlam(isTurbo ? 200 : 520);
          let megaScatters = 0;
          for (let col = 0; col < 6; col++) {
            if (col > 0) {
              if (megaScatters >= 2) {
                setAnticipatingColumns((prev) => prev.map((_, i) => i >= col));
                slotAudio.startAnticipation();
                await waitOrSlam(stagger + (isTurbo ? 180 : 650));
              } else {
                await waitOrSlam(stagger);
              }
            }
            if (slamStopRef.current) {
              setSpinningColumns([false, false, false, false, false, false]);
              setAnticipatingColumns([false, false, false, false, false, false]);
              setFlashingColumns([true, true, true, true, true, true]);
              slotAudio.stopAnticipation();
              slotAudio.playReelStop(5);
              break;
            }
            setSpinningColumns((prev) => {
              const next = [...prev];
              next[col] = false;
              return next;
            });
            setAnticipatingColumns((prev) => {
              const next = [...prev];
              next[col] = false;
              return next;
            });
            setFlashingColumns((prev) => {
              const next = [...prev];
              next[col] = true;
              return next;
            });
            slotAudio.playReelStop(col);
            const colScatters = (megaRes.grid[col] || []).filter((c) => c.id === "SCATTER").length;
            megaScatters += colScatters;
            setScatterCount(megaScatters);
            if (colScatters > 0) slotAudio.playScatterLand(col + 1);
          }
          slotAudio.stopAnticipation();
          setAnticipatingColumns([false, false, false, false, false, false]);
          await waitOrSlam(isTurbo ? 80 : 200);
        }
        setRoundWinTarget(megaRes.totalWin);
        if (megaRes.wayHits.length > 0 || (megaRes.scatterHit && megaRes.scatterHit.count > 0)) {
          setMegaStrike(true);
        }

        if (megaRes.totalWin > 0) {
          slotAudio.playLineWin();
          if (!wallet) {
            setDemoBalance((prev) => prev + megaRes.totalWin);
          }
          if (megaRes.isBigWin || megaRes.isMegaWin || megaRes.isUltraWin || megaRes.isEpicWin) {
            setCelebrationWin({ winAmount: megaRes.totalWin, betAmount: effectiveStake });
          }
        }

        if (megaRes.isFreeSpinsTriggered && megaRes.scatterHit) {
          slotAudio.playBonusTrigger();
          setTotalFreeSpinsWon(megaRes.scatterHit.freeSpinsAwarded);
          setFreeSpinsRemaining(megaRes.scatterHit.freeSpinsAwarded);
          setActiveBonusModal("TRIGGER");
        }

        checkAutoplayStopConditions(megaRes.totalWin, megaRes.isFreeSpinsTriggered);
        setIsSpinning(false);
      }
    },
    [
      anteBetActive,
      betAmount,
      currentBalance,
      engineMode,
      isTurbo,
      persistentBonusMultiplier,
      runTumbleAnimation,
      selectedSlug,
      theme.symbols,
      wallet,
      refreshWallet,
      applyWallet,
      waitOrSlam,
      checkAutoplayStopConditions,
    ],
  );

  // Autoplay Loop
  useEffect(() => {
    if (!isAutoPlaying || isSpinning || celebrationWin !== null || activeBonusModal !== null || autoPlayCount <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setAutoPlayCount((prev) => {
        const next = prev - 1;
        if (next <= 0) setIsAutoPlaying(false);
        return next;
      });
      void spin();
    }, isTurbo ? 500 : 1200);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, isSpinning, autoPlayCount, celebrationWin, activeBonusModal, isTurbo, spin]);

  // Free Spins Auto Loop
  useEffect(() => {
    if (!inFreeSpins || isSpinning || celebrationWin !== null || activeBonusModal !== null) {
      return;
    }

    if (freeSpinsRemaining > 0) {
      const timer = setTimeout(() => {
        void spin();
      }, isTurbo ? 600 : 1400);
      return () => clearTimeout(timer);
    }
  }, [inFreeSpins, isSpinning, freeSpinsRemaining, celebrationWin, activeBonusModal, isTurbo, spin]);

  // Desktop Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (isSpinningRef.current) {
          handleSlamStop();
        } else if (
          !isAutoPlayingRef.current &&
          !isPaytableOpen &&
          celebrationWin === null &&
          activeBonusModal === null
        ) {
          void spin();
        }
        return;
      }

      if (e.code === "KeyT" && !isSpinningRef.current) {
        e.preventDefault();
        setIsTurbo((prev) => !prev);
        slotAudio.playButtonClick();
        return;
      }

      if (e.code === "KeyM") {
        e.preventDefault();
        setIsMuted((prev) => {
          const next = !prev;
          slotAudio.setMuted(next);
          return next;
        });
        return;
      }

      if ((e.code === "KeyP" || e.code === "KeyI") && !isSpinningRef.current) {
        e.preventDefault();
        setIsPaytableOpen((prev) => !prev);
        slotAudio.playButtonClick();
        return;
      }

      if (e.code === "ArrowUp" && !isSpinningRef.current && !inFreeSpins) {
        e.preventDefault();
        const currIdx = BET_PRESETS.findIndex((b) => b >= betAmount);
        const nextIdx = Math.min(BET_PRESETS.length - 1, (currIdx === -1 ? 0 : currIdx) + 1);
        setBetAmount(BET_PRESETS[nextIdx]);
        slotAudio.playBetChange();
        return;
      }

      if (e.code === "ArrowDown" && !isSpinningRef.current && !inFreeSpins) {
        e.preventDefault();
        const currIdx = BET_PRESETS.findIndex((b) => b >= betAmount);
        const nextIdx = Math.max(0, (currIdx === -1 ? 0 : currIdx) - 1);
        setBetAmount(BET_PRESETS[nextIdx]);
        slotAudio.playBetChange();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaytableOpen, celebrationWin, activeBonusModal, inFreeSpins, betAmount, spin, handleSlamStop]);

  const handleBuyBonus = () => {
    const cost = betAmount * 100;
    if (currentBalance < cost) {
      alert(`Insufficient funds to buy Bonus! Cost is ${formatMoney(cost, currency)}.`);
      return;
    }
    if (!wallet) {
      setDemoBalance((prev) => prev - cost);
    }
    void spin("FREE_SPINS");
  };

  return (
    <div className="relative mx-auto max-w-6xl w-full px-2 sm:px-4 py-6 space-y-4">
      {/* Live Community Slot Wins Marquee Ticker */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-950/90 border border-amber-500/20 p-2 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider">Live Slot Hits</span>
          </div>
          <div className="relative overflow-hidden w-full">
            <div className="animate-marquee-scroll whitespace-nowrap text-xs flex items-center gap-6">
              {COMMUNITY_WINS.concat(COMMUNITY_WINS).map((w, idx) => (
                <div key={`win-${idx}`} className="inline-flex items-center gap-2 text-white/80 font-medium">
                  <span className="font-mono text-emerald-400 font-bold">{w.user}</span>
                  <span className="text-white/40">won</span>
                  <span className="font-black text-amber-300">{w.amount}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                    {w.mult}
                  </span>
                  <span className="text-white/50 text-[11px]">on {w.game}</span>
                  <span className="text-white/30 text-[10px]">({w.time})</span>
                  <span className="text-white/20 mx-1">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* In-Cabinet Theme Switcher Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap pl-1">
          Slots Gallery:
        </span>
        {THEME_RIBBON_ITEMS.map((t) => {
          const isActive = selectedSlug === t.slug;
          return (
            <button
              key={t.slug}
              type="button"
              disabled={isSpinning || inFreeSpins}
              onClick={() => handleSelectTheme(t.slug)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-amber-400/20 border-amber-400/60 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)] scale-[1.02]"
                  : "bg-black/40 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              } ${isSpinning || inFreeSpins ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-sm">{t.icon}</span>
              <span>{t.label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/60 font-mono">
                {t.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Top Header & Engine Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card/80 border border-white/10 p-4 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 overflow-hidden rounded-2xl ring-1 ring-gold/40 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
            <Image src={gameArt(selectedSlug)} alt="" fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <DemoBadge />
              <span className="text-xs font-bold text-amber-400">VLADFSBET NEXT-GEN SLOTS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {theme.name}
            </h1>
            <p className="text-[11px] text-white/50">{theme.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFairnessOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
          >
            🛡️ <span className="hidden sm:inline">Provably Fair</span>
          </button>
          <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
            {engineMode === "MEGAWAYS" ? "Megaways" : "6×5 Cluster"} · {theme.volatility}
          </span>
        </div>
      </div>

      {/* Main Luxury Slot Cabinet */}
      <div
        className={`relative rounded-3xl p-3 sm:p-6 border-2 transition-all duration-700 ${theme.frameStyle} ${
          spinningColumns.some(Boolean) ? "animate-cabinet-pulse" : ""
        } ${shatteredPositions.length > 0 || celebrationWin ? "animate-cabinet-hit" : ""} ${
          inFreeSpins ? "ring-2 ring-yellow-300/50" : ""
        }`}
        style={{ background: theme.backgroundGradient }}
      >
        {/* Pragmatic 4-Tier Jackpot Tickers Banner */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { name: "MINI", mult: 10, color: "from-blue-600 to-cyan-500", border: "border-cyan-400/40" },
            { name: "MINOR", mult: 25, color: "from-emerald-600 to-teal-500", border: "border-emerald-400/40" },
            { name: "MAJOR", mult: 100, color: "from-purple-600 to-pink-500", border: "border-purple-400/40" },
            { name: "GRAND", mult: 1000, color: "from-amber-500 via-yellow-400 to-amber-600", border: "border-yellow-300/60 shadow-[0_0_15px_rgba(251,191,36,0.6)]" },
          ].map((jp) => (
            <div
              key={jp.name}
              className={`relative overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl bg-black/70 border-2 ${jp.border} shadow-lg text-center transition-transform duration-200 hover:scale-105`}
            >
              <div
                className="absolute inset-0 animate-jackpot-shimmer pointer-events-none rounded-2xl opacity-40"
                style={{
                  backgroundImage:
                    jp.name === "GRAND"
                      ? "linear-gradient(90deg, transparent 15%, rgba(253,224,71,0.35) 50%, transparent 85%)"
                      : "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.14) 50%, transparent 80%)",
                }}
              />
              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-gradient-to-r ${jp.color} bg-clip-text text-transparent relative z-10`}>
                ★ {jp.name} ★
              </span>
              <span className="text-[11px] sm:text-sm font-black text-white tabular-nums relative z-10">
                {formatMoney(betAmount * jp.mult, currency)}
              </span>
            </div>
          ))}
        </div>

        {/* Cabinet Header Display (Balance HUD & Round Win) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 rounded-2xl bg-black/80 border border-white/10 shadow-inner">
          {/* Balance HUD */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              💰
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                AVAILABLE BALANCE
              </p>
              <p className="text-lg sm:text-2xl font-black text-amber-300 tabular-nums drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                {formatMoney(currentBalance, currency)}
              </p>
            </div>
          </div>

          {/* Center Multiplier / Tumble Status */}
          <div ref={multiplierHudRef} className="flex min-h-[2rem] flex-col items-center">
            {accumulatedMultiplier > 1 ? (
              <div
                key={`mult-hud-${accumulatedMultiplier}`}
                className={`flex items-center gap-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/60 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-multiplier-pop ${
                  inFreeSpins ? "px-6 py-2" : "px-4 py-1"
                }`}
              >
                <Zap className={`text-yellow-300 fill-yellow-300 ${inFreeSpins ? "h-6 w-6" : "h-4 w-4"}`} />
                <span className={`font-mono font-black text-yellow-300 ${inFreeSpins ? "text-lg sm:text-2xl" : "text-sm sm:text-base"}`}>
                  {accumulatedMultiplier}X ACCUMULATED MULTIPLIER
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 animate-pulse">
                ★ MAX WIN UP TO {theme.maxWin} ★
              </span>
            )}
          </div>

          {/* Last Win HUD */}
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                {inFreeSpins ? "BONUS WIN" : "ROUND WIN"}
              </p>
              <p className="text-lg sm:text-2xl font-black text-emerald-400 tabular-nums drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]">
                {formatMoney(inFreeSpins ? bonusTotalWin : roundWinDisplay, currency)}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              🏆
            </div>
          </div>
        </div>

        {/* INTERACTIVE GAME CABINET DISPLAY WITH MASCOT SIDECAR */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center">
          <SlotCabinetStage
            theme={theme}
            spinning={spinningColumns.some(Boolean)}
            inFreeSpins={inFreeSpins}
            freeSpinsRemaining={freeSpinsRemaining}
            tumbleHit={shatteredPositions.length > 0}
            strike={megaStrike}
            anticipating={anticipatingColumns.some(Boolean)}
            punch={shatteredPositions.length > 0 || megaStrike}
            accessory={
              <SlotMascot
                themeId={selectedSlug}
                isSpinning={isSpinning}
                isBonus={inFreeSpins}
                lastWin={roundWinDisplay}
                scatterCount={scatterCount}
                forceStrike={shatteredPositions.length > 0 || megaStrike}
                compact
              />
            }
          >
            {engineMode === "CLUSTER_6X5" ? (
              <SlotTumbleGrid
                grid={grid}
                theme={theme}
                isTumbling={isSpinning}
                shatteredPositions={shatteredPositions}
                winHoldPositions={winHoldPositions}
                spinningColumns={spinningColumns}
                anticipatingColumns={anticipatingColumns}
                flashingColumns={flashingColumns}
                collectingOrbs={collectingOrbs}
                hudTargetRef={multiplierHudRef}
                currentMultiplier={accumulatedMultiplier}
                tumbleStepIndex={tumbleStepIndex}
                isTurbo={isTurbo}
                clusterHits={activeClusterHits}
                currency={currency}
              />
            ) : (
              <SlotMegawaysGrid
                result={megawaysResult}
                theme={theme}
                isSpinning={isSpinning}
                spinningColumns={spinningColumns}
                flashingColumns={flashingColumns}
                anticipatingColumns={anticipatingColumns}
                isTurbo={isTurbo}
              />
            )}
          </SlotCabinetStage>

          {/* Floating Mascot Avatar (Zeus, Pharaoh, Cyber Boss) on Desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center p-2">
            <SlotMascot
              themeId={selectedSlug}
              isSpinning={isSpinning}
              isBonus={inFreeSpins}
              lastWin={roundWinDisplay}
              scatterCount={scatterCount}
              forceStrike={shatteredPositions.length > 0 || megaStrike}
            />
          </div>
        </div>

        {/* Controls HUD */}
        <div className="mt-4">
          <SlotControls
            betAmount={betAmount}
            currency={currency}
            isSpinning={isSpinning}
            isTurbo={isTurbo}
            isAutoPlaying={isAutoPlaying}
            autoPlayCount={autoPlayCount}
            anteBetActive={anteBetActive}
            isMuted={isMuted}
            inFreeSpins={inFreeSpins}
            freeSpinsRemaining={freeSpinsRemaining}
            currentMultiplier={accumulatedMultiplier}
            onSpin={() => void spin()}
            onSlamStop={handleSlamStop}
            onBetChange={(newBet) => setBetAmount(newBet)}
            onToggleTurbo={() => setIsTurbo(!isTurbo)}
            onStartAutoplay={handleStartAutoplay}
            onStopAutoplay={() => setIsAutoPlaying(false)}
            onToggleAnteBet={() => setAnteBetActive(!anteBetActive)}
            onBuyBonus={handleBuyBonus}
            onToggleMute={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              slotAudio.setMuted(nextMute);
            }}
            onOpenPaytable={() => setIsPaytableOpen(true)}
            onOpenFairness={() => setIsFairnessOpen(true)}
          />
        </div>
      </div>

      {/* Instant Demo Feature Trigger Bar */}
      <div className="rounded-2xl bg-neutral-950/80 border border-white/10 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground font-semibold">
          <span>🛠️ Instant Feature Sandbox:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              slotAudio.playButtonClick();
              setEngineMode("CLUSTER_6X5");
            }}
            disabled={isSpinning || inFreeSpins}
            className={`px-2.5 py-1 rounded-lg border font-bold ${
              engineMode === "CLUSTER_6X5"
                ? "bg-amber-400 text-black border-amber-200"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            }`}
          >
            6×5 Tumble
          </button>
          <button
            type="button"
            onClick={() => {
              slotAudio.playButtonClick();
              setEngineMode("MEGAWAYS");
            }}
            disabled={isSpinning || inFreeSpins}
            className={`px-2.5 py-1 rounded-lg border font-bold ${
              engineMode === "MEGAWAYS"
                ? "bg-fuchsia-500 text-white border-fuchsia-300"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            }`}
          >
            Megaways
          </button>
          <button
            type="button"
            onClick={() => void spin("FREE_SPINS")}
            disabled={isSpinning}
            className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-sky-300 border border-blue-500/30 hover:bg-blue-500/30 font-bold"
          >
            4 scatters · free spins
          </button>
          <button
            type="button"
            onClick={() => void spin("MULTIPLIER_BOMB")}
            disabled={isSpinning}
            className="px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 font-bold"
          >
            💣 75x Multiplier Bomb
          </button>
          <button
            type="button"
            onClick={() => void spin("BIG_WIN")}
            disabled={isSpinning}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-bold"
          >
            🏆 Big Cluster Win
          </button>
          <button
            type="button"
            onClick={() => void spin("MEGA_JACKPOT")}
            disabled={isSpinning}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-pink-300 border border-purple-500/30 hover:bg-purple-500/30 font-bold"
          >
            💎 150x Mega Jackpot
          </button>
        </div>
      </div>

      {/* Paytable & Rules Modal */}
      <SlotPaytableModal
        theme={theme}
        betAmount={betAmount}
        currency={currency}
        isOpen={isPaytableOpen}
        onClose={() => setIsPaytableOpen(false)}
      />

      {/* Tiered Win Celebration Modal */}
      {celebrationWin && (
        <SlotWinCelebration
          winAmount={celebrationWin.winAmount}
          betAmount={celebrationWin.betAmount}
          currency={currency}
          onComplete={() => setCelebrationWin(null)}
        />
      )}

      {/* Free Spins Bonus Modal */}
      {activeBonusModal && (
        <SlotBonusModal
          type={activeBonusModal}
          spinsAwarded={totalFreeSpinsWon}
          totalBonusWin={bonusTotalWin}
          currency={currency}
          onContinue={() => {
            if (activeBonusModal === "TRIGGER") {
              setActiveBonusModal(null);
              setInFreeSpins(true);
            } else if (activeBonusModal === "RETRIGGER") {
              setActiveBonusModal(null);
            } else {
              setActiveBonusModal(null);
              setBonusTotalWin(0);
            }
          }}
        />
      )}

      {/* Provably Fair RNG Verification Modal */}
      <ProvablyFairDialog
        open={isFairnessOpen}
        onOpenChange={setIsFairnessOpen}
        serverSeedHash={serverSeedHash}
        clientSeed={clientSeed}
        nonce={currentNonce}
      />
    </div>
  );
}
