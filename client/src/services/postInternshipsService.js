// client/src/services/postInternshipsService.js
import api from './api';

const getAll = () => api.get('/post-internships');
const getById = (id) => api.get(`/post-internships/${id}`); // Get one record
const create = (data) => api.post('/post-internships', data);
const update = (id, data) => api.put(`/post-internships/${id}`, data);
const remove = (id) => api.delete(`/post-internships/${id}`);

// --- Task Specific Service Functions ---
const addTask = (studentId, taskData) => api.post(`/post-internships/${studentId}/tasks`, taskData);
const updateTask = (studentId, taskId, taskData) => api.put(`/post-internships/${studentId}/tasks/${taskId}`, taskData);
const removeTask = (studentId, taskId) => api.delete(`/post-internships/${studentId}/tasks/${taskId}`);


const postInternshipsService = { 
    getAll, 
    getById, 
    create, 
    update, 
    remove,
    addTask,
    updateTask,
    removeTask
};

export default postInternshipsService;
