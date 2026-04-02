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

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingStatusHistoryRepository historyRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByRequestedById(userId);
    }

    // Checking overlap correctly is critical
    public Booking createBooking(Booking booking) {
        List<Booking> existingBookings = bookingRepository.findByResourceId(booking.getResourceId());
        
        // Conflict checking algorithm (overlapping time ranges)
        boolean hasConflict = existingBookings.stream()
                .filter(b -> b.getStatus().equals("APPROVED") || b.getStatus().equals("PENDING"))
                .anyMatch(b -> 
                    (booking.getStartDatetime().isBefore(b.getEndDatetime()) && 
                     booking.getEndDatetime().isAfter(b.getStartDatetime()))
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
        
        return updatedBooking;
    }
}
