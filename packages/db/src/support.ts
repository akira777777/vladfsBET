import { PrismaClient, TicketPriority, TicketStatus } from "@prisma/client";

export class SupportError extends Error {
  constructor(
    public readonly code: "TICKET_NOT_FOUND" | "UNAUTHORIZED" | "INVALID_ACTION",
    message: string,
  ) {
    super(message);
    this.name = "SupportError";
  }
}

export type CreateTicketInput = {
  userId: string;
  subject: string;
  category: string;
  priority?: TicketPriority;
  message: string;
};

export async function createPlayerTicket(db: PrismaClient, input: CreateTicketInput) {
  const ticket = await db.supportTicket.create({
    data: {
      userId: input.userId,
      subject: input.subject.trim(),
      category: input.category,
      priority: input.priority ?? "NORMAL",
      status: "OPEN",
      messages: {
        create: {
          authorType: "PLAYER",
          authorId: input.userId,
          body: input.message.trim(),
          internal: false,
        },
      },
    },
    include: { messages: true },
  });

  return ticket;
}

export async function addTicketMessage(
  db: PrismaClient,
  ticketId: string,
  authorId: string,
  authorType: "PLAYER" | "ADMIN",
  body: string,
  internal: boolean = false,
) {
  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new SupportError("TICKET_NOT_FOUND", "Support ticket not found");
  }

  const message = await db.supportMessage.create({
    data: {
      ticketId,
      authorId,
      authorType,
      body: body.trim(),
      internal,
    },
  });

  // Update ticket status
  const nextStatus: TicketStatus =
    authorType === "ADMIN" ? "PENDING_PLAYER" : "PENDING_STAFF";

  await db.supportTicket.update({
    where: { id: ticketId },
    data: { status: nextStatus, updatedAt: new Date() },
  });

  return message;
}

export async function getPlayerTickets(db: PrismaClient, userId: string) {
  return db.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        where: { internal: false },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getAdminTickets(
  db: PrismaClient,
  statusFilter?: TicketStatus,
) {
  return db.supportTicket.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateTicketStatus(
  db: PrismaClient,
  ticketId: string,
  status: TicketStatus,
  assignedTo?: string,
) {
  const data: { status: TicketStatus; closedAt?: Date | null; assignedTo?: string } = {
    status,
  };
  if (status === "CLOSED" || status === "RESOLVED") {
    data.closedAt = new Date();
  }
  if (assignedTo !== undefined) {
    data.assignedTo = assignedTo;
  }

  return db.supportTicket.update({
    where: { id: ticketId },
    data,
  });
}
