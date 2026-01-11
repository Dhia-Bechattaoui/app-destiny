"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";

function VerifyEmailContent() {
    const [email, setEmail] = useState<string | null>(null);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const searchParams = useSearchParams();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setEmail(user.email);
                if (user.email_confirmed_at) {
                    router.push("/");
                    router.refresh();
                }
            } else {
                const emailParam = searchParams.get('email');
                if (emailParam) {
                    setEmail(emailParam);
                }
            }
        };
        checkUser();
    }, [searchParams, router, supabase.auth]);

    useEffect(() => {
        const storedEndTime = localStorage.getItem('resendEmailEndTime');
        if (storedEndTime) {
            const remaining = Math.ceil((parseInt(storedEndTime, 10) - Date.now()) / 1000);
            if (remaining > 0) {
                setResendCountdown(remaining);
            } else {
                localStorage.removeItem('resendEmailEndTime');
            }
        }
    }, []);

    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    const handleResend = async () => {
        if (!email) return;
        setLoading(true);
        setStatus(null);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                }
            });
            if (error) throw error;
            setResendCountdown(60);
            localStorage.setItem('resendEmailEndTime', (Date.now() + 60000).toString());
            setStatus({ type: 'success', message: 'Confirmation email resent!' });
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-500" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">Check Your Email</h1>
            <p className="text-gray-400 mb-6">
                {email
                    ? `We sent a confirmation link to ${email}`
                    : "We sent you a confirmation link."}
            </p>

            {status && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{status.message}</span>
                </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-500/20 p-4 rounded-lg mb-8">
                <p className="text-yellow-200 text-sm">
                    You need to verify your email address before you can access the dashboard.
                </p>
            </div>

            <button
                onClick={handleResend}
                disabled={resendCountdown > 0 || loading || !email}
                className="w-full py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
                {resendCountdown > 0
                    ? `Resend Email in ${resendCountdown}s`
                    : (loading ? "Sending..." : "Resend Confirmation Email")}
            </button>

            <button
                onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/login');
                }}
                className="text-sm text-gray-500 hover:text-gray-400"
            >
                Sign Out & Return to Login
            </button>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
