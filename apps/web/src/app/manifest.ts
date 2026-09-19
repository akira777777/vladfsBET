import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VladfsBET Casino & Sportsbook",
    short_name: "VladfsBET",
    description:
      "Full-scale online casino and sportsbook platform featuring provably fair originals, slots, table games, and double-entry ledger architecture.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#05070c",
    theme_color: "#05070c",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo-mark.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
    categories: ["games", "entertainment", "sports"],
  };
}
