import { db } from "@/lib/db";
import { applications, versions } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import DeleteAppButton from "@/components/DeleteAppButton";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    let recentUploads: any[] = [];
    let stats = {
        total: 0,
        android: 0,
        ios: 0
    };

    try {
        // Fetch Stats (Unique Applications)
        const appsCount = await db.select({
            os: applications.os,
            count: sql<number>`count(*)`
        }).from(applications).groupBy(applications.os);

        stats.total = appsCount.reduce((acc, curr) => acc + Number(curr.count), 0);
        stats.android = Number(appsCount.find(a => a.os === 'android')?.count || 0);
        stats.ios = Number(appsCount.find(a => a.os === 'ios')?.count || 0);

        // Fetch Recent Uploads (Versions joined with App info)
        // limit 10 to cover recent history
        const result = await db.execute(sql`
            SELECT 
                v.id as version_id, v.version, v.build_number, v.created_at,
                a.id as app_id, a.name, a.bundle_id, a.os
            FROM versions v
            JOIN applications a ON v.app_id = a.id
            ORDER BY v.created_at DESC
            LIMIT 5
        `);

        recentUploads = result.map((row: any) => ({
            id: row.version_id, // Key for list can be version_id
            appId: row.app_id,
            name: row.name,
            bundleId: row.bundle_id,
            os: row.os,
            version: row.version,
            buildNumber: row.build_number,
            createdAt: new Date(row.created_at),
        }));

    } catch (e) {
        console.warn("DB Connection failed", e);
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Apps</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Android Apps</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stats.android}
                    </p>
                </div>
                <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">iOS Apps</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stats.ios}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <a href="/dashboard/apps" className="block p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]">
                    <h3 className="text-xl font-bold mb-2">Manage All Apps</h3>
                    <p className="text-blue-100 mb-4">View, edit, or delete uploaded applications.</p>
                    <span className="inline-block bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold">Go to Apps &rarr;</span>
                </a>
                <a href="/dashboard/upload" className="block p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]">
                    <h3 className="text-xl font-bold mb-2">Upload New App</h3>
                    <p className="text-purple-100 mb-4">Distribute a new APK or IPA file.</p>
                    <span className="inline-block bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold">Upload Now &rarr;</span>
                </a>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Uploads</h2>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm">
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium">Version</th>
                            <th className="px-6 py-3 font-medium">Platform</th>
                            <th className="px-6 py-3 font-medium">Bundle ID</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                        {recentUploads.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                <td className="px-6 py-4">
                                    <span className="font-medium text-gray-900 dark:text-white">{app.name}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                    {app.version} ({app.buildNumber})
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${app.os === 'android' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  `}>
                                        {app.os}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                    {app.bundleId}
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <DeleteAppButton appId={app.id} appName={app.name} />
                                </td>
                            </tr>
                        ))}
                        {recentUploads.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No apps uploaded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
