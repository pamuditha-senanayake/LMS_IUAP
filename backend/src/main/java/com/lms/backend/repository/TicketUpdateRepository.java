package com.lms.backend.repository;

import com.lms.backend.model.TicketUpdate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketUpdateRepository extends MongoRepository<TicketUpdate, String> {

    List<TicketUpdate> findByTicketIdOrderByCreatedAtAsc(String ticketId);

    List<TicketUpdate> findByTechnicianId(String technicianId);
}
