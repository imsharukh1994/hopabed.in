"use client";

import { useEffect } from "react";
import { verifyPayUPayment } from "@/lib/api";

export interface PayUCheckoutData {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  bookingId?: string; // We'll need this to verify
}

export function PayUCheckoutForm({ checkoutData, bookingId }: { checkoutData: PayUCheckoutData; bookingId: string }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const options = {
        key: checkoutData.key,
        amount: checkoutData.amount * 100, // paise
        currency: checkoutData.currency,
        name: "Hopebed",
        description: "Booking Payment",
        order_id: checkoutData.orderId,
        handler: async function (response: any) {
          try {
            await verifyPayUPayment(bookingId);
            window.location.href = "/bookings?success=true";
          } catch (err) {
            window.location.href = "/bookings?error=payment_failed";
          }
        },
        theme: {
          color: "#0a2540",
        },
        modal: {
          ondismiss: function () {
            window.location.href = "/bookings?error=payment_cancelled";
          },
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [checkoutData, bookingId]);

  return null;
}
