"use client";

import { useAuthModal } from "@/components/AuthProvider";
import { CalendarDays, ChevronRight, ShieldCheck, UserRound } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { openAuth, user, logout } = useAuthModal();

  useEffect(() => {
    if (!user) openAuth();
  }, [openAuth, user]);

  if (!user) return <main className="container-page py-16"><p className="text-muted">Please log in to view your profile.</p></main>;

  return (
    <main className="min-h-[calc(100vh-76px)] bg-canvas">
      <section className="border-b border-border bg-ink py-12 text-white">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-light">Your account</p>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white ring-4 ring-white/10">
                {user.name.charAt(0).toUpperCase()}
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="absolute inset-0 h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold tracking-tight sm:text-4xl">{user.name}</h1>
                <p className="mt-1 truncate text-sm text-white/65">{user.email}</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/40 bg-brand/15 px-3 py-2 text-sm font-medium text-brand-light">
              <ShieldCheck className="h-4 w-4" /> Account active
            </span>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Account overview</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink-soft">Manage your Hopebed account</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-border bg-white p-5 shadow-sm">
                <UserRound className="h-5 w-5 text-brand" />
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Account type</p>
                <p className="mt-1 text-lg font-semibold capitalize text-ink-soft">{user.role}</p>
              </div>
              <div className="border border-border bg-white p-5 shadow-sm">
                <CalendarDays className="h-5 w-5 text-brand" />
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Your stays</p>
                <p className="mt-1 text-lg font-semibold text-ink-soft">No bookings yet</p>
              </div>
            </div>
          </div>

          <aside className="border border-border bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Quick actions</p>
            <div className="mt-4 divide-y divide-border">
              <Link href="/stays" className="flex items-center justify-between py-4 text-sm font-medium text-ink-soft hover:text-brand">
                Find a verified stay <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/bookings" className="flex items-center justify-between py-4 text-sm font-medium text-ink-soft hover:text-brand">
                View my bookings <ChevronRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={logout} className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-ink-soft hover:text-red-600">
                Log out <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
