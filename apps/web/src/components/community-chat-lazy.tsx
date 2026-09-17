"use client";

import dynamic from "next/dynamic";

export const CommunityChatLazy = dynamic(
  () => import("@/components/community-chat").then((mod) => mod.CommunityChat),
  { ssr: false },
);
