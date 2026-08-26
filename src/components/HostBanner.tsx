import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HOST_IMAGE =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80";

export function HostBanner() {
  return (
    <section className="container-page py-12">
      <div className="grid overflow-hidden rounded-[24px] bg-mint lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
          <h2 className="text-3xl font-bold leading-tight text-ink-soft sm:text-4xl">
            List your property with Hopebed
          </h2>
          <p className="mt-3 max-w-md text-muted">Reach guests and grow your earnings.</p>
          <Link
            href="/host"
            className="mt-6 inline-flex w-fit rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Become a Host
          </Link>
        </div>
        <div className="relative min-h-[240px]">
          <Image src={HOST_IMAGE} alt="Premium property for hosting" fill className="object-cover" sizes="50vw" />
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-md">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <p className="text-sm text-ink-soft">
              Start earning with <span className="font-semibold">Hopebed</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
