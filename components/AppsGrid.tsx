"use client";

import Link from 'next/link';
import { Smartphone, Star, Search } from 'lucide-react';
import DownloadButton from './DownloadButton';
import Pagination from './Pagination';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface AppsGridProps {
    apps: any[];
    currentPage: number;
    totalPages: number;
    currentFilter: string;
    currentSearch: string;
}

export default function AppsGrid({ apps, currentPage, totalPages, currentFilter, currentSearch }: AppsGridProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(currentSearch);

    // Sync local state if URL changes externally (e.g. back button)
    useEffect(() => {
        setSearchQuery(currentSearch);
    }, [currentSearch]);

    // Debounced Search
    useEffect(() => {
        // Don't search if it's the initial sync or empty/same
        if (searchQuery === currentSearch) return;

        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchQuery.trim()) {
                params.set('search', searchQuery.trim());
            } else {
                params.delete('search');
            }
            params.set('page', '1');
            router.push(`/apps?${params.toString()}`);
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
    }, [searchQuery, currentSearch, router, searchParams]);

    const handleFilterChange = (filter: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('filter', filter);
        params.set('page', '1');
        router.push(`/apps?${params.toString()}`);
    };

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams);
        if (searchQuery.trim()) {
            params.set('search', searchQuery.trim());
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.push(`/apps?${params.toString()}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <h1 className="text-4xl font-bold text-white mb-4 md:mb-0 shrink-0">All Applications</h1>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search apps..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-gray-500"
                        />
                        <Search
                            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-white transition-colors"
                            onClick={handleSearch}
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex bg-white/5 rounded-full p-1 border border-white/10 shrink-0">
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`px-6 py-2 rounded-full font-medium text-sm transition-colors
                            ${currentFilter === 'all' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => handleFilterChange('android')}
                            className={`px-6 py-2 rounded-full font-medium text-sm transition-colors
                            ${currentFilter === 'android' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Android
                        </button>
                        <button
                            onClick={() => handleFilterChange('ios')}
                            className={`px-6 py-2 rounded-full font-medium text-sm transition-colors
                            ${currentFilter === 'ios' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            iOS
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {apps.map((app: any) => (
                    <div
                        key={app.id}
                        className="relative bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all group hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col"
                    >
                        <div className="flex items-start justify-between mb-4 pointer-events-none">
                            <div className="w-12 h-12 rounded-xl bg-white shadow-lg overflow-hidden shrink-0">
                                {app.iconUrl ? (
                                    <img src={app.iconUrl} alt={app.name} className="w-full h-full object-contain p-1" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className={`px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider
                ${app.os === 'android' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-gray-500/20 text-gray-300 border border-gray-500/20'}
              `}>
                                {app.os}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                            <Link href={`/app/${app.os}/${app.bundleId}`} className="before:absolute before:inset-0 focus:outline-none">
                                {app.name}
                            </Link>
                        </h3>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2 pointer-events-none">
                            {app.description || `Version ${app.version}`}
                        </p>

                        <div className="flex items-center justify-between mt-auto relative z-20">
                            {app.rating ? (
                                <div className="flex items-center text-yellow-500 text-sm pointer-events-none">
                                    <Star className="w-4 h-4 fill-current mr-1" />
                                    <span>{Number(app.rating).toFixed(1)}</span>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 pointer-events-none">No ratings</div>
                            )}
                            <DownloadButton
                                appId={app.id}
                                fileUrl={app.fileUrl}
                                variant="ghost"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {apps.length === 0 && (
                <div className="py-20 text-center text-gray-500">
                    No apps found matching your criteria.
                </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
    );
}
