import Image from "next/image";
import Link from "next/link";

const DESTINATIONS = [
  {
    name: "Goa",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80",
    properties: "1,240+ properties",
  },
  {
    name: "Mumbai",
    image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=600&q=80",
    properties: "850+ properties",
  },
  {
    name: "Delhi",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80",
    properties: "920+ properties",
  },
  {
    name: "Bengaluru",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80",
    properties: "630+ properties",
  },
  {
    name: "Jaipur",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80",
    properties: "410+ properties",
  },
];

export function DestinationsSection() {
  return (
    <section className="bg-canvas py-12 sm:py-16">
      <div className="container-page">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-ink-soft sm:text-3xl">Explore India</h2>
          <p className="mt-2 text-muted">These popular destinations have a lot to offer</p>
        </div>
        
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 no-scrollbar snap-x sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:overflow-visible">
          {DESTINATIONS.map((dest) => (
            <Link
              key={dest.name}
              href={`/search?destination=${dest.name}`}
              className="group relative min-w-[200px] snap-start overflow-hidden rounded-2xl sm:min-w-0"
            >
              <div className="aspect-[4/5] w-full">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 200px, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
              </div>
              <div className="absolute bottom-0 left-0 p-5 text-white">
                <h3 className="text-xl font-bold text-shadow-sm">{dest.name}</h3>
                <p className="mt-1 text-sm font-medium text-white/90">{dest.properties}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
