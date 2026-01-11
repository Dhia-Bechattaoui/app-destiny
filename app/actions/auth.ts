"use server";

import { verifyCredentials, createSession, ensureAdminUser } from "@/lib/auth/local";
import { cookies } from "next/headers";

// Auth actions are now handled directly by Supabase Auth. 
// Local user sync has been removed as per new architecture.
export async function syncUser() {
    // No-op
}

export async function ensureUserInDb(userData: { id: string; email: string; name?: string }) {
    // No-op
}

export async function loginWithLocal(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    try {
        await ensureAdminUser(); // Ensure admin exists on first use

        const user = await verifyCredentials(email, password);
        if (!user) {
            return { error: "Invalid credentials" };
        }

        const rememberMe = formData.get('rememberMe') === 'on';
        const expiresInMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 3600 * 1000; // 30 days vs 1 hour

        await createSession(user.id, expiresInMs);
        return { success: true };
    } catch (e: any) {
        console.error("Local login error:", e);
        return { error: "An unexpected error occurred" };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('sb-access-token');
}
