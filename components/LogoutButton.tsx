
"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className, minimal = false }: { className?: string, minimal?: boolean }) {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        // Clear Supabase session
        await supabase.auth.signOut();
        // Clear Local session
        await logout();

        router.push('/login');
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            className={className || "flex items-center px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full text-left mt-auto"}
        >
            <LogOut className={`w-5 h-5 ${minimal ? '' : 'mr-3'}`} />
            {!minimal && "Logout"}
        </button>
    );
}
