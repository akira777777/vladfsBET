import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 text-white">
      <div className="space-y-2">
        <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-gold">Legal Framework</span>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Terms and Conditions</h1>
        <p className="text-xs text-muted-foreground">Last updated: September 2026</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Introduction & Acceptance</h2>
          <p>
            By registering an account with VladfsBET, accessing our software, or participating in any games or sportsbook events, you agree to be bound by these Terms and Conditions in full. If you disagree with any portion of these terms, you must immediately cease use of the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Eligibility & Age Verification</h2>
          <p>
            You must be at least 18 years of age (or the legal age of majority in your applicable jurisdiction, e.g., 21 in the United States) to create an account or participate in gameplay. Underage gambling is strictly prohibited and constitutes an offense. We reserve the right to request proof of age and identity documents at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Sandbox Demo Nature</h2>
          <p>
            VladfsBET is operating in a sandbox demonstration environment. All currencies and balances represent virtual demonstration credits with no real-world monetary value. No real money can be deposited or withdrawn until formal licensing and certification are concluded.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Account Security & Prohibited Activities</h2>
          <p>
            Players are solely responsible for maintaining the confidentiality of their login credentials. The creation of multiple accounts by a single individual, collusive behavior, automated bot usage, exploitation of software vulnerabilities, and bonus abuse are strictly prohibited and result in immediate account termination.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">5. Responsible Gaming</h2>
          <p>
            We provide comprehensive self-service responsible gaming controls including deposit limits, loss limits, wager limits, session duration alerts, cooling-off periods, and self-exclusion. Self-exclusion requests are enforced immediately and unconditionally.
          </p>
        </section>
      </Card>
    </div>
  );
}
