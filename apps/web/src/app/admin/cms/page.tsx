"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Globe, Sparkles, Check, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type CmsEntry = {
  id: string;
  type: string;
  slug: string;
  locale: string;
  title: string;
  body: any;
  published: boolean;
  updatedAt?: string;
};

export default function AdminCmsPage() {
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "banner",
    slug: "",
    subtitle: "",
    ctaText: "",
    ctaUrl: "",
    badge: "",
    published: true,
  });

  const loadEntries = () => {
    setLoading(true);
    api<{ items: CmsEntry[] }>("/api/admin/cms")
      .then((data) => setEntries(data.items || []))
      .catch(() => {
        // Fallback to public entries if staff endpoint returned empty
        api<{ items: CmsEntry[] }>("/api/cms/entries")
          .then((pub) => setEntries(pub.items || []))
          .catch(() => setEntries([]));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      type: form.type,
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      title: form.title.trim(),
      locale: "en",
      published: form.published,
      body: {
        subtitle: form.subtitle,
        ctaText: form.ctaText,
        ctaUrl: form.ctaUrl,
        badge: form.badge,
      },
    };

    try {
      await api("/api/admin/cms", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("CMS entry created and published successfully!");
      setShowModal(false);
      setForm({
        title: "",
        type: "banner",
        slug: "",
        subtitle: "",
        ctaText: "",
        ctaUrl: "",
        badge: "",
        published: true,
      });
      loadEntries();
    } catch (err: any) {
      setMessage(err.message || "Failed to save CMS entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this CMS entry?")) return;
    try {
      await api(`/api/admin/cms/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("Failed to delete entry");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Content Management System (CMS)</h1>
          <p className="text-xs text-muted-foreground">
            Manage dynamic homepage banners, promotions, platform announcements, and marketing content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadEntries}
            className="border-white/10 text-xs"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={() => setShowModal(true)}
            className="text-xs font-bold"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create Content Block
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-gold flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <Card className="border-white/10 bg-[#0A0E17] p-0 text-white overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5">Title & Subtitle</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Slug</th>
                <th className="p-3.5">Target CTA</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading content entries…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No CMS entries found. Create the first promotional banner above!
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        {entry.title}
                        {entry.body?.badge && (
                          <span className="rounded bg-gold/20 border border-gold/30 px-1.5 py-0.5 text-[9px] font-bold text-gold">
                            {entry.body.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                        {entry.body?.subtitle || "—"}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono uppercase text-white/80">
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground">{entry.slug}</td>
                    <td className="p-3.5">
                      {entry.body?.ctaText ? (
                        <div className="text-[11px]">
                          <span className="text-white font-medium">{entry.body.ctaText}</span>
                          <span className="text-muted-foreground ml-1 font-mono">({entry.body.ctaUrl})</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {entry.published ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <Check className="h-3 w-3" /> PUBLISHED
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
                          DRAFT
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c121e] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-gold" />
                Create CMS Content Block
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-white/90">Content Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-gold outline-none"
                  >
                    <option value="banner">Hero / Promotional Banner</option>
                    <option value="announcement">Top Bar Announcement</option>
                    <option value="faq">FAQ Entry</option>
                    <option value="promo">Promo Offer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-white/90">Identifier Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. gates-mega-spin"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-gold outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-white/90">Main Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10,000x Gates of Vladfs Tournament"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-gold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-white/90">Subtitle / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Spin the reels to climb the multiplier leaderboard and share €50,000 in virtual credits"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-white/90">CTA Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Play Now"
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-gold outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-white/90">CTA Destination URL</label>
                  <input
                    type="text"
                    placeholder="e.g. /casino/gates-of-vladfs"
                    value={form.ctaUrl}
                    onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-gold outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-white/90">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. NEW RELEASE"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-gold outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="publish-check"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                    className="h-4 w-4 rounded accent-gold cursor-pointer"
                  />
                  <label htmlFor="publish-check" className="font-bold text-white cursor-pointer">
                    Publish immediately
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="border-white/10"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gold" size="sm" disabled={saving}>
                  {saving ? "Publishing…" : "Save & Publish"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
