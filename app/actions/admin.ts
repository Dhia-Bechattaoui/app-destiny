"use server";

import { db } from "@/lib/db";
import { reviews, applications, versions } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { join } from "path";
import fs from "fs";

export async function checkRole(requiredRole: 'admin' | 'user') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Check Supabase User
    if (user && user.user_metadata?.role === requiredRole) {
        return true;
    }

    // 2. Check Local Auth Token
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (token) {
        const { verifyToken } = await import("@/lib/auth/token");
        const payload = await verifyToken(token);
        // Assuming all local users are admins for now, or check payload scope if you added it
        if (payload) return true;
    }

    return false;
}

export async function replyToReview(reviewId: number, reply: string) {
    if (!await checkRole('admin')) {
        throw new Error("Unauthorized");
    }

    await db.update(reviews)
        .set({ adminReply: reply })
        .where(eq(reviews.id, reviewId));

    revalidatePath('/dashboard/reviews');
    revalidatePath('/app/[platform]/[bundleId]', 'page');
    revalidatePath('/apps/[platform]/[bundleId]', 'page');
    return { success: true };
}

export async function deleteApp(appId: number) {
    if (!await checkRole('admin')) {
        throw new Error("Unauthorized");
    }

    // 1. Fetch app and versions to get file/icon URLs
    const app = await db.select().from(applications).where(eq(applications.id, appId)).limit(1);
    const appVersions = await db.select().from(versions).where(eq(versions.appId, appId));

    if (app.length > 0) {
        const item = app[0];

        // Delete Icon
        if (item.iconUrl && item.iconUrl.startsWith('/uploads/')) {
            const iconPath = join(process.cwd(), 'public', item.iconUrl);
            if (fs.existsSync(iconPath)) {
                await fs.promises.unlink(iconPath).catch(console.error);
            }
        }

        // Delete Version Files
        for (const v of appVersions) {
            if (v.fileUrl.startsWith('/uploads/')) {
                const filePath = join(process.cwd(), 'public', v.fileUrl);
                if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath).catch(console.error);
                }
            }
        }
    }

    // Cascade deletes reviews, downloads, versions
    await db.delete(applications).where(eq(applications.id, appId));

    revalidatePath('/dashboard');
    revalidatePath('/apps');

    return { success: true };
}

export async function updateApp(appId: number, data: { name?: string; description?: string; version?: string }) {
    if (!await checkRole('admin')) {
        throw new Error("Unauthorized");
    }

    // We only update Application metadata.
    await db.update(applications)
        .set({
            name: data.name,
            description: data.description,
            updatedAt: new Date(),
        })
        .where(eq(applications.id, appId));

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/apps');
    revalidatePath('/apps');

    return { success: true };
}
