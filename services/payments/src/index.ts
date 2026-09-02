import { hmacSha256, generateIdempotencyKey } from "@vladfsbet/utils";

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

export class MockCardPaymentProvider implements PaymentProviderInterface {
  slug = "sandbox-card";
  name = "Credit / Debit Card Sandbox";

  async createDeposit(req: DepositRequest): Promise<DepositResponse> {
    const providerRef = `card_dep_${generateIdempotencyKey()}`;
    return {
      providerRef,
      status: "COMPLETED", // Instant sandbox settlement
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async createWithdrawal(req: WithdrawalRequest): Promise<WithdrawalResponse> {
    const providerRef = `card_wd_${generateIdempotencyKey()}`;
    return {
      providerRef,
      status: "PROCESSING",
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expected = hmacSha256(secret, payload);
    return expected === signature;
  }
}

export class MockBankTransferProvider implements PaymentProviderInterface {
  slug = "sandbox-bank";
  name = "Instant Bank Wire Sandbox";

  async createDeposit(req: DepositRequest): Promise<DepositResponse> {
    const providerRef = `bank_dep_${generateIdempotencyKey()}`;
    return {
      providerRef,
      status: "COMPLETED",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }

  async createWithdrawal(req: WithdrawalRequest): Promise<WithdrawalResponse> {
    const providerRef = `bank_wd_${generateIdempotencyKey()}`;
    return {
      providerRef,
      status: "PROCESSING",
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expected = hmacSha256(secret, payload);
    return expected === signature;
  }
}

export class MockCryptoPaymentProvider implements PaymentProviderInterface {
  slug = "sandbox-crypto";
  name = "Crypto Gateway Sandbox (USDT/BTC)";

  async createDeposit(req: DepositRequest): Promise<DepositResponse> {
    const providerRef = `crypto_dep_${generateIdempotencyKey()}`;
    return {
      providerRef,
      status: "COMPLETED",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async createWithdrawal(req: WithdrawalRequest): Promise<WithdrawalResponse> {
    const providerRef = `crypto_wd_${generateIdempotencyKey()}`;
    return {
      providerRef,
      status: "PROCESSING",
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expected = hmacSha256(secret, payload);
    return expected === signature;
  }
}

export class PaymentGatewayManager {
  private providers = new Map<string, PaymentProviderInterface>();

  constructor() {
    this.register(new MockCardPaymentProvider());
    this.register(new MockBankTransferProvider());
    this.register(new MockCryptoPaymentProvider());
  }

  register(provider: PaymentProviderInterface) {
    this.providers.set(provider.slug, provider);
  }

  getProvider(slug: string): PaymentProviderInterface | undefined {
    return this.providers.get(slug);
  }

  listProviders(): PaymentProviderInterface[] {
    return Array.from(this.providers.values());
  }
}
