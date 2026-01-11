import { NextRequest, NextResponse } from "next/server";
import { extendSessionIfActive } from "@/lib/auth/local";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-access-token')?.value;

        if (!token) {
            return NextResponse.json({ extended: false });
        }

        // This runs in Node.js runtime, so DB access is safe
        const newExpiry = await extendSessionIfActive(token);

        if (newExpiry) {
            // Update cookie
            cookieStore.set('sb-access-token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                expires: newExpiry,
                path: '/'
            });
            return NextResponse.json({ extended: true, newExpiry });
        }

        return NextResponse.json({ extended: false });
    } catch (e) {
        return NextResponse.json({ extended: false, error: 'Internal Error' }, { status: 500 });
    }
}
