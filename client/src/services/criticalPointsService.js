// client/src/services/criticalPointsService.js
import api from './api';

// Base API paths for the two sheets
const basePaths = {
    interactions: '/critical-points/interactions',
    companyStatus: '/critical-points/company-status',
};

// --- Service for "Interactions Feedback" Sheet ---
const interactionsService = {
  // Main record operations
  getAll: () => api.get(basePaths.interactions),
  create: (data) => api.post(basePaths.interactions, data),
  update: (id, data) => api.put(`${basePaths.interactions}/${id}`, data),
  delete: (id) => api.delete(`${basePaths.interactions}/${id}`),
  
  // Bulk upload for interactions
  bulkUpload: (data) => api.post(`${basePaths.interactions}/bulk`, data),
  
  // Nested interaction log operations
  addInteraction: (id, interactionData) => api.post(`${basePaths.interactions}/${id}/sub`, interactionData),
  updateSubInteraction: (id, subId, interactionData) => api.put(`${basePaths.interactions}/${id}/sub/${subId}`, interactionData),
  deleteSubInteraction: (id, subId) => api.delete(`${basePaths.interactions}/${id}/sub/${subId}`),
};

// --- Service for "Company Status" Sheet ---
const companyStatusService = {
  getAll: () => api.get(basePaths.companyStatus),
  create: (data) => api.post(basePaths.companyStatus, data),
  update: (id, data) => api.put(`${basePaths.companyStatus}/${id}`, data),
  delete: (id) => api.delete(`${basePaths.companyStatus}/${id}`),
  
  // Bulk upload for company status
  bulkUpload: (data) => api.post(`${basePaths.companyStatus}/bulk`, data),
};

export { interactionsService, companyStatusService };
