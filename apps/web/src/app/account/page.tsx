"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { DemoBadge } from "@/components/demo-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import {
  User,
  Shield,
  FileCheck,
  Smartphone,
  Key,
  Headphones,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface UserSession {
  id: string;
  ip: string;
  userAgent: string;
  lastSeenAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface KycDocumentItem {
  id: string;
  type: string;
  status: string;
  storageKey: string;
}

interface PlayerTicketItem {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  updatedAt: string;
  messages: { id: string; authorType: string; body: string; createdAt: string }[];
}

export default function AccountPage() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"PROFILE" | "SECURITY" | "SESSIONS" | "KYC" | "SUPPORT">("PROFILE");

  // Profile Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password Change State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Sessions State
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);

  // KYC State
  const [kycDocs, setKycDocs] = useState<KycDocumentItem[]>([]);
  const [docType, setDocType] = useState<"PASSPORT" | "NATIONAL_ID" | "DRIVERS_LICENSE" | "UTILITY_BILL">("PASSPORT");
  const [docName, setDocName] = useState("");
  const [kycMsg, setKycMsg] = useState<string | null>(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);

  // Support Tickets State
  const [tickets, setTickets] = useState<PlayerTicketItem[]>([]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load sessions
    api<{ sessions: UserSession[] }>("/api/auth/sessions")
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {});

    // Load KYC case
    api<{ kycCase: { documents: KycDocumentItem[] } }>("/api/kyc/case")
      .then((data) => setKycDocs(data.kycCase?.documents || []))
      .catch(() => {});

    // Load Tickets
    api<{ items: PlayerTicketItem[] }>("/api/support/tickets")
      .then((data) => setTickets(data.items || []))
      .catch(() => {});
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await api("/api/auth/profile", {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, city }),
      });
      setProfileMsg("Personal details updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    setPassError(null);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setPassMsg("Password successfully changed!");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPassError(err.message || "Failed to change password");
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await api("/api/auth/sessions/revoke-others", { method: "POST" });
      setSessionMsg("All other active device sessions revoked!");
      const data = await api<{ sessions: UserSession[] }>("/api/auth/sessions");
      setSessions(data.sessions || []);
    } catch (err: any) {
      alert(err.message || "Failed to revoke sessions");
    }
  };

  const handleUploadKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;
    setUploadingKyc(true);
    setKycMsg(null);

    try {
      await api("/api/kyc/upload", {
        method: "POST",
        body: JSON.stringify({ type: docType, fileName: docName }),
      });
      setKycMsg("Document uploaded for compliance review!");
      setDocName("");
      const data = await api<{ kycCase: { documents: KycDocumentItem[] } }>("/api/kyc/case");
      setKycDocs(data.kycCase?.documents || []);
    } catch (err: any) {
      alert(err.message || "Failed to upload document");
    } finally {
      setUploadingKyc(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setCreatingTicket(true);

    try {
      await api("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: ticketSubject,
          category: "GENERAL",
          priority: "NORMAL",
          message: ticketMessage,
        }),
      });
      setTicketSubject("");
      setTicketMessage("");
      const data = await api<{ items: PlayerTicketItem[] }>("/api/support/tickets");
      setTickets(data.items || []);
    } catch (err: any) {
      alert(err.message || "Failed to create ticket");
    } finally {
      setCreatingTicket(false);
    }
  };

  if (!ready) {
    return <div className="px-4 py-16 text-sm text-muted-foreground text-center">Loading account…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold text-white">Player Account Center</h1>
        <p className="text-sm text-muted-foreground">Sign in to manage your profile, security, and verification.</p>
        <Button size="lg" className="bg-gold text-black font-bold" asChild>
          <Link href="/login">Sign in to Continue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-white">
      {/* Top Profile Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center font-black text-xl border border-gold/30">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{user.email}</h1>
              <DemoBadge />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Country: <strong className="uppercase text-white">{user.country}</strong> • Currency: <strong className="uppercase text-gold">{user.currency}</strong> • KYC: <strong className="text-emerald-400">{user.kycStatus}</strong>
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="border-white/10 text-xs gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" /> Log Out
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "PROFILE" as const, label: "Profile", icon: User },
          { id: "SECURITY" as const, label: "Security & Passwords", icon: Key },
          { id: "SESSIONS" as const, label: "Active Sessions", icon: Smartphone },
          { id: "KYC" as const, label: "KYC Verification", icon: FileCheck },
          { id: "SUPPORT" as const, label: "Support Tickets", icon: Headphones },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              size="sm"
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs gap-1.5 ${
                activeTab === tab.id
                  ? "bg-gold text-black font-bold"
                  : "border-white/10 text-muted-foreground hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "PROFILE" && (
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white max-w-xl space-y-4">
          <h2 className="text-base font-bold">Personal Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">First Name</label>
                <Input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-9 text-xs bg-black/40 border-white/10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                <Input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-9 text-xs bg-black/40 border-white/10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">City</label>
              <Input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9 text-xs bg-black/40 border-white/10"
              />
            </div>

            {profileMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{profileMsg}</span>
              </div>
            )}

            <Button type="submit" className="bg-gold text-black font-bold text-xs hover:bg-gold/90">
              Save Profile Details
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "SECURITY" && (
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white max-w-xl space-y-4">
          <h2 className="text-base font-bold">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Current Password</label>
              <Input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="h-9 text-xs bg-black/40 border-white/10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">New Password (min 10 characters)</label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 text-xs bg-black/40 border-white/10"
              />
            </div>

            {passError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">
                {passError}
              </div>
            )}

            {passMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{passMsg}</span>
              </div>
            )}

            <Button type="submit" className="bg-gold text-black font-bold text-xs hover:bg-gold/90">
              Update Password
            </Button>
          </form>
        </Card>
      )}

      {activeTab === "SESSIONS" && (
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Active Device Sessions</h2>
              <p className="text-xs text-muted-foreground">Manage your authenticated devices across desktop, tablet, and mobile browsers.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeOtherSessions}
              className="border-red-500/30 text-red-400 text-xs hover:bg-red-500/10"
            >
              Revoke All Other Sessions
            </Button>
          </div>

          {sessionMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{sessionMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`rounded-lg p-3 flex items-center justify-between text-xs ring-1 ${
                  s.isCurrent ? "bg-gold/10 ring-gold/40 border border-gold/20" : "bg-black/40 ring-white/5"
                }`}
              >
                <div>
                  <span className="font-bold text-white block">{s.userAgent}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">IP: {s.ip} • Last seen: {new Date(s.lastSeenAt).toLocaleString()}</span>
                </div>
                {s.isCurrent ? (
                  <span className="rounded bg-gold text-black font-extrabold px-2 py-0.5 text-[10px]">
                    CURRENT DEVICE
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[11px]">Active</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "KYC" && (
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white space-y-6">
          <div>
            <h2 className="text-base font-bold">Know Your Customer (KYC) Identity Verification</h2>
            <p className="text-xs text-muted-foreground">Upload your passport, national identity card, or proof of address to complete verification.</p>
          </div>

          <form onSubmit={handleUploadKyc} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full h-10 rounded-md border border-white/10 bg-black/40 px-3 text-xs text-white"
              >
                <option value="PASSPORT">Passport</option>
                <option value="NATIONAL_ID">National ID Card</option>
                <option value="DRIVERS_LICENSE">Driver’s License</option>
                <option value="UTILITY_BILL">Proof of Address / Utility Bill</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Document File Identifier</label>
              <Input
                type="text"
                placeholder="e.g. passport_scan_front.jpg"
                value={docName}
                required
                onChange={(e) => setDocName(e.target.value)}
                className="h-10 text-xs bg-black/40 border-white/10 font-mono"
              />
            </div>

            {kycMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{kycMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={uploadingKyc}
              className="bg-gold text-black font-bold text-xs hover:bg-gold/90"
            >
              {uploadingKyc ? "Uploading Document..." : "Submit Document for Verification"}
            </Button>
          </form>

          {/* Uploaded Documents List */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <span className="text-xs font-semibold text-muted-foreground">Uploaded Documents:</span>
            {kycDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No verification documents uploaded yet.</p>
            ) : (
              kycDocs.map((doc) => (
                <div key={doc.id} className="rounded-lg bg-black/40 p-3 ring-1 ring-white/5 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white block">{doc.type}</strong>
                    <span className="text-[10px] font-mono text-muted-foreground">{doc.storageKey}</span>
                  </div>
                  <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === "SUPPORT" && (
        <Card className="border-white/10 bg-[#0A0E17] p-6 text-white space-y-6">
          <div>
            <h2 className="text-base font-bold">Support Ticket Center</h2>
            <p className="text-xs text-muted-foreground">Open support requests and review replies directly from our compliance & support staff.</p>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Subject</label>
              <Input
                type="text"
                placeholder="Topic of your request"
                value={ticketSubject}
                required
                onChange={(e) => setTicketSubject(e.target.value)}
                className="h-10 text-xs bg-black/40 border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Message</label>
              <textarea
                rows={3}
                placeholder="Details of your inquiry..."
                value={ticketMessage}
                required
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 p-3 text-xs text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={creatingTicket}
              className="bg-gold text-black font-bold text-xs hover:bg-gold/90"
            >
              {creatingTicket ? "Opening Ticket..." : "Open Support Ticket"}
            </Button>
          </form>

          <div className="space-y-3 border-t border-white/10 pt-4">
            <span className="text-xs font-semibold text-muted-foreground">Your Ticket History:</span>
            {tickets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open tickets.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="rounded-lg bg-black/40 p-4 ring-1 ring-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">{t.subject}</strong>
                    <span className="rounded-full bg-blue-500/20 text-blue-400 px-2 py-0.5 text-[10px] font-bold">
                      {t.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 border-t border-white/5 pt-2">
                    {t.messages.map((m) => (
                      <div key={m.id} className="text-xs p-2 rounded bg-white/5 text-muted-foreground">
                        <span className="font-bold text-gold text-[10px] block">{m.authorType === "PLAYER" ? "You" : "Staff Support"}</span>
                        {m.body}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
