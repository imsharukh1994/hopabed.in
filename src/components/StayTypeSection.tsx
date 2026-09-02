import { stayTypes } from "@/data/stayTypes";
import { Building2, Home, Hotel, Palmtree, Warehouse } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  hotels: Hotel,
  villas: Warehouse,
  apartments: Building2,
  resorts: Palmtree,
  homestays: Home,
};

export function StayTypeCard({
  id,
  title,
  description,
  image,
  href,
}: {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}) {
  const Icon = ICONS[id] ?? Home;

  return (
    <Link
      href={href}
      className="min-w-[220px] snap-start overflow-hidden rounded-2xl border border-border bg-white shadow-[0_6px_18px_rgba(7,16,12,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(7,16,12,0.1)] lg:min-w-0"
    >
      <div className="relative h-[150px]">
        <Image src={image} alt={title} fill className="object-cover" sizes="240px" />
        <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-md">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-ink-soft">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
      </div>
    </Link>
  );
}

export function StayTypeSection() {
  return (
    <section className="container-page pb-6 pt-10 sm:pt-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Stay types</p>
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink-soft sm:text-3xl">Browse by stay type</h2>
        </div>
        <Link href="/stays" className="text-sm font-semibold text-brand transition hover:text-brand-dark">
          View all →
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5">
        {stayTypes.map((type) => (
          <StayTypeCard key={type.id} {...type} />
        ))}
      </div>
    </section>
  );
}
