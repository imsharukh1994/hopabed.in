"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthModal } from "@/components/AuthProvider";
import { HelpCircle, Briefcase, CalendarCheck, Settings, Building2, Home, Tent, Building } from "lucide-react";
import type { ReactNode } from "react";

export default function Header() {
  const { user, openAuth, logout } = useAuthModal();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black shadow-sm">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
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

        {/* Center: Navigation Icons (Absolute perfectly centered) */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
          <div className="flex items-center gap-2">
            <NavItem icon={<Building2 className="h-5 w-5" />} label="Hotels" href="/search?type=hotel" active />
            <NavItem icon={<Home className="h-5 w-5" />} label="Villas" href="/search?type=villa" />
            <NavItem icon={<Tent className="h-5 w-5" />} label="Homestays" href="/search?type=homestay" />
            <NavItem icon={<Building className="h-5 w-5" />} label="Apartments" href="/search?type=apartment" />
          </div>
        </div>

        {/* Right: Utilities */}
        <div className="flex shrink-0 items-center justify-end">
          <nav className="flex items-center gap-4 text-sm font-medium text-white/90 xl:gap-6">
            <Link href="/host" className="hidden items-center gap-2 transition-colors hover:text-white md:flex">
              <Briefcase className="h-4 w-4 text-white/70" />
              <span className="hidden xl:inline">List Your Property</span>
              <span className="hidden md:inline xl:hidden">Host</span>
            </Link>
            
            <Link href="/support" className="hidden items-center gap-2 transition-colors hover:text-white md:flex">
              <HelpCircle className="h-4 w-4 text-white/70" />
              <span>Support</span>
            </Link>

            {user && (
              <Link href="/bookings" className="hidden items-center gap-2 transition-colors hover:text-white lg:flex">
                <CalendarCheck className="h-4 w-4 text-white/70" />
                <span className="hidden xl:inline">My Bookings</span>
              </Link>
            )}

            {user?.role === "admin" && (
              <Link href="/admin" className="hidden items-center gap-2 transition-colors hover:text-white lg:flex">
                <Settings className="h-4 w-4 text-white/70" />
                <span>Admin</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 transition-all hover:border-brand/50 hover:bg-white/10"
                >
                  <Image
                    src={user.avatarUrl || "/default-avatar.png"}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="rounded-full border border-white/20"
                  />
                  <span className="font-semibold text-white">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-semibold uppercase tracking-wider text-white/60 transition-colors hover:text-red-400"
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
          </nav>
        </div>
      </div>
      
      {/* Mobile Center Navigation - scrolls below the top bar on small screens */}
      <div className="block border-t border-white/10 bg-black lg:hidden">
        <div className="no-scrollbar flex items-center justify-start gap-2 overflow-x-auto px-4 py-2 sm:justify-center">
          <NavItem icon={<Building2 className="h-5 w-5" />} label="Hotels" href="/search?type=hotel" active />
          <NavItem icon={<Home className="h-5 w-5" />} label="Villas" href="/search?type=villa" />
          <NavItem icon={<Tent className="h-5 w-5" />} label="Homestays" href="/search?type=homestay" />
          <NavItem icon={<Building className="h-5 w-5" />} label="Apartments" href="/search?type=apartment" />
        </div>
      </div>
    </header>
  );
}

function NavItem({ icon, label, href, active = false }: { icon: ReactNode; label: string; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex min-w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all ${
        active 
          ? "text-brand" 
          : "text-white/90 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className={`transition-transform duration-200 group-hover:-translate-y-0.5 ${active ? "text-brand" : "text-white/90 group-hover:text-white"}`}>
        {icon}
      </div>
      <span className={`text-[11px] font-semibold tracking-wide ${active ? "text-brand" : "text-white/90 group-hover:text-white"}`}>
        {label}
      </span>
    </Link>
  );
}