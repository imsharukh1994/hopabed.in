"use client";

import { type SearchProperty } from "@/lib/api";
import { Heart, Star, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "./WishlistProvider";

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";

export function PropertyCard({ property }: { property: SearchProperty }) {
  const { has, toggle } = useWishlist();
  const saved = has(property.id);

  return (
    <article className="group min-w-[280px] snap-start flex flex-col gap-3 lg:min-w-0">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-canvas shadow-sm transition-all duration-300 group-hover:shadow-md">
        <Link href={`/properties/${property.id}`} className="block h-full">
          <Image
            src={property.primaryImage || FALLBACK_IMAGE}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 80vw, 280px"
          />
        </Link>
        
        {/* Verified Badge */}
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-soft shadow-sm backdrop-blur-sm">
          <ShieldCheck className="h-3 w-3 text-brand" />
          Verified
        </span>

        <button
          type="button"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink-soft shadow-sm transition-transform hover:scale-110"
          aria-label={saved ? `Remove ${property.title} from wishlist` : `Save ${property.title} to wishlist`}
          onClick={() => toggle(property.id)}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-brand text-brand" : ""}`} />
        </button>
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/properties/${property.id}`} className="font-bold leading-5 text-ink-soft line-clamp-1">
            {property.title}
          </Link>
          <p className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink-soft">
            <Star className="h-3.5 w-3.5 fill-brand text-brand" />
            {property.rating ? property.rating.toFixed(1) : "New"}
          </p>
        </div>
        <p className="mt-0.5 text-sm text-muted">{property.locality}, {property.city}</p>
        <p className="mt-1 text-sm font-bold text-ink-soft">
          {formatInr(property.pricePerNight)} <span className="font-medium text-muted">/ night</span>
        </p>
      </div>
    </article>
  );
}
