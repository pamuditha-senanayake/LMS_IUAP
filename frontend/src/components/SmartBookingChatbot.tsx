"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { X, Bot, User, Loader2, RotateCcw, Calendar, Clock, Users, CheckCircle, Circle, AlertTriangle, Sparkles, ArrowRight, MapPin, MapPinned } from "lucide-react";

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
    location?: string;
    serialNumber?: string;
    campusName?: string;
    building?: string;
    roomNumber?: string;
    storageLocation?: string;
    resourceCode?: string;
    description?: string;
    amenities?: string[];
    campusLocation?: {
        campusName?: string;
        buildingName?: string;
        roomNumber?: string;
    };
}

interface BookingData {
    category: string;
    type: string;
    location: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
    capacityLabel: string;
    amenities: string[];
    purpose?: string;
}

interface ChatMessage {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
    options?: ChatOption[];
    resource?: Resource;
    bookingData?: BookingData;
    prefillData?: PrefillData;
    isDatePicker?: boolean;
    isTimePicker?: boolean;
    isCapacityPicker?: boolean;
    isAmenityPicker?: boolean;
    isUtilityTypePicker?: boolean;
    isTypePicker?: boolean;
    isLocationPicker?: boolean;
    isStartTimePicker?: boolean;
    isEndTimePicker?: boolean;
    error?: string;
    recommendationReason?: string;
    isBooked?: boolean;
    alternativeResource?: Resource;
    conflictInfo?: ConflictInfo;
    nextAvailableTime?: string;
    missingAmenities?: string[];
    needsConfirmation?: boolean;
    hasAllAmenities?: boolean;
}

interface ChatOption {
    label: string;
    value: string;
    description?: string;
}

interface ConflictInfo {
    startTime: string;
    endTime: string;
    purpose: string;
}

type BookingStep = 
    | "category"
    | "location"
    | "facilityType"
    | "capacity"
    | "amenities"
    | "utilityType"
    | "date"
    | "startTime"
    | "endTime"
    | "recommendation"
    | "done";

interface PrefillData {
    date?: string;
    startTime?: string;
    endTime?: string;
    capacity?: number;
    category?: string;
    type?: string;
    location?: string;
    amenities?: string[];
    purpose?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
}

interface SmartBookingChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    onViewResource: (resource: Resource, bookingData?: BookingData, prefillData?: PrefillData) => void;
    onBookResource: (resource: Resource, bookingData?: BookingData, prefillData?: PrefillData) => void;
    onGetUser: () => Promise<{ id: string; name: string; email: string } | null>;
    resources: Resource[];
}

const FACILITY_TYPES: ChatOption[] = [
    { label: "Lecture Hall", value: "LECTURE_HALL", description: "Large hall for lectures" },
    { label: "Lab", value: "LAB", description: "Laboratory space" },
    { label: "Meeting Room", value: "MEETING_ROOM", description: "Small to medium meeting space" },
    { label: "Auditorium", value: "AUDITORIUM", description: "Large auditorium" },
    { label: "Room", value: "ROOM", description: "General room" },
];

const UTILITY_TYPES: ChatOption[] = [
    { label: "Projector", value: "PROJECTOR", description: "Display equipment" },
    { label: "Sound System", value: "SOUND_SYSTEM", description: "Audio equipment" },
    { label: "Microphone", value: "MICROPHONE", description: "Microphones" },
    { label: "Whiteboard", value: "WHITEBOARD", description: "Whiteboard/board" },
    { label: "Flags", value: "FLAGS", description: "Display flags" },
];

const AMENITY_OPTIONS: ChatOption[] = [
    { label: "WiFi", value: "WiFi" },
    { label: "Whiteboard", value: "Whiteboard" },
    { label: "Projector", value: "Projector" },
    { label: "Air Conditioning", value: "Air Conditioning" },
    { label: "Audio System", value: "Audio System" },
    { label: "Video Conferencing", value: "Video Conferencing" },
];

const CAPACITY_OPTIONS: ChatOption[] = [
    { label: "1-10 people", value: "10" },
    { label: "11-20 people", value: "20" },
    { label: "21-50 people", value: "50" },
    { label: "51-100 people", value: "100" },
    { label: "100+ people", value: "200" },
];

const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

function validateTimeRange(startTime: string, endTime: string): boolean {
    if (!startTime || !endTime) return false;
    const start = parseInt(startTime.split(":")[0]);
    const end = parseInt(endTime.split(":")[0]);
    return end > start;
}

function getValidEndTimes(startTime: string): string[] {
    if (!startTime) return [];
    const startHour = parseInt(startTime.split(":")[0]);
    return TIME_SLOTS.filter(t => parseInt(t.split(":")[0]) > startHour);
}

function getLocationsFromResources(resources: Resource[]): ChatOption[] {
    const locationSet = new Set<string>();
    
    resources.forEach(r => {
        const campusLoc = r.campusLocation;
        if (r.category === "FACILITY") {
            const campus = campusLoc?.campusName || r.campusName;
            const building = campusLoc?.buildingName || r.building || r.location;
            if (campus) locationSet.add(campus);
            if (building) locationSet.add(building);
        } else {
            const campus = campusLoc?.campusName || r.campusName;
            const storage = campusLoc?.buildingName || r.storageLocation || r.location;
            if (campus) locationSet.add(campus);
            if (storage) locationSet.add(storage);
        }
    });
    
    return Array.from(locationSet)
        .filter(loc => loc && loc.trim())
        .sort()
        .map(loc => ({ label: loc, value: loc }));
}

function getBestFacilityMatch(resources: Resource[], criteria: {
    type?: string;
    location?: string;
    capacity?: number;
    amenities?: string[];
    date?: string;
    startTime?: string;
    endTime?: string;
}): Resource | null {
    let facilities = resources.filter(r => r.category === "FACILITY" && r.status === "ACTIVE");
    
    if (criteria.location) {
        facilities = facilities.filter(r => {
            const campusLoc = r.campusLocation;
            const campus = campusLoc?.campusName || r.campusName || "";
            const building = campusLoc?.buildingName || r.building || r.location || "";
            return campus.toLowerCase() === criteria.location!.toLowerCase() ||
                   building.toLowerCase() === criteria.location!.toLowerCase();
        });
    }
    
    if (criteria.type) {
        const typeFiltered = facilities.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
        if (typeFiltered.length > 0) {
            return rankAndSelectFacility(typeFiltered, criteria);
        }
    }
    
    return rankAndSelectFacility(facilities, criteria);
}

function rankAndSelectFacility(resources: Resource[], criteria: {
    capacity?: number;
    amenities?: string[];
}): Resource | null {
    if (resources.length === 0) return null;
    
    let filteredResources = resources;
    
    if (criteria.amenities && criteria.amenities.length > 0) {
        filteredResources = resources.filter(resource => {
            if (!resource.amenities || resource.amenities.length === 0) return false;
            const resourceAmenities = resource.amenities.map(a => a.toLowerCase());
            return criteria.amenities!.every(a => resourceAmenities.includes(a.toLowerCase()));
        });
        
        if (filteredResources.length === 0) {
            return null;
        }
    }
    
    const scored = filteredResources.map(resource => {
        let score = 0;
        
        if (criteria.capacity && resource.capacity) {
            if (resource.capacity >= criteria.capacity) {
                score += 50;
                if (resource.capacity <= criteria.capacity * 1.5) {
                    score += 20;
                }
            } else {
                score -= 100;
            }
        } else {
            score += 25;
        }
        
        if (criteria.amenities && criteria.amenities.length > 0 && resource.amenities) {
            const matched = criteria.amenities.filter(a => 
                resource.amenities!.map(am => am.toLowerCase()).includes(a.toLowerCase())
            ).length;
            score += matched * 15;
        }
        
        return { resource, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].resource;
}

function getBestUtilityMatch(resources: Resource[], criteria: {
    type?: string;
    location?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
}): Resource | null {
    let utilities = resources.filter(r => r.category === "UTILITY" && r.status === "ACTIVE");
    
    if (criteria.location) {
        utilities = utilities.filter(r => {
            const campusLoc = r.campusLocation;
            const campus = campusLoc?.campusName || r.campusName || "";
            const storage = campusLoc?.buildingName || r.storageLocation || r.location || "";
            return campus.toLowerCase() === criteria.location!.toLowerCase() ||
                   storage.toLowerCase() === criteria.location!.toLowerCase();
        });
    }
    
    if (criteria.type) {
        const filtered = utilities.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
        if (filtered.length > 0) return filtered[0];
    }
    
    return utilities.length > 0 ? utilities[0] : null;
}

function getSameCategoryAlternatives(resources: Resource[], excludedId: string, criteria: {
    category?: string;
    type?: string;
    location?: string;
    capacity?: number;
    amenities?: string[];
}): Resource | null {
    let filtered = resources.filter(r => 
        r.status === "ACTIVE" && 
        (r.id || r._id) !== excludedId
    );
    
    if (criteria.category) {
        filtered = filtered.filter(r => r.category === criteria.category);
    }
    
    if (criteria.type) {
        filtered = filtered.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
    }
    
    if (criteria.location) {
        filtered = filtered.filter(r => {
            const campusLoc = r.campusLocation;
            if (criteria.category === "FACILITY") {
                const campus = campusLoc?.campusName || r.campusName || "";
                const building = campusLoc?.buildingName || r.building || r.location || "";
                return campus.toLowerCase() === criteria.location!.toLowerCase() ||
                       building.toLowerCase() === criteria.location!.toLowerCase();
            } else {
                const campus = campusLoc?.campusName || r.campusName || "";
                const storage = campusLoc?.buildingName || r.storageLocation || r.location || "";
                return campus.toLowerCase() === criteria.location!.toLowerCase() ||
                       storage.toLowerCase() === criteria.location!.toLowerCase();
            }
        });
    }
    
    if (filtered.length > 0) {
        return rankAndSelectFacility(filtered, {
            capacity: criteria.capacity,
            amenities: criteria.amenities,
        });
    }
    
    if (criteria.category && criteria.type) {
        filtered = resources.filter(r => 
            r.status === "ACTIVE" && 
            r.category === criteria.category &&
            (r.id || r._id) !== excludedId
        );
        const typeFiltered = filtered.filter(r => {
            const rType = r.resourceType || r.type || "";
            return rType.toUpperCase() === criteria.type!.toUpperCase();
        });
        if (typeFiltered.length > 0) {
            return rankAndSelectFacility(typeFiltered, {
                capacity: criteria.capacity,
                amenities: criteria.amenities,
            });
        }
    }
    
    return null;
}

function buildCapacityRequirementLabel(capacityLabel: string): string {
    if (!capacityLabel) return "";
    return capacityLabel.replace(" people", "");
}

function buildRecommendationReason(resource: Resource, criteria: {
    category?: string;
    type?: string;
    location?: string;
    capacityLabel?: string;
    amenities?: string[];
}): string {
    const reasons: string[] = [];
    
    if (criteria.category === "FACILITY") {
        if (criteria.location) {
            reasons.push(`is located at ${criteria.location}`);
        }
        reasons.push("matches your selected facility type");
        
        if (criteria.capacityLabel) {
            const requirement = buildCapacityRequirementLabel(criteria.capacityLabel);
            reasons.push(`fits your requested capacity of ${requirement} people`);
        }
        
        if (criteria.amenities && criteria.amenities.length > 0 && resource.amenities) {
            const matched = criteria.amenities.filter(a => 
                resource.amenities!.map(am => am.toLowerCase()).includes(a.toLowerCase())
            );
            if (matched.length > 0) {
                reasons.push(`includes ${matched.join(", ")}`);
            }
        }
        
        reasons.push("is available for your selected time");
    } else {
        if (criteria.location) {
            reasons.push(`is available at ${criteria.location}`);
        }
        reasons.push("matches your selected utility type");
        reasons.push("is available for booking");
    }
    
    return "This is the best option because " + reasons.join(", ") + ".";
}

function formatType(type: string): string {
    if (type?.startsWith("OTHER:")) {
        return type.replace("OTHER:", "");
    }
    return type?.replace(/_/g, ' ') || 'Unknown';
}

function getLocationDisplay(resource: Resource): string {
    const campusLoc = resource.campusLocation;
    if (resource.category === "FACILITY") {
        const parts = [];
        if (campusLoc?.campusName || resource.campusName) {
            parts.push(campusLoc?.campusName || resource.campusName);
        }
        if (campusLoc?.buildingName || resource.building || resource.location) {
            parts.push(campusLoc?.buildingName || resource.building || resource.location);
        }
        return parts.join(" - ") || resource.location || "N/A";
    } else {
        const campus = campusLoc?.campusName || resource.campusName;
        const storage = campusLoc?.buildingName || resource.storageLocation || resource.location;
        if (campus && storage) return `${campus} - ${storage}`;
        return campus || storage || "N/A";
    }
}

let messageIdCounter = 0;
const generateMessageId = (): string => {
    messageIdCounter += 1;
    return `msg_${Date.now()}_${messageIdCounter}`;
};

export default function SmartBookingChatbot({ isOpen, onClose, onViewResource, onBookResource, onGetUser, resources }: SmartBookingChatbotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentStep, setCurrentStep] = useState<BookingStep>("category");
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
    const [bookingData, setBookingData] = useState<BookingData>({
        category: "",
        type: "",
        location: "",
        date: "",
        startTime: "",
        endTime: "",
        capacity: 0,
        capacityLabel: "",
        amenities: [],
    });
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [timeError, setTimeError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const bookingDataRef = useRef(bookingData);
    
    useEffect(() => {
        bookingDataRef.current = bookingData;
    }, [bookingData]);
    
    const locationOptions = useMemo(() => getLocationsFromResources(resources), [resources]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const startConversation = useCallback(() => {
        const welcomeMsg: ChatMessage = {
            id: generateMessageId(),
            text: "What would you like to book?",
            sender: "bot",
            timestamp: new Date(),
            options: [
                { label: "Facilities", value: "FACILITY", description: "Rooms, halls, labs" },
                { label: "Utilities", value: "UTILITY", description: "Equipment, AV systems" },
            ],
        };
        setMessages([welcomeMsg]);
        setCurrentStep("category");
        setBookingData({ category: "", type: "", location: "", date: "", startTime: "", endTime: "", capacity: 0, capacityLabel: "", amenities: [] });
        setSelectedAmenities([]);
        setTimeError(null);
    }, []);

    const resetConversation = useCallback(() => {
        setMessages([]);
        setCurrentStep("category");
        setBookingData({ category: "", type: "", location: "", date: "", startTime: "", endTime: "", capacity: 0, capacityLabel: "", amenities: [] });
        setSelectedAmenities([]);
        setTimeError(null);
        setTimeout(startConversation, 300);
    }, [startConversation]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            startConversation();
        }
    }, [isOpen, startConversation, messages.length]);

    useEffect(() => {
        const loadUser = async () => {
            if (onGetUser) {
                const user = await onGetUser();
                setCurrentUser(user);
            }
        };
        if (isOpen) {
            loadUser();
        }
    }, [isOpen, onGetUser]);

    const checkAvailability = useCallback(async (resourceId: string, date: string, startTime: string, endTime: string): Promise<{ isBooked: boolean; conflict?: ConflictInfo; nextAvailable?: string }> => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/resources/${resourceId}/availability?date=${date}`, { credentials: "include" });
            if (!res.ok) return { isBooked: false };
            
            const data = await res.json();
            if (!data.conflicts || data.conflicts.length === 0) return { isBooked: false };
            
            const startHour = parseInt(startTime.split(":")[0]);
            const endHour = parseInt(endTime.split(":")[0]);
            
            for (const conflict of data.conflicts) {
                const conflictStart = typeof conflict.startTime === "string" ? conflict.startTime : conflict.startTime.toString();
                const conflictEnd = typeof conflict.endTime === "string" ? conflict.endTime : conflict.endTime.toString();
                
                const conflictStartHour = parseInt(conflictStart.split(":")[0]);
                const conflictEndHour = parseInt(conflictEnd.split(":")[0]);
                
                if (startHour < conflictEndHour && endHour > conflictStartHour) {
                    let nextAvailable = null;
                    if (conflictEndHour < 20) {
                        nextAvailable = `${conflictEndHour.toString().padStart(2, "0")}:00`;
                    }
                    
                    return {
                        isBooked: true,
                        conflict: {
                            startTime: conflictStart,
                            endTime: conflictEnd,
                            purpose: conflict.purpose || "Booked"
                        },
                        nextAvailable: nextAvailable || undefined
                    };
                }
            }
            
            return { isBooked: false };
        } catch {
            return { isBooked: false };
        }
    }, []);

    const processSelection = useCallback(async (option: ChatOption) => {
        const userMsg: ChatMessage = {
            id: generateMessageId(),
            text: option.label,
            sender: "user",
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setTimeError(null);
        await new Promise(resolve => setTimeout(resolve, 600));

        const currentBookingData = bookingDataRef.current;
        let botMsg: ChatMessage;

        if (currentStep === "category") {
            setBookingData(prev => ({ ...prev, category: option.value }));
            botMsg = {
                id: generateMessageId(),
                text: "Where do you need it?",
                sender: "bot",
                timestamp: new Date(),
                isLocationPicker: true,
            };
            setCurrentStep("location");
        } 
        else if (currentStep === "location") {
            const locationVal = option.value;
            setBookingData(prev => ({ ...prev, location: locationVal }));
            
            if (currentBookingData.category === "FACILITY") {
                botMsg = {
                    id: generateMessageId(),
                    text: "What type of facility do you need?",
                    sender: "bot",
                    timestamp: new Date(),
                    isTypePicker: true,
                };
                setCurrentStep("facilityType");
            } else {
                botMsg = {
                    id: generateMessageId(),
                    text: "What type of utility do you need?",
                    sender: "bot",
                    timestamp: new Date(),
                    isUtilityTypePicker: true,
                };
                setCurrentStep("utilityType");
            }
        } 
        else if (currentStep === "facilityType") {
            setBookingData(prev => ({ ...prev, type: option.value }));
            botMsg = {
                id: generateMessageId(),
                text: "How many people will be using this facility?",
                sender: "bot",
                timestamp: new Date(),
                isCapacityPicker: true,
            };
            setCurrentStep("capacity");
        } 
        else if (currentStep === "capacity") {
            const capacityLabel = option.label;
            setBookingData(prev => ({ ...prev, capacity: parseInt(option.value), capacityLabel }));
            botMsg = {
                id: generateMessageId(),
                text: "Which amenities or equipment do you need? (Select all that apply)",
                sender: "bot",
                timestamp: new Date(),
                isAmenityPicker: true,
            };
            setCurrentStep("amenities");
        } 
        else if (currentStep === "amenities") {
            setBookingData(prev => ({ ...prev, amenities: selectedAmenities }));
            botMsg = {
                id: generateMessageId(),
                text: "What date do you need it for?",
                sender: "bot",
                timestamp: new Date(),
                isDatePicker: true,
            };
            setCurrentStep("date");
        } 
        else if (currentStep === "date") {
            const dateVal = option.value;
            setBookingData(prev => ({ ...prev, date: dateVal }));
            botMsg = {
                id: generateMessageId(),
                text: "What start time works for you?",
                sender: "bot",
                timestamp: new Date(),
                isStartTimePicker: true,
            };
            setCurrentStep("startTime");
        } 
        else if (currentStep === "startTime") {
            const startTimeVal = option.value;
            setBookingData(prev => ({ ...prev, startTime: startTimeVal }));
            botMsg = {
                id: generateMessageId(),
                text: "What end time?",
                sender: "bot",
                timestamp: new Date(),
                isEndTimePicker: true,
            };
            setCurrentStep("endTime");
        } 
        else if (currentStep === "endTime") {
            const endTimeVal = option.value;
            
            if (!validateTimeRange(currentBookingData.startTime, endTimeVal)) {
                setTimeError("End time must be later than start time.");
                setIsTyping(false);
                return;
            }
            
            setBookingData(prev => ({ ...prev, endTime: endTimeVal }));
            
            const bestMatch = currentBookingData.category === "FACILITY" 
                ? getBestFacilityMatch(resources, {
                    type: currentBookingData.type,
                    location: currentBookingData.location,
                    capacity: currentBookingData.capacity,
                    amenities: selectedAmenities,
                    date: currentBookingData.date,
                    startTime: currentBookingData.startTime,
                    endTime: endTimeVal,
                })
                : getBestUtilityMatch(resources, {
                    type: currentBookingData.type,
                    location: currentBookingData.location,
                    date: currentBookingData.date,
                    startTime: currentBookingData.startTime,
                    endTime: endTimeVal,
                });
            
            setCurrentStep("recommendation");
            
            if (!bestMatch) {
                let noMatchMessage = "";
                if (currentBookingData.category === "FACILITY" && selectedAmenities.length > 0) {
                    noMatchMessage = `No facilities match all of your selected requirements (${selectedAmenities.join(", ")}). Try removing some amenities or changing your filters. Would you like to try different options or start over?`;
                } else {
                    noMatchMessage = `I couldn't find any ${currentBookingData.category === "FACILITY" ? "facility" : "utility"} matching your requirements at this location. Would you like to try a different location or start over?`;
                }
                botMsg = {
                    id: generateMessageId(),
                    text: noMatchMessage,
                    sender: "bot",
                    timestamp: new Date(),
                    options: [
                        { label: "Start over", value: "start" },
                    ],
                };
            } else {
                const resourceId = bestMatch.id || bestMatch._id || "";
                const availability = await checkAvailability(resourceId, currentBookingData.date, currentBookingData.startTime, endTimeVal);
                
                const reason = buildRecommendationReason(bestMatch, {
                    category: currentBookingData.category,
                    type: currentBookingData.type,
                    location: currentBookingData.location,
                    capacityLabel: currentBookingData.capacityLabel,
                    amenities: selectedAmenities,
                });
                
                if (availability.isBooked) {
                    const altOption = getSameCategoryAlternatives(resources, resourceId, {
                        category: currentBookingData.category,
                        type: currentBookingData.type,
                        location: currentBookingData.location,
                        capacity: currentBookingData.capacity,
                        amenities: selectedAmenities,
                    });
                    
                    let conflictMessage = "This resource is already booked during the selected period.";
                    if (availability.conflict) {
                        conflictMessage = `This resource is already booked during the selected period. It is unavailable from ${availability.conflict.startTime} to ${availability.conflict.endTime}.`;
                        if (availability.nextAvailable) {
                            conflictMessage += ` You can book it after ${availability.nextAvailable} or choose another resource.`;
                        } else {
                            conflictMessage += " Please choose another time or select a different resource.";
                        }
                    }
                    
                    botMsg = {
                        id: generateMessageId(),
                        text: conflictMessage,
                        sender: "bot",
                        timestamp: new Date(),
                        resource: bestMatch,
                        recommendationReason: reason,
                        isBooked: true,
                        alternativeResource: altOption || undefined,
                        conflictInfo: availability.conflict,
                        nextAvailableTime: availability.nextAvailable,
                    };
                } else {
                    const missingAmenities = selectedAmenities.length > 0 && bestMatch.amenities 
                        ? selectedAmenities.filter(a => !bestMatch.amenities!.map(am => am.toLowerCase()).includes(a.toLowerCase()))
                        : [];
                    const hasAllAmenities = missingAmenities.length === 0;
                    
                    const roomHasAmenities = bestMatch.amenities 
                        ? bestMatch.amenities.join(", ") 
                        : "no specific amenities";
                    
                    let messageText = "";
                    let needsConfirmation = false;
                    
                    if (!hasAllAmenities && selectedAmenities.length > 0) {
                        needsConfirmation = true;
                        messageText = `This room only has ${roomHasAmenities}. ${missingAmenities.join(", ")} ${missingAmenities.length === 1 ? "is" : "are"} not available. Are you okay with this option?`;
                    } else {
                        messageText = "Perfect! Here's the best option for you:";
                    }
                    
                    botMsg = {
                        id: generateMessageId(),
                        text: messageText,
                        sender: "bot",
                        timestamp: new Date(),
                        resource: bestMatch,
                        recommendationReason: reason,
                        missingAmenities: missingAmenities,
                        needsConfirmation: needsConfirmation,
                        hasAllAmenities: hasAllAmenities,
                    };
                }
            }
        } 
        else if (currentStep === "utilityType") {
            setBookingData(prev => ({ ...prev, type: option.value }));
            botMsg = {
                id: generateMessageId(),
                text: "What date do you need it for?",
                sender: "bot",
                timestamp: new Date(),
                isDatePicker: true,
            };
            setCurrentStep("date");
        } 
        else if (currentStep === "recommendation") {
            if (option.value === "start") {
                resetConversation();
                setIsTyping(false);
                return;
            } else if (option.value === "confirm_continue") {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg?.resource) {
                    botMsg = {
                        id: generateMessageId(),
                        text: "Great! You can proceed with booking this room.",
                        sender: "bot",
                        timestamp: new Date(),
                        resource: lastMsg.resource,
                        hasAllAmenities: true,
                    };
                } else {
                    botMsg = {
                        id: generateMessageId(),
                        text: "Going back is not supported. Please start again to make a new request.",
                        sender: "bot",
                        timestamp: new Date(),
                        options: [{ label: "Start over", value: "start" }],
                    };
                }
            } else if (option.value === "view_alternative") {
                const lastMsg = messages[messages.length - 1];
                const altResource = lastMsg?.alternativeResource;
                if (!altResource) {
                    const alternatives = getSameCategoryAlternatives(resources, lastMsg?.resource?.id || lastMsg?.resource?._id || "", {
                        category: currentBookingData.category,
                        type: currentBookingData.type,
                        location: currentBookingData.location,
                        capacity: currentBookingData.capacity,
                        amenities: selectedAmenities,
                    });
                    if (alternatives) {
                        const reason = buildRecommendationReason(alternatives, {
                            category: currentBookingData.category,
                            type: currentBookingData.type,
                            location: currentBookingData.location,
                            capacityLabel: currentBookingData.capacityLabel,
                            amenities: selectedAmenities,
                        });
                        botMsg = {
                            id: generateMessageId(),
                            text: "Here's an alternative that's available:",
                            sender: "bot",
                            timestamp: new Date(),
                            resource: alternatives,
                            recommendationReason: reason,
                        };
                    } else {
                        botMsg = {
                            id: generateMessageId(),
                            text: "No exact match was found. Here are the closest available options. Would you like to start over or try different filters?",
                            sender: "bot",
                            timestamp: new Date(),
                            options: [{ label: "Start over", value: "start" }],
                        };
                    }
                } else {
                    const reason = buildRecommendationReason(altResource, {
                        category: currentBookingData.category,
                        type: currentBookingData.type,
                        location: currentBookingData.location,
                        capacityLabel: currentBookingData.capacityLabel,
                        amenities: selectedAmenities,
                    });
                    botMsg = {
                        id: generateMessageId(),
                        text: "Here's an alternative that's available:",
                        sender: "bot",
                        timestamp: new Date(),
                        resource: altResource,
                        recommendationReason: reason,
                    };
                }
            } else {
                botMsg = {
                    id: generateMessageId(),
                    text: "Would you like to start over or try different criteria?",
                    sender: "bot",
                    timestamp: new Date(),
                    options: [
                        { label: "Start over", value: "start" },
                    ],
                };
            }
        }
        else {
            botMsg = {
                id: generateMessageId(),
                text: "Would you like to start over or try different criteria?",
                sender: "bot",
                timestamp: new Date(),
                options: [
                    { label: "Start over", value: "start" },
                ],
            };
        }
        
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    }, [currentStep, selectedAmenities, resources, messages, resetConversation]);

    const handleDateSelect = (date: string) => {
        processSelection({ label: date, value: date });
    };

    const handleStartTimeSelect = (time: string) => {
        processSelection({ label: time, value: time });
    };

    const handleEndTimeSelect = (time: string) => {
        if (!validateTimeRange(bookingData.startTime, time)) {
            setTimeError("End time must be later than start time.");
            return;
        }
        setTimeError(null);
        processSelection({ label: time, value: time });
    };

    const formatDate = (daysFromNow: number): string => {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toISOString().split("T")[0];
    };

    const getNextSevenDays = (): ChatOption[] => {
        const options: ChatOption[] = [];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${days[date.getDay()]}, ${date.getDate()}`;
            options.push({ label, value: formatDate(i) });
        }
        return options;
    };

    const handleAmenityToggle = (amenity: string) => {
        if (selectedAmenities.includes(amenity)) {
            setSelectedAmenities(prev => prev.filter(a => a !== amenity));
        } else {
            setSelectedAmenities(prev => [...prev, amenity]);
        }
    };

    const handleViewDetails = (resource: Resource) => {
        const prefillData: PrefillData = {
            date: bookingData.date,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            capacity: bookingData.capacity,
            category: bookingData.category,
            type: bookingData.type,
            location: bookingData.location,
            amenities: bookingData.amenities,
            userId: currentUser?.id,
            userName: currentUser?.name,
            userEmail: currentUser?.email,
        };
        onViewResource(resource, bookingData, prefillData);
    };

    const handleBookNow = (resource: Resource) => {
        const prefillData: PrefillData = {
            date: bookingData.date,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            capacity: bookingData.capacity,
            category: bookingData.category,
            type: bookingData.type,
            location: bookingData.location,
            amenities: bookingData.amenities,
            userId: currentUser?.id,
            userName: currentUser?.name,
            userEmail: currentUser?.email,
        };
        onBookResource(resource, bookingData, prefillData);
    };

    const handleStartOver = () => {
        setIsTyping(true);
        setTimeout(() => {
            resetConversation();
            setIsTyping(false);
        }, 300);
    };

    const getEndTimeOptions = (): string[] => {
        if (bookingData.startTime) {
            return getValidEndTimes(bookingData.startTime);
        }
        return [];
    };

    if (!isOpen) return null;

    const isFirstMessage = messages.length === 1 && messages[0]?.sender === "bot";

    return (
        <div className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[75vh] bg-gradient-to-b from-slate-50 to-white rounded-3xl shadow-2xl border border-slate-200/60 flex flex-col overflow-hidden z-50">
            <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-100 rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm">FitFinder</h3>
                        <p className="text-xs text-slate-400">Smart facility assistant</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-transparent">
                {isFirstMessage && (
                    <div className="flex flex-col items-center justify-center py-6 mb-2">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg mb-4">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800 mb-1">Hi, I'm FitFinder 👋</h2>
                        <p className="text-sm text-slate-500 text-center px-4">I help you find the best-fit facility for your needs.</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className="animate-fade-in">
                        <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                {msg.sender === "bot" && !isFirstMessage && (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                                {msg.sender === "user" && (
                                    <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                                        <User className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                    msg.sender === "user"
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md"
                                        : "bg-white text-slate-700 rounded-bl-md border border-slate-100"
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>

                        {msg.options && msg.options.length > 0 && !msg.isStartTimePicker && !msg.isEndTimePicker && (
                            <div className="mt-3 ml-9 flex flex-wrap gap-2">
                                {msg.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => processSelection(opt)}
                                        disabled={isTyping}
                                        className="px-4 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 text-sm font-medium rounded-full transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {msg.isLocationPicker && (
                            <div className="mt-3 ml-9">
                                {locationOptions.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {locationOptions.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => processSelection(opt)}
                                                disabled={isTyping}
                                                className="text-left px-4 py-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-3 shadow-sm"
                                            >
                                                <MapPinned className="w-5 h-5 text-indigo-400" />
                                                <div>
                                                    <div className="font-medium text-slate-700">{opt.label}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400 bg-white/50 px-4 py-2 rounded-lg">No locations found. Please try again later.</div>
                                )}
                            </div>
                        )}

                        {msg.isDatePicker && (
                            <div className="mt-3 ml-9">
                                <div className="flex flex-wrap gap-2">
                                    {getNextSevenDays().map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleDateSelect(opt.value)}
                                            disabled={isTyping}
                                            className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 text-sm rounded-lg transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.isStartTimePicker && (
                            <div className="mt-3 ml-9">
                                <div className="flex flex-wrap gap-2">
                                    {TIME_SLOTS.map((time, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleStartTimeSelect(time)}
                                            disabled={isTyping}
                                            className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 text-sm rounded-lg transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.isEndTimePicker && (
                            <div className="mt-3 ml-9">
                                {timeError && (
                                    <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-500 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {timeError}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {getEndTimeOptions().map((time, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleEndTimeSelect(time)}
                                            disabled={isTyping}
                                            className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 text-sm rounded-lg transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.isCapacityPicker && (
                            <div className="mt-3 ml-9 flex flex-wrap gap-2">
                                {CAPACITY_OPTIONS.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => processSelection(opt)}
                                        disabled={isTyping}
                                        className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 text-sm rounded-lg transition-all disabled:opacity-50 shadow-sm"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {msg.isAmenityPicker && (
                            <div className="mt-3 ml-9">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {AMENITY_OPTIONS.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAmenityToggle(opt.value)}
                                            disabled={isTyping}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all disabled:opacity-50 shadow-sm ${
                                                selectedAmenities.includes(opt.value)
                                                    ? "bg-indigo-500 text-white"
                                                    : "bg-white border border-slate-200 hover:border-indigo-300 text-slate-600"
                                            }`}
                                        >
                                            {selectedAmenities.includes(opt.value) ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <Circle className="w-4 h-4" />
                                            )}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => processSelection({ label: "Continue", value: "continue" })}
                                    disabled={isTyping}
                                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium rounded-full transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                                >
                                    {selectedAmenities.length > 0 ? `Continue (${selectedAmenities.length} selected)` : "Continue without amenities"}
                                </button>
                            </div>
                        )}

                        {msg.isTypePicker && (
                            <div className="mt-3 ml-9">
                                <div className="grid grid-cols-1 gap-2">
                                    {FACILITY_TYPES.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => processSelection(opt)}
                                            disabled={isTyping}
                                            className="text-left px-4 py-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            <div className="font-medium text-slate-700">{opt.label}</div>
                                            {opt.description && (
                                                <div className="text-xs text-slate-400">{opt.description}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.isUtilityTypePicker && (
                            <div className="mt-3 ml-9">
                                <div className="grid grid-cols-1 gap-2">
                                    {UTILITY_TYPES.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => processSelection(opt)}
                                            disabled={isTyping}
                                            className="text-left px-4 py-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            <div className="font-medium text-slate-700">{opt.label}</div>
                                            {opt.description && (
                                                <div className="text-xs text-slate-400">{opt.description}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {msg.resource && (
                            <div className="mt-3 ml-9">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                                    {msg.isBooked && (
                                        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                                <span className="text-sm font-medium text-amber-700">
                                                    Already booked for your time
                                                </span>
                                            </div>
                                            {msg.conflictInfo && (
                                                <div className="text-xs text-amber-600 mb-1">
                                                    Booked: {msg.conflictInfo.startTime} - {msg.conflictInfo.endTime}
                                                </div>
                                            )}
                                            {msg.nextAvailableTime && (
                                                <div className="text-xs text-indigo-600">
                                                    Available after {msg.nextAvailableTime}. You can book then or choose another resource.
                                                </div>
                                            )}
                                            {!msg.nextAvailableTime && (
                                                <div className="text-xs text-amber-600">
                                                    Please choose another time or select a different resource.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {msg.needsConfirmation && msg.missingAmenities && msg.missingAmenities.length > 0 && (
                                        <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                                <span className="text-sm font-medium text-orange-700">
                                                    Not all amenities available
                                                </span>
                                            </div>
                                            <div className="text-xs text-orange-600">
                                                Missing: {msg.missingAmenities.join(", ")}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                                <span className="text-sm font-semibold text-indigo-600">
                                                    {msg.hasAllAmenities ? "Best option for you" : "Partial match"}
                                                </span>
                                            </div>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                msg.resource.status === "ACTIVE" 
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                                    : "bg-red-50 text-red-600 border border-red-200"
                                            }`}>
                                                {msg.resource.status === "ACTIVE" ? "Available" : msg.resource.status}
                                            </span>
                                        </div>
                                        
                                        <h4 className="text-base font-bold text-slate-800 mb-1">
                                            {msg.resource.resourceName || msg.resource.name}
                                        </h4>
                                        <div className="text-xs text-slate-400 mb-3">
                                            {formatType(msg.resource.resourceType || msg.resource.type || "")} • {msg.resource.category}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <span>{getLocationDisplay(msg.resource)}</span>
                                        </div>
                                        
                                        {msg.recommendationReason && (
                                            <div className="text-sm text-slate-500 mb-3 italic bg-slate-50 px-3 py-2 rounded-lg">
                                                &quot;{msg.recommendationReason}&quot;
                                            </div>
                                        )}
                                        
                                        <div className="space-y-2 text-sm bg-slate-50 p-3 rounded-xl">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span>{bookingData.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span>{bookingData.startTime} - {bookingData.endTime}</span>
                                            </div>
                                            {msg.resource.category === "FACILITY" && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    <span>Capacity: {msg.resource.capacity || "N/A"}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {msg.resource.description && (
                                            <div className="mt-3 text-sm text-slate-500">
                                                {msg.resource.description}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {msg.resource && (
                                    <div className="p-4 pt-0 flex gap-2 flex-col">
                                        {msg.needsConfirmation ? (
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => processSelection({ label: "Continue with this room", value: "confirm_continue" })}
                                                    className="w-full px-3 py-2.5 bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-700 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Continue Anyway
                                                </button>
                                                <button
                                                    onClick={() => processSelection({ label: "Show available alternatives", value: "view_alternative" })}
                                                    className="w-full px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                    Show Available Alternatives
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => msg.resource && handleViewDetails(msg.resource)}
                                                    className="flex-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Users className="w-4 h-4" />
                                                    Details
                                                </button>
                                                <button
                                                    onClick={() => msg.resource && handleBookNow(msg.resource)}
                                                    className="flex-1 px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                    Book Now
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    )}
                                    
                                    {msg.isBooked && msg.alternativeResource && (
                                        <div className="p-4 pt-0">
                                            <button
                                                onClick={() => processSelection({ label: "View alternative", value: "view_alternative" })}
                                                className="w-full px-3 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                                Show available alternative
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="flex items-end gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-slate-100 shadow-sm">
                                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {messages.length > 1 && (
                <div className="px-4 py-2.5 border-t border-slate-100 bg-white/80">
                    <button
                        onClick={handleStartOver}
                        disabled={isTyping}
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Start Over
                    </button>
                </div>
            )}
        </div>
    );
}
