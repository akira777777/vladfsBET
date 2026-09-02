import { Prisma, PrismaClient, SportBetStatus } from "@prisma/client";
import { LedgerError, postJournal } from "./ledger";

export class SportsError extends Error {
  constructor(
    public readonly code:
      | "EVENT_NOT_FOUND"
      | "MARKET_SUSPENDED"
      | "INSUFFICIENT_FUNDS"
      | "INVALID_STAKE"
      | "ODDS_CHANGED",
    message: string,
  ) {
    super(message);
    this.name = "SportsError";
  }
}

export type PlaceBetInput = {
  userId: string;
  eventId: string;
  marketId: string;
  stake: Prisma.Decimal | string | number;
  odds: Prisma.Decimal | string | number;
  selectionName: string;
};

export async function placeSportBet(db: PrismaClient, input: PlaceBetInput) {
  const stake = new Prisma.Decimal(input.stake);
  const odds = new Prisma.Decimal(input.odds);

  if (stake.lte(0)) {
    throw new SportsError("INVALID_STAKE", "Stake must be greater than zero");
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: input.userId } });
  const event = await db.sportEvent.findUnique({
    where: { id: input.eventId },
    include: { markets: true },
  });

  if (!event || event.status === "CANCELLED" || event.status === "FINISHED") {
    throw new SportsError("EVENT_NOT_FOUND", "Event is not open for betting");
  }

  const market = event.markets.find((m) => m.id === input.marketId);
  if (!market || market.status !== "OPEN") {
    throw new SportsError("MARKET_SUSPENDED", "Market is currently suspended");
  }

  const betId = `sb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Post ledger debit for stake
  try {
    await postJournal(db, {
      userId: user.id,
      type: "BET",
      currency: user.currency,
      idempotencyKey: `sport-bet:${betId}:stake`,
      amount: stake,
      referenceType: "sport_bet",
      referenceId: betId,
      memo: `Sports Bet: ${event.name} - ${input.selectionName} @ ${odds.toFixed(2)}`,
      lines: [
        { owner: "player", accountType: "AVAILABLE", direction: "DEBIT", amount: stake },
        { owner: "house", accountType: "AVAILABLE", direction: "CREDIT", amount: stake },
      ],
    });
  } catch (error) {
    if (error instanceof LedgerError && error.code === "INSUFFICIENT_FUNDS") {
      throw new SportsError("INSUFFICIENT_FUNDS", "Insufficient available balance to place bet");
    }
    throw error;
  }

  const potentialPayout = stake.mul(odds);

  const sportBet = await db.sportBet.create({
    data: {
      id: betId,
      userId: user.id,
      eventId: event.id,
      marketId: market.id,
      status: "OPEN",
      currency: user.currency,
      stake,
      odds,
      payout: potentialPayout,
    },
    include: { event: true, market: true },
  });

  return sportBet;
}

export async function settleSportBet(
  db: PrismaClient,
  betId: string,
  won: boolean,
) {
  const bet = await db.sportBet.findUnique({
    where: { id: betId },
    include: { user: true, event: true },
  });

  if (!bet || bet.status !== "OPEN") {
    return bet;
  }

  const now = new Date();

  if (won && bet.payout && bet.payout.gt(0)) {
    await postJournal(db, {
      userId: bet.userId,
      type: "WIN",
      currency: bet.currency,
      idempotencyKey: `sport-settle:${bet.id}:win`,
      amount: bet.payout,
      referenceType: "sport_bet",
      referenceId: bet.id,
      memo: `Sports Bet Won: ${bet.event.name}`,
      lines: [
        { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: bet.payout },
        { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: bet.payout },
      ],
    });

    return db.sportBet.update({
      where: { id: bet.id },
      data: { status: "SETTLED_WIN", settledAt: now },
      include: { event: true, market: true },
    });
  } else {
    return db.sportBet.update({
      where: { id: bet.id },
      data: { status: "SETTLED_LOSS", settledAt: now },
      include: { event: true, market: true },
    });
  }
}

export async function getPlayerSportBets(db: PrismaClient, userId: string) {
  return db.sportBet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { event: true, market: true },
    take: 50,
  });
}
