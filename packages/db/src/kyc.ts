import { KycStatus, PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

export class KycError extends Error {
  constructor(
    public readonly code: "CASE_NOT_FOUND" | "INVALID_STATUS" | "UNSUPPORTED_DOC",
    message: string,
  ) {
    super(message);
    this.name = "KycError";
  }
}

export type UploadDocInput = {
  userId: string;
  type: "PASSPORT" | "NATIONAL_ID" | "DRIVERS_LICENSE" | "UTILITY_BILL" | "BANK_STATEMENT";
  fileName: string;
  fileBufferBase64?: string;
};

export async function getOrCreatePlayerKycCase(db: PrismaClient, userId: string) {
  let kycCase = await db.kycCase.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { documents: true },
  });

  if (!kycCase) {
    kycCase = await db.kycCase.create({
      data: {
        userId,
        status: "NOT_STARTED",
      },
      include: { documents: true },
    });
  }

  return kycCase;
}

export async function submitKycDocument(db: PrismaClient, input: UploadDocInput) {
  let kycCase = await db.kycCase.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
  });

  if (!kycCase || kycCase.status === "APPROVED") {
    kycCase = await db.kycCase.create({
      data: {
        userId: input.userId,
        status: "UNDER_REVIEW",
      },
    });
  } else {
    kycCase = await db.kycCase.update({
      where: { id: kycCase.id },
      data: { status: "UNDER_REVIEW" },
    });
  }

  const checksum = input.fileBufferBase64
    ? createHash("sha256").update(input.fileBufferBase64).digest("hex")
    : createHash("sha256").update(`${input.fileName}:${Date.now()}`).digest("hex");

  const storageKey = `kyc/${input.userId}/${Date.now()}_${input.fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const doc = await db.kycDocument.create({
    data: {
      caseId: kycCase.id,
      type: input.type,
      storageKey,
      checksum,
      status: "UNDER_REVIEW",
    },
  });

  await db.user.update({
    where: { id: input.userId },
    data: { kycStatus: "UNDER_REVIEW" },
  });

  return { doc, kycCase };
}

export async function adminReviewKycCase(
  db: PrismaClient,
  caseId: string,
  adminUserId: string,
  decision: "APPROVED" | "REJECTED" | "REQUIRES_INFORMATION",
  reviewNote?: string,
) {
  const now = new Date();

  const kycCase = await db.kycCase.findUnique({
    where: { id: caseId },
    include: { user: true, documents: true },
  });

  if (!kycCase) {
    throw new KycError("CASE_NOT_FOUND", "KYC Case not found");
  }

  const updated = await db.kycCase.update({
    where: { id: caseId },
    data: {
      status: decision,
      reviewedById: adminUserId,
      reviewedAt: now,
      reviewNote,
      documents: {
        updateMany: {
          where: { caseId },
          data: { status: decision },
        },
      },
    },
    include: { documents: true },
  });

  await db.user.update({
    where: { id: kycCase.userId },
    data: {
      kycStatus: decision,
      // If approved, player is realMoneyEligible subject to licensing
      realMoneyEligible: decision === "APPROVED",
    },
  });

  // Record audit log
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: kycCase.userId,
      action: `KYC_${decision}`,
      entity: "KycCase",
      entityId: caseId,
      payload: { decision, reviewNote },
    },
  });

  return updated;
}
