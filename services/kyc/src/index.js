import { generateIdempotencyKey } from "@vladfsbet/utils";
export class MockKycProvider {
    slug = "mock-kyc-sandbox";
    name = "Mock KYC Verifier (Sandbox)";
    async submitVerification(req) {
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
    async checkStatus(providerRef) {
        return {
            providerRef,
            status: "APPROVED",
            confidenceScore: 0.98,
            manualReviewRequired: false,
            notes: "Sandbox verification passed.",
        };
    }
}
