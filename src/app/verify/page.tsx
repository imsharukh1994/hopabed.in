"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyAccount, verifyBookingPass } from "@/lib/api";
import { useAuthModal } from "@/components/AuthProvider";
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface VerificationResult {
  success: boolean;
  message: string;
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthModal();

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Stay Pass verification state
  const [bookingIdInput, setBookingIdInput] = useState("");
  const [verifyingPass, setVerifyingPass] = useState(false);
  const [passResult, setPassResult] = useState<{ success: boolean; message: string; booking?: Record<string, unknown> } | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const bookingIdParam = searchParams.get("bookingId");

    if (bookingIdParam) {
      setBookingIdInput(bookingIdParam);
      verifyBookingPass(bookingIdParam)
        .then((bookingData) => {
          setPassResult({
            success: true,
            message: "Stay Pass Verified! Guest checked in successfully.",
            booking: bookingData as Record<string, unknown>,
          });
        })
        .catch((err: unknown) => {
          setPassResult({
            success: false,
            message: err instanceof Error ? err.message : "Failed to verify Stay Pass. Ensure booking is confirmed & paid.",
          });
        })
        .finally(() => setLoading(false));
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    verifyAccount(token)
      .then((data) => {
        setResult(data as VerificationResult);
      })
      .catch(() => {
        setResult({ success: false, message: "Verification failed." });
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleVerifyStayPass = async (bId?: string) => {
    const idToVerify = bId || bookingIdInput.trim();
    if (!idToVerify) return;

    setVerifyingPass(true);
    setPassResult(null);
    try {
      const bookingData = await verifyBookingPass(idToVerify);
      setPassResult({
        success: true,
        message: "Stay Pass Verified! Guest checked in successfully.",
        booking: bookingData as Record<string, unknown>,
      });
    } catch (err: unknown) {
      setPassResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to verify Stay Pass. Ensure booking is confirmed & paid.",
      });
    } finally {
      setVerifyingPass(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="mt-4 text-muted font-medium">Verifying...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      {result ? (
        <div className="text-center rounded-3xl border border-border bg-white p-8 shadow-sm">
          {result.success ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h1 className="mt-4 text-2xl font-bold text-ink-soft">Account Verified!</h1>
              <p className="mt-2 text-muted">{result.message}</p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark"
              >
                Go to Home
              </button>
            </>
          ) : (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h1 className="mt-4 text-2xl font-bold text-ink-soft">Verification Failed</h1>
              <p className="mt-2 text-muted">{result.message}</p>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-brand/10 p-3 text-brand">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-soft">Stay Pass Verification</h1>
              <p className="text-xs text-muted">Verify guest check-in & QR Stay Passes</p>
            </div>
          </div>

          {passResult && (
            <div className={`mb-6 rounded-2xl p-4 text-sm ${
              passResult.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <p className="font-semibold">{passResult.message}</p>
              {passResult.booking && (
                <div className="mt-3 space-y-1 text-xs text-green-900 border-t border-green-200 pt-2">
                  <p><strong>Booking ID:</strong> {String(passResult.booking._id || passResult.booking.id || "")}</p>
                  <p><strong>Status:</strong> {String(passResult.booking.status || "")}</p>
                  <p><strong>Payment Status:</strong> {String(passResult.booking.paymentStatus || "")}</p>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyStayPass();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Enter Booking ID / Scan Data
              </label>
              <input
                type="text"
                value={bookingIdInput}
                onChange={(e) => setBookingIdInput(e.target.value)}
                placeholder="e.g. 660f1b2c3d4e5f6a7b8c9d0e"
                className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={verifyingPass || !bookingIdInput.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              {verifyingPass ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Guest Check-in"
              )}
            </button>
          </form>

          {!user && (
            <p className="mt-4 text-center text-xs text-muted">
              Note: Host or Admin login is required to complete Stay Pass check-ins.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="mt-4 text-muted font-medium">Loading verification...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}