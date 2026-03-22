"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Invalid credentials");
            }

            const data = await res.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({ name: data.name, email: data.email }));
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-transparent">
            <div className="glass-card w-full max-w-md rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-screen filter blur-[50px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500 rounded-full mix-blend-screen filter blur-[50px] opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>

                <div className="relative z-10">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-slate-400">Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">{error}</div>}

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-300" htmlFor="email">Email address</label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="input-field rounded-xl px-4 py-3 placeholder-slate-500"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-300" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="input-field rounded-xl px-4 py-3 placeholder-slate-500"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 active:scale-[0.98] transition-all text-white py-3 font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-400">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
