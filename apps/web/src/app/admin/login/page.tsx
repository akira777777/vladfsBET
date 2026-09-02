"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Lock, Shield, Key } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@vladfsbet.com");
  const [password, setPassword] = useState("Admin123456!");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await api("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/admin");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid administrator credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070c] p-4 text-white">
      <Card className="w-full max-w-md border-white/10 bg-[#0A0E17] p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold mb-2 ring-1 ring-gold/30">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-white">VladfsBET Staff Portal</h1>
          <p className="text-xs text-muted-foreground">Restricted Administrative & Compliance Console</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Admin Email</label>
            <Input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-xs bg-black/40 border-white/10 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Master Password</label>
            <Input
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 text-xs bg-black/40 border-white/10"
            />
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold hover:brightness-110 shadow-lg shadow-gold/20"
          >
            {loading ? "Authenticating..." : "Sign in to Admin Console"}
          </Button>
        </form>

        <div className="rounded-lg bg-black/40 p-3 text-[11px] text-muted-foreground text-center">
          Demo Admin Credentials: <code className="text-gold">admin@vladfsbet.com</code> / <code className="text-gold">Admin123456!</code>
        </div>
      </Card>
    </div>
  );
}
