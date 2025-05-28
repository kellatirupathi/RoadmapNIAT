// client/src/services/roadmapService.js
import api from './api';

/**
 * Save roadmap metadata to the database
 * @param {Object} metadata - Roadmap metadata
// ... (other params)
 * @returns {Promise} - The API response
 */
export const saveRoadmapMetadata = async (metadata) => {
  return api.post('/roadmaps', metadata);
};

/**
 * Get all saved roadmaps
 * @returns {Promise} - The API response with all roadmaps
 */
export const getAllRoadmaps = async () => {
  return api.get('/roadmaps');
};

/**
 * Get a specific roadmap by ID
 * @param {string} id - The roadmap ID
 * @returns {Promise} - The API response with the roadmap
 */
export const getRoadmapById = async (id) => {
  return api.get(`/roadmaps/${id}`);
};

/**
 * Update a roadmap
 * @param {string} id - The roadmap ID
 * @param {Object} roadmapData - The data to update
 * @returns {Promise} - The API response
 */
export const updateRoadmap = async (id, roadmapData) => {
  return api.put(`/roadmaps/${id}`, roadmapData);
};


/**
 * Delete a roadmap
 * @param {string} id - The roadmap ID
 * @returns {Promise} - The API response
 */
export const deleteRoadmap = async (id) => {
  return api.delete(`/roadmaps/${id}`);
};

/**
 * Get consolidated roadmaps
 * @returns {Promise} - The API response with consolidated roadmaps
 */
export const getConsolidatedRoadmaps = async () => {
  return api.get('/roadmaps/consolidated');
};

/**
 * Get roadmaps by role
 * @param {string} role - The role to filter by
 * @returns {Promise} - The API response with filtered roadmaps
 */
export const getRoadmapsByRole = async (role) => {
  return api.get(`/roadmaps/role/${role}`);
};