import { hmacSha256, generateIdempotencyKey } from "@vladfsbet/utils";
export class MockCardPaymentProvider {
    slug = "sandbox-card";
    name = "Credit / Debit Card Sandbox";
    async createDeposit(req) {
        const providerRef = `card_dep_${generateIdempotencyKey()}`;
        return {
            providerRef,
            status: "COMPLETED", // Instant sandbox settlement
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        };
    }
    async createWithdrawal(req) {
        const providerRef = `card_wd_${generateIdempotencyKey()}`;
        return {
            providerRef,
            status: "PROCESSING",
        };
    }
    verifyWebhookSignature(payload, signature, secret) {
        const expected = hmacSha256(secret, payload);
        return expected === signature;
    }
}
export class MockBankTransferProvider {
    slug = "sandbox-bank";
    name = "Instant Bank Wire Sandbox";
    async createDeposit(req) {
        const providerRef = `bank_dep_${generateIdempotencyKey()}`;
        return {
            providerRef,
            status: "COMPLETED",
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
    }
    async createWithdrawal(req) {
        const providerRef = `bank_wd_${generateIdempotencyKey()}`;
        return {
            providerRef,
            status: "PROCESSING",
        };
    }
    verifyWebhookSignature(payload, signature, secret) {
        const expected = hmacSha256(secret, payload);
        return expected === signature;
    }
}
export class MockCryptoPaymentProvider {
    slug = "sandbox-crypto";
    name = "Crypto Gateway Sandbox (USDT/BTC)";
    async createDeposit(req) {
        const providerRef = `crypto_dep_${generateIdempotencyKey()}`;
        return {
            providerRef,
            status: "COMPLETED",
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
    }
    async createWithdrawal(req) {
        const providerRef = `crypto_wd_${generateIdempotencyKey()}`;
        return {
            providerRef,
            status: "PROCESSING",
        };
    }
    verifyWebhookSignature(payload, signature, secret) {
        const expected = hmacSha256(secret, payload);
        return expected === signature;
    }
}
export class PaymentGatewayManager {
    providers = new Map();
    constructor() {
        this.register(new MockCardPaymentProvider());
        this.register(new MockBankTransferProvider());
        this.register(new MockCryptoPaymentProvider());
    }
    register(provider) {
        this.providers.set(provider.slug, provider);
    }
    getProvider(slug) {
        return this.providers.get(slug);
    }
    listProviders() {
        return Array.from(this.providers.values());
    }
}
