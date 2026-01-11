"use client";

import { deleteApp } from "@/app/actions/admin";
import { Trash2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "./Modal";

export default function DeleteAppButton({ appId, appName }: { appId: number, appName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const confirmDelete = async () => {
        setShowConfirm(false);
        setIsDeleting(true);
        setError(null);
        try {
            await deleteApp(appId);
            router.refresh();
        } catch (e: any) {
            setError(e.message || "Failed to delete app");
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete App"
                description={`Are you sure you want to delete "${appName}"? This action cannot be undone and will remove all associated reviews.`}
                confirmText="Delete"
                variant="danger"
                loading={isDeleting}
            />
            <div className="flex flex-col items-end gap-1">
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={isDeleting}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete App"
                >
                    <Trash2 className={`w-5 h-5 ${isDeleting ? 'animate-pulse' : ''}`} />
                </button>
                {error && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        <span>Error</span>
                    </div>
                )}
            </div>
        </>
    );
}
