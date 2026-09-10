"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/AuthProvider";
import { getBookings, initPayUPayment } from "@/lib/api";
import { PayUCheckoutForm, PayUCheckoutData } from "@/components/PayUCheckoutForm";
import { Loader2, QrCode, X, CheckCircle2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "checked_in";
  totalPrice: number;
}

function BookingsList() {
  const { user } = useAuthModal();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<PayUCheckoutData | null>(null);
  const [selectedPass, setSelectedPass] = useState<Booking | null>(null);

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
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700 font-medium border border-green-200 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Payment successful! Your booking is confirmed. Below is your Stay Pass.
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
                  <h2 className="font-semibold text-lg">{booking.propertyTitle}</h2>
                  <p className="text-sm text-muted mt-1">
                    Check-in: {new Date(booking.checkIn).toLocaleDateString()} – Check-out:{" "}
                    {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                  <p className="mt-2 font-semibold text-ink-soft">Total: ₹{booking.totalPrice}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    booking.status === 'CONFIRMED' || booking.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status === 'checked_in' ? 'CHECKED IN' : booking.status}
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

                  {(booking.status === "CONFIRMED" || booking.status === "checked_in") && (
                    <button
                      onClick={() => setSelectedPass(booking)}
                      className="mt-2 flex items-center gap-2 rounded-lg border border-brand bg-brand/5 px-4 py-2 text-sm font-semibold text-brand transition-all hover:bg-brand/10"
                    >
                      <QrCode className="h-4 w-4" />
                      View Stay Pass
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Stay Pass Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedPass(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                HOPEBED DIGITAL STAY PASS
              </span>
              <h3 className="mt-3 text-xl font-bold text-ink-soft">{selectedPass.propertyTitle}</h3>
              <p className="mt-1 text-xs text-muted">Booking ID: {selectedPass.id}</p>

              <div className="my-6 flex justify-center rounded-2xl bg-gray-50 p-6 border border-gray-100 shadow-inner">
                <QRCodeCanvas
                  value={JSON.stringify({ bookingId: selectedPass.id, type: "HOPEBED_STAY_PASS" })}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-2 rounded-xl bg-canvas p-4 text-left text-xs text-ink-soft">
                <div className="flex justify-between">
                  <span className="text-muted">Check-in:</span>
                  <span className="font-semibold">{new Date(selectedPass.checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Check-out:</span>
                  <span className="font-semibold">{new Date(selectedPass.checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span className="font-semibold text-green-600 uppercase">{selectedPass.status}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted">
                Present this QR code or booking ID to the host at reception for seamless check-in.
              </p>
            </div>
          </div>
        </div>
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