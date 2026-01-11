"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, User } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

interface NavbarProps {
    isLoggedIn: boolean;
    isAdmin: boolean;
    isAdmin: boolean;
}

export default function Navbar({ isLoggedIn, isAdmin }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 top-0 border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                            AppDestiny
                        </Link>
                    </div>

                    {/* Desktop Menu - Absolutely Centered */}
                    <div className="hidden md:absolute md:left-1/2 md:-translate-x-1/2 md:block">
                        <div className="flex items-center space-x-8">
                            <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Home
                            </Link>
                            <Link href="/apps" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Apps
                            </Link>
                            <Link href="/about" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                About
                            </Link>
                            {!isLoggedIn && (
                                <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Right Side Actions (Desktop & Mobile - simplified for mobile) */}
                    <div className="hidden md:flex items-center gap-4">
                        {isLoggedIn && (
                            <>
                                <span className="text-sm text-gray-400 hidden lg:inline">
                                    {isAdmin ? 'Admin' : 'User'}
                                </span>
                                <Link
                                    href="/profile"
                                    className="bg-white/10 hover:bg-white/20 text-white p-2 lg:px-4 lg:py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border border-white/10 flex items-center gap-2"
                                >
                                    <User className="w-4 h-4" />
                                    <span className="hidden lg:inline">Profile</span>
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/dashboard"
                                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border border-white/10"
                                    >
                                        Dashboard
                                    </Link>
                                )}
                                <LogoutButton
                                    minimal
                                    className="bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-300 p-2 rounded-full transition-all backdrop-blur-md border border-white/10"
                                />
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        {/* Show minimal user info/logout on mobile header or keep it in menu? 
                             The user said "only project name and logout" were visible, implying they might want menu items too.
                             Let's keep the logout/user info in the mobile menu dropdown for cleaner header, 
                             OR keep a logout button in header for easy access. 
                             I'll put everything in the dropdown for standard mobile nav patterns, 
                             BUT user specifically mentioned logout was visible, maybe they liked that?
                             I'll add the hamburger menu and put the main links inside. */}

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="bg-white/5 p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            href="/"
                            onClick={() => setIsOpen(false)}
                            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        >
                            Home
                        </Link>
                        <Link
                            href="/apps"
                            onClick={() => setIsOpen(false)}
                            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        >
                            Apps
                        </Link>
                        <Link
                            href="/about"
                            onClick={() => setIsOpen(false)}
                            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        >
                            About
                        </Link>
                        {!isLoggedIn && (
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                            >
                                Login
                            </Link>
                        )}

                        {/* Mobile Actions */}
                        <div className="border-t border-white/10 mt-4 pt-4 pb-2">
                            {isLoggedIn && (
                                <div className="space-y-3 px-3">
                                    <div className="text-sm text-gray-400">
                                        Logged in as {devRole ? `Dev ${devRole}` : 'User'}
                                    </div>
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsOpen(false)}
                                        className="block w-full text-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-base font-medium transition-all border border-white/10"
                                    >
                                        Profile Settings
                                    </Link>
                                    {isAdmin && (
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setIsOpen(false)}
                                            className="block w-full text-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-base font-medium transition-all border border-white/10"
                                        >
                                            Dashboard
                                        </Link>
                                    )}
                                    <div className="flex justify-start">
                                        <LogoutButton
                                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                                        />
                                        {/* Note: LogoutButton inside Navbar needs to handle text/style */}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
