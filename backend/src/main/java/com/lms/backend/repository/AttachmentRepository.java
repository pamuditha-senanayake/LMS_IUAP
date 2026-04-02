package com.lms.backend.repository;

import com.lms.backend.model.Attachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends MongoRepository<Attachment, String> {

    List<Attachment> findByTicketId(String ticketId);

    void deleteByTicketId(String ticketId);

    List<Attachment> findByUploadedBy(String userId);
}
