"use client";

interface StatusBadgeProps {
    status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const getStatusConfig = (status: string) => {
        const normalized = status?.toUpperCase();
        
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            ACTIVE: { 
                bg: "bg-emerald-500/20", 
                text: "text-emerald-400", 
                label: "Active" 
            },
            MAINTENANCE: { 
                bg: "bg-amber-500/20", 
                text: "text-amber-400", 
                label: "Maintenance" 
            },
            OUT_OF_SERVICE: { 
                bg: "bg-red-500/20", 
                text: "text-red-400", 
                label: "Out of Service" 
            },
            RESERVED: { 
                bg: "bg-blue-500/20", 
                text: "text-blue-400", 
                label: "Reserved" 
            },
            AVAILABLE: { 
                bg: "bg-emerald-500/20", 
                text: "text-emerald-400", 
                label: "Available" 
            },
            BOOKED: { 
                bg: "bg-purple-500/20", 
                text: "text-purple-400", 
                label: "Booked" 
            },
            PENDING: { 
                bg: "bg-amber-500/20", 
                text: "text-amber-400", 
                label: "Pending" 
            },
            APPROVED: { 
                bg: "bg-emerald-500/20", 
                text: "text-emerald-400", 
                label: "Approved" 
            },
            REJECTED: { 
                bg: "bg-red-500/20", 
                text: "text-red-400", 
                label: "Rejected" 
            },
            CANCELLED: { 
                bg: "bg-slate-500/20", 
                text: "text-slate-400", 
                label: "Cancelled" 
            }
        };
        
        return configs[normalized] || { 
            bg: "bg-slate-500/20", 
            text: "text-slate-400", 
            label: status || "Unknown" 
        };
    };

    const config = getStatusConfig(status);

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.text.replace('text-', 'bg-')}`}></span>
            {config.label}
        </span>
    );
}
