"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function TicketingPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const fetchTickets = async (userId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/tickets?userId=${userId}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const sortedTickets = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                const ticketsWithAttachments = await Promise.all(
                    sortedTickets.map(async (ticket: any) => {
                        const attRes = await fetch(`${apiUrl}/api/tickets/${ticket.id}/attachments`, { credentials: "include" });
                        if (attRes.ok) {
                            const attachments = await attRes.json();
                            return { ...ticket, attachments };
                        }
                        return { ...ticket, attachments: [] };
                    })
                );
                
                setTickets(ticketsWithAttachments);
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
                    
                    <label class="text-sm font-semibold text-slate-300 mt-2">Images (up to 3)</label>
                    <input id="swal-images" type="file" accept="image/*" multiple class="!w-11/12 !mx-auto text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 file:cursor-pointer cursor-pointer">
                    <div id="swal-preview" class="flex gap-2 justify-center mt-2"></div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#ec4899',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Submit Ticket',
            background: '#1e293b',
            color: '#fff',
            customClass: { popup: 'swal2-dark' },
            didOpen: () => {
                const imagesInput = document.getElementById('swal-images') as HTMLInputElement;
                imagesInput?.addEventListener('change', () => {
                    const preview = document.getElementById('swal-preview');
                    if (preview) {
                        preview.innerHTML = '';
                        const files = imagesInput.files;
                        if (files) {
                            for (let i = 0; i < Math.min(files.length, 3); i++) {
                                const url = URL.createObjectURL(files[i]);
                                const img = document.createElement('img');
                                img.src = url;
                                img.className = 'w-16 h-16 object-cover rounded-lg border border-slate-600';
                                preview.appendChild(img);
                            }
                        }
                    }
                });
            },
            preConfirm: () => {
                const title = (document.getElementById('swal-title') as HTMLInputElement).value;
                const desc = (document.getElementById('swal-desc') as HTMLTextAreaElement).value;
                const resource = (document.getElementById('swal-resource') as HTMLInputElement).value;
                const priority = (document.getElementById('swal-priority') as HTMLSelectElement).value;
                const imagesInput = document.getElementById('swal-images') as HTMLInputElement;
                const files = imagesInput?.files;
                
                if (!title || !desc) {
                    Swal.showValidationMessage("Title and description are required");
                    return false;
                }
                
                return new Promise((resolve) => {
                    const formData = new FormData();
                    formData.append('title', title);
                    formData.append('description', desc);
                    formData.append('resourceId', resource);
                    formData.append('priority', priority);
                    formData.append('reportedById', currentUser!.id);
                    
                    if (files && files.length > 0) {
                        for (let i = 0; i < Math.min(files.length, 3); i++) {
                            formData.append('images', files[i]);
                        }
                    }
                    
                    fetch(`${apiUrl}/api/tickets/with-attachments`, {
                        method: "POST",
                        credentials: "include",
                        body: formData
                    }).then(res => {
                        if (res.ok) {
                            resolve(true);
                        } else {
                            resolve(false);
                            res.text().then(errText => {
                                Swal.showValidationMessage(errText || "Failed to submit ticket");
                            });
                        }
                    }).catch(() => {
                        resolve(false);
                        Swal.showValidationMessage("Network Error");
                    });
                });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({ title: "Issue Reported!", icon: "success", background: '#1e293b', color: '#fff' });
                fetchTickets(currentUser!.id);
            }
        });
    };

    const handleDelete = (ticketId: string, title: string) => {
        Swal.fire({
            title: `Delete ticket "${title}"?`,
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ec4899',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Yes, delete it!',
            background: '#1e293b',
            color: '#fff',
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await fetch(`${apiUrl}/api/tickets/${ticketId}`, {
                    method: "DELETE",
                    credentials: "include"
                });
                if (res.ok) {
                    Swal.fire({ title: "Deleted!", icon: "success", background: '#1e293b', color: '#fff' });
                    fetchTickets(currentUser!.id);
                } else {
                    Swal.fire({ title: "Error", text: "Failed to delete ticket", icon: "error", background: '#1e293b', color: '#fff' });
                }
            }
        });
    };

    const handleEdit = (ticket: any) => {
        Swal.fire({
            title: 'Edit Ticket',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <label class="text-sm font-semibold text-slate-300">Ticket Title</label>
                    <input id="swal-title" class="swal2-input !w-11/12 !mx-auto" value="${ticket.title}">
                    
                    <label class="text-sm font-semibold text-slate-300">Description</label>
                    <textarea id="swal-desc" class="swal2-textarea !w-11/12 !mx-auto">${ticket.description}</textarea>
                    
                    <label class="text-sm font-semibold text-slate-300">Resource / Location</label>
                    <input id="swal-resource" class="swal2-input !w-11/12 !mx-auto" value="${ticket.resourceId || ''}">
                    
                    <label class="text-sm font-semibold text-slate-300">Priority</label>
                    <select id="swal-priority" class="swal2-select !w-11/12 !mx-auto text-sm">
                        <option value="LOW" ${ticket.priority === 'LOW' ? 'selected' : ''}>Low</option>
                        <option value="MEDIUM" ${ticket.priority === 'MEDIUM' ? 'selected' : ''}>Medium</option>
                        <option value="HIGH" ${ticket.priority === 'HIGH' ? 'selected' : ''}>High</option>
                        <option value="CRITICAL" ${ticket.priority === 'CRITICAL' ? 'selected' : ''}>Critical</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Save Changes',
            background: '#1e293b',
            color: '#fff',
            preConfirm: () => {
                const title = (document.getElementById('swal-title') as HTMLInputElement).value;
                const desc = (document.getElementById('swal-desc') as HTMLTextAreaElement).value;
                if (!title || !desc) {
                    Swal.showValidationMessage("Title and description are required");
                    return false;
                }
                return {
                    title,
                    description: desc,
                    resourceId: (document.getElementById('swal-resource') as HTMLInputElement).value,
                    priority: (document.getElementById('swal-priority') as HTMLSelectElement).value,
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await fetch(`${apiUrl}/api/tickets/${ticket.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(result.value)
                });
                if (res.ok) {
                    Swal.fire({ title: "Updated!", icon: "success", background: '#1e293b', color: '#fff' });
                    fetchTickets(currentUser!.id);
                } else {
                    Swal.fire({ title: "Error", text: "Failed to update ticket", icon: "error", background: '#1e293b', color: '#fff' });
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
                                <p className="text-sm text-slate-400 line-clamp-3 mb-2 flex-grow">{ticket.description}</p>
                                
                                {ticket.attachments && ticket.attachments.length > 0 && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto">
                                        {ticket.attachments.map((att: any, idx: number) => (
                                            <img 
                                                key={idx}
                                                src={`${apiUrl}${att.fileUrl}`}
                                                alt={`Attachment ${idx + 1}`}
                                                className="w-16 h-16 object-cover rounded-lg border border-slate-600 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(`${apiUrl}${att.fileUrl}`, '_blank')}
                                            />
                                        ))}
                                    </div>
                                )}
                                
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

                                {ticket.status === 'OPEN' && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/50">
                                        <button 
                                            onClick={() => handleEdit(ticket)}
                                            className="flex-1 px-3 py-2 text-sm font-medium bg-slate-700 hover:bg-indigo-500 text-slate-200 rounded-lg transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(ticket.id, ticket.title)}
                                            className="flex-1 px-3 py-2 text-sm font-medium bg-slate-700/50 hover:bg-pink-500 hover:text-white text-pink-400 rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
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
