import { PropertyCard } from "@/components/PropertyCard";
import { API_BASE_URL, type SearchProperty } from "@/lib/api";
import { stayTypes } from "@/data/stayTypes";

export default async function StaysPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const heading = stayTypes.find((item) => item.id === type)?.title ?? "Stays";

  let properties: SearchProperty[] = [];
  let errorMsg: string | null = null;

  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const params = new URLSearchParams({
      checkIn: today.toISOString().split("T")[0],
      checkOut: tomorrow.toISOString().split("T")[0],
      guests: "1",
    });
    if (type) params.set("propertyType", type);

    const res = await fetch(`${API_BASE_URL}/api/properties/search?${params.toString()}`, { cache: "no-store" });
    const body = await res.json();

    if (res.ok && body.data?.properties) {
      properties = body.data.properties.map((p: Record<string, unknown>) => ({
        id: String(p._id),
        title: String(p.title),
        city: String(p.city),
        locality: String(p.locality),
        propertyType: String(p.propertyType),
        primaryImage: typeof p.primaryImage === "string" ? p.primaryImage : undefined,
        pricePerNight: Number(p.pricePerNight),
        rating: typeof p.rating === "number" ? p.rating : undefined,
        isVerified: Boolean(p.isVerified && p.verificationStatus === "VERIFIED"),
      }));
    }
  } catch {
    errorMsg = "Unable to load live inventory at the moment.";
  }

  return (
    <section className="container-page py-10">
      <h1 className="text-3xl font-bold text-ink-soft">{heading}</h1>
      <p className="mt-2 text-sm text-muted">Explore verified live stays on Hopebed.</p>

      {errorMsg ? (
        <p className="mt-6 text-sm text-red-600">{errorMsg}</p>
      ) : properties.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-white p-8 text-center">
          <p className="text-muted">No verified properties found in this category yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </section>
  );
}
