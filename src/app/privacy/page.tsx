export default function PrivacyPolicyPage() {
  return (
    <div className="container-page max-w-4xl py-16">
      <h1 className="mb-4 text-4xl font-bold text-ink-soft">Privacy Policy</h1>
      <p className="mb-8 text-sm text-muted">Last updated: {new Date().toLocaleDateString("en-IN")}</p>

      <div className="prose prose-slate space-y-8 text-ink-soft">
        <section>
          <h2 className="text-xl font-bold text-ink-soft">1. Overview & Commitment to Privacy</h2>
          <p className="mt-2 leading-relaxed text-muted">
            At Hopebed (&ldquo;Hopebed Technologies&rdquo;), we are committed to maintaining a safe, transparent, and trustworthy marketplace for guests, hotel owners, PG operators, and homestay hosts. This Privacy Policy details how we collect, handle, verify, and protect user data and verification documents.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">2. Owner Identity & Government ID Verification</h2>
          <p className="mt-2 leading-relaxed text-muted">
            To ensure the authenticity of hosts on Hopebed, property owners and operators undergo identity verification using government-issued identification (Aadhaar, Passport, Driving Licence, or Voter ID) and PAN details.
          </p>
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-950">
            <p className="font-semibold">Zero Raw Aadhaar Storage Guarantee:</p>
            <p className="mt-1 text-xs leading-relaxed text-blue-900">
              Hopebed does <strong>NOT</strong> store raw Aadhaar numbers or raw Aadhaar card document images in our database or storage systems. Identity verification is conducted via compliant, authorized e-KYC verification providers. Hopebed retains strictly required verification metadata (such as verification status, provider reference, verified timestamp, document type, and masked identifiers).
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">3. Property Verification & Document Handling</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Property owners and authorized operators submit property verification documents (such as address proofs, registered lease agreements, owner NOCs, GST, or Shop & Establishment certificates) to verify premises legitimacy.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li><strong>Access Control:</strong> Uploaded property verification documents are stored in private, encrypted access-controlled storage.</li>
            <li><strong>Strict Privacy:</strong> Verification documents are accessible solely to authorized Hopebed compliance administrators and the property host. They are NEVER publicly accessible or exposed in public search APIs.</li>
            <li><strong>Badging:</strong> After successful compliance review, public users only see the &ldquo;✓ Verified Property&rdquo; badge.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">4. How We Protect Your Data</h2>
          <p className="mt-2 leading-relaxed text-muted">
            We implement robust administrative, technical, and physical security measures, including SSL/TLS encryption in transit, strict server-side authorization checks, role-based access control, and tokenized session management.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink-soft">5. Contact Compliance Team</h2>
          <p className="mt-2 leading-relaxed text-muted">
            If you have questions regarding identity verification, document privacy, or data protection rights, please contact our Compliance Officer at <a href="mailto:privacy@hopebed.in" className="text-brand font-semibold hover:underline">privacy@hopebed.in</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
