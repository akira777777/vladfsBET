"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";

export function OriginalsShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-card/80 px-3 py-2.5 backdrop-blur-md">
        <Link
          href="/casino"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-gold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Lobby
        </Link>
        {title ? (
          <h1 className="font-heading text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h1>
        ) : null}
        <DemoBadge />
      </div>
      {children}
    </div>
  );
}
