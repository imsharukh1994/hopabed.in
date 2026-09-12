"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useAuthModal } from "@/components/AuthProvider";
import {
  HelpCircle,
  Briefcase,
  Settings,
  Building2,
  Home,
  Tent,
  Building,
  Menu,
  ChevronDown,
  Calendar,
  User,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { MenuDrawer } from "./MobileHeader";

export default function Header() {
  const { user, openAuth, logout } = useAuthModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

            {user?.role === "admin" && (
              <Link href="/admin" className="hidden items-center gap-2 transition-colors hover:text-brand lg:flex">
                <Settings className="h-4 w-4 text-white/70" />
                <span>Admin</span>
              </Link>
            )}

            {user ? (
              <div className="relative hidden lg:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 transition-all hover:border-[#0b8f3c] hover:bg-white/20"
                >
                  <div className="relative h-6 w-6 overflow-hidden rounded-full border border-white/40">
                    <Image
                      src={user.avatarUrl || "/default-avatar.png"}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-semibold text-white">{user.name}</span>
                  <ChevronDown className={`h-4 w-4 text-white/80 transition-transform duration-200 ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl z-50 text-[#111111]">
                    {/* User Header */}
                    <div className="rounded-xl bg-[#f7fbf8] p-3 mb-1 border border-gray-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#0b8f3c] flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Signed in as
                      </p>
                      <p className="truncate text-xs font-semibold text-[#111111] mt-0.5">{user.email}</p>
                    </div>

                    <div className="space-y-0.5">
                      {/* MY BOOKINGS (HIGHLIGHTED) */}
                      <Link
                        href="/profile?tab=bookings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-xl bg-[#eaf7ef] px-3.5 py-2.5 text-xs font-bold text-[#0b8f3c] transition hover:bg-[#0b8f3c] hover:text-white group"
                      >
                        <Calendar className="h-4 w-4 text-[#0b8f3c] group-hover:text-white shrink-0" />
                        <span>My Bookings</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#111111] transition hover:bg-[#f5f8f6] hover:text-[#0b8f3c]"
                      >
                        <User className="h-4 w-4 text-[#59615c] shrink-0" />
                        <span>My Profile & Account</span>
                      </Link>

                      <Link
                        href="/host"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#111111] transition hover:bg-[#f5f8f6] hover:text-[#0b8f3c]"
                      >
                        <Building2 className="h-4 w-4 text-[#59615c] shrink-0" />
                        <span>Host Hub & Dashboard</span>
                      </Link>

                      <Link
                        href="/host/verification"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#111111] transition hover:bg-[#f5f8f6] hover:text-[#0b8f3c]"
                      >
                        <ShieldCheck className="h-4 w-4 text-[#59615c] shrink-0" />
                        <span>Verification Center</span>
                      </Link>
                    </div>

                    <div className="mt-1.5 border-t border-gray-100 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 text-red-500 shrink-0" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuth()}
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