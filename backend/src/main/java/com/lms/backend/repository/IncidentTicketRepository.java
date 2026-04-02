package com.lms.backend.repository;

import com.lms.backend.model.IncidentTicket;
import com.lms.backend.model.TicketPriority;
import com.lms.backend.model.TicketStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentTicketRepository extends MongoRepository<IncidentTicket, String> {

    List<IncidentTicket> findByStatus(TicketStatus status);

    List<IncidentTicket> findByPriority(TicketPriority priority);

    List<IncidentTicket> findByCreatedBy(String userId);

    List<IncidentTicket> findByAssignedTechnician(String technicianId);

    long countByStatus(TicketStatus status);

    @Query("{ '$or': [ " +
           "{ 'title': { $regex: ?0, $options: 'i' } }, " +
           "{ 'description': { $regex: ?0, $options: 'i' } } " +
           "] }")
    List<IncidentTicket> searchByTitleOrDescription(String keyword);

    List<IncidentTicket> findByStatusAndPriority(TicketStatus status, TicketPriority priority);

    List<IncidentTicket> findAllByOrderByCreatedAtDesc();
}
