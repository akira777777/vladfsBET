import { KycStatus } from "@vladfsbet/types";
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
export declare class MockKycProvider implements KycProviderInterface {
    slug: string;
    name: string;
    submitVerification(req: KycVerificationRequest): Promise<KycVerificationResult>;
    checkStatus(providerRef: string): Promise<KycVerificationResult>;
}
