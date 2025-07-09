// client/src/services/companyInteractionTrackingService.js
import api from './api';

const basePath = '/company-interactions';

const companyInteractionTrackingService = {
    // [Admin] Get all summary data for the main table
    getAll: () => api.get(basePath),

    // [Admin] Get full data for a single record for editing
    getById: (id) => api.get(`${basePath}/${id}`),

    // [Admin] Create a new company interaction record
    create: (data) => api.post(basePath, data),

    // [Admin] Update a record
    update: (id, data) => api.put(`${basePath}/${id}`, data),

    // [Admin] Delete a record
    remove: (id) => api.delete(`${basePath}/${id}`),
    
    // [Admin] Add a new interaction session to a record
    addSession: (recordId) => api.put(`${basePath}/${recordId}/add-session`),
    
    // [Admin] Remove the last interaction session from a record
    removeSession: (recordId) => api.put(`${basePath}/${recordId}/remove-session`),

    // [Public] Get interaction data using the public ID
    getPublicData: (publicId) => api.get(`${basePath}/public/${publicId}`),
    
    // [Public] Update a single feedback field (quality or remarks)
    updatePublicData: (publicId, sessionId, studentId, field, value) => {
        return api.put(`${basePath}/public/${publicId}/${sessionId}/${studentId}`, { field, value });
    }
};

export default companyInteractionTrackingService;
