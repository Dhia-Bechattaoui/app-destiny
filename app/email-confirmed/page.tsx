import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function EmailConfirmedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Email Confirmed!</h1>
                <p className="text-gray-400 mb-8">
                    Your email has been successfully verified. You can now access all features of the platform.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/dashboard"
                        className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Go to Dashboard
                    </Link>

                    <Link
                        href="/"
                        className="block text-sm text-gray-500 hover:text-white transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
