"use client";

import { useEffect, useState } from "react";
import { useAuthModal } from "@/components/AuthProvider";
import { getAdminStats, getAdminVerificationQueue, reviewPropertyVerification, API_BASE_URL } from "@/lib/api";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Building2,
  UserCheck,
  Eye,
  X,
  Loader2,
  Clock,
  ExternalLink,
} from "lucide-react";

interface QueueItem {
  property: {
    _id: string;
    title: string;
    description?: string;
    address?: string;
    city?: string;
    locality?: string;
    propertyType?: string;
    pricePerNight?: number;
    primaryImage?: string;
    verificationStatus: string;
    rejectionReason?: string;
    isOperator?: boolean;
    operatorRole?: string;
  };
  host?: {
    businessName?: string;
    user?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
  ownerVerification?: {
    governmentIdType?: string;
    governmentIdStatus: string;
    panStatus: string;
    panNumberMasked?: string;
    panName?: string;
    verificationStatus: string;
  } | null;
  propertyVerification?: {
    isOwner: boolean;
    operatorRole: string;
    status: string;
    rejectionReason?: string;
  } | null;
  documents: Array<{
    _id: string;
    documentType: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    status: string;
    uploadedAt: string;
  }>;
  rooms: Array<{
    _id: string;
    name: string;
    roomType: string;
    pricePerNight: number;
    capacity: number;
    inventory: number;
  }>;
}

export default function AdminDashboardPage() {
  const { user } = useAuthModal();

  const [stats, setStats] = useState<{ users: number; hosts: number; properties: number; bookings: number } | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("PENDING_REVIEW");

  // Selected item for review modal
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [reviewing, setReviewing] = useState(false);

  // Change request modal state
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [changeError, setChangeError] = useState("");

  const loadData = async (status = filterStatus) => {
    setLoading(true);
    try {
      const [statsRes, queueRes] = await Promise.all([
        getAdminStats(),
        getAdminVerificationQueue(status),
      ]);
      setStats(statsRes);
      setQueue(queueRes as unknown as QueueItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadData(filterStatus);
    } else {
      setLoading(false);
    }
  }, [user, filterStatus]);

  if (!user || user.role !== "admin") {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-ink">Admin Dashboard</h1>
        <p className="text-muted">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleReviewAction = async (status: "VERIFIED" | "CHANGES_REQUESTED" | "REJECTED", reason?: string) => {
    if (!selectedItem) return;
    setReviewing(true);
    try {
      await reviewPropertyVerification(selectedItem.property._id, { status, reason });
      setSelectedItem(null);
      setShowChangeModal(false);
      setChangeReason("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to process review action.");
    } finally {
      setReviewing(false);
    }
  };

  const submitChangeRequest = () => {
    if (!changeReason.trim()) {
      setChangeError("Please provide a reason for requesting changes.");
      return;
    }
    handleReviewAction("CHANGES_REQUESTED", changeReason);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-soft">Admin Verification Dashboard</h1>
          <p className="text-sm text-muted">Review owner identity, property documents, and approve listings.</p>
        </div>
      </div>

      {stats && (
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={stats.users} />
          <StatCard title="Registered Hosts" value={stats.hosts} />
          <StatCard title="Total Properties" value={stats.properties} />
          <StatCard title="Total Bookings" value={stats.bookings} />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "PENDING_REVIEW", label: "Pending Review" },
            { id: "CHANGES_REQUESTED", label: "Changes Requested" },
            { id: "VERIFIED", label: "Verified & Live" },
            { id: "REJECTED", label: "Rejected" },
            { id: "ALL", label: "All Queue" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                filterStatus === tab.id
                  ? "bg-brand text-white shadow-sm"
                  : "bg-canvas text-muted hover:bg-border/60 hover:text-ink-soft"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      {loading ? (
        <div className="py-12 text-center text-muted">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-brand" />
          Loading verification queue...
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h2 className="mb-1 text-xl font-semibold">Verification Queue Clear</h2>
          <p className="text-sm text-muted">There are no properties matching &ldquo;{filterStatus}&rdquo; status.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-canvas">
              <tr>
                <th className="px-6 py-4 font-semibold text-ink-soft">Property</th>
                <th className="px-6 py-4 font-semibold text-ink-soft">Owner & Contact</th>
                <th className="px-6 py-4 font-semibold text-ink-soft">Identity Verification</th>
                <th className="px-6 py-4 font-semibold text-ink-soft">Property Documents</th>
                <th className="px-6 py-4 font-semibold text-ink-soft">Status</th>
                <th className="px-6 py-4 text-right font-semibold text-ink-soft">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {queue.map((item) => {
                const prop = item.property;
                const hostUser = item.host?.user;
                const ownerVerif = item.ownerVerification;

                return (
                  <tr key={prop._id} className="transition hover:bg-canvas/40">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink-soft">{prop.title}</div>
                      <div className="text-xs text-muted">
                        {prop.propertyType?.toUpperCase()} • {prop.locality}, {prop.city}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-ink-soft">{hostUser?.name || "Host User"}</div>
                      <div className="text-xs text-muted">{hostUser?.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className={ownerVerif?.governmentIdStatus === "verified" ? "text-green-600 font-semibold" : "text-amber-700"}>
                          Gov ID: {ownerVerif?.governmentIdStatus === "verified" ? `✓ ${ownerVerif.governmentIdType}` : "○ Pending"}
                        </span>
                        <span className={ownerVerif?.panStatus === "verified" ? "text-green-600 font-semibold" : "text-amber-700"}>
                          PAN: {ownerVerif?.panStatus === "verified" ? `✓ ${ownerVerif.panNumberMasked}` : "○ Pending"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <span className="font-semibold text-ink-soft">{item.documents.length} Docs Uploaded</span>
                        <p className="text-[11px] text-muted">
                          {item.propertyVerification?.isOwner ? "Owner Mode" : `Operator (${item.propertyVerification?.operatorRole})`}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {prop.verificationStatus === "VERIFIED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          <CheckCircle className="h-3 w-3" /> Verified & Live
                        </span>
                      ) : prop.verificationStatus === "PENDING_REVIEW" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          <Clock className="h-3 w-3" /> Pending Review
                        </span>
                      ) : prop.verificationStatus === "CHANGES_REQUESTED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                          <AlertCircle className="h-3 w-3" /> Changes Needed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                      >
                        <Eye className="h-3.5 w-3.5" /> Review Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* REVIEW MODAL / DRAWER */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-semibold uppercase text-brand">Verification Review</span>
                <h2 className="text-xl font-bold text-ink-soft">{selectedItem.property.title}</h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full p-2 text-muted hover:bg-canvas hover:text-ink-soft transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Section 1: Owner & Identity Details */}
              <div className="rounded-xl border border-border/80 bg-canvas/40 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-ink-soft">
                  <UserCheck className="h-4 w-4 text-brand" /> Owner Identity & Contact
                </h3>
                <div className="mt-3 grid gap-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-muted">Owner Name:</span>
                    <p className="font-semibold text-ink-soft">{selectedItem.host?.user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted">Email:</span>
                    <p className="font-semibold text-ink-soft">{selectedItem.host?.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted">Phone:</span>
                    <p className="font-semibold text-ink-soft">{selectedItem.host?.user?.phone || "✓ Verified Mobile"}</p>
                  </div>
                  <div>
                    <span className="text-muted">Gov ID Status:</span>
                    <p className="font-semibold text-green-700 uppercase">
                      ✓ {selectedItem.ownerVerification?.governmentIdType || "Aadhaar / Gov ID Verified"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted">PAN Status:</span>
                    <p className="font-semibold text-green-700">
                      ✓ {selectedItem.ownerVerification?.panNumberMasked || "Verified"} ({selectedItem.ownerVerification?.panName})
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Property & Operator Status */}
              <div className="rounded-xl border border-border/80 bg-canvas/40 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-ink-soft">
                  <Building2 className="h-4 w-4 text-brand" /> Property & Operator Information
                </h3>
                <div className="mt-3 grid gap-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-muted">Property Type:</span>
                    <p className="font-semibold text-ink-soft uppercase">{selectedItem.property.propertyType}</p>
                  </div>
                  <div>
                    <span className="text-muted">Location:</span>
                    <p className="font-semibold text-ink-soft">
                      {selectedItem.property.locality}, {selectedItem.property.city}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted">Address:</span>
                    <p className="font-semibold text-ink-soft">{selectedItem.property.address}</p>
                  </div>
                  <div>
                    <span className="text-muted">Operator Declaration:</span>
                    <p className="font-semibold text-ink-soft">
                      {selectedItem.propertyVerification?.isOwner
                        ? "Legal Owner"
                        : `Operator (${selectedItem.propertyVerification?.operatorRole || "Leaseholder"})`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted">Base Price:</span>
                    <p className="font-semibold text-ink-soft">₹{selectedItem.property.pricePerNight} / night</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Uploaded Documents */}
              <div className="rounded-xl border border-border/80 bg-canvas/40 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-ink-soft">
                  <FileText className="h-4 w-4 text-brand" /> Uploaded Verification Documents ({selectedItem.documents.length})
                </h3>
                {selectedItem.documents.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-700">⚠ No verification documents uploaded yet.</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {selectedItem.documents.map((doc) => (
                      <div key={doc._id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3 text-xs">
                        <div className="overflow-hidden">
                          <span className="font-semibold capitalize text-brand">{doc.documentType.replace("_", " ")}</span>
                          <p className="truncate text-muted">{doc.originalFilename}</p>
                        </div>
                        <a
                          href={`${API_BASE_URL}/api/verification/documents/${doc._id}/stream`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-semibold text-brand hover:underline shrink-0 ml-2"
                        >
                          View Document <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => setShowChangeModal(true)}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition disabled:opacity-70"
                >
                  Request Changes
                </button>

                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => handleReviewAction("REJECTED", "Property listing does not meet Hopebed compliance requirements.")}
                  className="rounded-xl border border-red-300 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-70"
                >
                  Reject Property
                </button>

                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => handleReviewAction("VERIFIED")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-70"
                >
                  {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve & Make Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST CHANGES REASON MODAL */}
      {showChangeModal && selectedItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink-soft">Request Changes from Owner</h3>
            <p className="mt-1 text-xs text-muted">
              Specify what the owner needs to correct or upload (e.g. &ldquo;Please upload a clearer property authorization document.&rdquo;).
            </p>

            {changeError && <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{changeError}</div>}

            <textarea
              rows={4}
              placeholder="e.g. Please upload a clearer copy of your address proof and NOC."
              className="mt-4 w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              value={changeReason}
              onChange={(e) => {
                setChangeReason(e.target.value);
                setChangeError("");
              }}
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowChangeModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted hover:bg-canvas transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={submitChangeRequest}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-70"
              >
                {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Change Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase text-muted">{title}</p>
      <p className="mt-2 text-3xl font-bold text-ink-soft">{value}</p>
    </div>
  );
}
