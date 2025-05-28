// client/src/services/techStackService.js
import api from './api';

// Get all tech stacks (names only for dropdown)
export const getAllTechStacks = async () => {
  return api.get('/tech-stacks');
};

// Get a tech stack by ID
export const getTechStackById = async (id) => {
  return api.get(`/tech-stacks/${id}`);
};

// Get a tech stack by name
export const getTechStackByName = async (name) => {
  // URL-encode the name to handle special characters like '#'
  const encodedName = encodeURIComponent(name);
  return api.get(`/tech-stacks/name/${encodedName}`); // Use the encoded name in the URL
};

// Create a new tech stack
export const createTechStack = async (techStackData) => {
  return api.post('/tech-stacks', techStackData);
};

// Update a tech stack
export const updateTechStack = async (id, updateData) => {
  return api.put(`/tech-stacks/${id}`, updateData);
};

// Delete a tech stack
export const deleteTechStack = async (id) => {
  return api.delete(`/tech-stacks/${id}`);
};

// Delete all tech stacks
export const deleteAllTechStacks = async () => {
  return api.delete('/tech-stacks/all');
};

// Add a roadmap item to a tech stack
export const addRoadmapItem = async (techStackId, itemData) => {
  return api.post(`/tech-stacks/${techStackId}/roadmap-item`, itemData);
};

// Update a roadmap item
export const updateRoadmapItem = async (techStackId, itemId, updateData) => {
  return api.put(`/tech-stacks/${techStackId}/roadmap-item/${itemId}`, updateData);
};

// Delete a roadmap item
export const deleteRoadmapItem = async (techStackId, itemId) => {
  return api.delete(`/tech-stacks/${techStackId}/roadmap-item/${itemId}`);
};

// Update a roadmap item's scheduled date
export const updateRoadmapItemSchedule = async (techStackId, itemId, scheduledDateData) => {
  return api.put(`/tech-stacks/${techStackId}/roadmap-item/${itemId}/schedule`, scheduledDateData);
};