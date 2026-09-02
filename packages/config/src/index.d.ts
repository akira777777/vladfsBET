import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodDefault<z.ZodString>;
    REDIS_URL: z.ZodDefault<z.ZodString>;
    SESSION_SECRET: z.ZodDefault<z.ZodString>;
    JWT_SECRET: z.ZodDefault<z.ZodString>;
    ENABLE_REAL_MONEY: z.ZodDefault<z.ZodBoolean>;
    PUBLIC_APP_URL: z.ZodDefault<z.ZodString>;
    API_URL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    SESSION_SECRET: string;
    JWT_SECRET: string;
    ENABLE_REAL_MONEY: boolean;
    PUBLIC_APP_URL: string;
    API_URL: string;
}, {
    NODE_ENV?: "development" | "test" | "production" | undefined;
    PORT?: number | undefined;
    DATABASE_URL?: string | undefined;
    REDIS_URL?: string | undefined;
    SESSION_SECRET?: string | undefined;
    JWT_SECRET?: string | undefined;
    ENABLE_REAL_MONEY?: boolean | undefined;
    PUBLIC_APP_URL?: string | undefined;
    API_URL?: string | undefined;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare function getEnvConfig(): EnvConfig;
export declare const PLATFORM_INFO: {
    readonly name: "VladfsBET";
    readonly tagline: "Premium Online Gaming & Sportsbook";
    readonly minGamblingAge: 18;
    readonly defaultCurrency: "USD";
    readonly supportedCurrencies: readonly ["USD", "EUR", "GBP", "CAD", "AUD", "BRL", "JPY", "USDT"];
    readonly brandColors: {
        readonly darkBackground: "#0a0d14";
        readonly cardBackground: "#121824";
        readonly goldAccent: "#d4af37";
        readonly electricBlue: "#00d2ff";
        readonly neonPurple: "#9d4edd";
    };
};
