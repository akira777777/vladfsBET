export interface DepositRequest {
    userId: string;
    amount: string;
    currency: string;
    paymentMethod: string;
    returnUrl?: string;
}
export interface DepositResponse {
    providerRef: string;
    redirectUrl?: string;
    status: "PENDING" | "COMPLETED" | "REQUIRES_ACTION";
    expiresAt: string;
}
export interface WithdrawalRequest {
    userId: string;
    amount: string;
    currency: string;
    paymentMethod: string;
    destinationDetails: Record<string, string>;
}
export interface WithdrawalResponse {
    providerRef: string;
    status: "PROCESSING" | "COMPLETED";
}
export interface WebhookPayload {
    eventId: string;
    eventType: "deposit.succeeded" | "deposit.failed" | "payout.succeeded" | "payout.failed";
    providerRef: string;
    amount: string;
    currency: string;
    signature: string;
    timestamp: number;
}
export interface PaymentProviderInterface {
    slug: string;
    name: string;
    createDeposit(req: DepositRequest): Promise<DepositResponse>;
    createWithdrawal(req: WithdrawalRequest): Promise<WithdrawalResponse>;
    verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}
export declare class MockCardPaymentProvider implements PaymentProviderInterface {
    slug: string;
    name: string;
    createDeposit(req: DepositRequest): Promise<DepositResponse>;
    createWithdrawal(req: WithdrawalRequest): Promise<WithdrawalResponse>;
    verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}
export declare class MockBankTransferProvider implements PaymentProviderInterface {
    slug: string;
    name: string;
    createDeposit(req: DepositRequest): Promise<DepositResponse>;
    createWithdrawal(req: WithdrawalRequest): Promise<WithdrawalResponse>;
    verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}
export declare class MockCryptoPaymentProvider implements PaymentProviderInterface {
    slug: string;
    name: string;
    createDeposit(req: DepositRequest): Promise<DepositResponse>;
    createWithdrawal(req: WithdrawalRequest): Promise<WithdrawalResponse>;
    verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}
export declare class PaymentGatewayManager {
    private providers;
    constructor();
    register(provider: PaymentProviderInterface): void;
    getProvider(slug: string): PaymentProviderInterface | undefined;
    listProviders(): PaymentProviderInterface[];
}
