"use client";

import { useEffect, useState } from "react";
import { useAuthModal } from "@/components/AuthProvider";
import { registerHost, getHostProperties, createProperty, getHostBookings } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function HostPage() {
  const { user, openAuth, setSession } = useAuthModal();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Record<string, any>[]>([]);
  const [bookings, setBookings] = useState<Record<string, any>[]>([]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [activeTab, setActiveTab] = useState<"properties" | "bookings">("properties");

  useEffect(() => {
    if (user?.role === "host" || user?.role === "admin") {
      Promise.all([getHostProperties(), getHostBookings()])
        .then(([propsRes, bookingsRes]) => {
          setProperties(propsRes);
          setBookings(bookingsRes);
        })
        .catch(console.error);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-ink">Become a Host</h1>
        <p className="mb-8 text-muted">You must be logged in to register as a host.</p>
        <button
          onClick={openAuth}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Login to Continue
        </button>
      </div>
    );
  }

  if (user.role === "host" || user.role === "admin") {
    return (
      <div className="container-page py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">Host Dashboard</h1>
            <p className="text-muted">Welcome back, {user.name}!</p>
          </div>
          {activeTab === "properties" && (
            <button
              onClick={() => setShowAddProperty(!showAddProperty)}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {showAddProperty ? "Cancel" : "+ Add Property"}
            </button>
          )}
        </div>

        <div className="mb-8 flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab("properties")}
            className={`border-b-2 py-2 text-sm font-semibold transition ${activeTab === "properties" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
          >
            My Properties
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`border-b-2 py-2 text-sm font-semibold transition ${activeTab === "bookings" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
          >
            Reservations ({bookings.length})
          </button>
        </div>

        {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        {activeTab === "properties" ? (
          <>
            {showAddProperty ? (
              <div className="mb-12 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Create New Property</h2>
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSubmitting(true);
                    setError(null);
                    const formData = new FormData(e.currentTarget);
                    try {
                      const newProp = await createProperty({
                        title: formData.get("title"),
                        propertyType: formData.get("propertyType"),
                        city: formData.get("city"),
                        locality: formData.get("locality"),
                        state: formData.get("state"),
                        address: formData.get("address"),
                        description: formData.get("description"),
                        bedrooms: Number(formData.get("bedrooms")),
                        bathrooms: Number(formData.get("bathrooms")),
                        maxGuests: Number(formData.get("maxGuests")),
                        pricePerNight: Number(formData.get("pricePerNight")),
                      });
                      setProperties([newProp, ...properties]);
                      setShowAddProperty(false);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to create property.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Property Title</label>
                    <input name="title" required className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="e.g. Cozy Beach Villa" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <select name="propertyType" required className="w-full rounded-xl border border-border px-3 py-2 text-sm">
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Price Per Night (INR)</label>
                    <input name="pricePerNight" type="number" min="0" required className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="2500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">City</label>
                    <input name="city" required className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Locality</label>
                    <input name="locality" required className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="Bandra" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">State</label>
                    <input name="state" required className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="Maharashtra" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Address</label>
                    <input name="address" required className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="123 Ocean View Rd" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Bedrooms</label>
                    <input name="bedrooms" type="number" min="0" required className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Bathrooms</label>
                    <input name="bathrooms" type="number" min="1" required className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="1" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Max Guests</label>
                    <input name="maxGuests" type="number" min="1" required className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="4" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <textarea name="description" required rows={3} className="w-full rounded-xl border border-border px-3 py-2 text-sm" placeholder="Describe your property..." />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark">
                      {isSubmitting ? "Creating..." : "Save Property"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.length === 0 && !showAddProperty ? (
                <p className="text-muted">You have not added any properties yet.</p>
              ) : (
                properties.map((prop) => (
                  <div key={prop._id} className="rounded-2xl border border-border bg-white shadow-sm transition hover:shadow-md">
                    <div className="flex aspect-video items-center justify-center rounded-t-2xl bg-canvas text-muted">
                      {prop.primaryImage ? (
                        <img src={prop.primaryImage} alt={prop.title} className="h-full w-full object-cover rounded-t-2xl" />
                      ) : "No Image"}
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${prop.verificationStatus === 'VERIFIED' ? 'text-green-600' : 'text-orange-500'}`}>
                          {prop.verificationStatus}
                        </span>
                        <span className="text-xs text-muted">{prop.propertyType}</span>
                      </div>
                      <h3 className="mb-1 font-semibold line-clamp-1">{prop.title}</h3>
                      <p className="mb-3 text-sm text-muted">{prop.locality}, {prop.city}</p>
                      <div className="flex items-end justify-between">
                        <span className="font-semibold text-brand">₹{prop.pricePerNight} <span className="text-xs font-normal text-muted">/ night</span></span>
                        <button className="text-xs font-medium text-brand hover:underline">Manage Rooms</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-canvas">
                <tr>
                  <th className="px-6 py-4 font-semibold text-ink-soft">Guest</th>
                  <th className="px-6 py-4 font-semibold text-ink-soft">Property</th>
                  <th className="px-6 py-4 font-semibold text-ink-soft">Dates</th>
                  <th className="px-6 py-4 font-semibold text-ink-soft">Total</th>
                  <th className="px-6 py-4 font-semibold text-ink-soft">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted">No reservations yet.</td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b._id} className="transition hover:bg-canvas/50">
                      <td className="px-6 py-4 font-medium text-ink-soft">{b.guest?.name || "Unknown"}</td>
                      <td className="px-6 py-4">{b.property?.title || "Property"} - {b.room?.name || "Room"}</td>
                      <td className="px-6 py-4">{new Date(b.checkIn).toLocaleDateString()} to {new Date(b.checkOut).toLocaleDateString()}</td>
                      <td className="px-6 py-4">₹{b.totalAmount}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wider ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-12 sm:py-20">
      <h1 className="mb-2 text-3xl font-bold text-ink">Become a Host</h1>
      <p className="mb-8 text-muted">List your property on Hopebed and start earning today.</p>

      {error ? (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setIsSubmitting(true);
          setError(null);
          const formData = new FormData(e.currentTarget);
          try {
            const result = await registerHost({
              businessName: formData.get("businessName")?.toString(),
              bio: formData.get("bio")?.toString(),
            });
            const token = localStorage.getItem("hopebed_access_token");
            if (token) setSession(token, result.user);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to register as host.");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div>
          <label htmlFor="businessName" className="mb-2 block text-sm font-medium text-ink-soft">
            Business or Property Name (Optional)
          </label>
          <input
            id="businessName"
            name="businessName"
            className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="e.g. Hopebed Residency"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-2 block text-sm font-medium text-ink-soft">
            About You or Your Business
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Tell guests a bit about yourself..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand py-3.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
        >
          {isSubmitting ? "Registering..." : "Register as Host"}
        </button>
      </form>
    </div>
  );
}
