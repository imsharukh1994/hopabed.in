"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuthModal } from "@/components/AuthProvider";
import { HelpCircle, Briefcase, CalendarCheck, Settings, Building2, Home, Tent, Building, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { MenuDrawer } from "./MobileHeader";

export default function Header() {
  const { user, openAuth, logout } = useAuthModal();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#000] shadow-sm transition-all duration-300">
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
          <nav className="flex items-center gap-4 text-sm font-medium text-white/90 xl:gap-6">
            <Link href="/host" className="hidden items-center gap-2 transition-colors hover:text-brand md:flex">
              <Briefcase className="h-4 w-4 text-white/70" />
              <span className="hidden xl:inline">List Your Property</span>
              <span className="hidden md:inline xl:hidden">Host</span>
            </Link>
            
            <Link href="/support" className="hidden items-center gap-2 transition-colors hover:text-brand md:flex">
              <HelpCircle className="h-4 w-4 text-white/70" />
              <span>Support</span>
            </Link>

            {user && (
              <Link href="/bookings" className="hidden items-center gap-2 transition-colors hover:text-brand lg:flex">
                <CalendarCheck className="h-4 w-4 text-white/70" />
                <span className="hidden xl:inline">My Bookings</span>
              </Link>
            )}

            {user?.role === "admin" && (
              <Link href="/admin" className="hidden items-center gap-2 transition-colors hover:text-brand lg:flex">
                <Settings className="h-4 w-4 text-white/70" />
                <span>Admin</span>
              </Link>
            )}

            {user ? (
              <div className="hidden items-center gap-4 lg:flex">
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
                  <span className="font-semibold text-white/90">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-semibold uppercase tracking-wider text-white/50 transition-colors hover:text-red-400"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={openAuth}
                className="hidden shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-dark lg:flex"
              >
                Login / Sign Up
              </button>
            )}

            {/* Mobile Menu Toggle (Only visible < lg) */}
            <button className="flex items-center justify-center p-2 text-white/90 lg:hidden" onClick={() => setMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
          </nav>
        </div>
      </div>
      {menuOpen && <MenuDrawer onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

function NavItem({ icon, label, href, active = false }: { icon: ReactNode; label: string; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-center gap-2 rounded-full px-4 py-2 transition-all ${
        active 
          ? "bg-brand/20 text-brand" 
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className={`transition-transform duration-200 group-hover:scale-110 ${active ? "text-brand" : "text-white/70 group-hover:text-white"}`}>
        {icon}
      </div>
      <span className={`text-sm font-semibold ${active ? "text-brand" : "text-white/90"}`}>
        {label}
      </span>
    </Link>
  );
}