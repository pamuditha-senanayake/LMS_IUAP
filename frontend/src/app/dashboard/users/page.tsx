"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { 
    Pencil, 
    Trash2, 
    RotateCw, 
    User as UserIcon, 
    Shield, 
    Mail, 
    Users, 
    Search,
    ChevronRight,
    MoreVertical
} from "lucide-react";

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/users`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                Swal.fire({
                    title: "Error",
                    text: "Failed to fetch users",
                    icon: "error",
                    background: '#1e293b',
                    color: '#fff'
                });
            }
        } catch (err) {
            Swal.fire({
                title: "Error",
                text: "Network error",
                icon: "error",
                background: '#1e293b',
                color: '#fff'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleStyles = (role: string) => {
        switch (role) {
            case "ROLE_ADMIN":
                return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "ROLE_LECTURER":
                return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "ROLE_STUDENT":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            default:
                return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
        }
    };

    const handleEdit = (user: any) => {
        Swal.fire({
            title: 'Edit User Profile',
            html: `
                <div class="flex flex-col gap-4 text-left px-2">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                        <input id="swal-input1" class="swal2-input !m-0 !w-full !bg-slate-800 !border-slate-700 !text-white !rounded-xl focus:!border-indigo-500" placeholder="Name" value="${user.name}">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                        <input id="swal-input2" class="swal2-input !m-0 !w-full !bg-slate-800 !border-slate-700 !text-white !rounded-xl focus:!border-indigo-500" placeholder="Email" value="${user.email}">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Role</label>
                        <select id="swal-input3" class="swal2-select !m-0 !w-full !bg-slate-800 !border-slate-700 !text-white !rounded-xl focus:!border-indigo-500">
                            <option value="ROLE_USER" ${user.roles?.includes('ROLE_USER') ? 'selected' : ''}>User</option>
                            <option value="ROLE_STUDENT" ${user.roles?.includes('ROLE_STUDENT') ? 'selected' : ''}>Student</option>
                            <option value="ROLE_LECTURER" ${user.roles?.includes('ROLE_LECTURER') ? 'selected' : ''}>Lecturer</option>
                            <option value="ROLE_ADMIN" ${user.roles?.includes('ROLE_ADMIN') ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Update User',
            background: '#111827',
            color: '#f1f5f9',
            customClass: {
                popup: 'rounded-3xl border border-slate-800 shadow-2xl',
                title: 'text-2xl font-bold py-6'
            },
            preConfirm: () => {
                return {
                    name: (document.getElementById('swal-input1') as HTMLInputElement).value,
                    email: (document.getElementById('swal-input2') as HTMLInputElement).value,
                    roles: [(document.getElementById('swal-input3') as HTMLSelectElement).value]
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { name, email, roles } = result.value;
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "include",
                        body: JSON.stringify({ name, email, roles })
                    });

                    if (res.ok) {
                        Swal.fire({ title: "Saved!", text: "User information updated.", icon: "success", background: '#111827', color: '#f1f5f9' });
                        fetchUsers();
                    } else {
                        const errText = await res.text();
                        Swal.fire({ title: "Error", text: errText, icon: "error", background: '#111827', color: '#f1f5f9' });
                    }
                } catch (err) {
                    Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#111827', color: '#f1f5f9' });
                }
            }
        })
    };

    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            title: 'Delete user?',
            text: `Are you sure you want to remove ${name} from the platform?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Yes, delete permanently',
            background: '#111827',
            color: '#f1f5f9',
            customClass: {
                popup: 'rounded-3xl border border-slate-800 shadow-2xl'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/users/${id}`, {
                        method: "DELETE",
                        credentials: "include"
                    });

                    if (res.ok) {
                        Swal.fire({ title: "Deleted!", text: "User has been removed.", icon: "success", background: '#111827', color: '#f1f5f9' });
                        fetchUsers();
                    } else {
                        const errText = await res.text();
                        Swal.fire({ title: "Error", text: errText, icon: "error", background: '#111827', color: '#f1f5f9' });
                    }
                } catch (err) {
                    Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#111827', color: '#f1f5f9' });
                }
            }
        });
    };

    return (
        <div className="p-6 text-slate-200 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Hero Banner Section */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-slate-800/60 shadow-2xl bg-slate-900 group/banner">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 opacity-50 transition-opacity duration-700 group-hover/banner:opacity-70" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[120px] -mr-48 -mt-48 rounded-full" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 blur-[120px] -ml-48 -mb-48 rounded-full" />
                
                <div className="relative p-8 md:p-12 flex flex-col items-center text-center space-y-8">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">
                            <Shield size={12} />
                            Administrative Console
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-4">
                            <img src="/A.png" alt="CourseFlow" className="w-12 h-12 rounded-xl border border-slate-700/50 shadow-lg" />
                            <span>Course<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Flow</span></span>
                        </h1>
                        <p className="text-slate-400 text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed mt-4">
                            Efficiently manage institution-wide access, monitor registry status, and maintain secure platform permissions from one unified platform.
                        </p>
                    </div>

                    {/* Integrated Search & Actions */}
                    <div className="w-full max-w-3xl flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full group/search">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within/search:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 group-focus-within/search:border-indigo-500/50 rounded-2xl transition-all duration-300">
                                <Search className="absolute left-5 text-slate-500 group-focus-within/search:text-indigo-400" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email or identifier..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-4 py-4 bg-transparent outline-none text-white placeholder:text-slate-600 text-sm font-medium"
                                />
                                <div className="pr-4 hidden md:flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-slate-500">⌘</kbd>
                                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-slate-500">K</kbd>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={fetchUsers}
                            disabled={loading}
                            className="shrink-0 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
                            Reload
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative glass-card rounded-3xl overflow-hidden border border-slate-700/40 shadow-2xl">
                {loading && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <RotateCw className="text-indigo-400 animate-spin" size={32} />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Synchronizing</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-900/40 border-b border-slate-800/60">
                                <th className="p-5 font-bold text-[13px] text-slate-400 uppercase tracking-widest">Identify</th>
                                <th className="p-5 font-bold text-[13px] text-slate-400 uppercase tracking-widest">Connect</th>
                                <th className="p-5 font-bold text-[13px] text-slate-400 uppercase tracking-widest">Access Rights</th>
                                <th className="p-5 font-bold text-[13px] text-slate-400 uppercase tracking-widest text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="p-6 bg-slate-800/50 rounded-full">
                                                <Users size={48} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xl font-semibold">No results found</p>
                                                <p className="text-sm">Try adjusting your search query.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-indigo-500/[0.03] transition-all duration-300">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600/30 group-hover:border-indigo-500/30 transition-colors shrink-0">
                                                    <UserIcon size={20} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-slate-200 text-base truncate group-hover:text-white transition-colors capitalize">{user.name}</span>
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">UID: {user.id.slice(-8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Mail size={14} className="text-slate-500" />
                                                    <span className="text-sm font-medium">{user.email}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 ml-5 font-bold uppercase tracking-tight">Verified Account</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="inline-flex flex-wrap gap-2">
                                                {(user.roles || ["ROLE_USER"]).map((role: string) => (
                                                    <span 
                                                        key={role} 
                                                        className={`text-[10px] font-black px-2.5 py-1 rounded-[10px] border uppercase tracking-widest ${getRoleStyles(role)}`}
                                                    >
                                                        {role.replace("ROLE_", "")}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white border border-slate-700/50 rounded-xl transition-all shadow-lg"
                                                    title="Edit Permissions"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(user.id, user.name)}
                                                    className="p-2.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700/50 hover:border-rose-500/30 rounded-xl transition-all shadow-lg"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            <div className="group-hover:hidden transition-all text-slate-600">
                                                <MoreVertical size={20} className="ml-auto" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Stats Footer */}
                {!loading && (
                    <div className="bg-slate-900/40 p-4 border-t border-slate-800/60 flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            Total Campus Entities: {filteredUsers.length}
                        </p>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                Admins: {users.filter(u => u.roles?.includes("ROLE_ADMIN")).length}
                            </span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                Users: {users.filter(u => !u.roles?.includes("ROLE_ADMIN")).length}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
