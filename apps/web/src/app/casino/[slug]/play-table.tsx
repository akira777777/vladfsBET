"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { DemoBadge } from "@/components/demo-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError, type Game } from "@/lib/api";
import { formatMoney, gameArt } from "@/lib/format";
import { SlotMachine } from "@/components/slots/slot-machine";
import { RouletteGame } from "@/components/games/roulette-game";
import { BlackjackGame } from "@/components/games/blackjack-game";
import { CrashGame } from "@/components/games/crash-game";
import { BaccaratGame } from "@/components/games/baccarat-game";
import { VideoPokerGame } from "@/components/games/video-poker-game";
import { PlinkoGame } from "@/components/games/plinko-game";
import { MinesGame } from "@/components/games/mines-game";
import { DiceGame } from "@/components/games/dice-game";
import { LimboGame } from "@/components/games/limbo-game";
import { HiloGame } from "@/components/games/hilo-game";
import { ProvablyFairDialog } from "@/components/games/provably-fair-dialog";
import { RealityCheckBar } from "@/components/games/reality-check-bar";
import { OriginalsShell } from "@/components/games/originals-shell";

type PlayResult = {
  mode: "DEMO";
  game: { slug: string; title: string };
  betAmount: string;
  winAmount: string;
  roundId: string;
  wallet: { available: string; currency: string };
};

const SLOT_SLUGS = [
  "sandbox-slots",
  "gates-of-vladfs",
  "neon-cyber-slots",
  "cyber-neon-777",
  "pharaoh-gold-deluxe",
  "sugar-rush-frenzy",
  "dead-mans-vault",
  "dragon-fortune-888",
  "slots",
];

export function PlayTable({ slug }: { slug: string }) {
  const isSlot =
    SLOT_SLUGS.includes(slug) ||
    slug.includes("slot") ||
    slug.includes("gate") ||
    slug.includes("neon") ||
    slug.includes("pharaoh") ||
    slug.includes("sugar") ||
    slug.includes("vault") ||
    slug.includes("dragon");

  const isRoulette = slug.includes("roulette");
  const isBlackjack = slug.includes("blackjack");
  const isCrash = slug.includes("crash") || slug.includes("spaceman") || slug.includes("aero");
  const isPlinko = slug.includes("plinko");
  const isMines = slug.includes("mines");
  const isDice = slug.includes("dice");
  const isLimbo = slug.includes("limbo");
  const isHilo = slug.includes("hilo");
  const isBaccarat = slug.includes("baccarat");
  const isPoker = slug.includes("poker");

  const { user, wallet, refreshWallet } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [stake, setStake] = useState("10");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlayResult | null>(null);

  useEffect(() => {
    api<{ items: Game[] }>("/api/games")
      .then((data) => {
        const found = data.items.find((item) => item.slug === slug);
        if (found) {
          setGame(found);
        } else {
          setGame({
            slug,
            title: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            category: isSlot
              ? "SLOTS"
              : isRoulette
              ? "ROULETTE"
              : isBlackjack
              ? "BLACKJACK"
              : isCrash || isLimbo
              ? "CRASH"
              : isPlinko || isMines
              ? "POPULAR"
              : isBaccarat
              ? "BACCARAT"
              : isPoker
              ? "POKER"
              : "TABLE_GAMES",
            provider: "VladfsBET Originals",
            demo: true,
          });
        }
      })
      .catch(() => {
        setGame({
          slug,
          title: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          category: isSlot
            ? "SLOTS"
            : isRoulette
            ? "ROULETTE"
            : isBlackjack
            ? "BLACKJACK"
            : isCrash || isLimbo
            ? "CRASH"
            : isPlinko || isMines
            ? "POPULAR"
            : isBaccarat
            ? "BACCARAT"
            : isPoker
            ? "POKER"
            : "TABLE_GAMES",
          provider: "VladfsBET Originals",
          demo: true,
        });
      });
  }, [slug, isSlot, isRoulette, isBlackjack, isCrash, isPlinko, isMines, isDice, isLimbo, isHilo, isBaccarat, isPoker]);

  // Route to specific interactive components
  if (isSlot) {
    return <SlotMachine initialSlug={slug} />;
  }

  const safeGame = game ? {
    slug: game.slug,
    title: game.title,
    minBet: game.minBet ?? undefined,
    maxBet: game.maxBet ?? undefined,
  } : {
    slug,
    title: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
  };

  if (isPlinko) {
    return (
      <OriginalsShell title={safeGame.title}>
        <PlinkoGame game={safeGame} />
      </OriginalsShell>
    );
  }

  if (isMines) {
    return (
      <OriginalsShell title={safeGame.title}>
        <MinesGame game={safeGame} />
      </OriginalsShell>
    );
  }

  if (isDice) {
    return (
      <OriginalsShell title={safeGame.title}>
        <DiceGame game={safeGame} />
      </OriginalsShell>
    );
  }

  if (isLimbo) {
    return (
      <OriginalsShell title={safeGame.title}>
        <LimboGame game={safeGame} />
      </OriginalsShell>
    );
  }

  if (isHilo) {
    return (
      <OriginalsShell title={safeGame.title}>
        <HiloGame game={safeGame} />
      </OriginalsShell>
    );
  }

  if (safeGame && isRoulette) {
    return (
      <OriginalsShell title={safeGame.title}>
        <RouletteGame game={safeGame} />
      </OriginalsShell>
    );
  }

  if (safeGame && isBlackjack) {
    return (
      <OriginalsShell title={safeGame.title}>
        <BlackjackGame game={safeGame} />
      </OriginalsShell>
    );
  }

  if (safeGame && isCrash) {
    return (
      <OriginalsShell title={safeGame.title}>
        <CrashGame game={safeGame} />
      </OriginalsShell>
    );
  }

  if (safeGame && isBaccarat) {
    return (
      <OriginalsShell title={safeGame.title}>
        <BaccaratGame game={safeGame} />
      </OriginalsShell>
    );
  }

  if (safeGame && isPoker) {
    return (
      <OriginalsShell title={safeGame.title}>
        <VideoPokerGame game={safeGame} />
      </OriginalsShell>
    );
  }

  async function play() {
    setError(null);
    setPending(true);
    try {
      const data = await api<PlayResult>(`/api/games/${slug}/play`, {
        method: "POST",
        body: JSON.stringify({ betAmount: stake }),
      });
      setResult(data);
      await refreshWallet();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not settle the round");
    } finally {
      setPending(false);
    }
  }

  if (!game) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">
        Game not found. <Link href="/casino" className="text-live">Back to casino</Link>
      </div>
    );
  }

  const currency = wallet?.currency ?? user?.currency ?? "USD";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <RealityCheckBar />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl">
          <Image src={gameArt(slug)} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DemoBadge />
              <span className="text-xs text-muted-foreground">{game.provider}</span>
            </div>
            <ProvablyFairDialog />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{game.title}</h1>
          <p className="text-sm text-muted-foreground">
            Sandbox Provably Fair RNG outcome. Stake is debited from demo available balance through the immutable double-entry ledger.
          </p>
          <div className="rounded-xl bg-card p-4 ring-1 ring-white/8">
            <p className="text-xs text-muted-foreground">Available Demo Balance</p>
            <p className="tabular text-2xl font-bold text-gold">
              {wallet ? formatMoney(wallet.available, currency) : "Sign in to play"}
            </p>
          </div>
          {user ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void play();
              }}
            >
              <label className="block text-sm">
                Stake Amount ($)
                <Input
                  className="mt-1 h-11"
                  inputMode="decimal"
                  value={stake}
                  onChange={(event) => setStake(event.target.value)}
                />
              </label>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" size="lg" className="h-11 w-full bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold" disabled={pending}>
                {pending ? "Settling Round…" : "Play Demo Round"}
              </Button>
            </form>
          ) : (
            <Button size="lg" className="h-11" asChild>
              <Link href="/login">Log in to play</Link>
            </Button>
          )}
          {result ? (
            <div className="rounded-xl bg-card p-4 text-sm ring-1 ring-white/8">
              <p>Stake {formatMoney(result.betAmount, currency)}</p>
              <p className="mt-1 font-bold text-gold">
                Result {Number(result.winAmount) > 0 ? `Win +${formatMoney(result.winAmount, currency)}` : "No Win"}
              </p>
              <p className="mt-1 tabular text-muted-foreground">
                New available: {formatMoney(result.wallet.available, result.wallet.currency)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
