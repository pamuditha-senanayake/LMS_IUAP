package com.lms.backend.service;

import com.lms.backend.model.Location;
import com.lms.backend.model.Resource;
import com.lms.backend.model.ResourceAvailabilityWindow;
import com.lms.backend.model.ResourceType;
import com.lms.backend.repository.LocationRepository;
import com.lms.backend.repository.ResourceAvailabilityWindowRepository;
import com.lms.backend.repository.ResourceRepository;
import com.lms.backend.repository.ResourceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilitiesService {

    private final LocationRepository locationRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceAvailabilityWindowRepository availabilityWindowRepository;

    // Locations
    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }
    
    public Location createLocation(Location location) {
        return locationRepository.save(location);
    }

    // Resource Types
    public List<ResourceType> getAllResourceTypes() {
        return resourceTypeRepository.findAll();
    }
    
    public ResourceType createResourceType(ResourceType resourceType) {
        return resourceTypeRepository.save(resourceType);
    }

    // Resources
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }
    
    public List<Resource> getResourcesByLocationAndType(String locationId, String typeId) {
        if (locationId != null) {
            return resourceRepository.findByLocationId(locationId);
        } else if (typeId != null) {
            return resourceRepository.findByResourceTypeId(typeId);
        }
        return getAllResources();
    }
    
    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }
    
    // Availability
    public List<ResourceAvailabilityWindow> getAvailabilityForResource(String resourceId) {
        return availabilityWindowRepository.findByResourceId(resourceId);
    }
    
    public ResourceAvailabilityWindow addAvailabilityWindow(ResourceAvailabilityWindow window) {
        return availabilityWindowRepository.save(window);
    }
}
