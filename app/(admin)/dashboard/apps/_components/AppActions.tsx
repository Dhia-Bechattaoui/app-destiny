"use client";

import { useState } from "react";
import { Edit2, Trash2, X, Check, AlertCircle } from "lucide-react";
import { deleteApp, updateApp } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

interface AppActionsProps {
    appId: number;
    appName: string;
    initialDescription?: string;
    initialVersion?: string;
}

export default function AppActions({ appId, appName, initialDescription, initialVersion }: AppActionsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const router = useRouter();

    // Edit State
    const [name, setName] = useState(appName);
    const [description, setDescription] = useState(initialDescription || "");
    const [version, setVersion] = useState(initialVersion || "");

    const confirmDelete = async () => {
        setShowDeleteConfirm(false);
        setIsDeleting(true);
        setStatus(null);
        try {
            await deleteApp(appId);
            router.refresh();
        } catch (e: any) {
            setStatus({ type: 'error', message: e.message || "Failed to delete app" });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        setStatus(null);
        try {
            await updateApp(appId, { name, description, version });
            setStatus({ type: 'success', message: "App updated successfully!" });
            setTimeout(() => {
                setIsEditing(false);
                setStatus(null);
            }, 1500);
            router.refresh();
        } catch (e: any) {
            setStatus({ type: 'error', message: e.message || "Failed to update app" });
        } finally {
            setLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Application</h3>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {status && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                            }`}>
                            <AlertCircle className="w-5 h-5 font-bold" />
                            <span className="text-sm font-medium">{status.message}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">App Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Enter app name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Version</label>
                            <input
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="e.g. 1.0.0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                                placeholder="Describe the application..."
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {loading ? "Saving..." : <><Check className="w-5 h-5" /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Application"
                description={`Are you sure you want to delete "${appName}"? This will permanently remove all versions and reviews.`}
                confirmText="Delete"
                variant="danger"
                loading={isDeleting}
            />

            <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                title="Edit App"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete App"
            >
                <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
            </button>

            {status && status.type === 'error' && !isEditing && (
                <div className="absolute top-full right-0 mt-2 p-2 bg-red-500/90 text-white text-[10px] rounded shadow-lg z-10 animate-in fade-in slide-in-from-top-1">
                    {status.message}
                </div>
            )}
        </div>
    );
}
