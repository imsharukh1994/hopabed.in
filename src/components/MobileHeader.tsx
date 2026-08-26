"use client";

import { NAV_LINKS } from "@/data/site";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthModal } from "./AuthProvider";
import { Logo } from "./Logo";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-ink lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Logo compact />
        <button type="button" className="text-white" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {menuOpen ? <MenuDrawer onClose={() => setMenuOpen(false)} /> : null}
    </header>
  );
}

export function MenuDrawer({ onClose }: { onClose: () => void }) {
  const { openAuth } = useAuthModal();

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" className="absolute inset-0 bg-ink/50" aria-label="Close menu" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-[min(320px,88vw)] flex-col bg-white p-5 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-semibold text-ink-soft">Menu</p>
          <button type="button" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-3 text-[15px]">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={onClose} className="rounded-lg px-2 py-2 hover:bg-mint">
              {link.label}
            </Link>
          ))}
          <Link href="/wishlist" onClick={onClose} className="rounded-lg px-2 py-2 hover:bg-mint">
            Wishlist
          </Link>
          <Link href="/bookings" onClick={onClose} className="rounded-lg px-2 py-2 hover:bg-mint">
            My bookings
          </Link>
          <Link href="/profile" onClick={onClose} className="rounded-lg px-2 py-2 hover:bg-mint">
            Profile
          </Link>
        </nav>
        <button
          type="button"
          className="mt-6 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white"
          onClick={() => {
            onClose();
            openAuth();
          }}
        >
          Login / Signup
        </button>
      </aside>
    </div>
  );
}
