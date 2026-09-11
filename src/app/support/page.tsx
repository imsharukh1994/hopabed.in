import Link from "next/link";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="container-page py-16 max-w-5xl">
      <h1 className="mb-4 text-4xl font-bold text-ink-soft">Support & Contact</h1>
      <p className="mb-12 text-lg text-muted">We&apos;re here to help you 24/7 with your bookings or hosting inquiries.</p>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-ink-soft">Get in touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-soft">Phone Support</h3>
                  <p className="mt-1 text-sm text-muted">Available 24/7 for urgent issues</p>
                  <a href="tel:+918000000000" className="mt-2 inline-block font-semibold text-brand hover:underline">+91 8000 000 000</a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-soft">Email</h3>
                  <p className="mt-1 text-sm text-muted">We&apos;ll respond within 24 hours</p>
                  <a href="mailto:support@hopebed.in" className="mt-2 inline-block font-semibold text-brand hover:underline">support@hopebed.in</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-soft">Office</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Hopebed Headquarters<br />
                    Navi Mumbai, Maharashtra, India
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-ink-soft">Send us a message</h2>
          <form className="space-y-5" action={() => { /* Server action or api endpoint for contact form */ }}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-soft">First Name</label>
                <input type="text" className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-ink-soft focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" placeholder="John" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-soft">Last Name</label>
                <input type="text" className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-ink-soft focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" placeholder="Doe" required />
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink-soft">Email</label>
              <input type="email" className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-ink-soft focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" placeholder="john@example.com" required />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink-soft">Subject</label>
              <select className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-ink-soft focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" required>
                <option value="">Select a topic...</option>
                <option value="booking">Booking Inquiry</option>
                <option value="hosting">Hosting & Listing</option>
                <option value="payment">Payment Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink-soft">Message</label>
              <textarea rows={5} className="w-full resize-none rounded-xl border border-border bg-canvas px-4 py-3 text-ink-soft focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" placeholder="How can we help you?" required></textarea>
            </div>
            
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 font-bold text-white transition hover:bg-brand-dark">
              <Send className="h-4 w-4" />
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
