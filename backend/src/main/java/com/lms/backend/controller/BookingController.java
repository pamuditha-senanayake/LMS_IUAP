package com.lms.backend.controller;

import com.lms.backend.model.Booking;
import com.lms.backend.model.BookingStatusHistory;
import com.lms.backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    @Autowired
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(bookingService.getAllBookings(userId, status, sortBy, sortDir));
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody Booking booking) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(booking));
    }

    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<Booking> updateStatus(
            @PathVariable String bookingId,
            @RequestParam String status,
            @RequestParam String adminId,
            @RequestParam String adminRole,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(bookingId, status, adminId, adminRole, reason));
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<Booking> updateBooking(
            @PathVariable String bookingId,
            @RequestParam String userId,
            @RequestBody Booking booking) {
        return ResponseEntity.ok(bookingService.updateBooking(bookingId, booking, userId));
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<?> deleteBooking(@PathVariable String bookingId, @RequestParam String userId) {
        bookingService.deleteBooking(bookingId, userId);
        return ResponseEntity.ok("Booking deleted successfully");
    }

    @GetMapping("/{bookingId}/history")
    public ResponseEntity<List<BookingStatusHistory>> getBookingHistory(@PathVariable String bookingId) {
        return ResponseEntity.ok(bookingService.getBookingHistory(bookingId));
    }

    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable String bookingId,
            @RequestParam String userId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(bookingService.cancelBookingByUser(bookingId, userId, reason));
    }
}
