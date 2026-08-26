import { PlaceholderPage } from "@/components/PlaceholderPage";
import { getPropertyById } from "@/data/properties";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ stay?: string }>;
}) {
  const { stay } = await searchParams;
  const property = stay ? getPropertyById(stay) : undefined;

  return (
    <PlaceholderPage
      title="Payment"
      description={
        property
          ? `Payment for ${property.name} will be processed here once Hopebed payments are connected. No charge is made on this preview.`
          : "Secure payment checkout will appear here once Hopebed payments are connected. No charge is made on this preview."
      }
      actionHref="/bookings"
      actionLabel="View my bookings"
    />
  );
}
