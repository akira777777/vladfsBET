import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url().default('postgresql://vladfsbet:vladfsbet@127.0.0.1:5432/vladfsbet'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  // Secrets have no hard-coded default. A development-only fallback is applied
  // by getEnvConfig() below, and production refuses to start without real values.
  SESSION_SECRET: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  ENABLE_REAL_MONEY: z.coerce.boolean().default(false),
  PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),
});

export type EnvConfig = z.infer<typeof envSchema> & {
  SESSION_SECRET: string;
  JWT_SECRET: string;
};

const DEV_SECRETS = {
  session: 'vladfsbet-dev-session-key-not-for-production',
  jwt: 'vladfsbet-dev-jwt-key-not-for-production',
};

export function getEnvConfig(): EnvConfig {
  const parsed = envSchema.parse(process.env);

  // Fail fast in production instead of silently signing sessions/JWTs with
  // an insecure, well-known fallback key.
  if (parsed.NODE_ENV === 'production') {
    const missing: string[] = [];
    if (!parsed.SESSION_SECRET) missing.push('SESSION_SECRET');
    if (!parsed.JWT_SECRET) missing.push('JWT_SECRET');
    if (missing.length > 0) {
      throw new Error(
        `[config] Missing required production secrets: ${missing.join(', ')}. ` +
          'Refusing to start with insecure development fallbacks.',
      );
    }
  }

  return {
    ...parsed,
    SESSION_SECRET: parsed.SESSION_SECRET ?? DEV_SECRETS.session,
    JWT_SECRET: parsed.JWT_SECRET ?? DEV_SECRETS.jwt,
  };
}

export const PLATFORM_INFO = {
  name: 'VladfsBET',
  tagline: 'Premium Online Gaming & Sportsbook',
  minGamblingAge: 18,
  defaultCurrency: 'USD',
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BRL', 'JPY', 'USDT'] as const,
  brandColors: {
    darkBackground: '#0a0d14',
    cardBackground: '#121824',
    goldAccent: '#d4af37',
    electricBlue: '#00d2ff',
    neonPurple: '#9d4edd',
  },
} as const;
