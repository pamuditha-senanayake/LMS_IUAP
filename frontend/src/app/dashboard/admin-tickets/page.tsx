"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function AdminTickets() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/tickets`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setTickets(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            } else {
                Swal.fire("Error", "Failed to load tickets", "error");
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
            fetchTickets();
        };
        loadUser();
    }, []);

    const processStatusChange = async (id: string, status: string, note: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const url = new URL(`${apiUrl}/api/tickets/${id}/status`);
            url.searchParams.append("status", status);
            url.searchParams.append("adminId", currentUser?.id || "N/A");
            url.searchParams.append("note", note);

            const res = await fetch(url.toString(), {
                method: "PATCH",
                credentials: "include"
            });

            if (res.ok) {
                Swal.fire({ title: "Updated!", icon: "success", background: '#1e293b', color: '#fff' });
                fetchTickets();
            } else {
                Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
    };

    const handleAction = (id: string, actionType: string, isPositive: boolean) => {
        let title = "Update Status";
        let promptText = "";
        if (actionType === "IN_PROGRESS") title = "Mark as In Progress?";
        if (actionType === "RESOLVED") title = "Resolve Ticket?";
        if (actionType === "REJECTED") title = "Reject Ticket?";

        Swal.fire({
            title: title,
            input: 'textarea',
            inputPlaceholder: 'Any specific reasoning or notes for the user...',
            icon: isPositive ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonColor: isPositive ? '#10b981' : '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Confirm',
            background: '#1e293b',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed) {
                processStatusChange(id, actionType, result.value || "");
            }
        });
    };

    return (
        <div className="p-6 text-white max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500">
                    Admin Tickets View
                </h1>
                <button 
                    onClick={fetchTickets}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-sky-500 rounded-xl transition-all"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-10">Loading tickets...</div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700">
                                    <th className="p-4 font-semibold text-slate-300">Issue Details</th>
                                    <th className="p-4 font-semibold text-slate-300 w-32">Priority</th>
                                    <th className="p-4 font-semibold text-slate-300 w-32">Status</th>
                                    <th className="p-4 font-semibold text-slate-300 text-right min-w-[280px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-slate-400">
                                            No incident tickets on the system.
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((t) => (
                                        <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-200">{t.title}</div>
                                                <div className="text-sm text-slate-400 mt-1">{t.description}</div>
                                                <div className="text-xs text-indigo-400 mt-2 font-mono">Resource: {t.resourceId || 'General'}</div>
                                                {t.rejectionReason && (
                                                    <div className="mt-2 text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-500/20">
                                                        Note: {t.rejectionReason}
                                                    </div>
                                                )}
                                                {t.resolutionNotes && (
                                                    <div className="mt-2 text-xs text-emerald-400 bg-emerald-400/10 p-2 rounded-lg border border-emerald-500/20">
                                                        Note: {t.resolutionNotes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded shadow-sm ${
                                                    t.priority === 'CRITICAL' ? 'text-red-500 bg-red-500/10' :
                                                    t.priority === 'HIGH' ? 'text-orange-400 bg-orange-400/10' :
                                                    t.priority === 'MEDIUM' ? 'text-blue-400 bg-blue-400/10' :
                                                    'text-slate-400 bg-slate-400/10'
                                                }`}>
                                                    {t.priority || 'LOW'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                                                    t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    t.status === 'REJECTED' || t.status === 'CLOSED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    t.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {(t.status || 'OPEN').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {(t.status === "OPEN" || t.status === "PENDING" || !t.status) ? (
                                                    <div className="flex justify-end gap-2 flex-wrap">
                                                        <button 
                                                            onClick={() => handleAction(t.id, "IN_PROGRESS", true)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-400 rounded-lg transition-colors"
                                                        >
                                                            Start Work
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(t.id, "REJECTED", false)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (t.status === "IN_PROGRESS") ? (
                                                    <div className="flex justify-end gap-2 flex-wrap">
                                                        <button 
                                                            onClick={() => handleAction(t.id, "RESOLVED", true)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded-lg transition-colors"
                                                        >
                                                            Resolve Issue
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">No further actions available</span>
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
