import { Headphones, ShieldCheck, CreditCard } from "lucide-react";
import type { ReactNode } from "react";

export function TrustSection() {
  return (
    <section className="bg-canvas py-12 lg:py-16">
      <div className="container-page">
        <div className="grid gap-6 md:grid-cols-3">
          <TrustCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Verified Stays"
            description="Properties reviewed for a better stay. We manually verify hosts and properties to ensure quality."
          />
          <TrustCard
            icon={<CreditCard className="h-6 w-6" />}
            title="Secure Booking"
            description="Safe and reliable booking experience. Your payments and personal information are protected."
          />
          <TrustCard
            icon={<Headphones className="h-6 w-6" />}
            title="24/7 Support"
            description="Help whenever you need it. Our dedicated team is available around the clock to assist you."
          />
        </div>
      </div>
    </section>
  );
}

function TrustCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center rounded-2xl bg-white p-8 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-ink-soft">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">
        {description}
      </p>
    </div>
  );
}
