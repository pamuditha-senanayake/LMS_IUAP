"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function FacilitiesCatalogue() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchResources = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:8080/api/facilities/resources', {
                headers: { 'Authorization': "Bearer " + token }
            });
            if (res.ok) {
                const data = await res.json();
                setResources(data);
            }
        } catch (err) {
            console.error("Failed to fetch resources", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const getInitialStartStr = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(10, 0, 0, 0);
        return d.toISOString().slice(0, 16);
    };

    const getInitialEndStr = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(12, 0, 0, 0);
        return d.toISOString().slice(0, 16);
    };

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
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">{res.resourceType}</span>
                                <span className={"text-xs font-bold px-2 py-1 rounded-md " + (res.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                                    {res.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">{res.resourceName}</h3>
                            <p className="text-sm text-slate-400 mb-4">{res.location?.campusName} - {res.location?.buildingName} (Room {res.location?.roomNumber})</p>
                            
                            {res.capacity > 0 && (
                                <div className="text-slate-300 text-sm mb-6 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Capacity: <span className="font-semibold text-white">{res.capacity}</span>
                                </div>
                            )}

                            <button 
                                onClick={async () => {
                                    const userStr = localStorage.getItem("user");
                                    if(!userStr) {
                                        Swal.fire("Error", "Please log in first", "error");
                                        return;
                                    }
                                    const user = JSON.parse(userStr);

                                    Swal.fire({
                                        title: "Book " + res.resourceName,
                                        html: `
                                            <div class="flex flex-col gap-3 text-left">
                                                <label class="text-sm font-semibold text-slate-300">Reservation Purpose</label>
                                                <input id="book-purpose" class="swal2-input !w-11/12 !mx-auto" placeholder="e.g. End of year exam">
                                                
                                                <label class="text-sm font-semibold text-slate-300">Expected Attendance</label>
                                                <input type="number" id="book-attendees" class="swal2-input !w-11/12 !mx-auto" value="${res.capacity > 0 ? res.capacity : 30}">
                                                
                                                <label class="text-sm font-semibold text-slate-300">Start Time</label>
                                                <input type="datetime-local" id="book-start" class="swal2-input !w-11/12 !mx-auto" value="${getInitialStartStr()}">
                                                
                                                <label class="text-sm font-semibold text-slate-300">End Time</label>
                                                <input type="datetime-local" id="book-end" class="swal2-input !w-11/12 !mx-auto" value="${getInitialEndStr()}">
                                            </div>
                                        `,
                                        focusConfirm: false,
                                        showCancelButton: true,
                                        confirmButtonColor: '#6366f1',
                                        cancelButtonColor: '#64748b',
                                        confirmButtonText: 'Send Request',
                                        background: '#1e293b',
                                        color: '#fff',
                                        customClass: { popup: 'swal2-dark' },
                                        preConfirm: () => {
                                            const purpose = (document.getElementById('book-purpose') as HTMLInputElement).value;
                                            const start = (document.getElementById('book-start') as HTMLInputElement).value;
                                            const end = (document.getElementById('book-end') as HTMLInputElement).value;
                                            if (!purpose || !start || !end) {
                                                Swal.showValidationMessage("All fields including timings are required");
                                                return false;
                                            }
                                            return {
                                                resourceId: res.id || res._id,
                                                purpose: purpose,
                                                expectedAttendees: parseInt((document.getElementById('book-attendees') as HTMLInputElement).value) || 0,
                                                startTime: new Date(start).toISOString(),
                                                endTime: new Date(end).toISOString(),
                                                requestedBy: { userId: user.id, name: user.name, email: user.email }
                                            };
                                        }
                                    }).then(async (result) => {
                                        if (result.isConfirmed) {
                                            try {
                                                const token = localStorage.getItem("token");
                                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                                                const resPost = await fetch(apiUrl + "/api/bookings", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                                                    body: JSON.stringify(result.value)
                                                });
                                                if (resPost.ok) {
                                                    Swal.fire({ title: "Booking Requested!", text: "Your request is pending admin approval.", icon: "success", background: '#1e293b', color: '#fff'});
                                                } else {
                                                    Swal.fire({ title: "Failed", text: await resPost.text(), icon: "error", background: '#1e293b', color: '#fff'});
                                                }
                                            } catch(e) {
                                                Swal.fire("Error", "Network processing failed", "error");
                                            }
                                        }
                                    });
                                }}
                                className="mt-auto w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors cursor-pointer outline-none active:scale-[0.98]">
                                Request Booking
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
