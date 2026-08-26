import { PropertyCard } from "@/components/PropertyCard";
import { SearchBar } from "@/components/SearchBar";
import { properties } from "@/data/properties";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; checkIn?: string; checkOut?: string; guests?: string; rooms?: string }>;
}) {
  const params = await searchParams;
  const query = (params.destination ?? "").trim().toLowerCase();
  const results = query
    ? properties.filter(
        (property) =>
          property.name.toLowerCase().includes(query) ||
          property.location.toLowerCase().includes(query) ||
          property.city.toLowerCase().includes(query) ||
          property.state.toLowerCase().includes(query) ||
          property.type.toLowerCase().includes(query),
      )
    : properties;

  return (
    <section className="bg-canvas pb-12">
      <div className="container-page py-8">
        <SearchBar defaultDestination={params.destination ?? ""} />
        <h1 className="mt-8 text-2xl font-bold text-ink-soft">Search results</h1>
        <p className="mt-1 text-sm text-muted">
          {query ? `Showing demo stays matching “${params.destination}”.` : "Showing demo stays. Connect search to the Hopebed API for live availability."}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        {results.length === 0 ? <p className="mt-8 text-muted">No matching demo stays. Try another destination.</p> : null}
      </div>
    </section>
  );
}
