import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding VladfsBET database...");

  // 1. System Settings
  await prisma.systemSetting.upsert({
    where: { key: "REAL_MONEY_ENABLED" },
    update: { value: false },
    create: { key: "REAL_MONEY_ENABLED", value: false },
  });

  await prisma.systemSetting.upsert({
    where: { key: "PLATFORM_NAME" },
    update: { value: "VladfsBET" },
    create: { key: "PLATFORM_NAME", value: "VladfsBET" },
  });

  // 2. Jurisdictions
  const jurisdictions = [
    { country: "ZZ", name: "Global Sandbox / International", registration: true, minAge: 18 },
    { country: "US", name: "United States (Regulated Demo)", registration: true, minAge: 21 },
    { country: "GB", name: "United Kingdom (Demo)", registration: true, minAge: 18 },
    { country: "DE", name: "Germany (Demo)", registration: true, minAge: 18 },
    { country: "CA", name: "Canada (Demo)", registration: true, minAge: 19 },
    { country: "AU", name: "Australia (Demo)", registration: true, minAge: 18 },
    { country: "BR", name: "Brazil (Demo)", registration: true, minAge: 18 },
    { country: "JP", name: "Japan (Demo)", registration: true, minAge: 20 },
  ];

  for (const j of jurisdictions) {
    await prisma.jurisdiction.upsert({
      where: { country: j.country },
      update: { registrationOpen: j.registration, minAge: j.minAge },
      create: {
        country: j.country,
        registrationOpen: j.registration,
        depositsOpen: true,
        withdrawalsOpen: true,
        gamesOpen: true,
        minAge: j.minAge,
        realMoneyEnabled: false,
      },
    });
  }

  // 3. Providers
  const providers = [
    { slug: "vladfs-originals", name: "VladfsBET Originals", sandbox: true, active: true },
    { slug: "pragmatic-play", name: "Pragmatic Play", sandbox: true, active: true },
    { slug: "evolution-gaming", name: "Evolution Gaming", sandbox: true, active: true },
    { slug: "hacksaw-gaming", name: "Hacksaw Gaming", sandbox: true, active: true },
    { slug: "netent", name: "NetEnt", sandbox: true, active: true },
    { slug: "playngo", name: "Play'n GO", sandbox: true, active: true },
  ];

  const providerMap: Record<string, string> = {};
  for (const p of providers) {
    const prov = await prisma.gameProvider.upsert({
      where: { slug: p.slug },
      update: { active: p.active, sandbox: p.sandbox },
      create: p,
    });
    providerMap[p.slug] = prov.id;
  }

  // 4. Games Catalog
  const gamesList = [
    // Slots
    {
      slug: "neon-cyber-slots",
      title: "Neon Cyber 777 Deluxe",
      category: "SLOTS" as const,
      provider: "vladfs-originals",
      rtpBps: 9680,
      volatility: "HIGH",
      minBet: "0.10",
      maxBet: "100.00",
      description: "Futuristic 5-reel slot featuring neon multipliers, scatter free spins, and cyber bonus cascades.",
      tags: ["popular", "hot", "slots", "featured"],
    },
    {
      slug: "gates-of-vladfs",
      title: "Gates of Vladfs: Olympus Gods",
      category: "SLOTS" as const,
      provider: "pragmatic-play",
      rtpBps: 9650,
      volatility: "HIGH",
      minBet: "0.20",
      maxBet: "125.00",
      description: "Tumble reels and Zeus multipliers up to 500x in this mythic slot adventure.",
      tags: ["popular", "jackpot", "slots"],
    },
    {
      slug: "pharaoh-gold-deluxe",
      title: "Pharaoh's Gold & Scarabs",
      category: "SLOTS" as const,
      provider: "playngo",
      rtpBps: 9620,
      volatility: "MEDIUM",
      minBet: "0.10",
      maxBet: "50.00",
      description: "Expand ancient golden symbols across 10 paylines in search of Egyptian riches.",
      tags: ["new", "slots"],
    },
    {
      slug: "sugar-rush-frenzy",
      title: "Sweet Sugar Frenzy",
      category: "SLOTS" as const,
      provider: "pragmatic-play",
      rtpBps: 9650,
      volatility: "HIGH",
      minBet: "0.20",
      maxBet: "100.00",
      description: "Cluster pays with sticky multiplier spots multiplying wins up to 128x.",
      tags: ["trending", "slots"],
    },
    {
      slug: "dead-mans-vault",
      title: "Dead Man's Vault: Chaos",
      category: "SLOTS" as const,
      provider: "hacksaw-gaming",
      rtpBps: 9630,
      volatility: "EXTREME",
      minBet: "0.20",
      maxBet: "100.00",
      description: "Dark gritty wild west shootout with VS multipliers and duel bonuses.",
      tags: ["hot", "slots"],
    },
    // Roulette
    {
      slug: "european-roulette-deluxe",
      title: "European Roulette Deluxe",
      category: "ROULETTE" as const,
      provider: "vladfs-originals",
      rtpBps: 9730,
      volatility: "LOW",
      minBet: "1.00",
      maxBet: "1000.00",
      description: "Single-zero classic European roulette with interactive 3D wheel and French racetrack bets.",
      tags: ["popular", "table", "roulette"],
    },
    {
      slug: "lightning-roulette",
      title: "Lightning Roulette Studio",
      category: "ROULETTE" as const,
      provider: "evolution-gaming",
      rtpBps: 9710,
      volatility: "HIGH",
      minBet: "0.50",
      maxBet: "2000.00",
      description: "Electrifying live-style roulette featuring random RNG lucky multipliers up to 500x.",
      tags: ["live", "roulette", "featured"],
    },
    // Blackjack
    {
      slug: "quantum-blackjack",
      title: "Quantum Blackjack VIP",
      category: "BLACKJACK" as const,
      provider: "vladfs-originals",
      rtpBps: 9940,
      volatility: "LOW",
      minBet: "1.00",
      maxBet: "500.00",
      description: "6-deck Vegas rules blackjack, dealer stands on soft 17, double down on any two cards.",
      tags: ["popular", "table", "blackjack"],
    },
    {
      slug: "infinite-blackjack",
      title: "Infinite Blackjack Elite",
      category: "BLACKJACK" as const,
      provider: "evolution-gaming",
      rtpBps: 9928,
      volatility: "LOW",
      minBet: "1.00",
      maxBet: "5000.00",
      description: "Unlimited seats table with Six Card Charlie rule and Any Pair & 21+3 side bets.",
      tags: ["live", "blackjack"],
    },
    // Crash
    {
      slug: "aero-crash",
      title: "Aero Crash: Rocket Multiplier",
      category: "CRASH" as const,
      provider: "vladfs-originals",
      rtpBps: 9700,
      volatility: "HIGH",
      minBet: "0.10",
      maxBet: "250.00",
      description: "Multiplayer rocket crash game with real-time room, dynamic cashouts, chat emojis, and dual bet controls.",
      tags: ["hot", "crash", "featured", "multiplayer", "originals"],
    },
    {
      slug: "spaceman-infinity",
      title: "Spaceman Infinity Odyssey",
      category: "CRASH" as const,
      provider: "pragmatic-play",
      rtpBps: 9650,
      volatility: "HIGH",
      minBet: "1.00",
      maxBet: "100.00",
      description: "Social multiplayer crash game with 50% auto-cashout option.",
      tags: ["crash", "trending"],
    },
    // Vladfs Originals Suite
    {
      slug: "plinko",
      title: "Physics Plinko Apex",
      category: "POPULAR" as const,
      provider: "vladfs-originals",
      rtpBps: 9900,
      volatility: "HIGH",
      minBet: "0.10",
      maxBet: "500.00",
      description: "Real-time 2D rigid body physics Plinko with 8-16 customizable rows, 3 risk tiers, multi-drop spam, and up to 1000x jackpot bins.",
      tags: ["hot", "plinko", "physics", "featured", "originals"],
    },
    {
      slug: "mines",
      title: "Cyber Mines 5x5",
      category: "POPULAR" as const,
      provider: "vladfs-originals",
      rtpBps: 9900,
      volatility: "VERY_HIGH",
      minBet: "0.10",
      maxBet: "1000.00",
      description: "Classic 5x5 minefield grid. Configure 1 to 24 mines, uncover glowing gems, watch multiplier soar, and cash out instantly.",
      tags: ["hot", "mines", "featured", "originals"],
    },
    {
      slug: "dice",
      title: "Quantum Dice 99.99",
      category: "TABLE_GAMES" as const,
      provider: "vladfs-originals",
      rtpBps: 9900,
      volatility: "MEDIUM",
      minBet: "0.10",
      maxBet: "2000.00",
      description: "Interactive win chance slider with roll under/over toggles, Martingale/D'Alembert automated betting, and 99% certified RTP.",
      tags: ["popular", "dice", "originals", "table"],
    },
    {
      slug: "limbo",
      title: "Limbo Neon Rocket",
      category: "CRASH" as const,
      provider: "vladfs-originals",
      rtpBps: 9900,
      volatility: "EXTREME",
      minBet: "0.10",
      maxBet: "500.00",
      description: "Ultra-high multiplier original with payouts up to 1,000,000x. Target your multiplier and launch!",
      tags: ["hot", "limbo", "originals", "crash"],
    },
    {
      slug: "hilo",
      title: "Royal Hilo Cards",
      category: "TABLE_GAMES" as const,
      provider: "vladfs-originals",
      rtpBps: 9850,
      volatility: "MEDIUM",
      minBet: "0.50",
      maxBet: "500.00",
      description: "Guess Higher or Lower card values. Chain winning streaks for exponential multiplier growth, skip cards, and cash out anytime.",
      tags: ["table", "hilo", "originals"],
    },
    // Baccarat
    {
      slug: "dragon-baccarat",
      title: "Dragon Speed Baccarat",
      category: "BACCARAT" as const,
      provider: "vladfs-originals",
      rtpBps: 9894,
      volatility: "LOW",
      minBet: "1.00",
      maxBet: "1000.00",
      description: "Fast-paced Punto Banco baccarat with Dragon Bonus and Panda 8 side bets.",
      tags: ["table", "baccarat"],
    },
    // Poker
    {
      slug: "cyber-video-poker",
      title: "Cyber Video Poker: Jacks or Better",
      category: "POKER" as const,
      provider: "vladfs-originals",
      rtpBps: 9954,
      volatility: "MEDIUM",
      minBet: "0.25",
      maxBet: "50.00",
      description: "Classic 5-card draw video poker. Pair of Jacks or higher triggers instant payouts.",
      tags: ["table", "poker"],
    },
    // Live Casino
    {
      slug: "monopoly-live-studio",
      title: "Monopoly Wheel Live Show",
      category: "LIVE_CASINO" as const,
      provider: "evolution-gaming",
      rtpBps: 9623,
      volatility: "HIGH",
      minBet: "0.10",
      maxBet: "1000.00",
      description: "Money wheel live game show with 3D bonus board game round.",
      tags: ["live", "featured"],
    },
    {
      slug: "crazy-time-deluxe",
      title: "Crazy Time Deluxe",
      category: "LIVE_CASINO" as const,
      provider: "evolution-gaming",
      rtpBps: 9608,
      volatility: "VERY_HIGH",
      minBet: "0.10",
      maxBet: "2500.00",
      description: "All-action live casino game show with 4 interactive bonus rounds: Pachinko, Cash Hunt, Coin Flip, Crazy Time.",
      tags: ["live", "hot"],
    },
  ];

  for (const g of gamesList) {
    const providerId = providerMap[g.provider] || providerMap["vladfs-originals"];
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: {
        active: true,
        demoAvailable: true,
        rtpBps: g.rtpBps,
        category: g.category,
        minBet: g.minBet,
        maxBet: g.maxBet,
      },
      create: {
        slug: g.slug,
        title: g.title,
        category: g.category,
        providerId,
        description: g.description,
        rtpBps: g.rtpBps,
        volatility: g.volatility,
        minBet: g.minBet,
        maxBet: g.maxBet,
        currencies: ["USD", "EUR", "GBP", "CAD", "AUD", "BRL", "USDT"],
        countriesBlocked: [],
        active: true,
        demoAvailable: true,
        tags: g.tags,
      },
    });
  }

  // 5. Sportsbook Events & Markets
  const sportsEvents = [
    {
      sport: "Soccer",
      name: "Manchester City vs Real Madrid",
      startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: "UPCOMING",
      markets: [
        {
          name: "1X2 (Full Time Result)",
          status: "OPEN",
          odds: [
            { id: "1", name: "Manchester City", odds: 2.10 },
            { id: "X", name: "Draw", odds: 3.60 },
            { id: "2", name: "Real Madrid", odds: 3.25 },
          ],
        },
        {
          name: "Total Goals (Over/Under 2.5)",
          status: "OPEN",
          odds: [
            { id: "o25", name: "Over 2.5 Goals", odds: 1.72 },
            { id: "u25", name: "Under 2.5 Goals", odds: 2.15 },
          ],
        },
      ],
    },
    {
      sport: "Basketball",
      name: "Boston Celtics vs Golden State Warriors",
      startsAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: "UPCOMING",
      markets: [
        {
          name: "Moneyline (Match Winner)",
          status: "OPEN",
          odds: [
            { id: "bos", name: "Boston Celtics", odds: 1.65 },
            { id: "gsw", name: "Golden State Warriors", odds: 2.30 },
          ],
        },
        {
          name: "Point Spread (-4.5 / +4.5)",
          status: "OPEN",
          odds: [
            { id: "bos_spread", name: "Boston Celtics -4.5", odds: 1.90 },
            { id: "gsw_spread", name: "Golden State Warriors +4.5", odds: 1.90 },
          ],
        },
      ],
    },
    {
      sport: "Esports",
      name: "Natus Vincere vs FaZe Clan (CS2 Major)",
      startsAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
      status: "UPCOMING",
      markets: [
        {
          name: "Match Winner (Best of 3)",
          status: "OPEN",
          odds: [
            { id: "navi", name: "Natus Vincere", odds: 1.85 },
            { id: "faze", name: "FaZe Clan", odds: 1.95 },
          ],
        },
      ],
    },
    {
      sport: "Tennis",
      name: "Carlos Alcaraz vs Novak Djokovic",
      startsAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      status: "UPCOMING",
      markets: [
        {
          name: "Match Winner",
          status: "OPEN",
          odds: [
            { id: "alc", name: "Carlos Alcaraz", odds: 1.80 },
            { id: "djo", name: "Novak Djokovic", odds: 2.05 },
          ],
        },
      ],
    },
  ];

  for (const se of sportsEvents) {
    const existing = await prisma.sportEvent.findFirst({ where: { name: se.name } });
    if (!existing) {
      await prisma.sportEvent.create({
        data: {
          sport: se.sport,
          name: se.name,
          startsAt: se.startsAt,
          status: se.status,
          sandbox: true,
          markets: {
            create: se.markets.map((m) => ({
              name: m.name,
              status: m.status,
              odds: m.odds,
            })),
          },
        },
      });
    }
  }

  // 6. VIP Tiers
  const vipLevels = [
    { slug: "bronze", name: "Bronze VIP", rank: 1, pointsRequired: "0", cashbackBps: 0 },
    { slug: "silver", name: "Silver VIP", rank: 2, pointsRequired: "5000", cashbackBps: 200 }, // 2%
    { slug: "gold", name: "Gold VIP", rank: 3, pointsRequired: "25000", cashbackBps: 500 }, // 5%
    { slug: "platinum", name: "Platinum VIP", rank: 4, pointsRequired: "100000", cashbackBps: 1000 }, // 10%
    { slug: "diamond", name: "Diamond Legend VIP", rank: 5, pointsRequired: "500000", cashbackBps: 1500 }, // 15%
  ];

  for (const level of vipLevels) {
    await prisma.vipLevel.upsert({
      where: { slug: level.slug },
      update: { rank: level.rank, cashbackBps: level.cashbackBps, pointsRequired: level.pointsRequired },
      create: level,
    });
  }

  // 7. Bonus Templates & Promotions
  const bonusTemplates = [
    {
      slug: "welcome-demo",
      name: "Welcome Demo Package",
      type: "WELCOME" as const,
      amount: "1000.00",
      wageringMultiplier: 0,
      active: true,
      terms: "1,000 virtual demo credits on account creation. No real money required.",
    },
    {
      slug: "welcome-match-100",
      name: "100% First Deposit Match up to $500",
      type: "DEPOSIT" as const,
      amount: "500.00",
      percentageBps: 10000,
      wageringMultiplier: 30,
      active: true,
      terms: "30x wagering requirement on bonus funds. Eligible on all slots.",
    },
    {
      slug: "friday-reload",
      name: "Friday 50% Reload Bonus",
      type: "RELOAD" as const,
      amount: "250.00",
      percentageBps: 5000,
      wageringMultiplier: 25,
      active: true,
      terms: "25x wagering requirement. Available once per Friday.",
    },
    {
      slug: "vip-highroller",
      name: "High Roller VIP Boost",
      type: "VIP" as const,
      amount: "2000.00",
      percentageBps: 15000,
      wageringMultiplier: 20,
      active: true,
      terms: "Exclusive to Gold VIP and above. 20x wagering.",
    },
  ];

  for (const bt of bonusTemplates) {
    await prisma.bonusTemplate.upsert({
      where: { slug: bt.slug },
      update: { active: bt.active, terms: bt.terms },
      create: {
        slug: bt.slug,
        name: bt.name,
        type: bt.type,
        amount: bt.amount,
        percentageBps: bt.percentageBps,
        wageringMultiplier: bt.wageringMultiplier,
        active: bt.active,
        terms: bt.terms,
      },
    });
  }

  // Promo campaign & codes
  const promo = await prisma.promotion.upsert({
    where: { slug: "launch-celebration" },
    update: { active: true },
    create: {
      slug: "launch-celebration",
      title: "VladfsBET Grand Launch Celebration",
      body: "Claim $50 instant demo credits to test out all games across our casino & sportsbook!",
      startsAt: new Date(),
      active: true,
      terms: "Valid for all registered sandbox players. 1 redemption per account.",
    },
  });

  await prisma.promoCode.upsert({
    where: { code: "VLADFSVIP" },
    update: { active: true },
    create: {
      promotionId: promo.id,
      code: "VLADFSVIP",
      maxRedemptions: 10000,
      active: true,
    },
  });

  await prisma.promoCode.upsert({
    where: { code: "NEON777" },
    update: { active: true },
    create: {
      promotionId: promo.id,
      code: "NEON777",
      maxRedemptions: 5000,
      active: true,
    },
  });

  // 8. Payment Providers
  const paymentProviders = [
    { slug: "sandbox-card", name: "Credit / Debit Card (Sandbox)", sandbox: true, active: true },
    { slug: "sandbox-bank", name: "Instant Bank Transfer (Sandbox)", sandbox: true, active: true },
    { slug: "sandbox-crypto", name: "Crypto Gateway (USDT/BTC Sandbox)", sandbox: true, active: true },
  ];

  for (const pp of paymentProviders) {
    await prisma.paymentProvider.upsert({
      where: { slug: pp.slug },
      update: { active: pp.active, sandbox: pp.sandbox },
      create: pp,
    });
  }

  // 9. Admin Roles & Permissions
  const permissions = [
    "players.read",
    "players.write",
    "wallet.adjust",
    "withdrawals.review",
    "kyc.review",
    "risk.review",
    "bonuses.write",
    "cms.write",
    "audit.read",
    "settings.write",
  ];

  const permEntities: Record<string, string> = {};
  for (const key of permissions) {
    const p = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: `Permission to ${key}` },
    });
    permEntities[key] = p.id;
  }

  const superRole = await prisma.role.upsert({
    where: { slug: "super-admin" },
    update: {},
    create: { slug: "super-admin", name: "Super Administrator", description: "Full platform control" },
  });

  for (const pId of Object.values(permEntities)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superRole.id, permissionId: pId } },
      update: {},
      create: { roleId: superRole.id, permissionId: pId },
    });
  }

  // 10. Seed Admin Account
  const adminPasswordHash = await hashPassword("Admin123456!");
  const adminUser = await prisma.adminUser.upsert({
    where: { email: "admin@vladfsbet.com" },
    update: { passwordHash: adminPasswordHash, active: true },
    create: {
      email: "admin@vladfsbet.com",
      passwordHash: adminPasswordHash,
      name: "Vladfs Administrator",
      active: true,
    },
  });

  await prisma.adminUserRole.upsert({
    where: { adminUserId_roleId: { adminUserId: adminUser.id, roleId: superRole.id } },
    update: {},
    create: { adminUserId: adminUser.id, roleId: superRole.id },
  });

  console.log("Seeding completed successfully!");
  console.log("Admin credentials: admin@vladfsbet.com / Admin123456!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
