"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Building, BookOpen, Ticket, Bell, Users, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.roles && user.roles.includes("ROLE_ADMIN")) {
                    setIsAdmin(true);
                }
                if (user.id) {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    fetch(`${apiUrl}/api/notifications/user/${user.id}`, { credentials: "include" })
                        .then(res => res.json())
                        .then(data => {
                            const unread = data.filter((n: any) => !n.isRead).length;
                            setUnreadCount(unread);
                        })
                        .catch(() => {});
                }
            } catch (e) {}
        }
    }, [pathname]);

    const navLinks = [
        { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
        { name: "Facilities Catalogue", path: "/dashboard/facilities", icon: Building },
        { name: "My Bookings", path: "/dashboard/bookings", icon: BookOpen },
        { name: "Ticketing", path: "/dashboard/tickets", icon: Ticket },
        { name: "Notifications", path: "/dashboard/notifications", icon: Bell },
    ];

    if (isAdmin) {
        navLinks.push({ name: "User Management", path: "/dashboard/users", icon: Users });
        navLinks.push({ name: "Admin Bookings", path: "/dashboard/admin-bookings", icon: BookOpen });
        navLinks.push({ name: "Admin Tickets", path: "/dashboard/admin-tickets", icon: Ticket });
        navLinks.push({ name: "Admin Facilities", path: "/dashboard/admin-facilities", icon: Building });
    }

    return (
        <div className="flex min-h-screen bg-[#020617] text-slate-100">
            {/* Sidebar */}
            <div className="group/sidebar flex flex-col items-center relative transition-all duration-[450ms] ease-in-out w-[80px] hover:w-[260px] h-screen sticky top-0 py-4 px-3 z-50">
                <article className="border border-solid border-slate-700/50 w-full h-full ease-in-out duration-500 rounded-2xl flex flex-col shadow-lg shadow-black/40 bg-slate-900/98 backdrop-blur-xl overflow-hidden">
                    
                    <div className="flex items-center w-full h-20 shrink-0 px-2 group-hover/sidebar:px-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 mx-auto group-hover/sidebar:mx-0 shadow-lg shadow-indigo-500/10 overflow-hidden border border-slate-700/60">
                            <img src="/A.png" alt="CourseFlow" className="w-[85%] h-[85%] object-contain" />
                        </div>
                        <h2 className="ml-4 text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 whitespace-nowrap overflow-hidden transition-all duration-300 max-w-0 opacity-0 group-hover/sidebar:max-w-xs group-hover/sidebar:opacity-100 uppercase tracking-tight">
                            CourseFlow
                        </h2>
                    </div>
                    
                    <nav className="flex flex-col w-full gap-2 px-2 py-4 flex-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.path;
                            const Icon = link.icon;
                            return (
                                <Link 
                                    key={link.path} 
                                    href={link.path}
                                    className={`relative w-full h-12 flex flex-row items-center justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-4 rounded-xl transition-all duration-300 ease-in-out border border-transparent group/link
                                      ${isActive 
                                        ? "shadow-lg bg-indigo-500/20 border-indigo-500/40 text-white" 
                                        : "hover:bg-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700/80"}
                                    `}
                                >
                                    <div className={`shrink-0 flex items-center justify-center transition-transform duration-300 ease-in-out
                                        ${isActive ? "scale-110 text-white" : "group-hover/link:scale-110"}
                                    `}>
                                        <Icon size={22} className="stroke-[1.5]" />
                                    </div>

                                    {/* Text Section + Badge */}
                                    <div className="flex items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300 max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-4 flex-1">
                                        <span className={`font-semibold text-[14px] ${isActive ? 'text-white' : 'text-slate-200 hover:text-white'}`}>{link.name}</span>
                                        {link.name === "Notifications" && unreadCount > 0 && (
                                            <span className="ml-2 bg-pink-500 text-white text-[10px] flex items-center justify-center font-black px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Absolute badge for collapsed state */}
                                    {link.name === "Notifications" && unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 flex w-2.5 h-2.5 bg-pink-500 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.8)] opacity-100 group-hover/sidebar:opacity-0 transition-opacity"></span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="w-full p-2 border-t border-slate-800/80">
                        <button 
                            onClick={async () => {
                                try {
                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                                    await fetch(`${apiUrl}/api/auth/logout`, { method: "POST", credentials: "include" });
                                } catch (e) {}
                                localStorage.removeItem("user");
                                window.location.href = "/login";
                            }}
                            className="relative w-full h-12 flex flex-row items-center justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-4 rounded-xl transition-all duration-300 ease-in-out border border-transparent text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/40 group/link"
                        >
                            <div className="shrink-0 flex items-center justify-center transition-transform duration-300 ease-in-out group-hover/link:scale-110">
                                <LogOut size={22} className="stroke-[1.5]" />
                            </div>
                            <div className="flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-4">
                                <span className="font-bold text-[14px]">Sign Out</span>
                            </div>
                        </button>
                    </div>
                </article>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto bg-slate-950/20 backdrop-blur-3xl min-h-screen">
                <div className="max-w-6xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
