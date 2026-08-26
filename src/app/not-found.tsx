import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function NotFound() {
  return (
    <PlaceholderPage
      title="Page not found"
      description="That page is not available yet."
      actionHref="/"
      actionLabel="Back to home"
    />
  );
}
