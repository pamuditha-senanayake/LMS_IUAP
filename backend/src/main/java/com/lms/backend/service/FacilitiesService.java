package com.lms.backend.service;

import com.lms.backend.model.Resource;
import com.lms.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilitiesService {

    private final ResourceRepository resourceRepository;

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }
    
    public List<Resource> getResourcesByLocationAndType(String campusName, String resourceType) {
        if (campusName != null) {
            // Filter by embedded location field manually for simplicity
            return resourceRepository.findAll().stream()
                    .filter(r -> r.getLocation() != null && campusName.equals(r.getLocation().getCampusName()))
                    .toList();
        } else if (resourceType != null) {
            return resourceRepository.findByResourceType(resourceType);
        }
        return getAllResources();
    }
    
    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }
    
    public Resource getResourceById(String id) {
        return resourceRepository.findById(id).orElse(null);
    }
    
    public Resource updateResource(String id, Resource updatedResource) {
        if (resourceRepository.existsById(id)) {
            updatedResource.setId(id);
            return resourceRepository.save(updatedResource);
        }
        return null;
    }
    
    public void deleteResource(String id) {
        resourceRepository.deleteById(id);
    }
}
