"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
    LayoutDashboard, 
    Building, 
    Ticket, 
    Bell, 
    Users, 
    LogOut, 
    Home as HomeIcon, 
    Menu, 
    X,
    ChevronRight,
    Calendar
} from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsAdmin(userData.roles?.includes("ROLE_ADMIN"));
                
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
            } catch {
                // ignore parse errors
            }
        }
        return () => window.removeEventListener("scroll", handleScroll);
    }, [pathname]);

    useEffect(() => {
        if (isAdmin && pathname === "/") {
            router.push("/dashboard");
        }
    }, [isAdmin, pathname, router]);

    const handleLogout = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            await fetch(`${apiUrl}/api/auth/logout`, { method: "POST", credentials: "include" });
        } catch {
            // ignore network errors
        }
        localStorage.removeItem("user");
        setUser(null);
        setIsAdmin(false);
        router.push("/");
    };

    // Configuration for Links
    const rawLinks = [
        { name: "Home", path: "/", icon: HomeIcon },
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Facilities", path: "/dashboard/facilities", icon: Building },
        { name: "My Bookings", path: "/dashboard/bookings", icon: Calendar },
        { name: "Support", path: "/dashboard/tickets", icon: Ticket },
        { name: "Alerts", path: "/dashboard/notifications", icon: Bell },
    ];

    // Students/Lecturers don't need "Dashboard" in Navbar (they use the Homepage button/status)
    const navLinks = isAdmin 
        ? rawLinks 
        : rawLinks.filter(link => link.name !== "Dashboard");

    if (isAdmin) {
        navLinks.push({ name: "Management", path: "/dashboard/users", icon: Users });
    }

    // Routing Logic for Visibility
    const isDashboard = pathname.startsWith("/dashboard");
    const isAuthPage = pathname === "/login" || pathname === "/register";

    // Hide Navbar for Admins in Dashboard (they have Sidebar)
    if (isAdmin && isDashboard) return null;
    
    // Hide for Auth Pages
    if (isAuthPage) return null;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
            scrolled || isDashboard 
            ? "h-20 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5" 
            : "h-24 bg-transparent"
        }`}>
            <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-3 group active:scale-95 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1.5 shadow-2xl group-hover:border-indigo-500/50 transition-colors">
                            <img src="/A.png" alt="Logo" className="w-[85%] h-[85%] object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl leading-none brand-text animate-shimmer">
                                CourseFlow
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">Institutional Portal</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.path;
                            const Icon = link.icon;
                            return (
                                <Link 
                                    key={link.path} 
                                    href={link.path}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300
                                        ${isActive 
                                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                                            : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}
                                    `}
                                >
                                    <Icon size={16} strokeWidth={2.5} />
                                    {link.name}
                                    {link.name === "Alerts" && unreadCount > 0 && (
                                        <span className="ml-1 bg-rose-500 text-white text-[9px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-black animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Auth / Profile */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end mr-1 text-right">
                                <span className="text-sm font-bold text-white leading-tight">{user.name}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {isAdmin ? "Administrator" : "Student Portal"}
                                </span>
                            </div>
                            
                            <div className="relative group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-xl transition-transform group-hover:scale-105 cursor-pointer">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden font-black text-indigo-400">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                {/* Dropdown menu could go here */}
                            </div>

                            <button 
                                onClick={handleLogout}
                                className="bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 p-2.5 rounded-xl transition-all border border-slate-700/50 hover:border-rose-500/30"
                                title="Sign Out"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Login</Link>
                            <Link 
                                href="/register"
                                className="group relative bg-white text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-xl overflow-hidden"
                            >
                                <span className="relative z-10">Get Started</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="lg:hidden p-3 bg-slate-800 rounded-xl text-white hover:bg-indigo-500 transition-colors shadow-xl"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[90] bg-slate-950/98 backdrop-blur-3xl pt-28 px-6 lg:hidden animate-in slide-in-from-top duration-500">
                    <div className="flex flex-col gap-3">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.path;
                            const Icon = link.icon;
                            return (
                                <Link 
                                    key={link.path} 
                                    href={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center justify-between p-5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all
                                        ${isActive 
                                            ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20" 
                                            : "bg-slate-900/50 text-slate-400 hover:text-white border border-white/5"}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <Icon size={20} />
                                        {link.name}
                                    </div>
                                    <ChevronRight size={16} className={isActive ? "opacity-100" : "opacity-30"} />
                                </Link>
                            );
                        })}
                        
                        {!user && (
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <Link 
                                    href="/login" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-5 rounded-2xl bg-slate-900 text-center font-bold uppercase text-xs tracking-widest border border-white/5"
                                >
                                    Login
                                </Link>
                                <Link 
                                    href="/register" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-5 rounded-2xl bg-white text-black text-center font-bold uppercase text-xs tracking-widest"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                        
                        {user && (
                            <button 
                                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                className="flex items-center gap-4 p-5 rounded-2xl bg-rose-500/10 text-rose-500 font-bold uppercase text-sm tracking-widest border border-rose-500/20 mt-8"
                            >
                                <LogOut size={20} />
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
