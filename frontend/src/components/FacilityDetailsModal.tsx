"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, Users, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

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
    resourceCode?: string;
    description?: string;
    amenities?: string[];
}

interface Booking {
    id?: string;
    _id?: string;
    resourceId?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    purpose?: string;
    expectedAttendees?: number;
}

interface FacilityDetailsModalProps {
    resource: Resource;
    isOpen: boolean;
    onClose: () => void;
}

const formatType = (type: string): string => {
    if (type?.startsWith("OTHER:")) {
        return type.replace("OTHER:", "");
    }
    return type?.replace(/_/g, ' ') || 'Unknown';
};

const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export default function FacilityDetailsModal({ resource, isOpen, onClose }: FacilityDetailsModalProps) {
    const router = useRouter();
    const resourceId = resource.id || resource._id;
    const resourceName = resource.resourceName || resource.name || "Unnamed Resource";
    const resourceType = resource.resourceType || resource.type || "GENERAL";
    const status = resource.status || "ACTIVE";
    const capacity = resource.capacity || 0;

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedStartTime, setSelectedStartTime] = useState<string>("");
    const [selectedEndTime, setSelectedEndTime] = useState<string>("");
    const [purpose, setPurpose] = useState("");
    const [attendees, setAttendees] = useState<number>(1);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        if (isOpen && resourceId) {
            fetchBookings();
        }
    }, [isOpen, resourceId]);

    const fetchBookings = async () => {
        setLoadingBookings(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/bookings/resource/${resourceId}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        } finally {
            setLoadingBookings(false);
        }
    };

    const getLocationDisplay = () => {
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
    };

    const getBookedSlotsForDate = (date: string): { start: string; end: string }[] => {
        if (!date) return [];
        return bookings
            .filter(b => b.status === "APPROVED" || b.status === "PENDING")
            .filter(b => {
                const bDate = b.startTime?.split('T')[0];
                return bDate === date;
            })
            .map(b => ({
                start: b.startTime?.split('T')[1]?.substring(0, 5) || "00:00",
                end: b.endTime?.split('T')[1]?.substring(0, 5) || "00:00"
            }));
    };

    const isSlotAvailable = (time: string): boolean => {
        if (!selectedDate) return false;
        const bookedSlots = getBookedSlotsForDate(selectedDate);
        return !bookedSlots.some(slot => {
            const slotStart = parseInt(time.split(':')[0]);
            const slotEnd = slotStart + 1;
            const bookedStart = parseInt(slot.start.split(':')[0]);
            const bookedEnd = parseInt(slot.end.split(':')[0]);
            return slotStart < bookedEnd && slotEnd > bookedStart;
        });
    };

    const isEndTimeValid = (): boolean => {
        if (!selectedStartTime || !selectedEndTime) return false;
        const start = parseInt(selectedStartTime.split(':')[0]);
        const end = parseInt(selectedEndTime.split(':')[0]);
        return end > start;
    };

    const handleBook = async () => {
        if (!selectedDate || !selectedStartTime || !selectedEndTime || !purpose.trim()) {
            Swal.fire("Error", "Please fill in all booking details", "error");
            return;
        }

        if (!isEndTimeValid()) {
            Swal.fire("Error", "End time must be after start time", "error");
            return;
        }

        setIsBooking(true);
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                Swal.fire("Error", "Please log in to make a booking", "error");
                return;
            }
            const user = JSON.parse(storedUser);

            const startDateTime = `${selectedDate}T${selectedStartTime}:00`;
            const endDateTime = `${selectedDate}T${selectedEndTime}:00`;

            const bookingData = {
                resourceId: resourceId,
                requestedBy: {
                    userId: user.userId || user.id,
                    name: user.name || user.fullName,
                    email: user.email
                },
                purpose: purpose,
                expectedAttendees: attendees,
                startTime: startDateTime,
                endTime: endDateTime
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(bookingData)
            });

            if (res.ok) {
                await Swal.fire({
                    title: "Success!",
                    text: "Your booking has been submitted for approval",
                    icon: "success",
                    timer: 2000
                });
                onClose();
                router.push("/dashboard/bookings");
            } else if (res.status === 409) {
                const data = await res.json();
                Swal.fire("Error", data.message || "Time slot already booked", "error");
            } else {
                Swal.fire("Error", "Failed to create booking", "error");
            }
        } catch (err) {
            console.error("Booking error", err);
            Swal.fire("Error", "Failed to create booking", "error");
        } finally {
            setIsBooking(false);
        }
    };

    const getMinDate = (): string => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
                    <h2 className="text-2xl font-bold text-white">{resourceName}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {formatType(resourceType)}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            status === "ACTIVE" 
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }`}>
                            {status === "ACTIVE" ? "Available" : status}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center text-slate-300">
                            <MapPin className="w-5 h-5 mr-3 text-slate-500" />
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Location</p>
                                <p className="font-medium">{getLocationDisplay()}</p>
                            </div>
                        </div>
                        <div className="flex items-center text-slate-300">
                            <Users className="w-5 h-5 mr-3 text-slate-500" />
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Capacity</p>
                                <p className="font-medium">{capacity} seats</p>
                            </div>
                        </div>
                    </div>

                    {resource.description && (
                        <div>
                            <p className="text-xs text-slate-500 uppercase mb-1">Description</p>
                            <p className="text-slate-300">{resource.description}</p>
                        </div>
                    )}

                    {resource.amenities && resource.amenities.length > 0 && (
                        <div>
                            <p className="text-xs text-slate-500 uppercase mb-2">Amenities</p>
                            <div className="flex flex-wrap gap-2">
                                {resource.amenities.map((amenity, idx) => (
                                    <span key={idx} className="px-3 py-1 text-sm rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/30">
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-700 pt-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Book this Facility</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={getMinDate()}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Start Time</label>
                                    <select
                                        value={selectedStartTime}
                                        onChange={(e) => {
                                            setSelectedStartTime(e.target.value);
                                            setSelectedEndTime("");
                                        }}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer"
                                    >
                                        <option value="">Select start</option>
                                        {TIME_SLOTS.map(time => (
                                            <option key={time} value={time} disabled={selectedDate && !isSlotAvailable(time)}>
                                                {time} {selectedDate && !isSlotAvailable(time) ? '(Booked)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">End Time</label>
                                    <select
                                        value={selectedEndTime}
                                        onChange={(e) => setSelectedEndTime(e.target.value)}
                                        disabled={!selectedStartTime}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="">Select end</option>
                                        {TIME_SLOTS.filter(t => {
                                            if (!selectedStartTime) return true;
                                            return parseInt(t.split(':')[0]) > parseInt(selectedStartTime.split(':')[0]);
                                        }).map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Purpose</label>
                                <input
                                    type="text"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Enter booking purpose"
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Expected Attendees</label>
                                <input
                                    type="number"
                                    value={attendees}
                                    onChange={(e) => setAttendees(parseInt(e.target.value) || 1)}
                                    min={1}
                                    max={capacity}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-slate-700 bg-slate-800">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-slate-300 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBook}
                        disabled={isBooking || !selectedDate || !selectedStartTime || !selectedEndTime || !purpose.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isBooking ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Booking...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Book Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
