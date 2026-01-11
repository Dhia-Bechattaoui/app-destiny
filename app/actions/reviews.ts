
"use server";

import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Simplified: We create a dummy user if not logged in for this demo, 
// or assume we have auth. For MVP, we'll auto-create or use a hardcoded user ID logic 
// if user not found, but proper way is using Supabase auth.
// For this step, I'll create a "Guest" user if needed or require existing user.
// To make it easy: I will check if a Guest user exists, if not create one, then link review.

export async function addReview(appId: number, rating: number, comment: string) {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const devRole = cookieStore.get('dev_role')?.value;

    const { data: { user } } = await supabase.auth.getUser();

    // Determine current user ID and metadata
    let userId: string;
    let userName: string | null = null;
    let userEmail: string | null = null;

    if (user) {
        // Authenticated Supabase User
        userId = user.id;
        userEmail = user.email || null;
        userName = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
    } else if (devRole) {
        // Dev Mode User (Mock ID)
        const devEmail = `dev-${devRole}@example.com`;
        // Generate a static UUID-like string for dev users or use a consistent one
        userId = devRole === 'admin' ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002';
        userEmail = devEmail;
        userName = `Dev ${devRole.charAt(0).toUpperCase() + devRole.slice(1)}`;
    } else {
        throw new Error("You must be logged in to leave a review.");
    }

    // Ensure Profile exists (Safety Fallback)
    const { profiles } = await import("@/lib/db/schema");
    await db.insert(profiles).values({
        id: userId,
        email: userEmail,
        name: userName,
    }).onConflictDoNothing();

    try {
        await db.insert(reviews).values({
            appId,
            userId: userId,
            rating,
            comment,
        }).onConflictDoUpdate({
            target: [reviews.appId, reviews.userId],
            set: {
                rating,
                comment,
                createdAt: new Date(), // Optional: Update timestamp on edit
            }
        });
    } catch (e: any) {
        throw e;
    }

    // We can't easily guess the bundleId/platform here to revalidate the exact page without fetching app,
    // so we'll just revalidate the entire path structure or just let client refresh.
    // Ideally we pass bundleId/os to this action or fetch it.
    // For now, simple cache bust:
    revalidatePath('/app/[platform]/[bundleId]', 'page');
    revalidatePath('/apps/[platform]/[bundleId]', 'page');

    return { success: true };
}

export async function deleteReview(appId: number) {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const devRole = cookieStore.get('dev_role')?.value;

    const { data: { user } } = await supabase.auth.getUser();

    let userId: string;
    if (user) {
        userId = user.id;
    } else if (devRole) {
        userId = devRole === 'admin' ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002';
    } else {
        throw new Error("Unauthorized");
    }

    await db.delete(reviews).where(
        and(
            eq(reviews.appId, appId),
            eq(reviews.userId, userId)
        )
    );

    revalidatePath('/app/[platform]/[bundleId]', 'page');
    revalidatePath('/apps/[platform]/[bundleId]', 'page');
    return { success: true };
}
