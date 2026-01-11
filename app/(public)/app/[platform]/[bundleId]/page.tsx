import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { applications, versions, reviews, profiles } from "@/lib/db/schema";
import { desc, eq, and, sql, ne } from "drizzle-orm";
import { Download, Smartphone, Calendar, HardDrive, Star } from "lucide-react";
import AddReviewForm from "@/components/AddReviewForm";
import DownloadButton from "@/components/DownloadButton";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Pagination from "@/components/Pagination";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{
        platform: string;
        bundleId: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { platform, bundleId } = await params;

    const [app] = await db.select({ name: applications.name, description: applications.description })
        .from(applications)
        .where(and(eq(applications.bundleId, bundleId), eq(applications.os, platform as any)))
        .limit(1);

    if (!app) {
        return {
            title: 'App Not Found',
        };
    }

    return {
        title: `${app.name} | App Destiny`,
        description: app.description || `Download ${app.name} for ${platform}.`,
    };
}

export default async function AppDetailsPage({ params, searchParams }: Props) {
    const { platform, bundleId } = await params;
    const page = Number((await searchParams).page) || 1;
    const pageSize = 5;

    // Validate Platform
    if (platform !== 'android' && platform !== 'ios') {
        return notFound();
    }

    // 1. Fetch Parent Application
    const [app] = await db.select()
        .from(applications)
        .where(and(eq(applications.bundleId, bundleId), eq(applications.os, platform as any)))
        .limit(1);

    if (!app) {
        return notFound();
    }

    // 2. Fetch Latest Version (For Header)
    const [latestVersion] = await db.select()
        .from(versions)
        .where(eq(versions.appId, app.id))
        .orderBy(desc(versions.buildNumber))
        .limit(1);

    if (!latestVersion) {
        return notFound();
    }

    // 3. Fetch Archive Versions (Paginated, excluding latest)
    const offset = (page - 1) * pageSize;

    // Get total count of ARCHIVE versions (excluding latest)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(versions)
        .where(and(
            eq(versions.appId, app.id),
            ne(versions.id, latestVersion.id)
        ));
    const totalPages = Math.ceil(count / pageSize);

    const archiveVersionsList = await db.select()
        .from(versions)
        .where(and(
            eq(versions.appId, app.id),
            ne(versions.id, latestVersion.id)
        ))
        .orderBy(desc(versions.buildNumber))
        .limit(pageSize)
        .offset(offset);

    // Construct objects for UI
    const latestApp = { ...latestVersion, ...app, id: latestVersion.id, appId: app.id };
    const oldVersions = archiveVersionsList.map(v => ({
        ...v,
        ...app,
        id: v.id,
        appId: app.id
    }));

    // Fetch Reviews (Linked to Application ID now)
    let appReviews: any[] = [];
    try {
        appReviews = await db.select({
            id: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            adminReply: reviews.adminReply,
            createdAt: reviews.createdAt,
            userId: reviews.userId,
            userName: profiles.name,
            userEmail: profiles.email,
        })
            .from(reviews)
            .leftJoin(profiles, eq(reviews.userId, profiles.id))
            .where(eq(reviews.appId, app.id))
            .orderBy(desc(reviews.createdAt));
    } catch (e) { }

    // Get current user to see if they already reviewed
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Dev Mode Support
    const cookieStore = await cookies();
    const devRole = cookieStore.get('dev_role')?.value;
    let currentUserId = authUser?.id;
    if (!currentUserId && devRole) {
        currentUserId = devRole === 'admin' ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002';
    }

    const userReview = appReviews.find(r => r.userId === currentUserId);

    const averageRating = appReviews.length > 0
        ? (appReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / appReviews.length).toFixed(1)
        : "0.0";

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden shadow-2xl bg-white flex items-center justify-center shrink-0">
                        {latestApp.iconUrl ? (
                            <img src={latestApp.iconUrl} alt={latestApp.name} className="w-full h-full object-contain p-2" />
                        ) : (
                            <Smartphone className="w-16 h-16 text-gray-600" />
                        )}
                    </div>

                    <div className="flex-1">
                        <h1 className="text-4xl font-bold text-white mb-2">{latestApp.name}</h1>
                        <div className="flex items-center gap-4 text-gray-400 mb-6 text-sm">
                            <span className="bg-white/10 px-3 py-1 rounded-full text-white">{latestApp.os === 'android' ? 'Android' : 'iOS'}</span>
                            <span className="flex items-center gap-1">
                                v{latestApp.version} ({latestApp.buildNumber})
                            </span>
                            <span className="flex items-center gap-1">
                                <HardDrive className="w-4 h-4" />
                                {latestApp.size || "Unknown Size"}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <DownloadButton
                                appId={latestApp.id}
                                fileUrl={latestApp.fileUrl}
                                os={latestApp.os}
                            />
                            <div className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-white">{averageRating}</span>
                                <span className="text-gray-500">({appReviews.length} reviews)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">About this app</h2>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                {latestApp.description || "No description provided."}
                            </p>
                            <div className="mt-4 text-sm text-gray-500">
                                Bundle ID: <code className="text-blue-400">{latestApp.bundleId}</code>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Calendar className="w-6 h-6" />
                                Version Archive
                            </h2>
                            {oldVersions.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                        {oldVersions.map((ver, idx) => (
                                            <div key={ver.id} className={`flex items-center justify-between p-4 ${idx !== oldVersions.length - 1 ? 'border-b border-white/10' : ''} hover:bg-white/5 transition-colors`}>
                                                <div>
                                                    <div className="font-bold text-white">v{ver.version} <span className="text-gray-500 text-sm">({ver.buildNumber})</span></div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(ver.createdAt).toLocaleDateString()} • {ver.size || 'Unknown'}
                                                    </div>
                                                </div>
                                                <DownloadButton
                                                    appId={ver.id}
                                                    fileUrl={ver.fileUrl}
                                                    variant="outline"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination currentPage={page} totalPages={totalPages} />
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No older versions available.</p>
                            )}
                        </section>

                        <section id="reviews">
                            <h2 className="text-2xl font-bold text-white mb-6">Reviews & Ratings</h2>
                            <AddReviewForm
                                appId={latestApp.appId}
                                initialReview={userReview ? { rating: userReview.rating, comment: userReview.comment || "" } : undefined}
                            />

                            <div className="space-y-4 mt-8">
                                {appReviews.map((review: any) => (
                                    <div key={review.id} className={`p-6 rounded-2xl border ${review.userId === currentUserId ? 'bg-blue-600/5 border-blue-600/20' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-700'}`} />
                                                    ))}
                                                </div>
                                                {review.userId === currentUserId && (
                                                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Your Review</span>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-300">{review.comment}</p>
                                        <p className="text-xs text-gray-500 mt-2">By {review.userName || review.userEmail}</p>

                                        {review.adminReply && (
                                            <div className="mt-4 ml-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Developer Reply</span>
                                                </div>
                                                <p className="text-gray-300 text-sm italic leading-relaxed">
                                                    "{review.adminReply}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {appReviews.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">Latest Release Info</h3>
                            <dl className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-400">Uploaded</dt>
                                    <dd className="text-white">{new Date(latestApp.createdAt).toLocaleDateString()}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-400">Downloads</dt>
                                    <dd className="text-white">{latestApp.downloadCount} +</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-400">Size</dt>
                                    <dd className="text-white">{latestApp.size || "Unknown"}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
