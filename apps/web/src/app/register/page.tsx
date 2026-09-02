"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    country: "ZZ",
    currency: "EUR",
    termsAccepted: false,
    privacyAccepted: false,
    rgAcknowledged: false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await refresh();
      router.push("/casino");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0A0E17] lg:grid-cols-2 my-10 mx-4 lg:mx-auto">
      <div className="relative hidden min-h-[420px] lg:block">
        <Image src="/games/gates-of-vladfs.jpg" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        <p className="absolute bottom-8 left-8 right-8 font-heading text-2xl font-bold text-white">
          1,000 virtual credits on signup. Not withdrawable.
        </p>
      </div>
      <div className="px-6 py-12 sm:px-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Create a demo account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You must be 18 or older. You will receive 1,000 virtual credits. They cannot be withdrawn.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            First name
            <Input className="mt-1 h-11" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </label>
          <label className="block text-sm">
            Last name
            <Input className="mt-1 h-11" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </label>
        </div>
        <label className="block text-sm">
          Email
          <Input className="mt-1 h-11" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className="block text-sm">
          Password
          <Input className="mt-1 h-11" type="password" minLength={10} required value={form.password} onChange={(e) => set("password", e.target.value)} />
        </label>
        <label className="block text-sm">
          Date of birth
          <Input className="mt-1 h-11" type="date" required value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={form.termsAccepted} onChange={(e) => set("termsAccepted", e.target.checked)} />
          I accept the terms of use
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={form.privacyAccepted} onChange={(e) => set("privacyAccepted", e.target.checked)} />
          I accept the privacy notice
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={form.rgAcknowledged} onChange={(e) => set("rgAcknowledged", e.target.checked)} />
          I understand this is gambling, even in demo, and I can set play limits
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" variant="gold" className="h-11 w-full" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Already registered? <Link href="/login" className="text-live">Log in</Link>
      </p>
      </div>
    </div>
  );
}
