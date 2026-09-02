"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Mail, MessageSquare, Headphones, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("Please log in to submit a support ticket.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      await api("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject,
          category,
          priority,
          message,
        }),
      });
      setSuccess(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 text-white">
      <div className="space-y-3 text-center">
        <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-gold">24/7 Assistance</span>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">Customer Support & Help Desk</h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          Our specialized gaming support team is available around the clock to assist you with inquiries, account management, and limits.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Contact Info Cards */}
        <div className="space-y-4 lg:col-span-5">
          <Card className="border-white/10 bg-[#0A0E17] p-5 text-white space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">24/7 Live Support</h3>
                <p className="text-xs text-muted-foreground">Average response under 2 minutes</p>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-[#0A0E17] p-5 text-white space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Direct Email</h3>
                <p className="text-xs font-mono text-gold">support@vladfsbet.com</p>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-[#0A0E17] p-5 text-white space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Compliance & KYC Desk</h3>
                <p className="text-xs font-mono text-gold">compliance@vladfsbet.com</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Support Ticket Submission Form */}
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white lg:col-span-7">
          <h2 className="text-base font-bold text-white mb-1">Open a Support Ticket</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Fill out the form below to receive a direct response in your account ticket center.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Subject</label>
              <Input
                type="text"
                placeholder="Brief summary of your inquiry"
                value={subject}
                required
                onChange={(e) => setSubject(e.target.value)}
                className="h-10 text-xs bg-black/40 border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-white/10 bg-black/40 px-3 text-xs text-white"
                >
                  <option value="GENERAL">General Inquiry</option>
                  <option value="WALLET">Wallet & Payments</option>
                  <option value="GAMES">Games & Fair RNG</option>
                  <option value="KYC">KYC Verification</option>
                  <option value="RESPONSIBLE_GAMING">Responsible Gaming</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "LOW" | "NORMAL" | "HIGH" | "URGENT")}
                  className="w-full h-10 rounded-md border border-white/10 bg-black/40 px-3 text-xs text-white"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Message</label>
              <textarea
                rows={4}
                placeholder="Describe your issue or question in detail..."
                value={message}
                required
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Ticket submitted successfully! You can track staff replies in your Account Center.</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-gold via-yellow-500 to-amber-600 text-black font-bold text-xs hover:brightness-110 shadow"
            >
              {submitting ? "Submitting Ticket..." : "Submit Support Ticket"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
