package com.lms.backend.controller;

import com.lms.backend.model.Resource;
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

    @GetMapping("/resources")
    public ResponseEntity<List<Resource>> getResources(
            @RequestParam(required = false) String campusName,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(facilitiesService.getResourcesByLocationAndType(campusName, type));
    }

    @GetMapping("/resources/{id}")
    public ResponseEntity<Resource> getResource(@PathVariable String id) {
        Resource r = facilitiesService.getResourceById(id);
        return r != null ? ResponseEntity.ok(r) : ResponseEntity.notFound().build();
    }

    @PostMapping("/resources")
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facilitiesService.createResource(resource));
    }

    @PutMapping("/resources/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @RequestBody Resource resource) {
        Resource r = facilitiesService.updateResource(id, resource);
        return r != null ? ResponseEntity.ok(r) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/resources/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        facilitiesService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
