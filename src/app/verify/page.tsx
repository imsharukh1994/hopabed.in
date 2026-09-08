"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/AuthProvider";
import { verifyBookingPass } from "@/lib/api";
import { CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("b");
  const { user } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "host" || !bookingId) return;

    setLoading(true);
    verifyBookingPass(bookingId)
      .then(res => setResult(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, bookingId]);

  if (!bookingId) {
    return (
      <div className="container-page py-20 text-center">
        <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-orange-500" />
        <h1 className="mb-2 text-2xl font-bold">Invalid QR Code</h1>
        <p className="text-muted">This QR code does not contain a valid Stay Pass.</p>
      </div>
    );
  }

  if (!user || user.role !== "host") {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold">Host Verification Required</h1>
        <p className="text-muted">You must be logged in as a host to verify a Stay Pass.</p>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white text-center shadow-lg">
        <div className="bg-canvas py-8">
          <ShieldCheck className="mx-auto h-16 w-16 text-brand" />
        </div>
        <div className="p-8">
          <h1 className="mb-6 text-2xl font-bold text-ink">Stay Pass Verification</h1>
          
          {loading ? (
            <div className="flex animate-pulse flex-col gap-3">
              <div className="h-6 w-3/4 self-center rounded-lg bg-gray-200"></div>
              <div className="h-4 w-1/2 self-center rounded-lg bg-gray-200"></div>
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 p-6 text-red-600">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : result ? (
            <div className="rounded-2xl bg-green-50 p-6 text-green-700">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h2 className="mb-2 text-xl font-bold">Guest Checked In!</h2>
              <p className="mb-4 text-sm font-medium text-green-800">
                {result.guest?.name} has been successfully verified.
              </p>
              <div className="rounded-xl border border-green-200 bg-white p-4 text-left text-sm text-ink-soft">
                <p><strong>Property:</strong> {result.property?.title || "Property"}</p>
                <p><strong>Dates:</strong> {new Date(result.checkIn).toLocaleDateString()} to {new Date(result.checkOut).toLocaleDateString()}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
