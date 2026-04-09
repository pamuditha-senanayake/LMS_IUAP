"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
    Users as UsersIcon, 
    Calendar, 
    LifeBuoy, 
    Building2, 
    ChevronRight, 
    ShieldCheck,
    Clock,
    Activity
} from "lucide-react";

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
                            fetch(apiUrl + "/api/resources", { credentials: "include" })
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
        <div className="relative min-h-screen w-full flex flex-col p-4 md:p-8 bg-[#020617]">
            {/* Background Decorations - Subtle */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                
                {/* Professional Hero Section */}
                <div className="relative rounded-[2.5rem] p-8 md:p-12 border border-slate-800/60 bg-slate-900/40 backdrop-blur-3xl shadow-xl overflow-hidden group">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-sky-500/10" />
                                <div className="w-full h-full rounded-[1.8rem] bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800/50">
                                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-tr from-indigo-400 to-sky-400">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="inline-flex items-center rounded-lg bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5"></div>
                                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Service Status: Online</span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                                    Welcome back, <span className="text-indigo-400">{user.name.split(' ')[0]}</span>
                                </h1>
                                <p className="text-slate-400 text-sm md:text-base font-medium opacity-80">
                                    Managing institution resources as <span className="text-slate-200">{user.email}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                                <ShieldCheck size={14} className="text-indigo-400" />
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                                    {user.roles && user.roles.length > 0 ? user.roles[0].replace("ROLE_", "") : "USER"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                <Clock size={12} />
                                Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                </div>

                {isAdmin ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000 delay-150">
                        <div className="flex items-center gap-4">
                            <Activity size={20} className="text-indigo-400" />
                            <h2 className="text-lg font-bold text-white tracking-wide uppercase">Platform Statistics</h2>
                            <div className="flex-1 h-[1px] bg-slate-800/80" />
                        </div>
                        
                        {loadingMetrics ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                                <div className="w-10 h-10 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Synchronizing Stats...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: "Total Users", val: metrics.users, color: "blue", path: "/dashboard/users", icon: UsersIcon },
                                    { label: "Bookings Queue", val: metrics.pendingBookings, color: "indigo", path: "/dashboard/admin-bookings", icon: Calendar },
                                    { label: "Resolved Help", val: metrics.openTickets, color: "rose", path: "/dashboard/admin-tickets", icon: LifeBuoy },
                                    { label: "Campus Assets", val: metrics.facilities, color: "emerald", path: "/dashboard/admin-facilities", icon: Building2 }
                                ].map((m, i) => (
                                    <div 
                                        key={i} 
                                        className="group relative p-6 rounded-[2rem] border border-slate-800/60 bg-slate-900/20 hover:bg-slate-900/60 transition-all duration-300 cursor-pointer shadow-lg overflow-hidden"
                                        onClick={() => router.push(m.path)}
                                    >
                                        <div className="relative z-10 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className={`p-3 rounded-2xl bg-slate-950 border border-slate-800 group-hover:border-${m.color}-500/50 transition-colors`}>
                                                    <m.icon size={20} className={`text-slate-400 group-hover:text-${m.color}-400 transition-colors`} />
                                                </div>
                                                <div className="p-1 px-2.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-black text-slate-500 group-hover:text-white transition-colors">
                                                    +Sync
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-3xl font-black text-white mb-1">{m.val}</div>
                                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {[
                            { title: "Facilities Catalogue", desc: "Browse campus resources, check availability, and manage your booking schedule in one unified portal.", path: "/dashboard/facilities", icon: Building2, color: "indigo" },
                            { title: "Incident Support Hub", desc: "Report issues, request property maintenance, and track the progress of ongoing technical resolutions.", path: "/dashboard/tickets", icon: LifeBuoy, color: "rose" }
                        ].map((item, i) => (
                            <div 
                                key={i}
                                className="group p-10 rounded-[2.5rem] border border-slate-800/60 bg-slate-900/20 hover:bg-slate-900/60 transition-all duration-300 cursor-pointer shadow-xl relative overflow-hidden"
                                onClick={() => router.push(item.path)}
                             >
                                <div className="relative z-10 space-y-6">
                                    <div className={`w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:border-${item.color}-500/50 transition-colors`}>
                                        <item.icon size={24} className={`text-slate-500 group-hover:text-${item.color}-400`} />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-slate-400 text-base font-medium leading-relaxed opacity-80">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <div className="pt-4 flex items-center gap-3 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                                        Explore Service <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
