"use client";

import { useState, useEffect } from "react";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        setTimeout(() => {
            setNotifications([
                { id: "n1", title: "Booking Approved", message: "Your booking for Main Hall A is approved.", isRead: false, time: "2 hours ago" },
                { id: "n2", title: "Ticket Updated", message: "IT Support replied to T-1002.", isRead: false, time: "5 hours ago" },
                { id: "n3", title: "System Scheduled Maintenance", message: "LMS will be down for 20 mins tonight.", isRead: true, time: "1 day ago" },
            ]);
        }, 500);
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Notifications</h1>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors">
                    Mark all as read
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`glass-card p-5 rounded-2xl flex gap-4 transition-all
                            ${!notification.isRead ? 'border-indigo-500/30 bg-indigo-900/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-slate-800'}
                        `}
                    >
                        <div className="mt-1">
                            {!notification.isRead ? (
                                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                            ) : (
                                <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-lg font-semibold ${!notification.isRead ? 'text-white' : 'text-slate-300'}`}>
                                    {notification.title}
                                </h4>
                                <span className="text-xs text-slate-500 font-medium">{notification.time}</span>
                            </div>
                            <p className="text-slate-400 mb-3">{notification.message}</p>
                            
                            {!notification.isRead && (
                                <button 
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Mark as read
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
