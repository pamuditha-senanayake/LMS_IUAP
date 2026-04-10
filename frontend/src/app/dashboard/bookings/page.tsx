"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Calendar, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Eye, Trash2, Edit, Ban } from "lucide-react";
import Swal from "sweetalert2";
import BookingModal from "@/components/BookingModal";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import { TableSkeleton } from "@/components/Skeleton";

interface Booking {
  id: string;
  resourceId: string;
  resourceName?: string;
  resourceType?: string;
  resourceLocation?: string;
  purpose: string;
  expectedAttendees: number;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  rejectionReason?: string;
  requestedBy?: {
    userId: string;
    name: string;
    email: string;
  };
}

interface PaginatedResponse {
  content: Booking[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
}

const fetchBookings = async (userId: string, page: number, size: number, sortBy: string, sortDir: string, status: string, type: string): Promise<PaginatedResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortBy,
    sortDirection: sortDir,
  });
  if (status) params.append("status", status);
  if (type) params.append("type", type);
  
  const res = await fetch(`${apiUrl}/api/bookings?userId=${userId}&${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
};

export default function MyBookings() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
  });
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", currentUser?.id, page, filters.status, filters.type, sortOrder],
    queryFn: () => fetchBookings(
      currentUser?.id || "",
      page,
      10,
      "createdAt",
      sortOrder === "newest" ? "DESC" : "ASC",
      filters.status,
      filters.type
    ),
    enabled: !!currentUser?.id,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/auth/me`, { credentials: "include" });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
        }
      } catch {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleDelete = useCallback((booking: Booking) => {
    Swal.fire({
      title: "Delete booking request?",
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ec4899',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Delete!',
      background: '#1e293b',
      color: '#fff',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const res = await fetch(`${apiUrl}/api/bookings/${booking.id}`, {
            method: "DELETE",
            credentials: "include"
          });

          if (res.ok) {
            Swal.fire({ title: "Deleted!", icon: "success", background: '#1e293b', color: '#fff' });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [queryClient]);

  const handleCancel = useCallback((booking: Booking) => {
    const commonReasons = [
      'Schedule conflict',
      'No longer needed',
      'Changed plans',
      'Resource not suitable',
      'Booked by mistake',
      'Other'
    ];

    Swal.fire({
      title: "Cancel this booking?",
      html: `
        <div style="text-align: left; color: #94a3b8;">
          <label for="cancel-reason" style="display: block; margin-bottom: 8px; font-size: 14px;">Select a reason for cancellation:</label>
          <select id="cancel-reason" style="width: 100%; padding: 10px; border-radius: 8px; background: #1e293b; color: white; border: 1px solid #475569; margin-bottom: 16px;">
            <option value="">-- Select Reason --</option>
            ${commonReasons.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
          <div id="other-reason-container" style="display: none;">
            <label for="other-reason" style="display: block; margin-bottom: 8px; font-size: 14px;">Please specify:</label>
            <textarea id="other-reason" rows="3" style="width: 100%; padding: 10px; border-radius: 8px; background: #1e293b; color: white; border: 1px solid #475569; resize: none;" placeholder="Enter the reason..."></textarea>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Cancel Booking',
      background: '#1e293b',
      color: '#fff',
      didOpen: () => {
        const reasonSelect = document.getElementById('cancel-reason') as HTMLSelectElement;
        const otherContainer = document.getElementById('other-reason-container');
        
        reasonSelect?.addEventListener('change', () => {
          if (otherContainer) {
            otherContainer.style.display = reasonSelect.value === 'Other' ? 'block' : 'none';
          }
        });
      },
      preConfirm: () => {
        const reasonSelect = document.getElementById('cancel-reason') as HTMLSelectElement;
        const otherReason = document.getElementById('other-reason') as HTMLTextAreaElement;
        
        if (!reasonSelect?.value) {
          Swal.showValidationMessage('Please select a reason');
          return false;
        }
        
        if (reasonSelect.value === 'Other' && !otherReason?.value.trim()) {
          Swal.showValidationMessage('Please specify the reason');
          return false;
        }
        
        return reasonSelect.value === 'Other' ? otherReason?.value.trim() : reasonSelect.value;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const url = new URL(`${apiUrl}/api/bookings/${booking.id}/cancel`);
          url.searchParams.append("userId", currentUser?.id || "");
          url.searchParams.append("reason", result.value);
          
          const res = await fetch(url.toString(), {
            method: "POST",
            credentials: "include"
          });

          if (res.ok) {
            Swal.fire({ title: "Cancelled!", icon: "success", background: '#1e293b', color: '#fff' });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            setShowDetailsModal(false);
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [currentUser, queryClient]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
      CANCELLED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.PENDING}`}>
        {status === "PENDING" && <AlertCircle size={12} />}
        {status === "APPROVED" && <CheckCircle size={12} />}
        {status === "REJECTED" && <XCircle size={12} />}
        {status === "CANCELLED" && <XCircle size={12} />}
        {status}
      </span>
    );
  };

  const bookings = data?.content || [];
  const filteredBookings = debouncedSearch
    ? bookings.filter((b) =>
        b.purpose.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.resourceName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.resourceId.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : bookings;

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-500">
          My Bookings
        </h1>
        <button 
          onClick={() => {
            setEditBooking(null);
            setShowModal(true);
          }}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 shadow-lg shadow-indigo-500/25 rounded-xl font-semibold transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Request Booking
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4 mb-6 border border-slate-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(0); }}
              className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(0); }}
              className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="FACILITY">Facility</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="LAB">Lab</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value as "newest" | "oldest"); setPage(0); }}
              className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <div className="text-center py-20 text-slate-400">
          <p>Failed to load bookings. Please try again.</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-700">
                    <th className="p-4 font-semibold text-slate-300">Resource</th>
                    <th className="p-4 font-semibold text-slate-300">Purpose</th>
                    <th className="p-4 font-semibold text-slate-300">Date & Time</th>
                    <th className="p-4 font-semibold text-slate-300">Status</th>
                    <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                        <p>No bookings found</p>
                        <p className="text-sm mt-1">Create your first booking request</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-200">{b.resourceName || b.resourceId}</div>
                          <div className="text-xs text-slate-400">{b.resourceType} - {b.type}</div>
                        </td>
                        <td className="p-4 text-slate-400">
                          <div className="max-w-[200px] truncate" title={b.purpose}>{b.purpose}</div>
                          <div className="text-xs">Attendees: {b.expectedAttendees}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          <div>{new Date(b.startTime).toLocaleDateString()}</div>
                          <div className="text-xs">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - 
                            {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(b.status)}
                          {b.status === "REJECTED" && b.rejectionReason && (
                            <div className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={b.rejectionReason}>
                              {b.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setSelectedBooking(b.id); setShowDetailsModal(true); }}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {b.status === "PENDING" && (
                              <>
                                <button 
                                  onClick={() => { setEditBooking(b); setShowModal(true); }}
                                  className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(b)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                            {b.status === "APPROVED" && (
                              <button 
                                onClick={() => handleCancel(b)}
                                className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-all"
                                title="Cancel Booking"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-slate-400">
                Page {data.page + 1} of {data.totalPages} ({data.totalElements} bookings)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.first}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.last}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <BookingModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditBooking(null); }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["bookings"] })}
        editBooking={editBooking}
      />

      <BookingDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedBooking(null); }}
        bookingId={selectedBooking}
        onCancel={() => {
          const booking = bookings.find((b) => b.id === selectedBooking);
          if (booking) handleCancel(booking);
        }}
      />
    </div>
  );
}
