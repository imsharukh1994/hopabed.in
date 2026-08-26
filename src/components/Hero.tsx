import { Headphones, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { SearchBar } from "./SearchBar";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=2000&q=80";

export function Hero() {
  return (
    <section className="relative bg-ink">
      <div className="relative overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Premium stay with mountain views"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-ink/20" />
        <div className="relative container-page pb-24 pt-16 sm:pt-20 lg:pb-28 lg:pt-[88px]">
          <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
            Launching Soon — Verified Stays
          </p>
          <h1 className="max-w-2xl text-[34px] font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[56px]">
            Find, Book & Verify
            <span className="mt-1 block">
              <span className="text-brand">Verified Stays</span> in India.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/90 sm:text-base">
            Hotels, Villas, Apartments, Homestays and more — for every kind of journey.
          </p>
          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-white">
            <HeroBadge icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Verified Stays" />
            <HeroBadge icon={<Lock className="h-3.5 w-3.5" />} label="Secure Booking" />
            <HeroBadge icon={<Headphones className="h-3.5 w-3.5" />} label="24/7 Support" />
          </ul>
        </div>
      </div>
      <div className="relative z-20 -mt-12 px-4 sm:-mt-14 lg:-mt-16">
        <SearchBar />
      </div>
    </section>
  );
}

function HeroBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">{icon}</span>
      {label}
    </li>
  );
}
