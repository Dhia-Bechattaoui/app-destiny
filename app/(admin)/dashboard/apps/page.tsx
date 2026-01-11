import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Smartphone, ArrowUp, ArrowDown } from "lucide-react";
import AppActions from "./_components/AppActions";
import Pagination from "@/components/Pagination";
import AdminAppsToolbar from "./_components/AdminAppsToolbar";

export const dynamic = 'force-dynamic';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ManageAppsPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const filter = (params.filter as string) || 'all';
    const search = (params.search as string) || '';
    const sort = (params.sort as string) || 'createdAt';
    const order = (params.order as string) || 'desc';

    let allApps: any[] = [];
    let totalCount = 0;

    // Helper to generate sort link
    const SortLink = ({ label, field }: { label: string, field: string }) => {
        const isActive = sort === field;
        const nextOrder = isActive && order === 'desc' ? 'asc' : 'desc';

        // Construct query string manually to keep lightweight
        const query = new URLSearchParams();
        if (filter !== 'all') query.set('filter', filter);
        if (search) query.set('search', search);
        query.set('sort', field);
        query.set('order', nextOrder);
        // Reset page on sort? Usually yes, or keep page 1.
        query.set('page', '1');

        return (
            <Link href={`/dashboard/apps?${query.toString()}`} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors group">
                {label}
                <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                    {isActive && order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </span>
            </Link>
        );
    };

    try {
        // Construct WHERE clause parts
        const conditions = [];
        if (filter !== 'all') {
            conditions.push(sql`a.os = ${filter}`);
        }
        if (search) {
            conditions.push(sql`(a.name ILIKE ${'%' + search + '%'} OR a.bundle_id ILIKE ${'%' + search + '%'})`);
        }

        const whereClause = conditions.length > 0
            ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
            : sql``;

        // 1. Count total applications (with filters)
        const countResult = await db.execute(sql`
            SELECT COUNT(*) as count 
            FROM applications a
            ${whereClause}
        `);
        totalCount = Number(countResult[0]?.count) || 0;

        // 2. Fetch Data
        // Mapping sort param to actual DB columns
        let orderByClause = sql`ORDER BY a.updated_at DESC`;

        switch (sort) {
            case 'name':
                orderByClause = order === 'asc' ? sql`ORDER BY a.name ASC` : sql`ORDER BY a.name DESC`;
                break;
            case 'os':
                orderByClause = order === 'asc' ? sql`ORDER BY a.os ASC` : sql`ORDER BY a.os DESC`;
                break;
            case 'version':
                // Sort by the version string from subquery
                orderByClause = order === 'asc' ? sql`ORDER BY v.version ASC` : sql`ORDER BY v.version DESC`;
                break;
            case 'createdAt':
                // Default is created/updated at
                orderByClause = order === 'asc' ? sql`ORDER BY a.updated_at ASC` : sql`ORDER BY a.updated_at DESC`;
                break;
        }

        const result = await db.execute(sql`
            SELECT 
                a.id, a.name, a.bundle_id, a.os, a.icon_url, a.description, a.created_at,
                v.version, v.build_number
            FROM applications a
            LEFT JOIN (
                SELECT DISTINCT ON (app_id) app_id, version, build_number
                FROM versions
                ORDER BY app_id, created_at DESC
            ) v ON a.id = v.app_id
            ${whereClause}
            ${orderByClause}
            LIMIT ${limit} OFFSET ${offset}
        `);

        allApps = result.map((row: any) => ({
            id: row.id,
            name: row.name,
            bundleId: row.bundle_id,
            os: row.os,
            version: row.version || '0.0.0',
            buildNumber: row.build_number || '0',
            iconUrl: row.icon_url,
            description: row.description,
            createdAt: new Date(row.created_at),
        }));
    } catch (e) {
        console.warn("DB Connection failed", e);
    }

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-2 mb-2 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Apps</h1>
                </div>
                <Link
                    href="/dashboard/upload"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    + Upload New App
                </Link>
            </div>

            <AdminAppsToolbar currentSearch={search} currentFilter={filter} />

            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-white/10">
                            <th className="px-6 py-3 font-medium select-none">
                                <SortLink label="App" field="name" />
                            </th>
                            <th className="px-6 py-3 font-medium select-none">
                                <SortLink label="Version" field="version" />
                            </th>
                            <th className="px-6 py-3 font-medium select-none">
                                <SortLink label="Platform" field="os" />
                            </th>
                            <th className="px-6 py-3 font-medium select-none">
                                <SortLink label="Uploaded" field="createdAt" />
                            </th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                        {allApps.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 dark:border-white/10">
                                            {app.iconUrl ? (
                                                <img src={app.iconUrl} alt={app.name} className="w-full h-full object-contain p-0.5" />
                                            ) : (
                                                <Smartphone className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{app.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[150px]" title={app.bundleId}>
                                                {app.bundleId}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">v{app.version}</span>
                                    <span className="text-gray-400 text-xs ml-2">({app.buildNumber})</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${app.os === 'android' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {app.os}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                    <div className="flex flex-col">
                                        <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end">
                                        <AppActions
                                            appId={app.id}
                                            appName={app.name}
                                            initialDescription={app.description}
                                            initialVersion={app.version}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {allApps.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                    <p className="text-lg font-medium mb-2">No apps found</p>
                                    <p className="text-sm">Try adjusting your search or filters.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} />
        </div>
    );
}
