
import { users, sessions } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { signToken, SECRET_KEY } from "./token";

// SECRET_KEY imported from token.ts

/**
 * Creates a new user if not exists (for initial admin setup)
 */
export async function ensureAdminUser() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@appdestiny.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

    if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await db.insert(users).values({
            email: adminEmail,
            passwordHash: hashedPassword,
            role: 'admin'
        });
        console.log(`[Auth] Created initial admin user: ${adminEmail}`);
    }
}

/**
 * Verifies local user credentials
 */
export async function verifyCredentials(email: string, password: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0];

    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    return user;
}

/**
 * Creates a session for a user
 */
export async function createSession(userId: string, expiresInMs: number = 3600 * 1000) {
    const token = await signToken(userId, expiresInMs);

    const expiresAt = new Date(Date.now() + expiresInMs);

    await db.insert(sessions).values({
        token,
        userId,
        expiresAt
    });

    const cookieStore = await cookies();
    cookieStore.set('sb-access-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/'
    });

    return token;
}

/**
 * Validates a session token
 */
export async function validateSession(token: string) {
    try {
        await jwtVerify(token, SECRET_KEY);
        // Also check DB revocations
        const session = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
        const activeSession = session[0];

        if (!activeSession || activeSession.expiresAt < new Date()) {
            return null;
        }

        const userResult = await db.select().from(users).where(eq(users.id, activeSession.userId)).limit(1);
        const user = userResult[0];

        if (!user) return null;

        // Return user in format compatible with Supabase User
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            user_metadata: {
                role: user.role
            },
            email_confirmed_at: new Date().toISOString() // Local users are always confirmed
        };

    } catch (e) {
        return null;
    }
}

/**
 * Extends a session if it's close to expiring (Validation for Sliding Window)
 */
export async function extendSessionIfActive(token: string): Promise<Date | null> {
    try {
        const sessionResult = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
        const session = sessionResult[0];

        if (!session) return null;

        const now = new Date();
        const timeLeftMs = session.expiresAt.getTime() - now.getTime();

        // If session is valid but has less than 30 minutes left, extend it by 1 hour
        // This effectively creates a "sliding window" for active users
        if (timeLeftMs > 0 && timeLeftMs < 30 * 60 * 1000) {
            const newExpiresAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 Hour

            await db.update(sessions)
                .set({ expiresAt: newExpiresAt })
                .where(eq(sessions.token, token));

            return newExpiresAt;
        }

        return null; // No extension needed
    } catch (e) {
        return null;
    }
}
