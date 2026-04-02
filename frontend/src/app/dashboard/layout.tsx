"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navLinks = [
        { name: "Overview", path: "/dashboard" },
        { name: "Facilities Catalogue", path: "/dashboard/facilities" },
        { name: "My Bookings", path: "/dashboard/bookings" },
        { name: "Ticketing", path: "/dashboard/tickets" },
        { name: "Notifications", path: "/dashboard/notifications" },
    ];

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
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto w-full">
                    <button 
                        onClick={() => {
                            localStorage.removeItem("token");
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
