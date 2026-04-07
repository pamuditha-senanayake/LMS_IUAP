"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function AdminBookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [resources, setResources] = useState<any[]>([]);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [submitting, setSubmitting] = useState(false);

    const fetchResources = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/resources`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setResources(data);
            }
        } catch (err) {
            console.error("Failed to fetch resources", err);
        }
    };

    const getResourceName = (resourceId: string) => {
        const resource = resources.find(r => r.id === resourceId);
        return resource ? resource.resourceName : resourceId;
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const currentSortDir = sortOrder === 'newest' ? 'desc' : 'asc';
            const params = new URLSearchParams({
                sortBy: 'createdAt',
                sortDir: currentSortDir
            });
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            const url = `${apiUrl}/api/bookings?${params.toString()}`;
            const res = await fetch(url, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            } else {
                let errorMsg = "Failed to load bookings";
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {
                    errorMsg = await res.text() || errorMsg;
                }
                Swal.fire({ 
                    title: "Error Loading Bookings", 
                    html: `<div class="text-slate-300">${errorMsg}</div>`,
                    icon: "error", 
                    background: '#1e293b', 
                    color: '#fff',
                    confirmButtonColor: '#ef4444'
                });
            }
        } catch (err) {
            Swal.fire({ 
                title: "Network Error", 
                text: "Unable to connect to the server. Please try again.",
                icon: "error", 
                background: '#1e293b', 
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
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
        fetchResources();
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [sortOrder, statusFilter]);

    const processStatusChange = async (id: string, status: string, reason: string) => {
        setSubmitting(true);
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
                Swal.fire({ 
                    title: "Success!", 
                    text: "Booking status has been updated successfully.",
                    icon: "success", 
                    background: '#1e293b', 
                    color: '#fff',
                    confirmButtonColor: '#10b981'
                });
                fetchBookings();
            } else {
                let errorMsg = "An error occurred";
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {
                    errorMsg = await res.text() || errorMsg;
                }
                Swal.fire({ 
                    title: "Action Failed", 
                    html: `<div class="text-slate-300">${errorMsg}</div>`,
                    icon: "error", 
                    background: '#1e293b', 
                    color: '#fff',
                    confirmButtonColor: '#ef4444'
                });
            }
        } catch (err) {
            Swal.fire({ 
                title: "Network Error", 
                text: "Unable to connect to the server. Please check your connection.",
                icon: "error", 
                background: '#1e293b', 
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = (id: string, name: string) => {
        Swal.fire({
            title: `Approve booking for ${name}?`,
            text: "This will approve the booking request.",
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
            text: "Please provide a reason for rejection.",
            input: 'textarea',
            inputPlaceholder: 'Enter reason for rejection...',
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return 'Please enter a reason for rejection';
                }
                return null;
            },
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Reject',
            background: '#1e293b',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                processStatusChange(id, "REJECTED", result.value);
            }
        });
    };

    const handleMessage = (id: string, name: string) => {
        Swal.fire({
            title: `Send Note to ${name}?`,
            text: "This will retain their PENDING status but notify them.",
            input: 'textarea',
            inputPlaceholder: 'Type your message here...',
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Send Note',
            background: '#1e293b',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                processStatusChange(id, "PENDING", result.value);
            }
        });
    };

    const handleCancel = (id: string, name: string) => {
        Swal.fire({
            title: `Cancel booking for ${name}?`,
            text: "This will cancel the approved booking. The user will be notified.",
            input: 'textarea',
            inputPlaceholder: 'Optional reason for cancellation...',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#64748b',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Cancel Booking',
            background: '#1e293b',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed) {
                processStatusChange(id, "CANCELLED", result.value || "Cancelled by admin");
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
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400">Status:</label>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400">Sort by:</label>
                    <select 
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
                <div className="ml-auto text-sm text-slate-400">
                    {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-6 bg-slate-700 rounded"></div>
                                <div className="w-24 h-6 bg-slate-700 rounded"></div>
                                <div className="w-40 h-6 bg-slate-700 rounded"></div>
                                <div className="w-28 h-6 bg-slate-700 rounded ml-auto"></div>
                            </div>
                        </div>
                    ))}
                </div>
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
                                            <td className="p-4 font-medium text-slate-200">{getResourceName(b.resourceId)}</td>
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
                                                {b.status === "PENDING" && (
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleApprove(b.id, b.requestedBy?.name)}
                                                            disabled={submitting}
                                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                                submitting 
                                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400'
                                                            }`}
                                                        >
                                                            {submitting ? 'Approving...' : 'Approve'}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReject(b.id, b.requestedBy?.name)}
                                                            disabled={submitting}
                                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                                submitting 
                                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400'
                                                            }`}
                                                        >
                                                            {submitting ? 'Rejecting...' : 'Reject'}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleMessage(b.id, b.requestedBy?.name)}
                                                            disabled={submitting}
                                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                                submitting 
                                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-slate-700/50 hover:bg-indigo-500 hover:text-white text-indigo-400'
                                                            }`}
                                                        >
                                                            Note
                                                        </button>
                                                    </div>
                                                )}
                                                {b.status === "APPROVED" && (
                                                    <div className="flex justify-end gap-2 items-center">
                                                        <span className="text-xs text-emerald-400">Approved</span>
                                                        <button 
                                                            onClick={() => handleCancel(b.id, b.requestedBy?.name)}
                                                            disabled={submitting}
                                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                                submitting 
                                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-slate-700/50 hover:bg-red-500 hover:text-white text-slate-300'
                                                            }`}
                                                        >
                                                            {submitting ? 'Cancelling...' : 'Cancel'}
                                                        </button>
                                                    </div>
                                                )}
                                                {b.status === "REJECTED" && (
                                                    <div className="text-xs text-red-400 max-w-[150px] truncate" title={b.rejectionReason}>
                                                        Reason: {b.rejectionReason}
                                                    </div>
                                                )}
                                                {b.status === "CANCELLED" && (
                                                    <span className="text-xs text-slate-400">Cancelled</span>
                                                )}
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
