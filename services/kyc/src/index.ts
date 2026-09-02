import { KycStatus } from "@vladfsbet/types";
import { generateIdempotencyKey } from "@vladfsbet/utils";

export interface KycVerificationRequest {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  documentType: string;
  documentStorageKey: string;
}

export interface KycVerificationResult {
  providerRef: string;
  status: KycStatus;
  confidenceScore: number;
  extractedDetails?: {
    nameMatch: boolean;
    dobMatch: boolean;
    documentExpiry?: string;
  };
  manualReviewRequired: boolean;
  notes?: string;
}

export interface KycProviderInterface {
  slug: string;
  name: string;
  submitVerification(req: KycVerificationRequest): Promise<KycVerificationResult>;
  checkStatus(providerRef: string): Promise<KycVerificationResult>;
}

export class MockKycProvider implements KycProviderInterface {
  slug = "mock-kyc-sandbox";
  name = "Mock KYC Verifier (Sandbox)";

  async submitVerification(req: KycVerificationRequest): Promise<KycVerificationResult> {
    const providerRef = `kyc_${generateIdempotencyKey()}`;

    // In sandbox, documents are placed into UNDER_REVIEW for manual admin review or automated simulation
    return {
      providerRef,
      status: "UNDER_REVIEW",
      confidenceScore: 0.94,
      extractedDetails: {
        nameMatch: true,
        dobMatch: true,
        documentExpiry: "2032-12-31",
      },
      manualReviewRequired: true,
      notes: "Document successfully parsed and hashed. Ready for compliance officer review.",
    };
  }

  async checkStatus(providerRef: string): Promise<KycVerificationResult> {
    return {
      providerRef,
      status: "APPROVED",
      confidenceScore: 0.98,
      manualReviewRequired: false,
      notes: "Sandbox verification passed.",
    };
  }
}
