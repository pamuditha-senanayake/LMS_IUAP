package com.lms.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resources")
public class Resource {
    @Id
    private String id;
    
    // Using embedded objects instead of IDs
    private ResourceLocation location;
    
    private String resourceCode;
    @NotBlank(message = "Resource name is required")
    private String resourceName;

    @NotBlank(message = "Resource type is required")
    private String resourceType; 

    private String description;

    @Min(value = 0, message = "Capacity cannot be negative")
    private Integer capacity;

    private String status; // active, out_of_service
    private Boolean requiresAttendanceCount;
    
    private List<AvailabilityWindow> availabilityWindows;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceLocation {
        private String campusName;
        private String buildingName;
        private String floor;
        private String roomNumber;
        private Double latitude;
        private Double longitude;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityWindow {
        private Integer dayOfWeek; // 1-7
        private String startTime; // HH:mm
        private String endTime; // HH:mm
        private Boolean isAvailable;
    }
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
