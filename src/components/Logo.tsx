import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  compact?: boolean;
  inverted?: boolean;
};

export function Logo({ compact = false, inverted = true }: LogoProps) {
  const name = inverted ? "text-white" : "text-ink-soft";
  const stay = inverted ? "text-white" : "text-ink-soft";
  const size = compact ? 36 : 44;

  return (
    <Link href="/" className="flex items-center gap-2.5 min-w-0" aria-label="Hopebed home">
      <Image
        src="/brand/hopebed-icon.jpg"
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-[11px] object-cover"
        priority
      />
      <span className="min-w-0 leading-tight">
        <span className={`block font-bold tracking-tight ${compact ? "text-[17px]" : "text-[22px]"} ${name}`}>
          Hope<span className="text-brand">bed</span>
        </span>
        <span className={`block whitespace-nowrap text-[11px] font-medium ${compact ? "hidden sm:block" : ""}`}>
          <span className={stay}>Stay </span>
          <span className="text-brand">Smart.</span>
          <span className={stay}> Stay </span>
          <span className="text-brand">Verified.</span>
        </span>
      </span>
    </Link>
  );
}
