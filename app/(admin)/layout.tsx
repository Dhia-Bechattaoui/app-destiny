import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white dark:bg-black/50 border-b border-gray-200 dark:border-white/10 h-16 flex items-center px-8 justify-end backdrop-blur-md">
                    <div className="flex items-center space-x-4">
                        {/* Auth/User Profile Placeholder */}
                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
