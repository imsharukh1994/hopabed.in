"use client";

import { SearchBar } from "@/components/SearchBar";
import { searchProperties, type SearchProperty } from "@/lib/api";
import { CheckCircle2, MapPin, Search, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useState } from "react";

export default function SearchPage() {
  return <Suspense fallback={<main className="container-page py-16"><div className="h-80 animate-pulse rounded-2xl bg-mint" /></main>}><SearchContent /></Suspense>;
}

function SearchContent() {
  const query = useSearchParams();
  const [results, setResults] = useState<SearchProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    ["destination", "checkIn", "checkOut", "guests"].forEach((key) => { const value = query.get(key); if (value) params.set(key, value); });
    if (!params.has("checkIn") || !params.has("checkOut")) { setLoading(false); setError("Choose check-in and check-out dates to search live availability."); return; }
    setLoading(true); setError(null);
    searchProperties(params).then(setResults).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [query]);

  return (
    <section className="bg-canvas pb-12">
      <div className="container-page py-8">
        <SearchBar defaultDestination={query.get("destination") ?? ""} />
        <h1 className="mt-8 text-2xl font-bold text-ink-soft">Search results</h1>
        {loading ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-white" />)}</div> : null}
        {!loading && error ? <div className="mt-6 rounded-2xl border border-border bg-white p-8 text-center"><Search className="mx-auto h-8 w-8 text-brand" /><p className="mt-3 text-muted">{error}</p></div> : null}
        {!loading && !error && results.length === 0 ? <p className="mt-8 text-center text-muted">No verified stays available for these dates.</p> : null}
        {!loading && !error ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map((property) => <PropertyResult key={property.id} property={property} />)}</div> : null}
      </div>
    </section>
  );
}

function PropertyResult({ property }: { property: SearchProperty }) {
  return <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-lg">
    <Link href={`/stay/${property.id}`} className="relative block h-52 bg-mint">
      {property.primaryImage ? <Image src={property.primaryImage} alt={property.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" /> : <div className="flex h-full items-center justify-center text-brand"><MapPin className="h-8 w-8" /></div>}
      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>
    </Link>
    <div className="p-4"><div className="flex items-start justify-between gap-2"><div><h2 className="font-semibold text-ink-soft">{property.title}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5" />{property.locality}, {property.city}</p></div>{property.rating ? <span className="flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-brand text-brand" />{property.rating.toFixed(1)}</span> : null}</div><p className="mt-4 text-lg font-bold text-ink-soft">₹{property.pricePerNight.toLocaleString("en-IN")}<span className="text-xs font-normal text-muted"> / night</span></p></div>
  </article>;
}
