"use client";

import { useState, useEffect } from "react";

export default function TicketingPage() {
    const [tickets, setTickets] = useState<any[]>([]);

    useEffect(() => {
        setTimeout(() => {
            setTickets([
                { id: "T-1001", title: "Projector not turning on", resource: "Main Hall A", priority: "HIGH", status: "OPEN" },
                { id: "T-1002", title: "Network port dead", resource: "Network Lab 1", priority: "MEDIUM", status: "IN_PROGRESS" },
            ]);
        }, 600);
    }, []);

    const getStatusColor = (status: string) => {
        if (status === 'OPEN') return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
        if (status === 'IN_PROGRESS') return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
        if (status === 'RESOLVED') return 'border-green-500/50 bg-green-500/10 text-green-400';
        return 'border-slate-500/50 bg-slate-500/10 text-slate-400';
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Incident Ticketing</h1>
                    <p className="text-slate-400">Report facility issues and track repair progress.</p>
                </div>
                <button className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium px-6 py-3 transition-all active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                    Report Issue
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.map(ticket => (
                    <div key={ticket.id} className="glass-card p-6 rounded-2xl border-l-4 group" style={{ borderLeftColor: ticket.priority === 'HIGH' ? '#f43f5e' : '#3b82f6' }}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-semibold text-slate-400">{ticket.id}</span>
                            <span className={`px-2 py-1 text-xs font-bold rounded border ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace("_", " ")}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">{ticket.title}</h3>
                        <div className="text-slate-400 text-sm flex gap-4">
                            <span>Resource: {ticket.resource}</span>
                            <span>Priority: <span className={ticket.priority === 'HIGH' ? 'text-red-400 font-semibold' : 'text-slate-300'}>{ticket.priority}</span></span>
                        </div>
                        <button className="mt-6 text-sm font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors flex items-center gap-2">
                            View Details 
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
