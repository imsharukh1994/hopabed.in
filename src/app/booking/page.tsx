import { formatInr, getPropertyById, properties } from "@/data/properties";
import Link from "next/link";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ stay?: string }>;
}) {
  const { stay } = await searchParams;
  const property = stay ? getPropertyById(stay) : properties[0];

  return (
    <section className="container-page py-12">
      <h1 className="text-3xl font-bold text-ink-soft">Booking</h1>
      <p className="mt-2 max-w-xl text-muted">
        Guest checkout and availability will connect to the Hopebed booking API. This page is a frontend placeholder.
      </p>
      {property ? (
        <div className="mt-8 max-w-lg rounded-2xl border border-border p-5">
          <p className="text-sm text-muted">Selected stay</p>
          <p className="mt-1 font-semibold">{property.name}</p>
          <p className="text-sm text-muted">{property.location}</p>
          <p className="mt-2 font-bold">{formatInr(property.pricePerNight)} / night</p>
          <Link
            href={`/payment?stay=${property.id}`}
            className="mt-5 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            Continue to payment
          </Link>
        </div>
      ) : null}
    </section>
  );
}
