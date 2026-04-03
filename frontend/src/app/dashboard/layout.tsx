"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
        { name: "Overview", path: "/dashboard" },
        { name: "Facilities Catalogue", path: "/dashboard/facilities" },
        { name: "My Bookings", path: "/dashboard/bookings" },
        { name: "Ticketing", path: "/dashboard/tickets" },
        { name: "Notifications", path: "/dashboard/notifications" },
    ];

    if (isAdmin) {
        navLinks.push({ name: "User Management", path: "/dashboard/users" });
        navLinks.push({ name: "Admin Bookings", path: "/dashboard/admin-bookings" });
        navLinks.push({ name: "Admin Tickets", path: "/dashboard/admin-tickets" });
        navLinks.push({ name: "Admin Facilities", path: "/dashboard/admin-facilities" });
    }

    return (
        <div className="flex min-h-screen bg-transparent">
            {/* Sidebar */}
            <aside className="w-64 glass-card border-l-0 border-t-0 border-b-0 rounded-none h-screen sticky top-0 flex flex-col items-start p-6 pt-10">
                <div className="mb-10 w-full text-center">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-500">
                        Campus Hub
                    </h2>
                </div>
                
                <nav className="flex flex-col w-full gap-2">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.path;
                        return (
                            <Link 
                                key={link.path} 
                                href={link.path}
                                className={`px-4 py-3 rounded-xl transition-all font-medium border border-transparent
                                  ${isActive 
                                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-700"}
                                `}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span>{link.name}</span>
                                    {link.name === "Notifications" && unreadCount > 0 && (
                                        <span className="bg-pink-500 text-white text-[10px] items-center justify-center font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto w-full">
                    <button 
                        onClick={async () => {
                            try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                                await fetch(`${apiUrl}/api/auth/logout`, { method: "POST", credentials: "include" });
                            } catch (e) {}
                            localStorage.removeItem("user");
                            window.location.href = "/login";
                        }}
                        className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors font-medium"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
