package com.lms.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "attachments")
public class Attachment {

    @Id
    private String id;

    private String ticketId;

    private String fileName;

    private String fileType;

    private Long fileSize;

    private String filePath;

    private String uploadedBy;

    @CreatedDate
    private LocalDateTime uploadedAt;
}
