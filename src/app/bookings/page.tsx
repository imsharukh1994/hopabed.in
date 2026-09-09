"use client";

import { useEffect, useState } from "react";
import { useAuthModal } from "@/components/AuthProvider";
import { getBookings, initPayUPayment } from "@/lib/api";
import { CalendarDays, MapPin } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function BookingsPage() {
  const { user, openAuth } = useAuthModal();
  const [bookings, setBookings] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getBookings()
        .then(setBookings)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-ink">My Bookings</h1>
        <p className="mb-8 text-muted">You must be logged in to view your bookings.</p>
        <button
          onClick={openAuth}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Login to Continue
        </button>
      </div>
    );
  }

  const handlePayment = async (booking: Record<string, any>) => {
    setProcessingPayment(booking._id);
    try {
      const payload = await initPayUPayment(booking._id);

      // Create a dynamic form to POST to PayU
      const form = document.createElement("form");
      form.method = "POST";
      form.action = process.env.NEXT_PUBLIC_PAYU_URL || "https://test.payu.in/_payment";
      
      const addField = (name: string, value: string) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      Object.entries(payload).forEach(([key, val]) => {
        addField(key, val);
      });

      document.body.appendChild(form);
      form.submit();
      
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to initialize payment");
      setProcessingPayment(null);
    }
  };

  return (
    <div className="container-page py-12">
      <h1 className="mb-8 text-3xl font-bold text-ink">My Bookings</h1>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted" />
          <h2 className="mb-2 text-xl font-semibold">No bookings yet</h2>
          <p className="text-muted">When you book a stay, it will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <div key={booking._id} className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                      booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                      booking.status === "pending" ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                  <span className="text-sm font-semibold">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <h3 className="mb-1 text-lg font-bold text-ink-soft">
                  {booking.property?.title ?? "Property Unavailable"}
                </h3>
                <p className="mb-4 flex items-center gap-1 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {booking.property?.city ?? "Unknown City"}
                </p>
                <div className="mb-4 grid grid-cols-2 gap-4 rounded-xl bg-canvas p-3 text-sm">
                  <div>
                    <p className="text-xs text-muted">Check-in</p>
                    <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Check-out</p>
                    <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {booking.paymentStatus === "UNPAID" && booking.status !== "cancelled" ? (
                <button
                  onClick={() => handlePayment(booking)}
                  disabled={processingPayment === booking._id}
                  className="mt-2 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                >
                  {processingPayment === booking._id ? "Processing..." : "Pay Now"}
                </button>
              ) : booking.paymentStatus === "PAID" && booking.status === "confirmed" ? (
                <div className="mt-4 flex flex-col items-center rounded-xl bg-canvas p-4 border border-brand/20">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">Stay Pass</p>
                  <div className="rounded-lg bg-white p-2 shadow-sm">
                    <QRCodeCanvas value={`https://hopabed.in/verify?b=${booking._id}`} size={120} />
                  </div>
                  <p className="mt-3 text-center text-[10px] text-muted">Show this code to the host<br/>upon arrival for check-in.</p>
                </div>
              ) : booking.status === "checked_in" ? (
                <div className="mt-2 text-center text-sm font-semibold text-green-600">
                  Checked In
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
