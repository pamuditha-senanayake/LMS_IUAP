"use client";

import { useState, useEffect } from "react";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);

    useEffect(() => {
        // Mock data fetch
        setTimeout(() => {
            setBookings([
                { id: "b1", resourceName: "Main Hall A", date: "2026-05-10", time: "10:00 - 12:00", status: "APPROVED" },
                { id: "b2", resourceName: "Projector Pro", date: "2026-05-12", time: "08:00 - 16:00", status: "PENDING" },
                { id: "b3", resourceName: "Network Lab 1", date: "2026-05-01", time: "14:00 - 16:00", status: "REJECTED" },
            ]);
        }, 800);
    }, []);

    const getStatusColor = (status: string) => {
        if (status === 'APPROVED') return 'text-green-400 bg-green-500/10';
        if (status === 'PENDING') return 'text-yellow-400 bg-yellow-500/10';
        if (status === 'REJECTED') return 'text-red-400 bg-red-500/10';
        return 'text-slate-400 bg-slate-500/10';
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
                    <p className="text-slate-400">Manage and view your resource reservations.</p>
                </div>
                <button className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 transition-all active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                    + New Booking Request
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700/50 bg-slate-800/30">
                            <th className="p-4 text-slate-300 font-semibold">Resource</th>
                            <th className="p-4 text-slate-300 font-semibold">Date</th>
                            <th className="p-4 text-slate-300 font-semibold">Time Range</th>
                            <th className="p-4 text-slate-300 font-semibold">Status</th>
                            <th className="p-4 text-slate-300 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length > 0 ? bookings.map(booking => (
                            <tr key={booking.id} className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors">
                                <td className="p-4 text-white font-medium">{booking.resourceName}</td>
                                <td className="p-4 text-slate-400">{booking.date}</td>
                                <td className="p-4 text-slate-400">{booking.time}</td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {booking.status === 'PENDING' || booking.status === 'APPROVED' ? (
                                        <button className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">Cancel</button>
                                    ) : (
                                        <button className="text-slate-500 hover:text-slate-400 text-sm font-medium transition-colors">Details</button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    You have no bookings yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
