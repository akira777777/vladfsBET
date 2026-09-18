import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const originalVercel = process.env.VERCEL;
const originalApiOrigin = process.env.API_ORIGIN;

afterEach(() => {
  process.env.VERCEL = originalVercel;
  process.env.API_ORIGIN = originalApiOrigin;
});

describe("production API route", () => {
  it("serves the embedded API when the configured origin is loopback", async () => {
    process.env.VERCEL = "1";
    process.env.API_ORIGIN = "http://127.0.0.1:4000";

    const request = new NextRequest("https://example.test/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const response = await POST(request, {
      params: Promise.resolve({ path: ["auth", "register"] }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "INVALID_INPUT" });
  });
});
