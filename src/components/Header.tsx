"use client";

import { NAV_LINKS } from "@/data/site";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthModal } from "./AuthProvider";
import { Logo } from "./Logo";
import { MenuDrawer, MobileHeader } from "./MobileHeader";

export function Header() {
  return (
    <>
      <DesktopHeader />
      <MobileHeader />
    </>
  );
}

function DesktopHeader() {
  const pathname = usePathname();
  const { openAuth } = useAuthModal();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 hidden bg-ink lg:block">
      <div className="container-page flex h-[76px] items-center justify-between gap-6">
        <Logo />
        <nav className="flex items-center gap-6 text-[14px] text-white/90" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap hover:text-white ${pathname === link.href ? "text-white font-medium" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-white"
              onClick={() => setCurrencyOpen((open) => !open)}
              aria-expanded={currencyOpen}
              aria-haspopup="listbox"
            >
              <span className="text-base leading-none" aria-hidden>
                🇮🇳
              </span>
              INR
              <span className="text-[10px]">▾</span>
            </button>
            {currencyOpen ? (
              <ul className="absolute right-0 mt-2 w-28 overflow-hidden rounded-xl border border-border bg-white py-1 text-sm shadow-lg" role="listbox">
                <li>
                  <button type="button" className="w-full px-3 py-2 text-left text-ink-soft hover:bg-mint" onClick={() => setCurrencyOpen(false)}>
                    INR
                  </button>
                </li>
              </ul>
            ) : null}
          </div>
          <button
            type="button"
            onClick={openAuth}
            className="rounded-full border border-white/80 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Login / Signup
          </button>
          <button
            type="button"
            className="rounded-md p-1 text-white"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      {menuOpen ? <MenuDrawer onClose={() => setMenuOpen(false)} /> : null}
    </header>
  );
}
