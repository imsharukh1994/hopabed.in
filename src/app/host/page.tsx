"use client";

import { useState } from "react";
import { useAuthModal } from "@/components/AuthProvider";
import { registerHost } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function HostPage() {
  const { user, openAuth, setSession } = useAuthModal();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-ink">Become a Host</h1>
        <p className="mb-8 text-muted">You must be logged in to register as a host.</p>
        <button
          onClick={openAuth}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Login to Continue
        </button>
      </div>
    );
  }

  if (user.role === "host" || user.role === "admin") {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-ink">Host Dashboard</h1>
        <p className="mb-8 text-muted">Welcome back, {user.name}! Your dashboard is being built.</p>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-12 sm:py-20">
      <h1 className="mb-2 text-3xl font-bold text-ink">Become a Host</h1>
      <p className="mb-8 text-muted">List your property on Hopebed and start earning today.</p>

      {error ? (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setIsSubmitting(true);
          setError(null);
          const formData = new FormData(e.currentTarget);
          try {
            const result = await registerHost({
              businessName: formData.get("businessName")?.toString(),
              bio: formData.get("bio")?.toString(),
            });
            const token = localStorage.getItem("hopebed_access_token");
            if (token) setSession(token, result.user);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to register as host.");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div>
          <label htmlFor="businessName" className="mb-2 block text-sm font-medium text-ink-soft">
            Business or Property Name (Optional)
          </label>
          <input
            id="businessName"
            name="businessName"
            className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="e.g. Hopebed Residency"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-2 block text-sm font-medium text-ink-soft">
            About You or Your Business
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Tell guests a bit about yourself..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand py-3.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
        >
          {isSubmitting ? "Registering..." : "Register as Host"}
        </button>
      </form>
    </div>
  );
}
