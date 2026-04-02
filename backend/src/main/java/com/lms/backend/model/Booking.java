package com.lms.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {
    @Id
    private String id;
    
    private String resourceId;
    private String requestedById;
    private String reviewedById;
    
    private String purpose;
    private Integer expectedAttendees;
    
    private LocalDateTime startDatetime;
    private LocalDateTime endDatetime;
    
    private String status; // PENDING, APPROVED, REJECTED, CANCELLED
    private String rejectionReason;
    
    private LocalDateTime approvedAt;
    private LocalDateTime cancelledAt;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
