"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function MyBookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchBookings = async (userId: string) => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/bookings?userId=${userId}`, { credentials: "include" });
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
                    if (user.id) fetchBookings(user.id);
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

    const handleAdd = () => {
        Swal.fire({
            title: 'Request Booking',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <label class="text-sm text-slate-300">Resource ID / Name</label>
                    <input id="swal-resource" class="swal2-input !w-11/12 !mx-auto" placeholder="e.g. Auditorium">
                    <label class="text-sm text-slate-300">Purpose</label>
                    <input id="swal-purpose" class="swal2-input !w-11/12 !mx-auto" placeholder="Annual General Meeting">
                    <label class="text-sm text-slate-300">Expected Attendees</label>
                    <input id="swal-attendees" type="number" class="swal2-input !w-11/12 !mx-auto" placeholder="100">
                    <label class="text-sm text-slate-300">Start Time</label>
                    <input id="swal-start" type="datetime-local" class="swal2-input !w-11/12 !mx-auto">
                    <label class="text-sm text-slate-300">End Time</label>
                    <input id="swal-end" type="datetime-local" class="swal2-input !w-11/12 !mx-auto">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#ec4899',
            background: '#1e293b',
            color: '#fff',
            preConfirm: () => {
                return {
                    resourceId: (document.getElementById('swal-resource') as HTMLInputElement).value,
                    purpose: (document.getElementById('swal-purpose') as HTMLInputElement).value,
                    expectedAttendees: parseInt((document.getElementById('swal-attendees') as HTMLInputElement).value),
                    startTime: (document.getElementById('swal-start') as HTMLInputElement).value,
                    endTime: (document.getElementById('swal-end') as HTMLInputElement).value,
                    type: "FACILITY"
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const payload = {
                        ...result.value,
                        requestedBy: {
                            userId: currentUser.id,
                            name: currentUser.name,
                            email: currentUser.email
                        }
                    };
                    const res = await fetch(`${apiUrl}/api/bookings`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        Swal.fire({ title: "Requested!", icon: "success", background: '#1e293b', color: '#fff' });
                        fetchBookings(currentUser.id);
                    } else {
                        const errText = await res.text();
                        Swal.fire({ title: "Error", text: errText, icon: "error", background: '#1e293b', color: '#fff' });
                    }
                } catch (err) {
                    Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
                }
            }
        });
    };

    const handleEdit = (booking: any) => {
        Swal.fire({
            title: 'Edit Booking Request',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <label class="text-sm text-slate-300">Purpose</label>
                    <input id="swal-purpose" class="swal2-input !w-11/12 !mx-auto" value="${booking.purpose}">
                    <label class="text-sm text-slate-300">Expected Attendees</label>
                    <input id="swal-attendees" type="number" class="swal2-input !w-11/12 !mx-auto" value="${booking.expectedAttendees}">
                    <label class="text-sm text-slate-300">Start Time</label>
                    <input id="swal-start" type="datetime-local" class="swal2-input !w-11/12 !mx-auto" value="${booking.startTime ? booking.startTime.substring(0, 16) : ''}">
                    <label class="text-sm text-slate-300">End Time</label>
                    <input id="swal-end" type="datetime-local" class="swal2-input !w-11/12 !mx-auto" value="${booking.endTime ? booking.endTime.substring(0, 16) : ''}">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#ec4899',
            background: '#1e293b',
            color: '#fff',
            preConfirm: () => {
                return {
                    purpose: (document.getElementById('swal-purpose') as HTMLInputElement).value,
                    expectedAttendees: parseInt((document.getElementById('swal-attendees') as HTMLInputElement).value),
                    startTime: (document.getElementById('swal-start') as HTMLInputElement).value,
                    endTime: (document.getElementById('swal-end') as HTMLInputElement).value,
                    type: booking.type || "FACILITY"
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const payload = {
                        ...result.value,
                        type: result.value.type || "FACILITY"
                    };
                    const res = await fetch(`${apiUrl}/api/bookings/${booking.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        Swal.fire({ title: "Updated!", icon: "success", background: '#1e293b', color: '#fff' });
                        fetchBookings(currentUser.id);
                    } else {
                        const errText = await res.text();
                        Swal.fire({ title: "Error", text: errText, icon: "error", background: '#1e293b', color: '#fff' });
                    }
                } catch (err) {
                    Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
                }
            }
        });
    };

    const handleDelete = (id: string) => {
        Swal.fire({
            title: `Delete booking request?`,
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ec4899',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Delete!',
            background: '#1e293b',
            color: '#fff',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/bookings/${id}`, {
                        method: "DELETE",
                        credentials: "include"
                    });

                    if (res.ok) {
                        Swal.fire({ title: "Deleted!", icon: "success", background: '#1e293b', color: '#fff' });
                        fetchBookings(currentUser.id);
                    } else {
                        const errText = await res.text();
                        Swal.fire({ title: "Error", text: errText, icon: "error", background: '#1e293b', color: '#fff' });
                    }
                } catch (err) {
                    Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
                }
            }
        });
    };

    return (
        <div className="p-6 text-white max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-500">
                    My Bookings
                </h1>
                <button 
                    onClick={handleAdd}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 shadow-lg shadow-indigo-500/25 rounded-xl font-semibold transition-all"
                >
                    + Request Booking
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-10">Loading bookings...</div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700">
                                    <th className="p-4 font-semibold text-slate-300">Resource</th>
                                    <th className="p-4 font-semibold text-slate-300">Purpose</th>
                                    <th className="p-4 font-semibold text-slate-300">Time Range</th>
                                    <th className="p-4 font-semibold text-slate-300">Status</th>
                                    <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-slate-400">
                                            No bookings found.
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map((b) => (
                                        <tr key={b.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
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
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {b.status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {(!b.status || b.status === "PENDING") && (
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleEdit(b)}
                                                            className="px-3 py-1.5 text-sm font-medium bg-slate-700 hover:bg-indigo-500 hover:text-white text-slate-200 rounded-lg transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(b.id)}
                                                            className="px-3 py-1.5 text-sm font-medium bg-slate-700/50 hover:bg-pink-500 hover:text-white text-pink-400 rounded-lg transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                                {b.status === "REJECTED" && (
                                                    <div className="text-xs text-red-400 mt-1 max-w-[150px] truncate ml-auto" title={b.rejectionReason}>
                                                        Reason: {b.rejectionReason}
                                                    </div>
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
