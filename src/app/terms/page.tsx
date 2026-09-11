export default function TermsPage() {
  return (
    <div className="container-page max-w-4xl py-16">
      <h1 className="mb-4 text-4xl font-bold text-ink-soft">Terms of Service</h1>
      <p className="mb-8 text-sm text-muted">Last updated: {new Date().toLocaleDateString("en-IN")}</p>

      <div className="prose prose-slate space-y-8 text-ink-soft">
        <section>
          <h2 className="text-xl font-bold text-ink-soft">1. Acceptance of Terms</h2>
          <p className="mt-2 leading-relaxed text-muted">
            By accessing or using the Hopebed platform (&ldquo;Hopebed&rdquo;), whether as a guest or property owner/host, you agree to be bound by these Terms of Service. If you do not agree, you must discontinue platform usage.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">2. Guest Bookings & Payments</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Bookings are subject to room availability. Payments are processed securely via Razorpay payment gateway. Upon successful payment verification, a digital QR Stay Pass is issued to the guest for check-in.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">3. Host Obligations & Verification</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Property owners and operators listing Hotels, PGs, Hostels, Villas, or Homestays must provide accurate property information and undergo identity (Aadhaar/PAN) and property document verification. Only verified listings approved by Hopebed compliance administrators receive the &ldquo;Verified Property&rdquo; status and become eligible for public booking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">4. Cancellations & Refunds</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Cancellations are governed by the property policy specified during booking. Eligible refunds are dispatched back to the original payment source in accordance with standard payment gateway operating timelines.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">5. Marketplace Responsibilities</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Hopebed serves as a technology marketplace connecting guests with verified stay providers. Hosts maintain operational responsibility for on-premises safety, room maintenance, and local regulations compliance.
          </p>
        </section>
      </div>
    </div>
  );
}
