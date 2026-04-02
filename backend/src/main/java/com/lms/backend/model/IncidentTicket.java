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
@Document(collection = "incident_tickets")
public class IncidentTicket {
    @Id
    private String id;
    
    private String reportedById;
    private String resourceId;
    private String locationId;
    private String assignedToId;
    private String rejectedById;
    
    private String ticketCode;
    private String category;
    private String title;
    private String description;
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    
    private String preferredContactName;
    private String preferredContactPhone;
    private String rejectionReason;
    private String resolutionNotes;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
}
