"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function MyBookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [resources, setResources] = useState<any[]>([]);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [submitting, setSubmitting] = useState(false);

    const fetchBookings = async (userId: string) => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const currentSortDir = sortOrder === 'newest' ? 'desc' : 'asc';
            const params = new URLSearchParams({
                userId: userId,
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

    useEffect(() => {
        if (currentUser?.id) {
            fetchBookings(currentUser.id);
        }
    }, [sortOrder, statusFilter]);

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
                <div class="space-y-4 text-left">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Purpose</label>
                        <input id="swal-purpose" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" value="${booking.purpose}">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Expected Attendees</label>
                        <input id="swal-attendees" type="number" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" value="${booking.expectedAttendees}">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Start Time</label>
                            <input id="swal-start" type="datetime-local" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" value="${booking.startTime ? booking.startTime.substring(0, 16) : ''}">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">End Time</label>
                            <input id="swal-end" type="datetime-local" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" value="${booking.endTime ? booking.endTime.substring(0, 16) : ''}">
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: submitting ? 'Updating...' : 'Save Changes',
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
            didOpen: () => {
                const confirmBtn = Swal.getConfirmButton();
                if (confirmBtn) {
                    confirmBtn.disabled = submitting;
                }
            },
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
                setSubmitting(true);
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const url = `${apiUrl}/api/bookings/${booking.id}?userId=${currentUser.id}`;
                    const res = await fetch(url, {
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
                } finally {
                    setSubmitting(false);
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
                    const url = `${apiUrl}/api/bookings/${id}?userId=${currentUser.id}`;
                    const res = await fetch(url, {
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
                            title: "Delete Failed", 
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

    const handleUserCancel = (booking: any) => {
        Swal.fire({
            title: 'Cancel Booking?',
            html: `
                <div class="text-left space-y-3">
                    <p class="text-slate-300 text-sm mb-3">Are you sure you want to cancel this booking? This action cannot be undone.</p>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Reason for Cancellation (Optional)</label>
                        <select id="swal-cancel-reason" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                            <option value="">Select a reason...</option>
                            <option value="No longer needed">No longer needed</option>
                            <option value="Schedule conflict">Schedule conflict</option>
                            <option value="Changed plans">Changed plans</option>
                            <option value="Other">Other (specify below)</option>
                        </select>
                    </div>
                    <div id="swal-other-reason-container" class="hidden">
                        <input id="swal-other-reason" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Enter reason...">
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#64748b',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Cancel Booking',
            background: '#1e293b',
            color: '#fff',
            didOpen: () => {
                const reasonSelect = document.getElementById('swal-cancel-reason') as HTMLSelectElement;
                const otherContainer = document.getElementById('swal-other-reason-container');
                reasonSelect?.addEventListener('change', function() {
                    if (this.value === 'Other') {
                        otherContainer?.classList.remove('hidden');
                    } else {
                        otherContainer?.classList.add('hidden');
                    }
                });
            },
            preConfirm: () => {
                const reasonSelect = document.getElementById('swal-cancel-reason') as HTMLSelectElement;
                const otherInput = document.getElementById('swal-other-reason') as HTMLInputElement;
                
                let finalReason = reasonSelect?.value || "";
                if (reasonSelect?.value === 'Other' && otherInput?.value) {
                    finalReason = otherInput.value;
                }
                
                return finalReason;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                setSubmitting(true);
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const url = `${apiUrl}/api/bookings/${booking.id}/cancel?userId=${currentUser.id}&reason=${encodeURIComponent(result.value || '')}`;
                    const res = await fetch(url, {
                        method: "PATCH",
                        credentials: "include"
                    });

                    if (res.ok) {
                        Swal.fire({ 
                            title: "Cancelled!", 
                            text: "Your booking has been cancelled successfully.",
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
                            title: "Cancellation Failed", 
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
                        text: "Unable to connect to the server.",
                        icon: "error", 
                        background: '#1e293b', 
                        color: '#fff',
                        confirmButtonColor: '#ef4444'
                    });
                } finally {
                    setSubmitting(false);
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
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => currentUser?.id && fetchBookings(currentUser.id)}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => handleAdd()}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 shadow-lg shadow-indigo-500/25 rounded-xl font-semibold transition-all"
                    >
                        + Request Booking
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400">Status:</label>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                <div className="w-48 h-6 bg-slate-700 rounded"></div>
                                <div className="w-40 h-6 bg-slate-700 rounded"></div>
                                <div className="w-20 h-6 bg-slate-700 rounded ml-auto"></div>
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
                                                    b.status === 'CANCELLED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
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
                                                            disabled={submitting}
                                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                                submitting 
                                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                                                                    : 'bg-slate-700 hover:bg-indigo-500 hover:text-white text-slate-200'
                                                            }`}
                                                        >
                                                            {submitting ? 'Updating...' : 'Edit'}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(b.id)}
                                                            disabled={submitting}
                                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                                submitting 
                                                                    ? 'bg-slate-600/50 text-slate-500 cursor-not-allowed' 
                                                                    : 'bg-slate-700/50 hover:bg-pink-500 hover:text-white text-pink-400'
                                                            }`}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                                {b.status === "APPROVED" && (
                                                    <button 
                                                        onClick={() => handleUserCancel(b)}
                                                        disabled={submitting}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                            submitting 
                                                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                                                                : 'bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400'
                                                        }`}
                                                    >
                                                        {submitting ? 'Cancelling...' : 'Cancel Booking'}
                                                    </button>
                                                )}
                                                {b.status === "REJECTED" && (
                                                    <div className="text-xs text-red-400 mt-1 max-w-[150px] truncate ml-auto" title={b.rejectionReason}>
                                                        Reason: {b.rejectionReason}
                                                    </div>
                                                )}
                                                {b.status === "CANCELLED" && (
                                                    <div className="text-xs text-slate-400 mt-1 ml-auto">
                                                        Cancelled
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
