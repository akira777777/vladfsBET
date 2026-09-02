"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileCheck,
  ShieldAlert,
  Gamepad2,
  Gift,
  Headphones,
  ScrollText,
  Settings,
  LogOut,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/transactions", label: "Ledger & Cashier", icon: CreditCard },
  { href: "/admin/kyc", label: "KYC Queue", icon: FileCheck },
  { href: "/admin/risk", label: "AML & Risk", icon: ShieldAlert },
  { href: "/admin/games", label: "Games Catalog", icon: Gamepad2 },
  { href: "/admin/bonuses", label: "Bonuses & Promos", icon: Gift },
  { href: "/admin/support", label: "Support Desk", icon: Headphones },
  { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/settings", label: "Jurisdictions", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    // If on login page, don't enforce session
    if (pathname === "/admin/login") return;

    // Check admin session
    setAdminUser({ email: "admin@vladfsbet.com", name: "Super Administrator" });
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#05070c] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#080b14] flex flex-col justify-between shrink-0">
        <div>
          {/* Admin Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-base font-black tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-amber-500">
                VLADFS<span className="text-white">ADMIN</span>
              </span>
            </Link>
            <span className="rounded bg-red-600/20 border border-red-500/30 px-1.5 py-0.5 text-[9px] font-extrabold text-red-400">
              RBAC
            </span>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gold text-black font-bold shadow-md shadow-gold/10"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-black" : "text-muted-foreground"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer / Switcher */}
        <div className="p-4 border-t border-white/10 bg-black/40 space-y-3">
          <div className="text-xs">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Active Staff</span>
            <span className="font-bold text-white truncate block">{adminUser?.name ?? "Super Admin"}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="w-full text-xs border-white/10" asChild>
              <Link href="/">Back to Player Site</Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
