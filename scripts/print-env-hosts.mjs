const keys = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_HOST",
  "API_ORIGIN",
  "API_URL",
  "PUBLIC_APP_URL",
  "REDIS_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
];

for (const key of keys) {
  const value = process.env[key];
  if (!value || value === "[SENSITIVE]") {
    console.log(`${key}=missing`);
    continue;
  }
  try {
    const url = new URL(value);
    console.log(`${key}=${url.protocol}//${url.host}${url.pathname}`);
  } catch {
    const local = /127\.0\.0\.1|localhost/.test(value);
    console.log(`${key}=${local ? "local" : "set"}`);
  }
}
