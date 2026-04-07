"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function MyBookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [resources, setResources] = useState<any[]>([]);

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
        fetchResources();
    }, []);

    const handleAdd = (prefillData?: any, currentAttempt: number = 0) => {
        const defaultResourceId = prefillData?.resourceId || "";
        const defaultPurpose = prefillData?.purpose || "";
        const defaultAttendees = prefillData?.expectedAttendees || "";
        const defaultStart = prefillData?.startTime ? prefillData.startTime.substring(0, 16) : "";
        const defaultEnd = prefillData?.endTime ? prefillData.endTime.substring(0, 16) : "";

        Swal.fire({
            title: 'Request Booking',
            html: `
                <div class="space-y-4 text-left">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Resource</label>
                        <select id="swal-resource" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer">
                            <option value="">Select resource...</option>
                            ${resources.map(r => `<option value="${r.id}" ${r.id === defaultResourceId ? 'selected' : ''}>${r.resourceName} (${r.type || 'General'})</option>`).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Purpose</label>
                        <input id="swal-purpose" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="Annual General Meeting" value="${defaultPurpose}">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Expected Attendees</label>
                        <input id="swal-attendees" type="number" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="100" value="${defaultAttendees}">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Start Time</label>
                            <input id="swal-start" type="datetime-local" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" value="${defaultStart}">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">End Time</label>
                            <input id="swal-end" type="datetime-local" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" value="${defaultEnd}">
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Request',
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#475569',
            cancelButtonText: 'Cancel',
            background: '#0f172a',
            color: '#fff',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-xl border border-slate-700',
                confirmButton: 'px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20 mr-3',
                cancelButton: 'px-6 py-2.5 bg-transparent hover:bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-600 transition-colors'
            },
            preConfirm: () => {
                const resourceId = (document.getElementById('swal-resource') as HTMLSelectElement).value;
                if (!resourceId) {
                    Swal.showValidationMessage('Please select a resource');
                    return false;
                }
                return {
                    resourceId: resourceId,
                    purpose: (document.getElementById('swal-purpose') as HTMLInputElement).value,
                    expectedAttendees: parseInt((document.getElementById('swal-attendees') as HTMLInputElement).value),
                    startTime: (document.getElementById('swal-start') as HTMLInputElement).value,
                    endTime: (document.getElementById('swal-end') as HTMLInputElement).value,
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
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
                        Swal.fire({ 
                            title: "Requested!", 
                            text: "Your booking request has been submitted successfully.",
                            icon: "success", 
                            background: '#1e293b', 
                            color: '#fff',
                            confirmButtonColor: '#6366f1'
                        });
                        fetchBookings(currentUser.id);
                    } else {
                        let errorMsg = "An error occurred";
                        try {
                            const errorData = await res.json();
                            errorMsg = errorData.message || errorMsg;
                        } catch {
                            errorMsg = await res.text() || errorMsg;
                        }
                        const newAttempt = currentAttempt + 1;
                        
                        if (newAttempt < 2) {
                            Swal.fire({ 
                                title: "Booking Failed", 
                                html: `<div class="text-slate-300 mb-3">${errorMsg}</div><div class="text-sm text-amber-400">Attempts: ${newAttempt}/2. You can retry to edit your data.</div>`,
                                icon: "error", 
                                background: '#1e293b', 
                                color: '#fff',
                                confirmButtonColor: '#f59e0b',
                                confirmButtonText: 'Edit & Retry'
                            }).then(() => {
                                handleAdd(result.value, newAttempt);
                            });
                        } else {
                            Swal.fire({ 
                                title: "Booking Failed", 
                                html: `<div class="text-slate-300">${errorMsg}</div>`,
                                icon: "error", 
                                background: '#1e293b', 
                                color: '#fff',
                                confirmButtonColor: '#ef4444',
                                showCancelButton: false
                            });
                        }
                    }
                } catch (err) {
                    const newAttempt = currentAttempt + 1;
                    
                    if (newAttempt < 2) {
                        Swal.fire({ 
                            title: "Network Error", 
                            html: `<div class="text-slate-300 mb-3">Unable to connect to the server. Please check your connection.</div><div class="text-sm text-amber-400">Attempts: ${newAttempt}/2. You can retry to edit your data.</div>`,
                            icon: "error", 
                            background: '#1e293b', 
                            color: '#fff',
                            confirmButtonColor: '#f59e0b',
                            confirmButtonText: 'Edit & Retry'
                        }).then(() => {
                            handleAdd(result.value, newAttempt);
                        });
                    } else {
                        Swal.fire({ 
                            title: "Network Error", 
                            text: "Unable to connect to the server. Maximum retry attempts reached.",
                            icon: "error", 
                            background: '#1e293b', 
                            color: '#fff',
                            confirmButtonColor: '#ef4444',
                            showCancelButton: false
                        });
                    }
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
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/bookings/${booking.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(result.value)
                    });

                    if (res.ok) {
                        Swal.fire({ 
                            title: "Updated!", 
                            text: "Your booking has been updated successfully.",
                            icon: "success", 
                            background: '#1e293b', 
                            color: '#fff',
                            confirmButtonColor: '#6366f1'
                        });
                        fetchBookings(currentUser.id);
                    } else {
                        let errorMsg = "An error occurred";
                        try {
                            const errorData = await res.json();
                            errorMsg = errorData.message || errorMsg;
                        } catch {
                            errorMsg = await res.text() || errorMsg;
                        }
                        Swal.fire({ 
                            title: "Update Failed", 
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
                        Swal.fire({ 
                            title: "Deleted!", 
                            text: "Your booking request has been deleted.",
                            icon: "success", 
                            background: '#1e293b', 
                            color: '#fff',
                            confirmButtonColor: '#6366f1'
                        });
                        fetchBookings(currentUser.id);
                    } else {
                        let errorMsg = "An error occurred";
                        try {
                            const errorData = await res.json();
                            errorMsg = errorData.message || errorMsg;
                        } catch {
                            errorMsg = await res.text() || errorMsg;
                        }
                        Swal.fire({ 
                            title: "Deletion Failed", 
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
                    onClick={() => handleAdd()}
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
