import { db } from "@/lib/db";
import { reviews, profiles, applications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Star, MessageSquare, User, Smartphone } from "lucide-react";
import AdminReplyForm from "@/components/AdminReplyForm";

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
    const allReviews = await db.select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        adminReply: reviews.adminReply,
        createdAt: reviews.createdAt,
        userEmail: profiles.email,
        userName: profiles.name,
        appName: applications.name,
    })
        .from(reviews)
        .leftJoin(profiles, eq(reviews.userId, profiles.id))
        .leftJoin(applications, eq(reviews.appId, applications.id))
        .orderBy(desc(reviews.createdAt));

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Reviews</h1>

            <div className="grid gap-6">
                {allReviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-medium text-blue-400 uppercase tracking-wider">
                                        {review.appName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900 dark:text-white font-medium">{review.userName || review.userEmail}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${star <= review.rating ? "text-yellow-500 fill-current" : "text-gray-300 dark:text-gray-700"}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-black/30 rounded-xl p-4 mb-6">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">"{review.comment}"</p>
                        </div>

                        <AdminReplyForm
                            reviewId={review.id}
                            currentReply={review.adminReply || ""}
                        />
                    </div>
                ))}

                {allReviews.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No reviews to manage yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StarIcon({ rating }: { rating: number }) {
    // Determine color based on rating if needed
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
    )
}
