"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            router.push("/login");
            return;
        }

        setUser(JSON.parse(storedUser));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-transparent">
            <div className="glass-card w-full max-w-2xl rounded-3xl p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>

                <div className="relative z-10">
                    <div className="mx-auto inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 mb-6 shadow-xl shadow-indigo-500/30">
                        <span className="text-4xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user.name}!</h1>
                    <p className="text-xl text-slate-400 mb-10">{user.email}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
                        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 transition-colors cursor-pointer group" onClick={() => router.push('/dashboard/facilities')}>
                            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">Facilities Catalogue</h3>
                            <p className="text-slate-400 text-sm mt-2">Browse and book resources, rooms, and equipment across campus.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/50 transition-colors cursor-pointer group" onClick={() => router.push('/dashboard/tickets')}>
                            <h3 className="text-lg font-semibold text-white group-hover:text-pink-400 transition-colors">Incident Ticketing</h3>
                            <p className="text-slate-400 text-sm mt-2">Report faults or view the status of existing maintenance issues.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
