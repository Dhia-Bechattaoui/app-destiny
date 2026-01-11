"use client";

import { Download } from "lucide-react";
import { trackDownload } from "@/app/actions/downloads";
import { useState } from "react";

interface DownloadButtonProps {
    appId: number;
    fileUrl: string;
    fileName?: string;
    className?: string;
    children?: React.ReactNode;
    variant?: 'primary' | 'outline' | 'ghost';
    os?: 'android' | 'ios';
}

export default function DownloadButton({
    appId,
    fileUrl,
    fileName,
    className,
    children,
    variant = 'primary',
    os
}: DownloadButtonProps) {
    const [tracking, setTracking] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent bubbling to card links
        // We don't prevent default, we want the browser to handle the download attribute
        // But we want to trigger the server action in parallel or before
        setTracking(true);
        try {
            await trackDownload(appId);
        } catch (e) {
            console.error("Tracking failed", e);
        } finally {
            setTracking(false);
            // After tracking (or failure), we let the browser proceed.
            // If we used e.preventDefault(), we'd manually trigger here:
            // window.location.href = fileUrl;
        }
    };

    if (children) {
        return (
            <a
                href={fileUrl}
                download={fileName || true}
                onClick={handleDownload}
                className={className}
            >
                {children}
            </a>
        );
    }

    if (variant === 'ghost') {
        return (
            <a
                href={fileUrl}
                download={fileName || true}
                onClick={handleDownload}
                className={className || "p-2 bg-white/5 rounded-full text-gray-300 hover:bg-blue-500 hover:text-white transition-colors"}
            >
                <Download className="w-4 h-4" />
            </a>
        );
    }

    if (variant === 'outline') {
        return (
            <a
                href={fileUrl}
                download={fileName || true}
                onClick={handleDownload}
                className={className || "flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium px-4 py-2 bg-blue-500/10 rounded-lg"}
            >
                <Download className="w-4 h-4" />
                Download
            </a>
        );
    }

    return (
        <a
            href={fileUrl}
            download={fileName || true}
            onClick={handleDownload}
            className={className || "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-600/20"}
        >
            <Download className="w-5 h-5" />
            Download {os ? (os === 'android' ? 'APK' : 'IPA') : 'Latest'}
        </a>
    );
}
