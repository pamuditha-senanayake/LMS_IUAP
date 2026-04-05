"use client";

import { useState, useEffect, useMemo } from "react";
import ResourceCard from "@/components/ResourceCard";
import Swal from "sweetalert2";
import { Search, Filter, X, Plus } from "lucide-react";

interface Resource {
    id?: string;
    _id?: string;
    resourceName?: string;
    resourceType?: string;
    status?: string;
    capacity?: number;
    location?: {
        campusName?: string;
        buildingName?: string;
        roomNumber?: string;
    };
    resourceCode?: string;
    hourlyRate?: number;
    description?: string;
    amenities?: string[];
}

interface BookingRequest {
    resourceId: string;
    purpose: string;
    expectedAttendees: number;
    startTime: string;
    endTime: string;
    requestedBy: {
        userId: string;
        name: string;
        email: string;
    };
}

export default function FacilitiesCatalogue() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("ALL");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.roles && user.roles.includes("ROLE_ADMIN")) {
                    setIsAdmin(true);
                }
            } catch {}
        }
    }, []);


    const fetchResources = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/facilities/resources`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setResources(data);
            }
        } catch (err) {
            console.error("Failed to fetch resources", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const resourceTypes = useMemo(() => {
        const types = new Set(resources.map(r => r.resourceType).filter((t): t is string => Boolean(t)));
        return ["ALL", ...Array.from(types)];
    }, [resources]);

    const filteredResources = useMemo(() => {
        return resources.filter(resource => {
            const matchesSearch = searchQuery === "" || 
                resource.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                resource.resourceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                resource.resourceCode?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesType = selectedType === "ALL" || resource.resourceType === selectedType;
            const matchesStatus = selectedStatus === "ALL" || resource.status === selectedStatus;
            
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [resources, searchQuery, selectedType, selectedStatus]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedType("ALL");
        setSelectedStatus("ALL");
    };

    const hasActiveFilters = searchQuery !== "" || selectedType !== "ALL" || selectedStatus !== "ALL";

    const getInitialStartStr = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(10, 0, 0, 0);
        return d.toISOString().slice(0, 16);
    };

    const getInitialEndStr = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(12, 0, 0, 0);
        return d.toISOString().slice(0, 16);
    };

    const handleBookNow = (resource: Resource) => {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            Swal.fire("Error", "Please log in first", "error");
            return;
        }
        const user = JSON.parse(userStr);

        Swal.fire({
            title: `Book ${resource.resourceName}`,
            html: `
                <div class="flex flex-col gap-4 text-left max-w-md mx-auto">
                    <div class="bg-slate-700/50 rounded-lg p-4 text-sm">
                        <p class="text-slate-400 mb-1">Resource</p>
                        <p class="text-white font-semibold">${resource.resourceName}</p>
                        <p class="text-slate-400 text-xs mt-1">${resource.resourceType?.replace(/_/g, ' ')} - Capacity: ${resource.capacity || 'N/A'}</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Reservation Purpose</label>
                        <input id="book-purpose" class="swal2-input !w-full" placeholder="e.g. End of year exam, Group meeting">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Start Time</label>
                            <input type="datetime-local" id="book-start" class="swal2-input !w-full" value="${getInitialStartStr()}">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">End Time</label>
                            <input type="datetime-local" id="book-end" class="swal2-input !w-full" value="${getInitialEndStr()}">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Expected Attendees</label>
                        <input type="number" id="book-attendees" class="swal2-input !w-full" value="${(resource.capacity ?? 0) > 0 ? resource.capacity : 30}" min="1">
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Send Request',
            background: '#1e293b',
            color: '#fff',
            width: '600px',
            customClass: { popup: 'swal2-dark' },
            preConfirm: () => {
                const purpose = (document.getElementById('book-purpose') as HTMLInputElement).value;
                const start = (document.getElementById('book-start') as HTMLInputElement).value;
                const end = (document.getElementById('book-end') as HTMLInputElement).value;
                const attendees = parseInt((document.getElementById('book-attendees') as HTMLInputElement).value) || 0;
                
                if (!purpose) {
                    Swal.showValidationMessage("Please enter a reservation purpose");
                    return false;
                }
                if (!start || !end) {
                    Swal.showValidationMessage("Please select start and end times");
                    return false;
                }
                if (new Date(end) <= new Date(start)) {
                    Swal.showValidationMessage("End time must be after start time");
                    return false;
                }
                
                return {
                    resourceId: resource.id || resource._id,
                    purpose: purpose,
                    expectedAttendees: attendees,
                    startTime: new Date(start).toISOString(),
                    endTime: new Date(end).toISOString(),
                    requestedBy: { userId: user.id, name: user.name, email: user.email }
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const bookingData = result.value as BookingRequest;
                    const resPost = await fetch(`${apiUrl}/api/bookings`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(bookingData)
                    });
                    if (resPost.ok) {
                        Swal.fire({ 
                            title: "Booking Requested!", 
                            text: "Your request is pending admin approval. You'll be notified once it's reviewed.", 
                            icon: "success", 
                            background: '#1e293b', 
                            color: '#fff'
                        });
                    } else {
                        const errorText = await resPost.text();
                        Swal.fire({ 
                            title: "Failed", 
                            text: errorText || "Unable to create booking request.", 
                            icon: "error", 
                            background: '#1e293b', 
                            color: '#fff'
                        });
                    }
                } catch {
                    Swal.fire("Error", "Network processing failed", "error");
                }
            }
        });
    };

    const handleCreateResource = () => {
        Swal.fire({
            title: 'Add New Resource',
            html: `
                <div class="flex flex-col gap-4 text-left max-w-lg mx-auto">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Resource Name *</label>
                            <input id="res-name" class="swal2-input !w-full" placeholder="Main Auditorium">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Type *</label>
                            <select id="res-type" class="swal2-input !w-full">
                                <option value="LECTURE_HALL">Lecture Hall</option>
                                <option value="LAB">Lab</option>
                                <option value="MEETING_ROOM">Meeting Room</option>
                                <option value="EQUIPMENT">Equipment</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                        <input id="res-desc" class="swal2-input !w-full" placeholder="Large auditorium with AV equipment">
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Campus</label>
                            <input id="res-campus" class="swal2-input !w-full" placeholder="Main Campus">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Building</label>
                            <input id="res-building" class="swal2-input !w-full" placeholder="Engineering">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Room #</label>
                            <input id="res-room" class="swal2-input !w-full" placeholder="A-101">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Capacity</label>
                            <input type="number" id="res-capacity" class="swal2-input !w-full" placeholder="100" value="50">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Hourly Rate ($)</label>
                            <input type="number" id="res-rate" class="swal2-input !w-full" placeholder="0" value="0">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Amenities (comma-separated)</label>
                        <input id="res-amenities" class="swal2-input !w-full" placeholder="Projector, WiFi, AC">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Initial Status</label>
                        <select id="res-status" class="swal2-input !w-full">
                            <option value="ACTIVE">ACTIVE - Ready for booking</option>
                            <option value="MAINTENANCE">MAINTENANCE - Under maintenance</option>
                            <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Add Resource',
            background: '#1e293b',
            color: '#fff',
            width: '650px',
            customClass: { popup: 'swal2-dark' },
            preConfirm: () => {
                const name = (document.getElementById('res-name') as HTMLInputElement).value;
                if (!name) { 
                    Swal.showValidationMessage("Resource name is required"); 
                    return false; 
                }
                return {
                    resourceName: name,
                    resourceType: (document.getElementById('res-type') as HTMLSelectElement).value,
                    description: (document.getElementById('res-desc') as HTMLInputElement).value || "",
                    capacity: parseInt((document.getElementById('res-capacity') as HTMLInputElement).value) || 0,
                    hourlyRate: parseInt((document.getElementById('res-rate') as HTMLInputElement).value) || 0,
                    status: (document.getElementById('res-status') as HTMLSelectElement).value,
                    resourceCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
                    location: {
                        campusName: (document.getElementById('res-campus') as HTMLInputElement).value || "Main Campus",
                        buildingName: (document.getElementById('res-building') as HTMLInputElement).value || "",
                        roomNumber: (document.getElementById('res-room') as HTMLInputElement).value || ""
                    },
                    amenities: (document.getElementById('res-amenities') as HTMLInputElement).value
                        .split(',')
                        .map(a => a.trim())
                        .filter(a => a.length > 0)
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/facilities/resources`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(result.value)
                    });
                    if (res.ok) {
                        Swal.fire({ 
                            title: "Resource Added!", 
                            text: "The new resource has been created successfully.", 
                            icon: "success", 
                            background: '#1e293b', 
                            color: '#fff'
                        });
                        fetchResources();
                    } else {
                        Swal.fire({ 
                            title: "Failed", 
                            text: await res.text(), 
                            icon: "error", 
                            background: '#1e293b', 
                            color: '#fff'
                        });
                    }
                } catch {
                    Swal.fire("Error", "Network processing failed", "error");
                }
            }
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Facilities & Assets</h1>
                    <p className="text-slate-400">Browse and search available resources for booking.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500">
                        Showing <span className="text-indigo-400 font-semibold">{filteredResources.length}</span> of {resources.length} resources
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleCreateResource}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]"
                        >
                            <Plus className="w-5 h-5" />
                            Add Resource
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search resources by name, type, or code..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex gap-3">
                    <div className="relative">
                        <select 
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="appearance-none px-4 py-3.5 pr-10 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer min-w-[140px]"
                        >
                            <option value="ALL">All Types</option>
                            {resourceTypes.filter(t => t !== "ALL").map(type => (
                                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select 
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="appearance-none px-4 py-3.5 pr-10 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer min-w-[140px]"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="OUT_OF_SERVICE">Out of Service</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {hasActiveFilters && (
                        <button 
                            onClick={clearFilters}
                            className="px-4 py-3.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-800/50 border border-slate-700/50 rounded-xl transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex w-full justify-center p-12">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredResources.length === 0 ? (
                <div className="text-center py-16">
                    {hasActiveFilters ? (
                        <>
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
                            <p className="text-slate-400 mb-6">Try adjusting your search or filter criteria</p>
                            <button 
                                onClick={clearFilters}
                                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
                            >
                                Clear all filters
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="text-5xl mb-4">📦</div>
                            <h3 className="text-xl font-semibold text-white mb-2">No resources available</h3>
                            <p className="text-slate-400">Check back later or contact admin for assistance</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map(resource => (
                        <ResourceCard 
                            key={resource.id || resource._id} 
                            resource={resource}
                            onBookNow={handleBookNow}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
