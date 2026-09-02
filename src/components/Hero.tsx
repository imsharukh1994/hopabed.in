import { Headphones, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { SearchBar } from "./SearchBar";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=2000&q=80";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#07100c]">
      <div className="relative overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Premium stay with mountain views"
          fill
          priority
          className="object-cover opacity-90"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07100c] via-[#07100c]/80 to-[#07100c]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_30%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7fbf8] to-transparent" />
        <div className="relative container-page pb-28 pt-16 sm:pt-20 lg:pb-32 lg:pt-[90px]">
          <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/7 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
            Launching Soon — Verified Stays
          </p>
          <h1 className="max-w-2xl text-[32px] font-bold leading-[1.06] tracking-[-0.05em] text-white sm:text-5xl lg:text-[58px]">
            Find, Book & Verify
            <span className="mt-2 block">
              <span className="text-brand">Verified Stays</span> in India.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
            Hotels, villas, apartments, homestays and more — thoughtfully curated for trips that feel easy from start to finish.
          </p>
          <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-white/90">
            <HeroBadge icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Verified Stays" />
            <HeroBadge icon={<Lock className="h-3.5 w-3.5" />} label="Secure Booking" />
            <HeroBadge icon={<Headphones className="h-3.5 w-3.5" />} label="24/7 Support" />
          </ul>
        </div>
      </div>
      <div className="relative z-20 -mt-12 px-4 sm:-mt-14 lg:-mt-16">
        <div className="mx-auto max-w-[1120px] rounded-[28px] border border-black/5 bg-white/95 p-1 shadow-[0_24px_60px_rgba(7,16,12,0.18)] backdrop-blur-sm">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}

function HeroBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-2.5 py-1.5 backdrop-blur-sm">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow-sm">{icon}</span>
      {label}
    </li>
  );
}
