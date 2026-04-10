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
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Booking Details</h2>
            {booking && getStatusBadge(booking.status)}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "details"
                    ? "text-indigo-400 border-b-2 border-indigo-400 bg-slate-800/50"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "history"
                    ? "text-indigo-400 border-b-2 border-indigo-400 bg-slate-800/50"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                History ({booking.history?.length || 0})
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="p-6">
                {activeTab === "details" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Resource</h3>
                          <p className="text-white font-medium">{booking.resourceName || booking.resourceId}</p>
                          {booking.resourceType && <p className="text-sm text-slate-400">{booking.resourceType}</p>}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Location</h3>
                          <p className="text-white">{booking.resourceLocation || "N/A"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Capacity</h3>
                          <p className="text-white">{booking.resourceCapacity || "N/A"}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Schedule</h3>
                          <div className="flex items-center gap-2 text-white">
                            <Calendar size={16} className="text-slate-400" />
                            <span>{new Date(booking.startTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white mt-1">
                            <Clock size={16} className="text-slate-400" />
                            <span>
                              {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {" - "}
                              {new Date(booking.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Attendees</h3>
                          <div className="flex items-center gap-2 text-white">
                            <Users size={16} className="text-slate-400" />
                            <span>{booking.expectedAttendees}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Type</h3>
                          <p className="text-white">{booking.type}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-1">Purpose</h3>
                      <p className="text-white">{booking.purpose}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-800/50 rounded-xl">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Requested By</h3>
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <div>
                            <p className="text-white font-medium">{booking.requestedBy?.name || "N/A"}</p>
                            <p className="text-xs text-slate-400">{booking.requestedBy?.email}</p>
                          </div>
                        </div>
                      </div>
                      {booking.reviewedBy && (
                        <div className="p-4 bg-slate-800/50 rounded-xl">
                          <h3 className="text-sm font-medium text-slate-400 mb-2">Reviewed By</h3>
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            <div>
                              <p className="text-white font-medium">{booking.reviewedBy.name}</p>
                              <p className="text-xs text-slate-400">{booking.reviewedBy.email}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {booking.rejectionReason && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <h3 className="text-sm font-medium text-red-400 mb-1">Rejection Reason</h3>
                        <p className="text-white">{booking.rejectionReason}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <h3 className="text-slate-400 mb-1">Created</h3>
                        <p className="text-white">{formatDateTime(booking.createdAt)}</p>
                      </div>
                      {booking.approvedAt && (
                        <div>
                          <h3 className="text-slate-400 mb-1">Approved</h3>
                          <p className="text-emerald-400">{formatDateTime(booking.approvedAt)}</p>
                        </div>
                      )}
                      {booking.cancelledAt && (
                        <div>
                          <h3 className="text-slate-400 mb-1">Cancelled</h3>
                          <p className="text-slate-400">{formatDateTime(booking.cancelledAt)}</p>
                        </div>
                      )}
                      <div>
                        <h3 className="text-slate-400 mb-1">Last Updated</h3>
                        <p className="text-white">{formatDateTime(booking.updatedAt)}</p>
                      </div>
                    </div>
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
                          <div className="bg-slate-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 line-through text-sm">{entry.oldStatus}</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-white font-medium">{entry.newStatus}</span>
                              </div>
                              <span className="text-xs text-slate-500">{formatDateTime(entry.changedAt)}</span>
                            </div>
                            <p className="text-sm text-slate-400">
                              By <span className="text-white">{entry.changedByName || entry.changedById}</span>
                            </p>
                            {entry.note && (
                              <p className="text-sm text-slate-300 mt-2 p-2 bg-slate-700/50 rounded-lg">
                                {entry.note}
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
            </div>

            {booking.status === "APPROVED" && onCancel && (
              <div className="p-4 border-t border-slate-700 bg-slate-900 rounded-b-2xl flex-shrink-0">
                <button
                  onClick={onCancel}
                  className="w-full px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-xl transition-colors"
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
