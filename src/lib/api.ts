export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.hopebed.in";

type AuthResponse = {
	success: boolean;
	data: { token: string; user: { id: string; name: string; email: string; role: string } };
};

export async function authenticateWithGoogle(credential: string): Promise<AuthResponse> {
	const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ credential }),
	});

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
	const response = await fetch(`${API_BASE_URL}/api/auth/${input.mode === "signup" ? "register" : "login"}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: input.name, email: input.email, password: input.password }),
	});
	const body = (await response.json()) as AuthResponse | { error?: { message?: string } };
	if (!response.ok || !("data" in body)) {
		throw new Error("error" in body ? body.error?.message ?? "Authentication failed." : "Authentication failed.");
	}
	return body;
}
