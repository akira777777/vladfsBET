"use client";

import { useState } from "react";
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
}

export function ProvablyFairDialog({
  serverSeedHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  clientSeed = "vladfs_player_seed_9824",
  nonce = 1,
}: ProvablyFairDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-gold/30 text-xs text-gold hover:bg-gold/10">
          🛡️ Provably Fair
        </Button>
      </DialogTrigger>
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
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Server Seed Hash (SHA256)</span>
            <p className="font-mono break-all text-emerald-400">{serverSeedHash}</p>
          </div>

          <div className="rounded-lg bg-black/40 p-3 ring-1 ring-white/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Client Seed</span>
            <p className="font-mono break-all text-blue-400">{clientSeed}</p>
          </div>

          <div className="rounded-lg bg-black/40 p-3 ring-1 ring-white/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Nonce</span>
            <p className="font-mono text-amber-400">{nonce}</p>
          </div>

          <div className="rounded-lg bg-white/5 p-3 text-[11px] text-muted-foreground">
            <strong className="text-white block mb-1">How it works:</strong>
            1. The server generates a random server seed and sends you the SHA-256 hash before the bet.<br/>
            2. Your client seed and round nonce are combined: <code className="text-gold">HMAC_SHA256(serverSeed, clientSeed + &quot;:&quot; + nonce)</code>.<br/>
            3. The first 32 bits of the hash determine the exact mathematical game outcome.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
