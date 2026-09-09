"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthModal } from "@/components/AuthProvider";

export default function Header() {
  const { user, openAuth, logout } = useAuthModal();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-ink-soft">
          HopeBed
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/search" className="text-ink-soft hover:underline">
            Search
          </Link>
          {user ? (
            <>
              <Link href="/bookings" className="text-ink-soft hover:underline">
                My Bookings
              </Link>
              {user.role === "host" && (
                <Link href="/host" className="text-ink-soft hover:underline">
                  Host Dashboard
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin" className="text-ink-soft hover:underline">
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 text-ink-soft hover:underline"
              >
                <Image
                  src={user.avatarUrl || "/default-avatar.png"}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                {user.name}
              </Link>
              <button
                onClick={logout}
                className="text-ink-soft hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={openAuth}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
            >
              Login / Sign Up
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}