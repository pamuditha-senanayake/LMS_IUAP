"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ArrowLeft, Users, CheckCircle, Clock, Pencil, Trash2, Building, Package, MapPin } from "lucide-react";

const FACILITY_TYPE_OPTIONS = [
    { value: "ROOM", label: "Room" },
    { value: "LECTURE_HALL", label: "Lecture Hall" },
    { value: "LAB", label: "Lab" },
    { value: "AUDITORIUM", label: "Auditorium" },
    { value: "MEETING_ROOM", label: "Meeting Room" },
];

const UTILITY_TYPE_OPTIONS = [
    { value: "PROJECTOR", label: "Projector" },
    { value: "SOUND_SYSTEM", label: "Sound System" },
    { value: "MICROPHONE", label: "Microphone" },
    { value: "WHITEBOARD", label: "Whiteboard" },
    { value: "FLAGS", label: "Flags" },
    { value: "OTHER", label: "Other" },
];

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
    customType?: string;
    location?: {
        campusName?: string;
        buildingName?: string;
        roomNumber?: string;
    };
    resourceCode?: string;
    description?: string;
    amenities?: string[];
}

const formatType = (type: string): string => {
    if (type?.startsWith("OTHER:")) {
        return type.replace("OTHER:", "");
    }
    return type?.replace(/_/g, ' ') || 'Unknown';
};

export default function FacilityDetailPage() {
    const params = useParams();
    const router = useRouter();
    const resourceId = params.id as string;
    
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedResource, setEditedResource] = useState<Partial<Resource>>({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [category, setCategory] = useState<"FACILITY" | "UTILITY">("FACILITY");
    const [customType, setCustomType] = useState("");

    const typeOptions = category === "FACILITY" ? FACILITY_TYPE_OPTIONS : UTILITY_TYPE_OPTIONS;
    const showCustomTypeField = category === "UTILITY" && (editedResource.resourceType === "OTHER" || editedResource.type === "OTHER");

    const handleCategoryChange = (newCategory: "FACILITY" | "UTILITY") => {
        setCategory(newCategory);
        setEditedResource(prev => ({ 
            ...prev, 
            resourceType: newCategory === "FACILITY" ? "ROOM" : "PROJECTOR",
            type: newCategory === "FACILITY" ? "ROOM" : "PROJECTOR"
        }));
        setCustomType("");
    };

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

    useEffect(() => {
        const fetchResource = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(`${apiUrl}/api/resources/${resourceId}`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    setResource(data);
                    
                    const resourceType = data.resourceType || data.type || "LECTURE_HALL";
                    const resourceCategory = data.category || "FACILITY";
                    
                    setCategory(resourceCategory);
                    setCustomType(data.customType || "");
                    
                    setEditedResource({
                        ...data,
                        resourceType: resourceType,
                        type: resourceType,
                    });
                } else if (res.status === 404) {
                    Swal.fire("Error", "Resource not found", "error").then(() => {
                        router.push("/dashboard/facilities");
                    });
                }
            } catch (err) {
                console.error("Failed to fetch resource", err);
                Swal.fire("Error", "Failed to load resource details", "error");
            } finally {
                setLoading(false);
            }
        };

        if (resourceId) {
            fetchResource();
        }
    }, [resourceId, router]);

    const handleSave = async () => {
        if (!resource) return;
        
        let finalType = editedResource.resourceType ?? editedResource.type ?? "";
        let finalDescription = editedResource.description;
        
        if (finalType === "OTHER" && customType.trim()) {
            finalType = `OTHER:${customType.trim()}`;
            finalDescription = customType.trim();
        }
        
        const payload: any = {
            ...editedResource,
            type: finalType,
            category: category,
            customType: category === "UTILITY" && finalType.startsWith("OTHER:") ? customType : undefined,
            description: finalDescription,
        };
        
        delete payload.resourceType;
        
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/resources/${resource.id || resource._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                Swal.fire({ 
                    title: "Resource Updated!", 
                    text: "The resource has been updated successfully.", 
                    icon: "success", 
                    background: '#1e293b', 
                    color: '#fff'
                });
                const updated = await res.json();
                setResource(updated);
                setEditedResource({
                    ...updated,
                    resourceType: updated.resourceType || updated.type,
                    type: updated.resourceType || updated.type,
                });
                setCategory(updated.category || "FACILITY");
                setCustomType(updated.customType || "");
                setIsEditing(false);
            } else {
                const errorText = await res.text();
                Swal.fire({ 
                    title: "Failed", 
                    text: errorText || "Unable to update resource.", 
                    icon: "error", 
                    background: '#1e293b', 
                    color: '#fff'
                });
            }
        } catch {
            Swal.fire("Error", "Network processing failed", "error");
        }
    };

    const handleDelete = async () => {
        if (!resource) return;

        const result = await Swal.fire({
            title: 'Delete Resource',
            text: `Are you sure you want to delete "${resource.resourceName || resource.name}"? This action cannot be undone.`,
            icon: 'warning',
            background: '#1e293b',
            color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'rounded-2xl',
                confirmButton: 'px-6 py-3 rounded-xl font-bold text-white transition-all',
                cancelButton: 'px-6 py-3 rounded-xl font-semibold text-white transition-all'
            }
        });

        if (result.isConfirmed) {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(`${apiUrl}/api/resources/${resource.id || resource._id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
                if (res.ok) {
                    Swal.fire({ 
                        title: "Deleted!", 
                        text: "The resource has been deleted successfully.", 
                        icon: "success", 
                        background: '#1e293b', 
                        color: '#fff'
                    });
                    router.push("/dashboard/facilities");
                } else {
                    const errorText = await res.text();
                    Swal.fire({ 
                        title: "Failed", 
                        text: errorText || "Unable to delete resource.", 
                        icon: "error", 
                        background: '#1e293b', 
                        color: '#fff'
                    });
                }
            } catch {
                Swal.fire("Error", "Network processing failed", "error");
            }
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (resource) {
            setEditedResource({
                ...resource,
                resourceType: resource.resourceType || resource.type,
                type: resource.resourceType || resource.type,
            });
            setCategory(resource.category || "FACILITY");
            setCustomType(resource.customType || "");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!resource) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-400">Resource not found</p>
                <button 
                    onClick={() => router.push("/dashboard/facilities")}
                    className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg"
                >
                    Back to Facilities
                </button>
            </div>
        );
    }

    const resourceName = resource.resourceName || resource.name || "Unnamed Resource";
    const resourceType = resource.resourceType || resource.type || "GENERAL";
    const status = resource.status || "ACTIVE";
    const capacity = resource.capacity || 0;
    
    const isFacility = category === "FACILITY";
    const isUtility = category === "UTILITY";

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Active</span>;
            case "MAINTENANCE":
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Maintenance</span>;
            default:
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">Out of Service</span>;
        }
    };

    return (
        <div>
            <button 
                onClick={() => router.push("/dashboard/facilities")}
                className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Facilities Catalogue
            </button>

            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className={`h-2 ${isUtility ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`}></div>
                
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${
                                    isUtility 
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                                        : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                                }`}>
                                    {isUtility ? 'UTILITY' : 'FACILITY'}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                    isUtility 
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                                        : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                                }`}>
                                    {formatType(resourceType)}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">{resourceName}</h1>
                            {resource.resourceCode && (
                                <p className="text-sm text-slate-500 font-mono">#{resource.resourceCode}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(status)}
                            {isAdmin && !isEditing && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                                            isUtility
                                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30'
                                                : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border-indigo-500/30'
                                        }`}
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/30"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-6 bg-slate-700/30 rounded-xl p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Resource Name</label>
                                    <input
                                        type="text"
                                        value={editedResource.resourceName || ""}
                                        onChange={(e) => setEditedResource({ ...editedResource, resourceName: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => handleCategoryChange(e.target.value as "FACILITY" | "UTILITY")}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer"
                                    >
                                        <option value="FACILITY">Facility</option>
                                        <option value="UTILITY">Utility</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                                    <select
                                        value={editedResource.resourceType || editedResource.type || ""}
                                        onChange={(e) => setEditedResource({ 
                                            ...editedResource, 
                                            resourceType: e.target.value,
                                            type: e.target.value
                                        })}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer"
                                    >
                                        {typeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                                    <select
                                        value={editedResource.status || "ACTIVE"}
                                        onChange={(e) => setEditedResource({ ...editedResource, status: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer"
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                        <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                                    </select>
                                </div>
                            </div>

                            {showCustomTypeField && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Specify Utility Type *</label>
                                    <input
                                        type="text"
                                        value={customType}
                                        onChange={(e) => setCustomType(e.target.value)}
                                        placeholder="e.g., Speaker Stand, Extension Cord"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    {isFacility ? "Description" : "Notes / Description"}
                                </label>
                                <textarea
                                    value={editedResource.description || ""}
                                    onChange={(e) => setEditedResource({ ...editedResource, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none"
                                    placeholder={isFacility ? "Describe the facility..." : "Serial number, condition, notes..."}
                                />
                            </div>

                            {isFacility ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Campus</label>
                                            <input
                                                type="text"
                                                value={editedResource.campusName || editedResource.location?.campusName || ""}
                                                onChange={(e) => setEditedResource({ 
                                                    ...editedResource, 
                                                    campusName: e.target.value,
                                                    location: { ...editedResource.location, campusName: e.target.value }
                                                })}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Building</label>
                                            <input
                                                type="text"
                                                value={editedResource.building || editedResource.location?.buildingName || ""}
                                                onChange={(e) => setEditedResource({ 
                                                    ...editedResource, 
                                                    building: e.target.value,
                                                    location: { ...editedResource.location, buildingName: e.target.value }
                                                })}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Room Number</label>
                                            <input
                                                type="text"
                                                value={editedResource.roomNumber || editedResource.location?.roomNumber || ""}
                                                onChange={(e) => setEditedResource({ 
                                                    ...editedResource, 
                                                    roomNumber: e.target.value,
                                                    location: { ...editedResource.location, roomNumber: e.target.value }
                                                })}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Capacity (seats)</label>
                                            <input
                                                type="number"
                                                value={editedResource.capacity || 0}
                                                onChange={(e) => setEditedResource({ ...editedResource, capacity: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Amenities</label>
                                            <input
                                                type="text"
                                                value={editedResource.amenities?.join(', ') || ""}
                                                onChange={(e) => setEditedResource({ 
                                                    ...editedResource, 
                                                    amenities: e.target.value.split(',').map(a => a.trim()).filter(a => a.length > 0)
                                                })}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                                placeholder="Projector, WiFi, AC"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Campus / Storage</label>
                                        <input
                                            type="text"
                                            value={editedResource.campusName || editedResource.location?.campusName || ""}
                                            onChange={(e) => setEditedResource({ 
                                                ...editedResource, 
                                                campusName: e.target.value,
                                                location: { ...editedResource.location, campusName: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Storage Location</label>
                                        <input
                                            type="text"
                                            value={editedResource.storageLocation || editedResource.location?.buildingName || ""}
                                            onChange={(e) => setEditedResource({ 
                                                ...editedResource, 
                                                storageLocation: e.target.value,
                                                location: { ...editedResource.location, buildingName: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                            placeholder="Equipment Room 1"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className={`px-6 py-3 text-white rounded-xl transition-all font-bold shadow-lg ${
                                        isUtility
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
                                            : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25'
                                    }`}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isFacility ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <div className="flex items-center text-slate-400 mb-2">
                                            <Users className="w-5 h-5 mr-2 text-slate-500" />
                                            <span className="text-sm">Capacity</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{capacity}</p>
                                        <p className="text-sm text-slate-500">seats</p>
                                    </div>

                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <div className="flex items-center text-slate-400 mb-2">
                                            <Building className="w-5 h-5 mr-2 text-slate-500" />
                                            <span className="text-sm">Building</span>
                                        </div>
                                        <p className="text-lg font-semibold text-white">{resource.building || resource.location?.buildingName || "N/A"}</p>
                                        <p className="text-sm text-slate-500">{resource.campusName || resource.location?.campusName || "Campus"}</p>
                                    </div>

                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <div className="flex items-center text-slate-400 mb-2">
                                            <Package className="w-5 h-5 mr-2 text-slate-500" />
                                            <span className="text-sm">Room</span>
                                        </div>
                                        <p className="text-lg font-semibold text-white">{resource.roomNumber || resource.location?.roomNumber || "N/A"}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <div className="flex items-center text-slate-400 mb-2">
                                            <MapPin className="w-5 h-5 mr-2 text-slate-500" />
                                            <span className="text-sm">Campus / Storage</span>
                                        </div>
                                        <p className="text-lg font-semibold text-white">{resource.campusName || resource.location?.campusName || "N/A"}</p>
                                    </div>

                                    <div className="bg-slate-700/30 rounded-xl p-4">
                                        <div className="flex items-center text-slate-400 mb-2">
                                            <Package className="w-5 h-5 mr-2 text-slate-500" />
                                            <span className="text-sm">Storage Location</span>
                                        </div>
                                        <p className="text-lg font-semibold text-white">{resource.storageLocation || resource.location?.buildingName || "N/A"}</p>
                                    </div>
                                </div>
                            )}

                            {resource.description && (
                                <div className="mb-8">
                                    <h2 className="text-lg font-semibold text-white mb-3">
                                        {isUtility ? 'Notes' : 'Description'}
                                    </h2>
                                    <p className="text-slate-300 leading-relaxed">{resource.description}</p>
                                </div>
                            )}

                            {isFacility && resource.amenities && resource.amenities.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-lg font-semibold text-white mb-3">Amenities</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {resource.amenities.map((amenity, idx) => (
                                            <span key={idx} className="px-3 py-1.5 text-sm rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50">
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}