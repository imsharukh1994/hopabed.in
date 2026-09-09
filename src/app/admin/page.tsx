“use client”;

import { useEffect, useState } from “react”;
import { useAuthModal } from “@/components/AuthProvider”;
import {
getAdminStats,
getPendingProperties,
verifyProperty,
} from “@/lib/api”;
import { CheckCircle, XCircle } from “lucide-react”;

type AdminStats = {
users: number;
hosts: number;
properties: number;
bookings: number;
};

type PropertyHost = {
businessName?: string;
user?: {
name?: string;
};
};

type PendingProperty = {
_id: string;
title: string;
host?: PropertyHost;
locality?: string;
city?: string;
propertyType?: string;
};

export default function AdminDashboardPage() {
const { user } = useAuthModal();

const [stats, setStats] = useState<AdminStats | null>(null);
const [properties, setProperties] = useState<PendingProperty[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
if (user?.role === “admin”) {
Promise.all([getAdminStats(), getPendingProperties()])
.then(([statsRes, propsRes]) => {
setStats(statsRes as AdminStats);
setProperties(propsRes as PendingProperty[]);
})
.finally(() => setLoading(false));
} else {
setLoading(false);
}
}, [user]);

if (!user || user.role !== “admin”) {
return (
Admin Dashboard
    <p className="text-muted">
      You do not have permission to view this page.
    </p>
  </div>
);

}

const handleVerify = async (
id: string,
status: “VERIFIED” | “REJECTED”
) => {
try {
await verifyProperty(id, status);

  setProperties((currentProperties) =>
    currentProperties.filter(
      (property) => property._id !== id
    )
  );
  alert(
    `Property ${status.toLowerCase()} successfully.`
  );
} catch {
  alert(
    "Error updating property verification status."
  );
}

};

return (
Admin Dashboard
  {loading ? (
    <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
        />
      ))}
    </div>
  ) : stats ? (
    <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={stats.users}
      />
      <StatCard
        title="Total Hosts"
        value={stats.hosts}
      />
      <StatCard
        title="Properties"
        value={stats.properties}
      />
      <StatCard
        title="Bookings"
        value={stats.bookings}
      />
    </div>
  ) : null}
  <h2 className="mb-4 text-xl font-semibold">
    Properties Pending Verification
  </h2>
  {properties.length === 0 && !loading ? (
    <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
      <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
      <h2 className="mb-2 text-xl font-semibold">
        All caught up!
      </h2>
      <p className="text-muted">
        There are no properties waiting for verification.
      </p>
    </div>
  ) : (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-canvas">
          <tr>
            <th className="px-6 py-4 font-semibold text-ink-soft">
              Property
            </th>
            <th className="px-6 py-4 font-semibold text-ink-soft">
              Host
            </th>
            <th className="px-6 py-4 font-semibold text-ink-soft">
              Location
            </th>
            <th className="px-6 py-4 font-semibold text-ink-soft">
              Type
            </th>
            <th className="px-6 py-4 text-right font-semibold text-ink-soft">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {properties.map((prop) => (
            <tr
              key={prop._id}
              className="transition hover:bg-canvas/50"
            >
              <td className="px-6 py-4 font-medium text-ink-soft">
                {prop.title}
              </td>
              <td className="px-6 py-4">
                {prop.host?.businessName ||
                  prop.host?.user?.name ||
                  "Unknown"}
              </td>
              <td className="px-6 py-4">
                {prop.locality || "—"},{" "}
                {prop.city || "—"}
              </td>
              <td className="px-6 py-4 capitalize">
                {prop.propertyType || "—"}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() =>
                    handleVerify(
                      prop._id,
                      "VERIFIED"
                    )
                  }
                  className="mr-2 inline-flex items-center gap-1 text-green-600 hover:underline"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() =>
                    handleVerify(
                      prop._id,
                      "REJECTED"
                    )
                  }
                  className="inline-flex items-center gap-1 text-red-600 hover:underline"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

);
}

function StatCard({
title,
value,
}: {
title: string;
value: number;
}) {
return (
{title}
  <p className="mt-2 text-3xl font-bold text-ink-soft">
    {value}
  </p>
</div>

);
}