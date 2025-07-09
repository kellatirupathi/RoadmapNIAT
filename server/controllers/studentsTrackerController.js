// server/controllers/studentsTrackerController.js
import { AseRating, CompanyInteraction, AssignmentRating, IncrutierRating, CompanyClosing } from '../models/StudentRatings.js';

// Generic CRUD factory
const createCrudController = (Model) => ({
    getAll: async (req, res) => {
        try {
            const data = await Model.find().sort({ createdAt: -1 });
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
        }
    },
    create: async (req, res) => {
        try {
            // --- UPDATED LOGIC TO HANDLE SINGLE OR MULTIPLE ENTRIES ---
            let createdData;
            if (Array.isArray(req.body)) {
                // If the body is an array, use insertMany for bulk creation
                if (req.body.length === 0) {
                    return res.status(400).json({ success: false, error: "Cannot create an empty list of entries." });
                }
                createdData = await Model.insertMany(req.body);
            } else {
                // Otherwise, create a single document
                createdData = await Model.create(req.body);
            }
            res.status(201).json({ success: true, data: createdData });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to create entry: ' + error.message });
        }
    },
    update: async (req, res) => {
        try {
            const updatedData = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            if (!updatedData) return res.status(404).json({ success: false, error: 'Entry not found' });
            res.status(200).json({ success: true, data: updatedData });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to update entry: ' + error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const deletedData = await Model.findByIdAndDelete(req.params.id);
            if (!deletedData) return res.status(404).json({ success: false, error: 'Entry not found' });
            res.status(200).json({ success: true, data: {} });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
        }
    }
});

// Create controllers for each model
export const aseRatingsController = createCrudController(AseRating);
export const companyInteractionsController = createCrudController(CompanyInteraction);
export const assignmentRatingsController = createCrudController(AssignmentRating);
export const incrutierRatingsController = createCrudController(IncrutierRating);
export const companyClosingsController = createCrudController(CompanyClosing);
