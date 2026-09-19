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
  const [ready, setReady] = useState(pathname === "/admin/login");

  useEffect(() => {
    if (pathname === "/admin/login") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- gating the staff gate on the login route
      setReady(true);
      return;
    }
    let active = true;
    api<{ admin: { email: string; name: string } }>("/api/admin/auth/me")
      .then((data) => {
        if (active) setAdminUser(data.admin);
      })
      .catch(() => {
        if (active) router.replace("/admin/login");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [pathname, router]);

  async function logout() {
    await api("/api/admin/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!ready || !adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070c] text-xs text-muted-foreground">
        Checking staff session…
      </div>
    );
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
            <Button variant="outline" size="sm" className="text-xs border-white/10" onClick={() => void logout()}>
              <LogOut className="h-3.5 w-3.5" />
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
