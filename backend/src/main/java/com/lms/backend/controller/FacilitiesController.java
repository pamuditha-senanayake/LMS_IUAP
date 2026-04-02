package com.lms.backend.controller;

import com.lms.backend.model.Location;
import com.lms.backend.model.Resource;
import com.lms.backend.model.ResourceAvailabilityWindow;
import com.lms.backend.model.ResourceType;
import com.lms.backend.service.FacilitiesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilitiesController {

    private final FacilitiesService facilitiesService;

    // Locations
    @GetMapping("/locations")
    public ResponseEntity<List<Location>> getAllLocations() {
        return ResponseEntity.ok(facilitiesService.getAllLocations());
    }

    @PostMapping("/locations")
    public ResponseEntity<Location> createLocation(@RequestBody Location location) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facilitiesService.createLocation(location));
    }

    // Resource Types
    @GetMapping("/resource-types")
    public ResponseEntity<List<ResourceType>> getAllResourceTypes() {
        return ResponseEntity.ok(facilitiesService.getAllResourceTypes());
    }

    @PostMapping("/resource-types")
    public ResponseEntity<ResourceType> createResourceType(@RequestBody ResourceType resourceType) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facilitiesService.createResourceType(resourceType));
    }

    // Resources
    @GetMapping("/resources")
    public ResponseEntity<List<Resource>> getResources(
            @RequestParam(required = false) String locationId,
            @RequestParam(required = false) String typeId) {
        return ResponseEntity.ok(facilitiesService.getResourcesByLocationAndType(locationId, typeId));
    }

    @PostMapping("/resources")
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facilitiesService.createResource(resource));
    }

    // Availability Windows
    @GetMapping("/resources/{resourceId}/availability")
    public ResponseEntity<List<ResourceAvailabilityWindow>> getResourceAvailability(@PathVariable String resourceId) {
        return ResponseEntity.ok(facilitiesService.getAvailabilityForResource(resourceId));
    }

    @PostMapping("/resources/{resourceId}/availability")
    public ResponseEntity<ResourceAvailabilityWindow> addResourceAvailability(
            @PathVariable String resourceId, 
            @RequestBody ResourceAvailabilityWindow window) {
        window.setResourceId(resourceId);
        return ResponseEntity.status(HttpStatus.CREATED).body(facilitiesService.addAvailabilityWindow(window));
    }
}
