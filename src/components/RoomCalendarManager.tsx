"use client";

import { useEffect, useState } from "react";
import { getRoomAvailability, updateRoomAvailability } from "@/lib/api";
import { Loader2, Calendar, AlertCircle } from "lucide-react";

interface RoomCalendarManagerProps {
  propertyId: string;
  roomId: string;
  roomName: string;
  basePrice: number;
}

interface AvailabilityRecord {
  _id: string;
  date: string;
  status: "available" | "blocked" | "booked";
  price: number;
}

export function RoomCalendarManager({ propertyId, roomId, roomName, basePrice }: RoomCalendarManagerProps) {
  const [records, setRecords] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    status: "blocked" as "available" | "blocked",
    price: "",
  });
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const threeMonthsOut = new Date();
      threeMonthsOut.setMonth(today.getMonth() + 3);
      
      const data = await getRoomAvailability(
        propertyId, 
        roomId, 
        today.toISOString().split("T")[0],
        threeMonthsOut.toISOString().split("T")[0]
      );
      setRecords(data as unknown as AvailabilityRecord[]);
    } catch (error) {
      console.error("Failed to fetch calendar", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, roomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);
    try {
      await updateRoomAvailability(propertyId, roomId, {
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        price: form.price ? Number(form.price) : undefined,
      });
      setMessage({ text: "Calendar updated successfully!", type: "success" });
      setForm({ startDate: "", endDate: "", status: "blocked", price: "" });
      fetchCalendar();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ text: err.message, type: "error" });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Filter for blocked or price-changed dates
  const overrides = records.filter(r => r.status === 'blocked' || r.price !== basePrice);

  return (
    <div className="mt-4 rounded-xl border border-border bg-black/5 p-4 sm:p-6">
      <h4 className="mb-4 text-lg font-semibold text-ink-soft flex items-center gap-2">
        <Calendar className="h-5 w-5 text-brand" />
        Manage Calendar: {roomName}
      </h4>

      <form onSubmit={handleSubmit} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Start Date</label>
          <input
            required
            type="date"
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">End Date</label>
          <input
            required
            type="date"
            min={form.startDate || new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Status</label>
          <select
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as "available" | "blocked" })}
          >
            <option value="available">Available</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Custom Price (₹)</label>
          <input
            type="number"
            min="0"
            placeholder={basePrice.toString()}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={updating}
            className="flex w-full items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-50"
          >
            {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Apply"}
          </button>
        </div>
      </form>

      {message && (
        <div className={`mb-6 rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div>
        <h5 className="mb-3 text-sm font-semibold text-ink-soft">Upcoming Overrides & Blocks</h5>
        {loading ? (
          <p className="text-sm text-muted">Loading calendar...</p>
        ) : overrides.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-white p-4 text-sm text-muted">
            <AlertCircle className="h-4 w-4" />
            No dates are currently blocked or uniquely priced in the next 3 months.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {overrides.map((record) => (
                  <tr key={record._id} className="border-t border-border">
                    <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        record.status === 'blocked' ? 'bg-red-100 text-red-700' :
                        record.status === 'booked' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">₹{record.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
