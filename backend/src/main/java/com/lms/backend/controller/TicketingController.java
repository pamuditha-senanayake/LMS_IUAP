package com.lms.backend.controller;

import com.lms.backend.model.IncidentTicket;
import com.lms.backend.model.TicketAttachment;
import com.lms.backend.model.TicketComment;
import com.lms.backend.service.TicketingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketingController {

    private final TicketingService ticketingService;

    @GetMapping
    public ResponseEntity<List<IncidentTicket>> getAllTickets(@RequestParam(required = false) String userId) {
        if (userId != null) {
            return ResponseEntity.ok(ticketingService.getTicketsByReportedUser(userId));
        }
        return ResponseEntity.ok(ticketingService.getAllTickets());
    }

    @PostMapping
    public ResponseEntity<IncidentTicket> createTicket(@RequestBody IncidentTicket ticket) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketingService.createTicket(ticket));
    }

    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<IncidentTicket> updateStatus(
            @PathVariable String ticketId,
            @RequestParam String status,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) String adminId) {
        return ResponseEntity.ok(ticketingService.updateTicketStatus(ticketId, status, note, adminId));
    }

    @GetMapping("/{ticketId}/attachments")
    public ResponseEntity<List<TicketAttachment>> getAttachments(@PathVariable String ticketId) {
        return ResponseEntity.ok(ticketingService.getTicketAttachments(ticketId));
    }

    @PostMapping("/{ticketId}/attachments")
    public ResponseEntity<TicketAttachment> addAttachment(@PathVariable String ticketId, @RequestBody TicketAttachment attachment) {
        attachment.setTicketId(ticketId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketingService.addAttachment(attachment));
    }

    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<List<TicketComment>> getComments(@PathVariable String ticketId) {
        return ResponseEntity.ok(ticketingService.getTicketComments(ticketId));
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<TicketComment> addComment(@PathVariable String ticketId, @RequestBody TicketComment comment) {
        comment.setTicketId(ticketId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketingService.addComment(comment));
    }
}
