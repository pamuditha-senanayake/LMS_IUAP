package com.lms.backend.service;

import com.lms.backend.exception.BookingConflictException;
import com.lms.backend.model.Booking;
import com.lms.backend.model.BookingStatusHistory;
import com.lms.backend.repository.BookingRepository;
import com.lms.backend.repository.BookingStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import com.lms.backend.model.Notification;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final NotificationService notificationService;

    public List<Booking> getAllBookings(String userId, String status, String sortBy, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = validateSortBy(sortBy);
        Sort sort = Sort.by(direction, sortField);
        
        if (userId != null && !userId.isEmpty()) {
            if (status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status)) {
                return bookingRepository.findByRequestedByUserIdAndStatus(userId, status.toUpperCase(), sort);
            }
            return bookingRepository.findByRequestedByUserId(userId, sort);
        }
        
        if (status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status)) {
            return bookingRepository.findByStatus(status.toUpperCase(), sort);
        }
        
        return bookingRepository.findAll(sort);
    }

    public List<Booking> getUserBookings(String userId, String status, String sortBy, String sortDir) {
        return getAllBookings(userId, status, sortBy, sortDir);
    }

    private String validateSortBy(String sortBy) {
        if (sortBy == null || sortBy.isEmpty()) {
            return "createdAt";
        }
        switch (sortBy.toLowerCase()) {
            case "starttime":
                return "startTime";
            case "endtime":
                return "endTime";
            case "status":
                return "status";
            case "createdat":
                return "createdAt";
            case "updatedat":
                return "updatedAt";
            default:
                return "createdAt";
        }
    }

    // Checking overlap correctly is critical
    public Booking createBooking(Booking booking) {
        validateBookingData(booking);

        Booking conflicting = findConflictingBooking(booking.getResourceId(), booking.getStartTime(), booking.getEndTime(), null);
        if (conflicting != null) {
            String message = String.format(
                "Resource is already booked during this time range. The resource will be available from %s",
                conflicting.getEndTime().toString()
            );
            throw new BookingConflictException(
                message,
                conflicting.getId(),
                conflicting.getStartTime().toString(),
                conflicting.getEndTime().toString()
            );
        }

        // Set timestamps properly
        LocalDateTime now = LocalDateTime.now();
        booking.setResourceId(booking.getResourceId().trim());
        booking.setPurpose(booking.getPurpose().trim());
        booking.setCreatedAt(now);
        booking.setUpdatedAt(now);

        // Set status
        booking.setStatus("PENDING");
        
        return bookingRepository.save(booking);
    }

    public Booking updateBookingStatus(String bookingId, String newStatus, String adminId, String adminRole, String reason) {
        // Authorization: Only ADMIN can approve/reject/cancel
        // adminRole comes as "ROLE_ADMIN" from frontend
        boolean isAdmin = adminRole != null && (
            "ADMIN".equalsIgnoreCase(adminRole) || 
            adminRole.contains("ADMIN") || 
            adminRole.contains("ROLE_ADMIN")
        );
        
        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can approve, reject, or cancel bookings");
        }
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        String oldStatus = booking.getStatus();
        if (oldStatus == null) {
            oldStatus = "PENDING"; // Default to PENDING for new bookings
        }

        if (!isValidStatus(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status. Allowed: PENDING, APPROVED, REJECTED, CANCELLED");
        }

        // Validate status transitions
        validateStatusTransition(oldStatus, newStatus);

        if ("APPROVED".equals(newStatus)) {
            validateBookingData(booking);

            Booking conflicting = findConflictingBooking(booking.getResourceId(), booking.getStartTime(), booking.getEndTime(), booking.getId());
            if (conflicting != null) {
                String message = String.format(
                    "Resource is already booked during this time range. The resource will be available from %s",
                    conflicting.getEndTime().toString()
                );
                throw new BookingConflictException(
                    message,
                    conflicting.getId(),
                    conflicting.getStartTime().toString(),
                    conflicting.getEndTime().toString()
                );
            }

            booking.setApprovedAt(LocalDateTime.now());
            booking.setRejectionReason(null);
        } else if ("REJECTED".equals(newStatus)) {
            booking.setRejectionReason(reason);
        } else if ("CANCELLED".equals(newStatus)) {
            booking.setCancelledAt(LocalDateTime.now());
        }

        booking.setStatus(newStatus);
        booking.setUpdatedAt(LocalDateTime.now());
        
        Booking updatedBooking = bookingRepository.save(booking);
        
        // Create history record
        BookingStatusHistory history = BookingStatusHistory.builder()
                .bookingId(bookingId)
                .changedById(adminId)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .note(reason)
                .build();
        historyRepository.save(history);
        
        // Trigger notification
        String notificationMessage = buildNotificationMessage(booking, newStatus, reason);
        Notification notif = Notification.builder()
                .recipientUserId(booking.getRequestedBy() != null ? booking.getRequestedBy().getUserId() : null)
                .createdById(adminId)
                .notificationType("BOOKING_STATUS_UPDATE")
                .title("Booking " + newStatus)
                .message(notificationMessage)
                .relatedEntityType("BOOKING")
                .relatedEntityId(bookingId)
                .build();
        notificationService.createNotification(notif);
        
        return updatedBooking;
    }

    public Booking updateBooking(String bookingId, Booking update, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        // IDOR Protection: Verify ownership
        if (booking.getRequestedBy() == null || !booking.getRequestedBy().getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own bookings");
        }
        
        if (!"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only update pending bookings");
        }

        booking.setPurpose(update.getPurpose());
        booking.setExpectedAttendees(update.getExpectedAttendees());
        booking.setStartTime(update.getStartTime());
        booking.setEndTime(update.getEndTime());

        validateBookingData(booking);
        
        Booking conflicting = findConflictingBooking(booking.getResourceId(), booking.getStartTime(), booking.getEndTime(), bookingId);
        if (conflicting != null) {
            String message = String.format(
                "Resource is already booked during this time range. The resource will be available from %s",
                conflicting.getEndTime().toString()
            );
            throw new BookingConflictException(
                message,
                conflicting.getId(),
                conflicting.getStartTime().toString(),
                conflicting.getEndTime().toString()
            );
        }

        booking.setPurpose(booking.getPurpose().trim());
        booking.setUpdatedAt(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }

    public void deleteBooking(String bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        // IDOR Protection: Verify ownership
        if (booking.getRequestedBy() == null || !booking.getRequestedBy().getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own bookings");
        }
        
        // Only allow delete if PENDING
        if (!"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only delete pending bookings");
        }
        
        historyRepository.deleteById(bookingId);
        bookingRepository.deleteById(bookingId);
    }

    public List<BookingStatusHistory> getBookingHistory(String bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        return historyRepository.findByBookingIdOrderByChangedAtAsc(bookingId);
    }

    private void validateBookingData(Booking booking) {
        // Validate required fields
        if (booking == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking request must not be null");
        }
        if (booking.getResourceId() == null || booking.getResourceId().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource ID must not be empty");
        }
        if (booking.getStartTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must not be null");
        }
        if (booking.getEndTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must not be null");
        }
        if (booking.getPurpose() == null || booking.getPurpose().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Purpose must not be empty");
        }
        if (booking.getExpectedAttendees() != null && booking.getExpectedAttendees() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected attendees must not be negative");
        }

        // Validate time logic
        if (!booking.getStartTime().isBefore(booking.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time");
        }
    }

    private boolean hasConflict(String resourceId, LocalDateTime startTime, LocalDateTime endTime, String excludeBookingId) {
        List<Booking> existingBookings = bookingRepository.findByResourceId(resourceId);

        // Conflict checking algorithm (overlapping time ranges)
        return existingBookings.stream()
                .filter(b -> excludeBookingId == null || !b.getId().equals(excludeBookingId))
                .filter(b -> "APPROVED".equals(b.getStatus()) || "PENDING".equals(b.getStatus()))
                .anyMatch(b ->
                        startTime.isBefore(b.getEndTime()) &&
                        endTime.isAfter(b.getStartTime())
                );
    }
    
    private Booking findConflictingBooking(String resourceId, LocalDateTime startTime, LocalDateTime endTime, String excludeBookingId) {
        List<Booking> existingBookings = bookingRepository.findByResourceId(resourceId);

        return existingBookings.stream()
                .filter(b -> excludeBookingId == null || !b.getId().equals(excludeBookingId))
                .filter(b -> "APPROVED".equals(b.getStatus()) || "PENDING".equals(b.getStatus()))
                .filter(b ->
                        startTime.isBefore(b.getEndTime()) &&
                        endTime.isAfter(b.getStartTime())
                )
                .findFirst()
                .orElse(null);
    }

    private boolean isValidStatus(String status) {
        return "PENDING".equals(status)
                || "APPROVED".equals(status)
                || "REJECTED".equals(status)
                || "CANCELLED".equals(status);
    }

    private void validateStatusTransition(String oldStatus, String newStatus) {
        if (oldStatus == null || "PENDING".equals(oldStatus)) {
            // From PENDING (or null), can go to: APPROVED, REJECTED, CANCELLED
            if ("APPROVED".equals(newStatus) || "REJECTED".equals(newStatus) || "CANCELLED".equals(newStatus)) {
                return;
            }
        } else if ("APPROVED".equals(oldStatus)) {
            // From APPROVED, can only go to CANCELLED
            if ("CANCELLED".equals(newStatus)) {
                return;
            }
        } else if ("REJECTED".equals(oldStatus)) {
            // From REJECTED, cannot change (terminal state)
        } else if ("CANCELLED".equals(oldStatus)) {
            // From CANCELLED, cannot change (terminal state)
        }
        
        // Invalid transition
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid status transition from " + oldStatus + " to " + newStatus + 
                ". Allowed transitions: PENDING→APPROVED, PENDING→REJECTED, PENDING→CANCELLED, APPROVED→CANCELLED");
    }
    
    private String buildNotificationMessage(Booking booking, String status, String reason) {
        StringBuilder message = new StringBuilder();
        
        message.append("Your booking for ");
        
        // Try to get resource name if available
        String resourceInfo = booking.getResourceId();
        message.append(resourceInfo);
        
        message.append(" has been ").append(status.toLowerCase()).append(".\n\n");
        message.append("Booking Details:\n");
        message.append("- Purpose: ").append(booking.getPurpose()).append("\n");
        message.append("- Start Time: ").append(formatDateTime(booking.getStartTime())).append("\n");
        message.append("- End Time: ").append(formatDateTime(booking.getEndTime())).append("\n");
        message.append("- Expected Attendees: ").append(booking.getExpectedAttendees()).append("\n");
        
        if ("APPROVED".equals(status)) {
            message.append("\n✅ Your booking is confirmed!");
        } else if ("REJECTED".equals(status)) {
            message.append("\n❌ Your booking was not approved.");
            if (reason != null && !reason.isEmpty()) {
                message.append("\nReason: ").append(reason);
            }
            message.append("\nPlease check the resource availability and submit a new request if needed.");
        } else if ("CANCELLED".equals(status)) {
            message.append("\n⚠️ Your booking has been cancelled.");
        }
        
        return message.toString();
    }
    
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "N/A";
        }
        return dateTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm"));
    }
}