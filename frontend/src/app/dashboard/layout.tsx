"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
    LayoutDashboard, 
    Building, 
    BookOpen, 
    Ticket, 
    Bell, 
    Users, 
    LogOut,
    User as UserIcon,
    ChevronDown,
    Menu,
    X,
    Home as HomeIcon,
    BarChart3
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            window.location.href = "/login";
            return;
        }

        try {
            const userData = JSON.parse(storedUser);
            if (userData.roles?.includes("ROLE_ADMIN")) {
                setIsAdmin(true);
            }
            if (userData.id) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                fetch(`${apiUrl}/api/notifications/user/${userData.id}`, { credentials: "include" })
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            setUnreadCount(data.filter((n: any) => !n.isRead).length);
                        }
                    })
                    .catch(() => {});
            }
        } catch (e) {}
        
        setIsLoaded(true);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            await fetch(`${apiUrl}/api/auth/logout`, { method: "POST", credentials: "include" });
        } catch (e) {}
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const adminLinks = [
        { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
        { name: "Ticketing", path: "/dashboard/tickets", icon: Ticket },
        { name: "Ticket Statistics", path: "/dashboard/ticket-statistics", icon: BarChart3 },
        { name: "User Management", path: "/dashboard/users", icon: Users },
        { name: "Admin Tickets", path: "/dashboard/admin-tickets", icon: Ticket },
        { name: "Admin Facilities", path: "/dashboard/admin-facilities", icon: Building },
        { name: "Alerts", path: "/dashboard/notifications", icon: Bell },
    ];

    if (!isLoaded) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    // ADMIN VIEW - SIDEBAR ONLY
    if (isAdmin) {
        return (
            <div className="flex items-start min-h-screen bg-[#020617] text-slate-100">
                <div className="group/sidebar flex flex-col items-center fixed top-0 left-0 transition-all duration-[450ms] ease-in-out w-[80px] hover:w-[260px] h-screen py-6 px-3 z-50">
                    <article className="border border-solid border-slate-700/50 w-full h-full ease-in-out duration-500 rounded-2xl flex flex-col shadow-lg shadow-black/40 bg-slate-900/98 backdrop-blur-xl overflow-y-auto overflow-x-hidden scrollbar-none">
                        <div className="flex items-center w-full h-20 shrink-0 px-2 group-hover/sidebar:px-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 mx-auto group-hover/sidebar:mx-0 shadow-lg shadow-indigo-500/10 overflow-hidden border border-slate-700/60">
                                <img src="/A.png" alt="Logo" className="w-[85%] h-[85%] object-contain" />
                            </div>
                            <h2 className="ml-4 text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 whitespace-nowrap overflow-hidden transition-all duration-300 max-w-0 opacity-0 group-hover/sidebar:max-w-xs group-hover/sidebar:opacity-100 uppercase tracking-tighter">
                                IUAP <span className="text-white/90">CORE</span>
                            </h2>
                        </div>
                        
                        <nav className="flex flex-col w-full gap-2 px-2 py-4 flex-1">
                            {adminLinks.map((link) => {
                                const isActive = pathname === link.path;
                                const Icon = link.icon;
                                return (
                                    <Link key={link.path} href={link.path} className={`relative w-full h-12 flex flex-row items-center justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-4 rounded-xl transition-all duration-300 ease-in-out border border-transparent group/link ${isActive ? "shadow-lg bg-indigo-500/20 border-indigo-500/40 text-white" : "hover:bg-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700/80"}`}>
                                        <Icon size={22} className="stroke-[1.5]" />
                                        <div className="flex items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300 max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-4 flex-1">
                                            <span className="font-semibold text-[14px]">{link.name}</span>
                                            {link.name === "Alerts" && unreadCount > 0 && (
                                                <span className="bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">{unreadCount}</span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="w-full p-2 border-t border-slate-800/80">
                            <button onClick={handleLogout} className="relative w-full h-12 flex flex-row items-center justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-4 rounded-xl transition-all duration-300 text-rose-500 hover:bg-rose-500/20">
                                <LogOut size={22} strokeWidth={1.5} />
                                <span className="ml-4 font-bold text-[14px] transition-all opacity-0 group-hover/sidebar:opacity-100">Sign Out</span>
                            </button>
                        </div>
                    </article>
                </div>
                <main className="flex-1 bg-slate-950/20 transition-all duration-[450ms] ml-[80px] group-hover/sidebar:ml-[260px]">
                    <div className="max-w-7xl mx-auto p-8 py-12 md:py-20">{children}</div>
                </main>
            </div>
        );
    }

    // STUDENT/LECTURER VIEW
    return (
        <main className="min-h-screen pt-20">
            <div className="max-w-7xl mx-auto p-6 md:p-10">
                {children}
            </div>
        </main>
    );
}
