import { Hero } from "@/components/Hero";
import { HostBanner } from "@/components/HostBanner";
import { PropertySection } from "@/components/PropertySection";
import { StayTypeSection } from "@/components/StayTypeSection";
import { TrustSection } from "@/components/TrustSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StayTypeSection />
      <PropertySection />
      <TrustSection />
      <HostBanner />
    </>
  );
}
