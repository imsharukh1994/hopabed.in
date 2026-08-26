"use client";

import { PropertyCard } from "@/components/PropertyCard";
import { useWishlist } from "@/components/WishlistProvider";
import { properties } from "@/data/properties";
import Link from "next/link";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const saved = properties.filter((property) => ids.includes(property.id));

  return (
    <section className="container-page py-10">
      <h1 className="text-3xl font-bold text-ink-soft">Wishlist</h1>
      <p className="mt-2 text-sm text-muted">Saved locally on this device until accounts are connected.</p>
      {saved.length === 0 ? (
        <div className="mt-8">
          <p className="text-muted">No saved stays yet.</p>
          <Link href="/stays" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            Browse stays
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </section>
  );
}
