import api from './api';

/**
 * Upload roadmap HTML to GitHub
 * @param {Object} data - Upload data
 * @param {string} data.filename - The name of the file
 * @param {string} data.content - The HTML content
 * @param {string} data.description - Commit description
 * @returns {Promise} - The API response
 */
export const uploadToGithub = async (data) => {
  return api.post('/github/upload', data);
};

/**
 * Get the list of published roadmaps
 * @returns {Promise} - The API response with the list of published roadmaps
 */
export const getPublishedRoadmaps = async () => {
  return api.get('/github/roadmaps');
};