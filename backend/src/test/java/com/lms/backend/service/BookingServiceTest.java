package com.lms.backend.service;

import com.lms.backend.enums.ResourceStatus;
import com.lms.backend.exception.BookingConflictException;
import com.lms.backend.model.Booking;
import com.lms.backend.model.Resource;
import com.lms.backend.repository.BookingRepository;
import com.lms.backend.repository.BookingStatusHistoryRepository;
import com.lms.backend.repository.ResourceRepository;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingStatusHistoryRepository historyRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ResourceRepository resourceRepository;

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

        lenient().when(resourceRepository.findById(anyString())).thenReturn(Optional.empty());
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

        assertThrows(BookingConflictException.class, () -> {
            bookingService.createBooking(sampleBooking);
        });
    }

    @Test
    void createBooking_ThrowsException_WhenResourceOutOfService() {
        Resource outOfServiceResource = new Resource();
        outOfServiceResource.setId("resource-1");
        outOfServiceResource.setStatus(ResourceStatus.OUT_OF_SERVICE);

        when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(outOfServiceResource));

        assertThrows(ResponseStatusException.class, () -> {
            bookingService.createBooking(sampleBooking);
        });
    }

    @Test
    void validateBookingData_ThrowsException_WhenTimeInvalid() {
        sampleBooking.setStartTime(LocalDateTime.now().plusDays(1));
        sampleBooking.setEndTime(LocalDateTime.now());

        assertThrows(ResponseStatusException.class, () -> {
            bookingService.createBooking(sampleBooking);
        });
    }

    @Test
    void deleteBooking_ThrowsNotFound_WhenIdInvalid() {
        when(bookingRepository.findById("invalid")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> {
            bookingService.deleteBooking("invalid", "test-user-id");
        });
    }
}
