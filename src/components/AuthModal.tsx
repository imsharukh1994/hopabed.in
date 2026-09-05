"use client";

import { X } from "lucide-react";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { authenticateWithGoogle, authenticateWithPassword } from "@/lib/api";
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

export function AuthModal() {
  const { isOpen, closeAuth, setSession } = useAuthModal();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
          router.push("/");
        } catch (authenticationError) {
          setError(authenticationError instanceof Error ? authenticationError.message : "Google sign-in failed.");
        }
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, { theme: "outline", size: "large", width: 360 });
  }, [closeAuth, googleClientId, googleReady, isOpen, router, setSession]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 px-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-brand">Hopebed</p>
            <h2 className="text-xl font-semibold text-ink-soft">
              {mode === "login" ? "Login" : "Create an account"}
            </h2>
            <p className="mt-1 text-sm text-muted">Use your Google account or Hopebed credentials.</p>
          </div>
          <button type="button" onClick={closeAuth} className="rounded-full p-1 text-muted hover:bg-canvas" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {googleClientId ? (
          <>
            <Script
              src="https://accounts.google.com/gsi/client"
              strategy="afterInteractive"
              onLoad={() => setGoogleReady(true)}
            />
            <div ref={googleButtonRef} className="mb-4 flex min-h-10 justify-center" />
            <div className="mb-4 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          </>
        ) : null}
        {error ? <p className="mb-3 text-sm text-red-600" role="alert">{error}</p> : null}
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setError(null);
            const formData = new FormData(event.currentTarget);
            try {
              const result = await authenticateWithPassword({
                mode,
                name: formData.get("name")?.toString(),
                email: formData.get("email")?.toString() ?? "",
                password: formData.get("password")?.toString() ?? "",
              });
              setSession(result.data.token, result.data.user);
              closeAuth();
              router.push("/");
            } catch (authenticationError) {
              setError(authenticationError instanceof Error ? authenticationError.message : "Authentication failed.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {mode === "signup" ? (
            <input name="name" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" placeholder="Full name" required />
          ) : null}
          <input name="email" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" type="email" placeholder="Email" required />
          <input name="password" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" type="password" placeholder="Password" minLength={8} required />
          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {isSubmitting ? "Please wait..." : mode === "login" ? "Continue" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          className="mt-4 w-full text-sm text-muted"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
