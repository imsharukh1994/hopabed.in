import Link from "next/link";

export function PlaceholderPage({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="container-page py-16">
      <p className="text-sm font-medium text-brand">Hopebed</p>
      <h1 className="mt-2 text-3xl font-bold text-ink-soft">{title}</h1>
      <p className="mt-3 max-w-xl text-muted">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-6 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
