"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProvablyFairDialogProps {
  serverSeedHash?: string;
  clientSeed?: string;
  nonce?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ProvablyFairDialog({
  serverSeedHash,
  clientSeed = "vladfs_player_seed_9824",
  nonce = 1,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: ProvablyFairDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const displayHash = serverSeedHash || "Active session seed chain committed (revealed upon round execution)";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-gold/30 text-xs text-gold hover:bg-gold/10">
            🛡️ Provably Fair
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-md border-white/10 bg-[#0d111a] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gold">
            <span>🛡️</span> Provably Fair Cryptographic Verification
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Every game round outcome is calculated using HMAC-SHA256 based on predetermined server and client seeds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          <div className="rounded-lg bg-black/40 p-3 ring-1 ring-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Server Seed Hash (SHA256)</span>
              {serverSeedHash && (
                <button
                  type="button"
                  onClick={() => handleCopy(serverSeedHash, "hash")}
                  className="text-[10px] text-muted-foreground hover:text-white flex items-center gap-1"
                >
                  {copied === "hash" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copied === "hash" ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            <p className="font-mono break-all text-emerald-400">{displayHash}</p>
          </div>

          <div className="rounded-lg bg-black/40 p-3 ring-1 ring-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Client Seed</span>
              <button
                type="button"
                onClick={() => handleCopy(clientSeed, "client")}
                className="text-[10px] text-muted-foreground hover:text-white flex items-center gap-1"
              >
                {copied === "client" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied === "client" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="font-mono break-all text-blue-400">{clientSeed}</p>
          </div>

          <div className="rounded-lg bg-black/40 p-3 ring-1 ring-white/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Round Nonce</span>
            <p className="font-mono text-amber-400">{nonce}</p>
          </div>

          <div className="rounded-lg bg-white/5 p-3 text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-white block mb-1">How it works:</strong>
            1. The server generates a secret server seed and commits the SHA-256 hash before your bet.<br />
            2. Your client seed and round nonce are combined: <code className="text-gold font-mono">HMAC_SHA256(serverSeed, clientSeed + &quot;:&quot; + nonce)</code>.<br />
            3. The hash outputs deterministic mathematical game outcomes that neither the player nor house can manipulate.
          </div>

          <div className="pt-1">
            <Link
              href="/provably-fair"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-gold/10 border border-gold/30 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/20 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Independent Cryptographic Verifier
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
