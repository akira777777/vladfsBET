import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/8 bg-[#04060A] py-12 text-sm text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 space-y-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 space-y-3">
            <span className="font-heading text-base font-black tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-400 to-amber-500">
              VLADFSBET
            </span>
            <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-sm">
              Demo casino and sportsbook. Virtual credits only. Provably fair originals, double-entry ledger, and player-protection tools — not a licensed real-money operator.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="rounded bg-red-600/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-extrabold text-red-400">
                18+ ONLY
              </span>
              <span className="rounded bg-gold/10 border border-gold/30 px-2 py-0.5 text-[10px] font-bold text-gold">
                PROVABLY FAIR
              </span>
              <span className="rounded bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                SANDBOX DEMO
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Gaming</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/casino" className="hover:text-gold transition-colors">Casino Lobby</Link></li>
              <li><Link href="/casino?category=ORIGINALS" className="hover:text-gold transition-colors">Originals</Link></li>
              <li><Link href="/live-casino" className="hover:text-gold transition-colors">Live Casino</Link></li>
              <li><Link href="/sports" className="hover:text-gold transition-colors">Sportsbook</Link></li>
              <li><Link href="/promotions" className="hover:text-gold transition-colors">Promotions</Link></li>
              <li><Link href="/vip" className="hover:text-gold transition-colors">VIP Club</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Protection</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/responsible-gaming" className="hover:text-gold transition-colors">Responsible Gaming</Link></li>
              <li><Link href="/provably-fair" className="hover:text-gold transition-colors">Provably Fair</Link></li>
              <li><Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-gold transition-colors">Cookie Preferences</Link></li>
              <li><Link href="/aml-policy" className="hover:text-gold transition-colors">AML Policy</Link></li>
              <li><Link href="/kyc-policy" className="hover:text-gold transition-colors">KYC Policy</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Support</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/about" className="hover:text-gold transition-colors">About</Link></li>
              <li><Link href="/faq" className="hover:text-gold transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
              <li><Link href="/account" className="hover:text-gold transition-colors">Account</Link></li>
              <li><Link href="/wallet" className="hover:text-gold transition-colors">Cashier</Link></li>
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/40 p-4 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ShieldAlert className="h-4 w-4 text-gold" />
            <span>Responsible Gaming</span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground/80">
            Gambling can be addictive. Play with virtual credits only in this demonstration environment. Underage gambling is prohibited. Help: BeGambleAware (www.begambleaware.org) or GamCare (www.gamcare.org.uk).
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60 border-t border-white/5 pt-6">
          <p>© 2026 VladfsBET. Virtual credits. Not real money.</p>
          <p>HMAC-SHA256 provably fair originals.</p>
        </div>
      </div>
    </footer>
  );
}
