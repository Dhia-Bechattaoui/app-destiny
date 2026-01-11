
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Local Auth Fallback
    let localUser = null;
    if (!user) {
        const token = request.cookies.get('sb-access-token')?.value;
        if (token) {
            // Validate local token (Stateless check only to avoid Edge Runtime DB crash)
            const { verifyToken } = await import("./lib/auth/token");
            const payload = await verifyToken(token);

            if (payload) {
                // If signature is valid, temporarily assume admin access for middleware routing.
                // Full DB validation happens in Server Components (Layout).
                localUser = {
                    role: 'admin', // Assumption: Local users are admins
                    user_metadata: { role: 'admin' },
                    email: 'admin@local',
                    email_confirmed_at: new Date().toISOString()
                };
            }
        }
    }

    const effectiveUser = user || localUser;

    // Redirect authenticated users away from auth pages
    if (effectiveUser && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
        // 1. Check if completely unauthenticated
        if (!effectiveUser) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // 2. Check email confirmation (skip for local users)
        if (effectiveUser && !localUser && !(effectiveUser as any).email_confirmed_at) {
            // Allow access to /verify-email, prevent loop
            if (!request.nextUrl.pathname.startsWith("/verify-email")) {
                return NextResponse.redirect(new URL("/verify-email", request.url));
            }
        }

        // 3. Admin Access Check
        const isSupaAdmin = effectiveUser?.user_metadata?.role === 'admin';
        const isLocalAdmin = localUser?.role === 'admin';

        console.log('[Middleware] Dashboard Access Check:', {
            email: effectiveUser?.email,
            isSupaAdmin,
            isLocalAdmin,
            user_metadata: effectiveUser?.user_metadata,
            role: effectiveUser?.user_metadata?.role
        });

        if (!isSupaAdmin && !isLocalAdmin) {
            // User is logged in but not admin
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public directory)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|uploads/).*)",
    ],
};
