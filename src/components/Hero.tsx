import Image from "next/image";
import { SearchBar } from "./SearchBar";

const HERO_IMAGE = "/hero-bg.png";

export function Hero() {
  return (
    <section className="relative bg-white pb-8">
      <div className="relative overflow-hidden h-[500px] lg:h-[600px]">
        <Image
          src={HERO_IMAGE}
          alt="Premium stay with mountain views"
          fill
          priority
          className="object-cover blur-[2px] scale-[1.02]"
          sizes="100vw"
        />
        {/* Lighter, premium gradient overlay */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        
        <div className="relative flex h-full items-center justify-center text-center">
          <div className="container-page pb-20 pt-10">
            <p className="mb-4 inline-flex items-center justify-center font-semibold uppercase tracking-[0.2em] text-white shadow-sm text-xs">
              Stays Made Simple
            </p>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl text-shadow-sm">
              Find your perfect stay in India.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-white/95 text-shadow-sm sm:text-xl">
              Discover verified hotels, villas, apartments and homestays for every kind of trip.
            </p>
          </div>
        </div>
      </div>
      
      <div className="relative z-20 -mt-24 px-4 sm:-mt-28 lg:-mt-32">
        <div className="mx-auto flex max-w-[1000px] flex-col items-center">
          <div className="w-full rounded-[32px] bg-white p-2 sm:p-3 shadow-2xl">
            <SearchBar />
          </div>
        </div>
      </div>
    </section>
  );
}
