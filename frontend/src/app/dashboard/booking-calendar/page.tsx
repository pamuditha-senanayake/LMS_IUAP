"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Swal from "sweetalert2";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import { CalendarSkeleton } from "@/components/Skeleton";

interface CalendarBooking {
  id: string;
  resourceId: string;
  resourceName?: string;
  purpose: string;
  startTime: string;
  endTime: string;
  status: string;
  requestedBy?: {
    userId: string;
    name: string;
  };
}

interface PaginatedResponse {
  content: CalendarBooking[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const fetchBookings = async (page: number, size: number): Promise<PaginatedResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortBy: "startTime",
    sortDirection: "ASC",
  });
  
  const res = await fetch(`${apiUrl}/api/bookings?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
};

export default function BookingCalendarPage() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string>("");

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-bookings"],
    queryFn: () => fetchBookings(0, 1000),
    staleTime: 60 * 1000,
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

  const handleCancel = async (booking: CalendarBooking) => {
    const commonReasons = [
      'Schedule conflict',
      'No longer needed',
      'Changed plans',
      'Resource not suitable',
      'Booked by mistake',
      'Other'
    ];

    const result = await Swal.fire({
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
    });

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
          queryClient.invalidateQueries({ queryKey: ["calendar-bookings"] });
          setShowDetailsModal(false);
        } else {
          Swal.fire({ title: "Error", text: await res.text(), icon: "error", background: '#1e293b', color: '#fff' });
        }
      } catch {
        Swal.fire({ title: "Error", text: "Network Error", icon: "error", background: '#1e293b', color: '#fff' });
      }
    }
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const allBookings: CalendarBooking[] = data?.content || [];
  
  const monthBookings = allBookings.filter((b) => {
    const bookingDate = new Date(b.startTime);
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  });

  const filteredBookings = selectedResource
    ? monthBookings.filter((b) => b.resourceId === selectedResource)
    : monthBookings;

  const getBookingsForDay = (day: number) => {
    return filteredBookings.filter((b) => {
      const bookingDate = new Date(b.startTime);
      return bookingDate.getDate() === day && 
             bookingDate.getMonth() === currentMonth && 
             bookingDate.getFullYear() === currentYear;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
      case "PENDING":
        return "bg-amber-500/20 border-amber-500/50 text-amber-400";
      case "REJECTED":
        return "bg-red-500/20 border-red-500/50 text-red-400";
      default:
        return "bg-slate-500/20 border-slate-500/50 text-slate-400";
    }
  };

  const uniqueResources = Array.from(new Set(allBookings.map((b) => b.resourceId))).map((id) => {
    const booking = allBookings.find((b) => b.resourceId === id);
    return { id, name: booking?.resourceName || id };
  });

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] p-2 border border-slate-800 bg-slate-900/50" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayBookings = getBookingsForDay(day);
      const isToday = 
        day === new Date().getDate() && 
        currentMonth === new Date().getMonth() && 
        currentYear === new Date().getFullYear();

      days.push(
        <div key={day} className={`min-h-[120px] p-2 border ${isToday ? "border-indigo-500 bg-indigo-500/5" : "border-slate-800"}`}>
          <div className={`text-sm font-medium mb-2 ${isToday ? "text-indigo-400" : "text-slate-400"}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayBookings.slice(0, 3).map((booking) => (
              <button
                key={booking.id}
                onClick={() => {
                  setSelectedBookingId(booking.id);
                  setShowDetailsModal(true);
                }}
                className={`w-full text-left px-2 py-1 rounded text-xs border ${getStatusColor(booking.status)} hover:opacity-80 transition-opacity truncate`}
                title={`${booking.resourceName || booking.resourceId} - ${booking.purpose}`}
              >
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span className="truncate">
                    {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="truncate font-medium">{booking.resourceName || booking.resourceId}</div>
              </button>
            ))}
            {dayBookings.length > 3 && (
              <div className="text-xs text-slate-500 text-center">
                +{dayBookings.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-500">
          Booking Calendar
        </h1>
        <p className="text-slate-400 mt-2">View all bookings in a calendar format</p>
      </div>

      {isLoading ? (
        <CalendarSkeleton />
      ) : (
        <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={prevMonth}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={18} className="text-slate-300" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <ChevronRight size={18} className="text-slate-300" />
                  </button>
                </div>
              </div>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Resources</option>
                {uniqueResources.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-7 bg-slate-800/30">
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-slate-400 border-b border-slate-800">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>

          <div className="p-4 border-t border-slate-700 bg-slate-800/50">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
                <span className="text-slate-400">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50" />
                <span className="text-slate-400">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50" />
                <span className="text-slate-400">Rejected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <BookingDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedBookingId(null);
        }}
        bookingId={selectedBookingId}
        onCancel={() => {
          const booking = allBookings.find((b) => b.id === selectedBookingId);
          if (booking) handleCancel(booking);
        }}
      />
    </div>
  );
}
