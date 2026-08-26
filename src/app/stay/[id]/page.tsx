import { formatInr, getPropertyById } from "@/data/properties";
import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getPropertyById(id);
  if (!property) notFound();

  return (
    <section className="container-page py-10">
      <p className="text-sm text-muted">Demo listing</p>
      <div className="mt-3 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="relative h-[320px] overflow-hidden rounded-2xl sm:h-[420px]">
            <Image src={property.image} alt={property.name} fill className="object-cover" priority />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-ink-soft">{property.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted">
            <MapPin className="h-4 w-4 text-brand" />
            {property.location}
          </p>
          <p className="mt-2 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-brand text-brand" />
            {property.rating.toFixed(1)} ({property.reviewCount} reviews)
          </p>
          <p className="mt-4 max-w-2xl text-muted">{property.description}</p>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xl font-bold">
            {formatInr(property.pricePerNight)} <span className="text-sm font-medium text-muted">/ night</span>
          </p>
          <p className="mt-2 text-sm text-muted">Booking is a frontend placeholder until payments go live.</p>
          <Link
            href={`/booking?stay=${property.id}`}
            className="mt-5 flex h-11 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Continue to booking
          </Link>
        </aside>
      </div>
    </section>
  );
}
