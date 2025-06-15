import InternshipMaster from '../models/InternshipMaster.js';
import TechStackRoadmapTracker from '../models/TechStackRoadmapTracker.js';
import CompanyStudentProgress from '../models/CompanyStudentProgress.js';
import StackToCompanyMapping from '../models/StackToCompanyMapping.js';
import StudentWiseProgress from '../models/StudentWiseProgress.js';
import CriticalPoints from '../models/CriticalPoints.js';

const sheetModels = {
    'internship-master': InternshipMaster,
    'tech-stack-roadmaps': TechStackRoadmapTracker,
    'companywise-students-progress': CompanyStudentProgress,
    'stack-to-company-mapping': StackToCompanyMapping,
    'student-wise-progress': StudentWiseProgress,
    'critical-points': CriticalPoints
};

const getModel = (sheetName) => {
    return sheetModels[sheetName];
};

export const getSheetData = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) {
        return res.status(404).json({ success: false, error: 'Subsheet not found' });
    }
    try {
        const data = await Model.find().sort({ createdAt: 'desc' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};

export const createSheetRow = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) {
        return res.status(404).json({ success: false, error: 'Subsheet not found' });
    }
    try {
        const newRow = await Model.create(req.body);
        res.status(201).json({ success: true, data: newRow });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Failed to create row: ' + error.message });
    }
};

export const updateSheetRow = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) {
        return res.status(404).json({ success: false, error: 'Subsheet not found' });
    }
    try {
        const updatedRow = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedRow) {
            return res.status(404).json({ success: false, error: 'Row not found' });
        }
        res.status(200).json({ success: true, data: updatedRow });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Failed to update row: ' + error.message });
    }
};

export const deleteSheetRow = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) {
        return res.status(404).json({ success: false, error: 'Subsheet not found' });
    }
    try {
        const deletedRow = await Model.findByIdAndDelete(req.params.id);
        if (!deletedRow) {
            return res.status(404).json({ success: false, error: 'Row not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};

export const deleteSheetData = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) {
        return res.status(404).json({ success: false, error: 'Subsheet not found' });
    }
    try {
        await Model.deleteMany({});
        res.status(200).json({ success: true, message: 'All data for this sheet has been deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};