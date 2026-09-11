import Link from "next/link";
import { DollarSign, ShieldCheck, CreditCard, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function HostPricingPage() {
  return (
    <div className="bg-canvas min-h-screen py-12">
      <div className="container-page max-w-4xl">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
            <DollarSign className="h-3.5 w-3.5" /> Host Pricing Policy
          </span>
          <h1 className="mt-3 text-3xl font-bold text-ink-soft sm:text-4xl">Host Pricing & Payout Overview</h1>
          <p className="mt-2 text-sm text-muted">Clear, transparent hosting terms for property owners on Hopebed.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <PricingCard
            icon={<DollarSign className="h-6 w-6 text-brand" />}
            title="Free Property Listing"
            description="Listing your Hotel, PG, Hostel, Villa, or Homestay on Hopebed is 100% free. No upfront listing fees or hidden subscription charges."
          />
          <PricingCard
            icon={<CreditCard className="h-6 w-6 text-brand" />}
            title="Secure Booking Payments"
            description="Guest payments are securely processed through PayU (supporting UPI, Debit/Credit Cards, and Net Banking)."
          />
          <PricingCard
            icon={<Clock className="h-6 w-6 text-brand" />}
            title="Payout Timelines"
            description="Host payouts are processed post-check-in verification. Official commission structure and detailed payout schedule parameters are currently being finalized."
          />
          <PricingCard
            icon={<ShieldCheck className="h-6 w-6 text-brand" />}
            title="Verified Stay Passes"
            description="Every confirmed reservation generates a digital QR Stay Pass to ensure verified guest entry and prevent unauthorized check-ins."
          />
        </div>

        {/* Note on Commission */}
        <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h3 className="font-bold text-ink-soft">Commission Structure</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Detailed commission percentage terms and formal financial agreement terms will be displayed directly inside your Host Dashboard prior to publishing live listings.
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/host"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Go to Host Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-mint">{icon}</div>
      <h3 className="text-lg font-bold text-ink-soft">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
