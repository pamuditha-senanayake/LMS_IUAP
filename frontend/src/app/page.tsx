"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
    LayoutDashboard, 
    Shield, 
    BookOpen, 
    Building, 
    Bell, 
    ArrowRight, 
    Users,
    Zap,
    Globe,
    Cpu
} from "lucide-react";

export default function Home() {
    const [user, setUser] = useState<{ name: string } | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {}
        }
    }, []);

    const features = [
        {
            title: "Facility Hub",
            desc: "Dynamic booking system for lecture halls, laboratories, and study spaces.",
            icon: Building,
            color: "text-indigo-400"
        },
        {
            title: "Course Registry",
            desc: "Centrally managed catalog for all academic programs and modules.",
            icon: BookOpen,
            color: "text-emerald-400"
        },
        {
            title: "Smart Alerts",
            desc: "Real-time push notifications for schedule changes and campus news.",
            icon: Bell,
            color: "text-rose-400"
        },
        {
            title: "Access Control",
            desc: "Advanced multi-role permission system for students and faculty.",
            icon: Shield,
            color: "text-amber-400"
        }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
            {/* Background Decorations */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full animate-pulse delay-700" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>


            <main className="relative z-10">
                {/* Hero Section */}
                <section className="px-8 pt-40 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Zap size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">v2.0 Performance Update is Live</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] text-white mb-8 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        Elevate Institutional <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Excellence</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl balance leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                        The ultimate LMS ecosystem designed for high-performance campuses. Unified resource management, intelligent scheduling, and seamless academic workflows.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
                        {user ? (
                            <Link 
                                href="/dashboard"
                                className="group relative bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-2xl shadow-indigo-500/20 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative flex items-center gap-2">
                                    Access Your Console <ArrowRight size={18} />
                                </span>
                            </Link>
                        ) : (
                            <>
                                <Link 
                                    href="/register"
                                    className="group relative bg-white text-black px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-2xl shadow-white/10 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <span className="relative">Start Institutional Account</span>
                                </Link>
                                <Link 
                                    href="/login"
                                    className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all duration-300"
                                >
                                    Sign In to Platform
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-32 w-full max-w-5xl">
                        {[
                            { val: "99.9%", label: "Uptime" },
                            { val: "50k+", label: "Active Users" },
                            { val: "20ms", label: "Latency" },
                            { val: "24/7", label: "Support" }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 group">
                                <span className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{stat.val}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="px-8 py-32 bg-slate-950/30 border-y border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col items-center text-center mb-20">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">Core Infrastructure</h2>
                            <p className="text-slate-400 max-w-xl font-medium">Built on top of a resilient microservices architecture, IUAP CORE provides the backbone for modern academic operations.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((f, i) => {
                                const Icon = f.icon;
                                return (
                                    <div key={i} className="glass-card p-8 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all duration-500 group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-indigo-500/10 transition-colors" />
                                        <div className={`w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ${f.color}`}>
                                            <Icon size={28} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-6">{f.desc}</p>
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-400 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                                            Learn More <ArrowRight size={14} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Ecosystem Section */}
                <section id="ecosystem" className="px-8 py-32 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="relative">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-500/10 blur-3xl rounded-full" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full" />
                            <div className="glass-card p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden bg-slate-950/40">
                                <div className="grid grid-cols-2 gap-4">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="aspect-square rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center group hover:border-indigo-500/30 transition-all">
                                            {i === 1 && <Cpu className="text-indigo-400" size={32} />}
                                            {i === 2 && <Globe className="text-purple-400" size={32} />}
                                            {i === 3 && <Users className="text-emerald-400" size={32} />}
                                            {i === 4 && <LayoutDashboard className="text-pink-400" size={32} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tight">Unified <br/><span className="text-indigo-400">Ecosystem</span></h2>
                                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                                    Manage everything from one place. IUAP CORE integrates disparate campus services into a single, high-performance interface, reducing operational friction by up to 60%.
                                </p>
                            </div>
                            
                            <ul className="space-y-4">
                                {[
                                    "Real-time resource availability tracking",
                                    "Automated conflict resolution in scheduling",
                                    "Secure multi-factor faculty authentication",
                                    "Integrated student ticketing and support"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-slate-300 font-semibold group">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                            <div className="w-1.5 h-1.5 bg-indigo-400 group-hover:bg-white rounded-full" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                                Explore Architecture
                            </button>
                        </div>
                    </div>
                </section>

                <footer id="support" className="px-8 py-20 border-t border-white/5 text-center">
                    <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center p-2">
                            <img src="/A.png" alt="Logo" className="w-full h-full object-contain grayscale opacity-50" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">© 2026 Academic Systems Corp. All Technical Rights Reserved.</p>
                        <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
                            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-indigo-400 transition-colors">Compliance</a>
                            <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
