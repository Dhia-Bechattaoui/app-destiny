"use client";

import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
    const router = useRouter();
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.apk') || droppedFile.name.endsWith('.ipa')) {
                setFile(droppedFile);
            } else {
                setErrorMsg("Only .apk and .ipa files are allowed.");
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setErrorMsg(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setErrorMsg(null);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: file,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-File-Name': encodeURIComponent(file.name),
                    'X-File-Type': file.type,
                    'X-File-Size': file.size.toString(),
                },
            });

            const result = await response.json();

            if (response.status === 409) {
                setErrorMsg(`⚠️ Duplicate Build: ${result.error}`);
                setUploading(false);
                return;
            }

            if (response.ok && result.success) {
                setIsSuccess(true);
                router.refresh();
            } else {
                throw new Error(result.error || "Upload failed");
            }
        } catch (error: any) {
            console.error(error);
            setErrorMsg(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="bg-white dark:bg-white/5 rounded-3xl p-12 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col items-center">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-8 animate-bounce">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Upload Complete!</h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-md mx-auto">
                        Your app has been successfully analyzed and is now ready for distribution.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all transform hover:scale-[1.02]"
                        >
                            Return to Dashboard
                        </button>
                        <button
                            onClick={() => { setIsSuccess(false); setFile(null); }}
                            className="flex-1 px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all transform hover:scale-[1.02]"
                        >
                            Upload Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Upload App</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-12">Select your .apk or .ipa file to start the automated analysis.</p>

            {errorMsg && (
                <div className="mb-8 bg-red-50 border-2 border-red-100 text-red-700 px-6 py-4 rounded-2xl flex items-center shadow-sm">
                    <AlertCircle className="w-6 h-6 mr-3 shrink-0" />
                    <span className="font-medium">{errorMsg}</span>
                </div>
            )}

            <div
                className={`relative border-4 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center transition-all duration-300
                    ${dragActive ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 scale-[1.02]" : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"}
                    ${file ? "border-green-500 bg-green-50/50 dark:bg-green-500/10" : "hover:border-gray-300 dark:hover:border-white/20"}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                    accept=".apk,.ipa"
                />

                {file ? (
                    <>
                        <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{file.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                            className="z-10 px-8 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                            onClick={(e) => { e.preventDefault(); setFile(null); }}
                        >
                            Remove File
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-gray-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <UploadCloud className={`w-10 h-10 ${dragActive ? "text-blue-500 animate-pulse" : "text-gray-400"}`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Drop your app here
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            or click to browse your files
                        </p>
                    </>
                )}
            </div>

            {file && (
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={`group relative overflow-hidden px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/30 transition-all duration-300
                            ${uploading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 hover:scale-105 active:scale-95"}
                        `}
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            {uploading ? (
                                <>
                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    Analyzing Build...
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-6 h-6" />
                                    Upload & Distribute
                                </>
                            )}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
