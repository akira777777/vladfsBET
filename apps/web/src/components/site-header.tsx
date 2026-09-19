"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  Sparkles,
  Trophy,
  Radio,
  Gift,
  Crown,
  Flame,
  Package,
  ChevronDown,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/casino", label: "Casino", icon: Sparkles },
  { href: "/live-casino", label: "Live", icon: Radio },
  { href: "/sports", label: "Sports", icon: Trophy },
  { href: "/vip", label: "VIP", icon: Crown },
] as const;

const MORE_NAV = [
  { href: "/tournaments", label: "Tournaments", icon: Flame },
  { href: "/rewards", label: "Lucky Wheel", icon: Gift },
  { href: "/lootboxes", label: "Loot Boxes", icon: Package },
  { href: "/promotions", label: "Promotions", icon: Gift },
] as const;

function navActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const moreActive = MORE_NAV.some((item) => navActive(pathname, item.href));

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
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

        <nav className="hidden items-center gap-1 lg:flex ml-2">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = navActive(pathname, item.href);
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
          <MoreMenu pathname={pathname} active={moreActive} />
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

function MoreMenu({ pathname, active }: { pathname: string; active: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close the dropdown whenever the route changes.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:text-white hover:bg-white/5",
          (open || active) && "text-gold bg-gold/10 font-bold",
        )}
      >
        More
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-white/10 bg-popover p-1 shadow-xl"
        >
          {MORE_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-white",
                  isActive && "text-gold bg-gold/10",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
