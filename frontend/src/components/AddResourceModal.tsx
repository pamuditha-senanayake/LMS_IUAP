"use client";

import { X } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";

const CATEGORY_OPTIONS = [
    { value: "FACILITY", label: "Facilities" },
    { value: "UTILITY", label: "Utilities" },
];

const STATUS_OPTIONS = [
    { value: "ACTIVE", label: "ACTIVE" },
    { value: "OUT_OF_SERVICE", label: "OUT_OF_SERVICE" },
    { value: "MAINTENANCE_REQUIRED", label: "MAINTENANCE_REQUIRED" },
];

const LOCATION_OPTIONS = [
    { value: "IT", label: "IT" },
    { value: "Medicine", label: "Medicine" },
    { value: "Engineering", label: "Engineering" },
    { value: "Architecture", label: "Architecture" },
];

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

interface ValidationErrors {
    resourceName?: string;
    category?: string;
    type?: string;
    status?: string;
    location?: string;
    roomNumber?: string;
    serialNumber?: string;
    capacity?: string;
}

interface AddResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddResourceModal({ isOpen, onClose, onSuccess }: AddResourceModalProps) {
    const [category, setCategory] = useState<"FACILITY" | "UTILITY">("FACILITY");
    const [resourceName, setResourceName] = useState("");
    const [resourceType, setResourceType] = useState("LECTURE_HALL");
    const [status, setStatus] = useState("ACTIVE");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [capacity, setCapacity] = useState<number | "">("");
    const [customUtilityType, setCustomUtilityType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const typeOptions = category === "FACILITY" ? FACILITY_TYPES : UTILITY_TYPES;
    const showCustomTypeField = category === "UTILITY" && resourceType === "OTHER";

    const handleCategoryChange = (newCategory: "FACILITY" | "UTILITY") => {
        setCategory(newCategory);
        setResourceType(newCategory === "FACILITY" ? "LECTURE_HALL" : "PROJECTOR");
        setCustomUtilityType("");
        setRoomNumber("");
        setSerialNumber("");
        setCapacity("");
        setErrors({});
    };

    const handleTypeChange = (newType: string) => {
        setResourceType(newType);
        if (newType !== "OTHER") {
            setCustomUtilityType("");
        }
    };

    const handleCapacityChange = (value: string) => {
        const num = value === "" ? "" : Number(value);
        setCapacity(num);
        if (num !== "" && num < 0) {
            setErrors(prev => ({ ...prev, capacity: "Capacity cannot be negative" }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.capacity;
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: ValidationErrors = {};
        let isValid = true;

        if (!resourceName.trim()) {
            newErrors.resourceName = "Resource Name is required";
            isValid = false;
        }
        if (!category) {
            newErrors.category = "Category is required";
            isValid = false;
        }
        if (!resourceType) {
            newErrors.type = "Type is required";
            isValid = false;
        }
        if (!status) {
            newErrors.status = "Status is required";
            isValid = false;
        }
        if (!location) {
            newErrors.location = "Location is required";
            isValid = false;
        }
        if (category === "FACILITY") {
            if (!roomNumber.trim()) {
                newErrors.roomNumber = "Room Number is required";
                isValid = false;
            }
            if (capacity === "" || capacity === null) {
                newErrors.capacity = "Capacity is required";
                isValid = false;
            } else if (typeof capacity === "number" && capacity < 0) {
                newErrors.capacity = "Capacity cannot be negative";
                isValid = false;
            }
        }
        if (category === "UTILITY") {
            if (!serialNumber.trim()) {
                newErrors.serialNumber = "Serial Number is required";
                isValid = false;
            }
        }

        console.log("Validation:", { resourceName, category, resourceType, status, location, roomNumber, serialNumber, capacity, errors: newErrors, isValid });
        
        setErrors(newErrors);
        return isValid;
    };

    const resetForm = () => {
        setCategory("FACILITY");
        setResourceName("");
        setResourceType("LECTURE_HALL");
        setStatus("ACTIVE");
        setLocation("");
        setDescription("");
        setRoomNumber("");
        setSerialNumber("");
        setCapacity("");
        setCustomUtilityType("");
        setErrors({});
    };

    const handleSubmit = async () => {
        console.log("Form submit started");
        console.log("Form state:", { resourceName, category, resourceType, status, location, roomNumber, serialNumber, capacity, customUtilityType });

        if (!validate()) {
            console.log("Validation failed, not submitting");
            return;
        }

        setIsSubmitting(true);

        let finalType = resourceType;
        let finalDescription = description;
        
        if (resourceType === "OTHER" && customUtilityType.trim()) {
            finalType = `OTHER:${customUtilityType.trim()}`;
            finalDescription = customUtilityType.trim();
        }

        const payload: Record<string, any> = {
            resourceName: resourceName.trim(),
            category: category,
            type: finalType,
            description: finalDescription,
            status: status,
            resourceCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`
        };

        if (category === "FACILITY") {
            payload.capacity = capacity !== "" ? capacity : 0;
            payload.roomNumber = roomNumber;
            payload.building = location;
            payload.amenities = [];
            payload.campusName = location;
        } else {
            payload.serialNumber = serialNumber;
            payload.storageLocation = location;
            payload.building = "";
            payload.roomNumber = "";
            payload.amenities = description ? [description] : [];
            payload.campusName = location;
        }

        console.log("Request payload:", JSON.stringify(payload, null, 2));

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/resources`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const responseData = await res.text();
            console.log("Response status:", res.status);
            console.log("Response body:", responseData);

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
                let errorMessage = responseData;
                try {
                    const errorJson = JSON.parse(responseData);
                    if (errorJson.message) {
                        errorMessage = errorJson.message;
                    } else if (errorJson.errors) {
                        errorMessage = Object.entries(errorJson.errors).map(([k, v]) => `${k}: ${v}`).join(", ");
                    }
                } catch {}
                Swal.fire({ 
                    title: "Failed", 
                    text: errorMessage, 
                    icon: "error", 
                    background: '#1e293b', 
                    color: '#fff'
                });
            }
        } catch (error) {
            console.error("Network error:", error);
            Swal.fire({ title: "Error", text: "Network processing failed: " + (error as Error).message, icon: "error", background: '#1e293b', color: '#fff' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isValid = resourceName.trim() && category && resourceType && status && location && 
        (category === "FACILITY" ? (roomNumber.trim() && capacity !== "" && (capacity as number) >= 0) : serialNumber.trim());

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
                                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer ${errors.category ? 'border-red-500' : 'border-slate-700/50'}`}
                            >
                                <option value="">Select Category</option>
                                {CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Resource Name *</label>
                            <input
                                type="text"
                                value={resourceName}
                                onChange={(e) => setResourceName(e.target.value)}
                                placeholder={category === "FACILITY" ? "Main Auditorium" : "Epson Projector #1"}
                                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none ${errors.resourceName ? 'border-red-500' : 'border-slate-700/50'}`}
                            />
                            {errors.resourceName && <p className="mt-1 text-xs text-red-400">{errors.resourceName}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Type *</label>
                            <select
                                value={resourceType}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer ${errors.type ? 'border-red-500' : 'border-slate-700/50'}`}
                            >
                                <option value="">Select Type</option>
                                {typeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {errors.type && <p className="mt-1 text-xs text-red-400">{errors.type}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Status *</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer ${errors.status ? 'border-red-500' : 'border-slate-700/50'}`}
                            >
                                <option value="">Select Status</option>
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {errors.status && <p className="mt-1 text-xs text-red-400">{errors.status}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Location *</label>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer ${errors.location ? 'border-red-500' : 'border-slate-700/50'}`}
                        >
                            <option value="">Select Location</option>
                            {LOCATION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {errors.location && <p className="mt-1 text-xs text-red-400">{errors.location}</p>}
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
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Room Number *</label>
                                <input
                                    type="text"
                                    value={roomNumber}
                                    onChange={(e) => setRoomNumber(e.target.value)}
                                    placeholder="A-101"
                                    className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none ${errors.roomNumber ? 'border-red-500' : 'border-slate-700/50'}`}
                                />
                                {errors.roomNumber && <p className="mt-1 text-xs text-red-400">{errors.roomNumber}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Capacity *</label>
                                <input
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => handleCapacityChange(e.target.value)}
                                    placeholder="50"
                                    min="0"
                                    className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none ${errors.capacity ? 'border-red-500' : 'border-slate-700/50'}`}
                                />
                                {errors.capacity && <p className="mt-1 text-xs text-red-400">{errors.capacity}</p>}
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Serial Number *</label>
                                <input
                                    type="text"
                                    value={serialNumber}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    placeholder="SN-12345"
                                    className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none ${errors.serialNumber ? 'border-red-500' : 'border-slate-700/50'}`}
                                />
                                {errors.serialNumber && <p className="mt-1 text-xs text-red-400">{errors.serialNumber}</p>}
                            </div>
                        </>
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
                        disabled={isSubmitting || !isValid}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Adding..." : "Add Resource"}
                    </button>
                </div>
            </div>
        </div>
    );
}