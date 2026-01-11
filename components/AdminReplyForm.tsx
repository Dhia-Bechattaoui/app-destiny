
"use client";

import { useState } from "react";
import { replyToReview } from "@/app/actions/admin";

export default function AdminReplyForm({ reviewId, currentReply = "" }: { reviewId: number; currentReply?: string }) {
    const [reply, setReply] = useState(currentReply);
    const [loading, setLoading] = useState(false);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setLoading(true);
        await replyToReview(reviewId, reply);
        setLoading(false);
    };

    return (
        <form onSubmit={handleReply} className="mt-4">
            <div className="flex gap-4">
                <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    {loading ? "Saving..." : (currentReply ? "Update Reply" : "Reply")}
                </button>
            </div>
        </form>
    );
}
