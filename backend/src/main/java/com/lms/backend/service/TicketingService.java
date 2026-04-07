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
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    public Map<String, Object> getTicketStatistics() {
        List<IncidentTicket> allTickets = ticketRepository.findAll();
        
        Map<String, Object> stats = new HashMap<>();
        
        long total = allTickets.size();
        long open = allTickets.stream().filter(t -> "OPEN".equals(t.getStatus())).count();
        long inProgress = allTickets.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
        long resolved = allTickets.stream().filter(t -> "RESOLVED".equals(t.getStatus()) || "CLOSED".equals(t.getStatus())).count();
        long rejected = allTickets.stream().filter(t -> "REJECTED".equals(t.getStatus())).count();
        
        long critical = allTickets.stream().filter(t -> "CRITICAL".equals(t.getPriority())).count();
        long high = allTickets.stream().filter(t -> "HIGH".equals(t.getPriority())).count();
        long medium = allTickets.stream().filter(t -> "MEDIUM".equals(t.getPriority())).count();
        long low = allTickets.stream().filter(t -> "LOW".equals(t.getPriority())).count();
        
        long resolvedWithTime = allTickets.stream()
            .filter(t -> t.getResolvedAt() != null && t.getCreatedAt() != null)
            .count();
        
        double avgResolutionHours = allTickets.stream()
            .filter(t -> t.getResolvedAt() != null && t.getCreatedAt() != null)
            .mapToLong(t -> ChronoUnit.HOURS.between(t.getCreatedAt(), t.getResolvedAt()))
            .average()
            .orElse(0.0);
        
        stats.put("total", total);
        stats.put("open", open);
        stats.put("inProgress", inProgress);
        stats.put("resolved", resolved);
        stats.put("rejected", rejected);
        stats.put("critical", critical);
        stats.put("high", high);
        stats.put("medium", medium);
        stats.put("low", low);
        stats.put("avgResolutionHours", Math.round(avgResolutionHours * 10) / 10.0);
        stats.put("resolvedWithTime", resolvedWithTime);
        
        return stats;
    }

    public Map<String, Object> getTicketVolumeByDay(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = now.minusDays(days);
        List<IncidentTicket> allTickets = ticketRepository.findAll();
        
        Map<String, Long> volumeByDay = new HashMap<>();
        for (int i = 0; i < days; i++) {
            LocalDateTime day = startDate.plusDays(i);
            String dayKey = day.toLocalDate().toString();
            volumeByDay.put(dayKey, 0L);
        }
        
        for (IncidentTicket ticket : allTickets) {
            if (ticket.getCreatedAt() != null && ticket.getCreatedAt().isAfter(startDate)) {
                String dayKey = ticket.getCreatedAt().toLocalDate().toString();
                volumeByDay.merge(dayKey, 1L, Long::sum);
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("volumeByDay", volumeByDay);
        result.put("days", days);
        return result;
    }

    public Map<String, Long> getTicketCountByAssignedStaff() {
        List<IncidentTicket> allTickets = ticketRepository.findAll();
        
        Map<String, Long> countByStaff = new HashMap<>();
        for (IncidentTicket ticket : allTickets) {
            String staffId = ticket.getAssignedToId();
            if (staffId != null && !staffId.isEmpty()) {
                countByStaff.merge(staffId, 1L, Long::sum);
            } else {
                countByStaff.merge("Unassigned", 1L, Long::sum);
            }
        }
        
        return countByStaff;
    }

    public List<IncidentTicket> getTicketsByReportedUser(String userId) {
        return ticketRepository.findByReportedById(userId);
    }

    public IncidentTicket createTicket(IncidentTicket ticket) {
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
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
