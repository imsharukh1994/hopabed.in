export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.hopebed.in";

export type SearchProperty = {
	id: string;
	title: string;
	city: string;
	locality: string;
	propertyType: string;
	primaryImage?: string;
	pricePerNight: number;
	rating?: number;
};

export type PropertyDetails = SearchProperty & {
	description: string;
	address: string;
	amenities: string[];
	houseRules?: string[];
	rooms: Array<{ id: string; name: string; roomType: string; capacity: number; inventory: number; pricePerNight: number; amenities: string[] }>;
};

type AuthResponse = {
	success: boolean;
	data: { token: string; user: { id: string; name: string; email: string; role: string; avatarUrl?: string } };
};

export async function authenticateWithGoogle(credential: string): Promise<AuthResponse> {
	let response: Response;
	try {
		response = await fetch(`${API_BASE_URL}/api/auth/google`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ credential }),
		});
	} catch {
		throw new Error("Hopebed API is not running. Start the backend on port 4000.");
	}

	const body = (await response.json()) as AuthResponse | { error?: { message?: string } };
	if (!response.ok || !("data" in body)) {
		throw new Error("error" in body ? body.error?.message ?? "Google sign-in failed." : "Google sign-in failed.");
	}

	return body;
}

export async function authenticateWithPassword(input: {
	name?: string;
	email: string;
	password: string;
	mode: "login" | "signup";
}): Promise<AuthResponse> {
	let response: Response;
	try {
		response = await fetch(`${API_BASE_URL}/api/auth/${input.mode === "signup" ? "register" : "login"}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: input.name, email: input.email, password: input.password }),
		});
	} catch {
		throw new Error("Hopebed API is not running. Start the backend on port 4000.");
	}
	const body = (await response.json()) as AuthResponse | { error?: { message?: string } };
	if (!response.ok || !("data" in body)) {
		throw new Error("error" in body ? body.error?.message ?? "Authentication failed." : "Authentication failed.");
	}
	return body;
}

export async function getCurrentUser(token: string): Promise<AuthResponse["data"]["user"]> {
	const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	const body = (await response.json()) as AuthResponse | { error?: { message?: string } };
	if (!response.ok || !("data" in body)) {
		throw new Error("error" in body ? body.error?.message ?? "Session expired." : "Session expired.");
	}
	return body.data.user;
}

export async function searchProperties(params: URLSearchParams): Promise<SearchProperty[]> {
	const response = await fetch(`${API_BASE_URL}/api/properties/search?${params.toString()}`, { cache: "no-store" });
	const body = (await response.json()) as { data?: { properties: Array<Record<string, unknown>> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "We couldn't load available stays.");
	return body.data.properties.map((property) => ({
		id: String(property._id), title: String(property.title), city: String(property.city), locality: String(property.locality),
		propertyType: String(property.propertyType), primaryImage: typeof property.primaryImage === "string" ? property.primaryImage : undefined,
		pricePerNight: Number(property.pricePerNight), rating: typeof property.rating === "number" ? property.rating : undefined,
	}));
}

export async function getPropertyDetails(id: string): Promise<PropertyDetails> {
	const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, { cache: "no-store" });
	const body = (await response.json()) as { data?: { property: Record<string, unknown>; rooms: Array<Record<string, unknown>> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "We couldn't load this stay.");
	const property = body.data.property;
	return { id: String(property._id), title: String(property.title), city: String(property.city), locality: String(property.locality), propertyType: String(property.propertyType), primaryImage: typeof property.primaryImage === "string" ? property.primaryImage : undefined, pricePerNight: Number(property.pricePerNight), rating: typeof property.rating === "number" ? property.rating : undefined, description: String(property.description), address: String(property.address), amenities: Array.isArray(property.amenities) ? property.amenities.map(String) : [], houseRules: Array.isArray(property.houseRules) ? property.houseRules.map(String) : [], rooms: body.data.rooms.map((room) => ({ id: String(room._id), name: String(room.name), roomType: String(room.roomType), capacity: Number(room.capacity), inventory: Number(room.inventory), pricePerNight: Number(room.pricePerNight), amenities: Array.isArray(room.amenities) ? room.amenities.map(String) : [] })) };
}

export async function createBooking(input: { propertyId: string; roomId: string; checkIn: string; checkOut: string; guests: number; roomCount?: number }) {
	const token = typeof window !== "undefined" ? localStorage.getItem("hopebed_access_token") : null;
	if (!token) throw new Error("Please log in before booking a stay.");
	const response = await fetch(`${API_BASE_URL}/api/properties/${input.propertyId}/bookings`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
	const body = (await response.json()) as { data?: { booking: Record<string, unknown> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "We couldn't create this booking.");
	return body.data.booking;
}

export async function getBookings() {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in to view bookings.");
	const response = await fetch(`${API_BASE_URL}/api/bookings`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
	const body = (await response.json()) as { data?: { bookings: Array<Record<string, unknown>> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "We couldn't load your bookings.");
	return body.data.bookings;
}

export async function registerHost(input: { businessName?: string; bio?: string }) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in before registering as a host.");
	const response = await fetch(`${API_BASE_URL}/api/hosts/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify(input),
	});
	const body = (await response.json()) as { data?: { host: Record<string, unknown> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "We couldn't register you as a host.");
	
	// Refresh user to get updated 'host' role
	const user = await getCurrentUser(token);
	return { host: body.data.host, user };
}

export async function getHostProperties() {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/hosts/properties`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
	const body = (await response.json()) as { data?: { properties: Array<Record<string, unknown>> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to load properties.");
	return body.data.properties;
}

export async function createProperty(propertyData: Record<string, unknown>) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/hosts/properties`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify(propertyData),
	});
	const body = (await response.json()) as { data?: { property: Record<string, unknown> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to create property.");
	return body.data.property;
}

export async function initPayUPayment(bookingId: string) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/payments/payu-init`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify({ bookingId }),
	});
	const body = (await response.json()) as { data?: Record<string, string>; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to initialize payment.");
	return body.data;
}

export async function verifyPayUPayment(bookingId: string) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/payments/payu-verify`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify({ bookingId }),
	});
	const body = (await response.json()) as { data?: { status: string }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to verify payment.");
	return body.data;
}

export async function refundPayUPayment(bookingId: string, amount?: number) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/payments/payu-refund`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify({ bookingId, amount }),
	});
	const body = (await response.json()) as { data?: { message: string, refundId: string }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to initiate refund.");
	return body.data;
}

export async function getAdminStats() {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
	const body = (await response.json()) as { data?: { users: number; hosts: number; properties: number; bookings: number }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to load admin stats.");
	return body.data;
}

export async function getPendingProperties() {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/admin/properties?status=PENDING_REVIEW`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
	const body = (await response.json()) as { data?: { properties: Array<Record<string, unknown>> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to load pending properties.");
	return body.data.properties;
}

export async function verifyProperty(id: string, status: "VERIFIED" | "REJECTED", reason?: string) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/admin/properties/${id}/verify`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify({ status, reason }),
	});
	const body = (await response.json()) as { data?: { property: Record<string, unknown> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to verify property.");
	return body.data.property;
}

export async function getHostBookings() {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/hosts/bookings`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
	const body = (await response.json()) as { data?: { bookings: Array<Record<string, unknown>> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to load host bookings.");
	return body.data.bookings;
}

export async function verifyBookingPass(bookingId: string) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/hosts/verify-pass`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify({ bookingId }),
	});
	const body = (await response.json()) as { data?: { booking: Record<string, unknown> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to verify stay pass.");
	return body.data.booking;
}

export async function getHostStats() {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	try {
		const response = await fetch(`${API_BASE_URL}/api/hosts/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
		if (!response.ok) return { totalProperties: 0, totalBookings: 0, totalEarnings: 0 };
		const body = await response.json();
		return body.data || { totalProperties: 0, totalBookings: 0, totalEarnings: 0 };
	} catch {
		return { totalProperties: 0, totalBookings: 0, totalEarnings: 0 };
	}
}

export async function verifyAccount(token: string) {
	try {
		const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token }),
		});
		const body = await response.json();
		if (!response.ok) return { success: false, message: body.error?.message ?? "Verification failed." };
		return { success: true, message: body.message ?? "Account verified successfully." };
	} catch {
		return { success: false, message: "Verification failed." };
	}
}

export async function createRoom(propertyId: string, roomData: Record<string, unknown>) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/hosts/properties/${propertyId}/rooms`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify(roomData),
	});
	const body = (await response.json()) as { data?: { room: Record<string, unknown> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to add room.");
	return body.data.room;
}

export async function getRoomAvailability(propertyId: string, roomId: string, startDate?: string, endDate?: string) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	
	let url = `${API_BASE_URL}/api/hosts/properties/${propertyId}/rooms/${roomId}/availability`;
	if (startDate && endDate) {
		url += `?start=${startDate}&end=${endDate}`;
	}

	const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
	const body = (await response.json()) as { data?: { availability: Array<Record<string, unknown>> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to load calendar.");
	return body.data.availability;
}

export async function updateRoomAvailability(propertyId: string, roomId: string, input: { startDate: string; endDate: string; status: 'available' | 'blocked'; price?: number }) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/hosts/properties/${propertyId}/rooms/${roomId}/availability`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify(input),
	});
	const body = (await response.json()) as { data?: { message: string, count: number }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to update calendar.");
	return body.data;
}

export async function getOwnerVerificationStatus() {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/verification/owner/status`, {
		headers: { Authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	const body = (await response.json()) as { data?: Record<string, unknown>; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to fetch verification status.");
	return body.data;
}

export async function verifyOwnerIdentity(idType: "aadhaar" | "passport" | "driving_licence" | "voter_id") {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/verification/owner/identity`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify({ idType }),
	});
	const body = (await response.json()) as { data?: Record<string, unknown>; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Identity verification failed.");
	return body.data;
}

export async function verifyOwnerPAN(input: { panNumber: string; panName: string }) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/verification/owner/pan`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify(input),
	});
	const body = (await response.json()) as { data?: Record<string, unknown>; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "PAN verification failed.");
	return body.data;
}

export async function setOperatorMode(propertyId: string, input: { isOwner: boolean; operatorRole: string }) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/verification/property/${propertyId}/operator-mode`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify(input),
	});
	const body = (await response.json()) as { data?: Record<string, unknown>; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to save operator status.");
	return body.data;
}

export async function uploadPropertyDocument(propertyId: string, input: { documentType: string; originalFilename: string; mimeType: string; fileBase64: string }) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/verification/property/${propertyId}/documents`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify(input),
	});
	const body = (await response.json()) as { data?: Record<string, unknown>; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Document upload failed.");
	return body.data;
}

export async function getPropertyDocuments(propertyId: string) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/verification/property/${propertyId}/documents`, {
		headers: { Authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	const body = (await response.json()) as { data?: { documents: Array<Record<string, unknown>>; propertyVerification?: Record<string, unknown> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to fetch property documents.");
	return body.data;
}

export async function deletePropertyDocument(propertyId: string, docId: string) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/verification/property/${propertyId}/documents/${docId}`, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${token}` },
	});
	const body = (await response.json()) as { data?: Record<string, unknown>; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to delete document.");
	return body.data;
}

export async function submitPropertyForReview(propertyId: string) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/verification/property/${propertyId}/submit`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
	});
	const body = (await response.json()) as { data?: Record<string, unknown>; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Submission failed.");
	return body.data;
}

export async function getAdminVerificationQueue(status = "PENDING_REVIEW") {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/admin/verification/queue?status=${status}`, {
		headers: { Authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	const body = (await response.json()) as { data?: { queue: Array<Record<string, unknown>> }; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to load verification queue.");
	return body.data.queue;
}

export async function reviewPropertyVerification(propertyId: string, input: { status: "VERIFIED" | "CHANGES_REQUESTED" | "REJECTED"; reason?: string }) {
	const token = localStorage.getItem("hopebed_access_token");
	if (!token) throw new Error("Please log in.");
	const response = await fetch(`${API_BASE_URL}/api/admin/properties/${propertyId}/verify`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify(input),
	});
	const body = (await response.json()) as { data?: Record<string, unknown>; error?: { message?: string } };
	if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Failed to review property.");
	return body.data;
}

