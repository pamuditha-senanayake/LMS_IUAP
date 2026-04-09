"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";
import FacilityDetailsModal from "./FacilityDetailsModal";
import { Users, MapPin, Eye, Package } from "lucide-react";

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
    location?: {
        campusName?: string;
        buildingName?: string;
        roomNumber?: string;
    };
    campusName?: string;
    building?: string;
    roomNumber?: string;
    storageLocation?: string;
    resourceCode?: string;
    description?: string;
    amenities?: string[];
}

interface ResourceCardProps {
    resource: Resource;
}

const formatType = (type: string): string => {
    if (type?.startsWith("OTHER:")) {
        return type.replace("OTHER:", "");
    }
    return type?.replace(/_/g, ' ') || 'Unknown';
};

export default function ResourceCard({ resource }: ResourceCardProps) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.roles && user.roles.includes("ROLE_ADMIN")) {
                    setIsAdmin(true);
                }
            } catch {
                // ignore parse errors
            }
        }
    }, []);

    const resourceId = resource.id || resource._id;
    const resourceName = resource.resourceName || resource.name || "Unnamed Resource";
    const resourceType = resource.resourceType || resource.type || "GENERAL";
    const status = resource.status || "ACTIVE";
    const category = resource.category;
    const capacity = resource.capacity || 0;
    
    const isFacility = category === "FACILITY";
    const isUtility = category === "UTILITY";
    
    const getLocationDisplay = () => {
        if (isFacility) {
            const parts = [];
            if (resource.location?.campusName || resource.campusName) {
                parts.push(resource.location?.campusName || resource.campusName);
            }
            if (resource.location?.buildingName || resource.building) {
                parts.push(resource.location?.buildingName || resource.building);
            }
            if (resource.location?.roomNumber || resource.roomNumber) {
                parts.push(resource.location?.roomNumber || resource.roomNumber);
            }
            return parts.length > 0 ? parts.join(' - ') : "N/A";
        } else if (isUtility) {
            const storageLoc = resource.location?.buildingName || resource.storageLocation;
            const campus = resource.location?.campusName || resource.campusName;
            if (storageLoc && campus) {
                return `${campus} - ${storageLoc}`;
            } else if (storageLoc) {
                return storageLoc;
            } else if (campus) {
                return campus;
            }
            return "N/A";
        }
        return resource.building || "N/A";
    };

    const locationDisplay = getLocationDisplay();

    return (
        <>
            <div className="group relative bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                    isUtility 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                        : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                } opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isUtility 
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        }`}>
                            {formatType(resourceType)}
                        </span>
                        <StatusBadge status={status} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {resourceName}
                    </h3>

                    {resource.resourceCode && (
                        <p className="text-xs text-slate-500 mb-4 font-mono">#{resource.resourceCode}</p>
                    )}

                    <div className="space-y-3 mb-4">
                        {isFacility && (
                            <div className="flex items-center text-sm text-slate-400">
                                <Users className="w-4 h-4 mr-3 text-slate-500 shrink-0" />
                                <span className="font-medium text-slate-300">{capacity}</span>
                                <span className="ml-1">seats capacity</span>
                            </div>
                        )}
                        
                        <div className="flex items-start text-sm text-slate-400">
                            {isUtility ? (
                                <Package className="w-4 h-4 mr-3 text-slate-500 shrink-0 mt-0.5" />
                            ) : (
                                <MapPin className="w-4 h-4 mr-3 text-slate-500 shrink-0 mt-0.5" />
                            )}
                            <span className="line-clamp-2">{locationDisplay}</span>
                        </div>

                        {isUtility && resource.description && (
                            <p className="text-sm text-slate-400 line-clamp-2">{resource.description}</p>
                        )}
                    </div>

                    {isFacility && resource.amenities && resource.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {resource.amenities.slice(0, 3).map((amenity, idx) => (
                                <span 
                                    key={idx} 
                                    className="px-2 py-0.5 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/30"
                                >
                                    {amenity}
                                </span>
                            ))}
                            {resource.amenities.length > 3 && (
                                <span className="px-2 py-0.5 text-xs rounded-md bg-slate-700/50 text-slate-500">
                                    +{resource.amenities.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6">
                    {isAdmin ? (
                        <Link 
                            href={`/dashboard/facilities/${resourceId}`}
                            className={`flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg active:scale-[0.98] ${
                                isUtility
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25 hover:shadow-amber-500/40'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25 hover:shadow-indigo-500/40'
                            }`}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                        </Link>
                    ) : (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className={`flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg active:scale-[0.98] ${
                                isUtility
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25 hover:shadow-amber-500/40'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25 hover:shadow-indigo-500/40'
                            }`}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                        </button>
                    )}
                </div>
            </div>

            <FacilityDetailsModal
                resource={resource}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
