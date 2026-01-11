import { SignJWT, jwtVerify } from "jose";

export const SECRET_KEY = new TextEncoder().encode(process.env.ADMIN_SECRET || 'fallback-secret-do-not-use-prod');

/**
 * Creates a raw JWT token (Stateless)
 */
export async function signToken(userId: string, expiresInMs: number) {
    return new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + Math.floor(expiresInMs / 1000))
        .sign(SECRET_KEY);
}

/**
 * Verifies a JWT token signature (Stateless)
 */
export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch (e) {
        return null;
    }
}
