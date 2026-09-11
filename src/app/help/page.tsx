import Link from "next/link";
import { HelpCircle, Calendar, CreditCard, ShieldCheck, RefreshCw, MessageSquare, Building2, FileText, CheckCircle2 } from "lucide-react";

export default function HelpCenterPage() {
  return (
    <div className="bg-canvas min-h-screen py-12">
      <div className="container-page max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            <HelpCircle className="h-3.5 w-3.5" /> Support Center
          </span>
          <h1 className="mt-3 text-3xl font-bold text-ink-soft sm:text-4xl">How can we help you today?</h1>
          <p className="mt-2 text-sm text-muted">Find quick answers for guest bookings, payments, and property owner support.</p>
        </div>

        {/* Guest Support Section */}
        <div className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-ink-soft flex items-center gap-2 border-b border-border pb-3">
            <Calendar className="h-5 w-5 text-brand" /> Guest Support & Bookings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <HelpCard
              icon={<Calendar className="h-5 w-5 text-brand" />}
              title="Booking Help"
              description="How to search stays, select dates, choose room options, and confirm your reservation."
            />
            <HelpCard
              icon={<CreditCard className="h-5 w-5 text-brand" />}
              title="Payment Help"
              description="Supported payment methods via PayU including UPI, Credit/Debit cards, and Net Banking."
            />
            <HelpCard
              icon={<RefreshCw className="h-5 w-5 text-brand" />}
              title="Cancellation & Refunds"
              description="Instant online cancellation. Refund processing timelines and policy guidelines."
              linkHref="/cancellation"
              linkLabel="View Policy"
            />
            <HelpCard
              icon={<ShieldCheck className="h-5 w-5 text-brand" />}
              title="Digital Stay Pass"
              description="Access your QR Stay Pass after booking confirmation for instant front-desk check-in."
            />
            <HelpCard
              icon={<MessageSquare className="h-5 w-5 text-brand" />}
              title="Contact Support"
              description="Need direct help with an existing reservation? Get in touch with our 24/7 team."
              linkHref="/contact"
              linkLabel="Reach Support"
            />
          </div>
        </div>

        {/* Owner Support Section */}
        <div>
          <h2 className="mb-6 text-xl font-bold text-ink-soft flex items-center gap-2 border-b border-border pb-3">
            <Building2 className="h-5 w-5 text-brand" /> Property Owner Support
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <HelpCard
              icon={<Building2 className="h-5 w-5 text-brand" />}
              title="List Your Property"
              description="Learn how to list your Hotel, PG, Hostel, Villa, or Homestay on Hopebed in minutes."
              linkHref="/host/resources"
              linkLabel="Host Guide"
            />
            <HelpCard
              icon={<FileText className="h-5 w-5 text-brand" />}
              title="Owner & Property Verification"
              description="Government ID (Aadhaar/PAN) and Property Documents required to obtain the Verified Badge."
              linkHref="/host/resources"
              linkLabel="Verification Guide"
            />
            <HelpCard
              icon={<CheckCircle2 className="h-5 w-5 text-brand" />}
              title="Admin Approval & Going Live"
              description="How the Hopebed admin team verifies your submission before publishing your stay live."
              linkHref="/host/pricing"
              linkLabel="View Details"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpCard({
  icon,
  title,
  description,
  linkHref,
  linkLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-ink-soft">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
      {linkHref && linkLabel ? (
        <Link href={linkHref} className="mt-4 inline-block text-xs font-semibold text-brand hover:underline">
          {linkLabel} &rarr;
        </Link>
      ) : null}
    </div>
  );
}
