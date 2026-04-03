package com.lms.backend.repository;

import com.lms.backend.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
    List<Resource> findByResourceType(String resourceType);
    List<Resource> findByStatus(String status);
}
