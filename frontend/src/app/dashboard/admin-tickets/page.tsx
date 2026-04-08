"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function AdminTickets() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    });
    const [resources, setResources] = useState<any[]>([]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/resources`, { credentials: "include" });
                if (res.ok) {
                    const resourceData = await res.json();
                    setResources(resourceData);
                    return resourceData;
                }
            } catch (err) {
                console.error("Failed to fetch resources", err);
            }
            return [];
        };

        const init = async () => {
            const resourceData = await fetchResources();
            await fetchTickets(resourceData);
        };
        init();
    }, []);

    const fetchTickets = async (resourceData?: any[]) => {
        if (resourceData === undefined) {
            resourceData = resources;
        }
        setRefreshing(true);
        
        try {
            const res = await fetch(`${apiUrl}/api/tickets`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const sortedTickets = data.sort((a: any, b: any) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                
                const ticketsWithAttachments = await Promise.all(
                    sortedTickets.map(async (ticket: any) => {
                        const attRes = await fetch(`${apiUrl}/api/tickets/${ticket.id}/attachments`, { credentials: "include" });
                        const resourceDisplay = (resourceData || []).find((r: any) => r.id === ticket.resourceId);
                        return { 
                            ...ticket, 
                            attachments: attRes.ok ? await attRes.json() : [],
                            resourceDisplay: resourceDisplay 
                                ? `${resourceDisplay.resourceCode} - ${resourceDisplay.resourceName}` 
                                : ticket.resourceId || 'General'
                        };
                    })
                );
                setTickets(ticketsWithAttachments);
            }
        } catch (err) {
            console.error("Failed to fetch tickets", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'OPEN').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
        critical: tickets.filter(t => t.priority === 'CRITICAL').length,
    };

    const isOverdue = (ticket: any) => {
        if (!ticket.createdAt || ticket.status === 'RESOLVED' || ticket.status === 'REJECTED' || ticket.status === 'CLOSED') return false;
        const hours = (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
        const thresholds: Record<string, number> = { 'CRITICAL': 1, 'HIGH': 4, 'MEDIUM': 24, 'LOW': 72 };
        return hours > (thresholds[ticket.priority] || 24);
    };

    const filteredTickets = tickets.filter(ticket => {
        if (filters.status && ticket.status !== filters.status) return false;
        if (filters.priority && ticket.priority !== filters.priority) return false;
        if (filters.search) {
            const search = filters.search.toLowerCase();
            if (!ticket.title?.toLowerCase().includes(search) &&
                !ticket.description?.toLowerCase().includes(search) &&
                !ticket.id?.toLowerCase().includes(search)) return false;
        }
        if (filters.dateFrom) {
            const ticketDate = new Date(ticket.createdAt);
            const fromDate = new Date(filters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (ticketDate < fromDate) return false;
        }
        if (filters.dateTo) {
            const ticketDate = new Date(ticket.createdAt);
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (ticketDate > toDate) return false;
        }
        return true;
    });

    const hasActiveFilters = filters.status || filters.priority || filters.dateFrom || filters.dateTo || filters.search;

    const clearFilters = () => {
        setFilters({ status: '', priority: '', dateFrom: '', dateTo: '', search: '' });
    };

    const processStatusChange = async (id: string, status: string, note: string) => {
        try {
            const url = new URL(`${apiUrl}/api/tickets/${id}/status`);
            url.searchParams.append("status", status);
            url.searchParams.append("adminId", "Admin");
            url.searchParams.append("note", note);
            const res = await fetch(url.toString(), { method: "PATCH", credentials: "include" });
            if (res.ok) {
                Swal.fire({ title: "Updated!", icon: "success", background: '#1e293b', color: '#fff' });
                fetchTickets();
            } else {
                Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            Swal.fire({ title: "Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
    };

    const handleAction = (id: string, actionType: string, isPositive: boolean) => {
        let title = "";
        if (actionType === "IN_PROGRESS") title = "Mark as In Progress?";
        if (actionType === "RESOLVED") title = "Resolve Ticket?";
        if (actionType === "REJECTED") title = "Reject Ticket?";

        Swal.fire({
            title,
            input: 'textarea',
            inputPlaceholder: 'Add notes for the user...',
            icon: isPositive ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonColor: isPositive ? '#10b981' : '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Confirm',
            background: '#1e293b',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed) processStatusChange(id, actionType, result.value || "");
        });
    };

    const handleViewDetails = (ticket: any) => {
        const attachmentsHtml = ticket.attachments?.length > 0
            ? `
                <div class="mt-4">
                    <h4 class="text-sm font-semibold text-slate-300 mb-2">Attachments (${ticket.attachments.length})</h4>
                    <div class="flex gap-2 flex-wrap justify-center">
                        ${ticket.attachments.map((att: any) => `
                            <img 
                                src="${apiUrl}${att.fileUrl}" 
                                alt="${att.fileName}" 
                                class="w-24 h-24 object-cover rounded-lg border border-slate-600 cursor-pointer hover:opacity-80 transition-opacity"
                                onclick="window.open('${apiUrl}${att.fileUrl}', '_blank')"
                            >
                        `).join('')}
                    </div>
                </div>
            `
            : '<div class="mt-4 text-sm text-slate-400">No attachments</div>';

        Swal.fire({
            title: `Ticket #${ticket.id?.substring(0,6).toUpperCase()}`,
            html: `
                <div class="text-left">
                    <div class="mb-3">
                        <span class="text-xs font-bold px-2 py-1 rounded ${
                            ticket.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                            ticket.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-500/20 text-slate-400'
                        }">${ticket.priority || 'LOW'}</span>
                        <span class="ml-2 text-xs font-semibold px-2 py-1 rounded-full ${
                            ticket.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                            ticket.status === 'REJECTED' || ticket.status === 'CLOSED' ? 'bg-red-500/20 text-red-400' :
                            ticket.status === 'IN_PROGRESS' ? 'bg-indigo-500/20 text-indigo-400' :
                            'bg-amber-500/20 text-amber-400'
                        }">${(ticket.status || 'OPEN').replace('_', ' ')}</span>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">${ticket.title}</h3>
                    <p class="text-sm text-slate-300 mb-3">${ticket.description}</p>
                    <div class="text-xs text-slate-400 space-y-1">
                        <div><span class="font-semibold text-slate-300">Resource:</span> ${ticket.resourceDisplay || 'General'}</div>
                        <div><span class="font-semibold text-slate-300">Reported By:</span> ${ticket.reportedById || 'Unknown'}</div>
                        <div><span class="font-semibold text-slate-300">Created:</span> ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                    </div>
                    ${attachmentsHtml}
                    ${ticket.rejectionReason ? `
                        <div class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
                            <span class="font-bold">Rejection Reason:</span> ${ticket.rejectionReason}
                        </div>
                    ` : ''}
                    ${ticket.resolutionNotes ? `
                        <div class="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
                            <span class="font-bold">Resolution:</span> ${ticket.resolutionNotes}
                        </div>
                    ` : ''}
                </div>
            `,
            width: '600px',
            background: '#1e293b',
            color: '#fff',
            confirmButtonColor: '#6366f1',
            confirmButtonText: 'Close',
        });
    };

    return (
        <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
            {/* Hero Banner Section */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl bg-slate-900 group/banner">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 opacity-40 transition-opacity duration-700 group-hover/banner:opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 blur-[120px] -mr-48 -mt-48 rounded-full" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/20 blur-[120px] -ml-48 -mb-48 rounded-full" />
                
                <div className="relative p-8 md:p-10 flex flex-col items-center text-center space-y-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                            Ticket Management System
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white text-center">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
                                Ticket Management
                            </span>
                        </h1>
                        <p className="text-slate-300 text-sm md:text-base font-semibold max-w-lg mx-auto leading-relaxed drop-shadow-sm">
                            Manage and track all incident tickets across the institution. Monitor resolution progress and maintain service quality.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="text-2xl font-bold text-white">{stats.total}</div>
                            <div className="text-xs text-slate-400 font-medium">Total</div>
                        </div>
                        <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
                            <div className="text-2xl font-bold text-amber-400">{stats.open}</div>
                            <div className="text-xs text-amber-400/70 font-medium">Open</div>
                        </div>
                        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
                            <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
                            <div className="text-xs text-blue-400/70 font-medium">In Progress</div>
                        </div>
                        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
                            <div className="text-2xl font-bold text-emerald-400">{stats.resolved}</div>
                            <div className="text-xs text-emerald-400/70 font-medium">Resolved</div>
                        </div>
                        <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
                            <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
                            <div className="text-xs text-red-400/70 font-medium">Critical</div>
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <button 
                        onClick={() => fetchTickets()}
                        disabled={refreshing}
                        className="flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'animate-spin' : ''}>
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                            <path d="M8 16H3v5"/>
                        </svg>
                        {refreshing ? "Syncing..." : "Refresh Tickets"}
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/30 rounded-2xl p-4 mb-6 border border-slate-700/50">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search title, description, ID..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div className="min-w-[140px]">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                    <div className="min-w-[140px]">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({...filters, priority: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="">All Priorities</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                    <div className="min-w-[150px]">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">From Date</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <div className="mt-3 text-sm text-slate-400">
                    Showing {filteredTickets.length} of {tickets.length} tickets
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-10">Loading tickets...</div>
            ) : (
                <div className="bg-slate-800/30 rounded-2xl overflow-hidden border border-slate-700/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700">
                                    <th className="p-4 font-semibold text-slate-300">Issue Details</th>
                                    <th className="p-4 font-semibold text-slate-300 w-28">Priority</th>
                                    <th className="p-4 font-semibold text-slate-300 w-32">Status</th>
                                    <th className="p-4 font-semibold text-slate-300 text-right min-w-[350px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">
                                            {hasActiveFilters ? (
                                                <div>
                                                    <div className="text-lg mb-2">No tickets match your filters</div>
                                                    <button onClick={clearFilters} className="text-indigo-400 hover:text-indigo-300 text-sm">Clear filters</button>
                                                </div>
                                            ) : (
                                                "No incident tickets on the system."
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((t) => (
                                        <tr key={t.id} className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${isOverdue(t) ? 'bg-red-500/5' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-slate-200">{t.title}</div>
                                                    {isOverdue(t) && (
                                                        <span className="animate-pulse text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                                            OVERDUE
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-400 mt-1 line-clamp-2">{t.description}</div>
                                                <div className="text-xs text-indigo-400 mt-2 font-mono">Resource: {t.resourceDisplay || 'General'}</div>
                                                {t.attachments && t.attachments.length > 0 && (
                                                    <div className="flex gap-1 mt-2">
                                                        {t.attachments.slice(0, 3).map((att: any, idx: number) => (
                                                            <img 
                                                                key={idx}
                                                                src={`${apiUrl}${att.fileUrl}`}
                                                                alt={`Attachment ${idx + 1}`}
                                                                className="w-10 h-10 object-cover rounded border border-slate-600 cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => window.open(`${apiUrl}${att.fileUrl}`, '_blank')}
                                                            />
                                                        ))}
                                                        {t.attachments.length > 3 && (
                                                            <span className="w-10 h-10 flex items-center justify-center text-xs bg-slate-700 rounded border border-slate-600">
                                                                +{t.attachments.length - 3}
                                                            </span>
                                                        )}
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
                                                <div className="flex justify-end gap-2 flex-wrap">
                                                    <button 
                                                        onClick={() => handleViewDetails(t)}
                                                        className="px-3 py-1.5 text-xs font-medium bg-slate-600/50 hover:bg-slate-500 text-slate-200 rounded-lg transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                    {(t.status === "OPEN" || t.status === "PENDING" || !t.status) ? (
                                                        <>
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
                                                        </>
                                                    ) : (t.status === "IN_PROGRESS") ? (
                                                        <button 
                                                            onClick={() => handleAction(t.id, "RESOLVED", true)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded-lg transition-colors"
                                                        >
                                                            Resolve Issue
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic">Closed</span>
                                                    )}
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
