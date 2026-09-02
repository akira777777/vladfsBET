import { z } from 'zod';
export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().url().default('postgresql://vladfsbet:vladfsbet_dev@127.0.0.1:5432/vladfsbet'),
    REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
    SESSION_SECRET: z.string().default('vladfsbet-super-secret-session-key-must-be-changed-in-prod'),
    JWT_SECRET: z.string().default('vladfsbet-super-secret-jwt-key-must-be-changed-in-prod'),
    ENABLE_REAL_MONEY: z.coerce.boolean().default(false),
    PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
    API_URL: z.string().default('http://localhost:4000'),
});
export function getEnvConfig() {
    return envSchema.parse(process.env);
}
export const PLATFORM_INFO = {
    name: 'VladfsBET',
    tagline: 'Premium Online Gaming & Sportsbook',
    minGamblingAge: 18,
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BRL', 'JPY', 'USDT'],
    brandColors: {
        darkBackground: '#0a0d14',
        cardBackground: '#121824',
        goldAccent: '#d4af37',
        electricBlue: '#00d2ff',
        neonPurple: '#9d4edd',
    },
};
