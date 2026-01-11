"use client";

import Link from 'next/link';
import { LayoutDashboard, Upload, MessageSquare, Globe, Menu, X, AppWindow } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const closeMenu = () => setIsOpen(false);

    const NavLinks = () => (
        <>
            <Link
                href="/dashboard"
                onClick={closeMenu}
                className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${pathname === '/dashboard' ? 'bg-gray-100 dark:bg-white/10 text-blue-600 dark:text-white' : ''}`}
            >
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
            </Link>
            <Link
                href="/dashboard/apps"
                onClick={closeMenu}
                className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${pathname === '/dashboard/apps' ? 'bg-gray-100 dark:bg-white/10 text-blue-600 dark:text-white' : ''}`}
            >
                <AppWindow className="w-5 h-5 mr-3" />
                Manage Apps
            </Link>
            <Link
                href="/dashboard/upload"
                onClick={closeMenu}
                className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${pathname === '/dashboard/upload' ? 'bg-gray-100 dark:bg-white/10 text-blue-600 dark:text-white' : ''}`}
            >
                <Upload className="w-5 h-5 mr-3" />
                Upload App
            </Link>
            <Link
                href="/dashboard/reviews"
                onClick={closeMenu}
                className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${pathname === '/dashboard/reviews' ? 'bg-gray-100 dark:bg-white/10 text-blue-600 dark:text-white' : ''}`}
            >
                <MessageSquare className="w-5 h-5 mr-3" />
                Reviews
            </Link>
            <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                <Globe className="w-5 h-5 mr-3" />
                View Website
            </Link>
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-white/10">
                <LogoutButton />
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-black/80 rounded-md shadow-md border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 bg-white dark:bg-black/50 border-r border-gray-200 dark:border-white/10 h-full flex-shrink-0 backdrop-blur-md">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        AppDestiny
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <NavLinks />
                </nav>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeMenu}
                    />

                    {/* Drawer */}
                    <aside className="absolute top-0 left-0 w-64 h-full bg-white dark:bg-black shadow-2xl p-6 flex flex-col border-r border-gray-200 dark:border-white/10">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                AppDestiny
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
                        </div>
                        <nav className="space-y-2 flex-1">
                            <NavLinks />
                        </nav>
                    </aside>
                </div>
            )}
        </>
    );
}
