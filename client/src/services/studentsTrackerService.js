// client/src/services/studentsTrackerService.js
import api from './api';

const createCrudService = (path) => ({
    getAll: () => api.get(path),
    create: (data) => api.post(path, data),
    update: (id, data) => api.put(`${path}/${id}`, data),
    remove: (id) => api.delete(`${path}/${id}`),
});

const studentsTrackerService = {
    aseRatings: createCrudService('/students-tracker/ase-ratings'),
    companyInteractions: createCrudService('/students-tracker/company-interactions'),
    assignmentRatings: createCrudService('/students-tracker/assignment-ratings'),
    incrutierRatings: createCrudService('/students-tracker/incrutier-ratings'),
    companyClosings: createCrudService('/students-tracker/company-closings'),
};

export default studentsTrackerService;
