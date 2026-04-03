import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

// Mock interceptor to add Basic Auth header for Admin demo
api.interceptors.request.use((config) => {
    config.headers.Authorization = 'Basic ' + btoa('admin:admin');
    return config;
});

export const getResources = (params) => api.get('/resources', { params });
export const getResourceById = (id) => api.get(`/resources/${id}`);
export const createResource = (data) => api.post('/resources', data);
export const updateResource = (id, data) => api.put(`/resources/${id}`, data);
export const patchResourceStatus = (id, status) => api.patch(`/resources/${id}/status`, null, { params: { status } });
export const deleteResource = (id) => api.delete(`/resources/${id}`);

export default api;
