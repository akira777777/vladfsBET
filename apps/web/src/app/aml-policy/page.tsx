import { Card } from "@/components/ui/card";

export default function AmlPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 text-white">
      <div className="space-y-2">
        <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-gold">Regulatory Compliance</span>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Anti-Money Laundering (AML) Policy</h1>
        <p className="text-xs text-muted-foreground">Comprehensive Framework for Prevention of Financial Crimes</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Policy Statement</h2>
          <p>
            VladfsBET maintains a zero-tolerance policy towards money laundering, terrorist financing, and illicit financial activities. Our platform adheres to the Financial Action Task Force (FATF) recommendations and EU Anti-Money Laundering Directives.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Automated Transaction Monitoring</h2>
          <p>
            Our core engine actively monitors deposit velocity, rapid turnaround of funds without wagering, large single transactions exceeding €5,000, and multi-accounting anomalies. Suspicious patterns trigger automated AML alerts and mandatory manual compliance review.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Source of Funds & Sanctions Screening</h2>
          <p>
            Accounts exhibiting irregular volume or high-risk indicators are subject to Source of Wealth (SoW) verification and screening against international PEP (Politically Exposed Persons) and global sanctions databases.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Reporting Obligations</h2>
          <p>
            Where reasonable grounds for suspicious activity exist, reports are filed with competent Financial Intelligence Units (FIU) in accordance with statutory duties, without notifying the subject individual (anti-tipping-off rules).
          </p>
        </section>
      </Card>
    </div>
  );
}
