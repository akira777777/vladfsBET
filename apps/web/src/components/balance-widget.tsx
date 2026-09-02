"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { DemoBadge } from "@/components/demo-badge";
import { formatMoney } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function BalanceWidget() {
  const { ready, user, wallet } = useAuth();

  if (!ready) {
    return <Skeleton className="h-10 w-36" />;
  }

  if (!user || !wallet) {
    return null;
  }

  return (
    <Link
      href="/wallet"
      className="flex min-w-0 flex-col items-end rounded-lg px-2 py-1 transition-colors hover:bg-white/5"
    >
      <span className="tabular text-sm font-medium text-gold">
        {formatMoney(wallet.available, wallet.currency)}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <DemoBadge />
        <span>credits</span>
      </span>
    </Link>
  );
}
