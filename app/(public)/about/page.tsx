
import { ShieldCheck, Zap, Globe } from 'lucide-react';
import { checkRole } from "@/app/actions/admin";

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Empowering Developers <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        Delighting Users
                    </span>
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                    AppDestiny is the premier platform for beta testing and distributing mobile applications.
                    We bridge the gap between innovative developers and early adopters.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Fast Distribution</h3>
                    <p className="text-gray-400">
                        Upload your APKs and IPAs and share them with the world in seconds. No complex review processes.
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Secure & Verified</h3>
                    <p className="text-gray-400">
                        Every app is scanned for basic security. We prioritize user safety and transparent testing.
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Global Reach</h3>
                    <p className="text-gray-400">
                        Your apps are accessible from anywhere. Connect with testers from across the globe.
                    </p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to ship your app?</h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        Join thousands of developers who trust AppDestiny for their beta launches.
                    </p>
                    {await checkRole('admin') && (
                        <a
                            href="/dashboard/upload"
                            className="inline-flex px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                        >
                            Start Uploading
                        </a>
                    )}
                </div>

                {/* Decorative background blur */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/10 blur-3xl -z-0 pointer-events-none" />
            </div>
        </div>
    );
}
