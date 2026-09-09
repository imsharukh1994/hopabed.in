"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/AuthProvider";
import { getBookings, initPayUPayment } from "@/lib/api";
import { PayUCheckoutForm, PayUCheckoutData } from "@/components/PayUCheckoutForm";
import { Loader2 } from "lucide-react";

interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalPrice: number;
}

function BookingsList() {
  const { user } = useAuthModal();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<PayUCheckoutData | null>(null);

  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (!user) return;
    getBookings()
      .then((data) => setBookings(data as unknown as Booking[]))
      .finally(() => setLoading(false));
  }, [user]);

  const handlePayNow = async (bookingId: string) => {
    try {
      setPayingBookingId(bookingId);
      const data = await initPayUPayment(bookingId);
      setCheckoutData(data as unknown as PayUCheckoutData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Failed to initiate payment");
      }
      setPayingBookingId(null);
    }
  };

  if (loading) return <p className="px-6 py-10 text-center">Loading bookings...</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-ink-soft">My Bookings</h1>
      
      {successParam === "true" && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
          Payment successful. Your booking is confirmed.
        </div>
      )}
      
      {errorParam && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
          {errorParam === "payment_failed" 
            ? "Payment could not be completed. Your booking has not been confirmed." 
            : errorParam === "payment_cancelled"
            ? "Payment was cancelled. Your booking has not been confirmed."
            : "There was an error processing your payment."}
        </div>
      )}

      {bookings.length === 0 ? (
        <p className="text-muted">You have no bookings yet.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{booking.propertyTitle}</h2>
                  <p className="text-sm text-muted mt-1">
                    Check-in: {new Date(booking.checkIn).toLocaleDateString()} – Check-out:{" "}
                    {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                  <p className="mt-2 font-medium">Total: ₹{booking.totalPrice}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {booking.status}
                  </span>
                  
                  {booking.status === "PENDING" && (
                    <button
                      onClick={() => handlePayNow(booking.id)}
                      disabled={payingBookingId !== null}
                      className="mt-2 flex items-center justify-center min-w-[120px] rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-50"
                    >
                      {payingBookingId === booking.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Pay Now"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {checkoutData && <PayUCheckoutForm checkoutData={checkoutData} />}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-center">Loading...</p>}>
      <BookingsList />
    </Suspense>
  );
}