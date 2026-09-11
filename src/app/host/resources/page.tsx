import Link from "next/link";
import { ShieldCheck, ArrowRight, Building2, FileCheck, Layers, DollarSign } from "lucide-react";

export default function HostResourcesPage() {
  return (
    <div className="bg-canvas min-h-screen py-12">
      <div className="container-page max-w-4xl">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
            <Building2 className="h-3.5 w-3.5" /> Host Knowledge Base
          </span>
          <h1 className="mt-3 text-3xl font-bold text-ink-soft sm:text-4xl">Host Resources & Listing Guide</h1>
          <p className="mt-2 text-sm text-muted">Everything you need to know about listing, verifying, and hosting on Hopebed.</p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <ResourceSection
            icon={<Building2 className="h-5 w-5 text-brand" />}
            step="Step 1"
            title="How to List Your Property"
            content="Clicking 'List Your Property' automatically creates your first property draft. You can specify whether your stay is a Hotel, PG/Hostel, Homestay, Villa, or Apartment."
          />

          {/* Step 2 */}
          <ResourceSection
            icon={<Layers className="h-5 w-5 text-brand" />}
            step="Step 2"
            title="Required Information"
            content="Provide property title, full address, locality, property description, primary & secondary photos, room types (or bed options for PGs), base price per night, and guest amenities."
          />

          {/* Step 3 */}
          <ResourceSection
            icon={<FileCheck className="h-5 w-5 text-brand" />}
            step="Step 3"
            title="Owner & Property Verification Process"
            content="To ensure guest trust and obtain the Verified Property badge, complete Government ID (Aadhaar or Passport/Voter ID), PAN verification, and upload ownership proof or operator authorization documents."
          />

          {/* Step 4 */}
          <ResourceSection
            icon={<ShieldCheck className="h-5 w-5 text-brand" />}
            step="Step 4"
            title="Admin Approval & Going Live"
            content="Once submitted, the Hopebed verification team reviews your identity, documents, and listing accuracy. Upon approval, your property status automatically becomes LIVE and visible in public searches."
          />

          {/* Step 5 */}
          <ResourceSection
            icon={<DollarSign className="h-5 w-5 text-brand" />}
            step="Step 5"
            title="Managing Rooms, Pricing & Bookings"
            content="Manage room inventory, night pricing, and blocked dates from your Host Dashboard. Confirmed bookings will generate instant Digital Stay Passes for guest check-in."
          />
        </div>

        <div className="mt-12 rounded-2xl bg-brand p-8 text-center text-white shadow-lg">
          <h2 className="text-2xl font-bold">Ready to welcome your first guests?</h2>
          <p className="mt-2 text-sm text-white/80">List your property today and get verified on India&apos;s trusted stay marketplace.</p>
          <Link
            href="/host"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-brand transition hover:bg-canvas"
          >
            Start Property Onboarding <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ResourceSection({
  icon,
  step,
  title,
  content,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint">{icon}</div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">{step}</span>
          <h3 className="text-lg font-bold text-ink-soft">{title}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted pl-13">{content}</p>
    </div>
  );
}
