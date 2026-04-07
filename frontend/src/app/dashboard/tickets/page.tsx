"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { X, Upload, AlertTriangle, MapPin, Type, FileText, Zap, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";

export default function TicketingPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        search: ''
    });
    const [showReportModal, setShowReportModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const isOverdue = (ticket: any) => {
        if (!ticket.createdAt || ticket.status === 'RESOLVED' || ticket.status === 'REJECTED' || ticket.status === 'CLOSED') {
            return false;
        }
        const createdAt = new Date(ticket.createdAt).getTime();
        const now = Date.now();
        const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
        
        const thresholds: Record<string, number> = {
            'CRITICAL': 1,
            'HIGH': 4,
            'MEDIUM': 24,
            'LOW': 72
        };
        
        const threshold = thresholds[ticket.priority] || 24;
        return hoursElapsed > threshold;
    };

    const getOverdueLabel = (ticket: any) => {
        if (!ticket.createdAt) return '';
        const createdAt = new Date(ticket.createdAt);
        const now = new Date();
        const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const thresholds: Record<string, number> = { 'CRITICAL': 1, 'HIGH': 4, 'MEDIUM': 24, 'LOW': 72 };
        const threshold = thresholds[ticket.priority] || 24;
        const overdueHours = Math.floor(hoursElapsed - threshold);
        if (overdueHours < 1) return `${Math.floor((hoursElapsed - threshold) * 60)}m overdue`;
        return `${overdueHours}h overdue`;
    };

    const filteredTickets = tickets.filter(ticket => {
        if (filters.status && ticket.status !== filters.status) return false;
        if (filters.priority && ticket.priority !== filters.priority) return false;
        if (filters.search) {
            const searchTerm = filters.search.trim();
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                ticket.title?.toLowerCase().includes(searchLower) ||
                ticket.description?.toLowerCase().includes(searchLower) ||
                ticket.resourceId?.toLowerCase().includes(searchLower) ||
                ticket.id?.toLowerCase().includes(searchLower) ||
                ticket.id?.substring(0, 6).toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }
        return true;
    });

    const clearFilters = () => {
        setFilters({ status: '', priority: '', search: '' });
    };

    const hasActiveFilters = filters.status || filters.priority || filters.search;

    const handleReport = () => {
        setShowReportModal(true);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files).slice(0, 3 - selectedImages.length);
            setSelectedImages(prev => [...prev, ...newFiles].slice(0, 3));
            
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 3));
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitReport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        
        if (!formData.get('title') || !formData.get('description')) {
            Swal.fire({ title: "Error", text: "Title and description are required", icon: "error", background: '#1e293b', color: '#fff' });
            return;
        }

        setSubmitting(true);
        
        const submitData = new FormData();
        submitData.append('title', formData.get('title') as string);
        submitData.append('description', formData.get('description') as string);
        submitData.append('resourceId', formData.get('resourceId') as string || '');
        submitData.append('priority', formData.get('priority') as string);
        submitData.append('reportedById', currentUser!.id);
        
        if (selectedImages.length > 0) {
            selectedImages.forEach(file => {
                submitData.append('images', file);
            });
        }

        try {
            const res = await fetch(`${apiUrl}/api/tickets/with-attachments`, {
                method: "POST",
                credentials: "include",
                body: submitData
            });

            if (res.ok) {
                Swal.fire({ title: "Issue Reported!", text: "Your ticket has been submitted successfully.", icon: "success", background: '#1e293b', color: '#fff' });
                setShowReportModal(false);
                setSelectedImages([]);
                setImagePreviews([]);
                form.reset();
                fetchTickets(currentUser!.id);
            } else {
                Swal.fire({ title: "Error", text: "Failed to submit ticket", icon: "error", background: '#1e293b', color: '#fff' });
            }
        } catch {
            Swal.fire({ title: "Error", text: "Network error. Please try again.", icon: "error", background: '#1e293b', color: '#fff' });
        } finally {
            setSubmitting(false);
        }
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-500 mb-2">My Tickets</h1>
                    <p className="text-slate-400">Report facility issues and track their resolution progress.</p>
                </div>
                <button 
                    onClick={handleReport} 
                    className="group relative rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-medium px-6 py-3 transition-all active:scale-95 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Zap size={18} className="group-hover:rotate-12 transition-transform" />
                        Report Issue
                    </span>
                </button>
            </div>

            {showReportModal && (
                <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[5vh]">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowReportModal(false)}
                    />
                    <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl shadow-pink-500/10 animate-in slide-in-from-top-4 duration-300">
                        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 p-6 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-500/10 rounded-xl">
                                        <AlertTriangle size={24} className="text-pink-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Report New Incident</h2>
                                        <p className="text-sm text-slate-400">Describe the issue you are experiencing</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowReportModal(false)}
                                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitReport} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                                    <Type size={16} className="text-pink-400" />
                                    Issue Title
                                    <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="title"
                                    type="text"
                                    placeholder="Brief title describing the issue..."
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                                    <FileText size={16} className="text-pink-400" />
                                    Description
                                    <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    placeholder="Provide detailed information about the issue, including location, time, and impact..."
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all resize-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                                        <MapPin size={16} className="text-pink-400" />
                                        Location / Resource
                                    </label>
                                    <input
                                        name="resourceId"
                                        type="text"
                                        placeholder="e.g., Auditorium A, Lab 204..."
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                                        <Zap size={16} className="text-pink-400" />
                                        Priority Level
                                    </label>
                                    <select
                                        name="priority"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all cursor-pointer"
                                        defaultValue="MEDIUM"
                                    >
                                        <option value="LOW">Low - Minor inconvenience</option>
                                        <option value="MEDIUM">Medium - Partially affected</option>
                                        <option value="HIGH">High - Significantly disrupted</option>
                                        <option value="CRITICAL">Critical - Unusable / Emergency</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                                    <ImageIcon size={16} className="text-pink-400" />
                                    Attach Images
                                    <span className="text-xs text-slate-500 font-normal">(up to 3)</span>
                                </label>
                                
                                <div 
                                    className="relative border-2 border-dashed border-slate-700 hover:border-pink-500/50 rounded-xl p-6 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageSelect}
                                        disabled={selectedImages.length >= 3}
                                    />
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="p-3 bg-slate-800 rounded-xl mb-3">
                                            <Upload size={24} className="text-slate-400" />
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            <span className="text-pink-400 font-medium">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                </div>

                                {imagePreviews.length > 0 && (
                                    <div className="flex gap-3 flex-wrap">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="relative group">
                                                <img 
                                                    src={preview} 
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-20 h-20 object-cover rounded-xl border border-slate-700"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {selectedImages.length < 3 && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-20 h-20 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-700 hover:border-pink-500/50 text-slate-500 hover:text-pink-400 transition-colors"
                                            >
                                                <Upload size={20} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Submit Ticket
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-card rounded-2xl p-4 mb-6 border border-slate-700/50">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                        />
                    </div>
                    <div className="min-w-[130px]">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:border-pink-500 focus:outline-none"
                        >
                            <option value="">All</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    <div className="min-w-[130px]">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({...filters, priority: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:border-pink-500 focus:outline-none"
                        >
                            <option value="">All</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTickets.length === 0 ? (
                        <div className="col-span-full text-center p-10 glass-card rounded-2xl border border-slate-700/50 text-slate-400">
                            {hasActiveFilters ? (
                                <div>
                                    <div className="mb-2">No tickets match your filters</div>
                                    <button onClick={clearFilters} className="text-pink-400 hover:text-pink-300 text-sm">Clear filters</button>
                                </div>
                            ) : (
                                "No tickets reported."
                            )}
                        </div>
                    ) : (
                        filteredTickets.map(ticket => (
                            <div key={ticket.id} className={`glass-card flex flex-col p-6 rounded-2xl border-l-4 group transition-all hover:bg-slate-800/50 ${isOverdue(ticket) ? 'animate-pulse-glow' : ''}`} style={{ borderLeftColor: ticket.priority === 'CRITICAL' ? '#f43f5e' : ticket.priority === 'HIGH' ? '#fb923c' : '#3b82f6' }}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-1 rounded">#{ticket.id?.substring(0,6).toUpperCase()}</span>
                                        {isOverdue(ticket) && (
                                            <span className="animate-pulse text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                                OVERDUE
                                            </span>
                                        )}
                                    </div>
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
                                    {isOverdue(ticket) && (
                                        <div className="flex justify-between text-red-400">
                                            <span className="font-semibold">Overdue:</span>
                                            <span className="font-bold animate-pulse">{getOverdueLabel(ticket)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-slate-300">Created:</span>
                                        <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
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
