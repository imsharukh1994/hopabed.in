"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProperty } from "@/lib/api";
import { useAuthModal } from "@/components/AuthProvider";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const PROPERTY_TYPES = ["Hotel", "Villa", "Homestay", "Apartment", "Resort", "Guesthouse"];
const COMMON_AMENITIES = ["WiFi", "AC", "Pool", "Parking", "Kitchen", "TV", "Gym", "Breakfast Included"];

export default function NewPropertyPage() {
  const router = useRouter();
  const { user } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "Hotel",
    address: "",
    city: "",
    locality: "",
    pricePerNight: "",
    primaryImage: "",
    amenities: [] as string[],
  });

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);

    try {
      const property = await createProperty({
        ...formData,
        pricePerNight: Number(formData.pricePerNight),
      });
      // Redirect to the property management page to add rooms
      router.push(`/host/properties/${property._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create property.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/host" className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink-soft">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-ink-soft">List a New Property</h1>
        <p className="mt-2 text-sm text-muted">Tell us about the space you're hosting. You'll add specific rooms and inventory in the next step.</p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft">Property Title</label>
              <input
                required
                type="text"
                placeholder="e.g. Sunset View Villa in North Goa"
                className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink-soft">Property Type</label>
                <select
                  required
                  className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft">Base Price Per Night (₹)</label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="e.g. 2500"
                  className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-soft">Description</label>
              <textarea
                required
                rows={4}
                placeholder="Describe your property and what makes it special..."
                className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink-soft">City</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Goa"
                  className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft">Locality / Neighborhood</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Anjuna"
                  className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-soft">Full Address</label>
              <input
                required
                type="text"
                placeholder="e.g. 123 Beach Road, North Goa, 403509"
                className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-soft">Cover Image URL</label>
              <input
                required
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                value={formData.primaryImage}
                onChange={(e) => setFormData({ ...formData, primaryImage: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-ink-soft">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_AMENITIES.map((amenity) => {
                  const isSelected = formData.amenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                        isSelected
                          ? "border-brand bg-brand/10 text-brand font-medium"
                          : "border-border bg-white text-muted hover:border-brand/50"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 font-semibold text-white transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save & Continue to Rooms"}
          </button>
        </form>
      </div>
    </div>
  );
}
