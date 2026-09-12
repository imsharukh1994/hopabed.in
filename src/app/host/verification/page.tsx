"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Building,
  Check,
  Loader2,
} from "lucide-react";
import { useAuthModal } from "@/components/AuthProvider";
import {
  getHostVerification,
  updateHostInfo,
  verifyOwnerIdentity,
  verifyOwnerPAN,
  submitHostVerification,
} from "@/lib/api";

interface HostVerificationState {
  isHost: boolean;
  hostId?: string;
  fullName: string;
  dob?: string | null;
  phone: string;
  email: string;
  address: string;
  governmentIdType?: string;
  governmentIdStatus: string;
  panStatus: string;
  panNumberMasked?: string;
  panName?: string;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected" | "suspended" | "failed";
  submittedAt?: string;
  verifiedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  verificationNotes?: string;
}

export default function HostVerificationPage() {
  const { user } = useAuthModal();

  const [verif, setVerif] = useState<HostVerificationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [verifyingGovId, setVerifyingGovId] = useState(false);
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Personal Info Form State
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Gov ID & PAN Form State
  const [idType, setIdType] = useState<"aadhaar" | "passport" | "driving_licence" | "voter_id">("aadhaar");
  const [panNumber, setPanNumber] = useState("");
  const [panName, setPanName] = useState("");

  const loadVerification = async () => {
    setLoading(true);
    try {
      const data = (await getHostVerification()) as unknown as HostVerificationState;
      setVerif(data);
      setFullName(data.fullName || user?.name || "");
      setPhone(data.phone || (user as { phone?: string })?.phone || "");
      setEmail(data.email || user?.email || "");
      setAddress(data.address || "");
      if (data.dob) setDob(data.dob.slice(0, 10));
      if (data.governmentIdType) setIdType(data.governmentIdType as any);
      if (data.panName) setPanName(data.panName);
    } catch (err: unknown) {
      console.error("Failed to load verification:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadVerification();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await updateHostInfo({ fullName, dob, phone, email, address });
      setSuccessMsg("Personal information saved successfully.");
      await loadVerification();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save personal info.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleVerifyGovId = async () => {
    setVerifyingGovId(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await verifyOwnerIdentity(idType);
      setSuccessMsg("Government identity document verified successfully.");
      await loadVerification();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to verify government ID.");
    } finally {
      setVerifyingGovId(false);
    }
  };

  const handleVerifyPan = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingPan(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await verifyOwnerPAN({ panNumber, panName });
      setSuccessMsg("PAN details verified successfully.");
      await loadVerification();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to verify PAN.");
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await submitHostVerification();
      setSuccessMsg("Host verification application submitted for admin review.");
      await loadVerification();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center text-muted">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-brand" />
        Loading verification portal...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-ink-soft">Host Verification</h1>
        <p className="mb-8 text-muted">Please log in to submit or view your host identity verification status.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const status = verif?.verificationStatus || "unverified";
  const isPending = status === "pending";
  const isVerified = status === "verified";
  const isRejected = status === "rejected";
  const isSuspended = status === "suspended";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand">
            <ShieldCheck className="h-4 w-4" />
            Identity & Compliance
          </div>
          <h1 className="text-3xl font-bold text-ink-soft mt-1">Host Verification System</h1>
          <p className="text-sm text-muted">Verify your personal identity and KYC details to host stays on Hopebed.</p>
        </div>

        <Link
          href="/host"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-canvas"
        >
          ← Host Dashboard
        </Link>
      </div>

      {/* Status Banner */}
      <div className="mb-10">
        {isVerified ? (
          <div className="rounded-2xl border border-green-300 bg-green-50 p-6 text-green-900 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">✓ Host Account Verified</h2>
                  <span className="rounded-full bg-green-200 px-3 py-0.5 text-xs font-bold text-green-900">VERIFIED</span>
                </div>
                <p className="mt-1 text-sm text-green-800">
                  Your identity has been fully verified by Hopebed Trust & Safety team. You can now submit properties for property verification and list stays on the marketplace.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/host/properties/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-800"
                  >
                    <Building className="h-4 w-4" /> Create & Submit Property
                  </Link>
                  <Link
                    href="/host"
                    className="inline-flex items-center gap-2 rounded-xl border border-green-300 bg-white px-4 py-2 text-xs font-semibold text-green-900 hover:bg-green-100"
                  >
                    View Properties
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : isPending ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Verification Pending Admin Review</h2>
                  <span className="rounded-full bg-amber-200 px-3 py-0.5 text-xs font-bold text-amber-900">UNDER REVIEW</span>
                </div>
                <p className="mt-1 text-sm text-amber-800">
                  Your host identity verification application is under review by Hopebed compliance managers. Submissions are usually processed within 24 hours.
                </p>
                {verif?.submittedAt && (
                  <p className="mt-2 text-xs text-amber-700 font-medium">
                    Submitted on: {new Date(verif.submittedAt).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : isRejected ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-900 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Verification Rejected</h2>
                  <span className="rounded-full bg-red-200 px-3 py-0.5 text-xs font-bold text-red-900">REJECTED</span>
                </div>
                {verif?.rejectionReason && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-white p-3 text-xs text-red-800">
                    <span className="font-bold">Reason for Rejection:</span> &ldquo;{verif.rejectionReason}&rdquo;
                  </div>
                )}
                <p className="mt-3 text-sm text-red-800">
                  Please update your personal details and complete the required identity verification below before resubmitting.
                </p>
              </div>
            </div>
          </div>
        ) : isSuspended ? (
          <div className="rounded-2xl border border-gray-400 bg-gray-900 p-6 text-white shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Host Account Suspended</h2>
                  <span className="rounded-full bg-red-800 px-3 py-0.5 text-xs font-bold text-white">SUSPENDED</span>
                </div>
                {verif?.rejectionReason && (
                  <p className="mt-2 text-sm text-gray-300">
                    Reason: &ldquo;{verif.rejectionReason}&rdquo;
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  Please contact Hopebed Trust & Safety support at support@hopebed.in for dispute resolutions.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 text-blue-950 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Complete Host Verification</h2>
                <p className="mt-1 text-sm text-blue-900">
                  Follow the steps below to complete your personal information, Government ID verification, and PAN verification to submit your application for review.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-100 p-4 text-sm font-medium text-red-800 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-green-100 p-4 text-sm font-medium text-green-800 border border-green-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          {successMsg}
        </div>
      )}

      {/* Verification Steps Grid */}
      <div className="grid gap-8">
        {/* Step 1: Personal & Contact Information */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
                1
              </div>
              <div>
                <h3 className="font-bold text-ink-soft">Personal & Contact Information</h3>
                <p className="text-xs text-muted">Legal full name, DOB, phone, email, and address.</p>
              </div>
            </div>
            {verif?.fullName && verif?.address ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                <Check className="h-3.5 w-3.5" /> Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                Incomplete
              </span>
            )}
          </div>

          <form onSubmit={handleSavePersonalInfo} className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                disabled={isPending || isVerified || isSuspended}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Shaharukh Mithagari"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none disabled:bg-canvas"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Date of Birth</label>
              <input
                type="date"
                disabled={isPending || isVerified || isSuspended}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none disabled:bg-canvas"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Phone Number</label>
              <input
                type="text"
                disabled={isPending || isVerified || isSuspended}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none disabled:bg-canvas"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Email Address</label>
              <input
                type="email"
                disabled={isPending || isVerified || isSuspended}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="host@example.com"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none disabled:bg-canvas"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-ink-soft mb-1">Full Residential / Business Address *</label>
              <textarea
                required
                rows={2}
                disabled={isPending || isVerified || isSuspended}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete street address, city, state, pin code"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none disabled:bg-canvas"
              />
            </div>

            {(!isPending && !isVerified && !isSuspended) && (
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-70"
                >
                  {savingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Personal Details"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Step 2: Primary Government ID Verification */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
                2
              </div>
              <div>
                <h3 className="font-bold text-ink-soft">Primary Government ID (e-KYC)</h3>
                <p className="text-xs text-muted">Verification status for Aadhaar / Passport / Driving Licence / Voter ID.</p>
              </div>
            </div>
            {verif?.governmentIdStatus === "verified" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                Pending
              </span>
            )}
          </div>

          {verif?.governmentIdStatus === "verified" ? (
            <div className="rounded-xl bg-canvas p-4 text-xs font-medium text-ink-soft flex items-center justify-between">
              <div>
                <span className="text-muted uppercase font-semibold block mb-0.5">Government ID Type</span>
                <span className="font-bold uppercase text-brand">{verif.governmentIdType}</span>
              </div>
              <span className="text-green-700 font-semibold flex items-center gap-1">
                <Check className="h-4 w-4" /> e-KYC Verified
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-ink-soft mb-1">Select Government Identity Document *</label>
                <select
                  disabled={isPending || isVerified || isSuspended || verifyingGovId}
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as any)}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none disabled:bg-canvas"
                >
                  <option value="aadhaar">Aadhaar Card (India e-KYC)</option>
                  <option value="passport">Passport</option>
                  <option value="driving_licence">Driving Licence</option>
                  <option value="voter_id">Voter ID Card</option>
                </select>
              </div>

              {(!isPending && !isVerified && !isSuspended) && (
                <button
                  type="button"
                  onClick={handleVerifyGovId}
                  disabled={verifyingGovId}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                >
                  {verifyingGovId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Gov ID"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step 3: PAN Verification */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
                3
              </div>
              <div>
                <h3 className="font-bold text-ink-soft">PAN Verification</h3>
                <p className="text-xs text-muted">Mandatory 10-character PAN number verification.</p>
              </div>
            </div>
            {verif?.panStatus === "verified" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                Pending
              </span>
            )}
          </div>

          {verif?.panStatus === "verified" ? (
            <div className="rounded-xl bg-canvas p-4 text-xs font-medium text-ink-soft grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-muted uppercase font-semibold block mb-0.5">Masked PAN</span>
                <span className="font-bold font-mono text-sm text-ink-soft">{verif.panNumberMasked}</span>
              </div>
              <div>
                <span className="text-muted uppercase font-semibold block mb-0.5">PAN Name</span>
                <span className="font-bold text-ink-soft">{verif.panName}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyPan} className="grid gap-4 sm:grid-cols-2 items-end">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">PAN Number *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  disabled={isPending || isVerified || isSuspended || verifyingPan}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-mono uppercase focus:border-brand focus:outline-none disabled:bg-canvas"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">PAN Card Holder Name *</label>
                <input
                  type="text"
                  required
                  disabled={isPending || isVerified || isSuspended || verifyingPan}
                  value={panName}
                  onChange={(e) => setPanName(e.target.value)}
                  placeholder="Name as printed on PAN card"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none disabled:bg-canvas"
                />
              </div>

              {(!isPending && !isVerified && !isSuspended) && (
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={verifyingPan}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                  >
                    {verifyingPan ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify PAN"}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Step 4: Submission */}
        {(!isPending && !isVerified && !isSuspended) && (
          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6 text-center">
            <h3 className="text-lg font-bold text-ink-soft mb-1">Submit Application for Review</h3>
            <p className="text-xs text-muted max-w-xl mx-auto mb-6">
              Once personal details, Government ID e-KYC, and PAN verification steps are complete, submit your host verification application for admin approval.
            </p>

            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3 font-semibold text-white shadow-md transition hover:bg-brand-dark disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" /> Submit Host Verification
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
