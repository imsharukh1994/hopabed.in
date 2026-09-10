"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthModal } from "@/components/AuthProvider";
import { getPropertyDetails, createBooking, type PropertyDetails } from "@/lib/api";
import { Calendar, Users, ChevronRight, CheckCircle2, Loader2, Info } from "lucide-react";
import Image from "next/image";

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, openAuth } = useAuthModal();
  
  const propertyId = searchParams.get("property");
  const roomId = searchParams.get("room");

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<PropertyDetails["rooms"][0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!propertyId || !roomId) {
      setError("Invalid booking link.");
      setLoading(false);
      return;
    }

    getPropertyDetails(propertyId)
      .then((data) => {
        setProperty(data);
        const room = data.rooms.find(r => r.id === roomId);
        if (room) {
          setSelectedRoom(room);
        } else {
          setError("Room not found in this property.");
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [propertyId, roomId]);

  if (loading) return <main className="container-page py-16 text-center"><p className="text-muted">Loading booking details...</p></main>;
  if (error || !property || !selectedRoom) return <main className="container-page py-16 text-center"><p className="text-red-500">{error || "Something went wrong."}</p></main>;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuth();
      return;
    }
    
    setSubmitError("");
    setIsSubmitting(true);
    
    try {
      await createBooking({
        propertyId: property.id,
        roomId: selectedRoom.id,
        checkIn,
        checkOut,
        guests
      });
      router.push("/bookings");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message || "Failed to create booking.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate pricing
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  let nights = 0;
  if (checkIn && checkOut && checkOutDate > checkInDate) {
    nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  const subtotal = selectedRoom.pricePerNight * Math.max(nights, 1);
  const serviceFee = Math.round(subtotal * 0.05);
  const taxes = Math.round((subtotal + serviceFee) * 0.05);
  const total = subtotal + serviceFee + taxes;

  return (
    <main className="bg-canvas pb-16">
      <div className="container-page py-10">
        <div className="flex items-center gap-2 text-sm text-muted mb-6">
          <span>Search</span> <ChevronRight className="w-4 h-4" /> <span>{property.title}</span> <ChevronRight className="w-4 h-4" /> <span className="font-semibold text-ink-soft">Checkout</span>
        </div>
        
        <h1 className="mb-8 text-3xl font-bold text-ink-soft">Confirm your booking</h1>
        
        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          {/* Left Form Column */}
          <section>
            <form onSubmit={handleBooking} className="space-y-8">
              
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-ink-soft mb-4">Your trip</h2>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-soft">
                      <Calendar className="h-4 w-4" /> Check-in
                    </label>
                    <input 
                      type="date" 
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-ink-soft focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-soft">
                      <Calendar className="h-4 w-4" /> Check-out
                    </label>
                    <input 
                      type="date" 
                      required
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-ink-soft focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-soft">
                      <Users className="h-4 w-4" /> Guests
                    </label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      max={selectedRoom.capacity}
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-ink-soft focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-ink-soft mb-4">Payment rules</h2>
                <div className="flex gap-4 rounded-xl bg-blue-50 p-4 text-blue-800">
                  <Info className="h-6 w-6 flex-shrink-0" />
                  <p className="text-sm">By continuing, you agree to Hopebed&apos;s Terms of Service and Privacy Policy. The payment will be processed securely via PayU after booking creation.</p>
                </div>
              </div>
              
              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {submitError}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isSubmitting || !checkIn || !checkOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 font-bold text-white transition-all hover:bg-brand-dark disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  user ? "Confirm and proceed to payment" : "Log in to book"
                )}
              </button>
            </form>
          </section>
          
          {/* Right Summary Column */}
          <aside className="h-fit rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="relative h-48 bg-mint">
              {property.primaryImage && (
                <Image src={property.primaryImage} alt={property.title} fill className="object-cover" />
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand mb-2">
                <CheckCircle2 className="h-4 w-4" /> Verified
              </div>
              <h3 className="font-bold text-lg text-ink-soft">{property.title}</h3>
              <p className="text-muted text-sm">{property.locality}, {property.city}</p>
              
              <div className="my-6 border-t border-border"></div>
              
              <p className="font-semibold text-ink-soft mb-1">{selectedRoom.name}</p>
              <p className="text-sm text-muted">Up to {selectedRoom.capacity} guests</p>
              
              <div className="my-6 border-t border-border"></div>
              
              <h4 className="font-semibold text-ink-soft mb-4">Price details</h4>
              
              {nights > 0 ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>₹{selectedRoom.pricePerNight.toLocaleString("en-IN")} x {nights} nights</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Service fee</span>
                    <span>₹{serviceFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Taxes</span>
                    <span>₹{taxes.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="my-4 border-t border-border"></div>
                  <div className="flex justify-between font-bold text-ink-soft text-lg">
                    <span>Total (INR)</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between font-bold text-ink-soft text-lg">
                  <span>Total</span>
                  <span>₹{selectedRoom.pricePerNight.toLocaleString("en-IN")} <span className="text-sm font-normal text-muted">/ night</span></span>
                </div>
              )}
              
            </div>
          </aside>
          
        </div>
      </div>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<main className="container-page py-16 text-center"><p className="text-muted">Loading checkout...</p></main>}>
      <BookingForm />
    </Suspense>
  );
}
