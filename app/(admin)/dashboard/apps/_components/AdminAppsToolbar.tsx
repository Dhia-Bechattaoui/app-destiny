"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface AdminAppsToolbarProps {
    currentSearch: string;
    currentFilter: string;
}

export default function AdminAppsToolbar({ currentSearch, currentFilter }: AdminAppsToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(currentSearch);

    // Sync local state if URL changes
    useEffect(() => {
        setSearchQuery(currentSearch);
    }, [currentSearch]);

    // Debounced Search
    useEffect(() => {
        if (searchQuery === currentSearch) return;

        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchQuery.trim()) {
                params.set('search', searchQuery.trim());
            } else {
                params.delete('search');
            }
            params.set('page', '1');
            router.push(`/dashboard/apps?${params.toString()}`);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, currentSearch, router, searchParams]);

    const handleFilterChange = (filter: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('filter', filter);
        params.set('page', '1');
        router.push(`/dashboard/apps?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 mb-6">
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
                <input
                    type="text"
                    placeholder="Search by name or bundle ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-2 pl-10 pr-4 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter Controls */}
            <div className="flex bg-gray-100 dark:bg-black/20 rounded-lg p-1 border border-gray-200 dark:border-white/10 shrink-0">
                {['all', 'android', 'ios'].map((f) => (
                    <button
                        key={f}
                        onClick={() => handleFilterChange(f)}
                        className={`px-4 py-1.5 rounded-md font-medium text-sm transition-all capitalize
                        ${currentFilter === f
                                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>
    );
}
