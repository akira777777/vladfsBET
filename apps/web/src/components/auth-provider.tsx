"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, onWalletUpdate, type User, type Wallet } from "@/lib/api";

type AuthState = {
  ready: boolean;
  user: User | null;
  wallet: Wallet | null;
  refresh: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  applyWallet: (next: Wallet) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await api<{ user: User }>("/api/auth/me");
      setUser(me.user);
    } catch {
      setUser(null);
      setWallet(null);
      return;
    }
    try {
      const snapshot = await api<{ wallet: Wallet | null }>("/api/wallet");
      setWallet(snapshot.wallet);
    } catch {
      // Keep the signed-in user even if the wallet snapshot fails.
    }
  }, []);

  const applyWallet = useCallback((next: Wallet) => {
    setWallet(next);
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setWallet(null);
  }, []);

  useEffect(() => {
    let active = true;
    const initAuth = async () => {
      try {
        const me = await api<{ user: User }>("/api/auth/me");
        if (active) setUser(me.user);
        const snapshot = await api<{ wallet: Wallet | null }>("/api/wallet");
        if (active) setWallet(snapshot.wallet);
      } catch {
        if (active) {
          setUser(null);
          setWallet(null);
        }
      } finally {
        if (active) setReady(true);
      }
    };

    void initAuth();
    const stopWallet = onWalletUpdate((next) => {
      if (active) setWallet(next);
    });

    return () => {
      active = false;
      stopWallet();
    };
  }, []);

  const value = useMemo(
    () => ({ ready, user, wallet, refresh, refreshWallet: refresh, applyWallet, logout }),
    [ready, user, wallet, refresh, applyWallet, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
