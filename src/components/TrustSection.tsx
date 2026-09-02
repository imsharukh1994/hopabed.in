import { Headphones, Lock, ShieldCheck, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FEATURES: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Verified Properties",
    description: "Listings are checked for quality & safety",
    icon: ShieldCheck,
  },
  {
    title: "Secure Booking",
    description: "Your payments are protected",
    icon: Lock,
  },
  {
    title: "24/7 Support",
    description: "We're here anytime you need us",
    icon: Headphones,
  },
  {
    title: "Best Price Guarantee",
    description: "Get the best available deals on Hopebed",
    icon: Tag,
  },
];

export function TrustFeature({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-semibold text-ink-soft">{title}</h3>
        <p className="mt-0.5 text-sm leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}

export function TrustSection() {
  return (
    <section className="bg-mint/80 py-10 sm:py-12">
      <div className="container-page">
        <div className="mb-7 text-center sm:text-left">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Why travelers choose us</p>
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink-soft sm:text-3xl">Travel with confidence</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <TrustFeature key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
