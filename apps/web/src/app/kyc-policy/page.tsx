import { Card } from "@/components/ui/card";

export default function KycPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 text-white">
      <div className="space-y-2">
        <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-gold">Identity Verification</span>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Know Your Customer (KYC) Policy</h1>
        <p className="text-xs text-muted-foreground">Guidelines for Player Verification & Document Submissions</p>
      </div>

      <Card className="border-white/10 bg-[#0A0E17] p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Overview of KYC</h2>
          <p>
            Know Your Customer (KYC) procedures verify player identity, protect accounts against identity theft, ensure compliance with age restrictions, and maintain financial integrity.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Required Verification Documents</h2>
          <div className="space-y-3 pl-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Proof of Identity (PoI):</h3>
              <p className="text-xs text-muted-foreground">Valid Passport, National Identity Card, or Government Driver’s License showing full name, photograph, date of birth, and valid expiration date.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Proof of Address (PoA):</h3>
              <p className="text-xs text-muted-foreground">Utility bill (electricity, water, gas) or bank statement issued within the last 3 months displaying your full registered name and address.</p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Review Timelines</h2>
          <p>
            Uploaded verification documents are reviewed by our compliance officers within 24 hours. You can track your KYC case status in real time under your Account Center.
          </p>
        </section>
      </Card>
    </div>
  );
}
