package com.lms.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ticket_updates")
public class TicketUpdate {

    @Id
    private String id;

    private String ticketId;

    private String technicianId;

    private TicketStatus previousStatus;

    private TicketStatus newStatus;

    private String comment;

    @CreatedDate
    private LocalDateTime createdAt;
}
