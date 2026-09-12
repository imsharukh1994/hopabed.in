"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthModal } from "@/components/AuthProvider";
import {
  getAdminStats,
  getAdminVerificationQueue,
  reviewPropertyVerification,
  getAdminHostQueue,
  approveAdminHost,
  rejectAdminHost,
  suspendAdminHost,
  getAdminAuditLogs,
  API_BASE_URL,
} from "@/lib/api";
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
  ShieldCheck,
  ShieldAlert,
  History,
  Ban,
} from "lucide-react";

interface PropertyQueueItem {
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
    _id?: string;
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

interface HostQueueItem {
  host: {
    _id: string;
    businessName?: string;
    fullName?: string;
    dob?: string;
    phone?: string;
    email?: string;
    address?: string;
    verificationStatus: string;
    kycStatus: string;
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    verificationNotes?: string;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  ownerVerification?: {
    governmentIdType?: string;
    governmentIdStatus: string;
    panStatus: string;
    panNumberMasked?: string;
    panName?: string;
    verificationStatus: string;
  } | null;
  propertiesCount: number;
}

interface AuditLogItem {
  _id: string;
  actor?: { name?: string; email?: string; role?: string };
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuthModal();

  const [mainTab, setMainTab] = useState<"PROPERTIES" | "HOSTS" | "AUDIT_LOGS">("PROPERTIES");

  const [stats, setStats] = useState<{ users: number; hosts: number; properties: number; bookings: number } | null>(null);
  
  // Property Queue State
  const [propertyQueue, setPropertyQueue] = useState<PropertyQueueItem[]>([]);
  const [propertyStatus, setPropertyStatus] = useState("PENDING_REVIEW");

  // Host Queue State
  const [hostQueue, setHostQueue] = useState<HostQueueItem[]>([]);
  const [hostStatus, setHostStatus] = useState("pending");

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [selectedProperty, setSelectedProperty] = useState<PropertyQueueItem | null>(null);
  const [selectedHost, setSelectedHost] = useState<HostQueueItem | null>(null);

  const [showRejectModal, setShowRejectModal] = useState<{ type: "property" | "host" | "suspend_host" | "suspend_prop"; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [modalError, setModalError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const statsRes = await getAdminStats();
      setStats(statsRes);

      if (mainTab === "PROPERTIES") {
        const queueRes = await getAdminVerificationQueue(propertyStatus);
        setPropertyQueue(queueRes as unknown as PropertyQueueItem[]);
      } else if (mainTab === "HOSTS") {
        const hostsRes = await getAdminHostQueue(hostStatus);
        setHostQueue(hostsRes as unknown as HostQueueItem[]);
      } else if (mainTab === "AUDIT_LOGS") {
        const logsRes = await getAdminAuditLogs();
        setAuditLogs(logsRes as unknown as AuditLogItem[]);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [mainTab, propertyStatus, hostStatus]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, mainTab, propertyStatus, hostStatus, loadData]);

  if (!user || user.role !== "admin") {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-ink">Admin Dashboard</h1>
        <p className="text-muted">You do not have permission to view this page.</p>
      </div>
    );
  }

  // Handle Property Review
  const handlePropertyReview = async (status: "VERIFIED" | "CHANGES_REQUESTED" | "REJECTED" | "SUSPENDED", reason?: string) => {
    if (!selectedProperty && !showRejectModal) return;
    const propId = selectedProperty?.property._id || showRejectModal?.id;
    if (!propId) return;

    setActionLoading(true);
    try {
      await reviewPropertyVerification(propId, { status, reason });
      setSelectedProperty(null);
      setShowRejectModal(null);
      setRejectReason("");
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to review property.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Host Review
  const handleApproveHost = async (hostId: string) => {
    setActionLoading(true);
    try {
      await approveAdminHost(hostId);
      setSelectedHost(null);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve host.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectHost = async (hostId: string, reason: string) => {
    setActionLoading(true);
    try {
      await rejectAdminHost(hostId, reason);
      setSelectedHost(null);
      setShowRejectModal(null);
      setRejectReason("");
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reject host.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendHost = async (hostId: string, reason: string) => {
    setActionLoading(true);
    try {
      await suspendAdminHost(hostId, reason);
      setSelectedHost(null);
      setShowRejectModal(null);
      setRejectReason("");
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to suspend host.");
    } finally {
      setActionLoading(false);
    }
  };

  const submitModalAction = () => {
    if (!rejectReason.trim()) {
      setModalError("Please enter a reason.");
      return;
    }
    if (!showRejectModal) return;

    if (showRejectModal.type === "host") {
      handleRejectHost(showRejectModal.id, rejectReason);
    } else if (showRejectModal.type === "suspend_host") {
      handleSuspendHost(showRejectModal.id, rejectReason);
    } else if (showRejectModal.type === "property") {
      handlePropertyReview("REJECTED", rejectReason);
    } else if (showRejectModal.type === "suspend_prop") {
      handlePropertyReview("SUSPENDED", rejectReason);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Dashboard Top Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-soft">Admin Verification Portal</h1>
          <p className="text-sm text-muted">Review host identity verifications, property submissions, and platform compliance.</p>
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

      {/* Main Mode Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-3 border-b border-border pb-4">
        <button
          onClick={() => setMainTab("PROPERTIES")}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
            mainTab === "PROPERTIES" ? "bg-brand text-white shadow-sm" : "bg-white text-muted hover:bg-canvas"
          }`}
        >
          <Building2 className="h-4 w-4" /> Property Verification Queue
        </button>

        <button
          onClick={() => setMainTab("HOSTS")}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
            mainTab === "HOSTS" ? "bg-brand text-white shadow-sm" : "bg-white text-muted hover:bg-canvas"
          }`}
        >
          <UserCheck className="h-4 w-4" /> Host Verification Queue
        </button>

        <button
          onClick={() => setMainTab("AUDIT_LOGS")}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
            mainTab === "AUDIT_LOGS" ? "bg-brand text-white shadow-sm" : "bg-white text-muted hover:bg-canvas"
          }`}
        >
          <History className="h-4 w-4" /> Compliance Audit Trail
        </button>
      </div>

      {/* PROPERTY VERIFICATION QUEUE VIEW */}
      {mainTab === "PROPERTIES" && (
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { id: "PENDING_REVIEW", label: "Pending Review" },
              { id: "CHANGES_REQUESTED", label: "Changes Requested" },
              { id: "VERIFIED", label: "Verified & Live" },
              { id: "REJECTED", label: "Rejected" },
              { id: "SUSPENDED", label: "Suspended" },
              { id: "ALL", label: "All Queue" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPropertyStatus(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  propertyStatus === tab.id
                    ? "bg-ink-soft text-white shadow-sm"
                    : "bg-canvas text-muted hover:bg-border/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-brand" />
              Loading property queue...
            </div>
          ) : propertyQueue.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h2 className="mb-1 text-xl font-semibold">No Properties Found</h2>
              <p className="text-sm text-muted">There are no property listings matching &ldquo;{propertyStatus}&rdquo; status.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-canvas">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Property Title</th>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Host Owner</th>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Host Identity Status</th>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Property Docs</th>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Status</th>
                    <th className="px-6 py-4 text-right font-semibold text-ink-soft">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {propertyQueue.map((item) => {
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
                            <span className="font-semibold text-ink-soft">{item.documents.length} Uploaded</span>
                            <p className="text-[11px] text-muted font-medium">
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
                          ) : prop.verificationStatus === "SUSPENDED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                              <Ban className="h-3 w-3" /> Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                              <XCircle className="h-3 w-3" /> Rejected
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedProperty(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >
                            <Eye className="h-3.5 w-3.5" /> Review Property
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* HOST VERIFICATION QUEUE VIEW */}
      {mainTab === "HOSTS" && (
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { id: "pending", label: "Pending Review" },
              { id: "verified", label: "Verified Hosts" },
              { id: "rejected", label: "Rejected" },
              { id: "suspended", label: "Suspended" },
              { id: "ALL", label: "All Hosts" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setHostStatus(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  hostStatus === tab.id
                    ? "bg-ink-soft text-white shadow-sm"
                    : "bg-canvas text-muted hover:bg-border/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-brand" />
              Loading host queue...
            </div>
          ) : hostQueue.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h2 className="mb-1 text-xl font-semibold">No Host Applications</h2>
              <p className="text-sm text-muted">There are no host profiles matching &ldquo;{hostStatus}&rdquo; status.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-canvas">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Host Name & Contact</th>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Legal Name & Address</th>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Gov ID & PAN Status</th>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Properties</th>
                    <th className="px-6 py-4 font-semibold text-ink-soft">Status</th>
                    <th className="px-6 py-4 text-right font-semibold text-ink-soft">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {hostQueue.map((item) => {
                    const host = item.host;
                    const usr = item.user;
                    const ownerVerif = item.ownerVerification;

                    return (
                      <tr key={host._id} className="transition hover:bg-canvas/40">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-ink-soft">{usr?.name || "Host User"}</div>
                          <div className="text-xs text-muted">{usr?.email}</div>
                          <div className="text-xs text-muted">{host.phone || usr?.phone}</div>
                        </td>

                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-medium text-ink-soft">{host.fullName || usr?.name}</div>
                          <div className="text-xs text-muted line-clamp-1">{host.address || "Address pending"}</div>
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
                          <span className="font-bold text-ink-soft">{item.propertiesCount} Stays</span>
                        </td>

                        <td className="px-6 py-4">
                          {host.verificationStatus === "verified" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                              <CheckCircle className="h-3 w-3" /> Verified Host
                            </span>
                          ) : host.verificationStatus === "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <Clock className="h-3 w-3" /> Pending Review
                            </span>
                          ) : host.verificationStatus === "suspended" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                              <Ban className="h-3 w-3" /> Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                              <XCircle className="h-3 w-3" /> Rejected
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedHost(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >
                            <Eye className="h-3.5 w-3.5" /> Review Host
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COMPLIANCE AUDIT TRAIL LOGS */}
      {mainTab === "AUDIT_LOGS" && (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink-soft mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-brand" /> Real-Time Audit Log
          </h2>

          {loading ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-brand" />
              Loading audit logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-muted">No audit logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-canvas">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-ink-soft">Timestamp</th>
                    <th className="px-4 py-3 font-semibold text-ink-soft">Actor (Admin)</th>
                    <th className="px-4 py-3 font-semibold text-ink-soft">Action</th>
                    <th className="px-4 py-3 font-semibold text-ink-soft">Target Type & ID</th>
                    <th className="px-4 py-3 font-semibold text-ink-soft">Metadata / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="text-xs hover:bg-canvas/30">
                      <td className="px-4 py-3 text-muted">
                        {new Date(log.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-soft">
                        {log.actor?.name || "System Admin"} ({log.actor?.email})
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-bold text-brand uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted">
                        {log.targetType}: {log.targetId}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {log.metadata?.reason ? String(log.metadata.reason) : JSON.stringify(log.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROPERTY REVIEW MODAL */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-semibold uppercase text-brand">Property Verification Review</span>
                <h2 className="text-xl font-bold text-ink-soft">{selectedProperty.property.title}</h2>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="rounded-full p-2 text-muted hover:bg-canvas hover:text-ink-soft transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Section 1: Owner Details */}
              <div className="rounded-xl border border-border/80 bg-canvas/40 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-ink-soft">
                  <UserCheck className="h-4 w-4 text-brand" /> Owner Identity & Contact
                </h3>
                <div className="mt-3 grid gap-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-muted">Owner Name:</span>
                    <p className="font-semibold text-ink-soft">{selectedProperty.host?.user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted">Email:</span>
                    <p className="font-semibold text-ink-soft">{selectedProperty.host?.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted">Phone:</span>
                    <p className="font-semibold text-ink-soft">{selectedProperty.host?.user?.phone || "✓ Verified"}</p>
                  </div>
                  <div>
                    <span className="text-muted">Gov ID Status:</span>
                    <p className="font-semibold text-green-700 uppercase">
                      ✓ {selectedProperty.ownerVerification?.governmentIdType || "Verified"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted">PAN Status:</span>
                    <p className="font-semibold text-green-700">
                      ✓ {selectedProperty.ownerVerification?.panNumberMasked || "Verified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Property Info */}
              <div className="rounded-xl border border-border/80 bg-canvas/40 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-ink-soft">
                  <Building2 className="h-4 w-4 text-brand" /> Property & Operator Information
                </h3>
                <div className="mt-3 grid gap-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-muted">Property Type:</span>
                    <p className="font-semibold text-ink-soft uppercase">{selectedProperty.property.propertyType}</p>
                  </div>
                  <div>
                    <span className="text-muted">Location:</span>
                    <p className="font-semibold text-ink-soft">
                      {selectedProperty.property.locality}, {selectedProperty.property.city}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted">Address:</span>
                    <p className="font-semibold text-ink-soft">{selectedProperty.property.address}</p>
                  </div>
                  <div>
                    <span className="text-muted">Operator Mode:</span>
                    <p className="font-semibold text-ink-soft">
                      {selectedProperty.propertyVerification?.isOwner
                        ? "Legal Owner"
                        : `Operator (${selectedProperty.propertyVerification?.operatorRole || "Leaseholder"})`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted">Base Price:</span>
                    <p className="font-semibold text-ink-soft">₹{selectedProperty.property.pricePerNight} / night</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Documents */}
              <div className="rounded-xl border border-border/80 bg-canvas/40 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-ink-soft">
                  <FileText className="h-4 w-4 text-brand" /> Verification Documents ({selectedProperty.documents.length})
                </h3>
                {selectedProperty.documents.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-700">⚠ No property verification documents uploaded yet.</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {selectedProperty.documents.map((doc) => (
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

              {/* Section 4: Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowRejectModal({ type: "suspend_prop", id: selectedProperty.property._id })}
                  className="rounded-xl border border-gray-400 bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-black transition disabled:opacity-70"
                >
                  Suspend Listing
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowRejectModal({ type: "property", id: selectedProperty.property._id })}
                  className="rounded-xl border border-red-300 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-70"
                >
                  Reject Property
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handlePropertyReview("VERIFIED")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-70"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve & Make Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOST REVIEW MODAL */}
      {selectedHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-semibold uppercase text-brand">Host Identity Verification Review</span>
                <h2 className="text-xl font-bold text-ink-soft">{selectedHost.user?.name || "Host Application"}</h2>
              </div>
              <button
                onClick={() => setSelectedHost(null)}
                className="rounded-full p-2 text-muted hover:bg-canvas hover:text-ink-soft transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6 text-xs">
              <div className="rounded-xl border border-border bg-canvas/40 p-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted block">Legal Full Name:</span>
                  <p className="font-bold text-sm text-ink-soft">{selectedHost.host.fullName || selectedHost.user?.name}</p>
                </div>
                <div>
                  <span className="text-muted block">Email:</span>
                  <p className="font-semibold text-ink-soft">{selectedHost.host.email || selectedHost.user?.email}</p>
                </div>
                <div>
                  <span className="text-muted block">Phone:</span>
                  <p className="font-semibold text-ink-soft">{selectedHost.host.phone || selectedHost.user?.phone}</p>
                </div>
                <div>
                  <span className="text-muted block">Date of Birth:</span>
                  <p className="font-semibold text-ink-soft">{selectedHost.host.dob ? selectedHost.host.dob.slice(0, 10) : "N/A"}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted block">Address:</span>
                  <p className="font-semibold text-ink-soft">{selectedHost.host.address || "Address pending"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-canvas/40 p-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted block">Gov ID Status:</span>
                  <p className="font-bold text-green-700 uppercase">✓ {selectedHost.ownerVerification?.governmentIdType || "Aadhaar e-KYC Verified"}</p>
                </div>
                <div>
                  <span className="text-muted block">PAN Status:</span>
                  <p className="font-bold text-green-700">
                    ✓ {selectedHost.ownerVerification?.panNumberMasked || "Verified"} ({selectedHost.ownerVerification?.panName})
                  </p>
                </div>
              </div>

              {selectedHost.host.rejectionReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
                  <span className="font-bold">Previous Reason / Notes:</span> {selectedHost.host.rejectionReason}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowRejectModal({ type: "suspend_host", id: selectedHost.host._id })}
                  className="rounded-xl border border-gray-400 bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-black transition disabled:opacity-70"
                >
                  Suspend Host
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowRejectModal({ type: "host", id: selectedHost.host._id })}
                  className="rounded-xl border border-red-300 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-70"
                >
                  Reject Application
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApproveHost(selectedHost.host._id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-70"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Approve Host Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT / SUSPEND REASON MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink-soft capitalize">
              {showRejectModal.type.replace("_", " ")} Reason
            </h3>
            <p className="mt-1 text-xs text-muted">
              Please enter an official reason or internal compliance notes.
            </p>

            {modalError && <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{modalError}</div>}

            <textarea
              rows={4}
              placeholder="e.g. Identity document name mismatch or incomplete address proof."
              className="mt-4 w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setModalError("");
              }}
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted hover:bg-canvas transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={submitModalAction}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Action"}
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
