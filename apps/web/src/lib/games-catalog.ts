import type { Game } from "@/lib/api";

export const ORIGINALS_SLUGS = [
  "aero-crash",
  "plinko",
  "mines",
  "dice",
  "limbo",
  "hilo",
] as const;

export const SLOT_SLUGS = [
  "gates-of-vladfs",
  "neon-cyber-slots",
  "cyber-neon-777",
  "pharaoh-gold-deluxe",
  "sugar-rush-frenzy",
  "dragon-fortune-888",
  "dead-mans-vault",
  "sandbox-slots",
] as const;

export const TABLE_SLUGS = [
  "european-roulette-deluxe",
  "quantum-blackjack",
  "dragon-baccarat",
  "cyber-video-poker",
] as const;

export const LIVE_SLUGS = [
  "lightning-roulette",
  "infinite-blackjack",
  "dragon-baccarat",
  "crazy-time-deluxe",
  "monopoly-live-studio",
] as const;

export const CATALOG_FALLBACK: Game[] = [
  {
    slug: "aero-crash",
    title: "Aero Crash",
    category: "CRASH",
    provider: "VladfsBET Originals",
    description: "Multiplayer rocket multiplier with live cashouts.",
    demo: true,
  },
  {
    slug: "plinko",
    title: "Physics Plinko Apex",
    category: "POPULAR",
    provider: "VladfsBET Originals",
    demo: true,
  },
  {
    slug: "mines",
    title: "Cyber Mines 5x5",
    category: "POPULAR",
    provider: "VladfsBET Originals",
    demo: true,
  },
  {
    slug: "dice",
    title: "Quantum Dice",
    category: "TABLE_GAMES",
    provider: "VladfsBET Originals",
    demo: true,
  },
  {
    slug: "limbo",
    title: "Limbo Neon Rocket",
    category: "CRASH",
    provider: "VladfsBET Originals",
    demo: true,
  },
  {
    slug: "hilo",
    title: "Royal Hilo Cards",
    category: "TABLE_GAMES",
    provider: "VladfsBET Originals",
    demo: true,
  },
  {
    slug: "gates-of-vladfs",
    title: "Gates of Vladfs",
    category: "SLOTS",
    provider: "VladfsBET Studio",
    demo: true,
  },
  {
    slug: "neon-cyber-slots",
    title: "Neon Cyber 777 Deluxe",
    category: "SLOTS",
    provider: "VladfsBET Studio",
    demo: true,
  },

  {
    slug: "pharaoh-gold-deluxe",
    title: "Pharaoh's Gold & Scarabs",
    category: "SLOTS",
    provider: "VladfsBET Studio",
    demo: true,
  },
  {
    slug: "sugar-rush-frenzy",
    title: "Sweet Sugar Frenzy",
    category: "SLOTS",
    provider: "VladfsBET Studio",
    demo: true,
  },
  {
    slug: "dragon-fortune-888",
    title: "Dragon Fortune 888",
    category: "SLOTS",
    provider: "VladfsBET Studio",
    demo: true,
  },
  {
    slug: "dead-mans-vault",
    title: "Dead Man's Vault",
    category: "SLOTS",
    provider: "VladfsBET Studio",
    demo: true,
  },
  {
    slug: "european-roulette-deluxe",
    title: "European Roulette Deluxe",
    category: "ROULETTE",
    provider: "VladfsBET Originals",
    demo: true,
  },
  {
    slug: "lightning-roulette",
    title: "Lightning Roulette",
    category: "ROULETTE",
    provider: "VladfsBET Live",
    tags: ["live"],
    demo: true,
  },
  {
    slug: "quantum-blackjack",
    title: "Quantum Blackjack VIP",
    category: "BLACKJACK",
    provider: "VladfsBET Originals",
    demo: true,
  },
  {
    slug: "infinite-blackjack",
    title: "Infinite Blackjack Elite",
    category: "BLACKJACK",
    provider: "VladfsBET Live",
    tags: ["live"],
    demo: true,
  },
  {
    slug: "dragon-baccarat",
    title: "Dragon Speed Baccarat",
    category: "BACCARAT",
    provider: "VladfsBET Originals",
    demo: true,
  },
  {
    slug: "cyber-video-poker",
    title: "Cyber Video Poker",
    category: "POKER",
    provider: "VladfsBET Originals",
    demo: true,
  },
  {
    slug: "spaceman-infinity",
    title: "Spaceman Infinity",
    category: "CRASH",
    provider: "VladfsBET Studio",
    demo: true,
  },
  {
    slug: "crazy-time-deluxe",
    title: "Crazy Time Deluxe",
    category: "LIVE_CASINO",
    provider: "VladfsBET Live",
    demo: true,
  },
  {
    slug: "monopoly-live-studio",
    title: "Studio Wheel Live",
    category: "LIVE_CASINO",
    provider: "VladfsBET Live",
    demo: true,
  },
];

export function isOriginal(slug: string): boolean {
  return (ORIGINALS_SLUGS as readonly string[]).includes(slug);
}

export function mergeCatalog(apiItems: Game[]): Game[] {
  const bySlug = new Map<string, Game>();
  for (const game of CATALOG_FALLBACK) {
    bySlug.set(game.slug, game);
  }
  for (const game of apiItems) {
    const existing = bySlug.get(game.slug);
    bySlug.set(game.slug, existing ? { ...existing, ...game } : game);
  }
  return Array.from(bySlug.values());
}

export function formatRtp(rtpBps?: number | null): string | null {
  if (rtpBps == null || !Number.isFinite(rtpBps)) return null;
  return `${(rtpBps / 100).toFixed(2)}% theoretical RTP (sandbox)`;
}

export function categoryLabel(category: string): string {
  return category.replaceAll("_", " ");
}
