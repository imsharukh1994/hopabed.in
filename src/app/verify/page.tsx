"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyAccount } from "@/lib/api";

interface VerificationResult {
  success: boolean;
  message: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setResult({ success: false, message: "Missing verification token." });
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
  }, [router]);

  if (loading) {
    return <p className="px-6 py-10 text-center">Verifying...</p>;
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      {result?.success ? (
        <>
          <h1 className="text-2xl font-bold text-green-600">Success!</h1>
          <p className="mt-4 text-muted">{result.message}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-white"
          >
            Go to Login
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
          <p className="mt-4 text-muted">{result?.message}</p>
        </>
      )}
    </div>
  );
}