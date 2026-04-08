package com.lms.backend.service;

import com.lms.backend.enums.ResourceStatus;
import com.lms.backend.model.Booking;
import com.lms.backend.model.BookingStatusHistory;
import com.lms.backend.model.Resource;
import com.lms.backend.model.Notification;
import com.lms.backend.repository.BookingRepository;
import com.lms.backend.repository.BookingStatusHistoryRepository;
import com.lms.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository historyRepository;
    private final NotificationService notificationService;
    private final ResourceRepository resourceRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByRequestedByUserId(userId);
    }

    public List<Booking> getBookingsByResourceId(String resourceId) {
        return bookingRepository.findByResourceId(resourceId);
    }

    // Checking overlap correctly is critical
    public Booking createBooking(Booking booking) {
        validateBookingData(booking);

        Resource resource = resourceRepository.findById(booking.getResourceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        if (resource.getStatus() == ResourceStatus.OUT_OF_SERVICE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource is out of service");
        }

        if (hasConflict(booking.getResourceId(), booking.getStartTime(), booking.getEndTime(), null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource is already booked during this time range");
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

    public Booking updateBookingStatus(String bookingId, String newStatus, String adminId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        String oldStatus = booking.getStatus();

        if (!isValidStatus(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status. Allowed: PENDING, APPROVED, REJECTED, CANCELLED");
        }

        if ("APPROVED".equals(newStatus)) {
            validateBookingData(booking);

            if (hasConflict(booking.getResourceId(), booking.getStartTime(), booking.getEndTime(), booking.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource is already booked during this time range");
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
        Notification notif = Notification.builder()
                .recipientUserId(booking.getRequestedBy() != null ? booking.getRequestedBy().getUserId() : null)
                .createdById(adminId)
                .notificationType("BOOKING_STATUS_UPDATE")
                .title("Booking " + newStatus)
                .message("Your booking for resource " + booking.getResourceId() + " was " + newStatus + (reason != null && !reason.isEmpty() ? ". Notes: " + reason : ""))
                .relatedEntityType("BOOKING")
                .relatedEntityId(bookingId)
                .build();
        notificationService.createNotification(notif);
        
        return updatedBooking;
    }

    public Booking updateBooking(String bookingId, Booking update) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        if (!"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only update pending bookings");
        }

        booking.setPurpose(update.getPurpose());
        booking.setExpectedAttendees(update.getExpectedAttendees());
        booking.setStartTime(update.getStartTime());
        booking.setEndTime(update.getEndTime());

        validateBookingData(booking);
        
        if (hasConflict(booking.getResourceId(), booking.getStartTime(), booking.getEndTime(), bookingId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource is already booked during this time range");
        }

        booking.setPurpose(booking.getPurpose().trim());
        booking.setUpdatedAt(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }

    public void deleteBooking(String bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        historyRepository.deleteById(bookingId); // Try to clear history if bound by FK logic, but since it's mongodb just leave it or clean manually. We'll simply let it drop.
        bookingRepository.deleteById(bookingId);
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

    private boolean isValidStatus(String status) {
        return "PENDING".equals(status)
                || "APPROVED".equals(status)
                || "REJECTED".equals(status)
                || "CANCELLED".equals(status);
    }
}