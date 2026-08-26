"use client";

import { formatInr, type Property } from "@/data/properties";
import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "./WishlistProvider";

export function PropertyCard({ property }: { property: Property }) {
  const { has, toggle } = useWishlist();
  const saved = has(property.id);

  return (
    <article className="min-w-[260px] snap-start overflow-hidden rounded-2xl border border-border bg-white shadow-[0_6px_18px_rgba(7,16,12,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(7,16,12,0.1)] lg:min-w-0">
      <div className="relative h-[188px]">
        <Link href={`/stay/${property.id}`} className="block h-full">
          <Image
            src={property.image}
            alt={property.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 280px"
          />
        </Link>
        {property.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-ink-soft">
            {property.badge}
          </span>
        ) : null}
        <button
          type="button"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink-soft"
          aria-label={saved ? `Remove ${property.name} from wishlist` : `Save ${property.name} to wishlist`}
          onClick={() => toggle(property.id)}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-brand text-brand" : ""}`} />
        </button>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/stay/${property.id}`} className="font-semibold leading-5 text-ink-soft">
            {property.name}
          </Link>
          <p className="flex shrink-0 items-center gap-1 text-sm text-ink-soft">
            <Star className="h-3.5 w-3.5 fill-brand text-brand" />
            {property.rating.toFixed(1)} ({property.reviewCount})
          </p>
        </div>
        <p className="mt-1 text-sm text-muted">{property.location}</p>
        <p className="mt-2 text-sm font-bold text-ink-soft">
          {formatInr(property.pricePerNight)} <span className="font-medium text-muted">/ night</span>
        </p>
      </div>
    </article>
  );
}
