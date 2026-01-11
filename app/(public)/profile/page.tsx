import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { User, Mail, Save } from "lucide-react";
import { cookies } from "next/headers";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Dev Mode Support
    const cookieStore = await cookies();
    const devRole = cookieStore.get('dev_role')?.value;

    let user = authUser;

    if (!user && devRole) {
        user = {
            email: `dev-${devRole}@example.com`,
            id: devRole === 'admin' ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002',
        } as any;
    }

    if (!user) {
        redirect('/login');
    }

    const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, user.id)
    });

    const displayName = profile?.name || user.user_metadata?.full_name || '';

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <form action={updateProfile} className="space-y-6">
                    <input type="hidden" name="email" value={user.email!} />

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                value={user.email!}
                                disabled
                                className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-3 text-gray-500 sm:text-sm cursor-not-allowed"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-600">Email cannot be changed.</p>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                            Display Name
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                defaultValue={displayName}
                                placeholder="Enter your full name"
                                className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
