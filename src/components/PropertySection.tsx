"use client";

import { properties } from "@/data/properties";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PropertyCard } from "./PropertyCard";

export function PropertySection() {
  return (
    <section className="container-page border-t border-border/70 py-12 sm:py-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Recommended</p>
          <h2 className="text-2xl font-bold text-ink-soft sm:text-3xl">Preview places to stay</h2>
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
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-brand/20 bg-mint px-3.5 py-3 text-xs text-ink-soft">
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden />
        Preview listings only. Verified partner inventory will appear here when live booking launches.
      </div>
    </section>
  );
}
