"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuthModal } from "@/components/AuthProvider";
import { getHostProperties, getHostStats } from "@/lib/api";

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

  useEffect(() => {
    if (!user || user.role !== "host") return;
    Promise.all([getHostProperties(user.id), getHostStats(user.id)])
      .then(([props, stats]) => {
        setProperties(props as HostProperty[]);
        setStats(stats as HostStats);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p className="px-6 py-10 text-center">Loading dashboard...</p>;

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

      <h2 className="mb-4 text-xl font-semibold">My Properties</h2>

      {properties.length === 0 ? (
        <p className="text-muted">No properties listed yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <div
              key={property.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <Image
                src={property.coverImage}
                alt={property.title}
                width={400}
                height={250}
                className="h-48 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold">{property.title}</h3>
                <span className="text-sm text-muted capitalize">
                  {property.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}