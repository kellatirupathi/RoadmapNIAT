// client/src/services/criticalPointsService.js
import api from './api';

const basePaths = {
    interactions: '/critical-points/interactions',
    companyStatus: '/critical-points/company-status',
};

// --- Interactions Feedback Service ---
const interactionsService = {
  getAll: () => api.get(basePaths.interactions),
  create: (data) => api.post(basePaths.interactions, data),
  update: (id, data) => api.put(`${basePaths.interactions}/${id}`, data),
  delete: (id) => api.delete(`${basePaths.interactions}/${id}`),
  bulkUpload: (data) => api.post(`${basePaths.interactions}/bulk`, data),
  addInteraction: (id, interactionData) => api.post(`${basePaths.interactions}/${id}/sub`, interactionData),
  updateSubInteraction: (id, subId, interactionData) => api.put(`${basePaths.interactions}/${id}/sub/${subId}`, interactionData),
  deleteSubInteraction: (id, subId) => api.delete(`${basePaths.interactions}/${id}/sub/${subId}`),
};

// --- Company Status Service ---
const companyStatusService = {
  getAll: () => api.get(basePaths.companyStatus),
  create: (data) => api.post(basePaths.companyStatus, data),
  update: (id, data) => api.put(`${basePaths.companyStatus}/${id}`, data),
  delete: (id) => api.delete(`${basePaths.companyStatus}/${id}`),
  bulkUpload: (data) => api.post(`${basePaths.companyStatus}/bulk`, data),
  // --- NEW SERVICE FUNCTION ---
  updateStudentStatus: (companyId, studentId, newStatus) => 
    api.put(`${basePaths.companyStatus}/${companyId}/students/${studentId}/status`, { newStatus })
};

export { interactionsService, companyStatusService };
