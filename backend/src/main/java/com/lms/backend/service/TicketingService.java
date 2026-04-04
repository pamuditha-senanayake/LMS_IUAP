package com.lms.backend.service;

import com.lms.backend.model.IncidentTicket;
import com.lms.backend.model.TicketAttachment;
import com.lms.backend.model.TicketComment;
import com.lms.backend.repository.IncidentTicketRepository;
import com.lms.backend.repository.TicketAttachmentRepository;
import com.lms.backend.repository.TicketCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketingService {

    private final IncidentTicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;

    // Tickets
    public List<IncidentTicket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public List<IncidentTicket> getTicketsByReportedUser(String userId) {
        return ticketRepository.findByReportedById(userId);
    }

    public IncidentTicket createTicket(IncidentTicket ticket) {
        ticket.setStatus("OPEN");
        return ticketRepository.save(ticket);
    }

    public IncidentTicket updateTicketStatus(String ticketId, String status, String note, String adminId) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        
        ticket.setStatus(status);
        if ("RESOLVED".equals(status)) {
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setResolutionNotes(note);
        } else if ("CLOSED".equals(status)) {
            ticket.setClosedAt(LocalDateTime.now());
        } else if ("REJECTED".equals(status)) {
            ticket.setRejectionReason(note);
            ticket.setRejectedById(adminId);
        }
        
        return ticketRepository.save(ticket);
    }

    // Attachments
    public List<TicketAttachment> getTicketAttachments(String ticketId) {
        return attachmentRepository.findByTicketId(ticketId);
    }
    
    public TicketAttachment addAttachment(TicketAttachment attachment) {
        return attachmentRepository.save(attachment);
    }

    // Comments
    public List<TicketComment> getTicketComments(String ticketId) {
        return commentRepository.findByTicketId(ticketId);
    }
    
    public TicketComment addComment(TicketComment comment) {
        return commentRepository.save(comment);
    }

    public void deleteTicket(String ticketId) {
        ticketRepository.deleteById(ticketId);
    }

    public IncidentTicket updateTicket(String ticketId, IncidentTicket updates) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        
        if (updates.getTitle() != null) {
            ticket.setTitle(updates.getTitle());
        }
        if (updates.getDescription() != null) {
            ticket.setDescription(updates.getDescription());
        }
        if (updates.getResourceId() != null) {
            ticket.setResourceId(updates.getResourceId());
        }
        if (updates.getPriority() != null) {
            ticket.setPriority(updates.getPriority());
        }
        
        return ticketRepository.save(ticket);
    }
}
