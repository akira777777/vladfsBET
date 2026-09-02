export function formatMoney(amount: string | number, currency = "EUR"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) {
    return `${currency} —`;
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function transactionLabel(type: string): string {
  switch (type) {
    case "BONUS":
      return "Demo credit";
    case "BET":
      return "Bet";
    case "WIN":
      return "Win";
    default:
      return type;
  }
}

export const GAME_ART: Record<string, string> = {
  "aero-crash": "/games/aero-crash.jpg",
  "spaceman-infinity": "/games/spaceman-infinity.jpg",
  plinko: "/games/plinko.jpg",
  mines: "/games/mines.jpg",
  dice: "/games/dice.jpg",
  limbo: "/games/limbo.jpg",
  hilo: "/games/hilo.jpg",
  "gates-of-vladfs": "/games/gates-of-vladfs.jpg",
  "neon-cyber-slots": "/games/neon-cyber-slots.jpg",
  "cyber-neon-777": "/games/neon-cyber-slots.jpg",
  "pharaoh-gold-deluxe": "/games/pharaoh-gold-deluxe.jpg",
  "sugar-rush-frenzy": "/games/sugar-rush-frenzy.jpg",
  "dragon-fortune-888": "/games/dragon-fortune-888.jpg",
  "dead-mans-vault": "/games/dead-mans-vault.jpg",
  "sandbox-slots": "/games/sandbox-slots.jpg",
  slots: "/games/sandbox-slots.jpg",
  "european-roulette-deluxe": "/games/european-roulette-deluxe.jpg",
  "sandbox-roulette": "/games/european-roulette-deluxe.jpg",
  "lightning-roulette": "/games/lightning-roulette.jpg",
  "quantum-blackjack": "/games/quantum-blackjack.jpg",
  "sandbox-blackjack": "/games/quantum-blackjack.jpg",
  "infinite-blackjack": "/games/infinite-blackjack.jpg",
  "dragon-baccarat": "/games/dragon-baccarat.jpg",
  "cyber-video-poker": "/games/cyber-video-poker.jpg",
  "crazy-time-deluxe": "/games/crazy-time-deluxe.jpg",
  "monopoly-live-studio": "/games/monopoly-live-studio.jpg",
};

const FALLBACK_ART = "/games/fallback.jpg";

export function gameArt(slug: string): string {
  return GAME_ART[slug] ?? FALLBACK_ART;
}
