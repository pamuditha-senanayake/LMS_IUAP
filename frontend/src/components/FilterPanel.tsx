"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronDown, Check, SlidersHorizontal } from "lucide-react";

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterState {
    category: "ALL" | "FACILITY" | "UTILITY";
    type: string;
    status: string;
    location: string;
    capacity: string;
}

export interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    onApply: (filters: FilterState) => void;
    onReset: () => void;
    categoryOptions: FilterOption[];
    typeOptions: FilterOption[];
    statusOptions: FilterOption[];
    locationOptions: FilterOption[];
    capacityOptions: FilterOption[];
    onCategoryChange?: (category: FilterState["category"]) => void;
}

export default function FilterPanel({
    isOpen,
    onClose,
    filters,
    onApply,
    onReset,
    categoryOptions,
    typeOptions,
    statusOptions,
    locationOptions,
    capacityOptions,
    onCategoryChange,
}: FilterPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (!target.closest('[data-filter-trigger]')) {
                    onClose();
                }
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    const handleApply = useCallback(() => {
        onApply(localFilters);
        onClose();
    }, [localFilters, onApply, onClose]);

    const handleReset = useCallback(() => {
        onReset();
        setLocalFilters({
            category: "ALL",
            type: "ALL",
            status: "ALL",
            location: "ALL",
            capacity: "ALL",
        });
    }, [onReset]);

    const handleCategorySelect = useCallback((value: string) => {
        const newCategory = value as FilterState["category"];
        setLocalFilters(prev => ({
            ...prev,
            category: newCategory,
            type: "ALL",
        }));
        onCategoryChange?.(newCategory);
        setActiveDropdown(null);
    }, [onCategoryChange]);

    const handleSelect = useCallback((field: keyof FilterState, value: string) => {
        setLocalFilters(prev => ({
            ...prev,
            [field]: value,
        }));
        setActiveDropdown(null);
    }, []);

    const hasActiveFilters =
        localFilters.category !== "ALL" ||
        localFilters.type !== "ALL" ||
        localFilters.status !== "ALL" ||
        localFilters.location !== "ALL" ||
        localFilters.capacity !== "ALL";

    const activeFilterCount = [
        localFilters.category !== "ALL",
        localFilters.type !== "ALL",
        localFilters.status !== "ALL",
        localFilters.location !== "ALL",
        localFilters.capacity !== "ALL",
    ].filter(Boolean).length;

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="absolute top-full left-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-800/40">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">Filters</h3>
                    {activeFilterCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all rounded-lg"
                    aria-label="Close filters"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-3 max-h-[calc(70vh-140px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                            Category
                        </label>
                        <DropdownSelect
                            options={categoryOptions}
                            value={localFilters.category}
                            onSelect={(val) => handleCategorySelect(val)}
                            isActive={activeDropdown === "category"}
                            onToggle={() => setActiveDropdown(activeDropdown === "category" ? null : "category")}
                            placeholder="All Categories"
                            icon={<span className="w-2 h-2 rounded-full bg-indigo-400"></span>}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                            Status
                        </label>
                        <DropdownSelect
                            options={statusOptions}
                            value={localFilters.status}
                            onSelect={(val) => handleSelect("status", val)}
                            isActive={activeDropdown === "status"}
                            onToggle={() => setActiveDropdown(activeDropdown === "status" ? null : "status")}
                            placeholder="All Status"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        Type
                    </label>
                    <DropdownSelect
                        options={typeOptions}
                        value={localFilters.type}
                        onSelect={(val) => handleSelect("type", val)}
                        isActive={activeDropdown === "type"}
                        onToggle={() => setActiveDropdown(activeDropdown === "type" ? null : "type")}
                        placeholder="All Types"
                        disabled={localFilters.category === "ALL" && typeOptions.length <= 1}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                            Location
                        </label>
                        <DropdownSelect
                            options={locationOptions}
                            value={localFilters.location}
                            onSelect={(val) => handleSelect("location", val)}
                            isActive={activeDropdown === "location"}
                            onToggle={() => setActiveDropdown(activeDropdown === "location" ? null : "location")}
                            placeholder="All Locations"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                            Capacity
                        </label>
                        <DropdownSelect
                            options={capacityOptions}
                            value={localFilters.capacity}
                            onSelect={(val) => handleSelect("capacity", val)}
                            isActive={activeDropdown === "capacity"}
                            onToggle={() => setActiveDropdown(activeDropdown === "capacity" ? null : "capacity")}
                            placeholder="Any Capacity"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/40 to-slate-800/80">
                <button
                    type="button"
                    onClick={handleReset}
                    disabled={!hasActiveFilters}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 hover:text-white hover:border-slate-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Clear All
                </button>
                <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
}

interface DropdownSelectProps {
    options: FilterOption[];
    value: string;
    onSelect: (value: string) => void;
    isActive: boolean;
    onToggle: () => void;
    placeholder?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

function DropdownSelect({
    options,
    value,
    onSelect,
    isActive,
    onToggle,
    placeholder = "Select...",
    icon,
    disabled = false,
}: DropdownSelectProps) {
    const getSelectedLabel = (options: FilterOption[], value: string): string => {
        const option = options.find((opt) => opt.value === value);
        return option?.label || value.replace(/_/g, ' ');
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled}
                className={`w-full flex items-center gap-2 px-3 py-2.5 bg-slate-700/50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    disabled
                        ? 'border-slate-600/30 text-slate-500 cursor-not-allowed opacity-60'
                        : isActive
                        ? 'border-indigo-500/50 text-white'
                        : 'border-slate-600/50 text-slate-200 hover:text-white hover:border-slate-500/50'
                }`}
            >
                {icon && <span className="flex-shrink-0">{icon}</span>}
                <span className="flex-1 text-left truncate">
                    {getSelectedLabel(options, value) || placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                        isActive ? "rotate-180" : ""
                    }`}
                />
            </button>
            {isActive && !disabled && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl z-10 overflow-hidden max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    {options.length === 0 ? (
                        <div className="px-3 py-2.5 text-sm text-slate-500 text-center">
                            No options available
                        </div>
                    ) : (
                        options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onSelect(option.value)}
                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                                    value === option.value
                                        ? 'bg-indigo-500/20 text-indigo-300'
                                        : 'text-slate-200 hover:bg-slate-700/50 hover:text-white'
                                }`}
                            >
                                <span className="flex-1 text-left truncate">{option.label}</span>
                                {value === option.value && (
                                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
