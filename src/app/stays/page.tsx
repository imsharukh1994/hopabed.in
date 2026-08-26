import { PropertyCard } from "@/components/PropertyCard";
import { properties } from "@/data/properties";
import { stayTypes } from "@/data/stayTypes";

export default async function StaysPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const filtered = type ? properties.filter((property) => property.type === type) : properties;
  const heading = stayTypes.find((item) => item.id === type)?.title ?? "Stays";

  return (
    <section className="container-page py-10">
      <h1 className="text-3xl font-bold text-ink-soft">{heading}</h1>
      <p className="mt-2 text-sm text-muted">Demo listings for preview. Live inventory will come from the Hopebed API.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
      {filtered.length === 0 ? <p className="mt-8 text-muted">No demo stays in this category yet.</p> : null}
    </section>
  );
}
