import { stayTypes } from "@/data/stayTypes";
import Image from "next/image";
import Link from "next/link";

export function StayTypeCard({
  title,
  description,
  image,
  href,
}: {
  title: string;
  description: string;
  image: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group min-w-[240px] snap-start flex flex-col gap-3 lg:min-w-0"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-sm transition-all duration-300 group-hover:shadow-md">
        <Image 
          src={image} 
          alt={title} 
          fill 
          className="object-cover transition-transform duration-500 group-hover:scale-105" 
          sizes="(max-width: 768px) 240px, 20vw" 
        />
      </div>
      <div>
        <h3 className="text-lg font-bold text-ink-soft transition-colors group-hover:text-brand">{title}</h3>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </Link>
  );
}

export function StayTypeSection() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="container-page">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-ink-soft sm:text-3xl">Find the right stay for your trip</h2>
          <p className="mt-2 text-muted">Choose from verified properties across India.</p>
        </div>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 no-scrollbar snap-x sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5">
          {stayTypes.map((type) => (
            <StayTypeCard key={type.id} {...type} />
          ))}
        </div>
      </div>
    </section>
  );
}
