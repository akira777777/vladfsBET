"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Headphones, MessageSquare, Send, CheckCircle2 } from "lucide-react";

interface AdminTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { email: string };
  messages: {
    id: string;
    authorType: string;
    body: string;
    internal: boolean;
    createdAt: string;
  }[];
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    api<{ items: AdminTicket[] }>("/api/admin/support/tickets")
      .then((data) => {
        setTickets(data.items || []);
        if (selectedTicket) {
          const fresh = data.items?.find((t) => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyBody) return;
    setSending(true);

    try {
      await api(`/api/admin/support/tickets/${selectedTicket.id}/message`, {
        method: "POST",
        body: JSON.stringify({ body: replyBody, internal: isInternal }),
      });
      setReplyBody("");
      fetchTickets();
    } catch (err: any) {
      alert(err.message || "Failed to send response");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Customer Support & Help Desk Console</h1>
        <p className="text-xs text-muted-foreground">Manage incoming player tickets, respond to inquiries, and leave internal staff notes</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Ticket List */}
        <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl lg:col-span-5">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gold">Open Support Queue</span>
            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-bold text-gold">
              {tickets.length}
            </span>
          </div>

          <div className="divide-y divide-white/5 max-h-[580px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading tickets…</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No support tickets found.</div>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`w-full text-left p-4 transition-colors hover:bg-white/5 ${
                    selectedTicket?.id === t.id ? "bg-white/10 border-l-2 border-gold" : ""
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white truncate max-w-[180px]">{t.user?.email}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === "URGENT" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{t.subject}</h4>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                    <span className="rounded bg-black/40 px-1.5 py-0.5">{t.category}</span>
                    <span>{new Date(t.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Ticket Chat & Details */}
        <Card className="flex flex-col justify-between border-white/10 bg-[#0A0E17] p-6 text-white shadow-xl lg:col-span-7 min-h-[580px]">
          {selectedTicket ? (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
                    <p className="text-xs text-muted-foreground">
                      Player: <strong className="text-gold">{selectedTicket.user?.email}</strong> • Category: {selectedTicket.category}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-xs font-bold">
                    {selectedTicket.status}
                  </span>
                </div>

                {/* Messages Stream */}
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
                  {selectedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl p-3.5 text-xs space-y-1 ${
                        m.internal
                          ? "bg-amber-950/30 border border-amber-500/30 text-amber-200"
                          : m.authorType === "ADMIN"
                          ? "bg-blue-950/40 border border-blue-500/30 text-white ml-6"
                          : "bg-black/50 border border-white/10 text-white mr-6"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span className="font-bold uppercase tracking-wider">
                          {m.internal ? "🔒 Internal Staff Note" : m.authorType === "ADMIN" ? "Staff Response" : "Player"}
                        </span>
                        <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="border-t border-white/10 pt-4 mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="accent-gold"
                    />
                    <span>Post as internal note only (hidden from player)</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={isInternal ? "Add internal compliance note..." : "Type reply to player..."}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="h-10 text-xs bg-black/40 border-white/10 flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !replyBody}
                    className="h-10 bg-gold text-black font-bold text-xs hover:bg-gold/90 shrink-0"
                  >
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Select a support ticket from the queue to view messages and reply.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
