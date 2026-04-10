"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { X, Upload, AlertTriangle, MapPin, Type, FileText, Zap, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTicket, setEditingTicket] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        resourceId: '',
        priority: 'MEDIUM'
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const [resources, setResources] = useState<any[]>([]);
    const [reportResource, setReportResource] = useState('other');
    const [reportOtherResource, setReportOtherResource] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const fetchTickets = useCallback(async (userId: string) => {
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
        } catch {
            console.error("Failed to fetch tickets");
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);



    const fetchResources = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/api/resources`, { credentials: "include" });
            if (res.ok) {
                setResources(await res.json());
            }
        } catch {
            console.error("Failed to fetch resources");
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const getResourceName = (resourceId: string) => {
        if (!resourceId) return 'General';
        const resource = resources.find(r => r.id === resourceId);
        return resource ? `${resource.resourceCode} - ${resource.resourceName}` : resourceId;
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
            } catch {
                setLoading(false);
            }
        };
        loadUser();
    }, [fetchTickets, apiUrl]);

    const getStatusColor = (status: string) => {
        if (status === 'OPEN') return 'border-[#567C8D]/50 bg-[#567C8D]/10 text-[#567C8D]';
        if (status === 'IN_PROGRESS') return 'border-[#C8D9E6]/50 bg-[#C8D9E6]/10 text-[#C8D9E6]';
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
            Swal.fire({ 
                title: "Error", 
                text: "Title and description are required", 
                icon: "error", 
                background: 'var(--card-bg)', 
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
            return;
        }

        setSubmitting(true);
        
        const submitData = new FormData();
        submitData.append('title', formData.get('title') as string);
        submitData.append('description', formData.get('description') as string);
        const resourceToSubmit = reportResource === 'other' ? reportOtherResource : reportResource;
        submitData.append('resourceId', resourceToSubmit);
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
                Swal.fire({ 
                    title: "Issue Reported!", 
                    text: "Your ticket has been submitted successfully.", 
                    icon: "success", 
                    background: 'var(--card-bg)', 
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
                setShowReportModal(false);
                setSelectedImages([]);
                setImagePreviews([]);
                setReportResource('other');
                setReportOtherResource('');
                form.reset();
                fetchTickets(currentUser!.id);
            } else {
                Swal.fire({ 
                    title: "Error", 
                    text: "Failed to submit ticket", 
                    icon: "error", 
                    background: 'var(--card-bg)', 
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
            }
        } catch {
            Swal.fire({ 
                title: "Error", 
                text: "Network error. Please try again.", 
                icon: "error", 
                background: 'var(--card-bg)', 
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
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
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            customClass: {
                popup: 'glass-card border-none rounded-[2rem]',
                confirmButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs',
                cancelButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await fetch(`${apiUrl}/api/tickets/${ticketId}`, {
                    method: "DELETE",
                    credentials: "include"
                });
                if (res.ok) {
                    Swal.fire({ 
                        title: "Deleted!", 
                        icon: "success", 
                        background: 'var(--card-bg)', 
                        color: 'var(--foreground)',
                        customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                    });
                    fetchTickets(currentUser!.id);
                } else {
                    Swal.fire({ 
                        title: "Error", 
                        text: "Failed to delete ticket", 
                        icon: "error", 
                        background: 'var(--card-bg)', 
                        color: 'var(--foreground)',
                        customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                    });
                }
            }
        });
    };

    const handleEdit = (ticket: any) => {
        setEditingTicket(ticket);
        setEditForm({
            title: ticket.title || '',
            description: ticket.description || '',
            resourceId: ticket.resourceId || '',
            priority: ticket.priority || 'MEDIUM'
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editForm.title || !editForm.description) {
            Swal.fire({ 
                title: "Error", 
                text: "Title and description are required", 
                icon: "error", 
                background: 'var(--card-bg)', 
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${apiUrl}/api/tickets/${editingTicket.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                Swal.fire({ 
                    title: "Updated!", 
                    icon: "success", 
                    background: 'var(--card-bg)', 
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
                setShowEditModal(false);
                fetchTickets(currentUser!.id);
            } else {
                Swal.fire({ 
                    title: "Error", 
                    text: "Failed to update ticket", 
                    icon: "error", 
                    background: 'var(--card-bg)', 
                    color: 'var(--foreground)',
                    customClass: { popup: 'glass-card border-none rounded-[2rem]' }
                });
            }
        } catch {
            Swal.fire({ 
                title: "Error", 
                text: "Network error", 
                icon: "error", 
                background: 'var(--card-bg)', 
                color: 'var(--foreground)',
                customClass: { popup: 'glass-card border-none rounded-[2rem]' }
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen">
            <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6 text-foreground min-h-screen overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1 h-8 bg-gradient-to-b from-[#567C8D] to-[#2F4156] rounded-full"></div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                                My <span className="text-[#567C8D]">Tickets</span>
                            </h1>
                        </div>
                        <p className="text-sm text-[#567C8D]/70 font-medium ml-4">Report facility issues and track their resolution progress</p>
                    </div>
                    <button 
                        onClick={handleReport} 
                        className="group relative overflow-hidden rounded-2xl px-6 py-3 font-bold shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #567C8D 0%, #2F4156 100%)' }}
                    >
                        <span className="relative z-10 flex items-center gap-2 text-white">
                            <Zap size={18} className="group-hover:rotate-12 transition-transform" />
                            Report Issue
                        </span>
                    </button>
                </div>

            {showReportModal && (
                <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[15vh]">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-md"
                        onClick={() => setShowReportModal(false)}
                    />
                    <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-3xl shadow-2xl animate-in slide-in-from-top-4 duration-300"
                        style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F5EFEB 100%)' }}>
                        <div className="absolute top-0 left-0 right-0 h-2" style={{ background: 'linear-gradient(90deg, #567C8D 0%, #C8D9E6 50%, #2F4156 100%)' }}></div>
                        <div className="overflow-y-auto max-h-[80vh]">
                            <div className="sticky top-0 z-10 p-6 pb-4" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(245,239,235,0) 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #567C8D 0%, #2F4156 100%)' }}>
                                            <AlertTriangle size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-[#2F4156]">Report New Incident</h2>
                                            <p className="text-sm text-[#567C8D]/70">Describe the issue you are experiencing</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowReportModal(false)}
                                        className="p-2 hover:bg-[#C8D9E6]/30 rounded-xl transition-colors"
                                    >
                                        <X size={20} className="text-[#567C8D]" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitReport} className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#2F4156]">
                                        <Type size={16} className="text-[#567C8D]" />
                                        Issue Title
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="title"
                                        type="text"
                                        placeholder="Brief title describing the issue..."
                                        className="w-full px-4 py-3 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-[#2F4156] placeholder-[#567C8D]/50 focus:border-[#567C8D] focus:ring-2 focus:ring-[#567C8D]/20 focus:outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#2F4156]">
                                        <FileText size={16} className="text-[#567C8D]" />
                                        Description
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        placeholder="Provide detailed information about the issue, including location, time, and impact..."
                                        className="w-full px-4 py-3 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-[#2F4156] placeholder-[#567C8D]/50 focus:border-[#567C8D] focus:ring-2 focus:ring-[#567C8D]/20 focus:outline-none transition-all resize-none shadow-sm"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-[#2F4156]">
                                            <MapPin size={16} className="text-[#567C8D]" />
                                            Location / Resource
                                        </label>
                                        <select
                                            value={reportResource}
                                            onChange={(e) => setReportResource(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-[#2F4156] focus:border-[#567C8D] focus:ring-2 focus:ring-[#567C8D]/20 focus:outline-none transition-all cursor-pointer shadow-sm"
                                        >
                                            <option value="other">Other (specify below)</option>
                                            {resources.map((resource) => (
                                                <option key={resource.id} value={resource.id}>
                                                    {resource.resourceCode} - {resource.resourceName}
                                                    {resource.building ? ` (${resource.building}${resource.roomNumber ? ', ' + resource.roomNumber : ''})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {reportResource === 'other' && (
                                            <input
                                                type="text"
                                                value={reportOtherResource}
                                                onChange={(e) => setReportOtherResource(e.target.value)}
                                                placeholder="Enter location or resource..."
                                                className="w-full px-4 py-3 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-[#2F4156] placeholder-[#567C8D]/50 focus:border-[#567C8D] focus:ring-2 focus:ring-[#567C8D]/20 focus:outline-none transition-all shadow-sm mt-2"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-[#2F4156]">
                                            <Zap size={16} className="text-[#567C8D]" />
                                            Priority Level
                                        </label>
                                        <select
                                            name="priority"
                                            className="w-full px-4 py-3 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-[#2F4156] focus:border-[#567C8D] focus:ring-2 focus:ring-[#567C8D]/20 focus:outline-none transition-all cursor-pointer shadow-sm"
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
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#2F4156]">
                                        <ImageIcon size={16} className="text-[#567C8D]" />
                                        Attach Images
                                        <span className="text-xs text-[#567C8D]/50 font-normal">(up to 3)</span>
                                    </label>
                                    
                                    <div 
                                        className="relative border-2 border-dashed border-[#C8D9E6] hover:border-[#567C8D] rounded-xl p-6 transition-colors cursor-pointer bg-white/50"
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
                                            <div className="p-3 bg-[#C8D9E6]/20 rounded-xl mb-3 border border-[#C8D9E6]/30">
                                                <Upload size={24} className="text-[#567C8D]" />
                                            </div>
                                            <p className="text-sm text-[#567C8D]">
                                                <span className="font-bold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-[10px] font-medium text-[#567C8D]/50 uppercase tracking-widest mt-1">PNG, JPG, GIF up to 10MB</p>
                                        </div>
                                    </div>

                                    {imagePreviews.length > 0 && (
                                        <div className="flex gap-3 flex-wrap">
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="relative group">
                                                    <img 
                                                        src={preview} 
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-20 h-20 object-cover rounded-xl border-2 border-[#C8D9E6]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {selectedImages.length < 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-20 h-20 flex items-center justify-center rounded-xl border-2 border-dashed border-[#C8D9E6] hover:border-[#567C8D] text-[#567C8D] hover:text-[#2F4156] transition-colors"
                                                >
                                                    <Upload size={20} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4 border-t-2 border-[#C8D9E6]/30">
                                    <button
                                        type="button"
                                        onClick={() => setShowReportModal(false)}
                                        className="flex-1 px-4 py-3 bg-[#C8D9E6]/20 hover:bg-[#C8D9E6]/30 text-[#567C8D] rounded-xl font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                                        style={{ background: 'linear-gradient(135deg, #567C8D 0%, #2F4156 100%)' }}
                                    >

                                        {submitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin text-white" />
                                                <span className="text-white">Submitting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} className="text-white" />
                                                <span className="text-white">Submit Ticket</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                        <div className="absolute top-0 left-0 right-0 h-2" style={{ background: 'linear-gradient(90deg, #567C8D 0%, #C8D9E6 50%, #2F4156 100%)' }}></div>
                        <div className="p-6 pb-4">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #567C8D 0%, #2F4156 100%)' }}>
                                        <FileText size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-[#2F4156]">Edit Ticket</h2>
                                        <p className="text-sm text-[#567C8D]/70">Update your ticket information</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-[#C8D9E6]/30 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-[#567C8D]" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#2F4156]">
                                        <Type size={16} className="text-[#567C8D]" />
                                        Ticket Title
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                        placeholder="Brief title describing the issue..."
                                        className="w-full px-4 py-3 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-[#2F4156] placeholder-[#567C8D]/50 focus:border-[#567C8D] focus:ring-2 focus:ring-[#567C8D]/20 focus:outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-[#2F4156]">
                                        <FileText size={16} className="text-[#567C8D]" />
                                        Description
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                        rows={4}
                                        placeholder="Provide detailed information about the issue..."
                                        className="w-full px-4 py-3 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-[#2F4156] placeholder-[#567C8D]/50 focus:border-[#567C8D] focus:ring-2 focus:ring-[#567C8D]/20 focus:outline-none transition-all resize-none shadow-sm"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-[#2F4156]">
                                            <MapPin size={16} className="text-[#567C8D]" />
                                            Location / Resource
                                        </label>
                                        <select
                                            value={editForm.resourceId}
                                            onChange={(e) => setEditForm({...editForm, resourceId: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-[#2F4156] focus:border-[#567C8D] focus:ring-2 focus:ring-[#567C8D]/20 focus:outline-none transition-all cursor-pointer shadow-sm"
                                        >
                                            <option value="other">Other (specify below)</option>
                                            {resources.map((resource) => (
                                                <option key={resource.id} value={resource.id}>
                                                    {resource.resourceCode} - {resource.resourceName}
                                                    {resource.building ? ` (${resource.building}${resource.roomNumber ? ', ' + resource.roomNumber : ''})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-[#2F4156]">
                                            <Zap size={16} className="text-[#567C8D]" />
                                            Priority Level
                                        </label>
                                        <select
                                            value={editForm.priority}
                                            onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-[#2F4156] focus:border-[#567C8D] focus:ring-2 focus:ring-[#567C8D]/20 focus:outline-none transition-all cursor-pointer shadow-sm"
                                        >
                                            <option value="LOW">Low - Minor inconvenience</option>
                                            <option value="MEDIUM">Medium - Partially affected</option>
                                            <option value="HIGH">High - Significantly disrupted</option>
                                            <option value="CRITICAL">Critical - Unusable / Emergency</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 mt-6 border-t-2 border-[#C8D9E6]/30">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-3 bg-[#C8D9E6]/20 hover:bg-[#C8D9E6]/30 text-[#567C8D] rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #567C8D 0%, #2F4156 100%)' }}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin text-white" />
                                            <span className="text-white">Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} className="text-white" />
                                            <span className="text-white">Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-[#C8D9E6]/30 shadow-lg shadow-[#567C8D]/5">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-[#567C8D] mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-sm text-[#2F4156] placeholder-[#567C8D]/50 focus:border-[#567C8D] focus:outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="min-w-[140px]">
                        <label className="block text-xs font-bold text-[#567C8D] mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-sm text-[#2F4156] focus:border-[#567C8D] focus:outline-none transition-all shadow-sm"
                        >
                            <option value="">All</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    <div className="min-w-[140px]">
                        <label className="block text-xs font-bold text-[#567C8D] mb-2">Priority</label>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({...filters, priority: e.target.value})}
                            className="w-full px-4 py-2.5 bg-white border-2 border-[#C8D9E6]/50 rounded-xl text-sm text-[#2F4156] focus:border-[#567C8D] focus:outline-none transition-all shadow-sm"
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
                            className="px-4 py-2.5 bg-[#567C8D]/10 hover:bg-[#567C8D]/20 text-[#567C8D] border border-[#567C8D]/20 rounded-xl text-sm font-bold transition-colors shadow-sm"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <div className="mt-3 text-sm text-[#567C8D]/70 font-medium">
                    Showing <span className="font-black text-[#567C8D]">{filteredTickets.length}</span> of <span className="font-black text-[#2F4156]">{tickets.length}</span> tickets
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-flex items-center gap-3 text-[#567C8D] font-bold">
                        <Loader2 size={24} className="animate-spin" />
                        Loading tickets...
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTickets.length === 0 ? (
                        <div className="col-span-full text-center p-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-[#C8D9E6]/30 shadow-lg">
                            {hasActiveFilters ? (
                                <div className="space-y-4">
                                    <div className="w-14 h-14 bg-[#C8D9E6]/20 rounded-2xl flex items-center justify-center mx-auto">
                                        <AlertCircle size={28} className="text-[#567C8D]" />
                                    </div>
                                    <div className="text-lg font-bold text-[#2F4156]">No tickets match your filters</div>
                                    <button onClick={clearFilters} className="text-[#567C8D] hover:text-[#2F4156] font-black uppercase text-xs tracking-widest">Clear filters</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-[#C8D9E6]/20 rounded-2xl flex items-center justify-center mx-auto border-2 border-dashed border-[#C8D9E6]">
                                        <AlertCircle size={32} className="text-[#567C8D]/50" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#2F4156]">No reports found</h3>
                                    <p className="text-[#567C8D]/70 text-sm font-medium">Your reported issues will appear here.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        filteredTickets.map(ticket => (
                            <div key={ticket.id} 
                                className="bg-white/90 backdrop-blur-sm flex flex-col p-5 rounded-2xl border border-[#C8D9E6]/30 shadow-lg shadow-[#567C8D]/5 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1" style={{ background: ticket.priority === 'CRITICAL' ? 'linear-gradient(90deg, #ef4444, #f87171)' : ticket.priority === 'HIGH' ? 'linear-gradient(90deg, #f97316, #fb923c)' : ticket.priority === 'MEDIUM' ? 'linear-gradient(90deg, #567C8D, #C8D9E6)' : 'linear-gradient(90deg, #94a3b8, #cbd5e1)' }}></div>
                                <div className="flex justify-between items-start mb-4 pt-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-[#567C8D] bg-[#C8D9E6]/20 px-2.5 py-1 rounded-lg">#{ticket.id?.substring(0,6).toUpperCase()}</span>
                                        {isOverdue(ticket) && (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                                OVERDUE
                                            </span>
                                        )}
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getStatusColor(ticket.status)}`}>
                                        {(ticket.status || 'OPEN').replace("_", " ")}
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-[#2F4156] mb-2 line-clamp-2">{ticket.title}</h3>
                                <p className="text-sm text-[#567C8D]/80 line-clamp-3 mb-3 flex-grow">{ticket.description}</p>
                                
                                {ticket.attachments && ticket.attachments.length > 0 && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto">
                                        {ticket.attachments.map((att: any, idx: number) => (
                                            <img 
                                                key={idx}
                                                src={`${apiUrl}${att.fileUrl}`}
                                                alt={`Attachment ${idx + 1}`}
                                                className="w-14 h-14 object-cover rounded-xl border-2 border-[#C8D9E6]/30 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(`${apiUrl}${att.fileUrl}`, '_blank')}
                                            />
                                        ))}
                                    </div>
                                )}
                                
                                <div className="space-y-2.5 mt-auto pt-4 border-t border-[#C8D9E6]/30">
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="w-7 h-7 rounded-lg bg-[#C8D9E6]/20 flex items-center justify-center">
                                            <MapPin size={12} className="text-[#567C8D]" />
                                        </div>
                                        <span className="font-bold text-[#567C8D]/60 uppercase tracking-wider min-w-[65px]">Resource</span>
                                        <span className="text-[#2F4156] font-black">{resources.find(r => r.id === ticket.resourceId)?.resourceCode || 'General'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="w-7 h-7 rounded-lg bg-[#C8D9E6]/20 flex items-center justify-center">
                                            <Zap size={12} className="text-[#567C8D]" />
                                        </div>
                                        <span className="font-bold text-[#567C8D]/60 uppercase tracking-wider min-w-[65px]">Priority</span>
                                        <span className={`font-black ${ticket.priority === 'CRITICAL' ? 'text-red-500' : ticket.priority === 'HIGH' ? 'text-orange-500' : 'text-[#567C8D]'}`}>
                                            {ticket.priority || 'MEDIUM'}
                                        </span>
                                    </div>
                                    {isOverdue(ticket) && (
                                        <div className="flex items-center gap-3 text-xs text-red-500">
                                            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                <AlertCircle size={12} />
                                            </div>
                                            <span className="font-bold uppercase tracking-wider min-w-[65px]">Overdue</span>
                                            <span className="font-black">{getOverdueLabel(ticket)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="w-7 h-7 rounded-lg bg-[#C8D9E6]/20 flex items-center justify-center">
                                            <FileText size={12} className="text-[#567C8D]" />
                                        </div>
                                        <span className="font-bold text-[#567C8D]/60 uppercase tracking-wider min-w-[65px]">Created</span>
                                        <span className="text-[#2F4156] font-black">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</span>
                                    </div>
                                </div>

                                {ticket.resolutionNotes && ticket.status === 'RESOLVED' && (
                                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 font-medium">
                                        <span className="font-bold d-block mb-1">Resolution:</span> {ticket.resolutionNotes}
                                    </div>
                                )}
                                {ticket.rejectionReason && ticket.status === 'REJECTED' && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 font-medium">
                                        <span className="font-bold d-block mb-1">Feedback:</span> {ticket.rejectionReason}
                                    </div>
                                )}

                                {ticket.status === 'OPEN' && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-[#C8D9E6]/30">
                                        <button 
                                            onClick={() => handleEdit(ticket)}
                                            className="flex-1 px-3 py-2.5 text-sm font-bold bg-[#C8D9E6]/20 hover:bg-[#567C8D] text-[#567C8D] hover:text-white rounded-xl transition-all active:scale-95 border border-[#C8D9E6]/30"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(ticket.id, ticket.title)}
                                            className="flex-1 px-3 py-2.5 text-sm font-bold bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all border border-red-500/20 active:scale-95"
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
        </div>
    );
}
