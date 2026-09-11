export default function CancellationPage() {
  return (
    <div className="container-page max-w-4xl py-16">
      <h1 className="mb-4 text-4xl font-bold text-ink-soft">Cancellation Policy</h1>
      <p className="mb-8 text-sm text-muted">Last updated: {new Date().toLocaleDateString("en-IN")}</p>

      <div className="prose prose-slate space-y-8 text-ink-soft">
        <section>
          <h2 className="text-xl font-bold text-ink-soft">Standard Cancellation</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Guests can cancel their reservations free of charge up to 48 hours before the scheduled check-in time. For cancellations made within 48 hours of check-in, a cancellation fee equivalent to the first night&apos;s stay will be deducted from the refund.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">Non-Refundable Rates</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Certain promotional rates or special offers may be marked as non-refundable. For these bookings, no refunds will be issued upon cancellation. Please verify the rate conditions before finalizing your booking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">No-Shows</h2>
          <p className="mt-2 leading-relaxed text-muted">
            If a guest fails to arrive by midnight on the check-in date without prior notice, it will be considered a no-show. In such cases, the entire booking amount will be forfeited, and the reservation will be cancelled.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">Refund Processing</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Approved refunds will be processed to the original payment method within 5-7 business days. We utilize Razorpay for all transaction processing; exact timelines may vary depending on your bank or credit card issuer.
          </p>
        </section>
      </div>
    </div>
  );
}
