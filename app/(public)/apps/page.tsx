import { db } from "@/lib/db";
import { applications, reviews, versions } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import AppsGrid from "@/components/AppsGrid";

export const dynamic = 'force-dynamic';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
export const metadata = {
    title: 'Apps Catalog | App Destiny',
    description: 'Browse our extensive collection of iOS and Android beta apps.',
};

export default async function AppsCatalogPage({ searchParams }: Props) {
    const page = Number((await searchParams).page) || 1;
    const filter = (await searchParams).filter as string || 'all';
    const search = (await searchParams).search as string || '';
    const pageSize = 12;
    const offset = (page - 1) * pageSize;

    let allApps: any[] = [];
    let totalPages = 0;

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

        // 1. Get Total Count
        const countResult = await db.execute(sql`
            SELECT COUNT(*) as count 
            FROM applications a
            ${whereClause}
        `);
        const totalCount = Number(countResult[0]?.count) || 0;
        totalPages = Math.ceil(totalCount / pageSize);

        // 2. Get Data
        const result = await db.execute(sql`
            SELECT 
                a.id, a.name, a.bundle_id, a.os, a.icon_url, a.description,
                AVG(r.rating) as rating,
                v.version
            FROM applications a
            LEFT JOIN reviews r ON a.id = r.app_id
            LEFT JOIN (
                SELECT DISTINCT ON (app_id) app_id, version
                FROM versions
                ORDER BY app_id, created_at DESC
            ) v ON a.id = v.app_id
            ${whereClause}
            GROUP BY a.id, a.name, a.bundle_id, a.os, a.icon_url, a.description, v.version
            ORDER BY a.created_at DESC
            LIMIT ${pageSize} OFFSET ${offset}
        `);

        allApps = result.map((row: any) => ({
            id: row.id,
            name: row.name,
            bundleId: row.bundle_id,
            os: row.os,
            version: row.version || '0.0.0',
            iconUrl: row.icon_url,
            description: row.description,
            rating: Number(row.rating) || 0,
            fileUrl: ''
        }));
    } catch (e) {
        console.warn("DB Connection failed", e);
    }

    return (
        <AppsGrid
            apps={allApps}
            currentPage={page}
            totalPages={totalPages}
            currentFilter={filter}
            currentSearch={search}
        />
    );
}
