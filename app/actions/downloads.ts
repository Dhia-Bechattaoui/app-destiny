"use server";

import { db } from "@/lib/db";
import { applications, downloads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "drizzle-orm";

export async function trackDownload(appId: number) {
    try {
        const cookieStore = await cookies();
        let guestId = cookieStore.get('guest_id')?.value;

        // Ensure Guest ID exists for everyone
        if (!guestId) {
            guestId = uuidv4();
            cookieStore.set('guest_id', guestId, {
                maxAge: 60 * 60 * 24 * 365, // 1 year
                path: '/',
                httpOnly: true
            });
        }

        // Check using ONLY guest_id
        const existing = await db.select().from(downloads).where(
            and(eq(downloads.appId, appId), eq(downloads.guestId, guestId))
        ).limit(1);

        if (existing.length === 0) {
            await db.transaction(async (tx) => {
                await tx.insert(downloads).values({
                    appId,
                    guestId: guestId!, // Assert non-null because we just set it
                });

                await tx.execute(sql`
                    UPDATE applications 
                    SET download_count = download_count + 1 
                    WHERE id = ${appId}
                `);
            });

            revalidatePath('/app/[platform]/[bundleId]', 'page');
            revalidatePath('/apps/[platform]/[bundleId]', 'page');
            revalidatePath('/apps');
        }

        return { success: true };
    } catch (e) {
        console.error("Track download failed:", e);
        return { success: false };
    }
}
