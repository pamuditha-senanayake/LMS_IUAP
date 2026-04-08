package com.lms.backend.repository;

import com.lms.backend.model.Booking;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByRequestedByUserId(String userId);
    List<Booking> findByRequestedByUserId(String userId, Sort sort);
    List<Booking> findByRequestedByUserIdAndStatus(String userId, String status, Sort sort);
    List<Booking> findByStatus(String status, Sort sort);
    List<Booking> findByResourceId(String resourceId);
}
