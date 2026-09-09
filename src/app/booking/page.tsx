"use client";

import { useEffect, useState } from "react";
import { useAuthModal } from "@/components/AuthProvider";
import { getBookings } from "@/lib/api";

interface Booking {
id: string;
propertyId: string;
propertyTitle: string;
checkIn: string;
checkOut: string;
status: "PENDING" | "CONFIRMED" | "CANCELLED";
totalPrice: number;
}

function isBooking(value: Record<string, unknown>): value is Booking {
return (
typeof value.id === "string" &&
typeof value.propertyId === "string" &&
typeof value.propertyTitle === "string" &&
typeof value.checkIn === "string" &&
typeof value.checkOut === "string" &&
(value.status === "PENDING" ||
value.status === "CONFIRMED" ||
value.status === "CANCELLED") &&
typeof value.totalPrice === "number"
);
}

export default function BookingPage() {
const { user } = useAuthModal();

const [bookings, setBookings] = useState<Booking[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
if (!user) {
setLoading(false);
return;
}

```
getBookings()
  .then((data) => {
    const validBookings = data.filter(isBooking);
    setBookings(validBookings);
  })
  .finally(() => {
    setLoading(false);
  });
```

}, [user]);

if (loading) {
return ( <p className="px-6 py-10 text-center">
Loading bookings... </p>
);
}

return ( <div className="mx-auto max-w-4xl px-6 py-10"> <h1 className="mb-6 text-2xl font-bold text-ink-soft">
My Bookings </h1>

```
  {bookings.length === 0 ? (
    <p className="text-muted">
      You have no bookings yet.
    </p>
  ) : (
    <ul className="space-y-4">
      {bookings.map((booking) => (
        <li
          key={booking.id}
          className="rounded-2xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="flex justify-between">
            <h2 className="font-semibold">
              {booking.propertyTitle}
            </h2>

            <span className="text-sm capitalize">
              {booking.status}
            </span>
          </div>

          <p className="text-sm text-muted">
            Check-in:{" "}
            {new Date(
              booking.checkIn
            ).toLocaleDateString()}{" "}
            – Check-out:{" "}
            {new Date(
              booking.checkOut
            ).toLocaleDateString()}
          </p>

          <p className="mt-2 font-medium">
            Total: ${booking.totalPrice}
          </p>
        </li>
      ))}
    </ul>
  )}
</div>
```

);
}
