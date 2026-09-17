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
      className="flex min-w-0 items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-2.5 py-1.5 transition-colors hover:bg-gold/10"
    >
      <span className="flex min-w-0 flex-col items-end">
        <span className="tabular text-sm font-semibold text-gold">
          {formatMoney(wallet.available, wallet.currency)}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <DemoBadge />
          <span className="hidden sm:inline">Wallet</span>
        </span>
      </span>
    </Link>
  );
}
