"use client";

import { useState } from "react";
import { Bell, Check, Trash2, X, Gift, ShieldCheck, Trophy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "BONUS" | "SECURITY" | "TOURNAMENT" | "WALLET";
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Weekly VIP Cashback Ready",
    message: "Your Gold Tier weekly cashback of $125.00 has been credited to your bonus balance.",
    timestamp: "10m ago",
    type: "BONUS",
    read: false,
  },
  {
    id: "notif-2",
    title: "Tournament Position Alert",
    message: "You climbed to Rank #3 in the $25,000 Gates of Vladfs Grand Sprint!",
    timestamp: "45m ago",
    type: "TOURNAMENT",
    read: false,
  },
  {
    id: "notif-3",
    title: "Sandbox Deposit Confirmed",
    message: "Demo credits faucet +$500.00 successfully posted to your ledger balance.",
    timestamp: "2h ago",
    type: "WALLET",
    read: true,
  },
  {
    id: "notif-4",
    title: "KYC Tier 1 Approved",
    message: "Your identity verification was reviewed and verified by staff compliance.",
    timestamp: "1d ago",
    type: "SECURITY",
    read: true,
  },
];

export function NotificationsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "BONUS":
        return <Gift className="h-4 w-4 text-purple-400" />;
      case "TOURNAMENT":
        return <Trophy className="h-4 w-4 text-gold" />;
      case "WALLET":
        return <Wallet className="h-4 w-4 text-emerald-400" />;
      case "SECURITY":
        return <ShieldCheck className="h-4 w-4 text-cyan-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-black text-black">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-gold/20 text-gold px-2 py-0.5 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-muted-foreground hover:text-white px-2 py-1"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="text-muted-foreground hover:text-red-400 p-1"
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No notifications right now.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl p-3 border transition-colors ${
                      n.read
                        ? "bg-white/[0.02] border-white/5 opacity-70"
                        : "bg-white/[0.05] border-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 rounded-lg bg-black/40 p-1.5 border border-white/5 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white truncate">{n.title}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
