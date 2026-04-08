"use client";

import { useState, useEffect, useMemo } from "react";
import ResourceCard from "@/components/ResourceCard";
import AddResourceModal from "@/components/AddResourceModal";
import FacilityDetailsModal from "@/components/FacilityDetailsModal";
import BookingChatbotToggle from "@/components/BookingChatbotToggle";
import FacilityBookingChatbot from "@/components/FacilityBookingChatbot";
import { Search, Filter, X, Plus } from "lucide-react";

interface Resource {
    id?: string;
    _id?: string;
    resourceName?: string;
    name?: string;
    resourceType?: string;
    type?: string;
    category?: "FACILITY" | "UTILITY";
    status?: string;
    capacity?: number;
    campusName?: string;
    building?: string;
    roomNumber?: string;
    storageLocation?: string;
    resourceCode?: string;
    description?: string;
    amenities?: string[];
}

export default function FacilitiesCatalogue() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("ALL");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [selectedCategory, setSelectedCategory] = useState<"ALL" | "FACILITY" | "UTILITY">("ALL");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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
        setLoading(true);
        setError(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            console.log("Fetching from:", `${apiUrl}/api/resources`);
            const res = await fetch(`${apiUrl}/api/resources`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                const transformed = data.map((r: any) => ({
                    ...r,
                    resourceName: r.resourceName || r.name,
                    resourceType: r.resourceType || r.type,
                    category: r.category,
                    location: r.location || {
                        campusName: r.campusName || "",
                        buildingName: r.building || "",
                        roomNumber: r.roomNumber || ""
                    }
                }));
                setResources(transformed);
            } else {
                console.error("Failed to fetch resources:", res.status, res.statusText);
                setError("Failed to load resources");
            }
        } catch (err) {
            console.error("Failed to fetch resources", err);
            setError("Backend not reachable. Please start server.");
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
            
            const matchesCategory = selectedCategory === "ALL" || resource.category === selectedCategory;
            const matchesType = selectedType === "ALL" || resource.resourceType === selectedType;
            const matchesStatus = selectedStatus === "ALL" || resource.status === selectedStatus;
            
            return matchesSearch && matchesCategory && matchesType && matchesStatus;
        });
    }, [resources, searchQuery, selectedType, selectedStatus, selectedCategory]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedType("ALL");
        setSelectedStatus("ALL");
        setSelectedCategory("ALL");
    };

    const hasActiveFilters = searchQuery !== "" || selectedType !== "ALL" || selectedStatus !== "ALL" || selectedCategory !== "ALL";

    return (
        <>
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
                            onClick={() => setIsAddModalOpen(true)}
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
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as "ALL" | "FACILITY" | "UTILITY")}
                            className="appearance-none px-4 py-3.5 pr-10 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer min-w-[140px]"
                        >
                            <option value="ALL">All Categories</option>
                            <option value="FACILITY">Facilities</option>
                            <option value="UTILITY">Utilities</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

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
            ) : error ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connection Error</h3>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button 
                        onClick={fetchResources}
                        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
                    >
                        Retry
                    </button>
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
                        />
                    ))}
                </div>
            )}
        </div>

        <AddResourceModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={fetchResources}
        />

        {selectedResource && (
            <FacilityDetailsModal
                resource={selectedResource}
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedResource(null);
                }}
            />
        )}

        <BookingChatbotToggle
            isOpen={isChatbotOpen}
            onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        />
        <FacilityBookingChatbot
            isOpen={isChatbotOpen}
            onClose={() => setIsChatbotOpen(false)}
            onViewResource={(resource) => {
                setSelectedResource(resource);
                setIsDetailsModalOpen(true);
            }}
            onBookResource={(resource) => {
                setSelectedResource(resource);
                setIsDetailsModalOpen(true);
            }}
            resources={resources}
        />
        </>
    );
}
