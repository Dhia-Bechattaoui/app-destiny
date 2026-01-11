
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";



export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();
    const [resendCountdown, setResendCountdown] = useState(0);

    const supabase = createClient();

    // Countdown timer effect
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            // Check if we are in Local Mode (no Supabase)
            const isLocalMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

            if (isLocalMode) {
                if (isSignUp) {
                    throw new Error("Sign up is disabled. Please contact an administrator.");
                }

                // Import dynamically to avoid server actions in client bundle issues if not needed
                const { loginWithLocal } = await import("@/app/actions/auth");

                // Create FormData for the server action
                const formData = new FormData();
                formData.append('email', email);
                formData.append('password', password);
                if (rememberMe) formData.append('rememberMe', 'on');

                const res = await loginWithLocal(formData);
                if (res?.error) {
                    throw new Error(res.error);
                }

                router.refresh();
                router.push("/dashboard");
                return;
            }

            // Supabase Mode
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                        data: { role: 'user' }
                    }
                });
                if (error) {
                    if (error.message.includes("already registered") || error.message.includes("already created")) {
                        throw new Error("This email is already registered. Please sign in.");
                    }
                    throw error;
                }
                setSuccessMsg("Confirmation link sent! Please check your email to confirm your account.");
                setResendCountdown(60);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/");
                router.refresh();
            }
        } catch (error: any) {
            if (error.message.includes("Email not confirmed")) {
                router.push(`/verify-email?email=${encodeURIComponent(email)}`);
                return;
            }
            if (error.message.includes("Invalid login credentials")) {
                setErrorMsg("Incorrect email or password. Please try again.");
                return;
            }
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCountdown > 0) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: { emailRedirectTo: `${location.origin}/auth/callback` }
            });
            if (error) throw error;
            setResendCountdown(60);
            setSuccessMsg("Confirmation email resent! Please check your inbox.");
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="w-full max-w-md p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                <h1 className="text-3xl font-bold text-white mb-2 text-center">
                    {isSignUp ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    {isSignUp ? "Join the community to review apps" : "Sign in to your account"}
                </p>

                {errorMsg && (
                    <div className="mb-6 bg-red-900/40 border border-red-500/30 text-red-200 p-4 rounded-lg text-center text-sm">
                        {errorMsg}
                    </div>
                )}

                {successMsg ? (
                    <div className="mb-6 bg-green-900/40 border border-green-500/30 text-green-400 p-6 rounded-lg text-center">
                        <p className="font-semibold mb-2 text-lg">🎉 Almost there!</p>
                        <p className="mb-6">{successMsg}</p>
                        <div className="space-y-4">
                            <button
                                onClick={handleResend}
                                disabled={resendCountdown > 0 || loading}
                                className="px-4 py-2 bg-green-800/50 hover:bg-green-800/70 border border-green-500/50 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resendCountdown > 0 ? `Resend Email in ${resendCountdown}s` : (loading ? "Sending..." : "Resend Confirmation Email")}
                            </button>
                            <p className="text-sm text-green-500/70">You can close this tab and log in after clicking the email link.</p>
                        </div>
                        <button onClick={() => setSuccessMsg(null)} className="mt-6 text-sm text-green-500/50 hover:text-green-400 underline">Back to Login</button>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleAuth} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {!isSignUp && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-600 bg-black/50 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="rememberMe" className="text-gray-400 text-sm select-none cursor-pointer">
                                        Remember me (30 days)
                                    </label>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setSuccessMsg(null);
                                    setErrorMsg(null);
                                    setEmail("");
                                    setPassword("");
                                }}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
