"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthModal } from "@/components/AuthProvider";
import { HelpCircle, Briefcase, CalendarCheck, Settings, Building2, Home, Tent, Building, Menu } from "lucide-react";
import type { ReactNode } from "react";

export default function Header() {
  const { user, openAuth, logout } = useAuthModal();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white shadow-sm transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Left: Logo */}
        <div className="flex shrink-0 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="HopeBed Logo"
              width={140}
              height={36}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center: Navigation Icons */}
        <div className="hidden flex-1 justify-center px-4 lg:flex">
          <div className="flex items-center gap-1 xl:gap-2">
            <NavItem icon={<Building2 className="h-4 w-4" />} label="Hotels" href="/search?type=hotel" />
            <NavItem icon={<Home className="h-4 w-4" />} label="Villas" href="/search?type=villa" />
            <NavItem icon={<Tent className="h-4 w-4" />} label="Homestays" href="/search?type=homestay" />
            <NavItem icon={<Building className="h-4 w-4" />} label="Apartments" href="/search?type=apartment" />
          </div>
        </div>

        {/* Right: Utilities */}
        <div className="flex shrink-0 items-center justify-end">
          <nav className="flex items-center gap-4 text-sm font-medium text-ink-soft xl:gap-6">
            <Link href="/host" className="hidden items-center gap-2 transition-colors hover:text-brand md:flex">
              <Briefcase className="h-4 w-4 text-muted" />
              <span className="hidden xl:inline">List Your Property</span>
              <span className="hidden md:inline xl:hidden">Host</span>
            </Link>
            
            <Link href="/support" className="hidden items-center gap-2 transition-colors hover:text-brand md:flex">
              <HelpCircle className="h-4 w-4 text-muted" />
              <span>Support</span>
            </Link>

            {user && (
              <Link href="/bookings" className="hidden items-center gap-2 transition-colors hover:text-brand lg:flex">
                <CalendarCheck className="h-4 w-4 text-muted" />
                <span className="hidden xl:inline">My Bookings</span>
              </Link>
            )}

            {user?.role === "admin" && (
              <Link href="/admin" className="hidden items-center gap-2 transition-colors hover:text-brand lg:flex">
                <Settings className="h-4 w-4 text-muted" />
                <span>Admin</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full border border-border bg-canvas px-3 py-1.5 transition-all hover:border-brand/50 hover:bg-white"
                >
                  <Image
                    src={user.avatarUrl || "/default-avatar.png"}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="rounded-full border border-border"
                  />
                  <span className="font-semibold text-ink-soft">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-red-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={openAuth}
                className="flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-dark"
              >
                Login / Sign Up
              </button>
            )}

            {/* Mobile Menu Toggle (Only visible < lg) */}
            <button className="flex items-center justify-center p-2 text-ink-soft lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavItem({ icon, label, href, active = false }: { icon: ReactNode; label: string; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-center gap-2 rounded-full px-4 py-2 transition-all ${
        active 
          ? "bg-brand/10 text-brand" 
          : "text-muted hover:bg-canvas hover:text-ink-soft"
      }`}
    >
      <div className={`transition-transform duration-200 group-hover:scale-110 ${active ? "text-brand" : "text-muted group-hover:text-ink-soft"}`}>
        {icon}
      </div>
      <span className={`text-sm font-semibold ${active ? "text-brand" : "text-ink-soft"}`}>
        {label}
      </span>
    </Link>
  );
}