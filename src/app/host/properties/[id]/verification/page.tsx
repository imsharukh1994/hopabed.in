"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/AuthProvider";
import {
  getOwnerVerificationStatus,
  verifyOwnerIdentity,
  verifyOwnerPAN,
  setOperatorMode,
  uploadPropertyDocument,
  getPropertyDocuments,
  deletePropertyDocument,
  submitPropertyForReview,
  API_BASE_URL,
} from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Trash2,
  Loader2,
  ShieldCheck,
  Building2,
  UserCheck,
} from "lucide-react";

interface DocumentItem {
  _id: string;
  documentType: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  status: string;
  uploadedAt: string;
  rejectionReason?: string;
}

interface OwnerStatus {
  isHost: boolean;
  mobileVerified: boolean;
  governmentIdType?: string;
  governmentIdStatus: string;
  panStatus: string;
  panNumberMasked?: string;
  panName?: string;
  verificationStatus: string;
}

export default function PropertyVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = use(params);
  const router = useRouter();
  const { user } = useAuthModal();

  const [loading, setLoading] = useState(true);
  const [ownerStatus, setOwnerStatus] = useState<OwnerStatus | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [propertyStatus, setPropertyStatus] = useState<string>("DRAFT");
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Gov ID state
  const [selectedGovIdType, setSelectedGovIdType] = useState<"aadhaar" | "passport" | "driving_licence" | "voter_id">("aadhaar");
  const [verifyingGovId, setVerifyingGovId] = useState(false);
  const [govIdError, setGovIdError] = useState("");

  // PAN state
  const [panNumber, setPanNumber] = useState("");
  const [panName, setPanName] = useState("");
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [panError, setPanError] = useState("");

  // Operator declaration state
  const [isOwner, setIsOwner] = useState<boolean>(true);
  const [operatorRole, setOperatorRole] = useState<string>("owner");
  const [savingOperatorMode, setSavingOperatorMode] = useState(false);

  // Document upload states
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadVerificationData = async () => {
    try {
      setLoading(true);
      const [statusRes, docsRes] = await Promise.all([
        getOwnerVerificationStatus(),
        getPropertyDocuments(propertyId),
      ]);
      setOwnerStatus(statusRes as unknown as OwnerStatus);
      setDocuments((docsRes as any).documents || []);
      if ((docsRes as any).propertyVerification) {
        setIsOwner((docsRes as any).propertyVerification.isOwner ?? true);
        setOperatorRole((docsRes as any).propertyVerification.operatorRole || "owner");
        setPropertyStatus((docsRes as any).propertyVerification.status || "draft");
        setRejectionReason((docsRes as any).propertyVerification.rejectionReason || "");
      }
    } catch (err: any) {
      console.error("Failed to load verification data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadVerificationData();
    }
  }, [user, propertyId]);

  const handleVerifyGovId = async () => {
    setVerifyingGovId(true);
    setGovIdError("");
    try {
      await verifyOwnerIdentity(selectedGovIdType);
      await loadVerificationData();
    } catch (err: any) {
      setGovIdError(err.message || "Failed to verify government ID.");
    } finally {
      setVerifyingGovId(false);
    }
  };

  const handleVerifyPan = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingPan(true);
    setPanError("");
    try {
      await verifyOwnerPAN({ panNumber, panName });
      await loadVerificationData();
    } catch (err: any) {
      setPanError(err.message || "Failed to verify PAN.");
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleSaveOperatorMode = async (ownerChoice: boolean, roleChoice: string) => {
    setIsOwner(ownerChoice);
    setOperatorRole(roleChoice);
    setSavingOperatorMode(true);
    try {
      await setOperatorMode(propertyId, { isOwner: ownerChoice, operatorRole: roleChoice });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingOperatorMode(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only PDF, JPG, and PNG files are supported.");
      return;
    }

    setUploadingType(documentType);
    setUploadError("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileBase64 = reader.result as string;
        await uploadPropertyDocument(propertyId, {
          documentType,
          originalFilename: file.name,
          mimeType: file.type,
          fileBase64,
        });
        await loadVerificationData();
      } catch (err: any) {
        setUploadError(err.message || "Failed to upload document.");
      } finally {
        setUploadingType(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this document?")) return;
    try {
      await deletePropertyDocument(propertyId, docId);
      await loadVerificationData();
    } catch (err: any) {
      alert(err.message || "Failed to remove document.");
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitPropertyForReview(propertyId);
      setSubmitSuccess(true);
      await loadVerificationData();
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-muted">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-brand" />
        <p>Loading verification status...</p>
      </div>
    );
  }

  // Calculate overall progress percentage
  let progress = 0;
  if (ownerStatus?.governmentIdStatus === "verified") progress += 25;
  if (ownerStatus?.panStatus === "verified") progress += 25;
  if (documents.some((d) => d.documentType === "address_proof")) progress += 25;
  if (documents.some((d) => ["ownership", "lease_agreement", "owner_authorization", "noc"].includes(d.documentType))) progress += 25;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href={`/host/properties/${propertyId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink-soft">
        <ArrowLeft className="h-4 w-4" />
        Back to Property Management
      </Link>

      {/* Progress & Header */}
      <div className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <ShieldCheck className="h-4 w-4" /> Property Verification
            </span>
            <h1 className="mt-3 text-2xl font-bold text-ink-soft">Verification & Compliance</h1>
            <p className="mt-1 text-sm text-muted">Verification helps us protect guests, owners and the Hopebed marketplace.</p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-muted">Overall Verification</span>
            <span className="text-2xl font-bold text-brand">{progress}%</span>
          </div>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-canvas">
          <div className="h-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {rejectionReason && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Action Needed: Admin Requested Changes</p>
                <p className="mt-1 text-amber-800">&ldquo;{rejectionReason}&rdquo;</p>
                <p className="mt-2 text-xs text-amber-700">Please update the requested document or info below and resubmit.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 1: OWNER IDENTITY VERIFICATION */}
      <div className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-soft">1. Verify Your Identity</h2>
              <p className="text-xs text-muted">Identity documents are kept strictly private and never exposed publicly.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-medium">
            <div className="flex items-center gap-1.5">
              {ownerStatus?.governmentIdStatus === "verified" ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 className="h-4 w-4" /> Gov ID Verified</span>
              ) : (
                <span className="text-muted">○ Gov ID Pending</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {ownerStatus?.panStatus === "verified" ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 className="h-4 w-4" /> PAN Verified</span>
              ) : (
                <span className="text-muted">○ PAN Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Primary Government ID */}
        <div className="mb-8 rounded-xl border border-border/80 bg-canvas/40 p-5">
          <h3 className="font-semibold text-ink-soft">Primary Government ID</h3>
          <p className="text-xs text-muted mt-0.5">Select your preferred government document (Aadhaar, Passport, Driving Licence, or Voter ID).</p>

          {ownerStatus?.governmentIdStatus === "verified" ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold uppercase">✓ Verified {ownerStatus.governmentIdType}</p>
                <p className="text-xs text-green-700">Identity verification verified with compliant e-KYC provider.</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {govIdError && <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{govIdError}</div>}
              
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { id: "aadhaar", label: "Aadhaar" },
                  { id: "passport", label: "Passport" },
                  { id: "driving_licence", label: "Driving Licence" },
                  { id: "voter_id", label: "Voter ID" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedGovIdType(item.id as any)}
                    className={`rounded-xl border p-3 text-center text-sm font-medium transition-all ${
                      selectedGovIdType === item.id
                        ? "border-brand bg-brand/10 text-brand shadow-xs"
                        : "border-border bg-white text-muted hover:border-brand/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="rounded-lg bg-blue-50/70 p-3 text-xs text-blue-800">
                <span className="font-semibold">Security Note:</span> Hopebed does not store raw Aadhaar numbers or raw Aadhaar card images in our database. We use secure e-KYC metadata verification.
              </div>

              <button
                type="button"
                onClick={handleVerifyGovId}
                disabled={verifyingGovId}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
              >
                {verifyingGovId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Government ID"}
              </button>
            </div>
          )}
        </div>

        {/* PAN Verification */}
        <div className="rounded-xl border border-border/80 bg-canvas/40 p-5">
          <h3 className="font-semibold text-ink-soft">PAN Card Verification</h3>
          <p className="text-xs text-muted mt-0.5">Enter your 10-character PAN details for legal tax & compliance verification.</p>

          {ownerStatus?.panStatus === "verified" ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold">✓ PAN Verified ({ownerStatus.panNumberMasked})</p>
                <p className="text-xs text-green-700">Verified Name: {ownerStatus.panName}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyPan} className="mt-4 space-y-4">
              {panError && <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{panError}</div>}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-ink-soft">PAN Number</label>
                  <input
                    required
                    type="text"
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    className="mt-1 w-full uppercase rounded-lg border border-border px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-soft">Name on PAN Card</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    className="mt-1 w-full rounded-lg border border-border px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    value={panName}
                    onChange={(e) => setPanName(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifyingPan}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
              >
                {verifyingPan ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify PAN"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* STEP 2: PROPERTY OPERATOR / OWNERSHIP DECLARATION */}
      <div className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-soft">2. Property Ownership Status</h2>
            <p className="text-xs text-muted">Specify if you own or operate/lease this property.</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-ink-soft">Are you the owner of this property?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSaveOperatorMode(true, "owner")}
              className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                isOwner
                  ? "border-brand bg-brand/10 text-brand font-semibold shadow-xs"
                  : "border-border bg-white text-muted hover:border-brand/40"
              }`}
            >
              <div>
                <p className="text-sm">YES, I own this property</p>
                <p className="text-xs font-normal opacity-80 mt-0.5">I am the legal owner of the premises.</p>
              </div>
              {isOwner && <CheckCircle2 className="h-5 w-5 text-brand" />}
            </button>

            <button
              type="button"
              onClick={() => handleSaveOperatorMode(false, "lease_holder")}
              className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                !isOwner
                  ? "border-brand bg-brand/10 text-brand font-semibold shadow-xs"
                  : "border-border bg-white text-muted hover:border-brand/40"
              }`}
            >
              <div>
                <p className="text-sm">NO, I operate/manage this property</p>
                <p className="text-xs font-normal opacity-80 mt-0.5">I hold a lease, management agreement or NOC.</p>
              </div>
              {!isOwner && <CheckCircle2 className="h-5 w-5 text-brand" />}
            </button>
          </div>

          {!isOwner && (
            <div className="mt-4 rounded-xl border border-border/80 bg-canvas/40 p-4">
              <label className="block text-xs font-medium text-ink-soft">Operator Role</label>
              <select
                value={operatorRole}
                onChange={(e) => handleSaveOperatorMode(false, e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="lease_holder">Registered Lease Holder</option>
                <option value="property_manager">Property Manager / Management Company</option>
                <option value="authorized_operator">Authorized Operator (NOC Holder)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: PROPERTY VERIFICATION DOCUMENTS */}
      <div className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-soft">3. Upload Verification Documents</h2>
            <p className="text-xs text-muted">Upload clear copies of the required documents (PDF, JPG, PNG up to 5MB).</p>
          </div>
        </div>

        {uploadError && <div className="mb-6 rounded-lg bg-red-50 p-3 text-xs text-red-600">{uploadError}</div>}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Document Card: Address Proof */}
          <DocumentUploadCard
            title="1. Address Proof *"
            description="Utility bill, Property Tax receipt, Electricity bill or Official municipal document showing property address."
            documentType="address_proof"
            existingDoc={documents.find((d) => d.documentType === "address_proof")}
            uploading={uploadingType === "address_proof"}
            onUpload={(file) => handleFileUpload("address_proof", file)}
            onDelete={(docId) => handleDeleteDoc(docId)}
          />

          {/* Document Card: Ownership / Authorization / Lease */}
          <DocumentUploadCard
            title={isOwner ? "2. Ownership Proof *" : "2. Lease Agreement / NOC / Authorization *"}
            description={
              isOwner
                ? "Registered Sale Deed, Property Tax, Index II, or Title deed."
                : "Registered Lease agreement, Owner NOC, or Management Authorization letter."
            }
            documentType={isOwner ? "ownership" : "lease_agreement"}
            existingDoc={documents.find((d) =>
              ["ownership", "lease_agreement", "owner_authorization", "noc"].includes(d.documentType)
            )}
            uploading={uploadingType === (isOwner ? "ownership" : "lease_agreement")}
            onUpload={(file) => handleFileUpload(isOwner ? "ownership" : "lease_agreement", file)}
            onDelete={(docId) => handleDeleteDoc(docId)}
          />

          {/* Document Card: GST / Business Reg (Optional) */}
          <DocumentUploadCard
            title="3. GST / Shop & Establishment (Optional)"
            description="Business registration certificate or GST certificate for commercial hotels/PGs."
            documentType="gst"
            existingDoc={documents.find((d) => ["gst", "shop_establishment"].includes(d.documentType))}
            uploading={uploadingType === "gst"}
            onUpload={(file) => handleFileUpload("gst", file)}
            onDelete={(docId) => handleDeleteDoc(docId)}
          />
        </div>
      </div>

      {/* STEP 4: SUBMIT FOR APPROVAL */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <ShieldCheck className="h-12 w-12 text-brand" />
          <h2 className="mt-3 text-xl font-bold text-ink-soft">Submit Listing for Admin Approval</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Once submitted, our compliance team will review your identity and property verification documents. Unverified properties will not become live until approved.
          </p>

          {submitError && (
            <div className="mt-4 w-full rounded-lg bg-red-50 p-3 text-xs text-red-600">{submitError}</div>
          )}

          {submitSuccess && (
            <div className="mt-4 w-full rounded-lg bg-green-50 p-4 text-sm text-green-800">
              <p className="font-semibold">✓ Property Submitted for Review!</p>
              <p className="mt-1 text-xs">Our team will verify your listing within 24 hours. You can check status anytime on your host dashboard.</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submitting || propertyStatus === "pending"}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
                </>
              ) : propertyStatus === "pending" ? (
                "Under Admin Review"
              ) : (
                "Submit for Admin Approval"
              )}
            </button>

            <Link
              href={`/host/properties/${propertyId}`}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-6 py-3.5 font-semibold text-ink-soft hover:bg-canvas transition"
            >
              Preview Listing Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentUploadCard({
  title,
  description,
  documentType,
  existingDoc,
  uploading,
  onUpload,
  onDelete,
}: {
  title: string;
  description: string;
  documentType: string;
  existingDoc?: DocumentItem;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-canvas/40 p-5">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink-soft">{title}</h3>
          {existingDoc ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded ✓
            </span>
          ) : (
            <span className="text-xs text-muted">○ Not Uploaded</span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted leading-relaxed">{description}</p>
      </div>

      <div className="mt-5">
        {existingDoc ? (
          <div className="rounded-lg border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 text-brand shrink-0" />
                <span className="truncate text-xs font-medium text-ink-soft">{existingDoc.originalFilename}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`${API_BASE_URL}/api/verification/documents/${existingDoc._id}/stream`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand font-medium hover:underline"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => onDelete(existingDoc._id)}
                  className="text-muted hover:text-red-600 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white p-5 text-center transition hover:border-brand/50 hover:bg-brand/5">
            {uploading ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-6 w-6 text-muted" />
                <span className="text-xs font-semibold text-brand">Click to Upload Document</span>
                <span className="mt-1 text-[11px] text-muted">PDF, JPG, PNG (Max 5MB)</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
