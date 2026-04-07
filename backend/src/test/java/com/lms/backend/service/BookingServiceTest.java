package com.lms.backend.service;

import com.lms.backend.model.Booking;
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
        sampleBooking = new Booking();
        sampleBooking.setId("test-id");
        sampleBooking.setResourceId("resource-1");
        sampleBooking.setPurpose("Test Purpose");
        sampleBooking.setStartTime(LocalDateTime.now().plusDays(1));
        sampleBooking.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));
        sampleBooking.setExpectedAttendees(10);
    }

    @Test
    void createBooking_Successfully() {
        when(bookingRepository.findByResourceId(anyString())).thenReturn(new ArrayList<>());
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);

        Booking created = bookingService.createBooking(sampleBooking);

        assertNotNull(created);
        assertEquals("PENDING", created.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    void createBooking_ThrowsConflict_WhenOverlapExists() {
        Booking existingBooking = new Booking();
        existingBooking.setId("existing-id");
        existingBooking.setStatus("APPROVED");
        existingBooking.setStartTime(sampleBooking.getStartTime());
        existingBooking.setEndTime(sampleBooking.getEndTime());

        when(bookingRepository.findByResourceId(anyString())).thenReturn(List.of(existingBooking));

        assertThrows(ResponseStatusException.class, () -> {
            bookingService.createBooking(sampleBooking);
        });
    }

    @Test
    void validateBookingData_ThrowsException_WhenTimeInvalid() {
        sampleBooking.setStartTime(LocalDateTime.now().plusDays(1));
        sampleBooking.setEndTime(LocalDateTime.now()); // End before start

        assertThrows(ResponseStatusException.class, () -> {
            bookingService.createBooking(sampleBooking);
        });
    }

    @Test
    void deleteBooking_ThrowsNotFound_WhenIdInvalid() {
        when(bookingRepository.existsById("invalid")).thenReturn(false);

        assertThrows(ResponseStatusException.class, () -> {
            bookingService.deleteBooking("invalid");
        });
    }
}
