"use client";

import { useState, useEffect } from "react";

export default function FacilitiesCatalogue() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data fetch, normally would call API
        // fetch('http://localhost:8080/api/facilities/resources')
        setTimeout(() => {
            setResources([
                { id: "1", type: "Lecture Hall", name: "Main Hall A", capacity: 200, location: "Computing Faculty", status: "ACTIVE" },
                { id: "2", type: "Lab", name: "Network Lab 1", capacity: 40, location: "Computing Faculty", status: "ACTIVE" },
                { id: "3", type: "Equipment", name: "Projector Pro", capacity: 0, location: "IT Store", status: "OUT_OF_SERVICE" },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-white mb-2">Facilities & Assets</h1>
            <p className="text-slate-400 mb-8">Browse and search available resources for booking.</p>

            <div className="flex gap-4 mb-8">
                <input 
                    type="text" 
                    placeholder="Search resources..." 
                    className="input-field px-4 py-3 rounded-xl flex-1 max-w-sm"
                />
                <select className="input-field px-4 py-3 rounded-xl appearance-none bg-slate-800">
                    <option>All Types</option>
                    <option>Lecture Hall</option>
                    <option>Lab</option>
                    <option>Equipment</option>
                </select>
            </div>

            {loading ? (
                <div className="flex w-full justify-center p-12">
                     <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map(res => (
                        <div key={res.id} className="glass-card p-6 rounded-2xl flex flex-col group hover:-translate-y-1 transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">{res.type}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${res.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {res.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">{res.name}</h3>
                            <p className="text-sm text-slate-400 mb-4">{res.location}</p>
                            
                            {res.capacity > 0 && (
                                <div className="text-slate-300 text-sm mb-6 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Capacity: <span className="font-semibold text-white">{res.capacity}</span>
                                </div>
                            )}

                            <button className="mt-auto w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors cursor-pointer outline-none active:scale-[0.98]">
                                Request Booking
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
