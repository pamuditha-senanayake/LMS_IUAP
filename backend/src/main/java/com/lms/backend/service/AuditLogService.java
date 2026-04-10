package com.lms.backend.service;

import com.lms.backend.model.AuditLog;
import com.lms.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLog logAction(AuditLog log) {
        return auditLogRepository.save(log);
    }

    public List<AuditLog> getLogsForEntity(String entityType, String entityId) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<AuditLog> searchByActionType(String actionType) {
        return auditLogRepository.findByActionTypeIgnoreCaseContainingOrderByCreatedAtDesc(actionType);
    }
}
