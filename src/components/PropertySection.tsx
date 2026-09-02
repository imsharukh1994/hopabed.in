"use client";

import { properties } from "@/data/properties";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PropertyCard } from "./PropertyCard";

export function PropertySection() {
  return (
    <section className="container-page py-10 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Recommended</p>
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink-soft sm:text-3xl">Top places to stay</h2>
        </div>
        <Link href="/stays" className="text-sm font-semibold text-brand transition hover:text-brand-dark">
          View all →
        </Link>
      </div>
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x lg:grid lg:grid-cols-4 lg:overflow-visible">
          {properties.slice(0, 4).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        <Link
          href="/stays"
          className="absolute -right-3 top-1/3 hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-md transition hover:shadow-lg lg:flex"
          aria-label="See more stays"
        >
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted">Demo listings for preview only — not live Hopebed partners.</p>
    </section>
  );
}
