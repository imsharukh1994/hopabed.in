"use client";

import { createBooking, getPropertyDetails, type PropertyDetails } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useState } from "react";

export default function BookingPage() {
  return <Suspense fallback={<main className="container-page py-16"><div className="h-80 animate-pulse rounded-2xl bg-mint" /></main>}><BookingContent /></Suspense>;
}

function BookingContent() {
  const query = useSearchParams();
  const router = useRouter();
  const propertyId = query.get("property") ?? "";
  const roomId = query.get("room") ?? "";
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (propertyId) getPropertyDetails(propertyId).then(setProperty).catch((reason: Error) => setError(reason.message)); }, [propertyId]);
  const room = property?.rooms.find((item) => item.id === roomId);
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); setError(null); try { const booking = await createBooking({ propertyId, roomId, checkIn, checkOut, guests }); router.push(`/bookings?created=${String(booking._id)}`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Booking failed."); } finally { setSaving(false); } }
  if (!property || !room) return <main className="container-page py-16"><p className="text-muted">{error ?? "Loading booking details..."}</p></main>;
  return <main className="container-page py-12"><Link href={`/stay/${property.id}`} className="text-sm font-semibold text-brand">← Back to property</Link><div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]"><form onSubmit={submit} className="rounded-2xl border border-border bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold text-ink-soft">Complete your booking</h1><p className="mt-2 text-muted">{property.title} · {room.name}</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Check-in<input required type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-2 w-full rounded-xl border border-border px-3 py-2.5" /></label><label className="text-sm font-medium">Check-out<input required type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-2 w-full rounded-xl border border-border px-3 py-2.5" /></label></div><label className="mt-4 block text-sm font-medium">Guests<input required min={1} max={room.capacity} type="number" value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-border px-3 py-2.5" /></label>{error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}<button disabled={saving} className="mt-8 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Creating booking..." : "Create booking"}</button></form><aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm"><p className="text-sm text-muted">Price from</p><p className="mt-2 text-2xl font-bold text-ink-soft">₹{room.pricePerNight.toLocaleString("en-IN")} <span className="text-sm font-normal text-muted">/ night</span></p><p className="mt-4 rounded-xl bg-mint p-3 text-sm text-ink-soft">Booking created — payment pending. Final price is calculated securely by Hopebed.</p></aside></div></main>;
}
