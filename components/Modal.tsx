"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "info";
    loading?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "info",
    loading = false
}: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        {description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl transition-all border border-white/10"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-6 py-3 font-bold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 ${variant === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                                }`}
                        >
                            {loading ? "Processing..." : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
