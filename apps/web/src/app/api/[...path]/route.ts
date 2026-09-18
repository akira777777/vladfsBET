import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function apiOrigin(): string | null {
  const raw = (process.env.API_ORIGIN ?? "").trim().replace(/\/$/, "");
  const fallback = "http://127.0.0.1:4000";
  const origin = raw || fallback;
  try {
    const host = new URL(origin).hostname;
    const privateHost = host === "127.0.0.1" || host === "localhost";
    if (process.env.VERCEL && privateHost) return null;
    return origin;
  } catch {
    return process.env.VERCEL ? null : fallback;
  }
}

async function proxy(request: NextRequest, path: string[]) {
  const origin = apiOrigin();
  if (!origin) {
    return NextResponse.json(
      {
        error: "API_UNAVAILABLE",
        message: "Set API_ORIGIN to the public API URL (not localhost) for this deployment.",
      },
      { status: 502 },
    );
  }

  const target = `${origin}/api/${path.join("/")}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const out = new Headers(upstream.headers);
  out.delete("content-encoding");
  out.delete("transfer-encoding");
  out.delete("content-length");
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function POST(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function PUT(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function PATCH(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function DELETE(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function OPTIONS(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
