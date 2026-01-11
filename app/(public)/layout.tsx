import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Globe, Github, Linkedin } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import Navbar from './_components/Navbar';

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check Local Auth
    const token = cookieStore.get('sb-access-token')?.value;
    let localUser = null;
    if (token) {
        const { verifyToken } = await import("@/lib/auth/token");
        const payload = await verifyToken(token);
        if (payload) localUser = payload;
    }

    const isLoggedIn = !!user || !!localUser;
    const isAdmin = (!!user && user.user_metadata?.role === 'admin') || !!localUser; // Local users are admins

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white selection:bg-purple-500 selection:text-white">
            {/* Navigation */}
            {/* Navigation */}
            {/* Navigation */}
            <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} />

            {/* Main Content */}
            <main className="pt-16 flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black mt-20">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} AppDestiny. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a
                                href="http://Bechattaoui.Dev/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <Globe className="w-5 h-5" />
                                <span className="hidden md:inline">Portfolio</span>
                            </a>
                            <a
                                href="https://github.com/Dhia-Bechattaoui"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <Github className="w-5 h-5" />
                                <span className="hidden md:inline">GitHub</span>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/dhiaeddine-bechattaoui"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <Linkedin className="w-5 h-5" />
                                <span className="hidden md:inline">LinkedIn</span>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Background Gradients */}
            <div className="fixed top-0 left-0 -z-10 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="fixed bottom-0 right-0 -z-10 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />
        </div>
    );
}
