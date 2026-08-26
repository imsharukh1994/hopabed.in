"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useAuthModal } from "./AuthProvider";

export function AuthModal() {
  const { isOpen, closeAuth } = useAuthModal();
  const [mode, setMode] = useState<"login" | "signup">("login");

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
            <p className="mt-1 text-sm text-muted">Authentication will connect to Hopebed accounts soon.</p>
          </div>
          <button type="button" onClick={closeAuth} className="rounded-full p-1 text-muted hover:bg-canvas" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            closeAuth();
          }}
        >
          {mode === "signup" ? (
            <input className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" placeholder="Full name" />
          ) : null}
          <input className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" type="email" placeholder="Email" required />
          <input className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" type="password" placeholder="Password" required />
          <button type="submit" className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
            {mode === "login" ? "Continue" : "Sign up"}
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
