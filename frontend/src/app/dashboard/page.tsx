"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [user, setUser] = useState<{ name: string, email: string, roles: string[] } | null>(null);
    const [metrics, setMetrics] = useState({ users: 0, pendingBookings: 0, openTickets: 0, facilities: 0 });
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUserAndMetrics = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(apiUrl + "/api/auth/me", { credentials: "include" });
                
                if (!res.ok) throw new Error("Not authenticated");
                const data = await res.json();
                setUser(data);
                localStorage.setItem("user", JSON.stringify(data));

                if (data.roles && data.roles.includes("ROLE_ADMIN")) {
                    try {
                        const [uRes, bRes, tRes, fRes] = await Promise.all([
                            fetch(apiUrl + "/api/users", { credentials: "include" }),
                            fetch(apiUrl + "/api/bookings", { credentials: "include" }),
                            fetch(apiUrl + "/api/tickets", { credentials: "include" }),
                            fetch(apiUrl + "/api/facilities/resources", { credentials: "include" })
                        ]);

                        const usersData = uRes.ok ? await uRes.json() : [];
                        const bookingsData = bRes.ok ? await bRes.json() : [];
                        const ticketsData = tRes.ok ? await tRes.json() : [];
                        const facilitiesData = fRes.ok ? await fRes.json() : [];

                        const pendingBookings = bookingsData.filter((b: any) => !b.status || b.status === "PENDING" || b.status === "OPEN").length;
                        const openTickets = ticketsData.filter((t: any) => !t.status || t.status === "OPEN" || t.status === "IN_PROGRESS").length;

                        setMetrics({
                            users: usersData.length || 0,
                            pendingBookings,
                            openTickets,
                            facilities: facilitiesData.length || 0
                        });
                    } catch (e) {
                        console.error("Metric sync failed", e);
                    }
                }
            } catch (err) {
                localStorage.removeItem("user");
                router.push("/login");
            } finally {
                setLoadingMetrics(false);
            }
        };

        fetchUserAndMetrics();
    }, [router]);

    if (!user) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading Profile...</div>;

    const isAdmin = user.roles && user.roles.includes("ROLE_ADMIN");

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-6 bg-transparent">
            <div className={"glass-card w-full rounded-3xl p-8 md:p-12 text-center relative overflow-hidden " + (isAdmin ? 'max-w-4xl' : 'max-w-2xl')}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>

                <div className="relative z-10 w-full">
                    <div className="mx-auto flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 mb-6 shadow-xl shadow-indigo-500/30">
                        <span className="text-4xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user.name}!</h1>
                    <p className="text-xl text-slate-400 mb-2">{user.email}</p>
                    <div className="mb-10 inline-flex items-center rounded-full bg-slate-800/80 px-4 py-1.5 border border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                        <span className="text-sm font-medium text-slate-300">
                            Role: {user.roles && user.roles.length > 0 ? user.roles.map(r => r.replace("ROLE_", "")).join(", ") : "USER"}
                        </span>
                    </div>

                    {isAdmin ? (
                        <div className="w-full text-left">
                            <h2 className="text-2xl font-bold text-slate-200 mb-6 border-b border-slate-700/50 pb-4">Administrative Overview</h2>
                            
                            {loadingMetrics ? (
                                <div className="text-center text-slate-400 py-10">Synchronizing global metrics...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center transition-all hover:-translate-y-1 hover:border-sky-500/50 cursor-pointer" onClick={() => router.push('/dashboard/users')}>
                                        <div className="text-4xl font-black text-sky-400 mb-2">{metrics.users}</div>
                                        <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Total Users</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center transition-all hover:-translate-y-1 hover:border-indigo-500/50 cursor-pointer" onClick={() => router.push('/dashboard/admin-bookings')}>
                                        <div className="text-4xl font-black text-indigo-400 mb-2">{metrics.pendingBookings}</div>
                                        <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest text-center">Pending Bookings</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center transition-all hover:-translate-y-1 hover:border-rose-500/50 cursor-pointer" onClick={() => router.push('/dashboard/admin-tickets')}>
                                        <div className="text-4xl font-black text-rose-400 mb-2">{metrics.openTickets}</div>
                                        <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest text-center">Open Tickets</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center transition-all hover:-translate-y-1 hover:border-emerald-500/50 cursor-pointer" onClick={() => router.push('/dashboard/admin-facilities')}>
                                        <div className="text-4xl font-black text-emerald-400 mb-2">{metrics.facilities}</div>
                                        <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest text-center">Facilities</div>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
}
