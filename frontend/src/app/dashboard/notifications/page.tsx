"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async (userId: string) => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/notifications/user/${userId}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch (err) {
            console.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(`${apiUrl}/api/auth/me`, { credentials: "include" });
                if (res.ok) {
                    const user = await res.json();
                    if (user.id) fetchNotifications(user.id);
                    else setLoading(false);
                } else {
                    setLoading(false);
                }
            } catch (e) {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const handleMarkAsRead = async (id: string, e: any, userId: string) => {
        e.stopPropagation();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/notifications/${id}/read`, {
                method: "PATCH",
                credentials: "include"
            });
            if (res.ok) {
                fetchNotifications(userId);
            }
        } catch (err) {
            Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
    };

    return (
        <div className="p-6 text-white max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 mb-10">
                Notifications
            </h1>

            {loading ? (
                <div className="text-center text-slate-400 py-10">Checking notifications...</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {notifications.length === 0 ? (
                        <div className="text-center text-slate-400 p-8 glass-card rounded-2xl">
                            All caught up! No notifications.
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className={`p-5 rounded-2xl border transition-all ${n.isRead ? 'bg-slate-800/20 border-slate-700/50' : 'bg-slate-800 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>}
                                            <h3 className={`font-semibold ${n.isRead ? 'text-slate-300' : 'text-indigo-300'}`}>{n.title}</h3>
                                            <span className="text-xs text-slate-500 ml-2">{new Date(n.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-slate-400 text-sm">{n.message}</p>
                                    </div>
                                    {!n.isRead && (
                                        <button 
                                            onClick={(e) => {
                                                const user = JSON.parse(localStorage.getItem("user") || "{}");
                                                handleMarkAsRead(n.id, e, user.id);
                                            }}
                                            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-slate-600"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
