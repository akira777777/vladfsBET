import type { MetadataRoute } from "next";
import {
  LIVE_SLUGS,
  ORIGINALS_SLUGS,
  SLOT_SLUGS,
  TABLE_SLUGS,
} from "@/lib/games-catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.PUBLIC_APP_URL || "https://vladfsbet.com";
  const now = new Date();

  const staticPages = [
    "",
    "/casino",
    "/live-casino",
    "/sports",
    "/promotions",
    "/vip",
    "/tournaments",
    "/lootboxes",
    "/rewards",
    "/provably-fair",
    "/affiliates",
    "/about",
    "/faq",
    "/contact",
    "/responsible-gaming",
    "/terms",
    "/privacy",
    "/cookies",
    "/aml-policy",
    "/kyc-policy",
  ];

  const allSlugs = Array.from(
    new Set([
      ...ORIGINALS_SLUGS,
      ...SLOT_SLUGS,
      ...TABLE_SLUGS,
      ...LIVE_SLUGS,
    ]),
  );

  const entries: MetadataRoute.Sitemap = [
    ...staticPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: (path === "" || path === "/casino" ? "daily" : "weekly") as "daily" | "weekly",
      priority: path === "" ? 1.0 : path === "/casino" ? 0.9 : 0.7,
    })),
    ...allSlugs.map((slug) => ({
      url: `${baseUrl}/casino/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  return entries;
}
