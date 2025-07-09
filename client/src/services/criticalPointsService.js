// client/src/services/criticalPointsService.js
import api from './api';

const basePaths = {
    interactions: '/critical-points/interactions',
    // --- MODIFICATION: Removed companyStatus path ---
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

// --- MODIFICATION: Removed entire companyStatusService export ---

export { interactionsService };
