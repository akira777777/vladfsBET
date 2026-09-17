import type { MiddlewareHandler } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { timeout } from "hono/timeout";
import { HTTPException } from "hono/http-exception";

/**
 * Security headers middleware configured for VladfsBET iGaming platform
 */
export const platformSecureHeaders = secureHeaders({
  xFrameOptions: "SAMEORIGIN",
  xContentTypeOptions: "nosniff",
  xXssProtection: "0",
  referrerPolicy: "strict-origin-when-cross-origin",
  crossOriginResourcePolicy: "same-site",
});

/**
 * Body size limiter for standard JSON API requests (128 KB)
 * Prevents memory exhaustion attacks via oversized JSON bodies.
 */
export const defaultBodyLimit = bodyLimit({
  maxSize: 128 * 1024, // 128 KB
  onError: (c) => {
    return c.json(
      {
        error: "PAYLOAD_TOO_LARGE",
        message: "Request payload exceeds 128KB limit.",
      },
      413,
    );
  },
});

/**
 * Body size limiter for KYC document uploads (4 MB, below serverless platform limits)
 */
export const kycUploadBodyLimit = bodyLimit({
  maxSize: 4 * 1024 * 1024,
  onError: (c) => {
    return c.json(
      {
        error: "PAYLOAD_TOO_LARGE",
        message: "KYC document exceeds 4MB limit.",
      },
      413,
    );
  },
});

/**
 * Adaptive body limit middleware: applies 4MB to KYC uploads, 128KB to all other endpoints
 */
export const adaptiveBodyLimit: MiddlewareHandler = async (c, next) => {
  // Only apply body limit to requests with a payload
  const method = c.req.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  if (c.req.path === "/api/kyc/upload") {
    return kycUploadBodyLimit(c, next);
  }

  return defaultBodyLimit(c, next);
};

/**
 * Request timeout middleware (15 seconds)
 * Mitigates Slowloris and connection starvation attacks
 */
export const requestTimeout = timeout(15_000, (c) => {
  return new HTTPException(504, {
    res: c.json(
      {
        error: "REQUEST_TIMEOUT",
        message: "Request timed out after 15 seconds.",
      },
      504,
    ),
  });
});
