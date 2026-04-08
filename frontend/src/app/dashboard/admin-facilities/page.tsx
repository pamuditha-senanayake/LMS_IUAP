"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function AdminFacilities() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchResources = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            console.log("Fetching from:", `${apiUrl}/api/resources`);
            const res = await fetch(`${apiUrl}/api/resources`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const transformed = data.reverse().map((r: any) => ({
                    ...r,
                    resourceName: r.resourceName || r.name,
                    resourceType: r.resourceType || r.type,
                    location: r.location || {
                        campusName: r.campusName || "",
                        buildingName: r.building || "",
                        roomNumber: r.roomNumber || ""
                    }
                }));
                setResources(transformed);
            } else {
                setError("Failed to load resources");
            }
        } catch (err) {
            console.error("Failed to fetch resources", err);
            setError("Backend not reachable. Please start server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        Swal.fire({
            title: 'Delete Resource?',
            text: `Are you sure you want to permanently delete "${name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Yes, delete',
            background: '#1e293b',
            color: '#fff',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/resources/${id}`, {
                        method: "DELETE",
                        credentials: "include"
                    });
                    if (res.ok) {
                        Swal.fire({title: "Deleted!", icon: "success", background: '#1e293b', color: '#fff'});
                        fetchResources();
                    }
                } catch(e) {}
            }
        });
    };

    const handleCreateResource = () => {
        Swal.fire({
            title: 'Register New Resource',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <label class="text-sm font-semibold text-slate-300">Target Campus</label>
                    <input id="res-campus" class="swal2-input !w-11/12 !mx-auto" placeholder="Main Campus">
                    
                    <label class="text-sm font-semibold text-slate-300">Facility Type</label>
                    <select id="res-type" class="swal2-select !w-11/12 !mx-auto text-sm">
                        <option value="Lecture Hall">Lecture Hall</option>
                        <option value="Lab">Lab</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Recreational">Recreational</option>
                    </select>

                    <label class="text-sm font-semibold text-slate-300">Name</label>
                    <input id="res-name" class="swal2-input !w-11/12 !mx-auto" placeholder="Main Hall Level 2">

                    <label class="text-sm font-semibold text-slate-300">Description</label>
                    <input id="res-desc" class="swal2-input !w-11/12 !mx-auto" placeholder="Large hall suitable for 200...">

                    <label class="text-sm font-semibold text-slate-300">Capacity</label>
                    <input type="number" id="res-capacity" class="swal2-input !w-11/12 !mx-auto" placeholder="200" value="50">

                    <label class="text-sm font-semibold text-slate-300">Initial Status</label>
                    <select id="res-status" class="swal2-select !w-11/12 !mx-auto text-sm">
                        <option value="ACTIVE" selected>ACTIVE - Ready for booking</option>
                        <option value="OUT_OF_SERVICE">OUT OF SERVICE - Under maintenance</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Deploy Facility',
            background: '#1e293b',
            color: '#fff',
            customClass: { popup: 'swal2-dark' },
            preConfirm: () => {
                const name = (document.getElementById('res-name') as HTMLInputElement).value;
                if (!name) { Swal.showValidationMessage("Facility Name is required"); return false; }
                return {
                    resourceName: name,
                    resourceType: (document.getElementById('res-type') as HTMLSelectElement).value,
                    description: (document.getElementById('res-desc') as HTMLInputElement).value,
                    capacity: parseInt((document.getElementById('res-capacity') as HTMLInputElement).value) || 0,
                    status: (document.getElementById('res-status') as HTMLSelectElement).value,
                    resourceCode: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
                    location: {
                        campusName: (document.getElementById('res-campus') as HTMLInputElement).value || "Main"
                    }
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/resources`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(result.value)
                    });
                    if (res.ok) {
                        Swal.fire({ title: "Deployed!", icon: "success", background: '#1e293b', color: '#fff' });
                        fetchResources();
                    } else {
                        Swal.fire({ title: "Failed", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
                    }
                } catch (e) {}
            }
        });
    };

    const handleToggleStatus = async (resource: any) => {
        const newStatus = resource.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
        const payload = {
            ...resource,
            status: newStatus,
            type: resource.resourceType || resource.type,
            category: resource.category || (resource.type?.startsWith("PROJECTOR") || resource.type?.startsWith("SOUND") || resource.type?.startsWith("MICROPHONE") || resource.type?.startsWith("WHITEBOARD") || resource.type?.startsWith("FLAGS") || resource.type?.startsWith("OTHER") ? "UTILITY" : "FACILITY"),
        };
        delete (payload as any).resourceType;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/resources/${resource.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            if (res.ok) fetchResources();
        } catch (e) {}
    };

    return (
        <div className="p-6 text-white max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                    Facility Management Hub
                </h1>
                <div className="flex gap-4">
                    <button 
                        onClick={fetchResources}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-sky-500 rounded-xl transition-all"
                    >
                        Refresh
                    </button>
                    <button 
                        onClick={handleCreateResource}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        + Add Facility
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-10">Syncing resources...</div>
            ) : error ? (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connection Error</h3>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button 
                        onClick={fetchResources}
                        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700">
                                <th className="p-4 font-semibold text-slate-300">Name / Spec</th>
                                <th className="p-4 font-semibold text-slate-300">Campus</th>
                                <th className="p-4 font-semibold text-slate-300">Condition</th>
                                <th className="p-4 font-semibold text-slate-300 text-right">Administrative Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resources.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">
                                        No resources registered on campus.
                                    </td>
                                </tr>
                            ) : (
                                resources.map((r) => (
                                    <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-100 flex items-center gap-2">
                                                {r.resourceName}
                                                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 rounded">{r.resourceCode}</span>
                                            </div>
                                            <div className="text-sm text-slate-400 mt-1">{r.description || 'No description attached'}</div>
                                            <div className="mt-2 text-xs text-sky-300">Type: {r.resourceType} | Cap: {r.capacity}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-300 text-sm">{r.location?.campusName || "N/A"}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold px-2 py-1 flex items-center w-max gap-1 rounded-md ${r.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'ACTIVE' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                                {r.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-3 flex-wrap">
                                                <button 
                                                    onClick={() => handleToggleStatus(r)}
                                                    className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors border border-slate-600"
                                                >
                                                    {r.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(r.id, r.resourceName)}
                                                    className="px-3 py-1.5 text-xs font-medium bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-colors border border-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
