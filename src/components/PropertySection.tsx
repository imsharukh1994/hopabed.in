"use client";

import { properties } from "@/data/properties";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PropertyCard } from "./PropertyCard";

export function PropertySection() {
  return (
    <section className="container-page py-10">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-ink-soft">Top places to stay</h2>
        <Link href="/stays" className="text-sm font-medium text-brand">
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
          className="absolute -right-3 top-1/3 hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-md lg:flex"
          aria-label="See more stays"
        >
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>
      </div>
      <p className="mt-3 text-xs text-muted">Demo listings for preview only — not live Hopebed partners.</p>
    </section>
  );
}
