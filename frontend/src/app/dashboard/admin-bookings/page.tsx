"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function AdminBookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/bookings`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            } else {
                Swal.fire("Error", "Failed to fetch bookings", "error");
            }
        } catch (err) {
            Swal.fire("Error", "Network error", "error");
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
                    setCurrentUser(user);
                }
            } catch (e) {}
            fetchBookings();
        };
        loadUser();
    }, []);

    const processStatusChange = async (id: string, status: string, reason: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const url = new URL(`${apiUrl}/api/bookings/${id}/status`);
            url.searchParams.append("status", status);
            url.searchParams.append("adminId", currentUser?.id || "N/A");
            url.searchParams.append("reason", reason);

            const res = await fetch(url.toString(), {
                method: "PATCH",
                credentials: "include"
            });

            if (res.ok) {
                Swal.fire({ title: "Success!", icon: "success", background: '#1e293b', color: '#fff' });
                fetchBookings();
            } else {
                Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
    };

    const handleApprove = (id: string, name: string) => {
        Swal.fire({
            title: `Approve booking for ${name}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Approve',
            background: '#1e293b',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed) {
                processStatusChange(id, "APPROVED", "");
            }
        });
    };

    const handleReject = (id: string, name: string) => {
        Swal.fire({
            title: `Reject booking for ${name}?`,
            input: 'textarea',
            inputPlaceholder: 'Reason for rejection...',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Reject',
            background: '#1e293b',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed) {
                processStatusChange(id, "REJECTED", result.value || "");
            }
        });
    };

    const handleCancel = (id: string, name: string) => {
        Swal.fire({
            title: `Cancel booking for ${name}?`,
            text: "This will mark it as CANCELLED.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#64748b',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Yes, cancel it',
            background: '#1e293b',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed) {
                processStatusChange(id, "CANCELLED", "");
            }
        });
    };

    const handleMessage = (id: string, name: string) => {
        Swal.fire({
            title: `Send Note to ${name}?`,
            text: "This will retain their PENDING status but notify them.",
            input: 'textarea',
            inputPlaceholder: 'Type message...',
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#ec4899',
            confirmButtonText: 'Send Note',
            background: '#1e293b',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                processStatusChange(id, "PENDING", result.value);
            }
        });
    };

    return (
        <div className="p-6 text-white max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                    Admin Bookings View
                </h1>
                <button 
                    onClick={fetchBookings}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-xl transition-all"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-10">Loading all bookings...</div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700">
                                    <th className="p-4 font-semibold text-slate-300">Requested By</th>
                                    <th className="p-4 font-semibold text-slate-300">Resource</th>
                                    <th className="p-4 font-semibold text-slate-300">Purpose</th>
                                    <th className="p-4 font-semibold text-slate-300">Timeline</th>
                                    <th className="p-4 font-semibold text-slate-300">Status</th>
                                    <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-slate-400">
                                            No bookings on the system.
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map((b) => (
                                        <tr key={b.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4 font-medium text-slate-200">
                                                <div>{b.requestedBy?.name || 'N/A'}</div>
                                                <div className="text-xs text-slate-400">{b.requestedBy?.email}</div>
                                            </td>
                                            <td className="p-4 font-medium text-slate-200">{b.resourceId}</td>
                                            <td className="p-4 text-slate-400">
                                                <div>{b.purpose}</div>
                                                <div className="text-xs">Attendees: {b.expectedAttendees}</div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">
                                                <div>Start: {new Date(b.startTime).toLocaleString()}</div>
                                                <div>End: {new Date(b.endTime).toLocaleString()}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                                                    b.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    b.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    b.status === 'CANCELLED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {b.status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {b.status === 'PENDING' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleApprove(b.id, b.requestedBy?.name)}
                                                                className="px-3 py-1.5 text-sm font-medium bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded-lg transition-colors"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReject(b.id, b.requestedBy?.name)}
                                                                className="px-3 py-1.5 text-sm font-medium bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                                                        <button 
                                                            onClick={() => handleCancel(b.id, b.requestedBy?.name)}
                                                            className="px-3 py-1.5 text-sm font-medium bg-slate-700/50 hover:bg-slate-600 hover:text-white text-slate-300 rounded-lg transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleMessage(b.id, b.requestedBy?.name)}
                                                        className="px-3 py-1.5 text-sm font-medium bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 rounded-lg transition-colors"
                                                    >
                                                        Note
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

    );
}
