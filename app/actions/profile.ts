"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    // Dev Mode Support
    const cookieStore = await cookies();
    const devRole = cookieStore.get('dev_role')?.value;

    let user = supabaseUser;
    if (!user && devRole) {
        user = {
            id: devRole === 'admin' ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002',
            email: `dev-${devRole}@example.com`
        } as any;
    }

    if (!user || user.email !== formData.get('email')) {
        throw new Error("Unauthorized");
    }

    const name = formData.get('name') as string;

    // Update Profile Table
    const { db } = await import("@/lib/db");
    const { profiles } = await import("@/lib/db/schema");

    await db.insert(profiles).values({
        id: user.id,
        email: user.email!,
        name: name,
    }).onConflictDoUpdate({
        target: profiles.id,
        set: {
            name: name,
            updatedAt: new Date(),
        }
    });

    // Update Supabase Metadata
    if (supabaseUser) {
        const { error } = await supabase.auth.updateUser({
            data: { full_name: name }
        });
        if (error) throw error;
    }

    revalidatePath('/profile');
    revalidatePath('/'); // Update header if it shows name
}
