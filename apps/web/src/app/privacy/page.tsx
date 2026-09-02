import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 text-white">
      <div className="space-y-2">
        <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-gold">Data Protection</span>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground">GDPR, CCPA & International Data Privacy Standards</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
          <p>
            When you register on VladfsBET, we collect personal identifiers such as your name, date of birth, email address, country of residence, IP address, and device information. If you undergo Know Your Customer (KYC) verification, we collect government-issued ID copies and utility bills solely for identity confirmation and anti-money laundering compliance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Lawful Basis for Processing</h2>
          <p>
            We process your personal information to provide gaming services, satisfy regulatory anti-money laundering (AML) requirements, prevent fraud and multi-accounting, secure player accounts, and enforce responsible gaming self-exclusions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Data Security & Storage</h2>
          <p>
            All sensitive information, including passwords and cryptographic session tokens, are encrypted and hashed using scrypt and SHA-256 algorithms. Data transmission is secured using TLS 1.3 encryption.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Player Rights</h2>
          <p>
            Under applicable data protection legislation (such as GDPR), you have the right to request access to your personal data, rectify inaccurate data, request erasure where legally permissible, or restrict processing. Contact <code className="text-gold">privacy@vladfsbet.com</code> to exercise your rights.
          </p>
        </section>
      </Card>
    </div>
  );
}
