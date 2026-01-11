
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    // Handle errors returned directly from Supabase (e.g. link expired, invalid, etc.)
    const errorParam = searchParams.get('error');
    const errorCodeParam = searchParams.get('error_code');
    const errorDescParam = searchParams.get('error_description');

    if (errorParam || errorCodeParam) {
        const finalCode = errorCodeParam || errorParam;
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${finalCode}&description=${errorDescParam}`);
    }

    if (code) {
        const supabase = await createClient();

        // Check if a user is ALREADY logged in before we process the new code
        const { data: { user: existingUser } } = await supabase.auth.getUser();

        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("Auth Callback Error:", error);
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error.code}`);
        }

        if (session?.user) {
            // Sync Profile (Always sync the confirmed user)
            const user = session.user;
            const { db } = await import("@/lib/db");
            const { profiles } = await import("@/lib/db/schema");

            await db.insert(profiles).values({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0],
            }).onConflictDoUpdate({
                target: profiles.id,
                set: {
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    updatedAt: new Date(),
                }
            });

            // Logic:
            // If user was already logged in -> Setup complete, show "Confirmed" page.
            // If user was NOT logged in -> Auto-login, redirect to Dashboard/Next.
            if (existingUser) {
                return NextResponse.redirect(`${origin}/email-confirmed`);
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
}
