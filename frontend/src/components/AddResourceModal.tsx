"use client";

import { X } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";

interface AddResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const FACILITY_TYPES = [
    { value: "LECTURE_HALL", label: "Lecture Hall" },
    { value: "LAB", label: "Lab" },
    { value: "AUDITORIUM", label: "Auditorium" },
    { value: "MEETING_ROOM", label: "Meeting Room" },
    { value: "ROOM", label: "Room" },
];

const UTILITY_TYPES = [
    { value: "PROJECTOR", label: "Projector" },
    { value: "SOUND_SYSTEM", label: "Sound System" },
    { value: "MICROPHONE", label: "Microphone" },
    { value: "WHITEBOARD", label: "Whiteboard" },
    { value: "FLAGS", label: "Flags" },
    { value: "OTHER", label: "Other (Specify)" },
];

export default function AddResourceModal({ isOpen, onClose, onSuccess }: AddResourceModalProps) {
    const [category, setCategory] = useState<"FACILITY" | "UTILITY">("FACILITY");
    const [resourceName, setResourceName] = useState("");
    const [resourceType, setResourceType] = useState("LECTURE_HALL");
    const [status, setStatus] = useState("ACTIVE");
    const [description, setDescription] = useState("");
    const [campus, setCampus] = useState("Main Campus");
    const [building, setBuilding] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [storageLocation, setStorageLocation] = useState("");
    const [capacity, setCapacity] = useState(50);
    const [amenities, setAmenities] = useState("");
    const [customUtilityType, setCustomUtilityType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const typeOptions = category === "FACILITY" ? FACILITY_TYPES : UTILITY_TYPES;
    const showCustomTypeField = category === "UTILITY" && resourceType === "OTHER";

    const handleCategoryChange = (newCategory: "FACILITY" | "UTILITY") => {
        setCategory(newCategory);
        setResourceType(newCategory === "FACILITY" ? "LECTURE_HALL" : "PROJECTOR");
        setCustomUtilityType("");
    };

    const handleTypeChange = (newType: string) => {
        setResourceType(newType);
        if (newType !== "OTHER") {
            setCustomUtilityType("");
        }
    };

    const resetForm = () => {
        setCategory("FACILITY");
        setResourceName("");
        setResourceType("LECTURE_HALL");
        setStatus("ACTIVE");
        setDescription("");
        setCampus("Main Campus");
        setBuilding("");
        setRoomNumber("");
        setStorageLocation("");
        setCapacity(50);
        setAmenities("");
        setCustomUtilityType("");
    };

    const handleSubmit = async () => {
        if (!resourceName.trim()) {
            Swal.fire({ 
                title: "Required Field", 
                text: "Resource name is required", 
                icon: "warning", 
                background: '#1e293b', 
                color: '#fff' 
            });
            return;
        }

        if (showCustomTypeField && !customUtilityType.trim()) {
            Swal.fire({ 
                title: "Required Field", 
                text: "Please specify the utility type", 
                icon: "warning", 
                background: '#1e293b', 
                color: '#fff' 
            });
            return;
        }

        setIsSubmitting(true);

        let finalType = resourceType;
        let finalDescription = description;
        
        if (resourceType === "OTHER" && customUtilityType.trim()) {
            finalType = `OTHER:${customUtilityType.trim()}`;
            finalDescription = customUtilityType.trim();
        }

        const payload: any = {
            resourceName: resourceName.trim(),
            category: category,
            type: finalType,
            description: finalDescription,
            status,
            resourceCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`
        };

        if (category === "FACILITY") {
            payload.capacity = capacity;
            payload.campusName = campus;
            payload.building = building;
            payload.roomNumber = roomNumber;
            payload.amenities = amenities
                .split(',')
                .map((a: string) => a.trim())
                .filter((a: string) => a.length > 0);
        } else {
            payload.capacity = 0;
            payload.campusName = campus;
            payload.storageLocation = storageLocation;
            payload.amenities = description ? [description] : [];
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/resources`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                Swal.fire({ 
                    title: "Resource Added!", 
                    text: "The new resource has been created successfully.", 
                    icon: "success", 
                    background: '#1e293b', 
                    color: '#fff'
                });
                resetForm();
                onSuccess();
                onClose();
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
            Swal.fire({ title: "Error", text: "Network processing failed", icon: "error", background: '#1e293b', color: '#fff' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                
                <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
                    <h2 className="text-lg font-bold text-white">Add New Resource</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Category *</label>
                            <select
                                value={category}
                                onChange={(e) => handleCategoryChange(e.target.value as "FACILITY" | "UTILITY")}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
                            >
                                <option value="FACILITY">Facility</option>
                                <option value="UTILITY">Utility</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Resource Name *</label>
                            <input
                                type="text"
                                value={resourceName}
                                onChange={(e) => setResourceName(e.target.value)}
                                placeholder={category === "FACILITY" ? "Main Auditorium" : "Epson Projector #1"}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Type *</label>
                            <select
                                value={resourceType}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
                            >
                                {typeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="MAINTENANCE">MAINTENANCE</option>
                                <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                            </select>
                        </div>
                    </div>

                    {showCustomTypeField && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Specify Utility Type *</label>
                            <input
                                type="text"
                                value={customUtilityType}
                                onChange={(e) => setCustomUtilityType(e.target.value)}
                                placeholder="e.g., Speaker Stand, Extension Cord"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            {category === "FACILITY" ? "Description" : "Notes / Description"}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder={category === "FACILITY" ? "Large auditorium with AV equipment..." : "Serial number, condition, notes..."}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none resize-none"
                        />
                    </div>

                    {category === "FACILITY" ? (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Campus</label>
                                    <input
                                        type="text"
                                        value={campus}
                                        onChange={(e) => setCampus(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Building</label>
                                    <input
                                        type="text"
                                        value={building}
                                        onChange={(e) => setBuilding(e.target.value)}
                                        placeholder="Engineering"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Room Number</label>
                                    <input
                                        type="text"
                                        value={roomNumber}
                                        onChange={(e) => setRoomNumber(e.target.value)}
                                        placeholder="A-101"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Capacity (seats)</label>
                                    <input
                                        type="number"
                                        value={capacity}
                                        onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Amenities</label>
                                    <input
                                        type="text"
                                        value={amenities}
                                        onChange={(e) => setAmenities(e.target.value)}
                                        placeholder="Projector, WiFi, AC"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Campus / Storage</label>
                                <input
                                    type="text"
                                    value={campus}
                                    onChange={(e) => setCampus(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Storage Location</label>
                                <input
                                    type="text"
                                    value={storageLocation}
                                    onChange={(e) => setStorageLocation(e.target.value)}
                                    placeholder="Equipment Room 1"
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700/50 bg-slate-800/30">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600/50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Adding..." : "Add Resource"}
                    </button>
                </div>
            </div>
        </div>
    );
}
