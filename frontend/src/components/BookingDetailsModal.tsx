"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Clock, Users, History, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface BookingHistory {
  id: string;
  oldStatus: string;
  newStatus: string;
  changedByName: string;
  changedById: string;
  note: string;
  changedAt: string;
}

interface BookingDetails {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  resourceLocation: string;
  resourceCapacity: number;
  requestedBy: {
    userId: string;
    name: string;
    email: string;
  };
  reviewedBy?: {
    userId: string;
    name: string;
    email: string;
  };
  purpose: string;
  expectedAttendees: number;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  rejectionReason?: string;
  approvedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  history: BookingHistory[];
}

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  onCancel?: () => void;
}

export default function BookingDetailsModal({ isOpen, onClose, bookingId, onCancel }: BookingDetailsModalProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBookingDetails();
    }
  }, [isOpen, bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/bookings/${bookingId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      }
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
      CANCELLED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    const icons = {
      PENDING: <AlertCircle size={14} />,
      APPROVED: <CheckCircle size={14} />,
      REJECTED: <XCircle size={14} />,
      CANCELLED: <XCircle size={14} />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.PENDING}`}>
        {icons[status as keyof typeof icons] || icons.PENDING}
        {status}
      </span>
    );
  };

  const getHistoryIcon = (newStatus: string) => {
    switch (newStatus) {
      case "APPROVED":
        return <CheckCircle size={16} className="text-emerald-400" />;
      case "REJECTED":
        return <XCircle size={16} className="text-red-400" />;
      case "CANCELLED":
        return <XCircle size={16} className="text-slate-400" />;
      default:
        return <History size={16} className="text-amber-400" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-card rounded-2xl shadow-2xl border border-border-main max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border-main bg-card">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Booking Details</h2>
            {booking && getStatusBadge(booking.status)}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
          </div>
        ) : booking ? (
          <>
            <div className="flex border-b border-border-main">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === "details"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted hover:text-foreground hover:bg-foreground/5"
                  }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === "history"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted hover:text-foreground hover:bg-foreground/5"
                  }`}
              >
                History ({booking.history?.length || 0})
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {activeTab === "details" ? (
                <div className="space-y-6">
                  {/* unchanged */}
                </div>
              ) : (
                <div className="space-y-4">
                  {booking.history && booking.history.length > 0 ? (
                    booking.history.map((entry, index) => (
                      <div key={entry.id || index} className="relative pl-8 pb-6">
                        {index !== booking.history.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-px bg-slate-700" />
                        )}
                        <div className="absolute left-0 top-1 p-1 bg-slate-800 rounded-full">
                          {getHistoryIcon(entry.newStatus)}
                        </div>
                        <div className="bg-foreground/5 border border-border-main rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-muted line-through text-xs font-bold uppercase tracking-widest">{entry.oldStatus}</span>
                              <span className="text-muted">→</span>
                              <span className="text-foreground font-black uppercase tracking-widest text-xs">{entry.newStatus}</span>
                            </div>
                            <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{formatDateTime(entry.changedAt)}</span>
                          </div>
                          <p className="text-xs text-muted font-medium">
                            Modified by <span className="text-foreground font-bold">{entry.changedByName || entry.changedById}</span>
                          </p>
                          {entry.note && (
                            <p className="text-sm text-foreground/80 mt-2 p-2 bg-foreground/5 rounded-lg border border-border-main/50 italic">
                              {`"${entry.note}"`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-8">
                      <History size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No history available</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {(booking.status === "APPROVED" || booking.status === "PENDING") && onCancel && (
              <div className="p-6 border-t border-border-main bg-card">
                <button
                  onClick={onCancel}
                  className="w-full px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98] rounded-xl"
                >
                  Cancel Booking
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <p>Failed to load booking details</p>
          </div>
        )}
      </div>
    </div>
  );
}