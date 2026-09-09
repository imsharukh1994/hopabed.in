"use client";

import { useEffect, useState, use } from "react";
import { getPropertyDetails, createRoom, PropertyDetails } from "@/lib/api";
import { ArrowLeft, Loader2, Plus, BedDouble, Users, IndianRupee } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const ROOM_TYPES = ["Standard", "Deluxe", "Suite", "Entire Place"];
const ROOM_AMENITIES = ["King Bed", "Queen Bed", "Twin Bed", "Ensuite Bathroom", "Balcony", "Mini Fridge", "Work Desk", "Sea View"];

export default function PropertyManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomForm, setRoomForm] = useState({
    name: "",
    roomType: "Deluxe",
    capacity: "2",
    inventory: "1",
    pricePerNight: "",
    amenities: [] as string[],
  });

  const fetchProperty = async () => {
    try {
      const data = await getPropertyDetails(resolvedParams.id);
      setProperty(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to load property details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [resolvedParams.id]);

  const toggleAmenity = (amenity: string) => {
    setRoomForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoomLoading(true);
    try {
      await createRoom(resolvedParams.id, {
        ...roomForm,
        capacity: Number(roomForm.capacity),
        inventory: Number(roomForm.inventory),
        pricePerNight: Number(roomForm.pricePerNight),
      });
      // Reset form and refetch
      setIsAddingRoom(false);
      setRoomForm({ name: "", roomType: "Deluxe", capacity: "2", inventory: "1", pricePerNight: "", amenities: [] });
      await fetchProperty();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Failed to add room.");
      }
    } finally {
      setRoomLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;
  if (error || !property) return <p className="p-10 text-center text-red-500">{error || "Property not found"}</p>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/host" className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink-soft">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {property.primaryImage && (
          <Image
            src={property.primaryImage}
            alt={property.title}
            width={1000}
            height={400}
            className="h-64 w-full object-cover"
          />
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ink-soft sm:text-3xl">{property.title}</h1>
              <p className="mt-2 text-muted">{property.locality}, {property.city}</p>
            </div>
            <div className="inline-flex rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand">
              {property.propertyType}
            </div>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-ink-soft/80">{property.description}</p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-soft">Rooms & Inventory</h2>
        {!isAddingRoom && (
          <button
            onClick={() => setIsAddingRoom(true)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Add Room
          </button>
        )}
      </div>

      {isAddingRoom && (
        <div className="mb-8 rounded-2xl border border-brand/20 bg-brand/5 p-6 shadow-sm sm:p-8">
          <h3 className="mb-6 text-lg font-semibold text-ink-soft">Add New Room Type</h3>
          <form onSubmit={handleAddRoom} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-ink-soft">Room Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ocean View Deluxe Suite"
                  className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft">Type</label>
                <select
                  required
                  className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                  value={roomForm.roomType}
                  onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                >
                  {ROOM_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-ink-soft">Guest Capacity</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft">Number of these Rooms</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                  value={roomForm.inventory}
                  onChange={(e) => setRoomForm({ ...roomForm, inventory: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft">Price per Night (₹)</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
                  value={roomForm.pricePerNight}
                  onChange={(e) => setRoomForm({ ...roomForm, pricePerNight: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-ink-soft">Room Amenities</label>
              <div className="flex flex-wrap gap-2">
                {ROOM_AMENITIES.map((amenity) => {
                  const isSelected = roomForm.amenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                        isSelected
                          ? "border-brand bg-brand text-white font-medium"
                          : "border-border bg-white text-muted hover:border-brand/50"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingRoom(false)}
                className="rounded-lg border border-border px-6 py-2.5 font-semibold text-ink-soft transition-colors hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={roomLoading}
                className="flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-70"
              >
                {roomLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Room
              </button>
            </div>
          </form>
        </div>
      )}

      {property.rooms && property.rooms.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {property.rooms.map((room) => (
            <div key={room.id} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-ink-soft">{room.name}</h3>
                  <span className="text-sm text-muted">{room.roomType}</span>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <BedDouble className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted"><Users className="h-4 w-4" /> Capacity</span>
                  <span className="font-medium text-ink-soft">Up to {room.capacity} guests</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted"><IndianRupee className="h-4 w-4" /> Price</span>
                  <span className="font-medium text-ink-soft">₹{room.pricePerNight} / night</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Total Inventory</span>
                  <span className="font-medium text-ink-soft">{room.inventory} rooms available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isAddingRoom && (
          <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
            <p className="text-muted">No rooms added yet. Guests won&apos;t be able to book this property until you add inventory.</p>
          </div>
        )
      )}
    </div>
  );
}
