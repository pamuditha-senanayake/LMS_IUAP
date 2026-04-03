package com.lms.backend.service;

import com.lms.backend.model.Booking;
import com.lms.backend.model.BookingStatusHistory;
import com.lms.backend.repository.BookingRepository;
import com.lms.backend.repository.BookingStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
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

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByRequestedByUserId(userId);
    }

    // Checking overlap correctly is critical
    public Booking createBooking(Booking booking) {
        List<Booking> existingBookings = bookingRepository.findByResourceId(booking.getResourceId());
        
        // Conflict checking algorithm (overlapping time ranges)
        boolean hasConflict = existingBookings.stream()
                .filter(b -> b.getStatus().equals("APPROVED") || b.getStatus().equals("PENDING"))
                .anyMatch(b -> 
                    (booking.getStartTime().isBefore(b.getEndTime()) && 
                     booking.getEndTime().isAfter(b.getStartTime()))
                );
        
        if (hasConflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource is already booked during this time range");
        }

        booking.setStatus("PENDING");
        return bookingRepository.save(booking);
    }

    public Booking updateBookingStatus(String bookingId, String newStatus, String adminId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        String oldStatus = booking.getStatus();
        booking.setStatus(newStatus);
        if ("REJECTED".equals(newStatus)) {
            booking.setRejectionReason(reason);
        } else if ("APPROVED".equals(newStatus)) {
            booking.setApprovedAt(LocalDateTime.now());
        } else if ("CANCELLED".equals(newStatus)) {
            booking.setCancelledAt(LocalDateTime.now());
        }
        
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
        
        if (!booking.getStartTime().equals(update.getStartTime()) || !booking.getEndTime().equals(update.getEndTime())) {
            List<Booking> existingBookings = bookingRepository.findByResourceId(booking.getResourceId());
            boolean hasConflict = existingBookings.stream()
                    .filter(b -> !b.getId().equals(bookingId))
                    .filter(b -> b.getStatus().equals("APPROVED") || b.getStatus().equals("PENDING"))
                    .anyMatch(b -> 
                        (update.getStartTime().isBefore(b.getEndTime()) && 
                         update.getEndTime().isAfter(b.getStartTime()))
                    );
            if (hasConflict) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource is already booked during this time range");
            }
        }

        booking.setPurpose(update.getPurpose());
        booking.setExpectedAttendees(update.getExpectedAttendees());
        booking.setStartTime(update.getStartTime());
        booking.setEndTime(update.getEndTime());
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
}
