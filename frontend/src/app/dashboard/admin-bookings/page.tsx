"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Calendar, User, MapPin, Ban } from "lucide-react";
import Swal from "sweetalert2";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import { TableSkeleton, StatsSkeleton } from "@/components/Skeleton";

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

interface BookingStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

interface PaginatedResponse {
  content: Booking[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const fetchBookings = async (page: number, size: number, status: string, resourceId: string): Promise<PaginatedResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortBy: "createdAt",
    sortDirection: "DESC",
  });
  if (status) params.append("status", status);
  if (resourceId) params.append("resourceId", resourceId);
  
  const res = await fetch(`${apiUrl}/api/bookings?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
};

const fetchStats = async (): Promise<BookingStats> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const res = await fetch(`${apiUrl}/api/bookings/stats`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    resourceId: "",
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["booking-stats"],
    queryFn: fetchStats,
    staleTime: 60 * 1000,
  });

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-bookings", page, filters.status, filters.resourceId],
    queryFn: () => fetchBookings(page, 100, filters.status, filters.resourceId),
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

  const handleApprove = useCallback((id: string, name: string) => {
    Swal.fire({
      title: `Approve booking for ${name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Approve',
      background: '#1e293b',
      color: '#fff',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const url = new URL(`${apiUrl}/api/bookings/${id}/status`);
          url.searchParams.append("status", "APPROVED");
          url.searchParams.append("adminId", currentUser?.id || "N/A");
          url.searchParams.append("reason", "Approved by admin");

          const res = await fetch(url.toString(), {
            method: "PATCH",
            credentials: "include"
          });

          if (res.ok) {
            Swal.fire({ title: "Success!", icon: "success", background: '#1e293b', color: '#fff' });
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["booking-stats"] });
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [queryClient, currentUser]);

  const handleReject = useCallback((id: string, name: string) => {
    Swal.fire({
      title: `Reject booking for ${name}?`,
      input: 'textarea',
      inputPlaceholder: 'Reason for rejection...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Reject',
      background: '#1e293b',
      color: '#fff',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
          const url = new URL(`${apiUrl}/api/bookings/${id}/status`);
          url.searchParams.append("status", "REJECTED");
          url.searchParams.append("adminId", currentUser?.id || "N/A");
          url.searchParams.append("reason", result.value || "Rejected by admin");

          const res = await fetch(url.toString(), {
            method: "PATCH",
            credentials: "include"
          });

          if (res.ok) {
            Swal.fire({ title: "Success!", icon: "success", background: '#1e293b', color: '#fff' });
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["booking-stats"] });
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [queryClient, currentUser]);

  const handleCancelAdmin = useCallback((id: string, name: string) => {
    const commonReasons = [
      'Resource unavailable due to maintenance',
      'Scheduling conflict with university event',
      'Double booking detected',
      'Resource capacity exceeded',
      'Incorrect booking details',
      'Safety or security concern',
      'Other'
    ];

    Swal.fire({
      title: `Cancel booking for ${name}?`,
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
          const url = new URL(`${apiUrl}/api/bookings/${id}/cancel`);
          url.searchParams.append("userId", currentUser?.id || "admin");
          url.searchParams.append("reason", result.value);

          const res = await fetch(url.toString(), {
            method: "POST",
            credentials: "include"
          });

          if (res.ok) {
            Swal.fire({ title: "Cancelled!", icon: "success", background: '#1e293b', color: '#fff' });
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["booking-stats"] });
          } else {
            Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
          }
        } catch {
          Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
        }
      }
    });
  }, [queryClient, currentUser]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
      CANCELLED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  const stats = statsData || { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  const bookings = data?.content || [];
  const filteredBookings = debouncedSearch
    ? bookings.filter((b) =>
        b.purpose.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.requestedBy?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.requestedBy?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.resourceName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.resourceId.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : bookings;

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
          Admin Bookings
        </h1>
        <button 
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["booking-stats"] });
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-xl transition-all flex items-center gap-2"
        >
          <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {statsLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4 border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">Total Bookings</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="glass-card rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
            <div className="text-sm text-amber-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          </div>
          <div className="glass-card rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
            <div className="text-sm text-emerald-400 mb-1">Approved</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.approved}</div>
          </div>
          <div className="glass-card rounded-xl p-4 border border-red-500/20 bg-red-500/5">
            <div className="text-sm text-red-400 mb-1">Rejected</div>
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
          </div>
          <div className="glass-card rounded-xl p-4 border border-slate-500/20 bg-slate-500/5">
            <div className="text-sm text-slate-400 mb-1">Cancelled</div>
            <div className="text-2xl font-bold text-slate-400">{stats.cancelled}</div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 mb-6 border border-slate-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by user, resource, or purpose..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(0); }}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
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
                    <th className="p-4 font-semibold text-slate-300">Requester</th>
                    <th className="p-4 font-semibold text-slate-300">Resource</th>
                    <th className="p-4 font-semibold text-slate-300">Purpose</th>
                    <th className="p-4 font-semibold text-slate-300">Schedule</th>
                    <th className="p-4 font-semibold text-slate-300">Status</th>
                    <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                        <p>No bookings found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            <div>
                              <div className="font-medium text-slate-200">{b.requestedBy?.name || 'N/A'}</div>
                              <div className="text-xs text-slate-400">{b.requestedBy?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-400" />
                            <div>
                              <div className="font-medium text-slate-200">{b.resourceName || b.resourceId}</div>
                              <div className="text-xs text-slate-400">{b.resourceType}</div>
                            </div>
                          </div>
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
                              onClick={() => { setSelectedBookingId(b.id); setShowDetailsModal(true); }}
                              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {b.status === "PENDING" && (
                              <>
                                <button 
                                  onClick={() => handleApprove(b.id, b.requestedBy?.name || "User")}
                                  className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button 
                                  onClick={() => handleReject(b.id, b.requestedBy?.name || "User")}
                                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            {b.status === "APPROVED" && (
                              <button 
                                onClick={() => handleCancelAdmin(b.id, b.requestedBy?.name || "User")}
                                className="p-2 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors"
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
                  disabled={data.page === 0}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.page >= data.totalPages - 1}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <BookingDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedBookingId(null); }}
        bookingId={selectedBookingId}
      />
    </div>
  );
}
