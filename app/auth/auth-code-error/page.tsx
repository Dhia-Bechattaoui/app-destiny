"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    let title = "Authentication Error";
    let message = "We couldn't verify your email link. It may be invalid or expired.";

    if (error === 'pkce_code_verifier_not_found') {
        title = "Browser Mismatch";
        message = "For security reasons, you must open the verification link in the SAME browser/tab where you started the sign-up process.";
    } else if (error === 'otp_expired' || error === 'access_denied') {
        title = "Link Expired";
        message = "This verification link has expired or has already been used. Please try logging in.";
    } else if (error === 'no_code') {
        title = "Invalid Link";
        message = "The verification link appears to be malformed or missing the verification code.";
    }

    return (
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl text-center">
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
            <p className="text-gray-400 mb-8">{message}</p>

            <div className="space-y-4">
                <Link
                    href="/login"
                    className="block w-full py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
                >
                    Go to Login
                </Link>
            </div>
        </div>
    );
}

export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <Suspense>
                <ErrorContent />
            </Suspense>
        </div>
    );
}
