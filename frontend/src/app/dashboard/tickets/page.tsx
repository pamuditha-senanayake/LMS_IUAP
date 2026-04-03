"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function TicketingPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchTickets = async (userId: string) => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/tickets?userId=${userId}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setTickets(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch (err) {
            console.error("Failed to fetch tickets", err);
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
                    if (user.id) fetchTickets(user.id);
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

    const getStatusColor = (status: string) => {
        if (status === 'OPEN') return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
        if (status === 'IN_PROGRESS') return 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400';
        if (status === 'RESOLVED') return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
        if (status === 'REJECTED' || status === 'CLOSED') return 'border-red-500/50 bg-red-500/10 text-red-400';
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    };

    const handleReport = () => {
        Swal.fire({
            title: 'Report Incident',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <label class="text-sm font-semibold text-slate-300">Ticket Title</label>
                    <input id="swal-title" class="swal2-input !w-11/12 !mx-auto" placeholder="e.g. Projector broken">
                    
                    <label class="text-sm font-semibold text-slate-300">Description</label>
                    <textarea id="swal-desc" class="swal2-textarea !w-11/12 !mx-auto" placeholder="Detailed description of the issue..."></textarea>
                    
                    <label class="text-sm font-semibold text-slate-300">Resource / Location</label>
                    <input id="swal-resource" class="swal2-input !w-11/12 !mx-auto" placeholder="e.g. Auditorium A">
                    
                    <label class="text-sm font-semibold text-slate-300">Priority</label>
                    <select id="swal-priority" class="swal2-select !w-11/12 !mx-auto text-sm">
                        <option value="LOW">Low - No immediate impact</option>
                        <option value="MEDIUM" selected>Medium - Partially blocking</option>
                        <option value="HIGH">High - Significant disruption</option>
                        <option value="CRITICAL">Critical - Facility unuseable</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#ec4899',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Submit Ticket',
            background: '#1e293b',
            color: '#fff',
            customClass: { popup: 'swal2-dark' },
            preConfirm: () => {
                const title = (document.getElementById('swal-title') as HTMLInputElement).value;
                const desc = (document.getElementById('swal-desc') as HTMLTextAreaElement).value;
                if (!title || !desc) {
                    Swal.showValidationMessage("Title and description are required");
                    return false;
                }
                return {
                    title: title,
                    description: desc,
                    resourceId: (document.getElementById('swal-resource') as HTMLInputElement).value,
                    priority: (document.getElementById('swal-priority') as HTMLSelectElement).value,
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const payload = {
                        ...result.value,
                        reportedById: currentUser.id,
                        status: "OPEN"
                    };
                    const res = await fetch(`${apiUrl}/api/tickets`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        Swal.fire({ title: "Issue Reported!", icon: "success", background: '#1e293b', color: '#fff' });
                        fetchTickets(currentUser.id);
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto p-4 md:p-6 text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-500 mb-2">My Tickets</h1>
                    <p className="text-slate-400">Report facility issues and track their resolution progress.</p>
                </div>
                <button 
                    onClick={handleReport} 
                    className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium px-6 py-3 transition-all active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                >
                    + Report Issue
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-10">Loading tickets...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.length === 0 ? (
                        <div className="col-span-full text-center p-10 glass-card rounded-2xl border border-slate-700/50 text-slate-400">
                            No tickets reported.
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <div key={ticket.id} className="glass-card flex flex-col p-6 rounded-2xl border-l-4 group transition-all hover:bg-slate-800/50" style={{ borderLeftColor: ticket.priority === 'CRITICAL' ? '#f43f5e' : ticket.priority === 'HIGH' ? '#fb923c' : '#3b82f6' }}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-1 rounded">#{ticket.id?.substring(0,6).toUpperCase()}</span>
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(ticket.status)}`}>
                                        {(ticket.status || 'OPEN').replace("_", " ")}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{ticket.title}</h3>
                                <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-grow">{ticket.description}</p>
                                
                                <div className="text-slate-400 text-xs flex flex-col gap-2 mt-auto">
                                    <div className="flex justify-between border-t border-slate-700/50 pt-3">
                                        <span className="font-semibold text-slate-300">Resource:</span>
                                        <span>{ticket.resourceId || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-slate-300">Priority:</span>
                                        <span className={
                                            ticket.priority === 'CRITICAL' ? 'text-red-400 font-bold' : 
                                            ticket.priority === 'HIGH' ? 'text-orange-400 font-semibold' : 'text-slate-300'
                                        }>{ticket.priority || 'LOW'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-slate-300">Created:</span>
                                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {ticket.resolutionNotes && ticket.status === 'RESOLVED' && (
                                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                                        <span className="font-bold d-block mb-1">Resolution:</span> {ticket.resolutionNotes}
                                    </div>
                                )}
                                {ticket.rejectionReason && ticket.status === 'REJECTED' && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                                        <span className="font-bold d-block mb-1">Feedback:</span> {ticket.rejectionReason}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
