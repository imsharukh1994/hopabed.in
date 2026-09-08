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
