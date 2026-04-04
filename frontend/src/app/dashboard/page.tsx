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
        <div className="relative min-h-screen w-full flex flex-col p-4 md:p-8 overflow-x-hidden">
            
            {/* Full-Page Perspective Background */}
            <div className="fixed inset-0 z-0">
                <img 
                    src="/overview-bg.png" 
                    className="w-full h-full object-cover opacity-20 scale-105 animate-pulse duration-[25s]" 
                    alt="Dashboard Backdrop"
                />
                <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-[2px]" />
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-pink-500/5" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                
                {/* 🚀 Elite Hero Section */}
                <div className="glass-card rounded-[3rem] p-8 md:p-14 border border-slate-700/40 bg-slate-900/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-indigo-500/10 to-transparent skew-x-12 transform translate-x-20" />
                    
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="w-28 h-28 rounded-[2rem] bg-slate-950 border border-slate-700/60 flex items-center justify-center p-1 shadow-2xl relative group/avatar">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-pink-500 opacity-20 blur-xl animate-pulse" />
                                <div className="w-full h-full rounded-[1.8rem] bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800">
                                    <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-tr from-indigo-400 to-pink-400">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="inline-flex items-center rounded-xl bg-indigo-500/10 px-4 py-1.5 border border-indigo-500/20">
                                    <span className="w-2 h-2 rounded-full bg-indigo-400 mr-3 animate-ping"></span>
                                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">System Active • CourseFlow 2.0</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
                                    Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">{user.name.split(' ')[0]}</span>
                                </h1>
                                <p className="text-slate-400 text-sm md:text-lg font-medium opacity-80 max-w-lg">
                                    Accessing as <span className="text-slate-200 font-bold">{user.email}</span>. Your personalized management summary is ready.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/80 px-5 py-2 rounded-2xl border border-slate-800 shadow-xl">
                                Access Level: <span className="text-rose-400 ml-1">{user.roles && user.roles.length > 0 ? user.roles[0].replace("ROLE_", "") : "USER"}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-bold italic opacity-60">Last sync: {new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                </div>

                {isAdmin ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000 delay-150">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                Command Center Intelligence
                            </h2>
                        </div>
                        
                        {loadingMetrics ? (
                            <div className="py-24 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compiling System Metrics</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: "Global Users", val: metrics.users, color: "sky", path: "/dashboard/users", desc: "Registry Identity" },
                                    { label: "Pending Requests", val: metrics.pendingBookings, color: "indigo", path: "/dashboard/admin-bookings", desc: "Workflow Queue" },
                                    { label: "Critical Incidents", val: metrics.openTickets, color: "rose", path: "/dashboard/admin-tickets", desc: "System Health" },
                                    { label: "Facility Nodes", val: metrics.facilities, color: "emerald", path: "/dashboard/admin-facilities", desc: "Resource Matrix" }
                                ].map((m, i) => (
                                    <div 
                                        key={i} 
                                        className={`glass-card p-8 rounded-[2.5rem] border border-slate-800/60 flex flex-col items-start justify-between transition-all duration-500 hover:scale-[1.03] hover:border-${m.color}-500/50 hover:bg-slate-900/80 cursor-pointer shadow-2xl relative overflow-hidden group`}
                                        onClick={() => router.push(m.path)}
                                    >
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${m.color}-500/10 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:opacity-100 opacity-60 transition-opacity`} />
                                        
                                        <div className="space-y-4 w-full relative z-10">
                                            <div className="flex items-center justify-between">
                                                <div className={`text-4xl font-black text-${m.color}-400 group-hover:scale-110 transition-transform duration-500`}>{m.val}</div>
                                                <div className={`w-8 h-8 rounded-lg bg-${m.color}-500/10 flex items-center justify-center border border-${m.color}-500/20`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-${m.color}-400 animate-pulse`} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[11px] font-black text-white uppercase tracking-widest">{m.label}</div>
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] opacity-80">{m.desc}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-1000 delay-150">
                        {[
                            { title: "Facilities Catalogue", desc: "Browse and initiate bookings for campus resources, meeting rooms, and specialized laboratory equipment.", path: "/dashboard/facilities", theme: "indigo" },
                            { title: "Incident Support Hub", desc: "Submit technical faults, property maintenance requests, or monitor the status of ongoing infrastructure repairs.", path: "/dashboard/tickets", theme: "pink" }
                        ].map((item, i) => (
                            <div 
                                key={i}
                                className={`glass-card p-12 rounded-[3.5rem] border border-slate-800/80 hover:border-${item.theme}-500/40 hover:bg-slate-900/60 transition-all duration-700 cursor-pointer shadow-2xl group flex flex-col justify-between relative overflow-hidden`}
                                onClick={() => router.push(item.path)}
                             >
                                <div className={`absolute inset-0 bg-gradient-to-br from-${item.theme}-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                <div className="space-y-6 relative z-10">
                                    <div className={`w-16 h-1 rounded-full bg-${item.theme}-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]`} />
                                    <div className="space-y-4">
                                        <h3 className={`text-3xl font-black text-white group-hover:text-${item.theme}-400 transition-colors tracking-tight`}>{item.title}</h3>
                                        <p className="text-slate-400 text-lg font-medium leading-relaxed opacity-80">{item.desc}</p>
                                    </div>
                                </div>
                                <div className="mt-12 flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-slate-300 transition-colors">
                                    Intitialize Access Request
                                    <div className={`w-6 h-6 rounded-full bg-${item.theme}-500/10 flex items-center justify-center border border-${item.theme}-500/20 group-hover:scale-110 transition-transform`}>
                                        <span className={`text-${item.theme}-400`}>→</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>


    );
}
