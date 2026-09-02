"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Trophy, Radio, Gift, User, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/casino", label: "Casino", icon: Sparkles },
  { href: "/live-casino", label: "Live", icon: Radio },
  { href: "/sports", label: "Sports", icon: Trophy },
  { href: "/promotions", label: "Promos", icon: Gift },
  { href: "/account", label: "Account", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/10 bg-[#07080C]/95 backdrop-blur-lg px-2 lg:hidden">
      {NAV.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground transition-colors",
              isActive && "text-gold font-bold",
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-gold" : "text-muted-foreground")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
