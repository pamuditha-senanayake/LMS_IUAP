package com.lms.backend.service;

import com.lms.backend.exception.BookingConflictException;
import com.lms.backend.model.Booking;
import com.lms.backend.model.BookingStatusHistory;
import com.lms.backend.repository.BookingRepository;
import com.lms.backend.repository.BookingStatusHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingStatusHistoryRepository historyRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    private Booking sampleBooking;

    @BeforeEach
    void setUp() {
        sampleBooking = Booking.builder()
            .id("test-id")
            .resourceId("resource-1")
            .purpose("Test Purpose")
            .startTime(LocalDateTime.now().plusDays(1))
            .endTime(LocalDateTime.now().plusDays(1).plusHours(2))
            .expectedAttendees(10)
            .status("PENDING")
            .build();
        
        Booking.BookingUserSummary userSummary = new Booking.BookingUserSummary();
        userSummary.setUserId("user-123");
        userSummary.setName("Test User");
        userSummary.setEmail("test@example.com");
        sampleBooking.setRequestedBy(userSummary);
    }

    // ==================== CREATE BOOKING TESTS ====================

    @Test
    void createBooking_Successfully() {
        when(bookingRepository.findByResourceId(anyString())).thenReturn(new ArrayList<>());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId("new-id");
            return b;
        });

        Booking created = bookingService.createBooking(sampleBooking);

        assertNotNull(created);
        assertEquals("PENDING", created.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    void createBooking_ThrowsConflict_WhenOverlapExists() {
        Booking existingBooking = Booking.builder()
            .id("existing-id")
            .status("APPROVED")
            .startTime(sampleBooking.getStartTime())
            .endTime(sampleBooking.getEndTime())
            .build();

        when(bookingRepository.findByResourceId(anyString())).thenReturn(List.of(existingBooking));

        assertThrows(BookingConflictException.class, () -> {
            bookingService.createBooking(sampleBooking);
        });
    }

    @Test
    void validateBookingData_ThrowsException_WhenTimeInvalid() {
        Booking invalidBooking = Booking.builder()
            .resourceId("resource-1")
            .purpose("Test")
            .startTime(LocalDateTime.now().plusDays(1))
            .endTime(LocalDateTime.now())
            .expectedAttendees(10)
            .build();

        assertThrows(ResponseStatusException.class, () -> {
            bookingService.createBooking(invalidBooking);
        });
    }

    // ==================== UPDATE BOOKING (USER) TESTS ====================

    @Test
    void updateBooking_Successfully_WhenOwner() {
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.findByResourceId(anyString())).thenReturn(new ArrayList<>());
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);

        Booking updateData = Booking.builder()
            .purpose("Updated Purpose")
            .expectedAttendees(20)
            .startTime(sampleBooking.getStartTime())
            .endTime(sampleBooking.getEndTime())
            .build();

        Booking updated = bookingService.updateBooking("test-id", updateData, "user-123");

        assertNotNull(updated);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void updateBooking_ThrowsForbidden_WhenNotOwner() {
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));

        Booking updateData = Booking.builder()
            .purpose("Updated Purpose")
            .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.updateBooking("test-id", updateData, "different-user");
        });

        assertEquals(403, exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("You can only modify your own bookings"));
    }

    @Test
    void updateBooking_ThrowsBadRequest_WhenNotPending() {
        sampleBooking.setStatus("APPROVED");
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));

        Booking updateData = Booking.builder()
            .purpose("Updated Purpose")
            .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.updateBooking("test-id", updateData, "user-123");
        });

        assertEquals(400, exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("Can only update pending bookings"));
    }

    @Test
    void updateBooking_ThrowsConflict_WhenTimeOverlap() {
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));
        
        Booking existingBooking = Booking.builder()
            .id("other-id")
            .status("APPROVED")
            .startTime(sampleBooking.getStartTime().plusHours(1))
            .endTime(sampleBooking.getEndTime().plusHours(2))
            .build();
        
        when(bookingRepository.findByResourceId("resource-1")).thenReturn(List.of(existingBooking));

        Booking updateData = Booking.builder()
            .purpose("Updated Purpose")
            .expectedAttendees(20)
            .startTime(sampleBooking.getStartTime())
            .endTime(sampleBooking.getEndTime().plusHours(3))
            .build();

        assertThrows(BookingConflictException.class, () -> {
            bookingService.updateBooking("test-id", updateData, "user-123");
        });
    }

    // ==================== DELETE BOOKING TESTS ====================

    @Test
    void deleteBooking_Successfully_WhenOwner() {
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));
        doNothing().when(bookingRepository).deleteById("test-id");

        bookingService.deleteBooking("test-id", "user-123");

        verify(bookingRepository).deleteById("test-id");
    }

    @Test
    void deleteBooking_ThrowsForbidden_WhenNotOwner() {
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.deleteBooking("test-id", "different-user");
        });

        assertEquals(403, exception.getStatusCode().value());
    }

    @Test
    void deleteBooking_ThrowsBadRequest_WhenNotPending() {
        sampleBooking.setStatus("APPROVED");
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.deleteBooking("test-id", "user-123");
        });

        assertEquals(400, exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("Can only delete pending bookings"));
    }

    @Test
    void deleteBooking_ThrowsNotFound_WhenIdInvalid() {
        when(bookingRepository.findById("invalid")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.deleteBooking("invalid", "test-user-id");
        });

        assertEquals(404, exception.getStatusCode().value());
    }

    // ==================== STATUS TRANSITION TESTS (ADMIN) ====================

    @Test
    void approveBooking_Successfully_AsAdmin() {
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.findByResourceId(anyString())).thenReturn(new ArrayList<>());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyRepository.save(any(BookingStatusHistory.class))).thenReturn(null);
        doNothing().when(notificationService).createNotification(any());

        Booking approved = bookingService.updateBookingStatus("test-id", "APPROVED", "admin-1", "ROLE_ADMIN", null);

        assertNotNull(approved);
        assertEquals("APPROVED", approved.getStatus());
    }

    @Test
    void rejectBooking_Successfully_AsAdmin() {
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyRepository.save(any(BookingStatusHistory.class))).thenReturn(null);
        doNothing().when(notificationService).createNotification(any());

        Booking rejected = bookingService.updateBookingStatus("test-id", "REJECTED", "admin-1", "ROLE_ADMIN", "Resource not available");

        assertNotNull(rejected);
        assertEquals("REJECTED", rejected.getStatus());
    }

    @Test
    void cancelBooking_Successfully_AsAdmin() {
        sampleBooking.setStatus("APPROVED");
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyRepository.save(any(BookingStatusHistory.class))).thenReturn(null);
        doNothing().when(notificationService).createNotification(any());

        Booking cancelled = bookingService.updateBookingStatus("test-id", "CANCELLED", "admin-1", "ROLE_ADMIN", "User request");

        assertNotNull(cancelled);
        assertEquals("CANCELLED", cancelled.getStatus());
    }

    @Test
    void approveBooking_ThrowsForbidden_WhenNotAdmin() {
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.updateBookingStatus("test-id", "APPROVED", "user-1", "ROLE_USER", null);
        });

        assertEquals(403, exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("Only administrators"));
    }

    @Test
    void approveBooking_ThrowsBadRequest_WhenAlreadyApproved() {
        sampleBooking.setStatus("APPROVED");
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.updateBookingStatus("test-id", "APPROVED", "admin-1", "ROLE_ADMIN", null);
        });

        assertEquals(400, exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("Invalid status transition"));
    }

    @Test
    void approveBooking_ThrowsBadRequest_WhenAlreadyRejected() {
        sampleBooking.setStatus("REJECTED");
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.updateBookingStatus("test-id", "APPROVED", "admin-1", "ROLE_ADMIN", null);
        });

        assertEquals(400, exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("Invalid status transition"));
    }

    // ==================== USER CANCELLATION TESTS ====================

    @Test
    void cancelBookingByUser_Successfully_WhenOwnerAndApproved() {
        sampleBooking.setStatus("APPROVED");
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyRepository.save(any(BookingStatusHistory.class))).thenReturn(null);
        doNothing().when(notificationService).createNotification(any());

        Booking cancelled = bookingService.cancelBookingByUser("test-id", "user-123", "Changed plans");

        assertNotNull(cancelled);
        assertEquals("CANCELLED", cancelled.getStatus());
    }

    @Test
    void cancelBookingByUser_ThrowsForbidden_WhenNotOwner() {
        sampleBooking.setStatus("APPROVED");
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.cancelBookingByUser("test-id", "different-user", "Test");
        });

        assertEquals(403, exception.getStatusCode().value());
    }

    @Test
    void cancelBookingByUser_ThrowsBadRequest_WhenNotApproved() {
        sampleBooking.setStatus("PENDING");
        when(bookingRepository.findById("test-id")).thenReturn(Optional.of(sampleBooking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.cancelBookingByUser("test-id", "user-123", "Test");
        });

        assertEquals(400, exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("You can only cancel approved bookings"));
    }

    // ==================== INPUT SANITIZATION TESTS ====================

    @Test
    void sanitizeInput_RemovesXSSCharacters() {
        String result = bookingService.sanitizeInput("<script>alert('xss')</script>");
        
        assertFalse(result.contains("<script>"));
        assertTrue(result.contains("&lt;script&gt;"));
    }

    @Test
    void sanitizeInput_TrimsWhitespace() {
        String result = bookingService.sanitizeInput("  test purpose  ");
        assertEquals("test purpose", result);
    }

    @Test
    void sanitizeInput_HandlesNull() {
        String result = bookingService.sanitizeInput(null);
        assertNull(result);
    }

    // ==================== BOOKING HISTORY TESTS ====================

    @Test
    void getBookingHistory_Successfully() {
        BookingStatusHistory history = new BookingStatusHistory();
        history.setId("history-1");
        history.setBookingId("test-id");
        history.setOldStatus("PENDING");
        history.setNewStatus("APPROVED");

        when(bookingRepository.existsById("test-id")).thenReturn(true);
        when(historyRepository.findByBookingIdOrderByChangedAtAsc("test-id")).thenReturn(List.of(history));

        List<BookingStatusHistory> result = bookingService.getBookingHistory("test-id");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("APPROVED", result.get(0).getNewStatus());
    }

    @Test
    void getBookingHistory_ThrowsNotFound_WhenBookingNotExists() {
        when(bookingRepository.existsById("invalid")).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            bookingService.getBookingHistory("invalid");
        });

        assertEquals(404, exception.getStatusCode().value());
    }
}