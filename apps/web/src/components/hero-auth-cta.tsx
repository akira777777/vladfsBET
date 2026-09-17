"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

export function HeroAuthCta() {
  const { user } = useAuth();

  return (
    <Button
      size="lg"
      variant="outline"
      className="h-12 px-8 text-base border-white/20 bg-black/40 text-white font-bold backdrop-blur-sm hover:bg-white/10"
      asChild
    >
      <Link href={user ? "/wallet" : "/register"}>{user ? "Cashier" : "Create demo account"}</Link>
    </Button>
  );
}
