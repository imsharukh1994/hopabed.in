"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, ShieldCheck, CheckCircle2, AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { useAuthModal } from "@/components/AuthProvider";
import { getHostProperties, getHostStats, getOwnerVerificationStatus, createAutoDraftProperty } from "@/lib/api";

interface HostProperty {
  _id: string;
  id?: string;
  title: string;
  primaryImage?: string;
  coverImage?: string;
  verificationStatus: "DRAFT" | "PENDING_REVIEW" | "CHANGES_REQUESTED" | "VERIFIED" | "REJECTED";
  isVerified: boolean;
  isPublished: boolean;
  rejectionReason?: string;
}

interface HostStats {
  totalProperties: number;
  totalBookings: number;
  totalEarnings: number;
}

interface OwnerVerificationData {
  governmentIdStatus: string;
  panStatus: string;
  verificationStatus: string;
  mobileVerified: boolean;
}

export default function HostDashboardPage() {
  const { user } = useAuthModal();
  const [properties, setProperties] = useState<HostProperty[]>([]);
  const [stats, setStats] = useState<HostStats | null>(null);
  const [verifStatus, setVerifStatus] = useState<OwnerVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const handleRegister = async () => {
    setRegistering(true);
    setRegisterError("");
    try {
      const res = await createAutoDraftProperty();
      const propObj = res.property as { _id?: string; id?: string } | undefined;
      const propId = propObj?._id || propObj?.id;
      if (propId) {
        window.location.href = `/host/properties/${propId}/verification`;
      } else {
        window.location.reload();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRegisterError(err.message || "Failed to register as host.");
      }
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (user.role !== "host") {
      setLoading(false);
      return;
    }

    Promise.all([
      getHostProperties(),
      getHostStats(),
      getOwnerVerificationStatus().catch(() => null),
    ])
      .then(([props, stats, verif]) => {
        setProperties(props as unknown as HostProperty[]);
        setStats(stats as HostStats);
        setVerifStatus((verif as unknown) as OwnerVerificationData);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p className="px-6 py-10 text-center text-muted">Loading dashboard...</p>;

  if (user?.role !== "host") {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-ink-soft">Become a Host</h1>
        <p className="mb-8 text-lg text-muted">Join Hopebed and start earning by listing your properties today.</p>

        {registerError && (
          <div className="mb-6 rounded-lg bg-red-100 p-3 text-sm text-red-700">{registerError}</div>
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
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-soft">Host Dashboard</h1>
          <p className="text-sm text-muted">Manage your listings, verification status and bookings.</p>
        </div>

        <Link
          href="/host/properties/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Add New Property
        </Link>
      </div>

      {/* Owner Identity & Verification Status Widget */}
      <div className="mb-10 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-soft">Owner Verification Status</h2>
              <p className="text-xs text-muted">Identity compliance status for hosting on Hopebed.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Mobile Verified
            </span>

            {verifStatus?.governmentIdStatus === "verified" ? (
              <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Gov ID Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <Clock className="h-3.5 w-3.5" /> Gov ID Pending
              </span>
            )}

            {verifStatus?.panStatus === "verified" ? (
              <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> PAN Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <Clock className="h-3.5 w-3.5" /> PAN Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-muted uppercase">Properties</p>
            <p className="mt-2 text-3xl font-bold text-ink-soft">{stats.totalProperties}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-muted uppercase">Total Bookings</p>
            <p className="mt-2 text-3xl font-bold text-ink-soft">{stats.totalBookings}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-muted uppercase">Total Earnings</p>
            <p className="mt-2 text-3xl font-bold text-ink-soft">₹{stats.totalEarnings}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-soft">My Properties</h2>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-12 text-center">
          <p className="mb-4 text-muted">You haven&apos;t listed any properties yet.</p>
          <Link
            href="/host/properties/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
          >
            <Plus className="h-5 w-5" />
            Create Your First Property Draft
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const propId = property._id || property.id;
            const status = property.verificationStatus || "DRAFT";

            return (
              <div
                key={propId}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-brand/30 hover:shadow-md"
              >
                <div>
                  <div className="relative">
                    <Image
                      src={property.primaryImage || property.coverImage || "/placeholder-property.jpg"}
                      alt={property.title}
                      width={400}
                      height={250}
                      className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute right-3 top-3">
                      {status === "VERIFIED" && property.isPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" /> LIVE & Verified
                        </span>
                      ) : status === "PENDING_REVIEW" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          <Clock className="h-3.5 w-3.5" /> Under Review
                        </span>
                      ) : status === "CHANGES_REQUESTED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          <AlertCircle className="h-3.5 w-3.5" /> Changes Needed
                        </span>
                      ) : status === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          <ShieldAlert className="h-3.5 w-3.5" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-700 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-semibold text-ink-soft transition group-hover:text-brand">{property.title}</h3>

                    {property.rejectionReason && (
                      <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                        <span className="font-semibold">Reason:</span> &ldquo;{property.rejectionReason}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border bg-canvas/40 px-5 py-3.5">
                  <Link
                    href={`/host/properties/${propId}/verification`}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Complete Verification →
                  </Link>

                  <Link
                    href={`/host/properties/${propId}`}
                    className="text-xs font-medium text-muted hover:text-ink-soft"
                  >
                    Edit Listing
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}