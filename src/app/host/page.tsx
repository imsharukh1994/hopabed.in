"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuthModal } from "@/components/AuthProvider";
import { getHostProperties, getHostStats, registerHost } from "@/lib/api";

interface HostProperty {
  id: string;
  title: string;
  coverImage: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
}

interface HostStats {
  totalProperties: number;
  totalBookings: number;
  totalEarnings: number;
}

export default function HostDashboardPage() {
  const { user } = useAuthModal();
  const [properties, setProperties] = useState<HostProperty[]>([]);
  const [stats, setStats] = useState<HostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const handleRegister = async () => {
    setRegistering(true);
    setRegisterError("");
    try {
      await registerHost({});
      window.location.reload(); // Quick way to refresh session/role
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRegisterError(err.message || "Failed to register as host.");
      }
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    if (!user) return; // Wait for user to load

    if (user.role !== "host") {
      setLoading(false);
      return;
    }

    Promise.all([getHostProperties(), getHostStats()])
      .then(([props, stats]) => {
        setProperties(props as unknown as HostProperty[]);
        setStats(stats as HostStats);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p className="px-6 py-10 text-center">Loading dashboard...</p>;

  if (user?.role !== "host") {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-ink-soft">Become a Host</h1>
        <p className="mb-8 text-lg text-muted">Join Hopebed and start earning by listing your properties today.</p>
        
        {registerError && (
          <div className="mb-6 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {registerError}
          </div>
        )}
        
        <button
          onClick={handleRegister}
          disabled={registering}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
        >
          {registering ? "Registering..." : "Register as Host"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-bold text-ink-soft">Host Dashboard</h1>

      {stats && (
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-muted">Properties</p>
            <p className="mt-2 text-3xl font-bold">{stats.totalProperties}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-muted">Bookings</p>
            <p className="mt-2 text-3xl font-bold">{stats.totalBookings}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-muted">Earnings</p>
            <p className="mt-2 text-3xl font-bold">${stats.totalEarnings}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Properties</h2>
        <Link
          href="/host/properties/new"
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-12 text-center">
          <p className="mb-4 text-muted">You haven&apos;t listed any properties yet.</p>
          <Link
            href="/host/properties/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 font-semibold text-white transition-all hover:bg-brand-dark"
          >
            <Plus className="h-5 w-5" />
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/host/properties/${property.id}`}
              className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
            >
              <div className="relative">
                <Image
                  src={property.coverImage || "/placeholder-property.jpg"}
                  alt={property.title}
                  width={400}
                  height={250}
                  className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm">
                  {property.status}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-ink-soft transition-colors group-hover:text-brand">{property.title}</h3>
                <p className="mt-1 text-sm text-muted">Manage property & rooms →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}