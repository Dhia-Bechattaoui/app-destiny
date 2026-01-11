
import { db } from "@/lib/db";
import { applications, versions } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import Link from 'next/link';
import { Smartphone, Download, Star } from 'lucide-react';
import { checkRole } from "@/app/actions/admin";

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
    let latestApps: any[] = [];
    try {
        const result = await db.execute(sql`
            SELECT 
                v.id as version_id, v.version, v.build_number, v.created_at,
                a.id as app_id, a.name, a.bundle_id, a.os, a.icon_url
            FROM versions v
            JOIN applications a ON v.app_id = a.id
            ORDER BY v.created_at DESC
            LIMIT 6
        `);

        latestApps = result.map((row: any) => ({
            id: row.version_id,
            name: row.name,
            bundleId: row.bundle_id,
            os: row.os,
            iconUrl: row.icon_url,
            version: row.version,
            createdAt: row.created_at
        }));
    } catch (e) {
        console.warn("DB Connection failed, showing empty state for demo");
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            {/* Hero Section */}
            <section className="relative py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a]" />

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                    Discover Next-Gen Apps
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
                    The premium destination for beta testing and distributing iOS and Android applications.
                    Upload locally, distribute globally.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/apps"
                        className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all flex items-center justify-center transform hover:scale-105"
                    >
                        Browse Apps
                    </Link>
                    {await checkRole('admin') && (
                        <Link
                            href="/dashboard/upload"
                            className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all flex items-center justify-center transform hover:scale-105"
                        >
                            Upload App
                        </Link>
                    )}
                </div>
            </section>

            {/* Featured Apps Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white">Latest Releases</h2>
                    <Link href="/apps" className="text-blue-400 hover:text-blue-300 text-sm font-medium">View All &rarr;</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {latestApps.map((app: any) => (
                        <Link
                            href={`/app/${app.os}/${app.bundleId}`}
                            key={app.id}
                            className="group relative bg-gray-900 rounded-3xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl border border-white/5"
                        >
                            <div className="p-6 flex flex-col items-center justify-center bg-gray-900 border border-white/5 rounded-3xl transition-transform duration-300 h-full">
                                {/* Icon */}
                                <div className="w-24 h-24 mb-6 rounded-2xl shadow-xl overflow-hidden bg-white flex items-center justify-center shrink-0">
                                    {app.iconUrl ? (
                                        <img src={app.iconUrl} alt={app.name} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <Smartphone className="w-10 h-10 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Text Info */}
                                <h3 className="text-xl font-bold text-white text-center mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {app.name}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                                    <span className="capitalize">{app.os}</span>
                                    <span>•</span>
                                    <span>v{app.version}</span>
                                </div>

                                {/* Download Action (Visual) */}
                                <div className="mt-auto flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-blue-400 text-sm font-medium transition-colors border border-white/5">
                                    <Download className="w-4 h-4" />
                                    <span>Download</span>
                                </div>

                                <div className="absolute top-4 right-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                        ${app.os === 'android' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-300'}
                                     `}>
                                        {app.os}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {latestApps.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                            <p className="text-lg">No apps available yet.</p>
                            <p className="text-sm mt-2">Upload your first app in the dashboard.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
