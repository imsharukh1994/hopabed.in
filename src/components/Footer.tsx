import { Facebook, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

const COMPANY = [
  { href: "/about", label: "About Us" },
  { href: "/careers", label: "Careers" },
  { href: "/blog", label: "Blog" },
  { href: "/press", label: "Press" },
  { href: "/contact", label: "Contact Us" },
];

const SUPPORT = [
  { href: "/help", label: "Help Center" },
  { href: "/cancellation", label: "Cancellation Policy" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/sitemap", label: "Sitemap" },
];

const HOSTS = [
  { href: "/host", label: "List Your Property" },
  { href: "/host", label: "Host Login" },
  { href: "/host/resources", label: "Resources" },
  { href: "/host/pricing", label: "Pricing" },
  { href: "/host", label: "Host Support" },
];

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
            Hopebed is building a smarter way to find, book and verify stays in India.
          </p>
          <div className="mt-5 flex gap-3">
            <Social href="https://instagram.com" label="Instagram">
              <Instagram className="h-4 w-4" />
            </Social>
            <Social href="https://facebook.com" label="Facebook">
              <Facebook className="h-4 w-4" />
            </Social>
            <Social href="https://x.com" label="X">
              <span className="text-[13px] font-semibold">𝕏</span>
            </Social>
            <Social href="https://linkedin.com" label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </Social>
          </div>
        </div>
        <FooterColumn title="Company" links={COMPANY} />
        <FooterColumn title="Support" links={SUPPORT} />
        <FooterColumn title="For Hosts" links={HOSTS} />
        <div>
          <h3 className="mb-4 text-sm font-semibold">Download the app</h3>
          <Link
            href="/app"
            className="inline-flex w-fit items-center gap-2.5 rounded-lg bg-black px-3 py-2 text-white ring-1 ring-white/25"
            aria-label="Get it on Google Play"
          >
            <GooglePlayLogo />
            <span className="leading-tight">
              <span className="block text-[9px] uppercase tracking-wide text-white/70">Get it on</span>
              <span className="text-sm font-semibold">Google Play</span>
            </span>
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© Hopebed.in | All rights reserved</p>
          <p>Made with ♥ in India</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2.5 text-sm text-white/75">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Social({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white hover:border-white"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

function GooglePlayLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M3.18 20.82 13.4 12.3v-.6L3.18 3.18C2.86 3.5 2.7 3.96 2.7 4.54v14.92c0 .58.16 1.04.48 1.36Z" />
      <path fill="#FBBC04" d="m16.7 8.86-3.3 3.2v.6l3.3 3.2.08.04 3.9-2.22c1.12-.64 1.12-1.68 0-2.32l-3.9-2.22z" />
      <path fill="#34A853" d="M16.78 15.9 13.4 12.6 2.7 21.46c.38.4 1 .45 1.7.05L16.78 15.9Z" />
      <path fill="#EA4335" d="M16.78 8.1 4.4 1.5C3.7 1.1 3.08 1.16 2.7 1.54L13.4 11.4 16.78 8.1Z" />
    </svg>
  );
}
