"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ArrowLeft, Users, MapPin, CreditCard, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

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

export default function FacilityDetailPage() {
    const params = useParams();
    const router = useRouter();
    const resourceId = params.id as string;
    
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        purpose: "",
        expectedAttendees: 1,
        startTime: "",
        endTime: ""
    });

    useEffect(() => {
        const fetchResource = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                const res = await fetch(`${apiUrl}/api/facilities/resources/${resourceId}`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    setResource(data);
                } else if (res.status === 404) {
                    Swal.fire("Error", "Facility not found", "error").then(() => {
                        router.push("/dashboard/facilities");
                    });
                }
            } catch (err) {
                console.error("Failed to fetch resource", err);
                Swal.fire("Error", "Failed to load facility details", "error");
            } finally {
                setLoading(false);
            }
        };

        if (resourceId) {
            fetchResource();
        }
    }, [resourceId, router]);

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            Swal.fire("Error", "Please log in to make a booking", "error");
            return;
        }

        const user = JSON.parse(storedUser);
        
        const bookingRequest: BookingRequest = {
            resourceId: resource?.id || resource?._id || "",
            purpose: bookingForm.purpose,
            expectedAttendees: bookingForm.expectedAttendees,
            startTime: bookingForm.startTime,
            endTime: bookingForm.endTime,
            requestedBy: {
                userId: user.id,
                name: user.name || user.firstName + " " + user.lastName,
                email: user.email
            }
        };

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/bookings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(bookingRequest)
            });

            if (res.ok) {
                Swal.fire("Success", "Booking request submitted successfully!", "success");
                setBookingModalOpen(false);
                setBookingForm({ purpose: "", expectedAttendees: 1, startTime: "", endTime: "" });
            } else {
                const error = await res.json();
                Swal.fire("Error", error.message || "Failed to submit booking", "error");
            }
        } catch (err) {
            console.error("Booking error", err);
            Swal.fire("Error", "Network error while submitting booking", "error");
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
                <p className="text-slate-400">Facility not found</p>
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
    
    const locationText = resource.location 
        ? `${resource.location.campusName || ''} - ${resource.location.buildingName || ''} (Room ${resource.location.roomNumber || 'N/A'})`
        : `${resource.building || 'N/A'} ${resource.floor ? `(Floor ${resource.floor})` : ''}`;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Active</span>;
            case "MAINTENANCE":
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Maintenance</span>;
            case "INACTIVE":
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Inactive</span>;
            default:
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">{status}</span>;
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
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-3">
                                {resourceType.replace(/_/g, ' ')}
                            </span>
                            <h1 className="text-3xl font-bold text-white mb-2">{resourceName}</h1>
                            {resource.resourceCode && (
                                <p className="text-sm text-slate-500 font-mono">#{resource.resourceCode}</p>
                            )}
                        </div>
                        {getStatusBadge(status)}
                    </div>

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
                                <MapPin className="w-5 h-5 mr-2 text-slate-500" />
                                <span className="text-sm">Location</span>
                            </div>
                            <p className="text-lg font-semibold text-white">{locationText}</p>
                        </div>

                        {resource.hourlyRate !== undefined && resource.hourlyRate > 0 && (
                            <div className="bg-slate-700/30 rounded-xl p-4">
                                <div className="flex items-center text-slate-400 mb-2">
                                    <CreditCard className="w-5 h-5 mr-2 text-slate-500" />
                                    <span className="text-sm">Hourly Rate</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-400">${resource.hourlyRate}</p>
                                <p className="text-sm text-slate-500">per hour</p>
                            </div>
                        )}
                    </div>

                    {resource.description && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
                            <p className="text-slate-300 leading-relaxed">{resource.description}</p>
                        </div>
                    )}

                    {resource.amenities && resource.amenities.length > 0 && (
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

                    {status === "ACTIVE" && (
                        <button
                            onClick={() => setBookingModalOpen(true)}
                            className="w-full flex items-center justify-center px-6 py-3.5 text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]"
                        >
                            <Calendar className="w-5 h-5 mr-2" />
                            Book This Facility
                        </button>
                    )}
                </div>
            </div>

            {bookingModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Book {resourceName}</h2>
                            <form onSubmit={handleBooking} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Purpose</label>
                                    <textarea
                                        value={bookingForm.purpose}
                                        onChange={(e) => setBookingForm({...bookingForm, purpose: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Expected Attendees</label>
                                    <input
                                        type="number"
                                        value={bookingForm.expectedAttendees}
                                        onChange={(e) => setBookingForm({...bookingForm, expectedAttendees: parseInt(e.target.value)})}
                                        min={1}
                                        max={capacity}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Start Time</label>
                                        <input
                                            type="datetime-local"
                                            value={bookingForm.startTime}
                                            onChange={(e) => setBookingForm({...bookingForm, startTime: e.target.value})}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">End Time</label>
                                        <input
                                            type="datetime-local"
                                            value={bookingForm.endTime}
                                            onChange={(e) => setBookingForm({...bookingForm, endTime: e.target.value})}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setBookingModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-lg transition-all"
                                    >
                                        Submit Booking
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
