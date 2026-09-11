"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/AuthProvider";
import { createAutoDraftProperty } from "@/lib/api";
import {
  Building2,
  ShieldCheck,
  Plus,
  ArrowRight,
  Mail,
  Shield,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthModal();
  const router = useRouter();

  const [loadingDraft, setLoadingDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-ink-soft">Please Log In</h1>
        <p className="mt-2 text-sm text-muted">Log in to view your profile and manage your property listings.</p>
      </div>
    );
  }

  const handleListProperty = async () => {
    setLoadingDraft(true);
    setErrorMsg("");
    try {
      const res = await createAutoDraftProperty();
      const propObj = res.property as { _id?: string; id?: string } | undefined;
      const propId = propObj?._id || propObj?.id;
      if (propId) {
        router.push(`/host/properties/${propId}/verification`);
      } else {
        router.push("/host");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message || "Failed to create property draft.");
      }
      setLoadingDraft(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-ink-soft">My Account & Hosting Profile</h1>

      <div className="grid gap-8 md:grid-cols-3">
        {/* User Card (Left Column) */}
        <div className="md:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm text-center">
            <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-brand/20 bg-canvas">
              <Image
                src={user.avatarUrl || "/default-avatar.png"}
                alt={`${user.name}'s avatar`}
                fill
                className="object-cover"
              />
            </div>

            <h2 className="text-xl font-bold text-ink-soft">{user.name}</h2>
            <p className="mt-0.5 text-xs text-muted flex items-center justify-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>

            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase text-brand">
                <Shield className="h-3.5 w-3.5" /> {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Action Center & Hosting Card (Right Column) */}
        <div className="md:col-span-2 space-y-6">
          {/* List Your Property & Host Management Section */}
          <div className="overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/5 via-white to-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-md">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand">
                  <Sparkles className="h-3.5 w-3.5" /> Hopebed Host Hub
                </span>
                <h2 className="text-xl font-bold text-ink-soft">List & Manage Your Properties</h2>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              List your Hotel, PG, Hostel, Homestay, or Guest House on Hopebed. Verified properties get exclusive trust badges and booking visibility.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-xs text-red-600 border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleListProperty}
                disabled={loadingDraft}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-dark shadow-sm hover:shadow disabled:opacity-70"
              >
                {loadingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating Listing Draft...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> List Your Property Now
                  </>
                )}
              </button>

              <Link
                href="/host"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-ink-soft transition hover:bg-canvas"
              >
                Host Dashboard <ArrowRight className="h-4 w-4 text-muted" />
              </Link>
            </div>
          </div>

          {/* Quick Account Navigation Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/bookings"
              className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:border-brand/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-brand">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-soft">My Bookings</h3>
                <p className="text-xs text-muted">View past and upcoming stay passes</p>
              </div>
            </Link>

            <Link
              href="/host"
              className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:border-brand/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-brand">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-soft">Verification Center</h3>
                <p className="text-xs text-muted">Gov ID & Property Compliance</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}