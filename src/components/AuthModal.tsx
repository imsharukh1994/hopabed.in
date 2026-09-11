"use client";

import { X, ArrowLeft, Mail, Phone, CheckCircle2 } from "lucide-react";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { authenticateWithGoogle, sendOtp, verifyOtp } from "@/lib/api";
import { useAuthModal } from "./AuthProvider";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number }) => void;
        };
      };
    };
  }
}

function maskIdentifier(type: "email" | "mobile", value: string): string {
  if (type === "email") {
    const [local, domain] = value.split("@");
    if (!local || !domain) return value;
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local[0]}${"*".repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
  } else {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 10) {
      const main = digits.slice(-10);
      return `+91 ${main.slice(0, 2)}*****${main.slice(-2)}`;
    }
    return value;
  }
}

export function AuthModal() {
  const { isOpen, isOwnerFlow, closeAuth, setSession } = useAuthModal();
  const router = useRouter();

  const [authMethod, setAuthMethod] = useState<"email" | "mobile">("email");
  const [step, setStep] = useState<"request_otp" | "verify_otp">("request_otp");
  
  const [emailInput, setEmailInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "790859697143-rc3tgtgejdhoeoaqi300nbbnbj4sjetq.apps.googleusercontent.com";

  // Existing Google OAuth Initialization (UNTOUCHED LOGIC & CONFIG)
  useEffect(() => {
    if (!isOpen || !googleReady || !googleClientId || !googleButtonRef.current || !window.google) return;

    googleButtonRef.current.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async ({ credential }) => {
        try {
          setError(null);
          const result = await authenticateWithGoogle(credential);
          setSession(result.data.token, result.data.user);
          closeAuth();
          if (isOwnerFlow) {
            router.push("/host");
          }
        } catch (authenticationError) {
          setError(authenticationError instanceof Error ? authenticationError.message : "Google sign-in failed.");
        }
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, { theme: "outline", size: "large", width: 360 });
  }, [closeAuth, googleClientId, googleReady, isOwnerFlow, isOpen, router, setSession]);

  // Resend Countdown Timer
  useEffect(() => {
    if (step !== "verify_otp" || resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setStep("request_otp");
      setError(null);
      setMessage(null);
      setOtpDigits(["", "", "", "", "", ""]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentIdentifier = authMethod === "email" ? emailInput.trim() : mobileInput.trim();

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    if (!currentIdentifier) {
      setError(`Please enter your ${authMethod === "email" ? "email address" : "mobile number"}.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await sendOtp({
        identifierType: authMethod,
        identifier: currentIdentifier,
      });
      setStep("verify_otp");
      setResendTimer(res.resendCooldownSeconds || 30);
      setMessage(res.message);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    const code = otpDigits.join("");
    if (code.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyOtp({
        identifierType: authMethod,
        identifier: currentIdentifier,
        otp: code,
        isOwnerFlow,
      });

      setSession(result.data.token, result.data.user);
      closeAuth();

      if (result.data.firstPropertyId) {
        router.push(`/host/properties/${result.data.firstPropertyId}/verification`);
      } else if (isOwnerFlow) {
        router.push("/host");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    // Handle paste of full 6-digit code
    if (cleanValue.length === 6) {
      const digits = cleanValue.split("");
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = cleanValue[cleanValue.length - 1];
    setOtpDigits(next);

    if (index < 5 && cleanValue) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 px-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-brand uppercase">HOPEBED</p>
            <h2 className="text-xl font-bold text-ink-soft">
              {isOwnerFlow ? "List Your Property" : "Welcome to Hopebed"}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {isOwnerFlow
                ? "Sign in or create an account to start listing your stay"
                : "Log in or sign up to manage stays and bookings"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuth}
            className="rounded-full p-1 text-muted transition hover:bg-canvas hover:text-ink-soft"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100" role="alert">
            {error}
          </div>
        )}
        {message && step === "verify_otp" && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1: REQUEST OTP */}
        {step === "request_otp" && (
          <>
            {/* EXISTING GOOGLE OAUTH PROVIDER (PROTECTED/LOCKED FEATURE - DO NOT TOUCH) */}
            {googleClientId ? (
              <>
                <Script
                  src="https://accounts.google.com/gsi/client"
                  strategy="afterInteractive"
                  onLoad={() => setGoogleReady(true)}
                />
                <div ref={googleButtonRef} className="mb-4 flex min-h-10 justify-center" />
                <div className="mb-4 flex items-center gap-3 text-xs text-muted">
                  <span className="h-px flex-1 bg-border" />
                  or
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            ) : null}

            {/* Email / Mobile Selector */}
            <div className="mb-4 flex rounded-xl bg-canvas p-1 text-xs font-semibold text-muted">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition ${
                  authMethod === "email" ? "bg-white text-ink-soft shadow-sm" : "hover:text-ink-soft"
                }`}
                onClick={() => {
                  setAuthMethod("email");
                  setError(null);
                }}
              >
                <Mail className="h-3.5 w-3.5" />
                Continue with Email
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition ${
                  authMethod === "mobile" ? "bg-white text-ink-soft shadow-sm" : "hover:text-ink-soft"
                }`}
                onClick={() => {
                  setAuthMethod("mobile");
                  setError(null);
                }}
              >
                <Phone className="h-3.5 w-3.5" />
                Continue with Mobile
              </button>
            </div>

            {/* Email or Mobile Input Form */}
            <form onSubmit={handleSendOtp} className="space-y-4">
              {authMethod === "email" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Email address</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Mobile number (+91)</label>
                  <div className="flex rounded-xl border border-border overflow-hidden focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                    <span className="flex items-center bg-canvas px-3 text-xs font-medium text-muted border-r border-border">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 text-sm outline-none"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {isSubmitting ? "Sending Code..." : "Send Verification OTP"}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === "verify_otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center">
              <p className="text-xs text-muted">Enter the 6-digit code sent to</p>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                {maskIdentifier(authMethod, currentIdentifier)}
              </p>
            </div>

            {/* 6-Digit OTP Inputs */}
            <div className="flex justify-center gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="h-12 w-11 rounded-xl border border-border text-center text-lg font-bold outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpDigits.join("").length < 6}
              className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify & Continue"}
            </button>

            {/* Resend & Change Identifier Actions */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("request_otp");
                  setError(null);
                  setMessage(null);
                }}
                className="inline-flex items-center gap-1 text-muted hover:text-ink-soft"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change {authMethod}
              </button>

              {resendTimer > 0 ? (
                <span className="text-muted">Resend code in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isSubmitting}
                  className="font-semibold text-brand hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
