package com.lms.backend.service;

import com.lms.backend.model.Notification;
import com.lms.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByRecipientUserId(userId);
    }
    
    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByRecipientUserIdAndIsReadFalse(userId);
    }

    public Notification createNotification(Notification notification) {
        notification.setIsRead(false);
        return notificationRepository.save(notification);
    }

    public Notification markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }
}
