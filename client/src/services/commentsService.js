// client/src/services/commentsService.js
import api from './api';

// Get comments for a tech stack roadmap item
const getComments = async (techStackId, roadmapItemId) => {
  return api.get(`/comments/techstack/${techStackId}/item/${roadmapItemId}`);
};

// Add a comment to a tech stack roadmap item
const addComment = async (techStackId, roadmapItemId, commentData) => {
  return api.post(`/comments/techstack/${techStackId}/item/${roadmapItemId}`, commentData);
};

// Update a comment
const updateComment = async (commentId, commentData) => {
  // Ensure this matches the backend route if you use a generic :commentId route
  // The backend current has techStackId/itemId/commentId for deletion
  // This generic update might need a different backend route.
  // For now, assuming the generic route /comments/:commentId for update is implemented if needed
  return api.put(`/comments/${commentId}`, commentData);
};

// Delete a comment
const deleteComment = async (techStackId, roadmapItemId, commentId) => {
  // Match the backend route structure
  return api.delete(`/comments/techstack/${techStackId}/item/${roadmapItemId}/${commentId}`);
};


// Get all comments by a user
const getUserComments = async (userId = null) => {
  let url = '/comments/user';
  if (userId) {
    url += `/${userId}`;
  }
  return api.get(url);
};

const commentsService = {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  getUserComments
};

export default commentsService;