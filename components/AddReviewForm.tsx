"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { addReview, deleteReview } from "@/app/actions/reviews";
import Modal from "./Modal";

export default function AddReviewForm({
    appId,
    initialReview
}: {
    appId: number;
    initialReview?: { rating: number; comment: string };
}) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Sync state if initialReview changes (e.g. after deletion/update or login)
    useEffect(() => {
        if (initialReview) {
            setRating(initialReview.rating);
            setComment(initialReview.comment);
        } else {
            setRating(5);
            setComment("");
        }
    }, [initialReview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);
        try {
            await addReview(appId, rating, comment);
            if (!initialReview) setComment("");
            setStatus({ type: 'success', message: `Review ${initialReview ? 'updated' : 'submitted'} successfully!` });
            setTimeout(() => setStatus(null), 5000);
        } catch (e: any) {
            setStatus({ type: 'error', message: e.message || 'Failed to submit review' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        setShowConfirm(false);
        setDeleting(true);
        setStatus(null);
        try {
            await deleteReview(appId);
            setRating(5);
            setComment("");
            setStatus({ type: 'success', message: 'Review deleted successfully!' });
            setTimeout(() => setStatus(null), 5000);
        } catch (e: any) {
            setStatus({ type: 'error', message: e.message || 'Failed to delete review' });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Review"
                description="Are you sure you want to delete your review? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                loading={deleting}
            />
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-white mb-4">
                    {initialReview ? "Edit Your Review" : "Write a Review"}
                </h3>

                {status && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-medium">{status.message}</span>
                    </div>
                )}

                <div className="flex items-center space-x-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                className={`w-8 h-8 ${star <= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-600"}`}
                            />
                        </button>
                    ))}
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this app..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px] mb-4"
                    required
                />

                <div className="flex justify-between items-center">
                    {initialReview ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting || submitting}
                            className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium text-sm transition-colors py-2 px-4 rounded-full hover:bg-red-500/10"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? "Deleting..." : "Delete Review"}
                        </button>
                    ) : <div />}

                    <button
                        type="submit"
                        disabled={submitting || deleting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Saving..." : (initialReview ? "Update Review" : "Post Review")}
                    </button>
                </div>
            </form>
        </>
    );
}
