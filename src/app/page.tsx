import { Hero } from "@/components/Hero";
import { TrustSection } from "@/components/TrustSection";
import { StayTypeSection } from "@/components/StayTypeSection";
import { DestinationsSection } from "@/components/DestinationsSection";
import { PropertySection } from "@/components/PropertySection";
import { HostBanner } from "@/components/HostBanner";

export default function HomePage() {
  return (
    <main className="bg-white">
      <Hero />
      <TrustSection />
      <StayTypeSection />
      <DestinationsSection />
      <PropertySection />
      <HostBanner />
    </main>
  );
}
