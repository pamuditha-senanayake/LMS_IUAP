"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                Swal.fire("Error", "Failed to fetch users", "error");
            }
        } catch (err) {
            Swal.fire("Error", "Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user: any) => {
        Swal.fire({
            title: 'Edit User',
            html:
                `
                <div class="flex flex-col gap-3">
                    <input id="swal-input1" class="swal2-input !w-11/12 !mx-auto" placeholder="Name" value="${user.name}">
                    <input id="swal-input2" class="swal2-input !w-11/12 !mx-auto" placeholder="Email" value="${user.email}">
                    <select id="swal-input3" class="swal2-select !w-11/12 !mx-auto">
                        <option value="ROLE_USER" ${user.roles?.includes('ROLE_USER') ? 'selected' : ''}>User</option>
                        <option value="ROLE_STUDENT" ${user.roles?.includes('ROLE_STUDENT') ? 'selected' : ''}>Student</option>
                        <option value="ROLE_LECTURER" ${user.roles?.includes('ROLE_LECTURER') ? 'selected' : ''}>Lecturer</option>
                        <option value="ROLE_ADMIN" ${user.roles?.includes('ROLE_ADMIN') ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#ec4899',
            background: '#1e293b',
            color: '#fff',
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
                        Swal.fire({ title: "Saved!", icon: "success", background: '#1e293b', color: '#fff' });
                        fetchUsers();
                    } else {
                        const errText = await res.text();
                        Swal.fire({ title: "Error", text: errText, icon: "error", background: '#1e293b', color: '#fff' });
                    }
                } catch (err) {
                    Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
                }
            }
        })
    };

    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            title: `Delete ${name}?`,
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ec4899',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'Yes, delete it!',
            background: '#1e293b',
            color: '#fff',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                    const res = await fetch(`${apiUrl}/api/users/${id}`, {
                        method: "DELETE",
                        credentials: "include"
                    });

                    if (res.ok) {
                        Swal.fire({ title: "Deleted!", text: "User has been deleted.", icon: "success", background: '#1e293b', color: '#fff' });
                        fetchUsers();
                    } else {
                        const errText = await res.text();
                        Swal.fire({ title: "Error", text: errText, icon: "error", background: '#1e293b', color: '#fff' });
                    }
                } catch (err) {
                    Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
                }
            }
        });
    };

    return (
        <div className="p-6 text-white max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-500">
                    User Management
                </h1>
                <button 
                    onClick={fetchUsers}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl transition-all"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-10">Loading users...</div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-slate-700">
                                    <th className="p-4 font-semibold text-slate-300">Name</th>
                                    <th className="p-4 font-semibold text-slate-300">Email</th>
                                    <th className="p-4 font-semibold text-slate-300">Roles</th>
                                    <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-slate-400">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-slate-200">{user.name}</div>
                                            </td>
                                            <td className="p-4 text-slate-400">{user.email}</td>
                                            <td className="p-4">
                                                <div className="inline-flex flex-wrap gap-2">
                                                    {(user.roles || ["ROLE_USER"]).map((role: string) => (
                                                        <span key={role} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                            {role.replace("ROLE_", "")}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleEdit(user)}
                                                        className="px-3 py-1.5 text-sm font-medium bg-slate-700 hover:bg-indigo-500 hover:text-white text-slate-200 rounded-lg transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(user.id, user.name)}
                                                        className="px-3 py-1.5 text-sm font-medium bg-slate-700/50 hover:bg-pink-500 hover:text-white text-pink-400 border border-transparent hover:border-pink-500 rounded-lg transition-colors"
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
                </div>
            )}
        </div>
    );
}
