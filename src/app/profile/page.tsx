"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/AuthProvider";
import { createAutoDraftProperty, getBookings, initPayUPayment } from "@/lib/api";
import { PayUCheckoutForm, PayUCheckoutData } from "@/components/PayUCheckoutForm";
import {
  Building2,
  ShieldCheck,
  Plus,
  ArrowRight,
  Mail,
  Shield,
  Loader2,
  Calendar,
  Sparkles,
  QrCode,
  X,
  CheckCircle2,
  Hotel,
  Clock,
  ExternalLink,
  Heart,
  CreditCard,
  Star,
  Bell,
  Utensils,
  Phone,
  UserCheck,
  Award,
  Download,
  AlertCircle,
  Smartphone,
  Save,
  Check,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "checked_in";
  totalPrice: number;
}

type TabType = "bookings" | "wishlist" | "preferences" | "payments" | "reviews" | "notifications" | "hosting";

function ProfileContent() {
  const { user } = useAuthModal();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<PayUCheckoutData | null>(null);
  const [selectedPass, setSelectedPass] = useState<Booking | null>(null);

  // Preference Form State
  const [dietPreference, setDietPreference] = useState("vegetarian");
  const [checkInTimePref, setCheckInTimePref] = useState("14:00");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [savedPrefSuccess, setSavedPrefSuccess] = useState(false);

  // Notification Preferences State
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [savedNotifSuccess, setSavedNotifSuccess] = useState(false);

  const [loadingDraft, setLoadingDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const tabParam = searchParams.get("tab") as TabType | null;
  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!user) return;
    setLoadingBookings(true);
    getBookings()
      .then((data) => {
        const normalized = ((data as Array<Record<string, unknown>>) || []).map((b) => ({
          ...b,
          id: String(b.id || b._id || Math.random().toString(36).substring(7)),
          propertyTitle: String(b.propertyTitle || b.title || "Hopebed Stay Pass"),
          checkIn: String(b.checkIn || new Date().toISOString()),
          checkOut: String(b.checkOut || new Date().toISOString()),
          status: (b.status as any) || "CONFIRMED",
          totalPrice: Number(b.totalPrice || 0),
        }));
        setBookings(normalized as unknown as Booking[]);
      })
      .catch((err) => console.error("Failed to load bookings in profile:", err))
      .finally(() => setLoadingBookings(false));
  }, [user]);

  const handlePayNow = async (bookingId: string) => {
    try {
      setPayingBookingId(bookingId);
      const data = await initPayUPayment(bookingId);
      setCheckoutData(data as unknown as PayUCheckoutData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || "Failed to initiate payment");
      }
      setPayingBookingId(null);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedPrefSuccess(true);
    setTimeout(() => setSavedPrefSuccess(false), 3000);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotifSuccess(true);
    setTimeout(() => setSavedNotifSuccess(false), 3000);
  };

  const handleListProperty = async () => {
    setLoadingDraft(true);
    setErrorMsg("");
    try {
      const res = await createAutoDraftProperty();
      const propObj = res.property as { _id?: string; id?: string } | undefined;
      const propId = propObj?._id || propObj?.id;
      if (propId) {
        router.push(`/host/properties/${propId}/verification`);
      } else {
        router.push("/host");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message || "Failed to create property draft.");
      }
      setLoadingDraft(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Calendar className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111111]">Please Log In</h1>
        <p className="mt-2 text-sm text-[#59615c]">Log in to view your stay bookings, wishlist, preferences, and profile details.</p>
      </div>
    );
  }

  // Mock saved wishlists
  const mockWishlist = [
    {
      id: "w1",
      title: "The Grand Heritage Resort",
      city: "Goa",
      locality: "Calangute",
      pricePerNight: 4500,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "w2",
      title: "Himalayan Pine Villa",
      city: "Manali",
      locality: "Old Manali",
      pricePerNight: 3200,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 text-[#111111]">
      {/* 1. TOP PROFILE HEADER & VERIFICATION BADGES CARD */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* User Basic Info */}
          <div className="flex items-center gap-5">
            <div className="relative h-22 w-22 overflow-hidden rounded-2xl border-2 border-[#0b8f3c]/20 bg-[#f7fbf8] shadow-xs shrink-0">
              <Image
                src={user.avatarUrl || "/default-avatar.png"}
                alt={`${user.name}'s avatar`}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#111111]">{user.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0b8f3c]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0b8f3c] uppercase">
                  <Shield className="h-3 w-3" /> {user.role}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#59615c]">
                <Mail className="h-3.5 w-3.5 text-[#0b8f3c]" /> {user.email}
              </p>

              {/* Verified Badges & Trust Score */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-green-800 border border-green-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Email Verified
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-green-800 border border-green-200">
                  <UserCheck className="h-3.5 w-3.5 text-green-600" /> Phone Verified
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-900 border border-emerald-300">
                  <Award className="h-3.5 w-3.5 text-emerald-700" /> Trust Score: 98% Super Guest
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/host/verification"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-[#f7fbf8] px-4 py-2.5 text-xs font-bold text-[#111111] transition hover:bg-gray-100"
            >
              <ShieldCheck className="h-4 w-4 text-[#0b8f3c]" /> Host KYC Center
            </Link>
            <button
              type="button"
              onClick={handleListProperty}
              disabled={loadingDraft}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0b8f3c] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#06752f] disabled:opacity-70"
            >
              {loadingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              List Your Property
            </button>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE TAB NAVIGATION */}
      <div className="mb-8 flex overflow-x-auto border-b border-gray-200 no-scrollbar">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "bookings"
              ? "border-[#0b8f3c] text-[#0b8f3c]"
              : "border-transparent text-[#59615c] hover:text-[#111111]"
          }`}
        >
          <Calendar className="h-4 w-4" />
          My Bookings ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab("wishlist")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "wishlist"
              ? "border-[#0b8f3c] text-[#0b8f3c]"
              : "border-transparent text-[#59615c] hover:text-[#111111]"
          }`}
        >
          <Heart className="h-4 w-4" />
          Saved Wishlist ({mockWishlist.length})
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "preferences"
              ? "border-[#0b8f3c] text-[#0b8f3c]"
              : "border-transparent text-[#59615c] hover:text-[#111111]"
          }`}
        >
          <Utensils className="h-4 w-4" />
          Stay Preferences & Safety
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "payments"
              ? "border-[#0b8f3c] text-[#0b8f3c]"
              : "border-transparent text-[#59615c] hover:text-[#111111]"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Payments & Refunds
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "reviews"
              ? "border-[#0b8f3c] text-[#0b8f3c]"
              : "border-transparent text-[#59615c] hover:text-[#111111]"
          }`}
        >
          <Star className="h-4 w-4" />
          Reviews & Feedback
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "notifications"
              ? "border-[#0b8f3c] text-[#0b8f3c]"
              : "border-transparent text-[#59615c] hover:text-[#111111]"
          }`}
        >
          <Bell className="h-4 w-4" />
          Alerts & Notifications
        </button>

        <button
          onClick={() => setActiveTab("hosting")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "hosting"
              ? "border-[#0b8f3c] text-[#0b8f3c]"
              : "border-transparent text-[#59615c] hover:text-[#111111]"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Host Hub
        </button>
      </div>

      {/* Notifications banners */}
      {successParam === "true" && (
        <div className="mb-6 rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-800 border border-green-200 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          Payment successful! Your stay pass is confirmed below.
        </div>
      )}
      {errorParam && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {errorParam === "payment_failed"
            ? "Payment could not be completed. Your booking has not been confirmed."
            : errorParam === "payment_cancelled"
            ? "Payment was cancelled."
            : "An error occurred with your booking payment."}
        </div>
      )}

      {/* TAB 1: MY BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#111111] flex items-center gap-2">
              <Hotel className="h-5 w-5 text-[#0b8f3c]" /> My Stay Bookings & Passes
            </h2>
            <Link href="/search" className="text-xs font-bold text-[#0b8f3c] hover:underline flex items-center gap-1">
              Explore More Stays <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingBookings ? (
            <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-[#59615c] gap-2 text-xs font-semibold">
              <Loader2 className="h-5 w-5 animate-spin text-[#0b8f3c]" /> Loading your stay passes...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7fbf8] text-[#59615c]">
                <Calendar className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-[#111111]">No Bookings Found</h3>
              <p className="mt-1 text-xs text-[#59615c]">You haven&apos;t booked any stay passes yet. Start exploring verified Hopebed stays!</p>
              <Link
                href="/search"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0b8f3c] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#06752f]"
              >
                Search Available Stays
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition hover:border-[#0b8f3c]/30 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#111111]">{booking.propertyTitle}</h3>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            booking.status === "CONFIRMED" || booking.status === "checked_in"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status === "checked_in" ? "CHECKED IN" : booking.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#59615c] flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[#0b8f3c]" /> Check-in: {new Date(booking.checkIn).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</span>
                      </p>
                      <p className="mt-2 text-xs font-semibold text-[#111111]">
                        Total Amount: <span className="text-[#0b8f3c] font-bold text-sm">₹{booking.totalPrice}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {booking.status === "PENDING" && (
                        <button
                          onClick={() => handlePayNow(booking.id)}
                          disabled={payingBookingId !== null}
                          className="flex items-center justify-center rounded-xl bg-[#0b8f3c] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#06752f] disabled:opacity-50"
                        >
                          {payingBookingId === booking.id ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Processing...
                            </>
                          ) : (
                            "Complete Payment"
                          )}
                        </button>
                      )}

                      {(booking.status === "CONFIRMED" || booking.status === "checked_in") && (
                        <button
                          onClick={() => setSelectedPass(booking)}
                          className="flex items-center gap-2 rounded-xl border border-[#0b8f3c]/30 bg-[#eaf7ef] px-4 py-2.5 text-xs font-bold text-[#0b8f3c] transition hover:bg-[#0b8f3c] hover:text-white"
                        >
                          <QrCode className="h-4 w-4" />
                          View Stay Pass
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED WISHLIST */}
      {activeTab === "wishlist" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#111111] flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" /> Saved Favorite Stays
            </h2>
            <Link href="/search" className="text-xs font-bold text-[#0b8f3c] hover:underline flex items-center gap-1">
              Find More Stays <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {mockWishlist.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition hover:shadow-md">
                <div className="relative h-44 w-full bg-gray-100">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                  <span className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-red-500 shadow-xs">
                    <Heart className="h-4 w-4 fill-red-500" />
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-[#111111] text-base">{item.title}</h3>
                      <p className="text-xs text-[#59615c] mt-0.5">{item.locality}, {item.city}</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                      ★ {item.rating}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <div>
                      <span className="text-base font-bold text-[#0b8f3c]">₹{item.pricePerNight}</span>
                      <span className="text-[11px] text-[#59615c]"> / night</span>
                    </div>
                    <Link
                      href="/search"
                      className="rounded-xl bg-[#0b8f3c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#06752f]"
                    >
                      Book Stay
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAY PREFERENCES & SAFETY */}
      {activeTab === "preferences" && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="text-xl font-bold text-[#111111] flex items-center gap-2 mb-2">
              <Utensils className="h-5 w-5 text-[#0b8f3c]" /> Stay & Safety Preferences
            </h2>
            <p className="text-xs text-[#59615c] mb-6">
              Customize your stay preferences so hosts can prepare meals, check-in timings, and safety emergency contacts in advance.
            </p>

            {savedPrefSuccess && (
              <div className="mb-6 rounded-xl bg-green-50 p-3.5 text-xs font-bold text-green-800 border border-green-200 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" /> Stay preferences saved successfully!
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="space-y-5 text-xs font-semibold">
              <div>
                <label className="block text-[#111111] mb-2 font-bold">Dietary Preference</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {["vegetarian", "non-vegetarian", "jain", "vegan"].map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setDietPreference(pref)}
                      className={`rounded-xl border p-3 text-center capitalize transition ${
                        dietPreference === pref
                          ? "border-[#0b8f3c] bg-[#eaf7ef] text-[#0b8f3c] font-bold"
                          : "border-gray-200 bg-white text-[#59615c] hover:bg-gray-50"
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#111111] mb-1 font-bold">Estimated Arrival / Check-in Time</label>
                <input
                  type="time"
                  value={checkInTimePref}
                  onChange={(e) => setCheckInTimePref(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-[#f7fbf8] p-3 text-xs text-[#111111] focus:border-[#0b8f3c] focus:outline-none"
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-bold text-sm text-[#111111] mb-3 flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-[#0b8f3c]" /> Emergency Contact Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[#59615c] mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Mithagari"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-[#f7fbf8] p-3 text-xs text-[#111111] focus:border-[#0b8f3c] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#59615c] mb-1">Emergency Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-[#f7fbf8] p-3 text-xs text-[#111111] focus:border-[#0b8f3c] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0b8f3c] px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#06752f]"
              >
                <Save className="h-4 w-4" /> Save Stay Preferences
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS & REFUNDS */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="text-xl font-bold text-[#111111] flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-[#0b8f3c]" /> PayU Payment Gateway & Wallet
            </h2>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {/* Payment Methods */}
              <div className="rounded-2xl border border-gray-200 bg-[#f7fbf8] p-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0b8f3c] mb-3">Saved Payment Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-gray-200 text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-[#0b8f3c]" /> PayU UPI / GPay / PhonePe
                    </span>
                    <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-bold">Default</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-gray-200 text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" /> Credit / Debit Card (PayU Secured)
                    </span>
                    <span className="text-gray-400 text-[10px]">Verified</span>
                  </div>
                </div>
              </div>

              {/* Instant Refund Tracker */}
              <div className="rounded-2xl border border-gray-200 bg-[#f7fbf8] p-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0b8f3c] mb-3">Refund Status Tracker</h3>
                <div className="rounded-xl bg-white p-4 border border-gray-200 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-[#111111]">
                    <span>No Pending Refunds</span>
                    <span className="text-green-700">₹0.00</span>
                  </div>
                  <p className="text-[11px] text-[#59615c]">
                    All eligible booking cancellation refunds are processed instantly back to original PayU payment source within 24-48 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <h3 className="font-bold text-sm text-[#111111] mb-3">Recent Transactions & Invoices</h3>
            {bookings.length === 0 ? (
              <p className="text-xs text-[#59615c]">No payment history available.</p>
            ) : (
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white overflow-hidden text-xs">
                {bookings.map((b) => {
                  const safeId = String(b?.id || (b as unknown as { _id?: string })?._id || "REF000");
                  return (
                    <div key={safeId} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#111111]">{b.propertyTitle}</p>
                        <p className="text-[11px] text-[#59615c]">PayU Ref: PAYU_TXN_{safeId.slice(-6).toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-[#0b8f3c]">₹{b.totalPrice}</span>
                        <button
                          onClick={() => alert(`Downloading Invoice for Booking ID: ${safeId}`)}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-[#111111] hover:bg-gray-50"
                        >
                          <Download className="h-3.5 w-3.5 text-[#0b8f3c]" /> Invoice
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: REVIEWS & FEEDBACK */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="text-xl font-bold text-[#111111] flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Host Feedback & Reviews
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-[#f7fbf8] p-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0b8f3c] mb-3">Host Rating Received</h3>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-3xl font-bold text-[#111111]">5.0</span>
                  <div>
                    <div className="flex text-amber-400">★★★★★</div>
                    <p className="text-[11px] text-[#59615c]">Based on 3 completed stays</p>
                  </div>
                </div>
                <p className="text-xs text-[#59615c]">
                  &ldquo;Shahrukh was a fantastic guest! Respectful of house rules, prompt check-in, and left the room spotless.&rdquo; — <span className="font-bold text-[#111111]">Goa Villa Host</span>
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#f7fbf8] p-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0b8f3c] mb-3">Reviews Written by You</h3>
                <p className="text-xs text-[#59615c] mb-3">You have written 2 stay reviews for Hopebed properties.</p>
                <div className="rounded-xl bg-white p-3 border border-gray-200 text-xs">
                  <div className="flex justify-between font-bold text-[#111111] mb-1">
                    <span>The Grand Heritage Resort</span>
                    <span className="text-amber-500">★ 5.0</span>
                  </div>
                  <p className="text-[11px] text-[#59615c]">&ldquo;Excellent hospitality and sparkling clean stay.&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: NOTIFICATIONS & ALERTS */}
      {activeTab === "notifications" && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="text-xl font-bold text-[#111111] flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-[#0b8f3c]" /> Booking Alerts & WhatsApp Preferences
            </h2>
            <p className="text-xs text-[#59615c] mb-6">
              Choose how you want to receive digital stay passes, instant check-in reminders, and payment updates.
            </p>

            {savedNotifSuccess && (
              <div className="mb-6 rounded-xl bg-green-50 p-3.5 text-xs font-bold text-green-800 border border-green-200 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" /> Notification preferences updated!
              </div>
            )}

            <form onSubmit={handleSaveNotifications} className="space-y-4 text-xs font-semibold">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 p-4">
                <div>
                  <p className="font-bold text-[#111111]">WhatsApp Stay Pass Delivery</p>
                  <p className="text-[11px] text-[#59615c]">Receive QR Code digital passes instantly on WhatsApp</p>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 accent-[#0b8f3c]"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 p-4">
                <div>
                  <p className="font-bold text-[#111111]">Email Booking Confirmations</p>
                  <p className="text-[11px] text-[#59615c]">Receive PDFs and invoices at {user.email}</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 accent-[#0b8f3c]"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 p-4">
                <div>
                  <p className="font-bold text-[#111111]">SMS Instant Notifications</p>
                  <p className="text-[11px] text-[#59615c]">Check-in alerts and payment status updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 accent-[#0b8f3c]"
                />
              </div>

              <button
                type="submit"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0b8f3c] px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#06752f]"
              >
                <Save className="h-4 w-4" /> Save Notification Preferences
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 7: HOST HUB */}
      {activeTab === "hosting" && (
        <div className="overflow-hidden rounded-3xl border border-[#0b8f3c]/30 bg-gradient-to-br from-[#0b8f3c]/5 via-white to-white p-6 shadow-xs sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b8f3c] text-white shadow-md">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#0b8f3c]">
                <Sparkles className="h-3.5 w-3.5" /> Hopebed Host Hub
              </span>
              <h2 className="text-xl font-bold text-[#111111]">List & Manage Your Properties</h2>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#59615c]">
            List your Hotel, PG, Hostel, Homestay, or Guest House on Hopebed. Verified properties get exclusive trust badges and booking visibility.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-xs text-red-600 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleListProperty}
              disabled={loadingDraft}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0b8f3c] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#06752f] shadow-sm hover:shadow disabled:opacity-70"
            >
              {loadingDraft ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating Listing Draft...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> List Your Property Now
                </>
              )}
            </button>

            <Link
              href="/host"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-[#111111] transition hover:bg-gray-50"
            >
              Host Dashboard <ArrowRight className="h-4 w-4 text-[#59615c]" />
            </Link>
          </div>
        </div>
      )}

      {/* Stay Pass Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedPass(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <span className="inline-block rounded-full bg-[#0b8f3c]/10 px-3 py-1 text-xs font-semibold text-[#0b8f3c]">
                HOPEBED DIGITAL STAY PASS
              </span>
              <h3 className="mt-3 text-xl font-bold text-[#111111]">{selectedPass.propertyTitle}</h3>
              <p className="mt-1 text-xs text-[#59615c]">Booking ID: {selectedPass.id}</p>

              <div className="my-6 flex justify-center rounded-2xl bg-gray-50 p-6 border border-gray-100 shadow-inner">
                <QRCodeCanvas
                  value={JSON.stringify({ bookingId: selectedPass.id, type: "HOPEBED_STAY_PASS" })}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-2 rounded-xl bg-[#f7fbf8] p-4 text-left text-xs text-[#111111]">
                <div className="flex justify-between">
                  <span className="text-[#59615c]">Check-in:</span>
                  <span className="font-semibold">{new Date(selectedPass.checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#59615c]">Check-out:</span>
                  <span className="font-semibold">{new Date(selectedPass.checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#59615c]">Status:</span>
                  <span className="font-semibold text-green-600 uppercase">{selectedPass.status}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-[#59615c]">
                Present this QR code or booking ID to the host at reception for seamless check-in.
              </p>
            </div>
          </div>
        </div>
      )}

      {checkoutData && payingBookingId && (
        <PayUCheckoutForm checkoutData={checkoutData} bookingId={payingBookingId} />
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-center text-xs font-semibold text-[#59615c]">Loading profile...</p>}>
      <ProfileContent />
    </Suspense>
  );
}