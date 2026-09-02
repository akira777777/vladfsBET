export type User = {
  id: string;
  email: string;
  country: string;
  currency: string;
  status: string;
  kycStatus: string;
  realMoneyEligible: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    city?: string;
  } | null;
  vipTier?: {
    name: string;
    slug: string;
    points: string;
    rank: number;
    cashbackBps: number;
  };
};

export type Wallet = {
  walletId: string;
  currency: string;
  status: string;
  available: string;
  bonus: string;
  locked: string;
  pending: string;
};

export type Game = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  provider: string;
  description?: string | null;
  rtpBps?: number | null;
  volatility?: string | null;
  minBet?: string | null;
  maxBet?: string | null;
  tags?: string[];
  demo: boolean;
};

export type Transaction = {
  id: string;
  type: string;
  status: string;
  currency: string;
  amount: string;
  createdAt: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers,
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T & { error?: string; message?: string }) : ({} as T);
  if (!response.ok) {
    const body = data as { error?: string; message?: string };
    throw new ApiError(response.status, body.error ?? "ERROR", body.message ?? "Request failed");
  }
  return data;
}
