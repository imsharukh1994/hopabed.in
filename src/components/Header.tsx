"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthModal } from "@/components/AuthProvider";

export default function Header() {
  const { user, openAuth, logout } = useAuthModal();

  return (
    <header className="border-b border-ink bg-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/hopabed-wordmark.jpg" alt="HopeBed Logo" width={140} height={40} className="object-contain" />
        </Link>

        <nav className="flex items-center gap-4 text-white">
          <Link href="/search" className="hover:underline">
            Search
          </Link>
          {user ? (
            <>
              <Link href="/bookings" className="hover:underline">
                My Bookings
              </Link>
              {user.role === "host" && (
                <Link href="/host" className="hover:underline">
                  Host Dashboard
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin" className="hover:underline">
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:underline"
              >
                <Image
                  src={user.avatarUrl || "/default-avatar.png"}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full border border-gray-600"
                />
                {user.name}
              </Link>
              <button
                onClick={logout}
                className="hover:underline text-gray-300"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={openAuth}
              className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-dark"
            >
              Login / Sign Up
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}