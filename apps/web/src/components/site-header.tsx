"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BalanceWidget } from "@/components/balance-widget";
import { DemoBadge } from "@/components/demo-badge";
import { SearchDialog } from "@/components/search-dialog";
import { NotificationsDrawer } from "@/components/notifications-drawer";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Trophy, Radio, Gift, Crown, Flame, Package } from "lucide-react";

const NAV = [
  { href: "/casino", label: "Casino", icon: Sparkles },
  { href: "/live-casino", label: "Live", icon: Radio },
  { href: "/sports", label: "Sports", icon: Trophy },
  { href: "/tournaments", label: "Tournaments", icon: Flame },
  { href: "/rewards", label: "Lucky Wheel", icon: Gift },
  { href: "/lootboxes", label: "Loot Boxes", icon: Package },
  { href: "/vip", label: "VIP", icon: Crown },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#07080C]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <Image
            src="/logo-mark.jpg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-md ring-1 ring-gold/30"
          />
          <span className="font-heading text-lg font-black tracking-[0.16em] text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-amber-500 group-hover:brightness-110 transition-all">
            VLADFSBET
          </span>
          <DemoBadge className="hidden sm:inline-flex" />
        </Link>

        <nav className="hidden items-center gap-1 xl:flex ml-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:text-white hover:bg-white/5",
                  isActive && "text-gold bg-gold/10 font-bold",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-gold" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchDialog />
          {user ? <NotificationsDrawer /> : null}
          <BalanceWidget />

          {ready && !user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" variant="gold" className="text-xs" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          ) : null}

          {user ? (
            <Button variant="outline" size="sm" className="border-white/10 text-xs gap-1.5" asChild>
              <Link href="/account">
                <span className="truncate max-w-[120px]">{user.email.split("@")[0]}</span>
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
