// client/services/overallHubService.js
import api from './api';

const basePath = '/overall-hub';

const overallHubService = {
    // Get all the saved overall statuses for students
    getAllStatuses: () => api.get(basePath),
    
    // Update (or create) the status for a student-company pair
    updateStatus: (statusData) => api.put(`${basePath}/status`, statusData)
};

export default overallHubService;
