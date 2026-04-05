"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { Users, MapPin, Calendar, Eye, CreditCard } from "lucide-react";

interface Resource {
    id?: string;
    _id?: string;
    resourceName?: string;
    name?: string;
    resourceType?: string;
    type?: string;
    status?: string;
    capacity?: number;
    location?: {
        campusName?: string;
        buildingName?: string;
        roomNumber?: string;
    };
    building?: string;
    floor?: string;
    resourceCode?: string;
    hourlyRate?: number;
    description?: string;
    amenities?: string[];
}

interface ResourceCardProps {
    resource: Resource;
    showBookingButton?: boolean;
    onBookNow?: (resource: Resource) => void;
}

export default function ResourceCard({ resource, showBookingButton = true, onBookNow }: ResourceCardProps) {
    const resourceId = resource.id || resource._id;
    const resourceName = resource.resourceName || resource.name || "Unnamed Resource";
    const resourceType = resource.resourceType || resource.type || "GENERAL";
    const status = resource.status || "ACTIVE";
    const capacity = resource.capacity || 0;
    
    const locationText = resource.location 
        ? `${resource.location.campusName || ''} - ${resource.location.buildingName || ''} (Room ${resource.location.roomNumber || 'N/A'})`
        : `${resource.building || 'N/A'} ${resource.floor ? `(Fl ${resource.floor})` : ''}`;

    return (
        <div className="group relative bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {resourceType.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={status} />
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {resourceName}
                </h3>

                {resource.resourceCode && (
                    <p className="text-xs text-slate-500 mb-4 font-mono">#{resource.resourceCode}</p>
                )}

                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-slate-400">
                        <Users className="w-4 h-4 mr-3 text-slate-500 shrink-0" />
                        <span className="font-medium text-slate-300">{capacity}</span>
                        <span className="ml-1">seats capacity</span>
                    </div>
                    
                    <div className="flex items-start text-sm text-slate-400">
                        <MapPin className="w-4 h-4 mr-3 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{locationText}</span>
                    </div>

                    {resource.hourlyRate !== undefined && resource.hourlyRate > 0 && (
                        <div className="flex items-center text-sm text-slate-400">
                            <CreditCard className="w-4 h-4 mr-3 text-slate-500 shrink-0" />
                            <span className="font-medium text-emerald-400">${resource.hourlyRate}</span>
                            <span className="ml-1">/hour</span>
                        </div>
                    )}
                </div>

                {resource.amenities && resource.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {resource.amenities.slice(0, 3).map((amenity, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/50">
                                {amenity}
                            </span>
                        ))}
                        {resource.amenities.length > 3 && (
                            <span className="px-2 py-0.5 text-xs rounded-md bg-slate-700/50 text-slate-500">
                                +{resource.amenities.length - 3} more
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
                <Link 
                    href={`/dashboard/facilities/${resourceId}`}
                    className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                </Link>
                
                {showBookingButton && status === "ACTIVE" && onBookNow && (
                    <button
                        onClick={() => onBookNow(resource)}
                        className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Now
                    </button>
                )}
            </div>
        </div>
    );
}
