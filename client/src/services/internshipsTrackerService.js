// import api from './api';

// const getSheetData = (sheetName) => {
//     return api.get(`/internships/${sheetName}`);
// };

// const createSheetRow = (sheetName, data) => {
//     return api.post(`/internships/${sheetName}`, data);
// };

// const updateSheetRow = (sheetName, id, data) => {
//     return api.put(`/internships/${sheetName}/${id}`, data);
// };

// const deleteSheetRow = (sheetName, id) => {
//     return api.delete(`/internships/${sheetName}/${id}`);
// };

// const deleteSheetData = (sheetName) => {
//     return api.delete(`/internships/${sheetName}`);
// };

// const internshipsTrackerService = {
//     getSheetData,
//     createSheetRow,
//     updateSheetRow,
//     deleteSheetRow,
//     deleteSheetData
// };

// export default internshipsTrackerService;

// client/src/services/internshipsTrackerService.js
import api from './api';

const getSheetData = (sheetName) => {
    return api.get(`/internships/${sheetName}`);
};

const createSheetRow = (sheetName, data) => {
    return api.post(`/internships/${sheetName}`, data);
};

const updateSheetRow = (sheetName, id, data) => {
    return api.put(`/internships/${sheetName}/${id}`, data);
};

const deleteSheetRow = (sheetName, id) => {
    return api.delete(`/internships/${sheetName}/${id}`);
};

const deleteSheetData = (sheetName) => {
    return api.delete(`/internships/${sheetName}`);
};

// --- NEW FUNCTION ADDED ---
const bulkUploadSheetData = (sheetName, data) => {
    // This new function sends the parsed CSV data to the backend.
    return api.post(`/internships/${sheetName}/bulk`, data);
};
// --- END NEW FUNCTION ---

const internshipsTrackerService = {
    getSheetData,
    createSheetRow,
    updateSheetRow,
    deleteSheetRow,
    deleteSheetData,
    bulkUploadSheetData // --- EXPORT NEW FUNCTION ---
};

export default internshipsTrackerService;
