// server/controllers/studentsTrackerController.js
import { AseRating, CompanyInteraction, AssignmentRating, IncrutierRating, CompanyClosing } from '../models/StudentRatings.js';

// Generic CRUD factory
const createCrudController = (Model) => ({
    getAll: async (req, res) => {
        try {
            let query = Model.find().sort({ createdAt: -1 });

            // Special population for CompanyClosing to get user names for history
            if (Model.modelName === 'CompanyClosing') {
                query = query
                    .populate('createdBy', 'username firstName lastName')
                    .populate('updatedBy.user', 'username firstName lastName');
            }

            const data = await query;
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
        }
    },
    create: async (req, res) => {
        try {
            const dataWithUser = (item) => ({ ...item, createdBy: req.user.id });
            
            let createdData;
            if (Array.isArray(req.body)) {
                if (req.body.length === 0) {
                    return res.status(400).json({ success: false, error: "Cannot create an empty list of entries." });
                }
                const dataToInsert = req.body.map(dataWithUser);
                createdData = await Model.insertMany(dataToInsert);
            } else {
                const dataToInsert = dataWithUser(req.body);
                createdData = await Model.create(dataToInsert);
            }

            res.status(201).json({ success: true, data: createdData });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to create entry: ' + error.message });
        }
    },
    // --- START: MODIFIED CONTROLLER ---
    // This 'update' function now logs only relevant field changes.
    update: async (req, res) => {
        try {
            const { updatedBy, createdBy, ...updateFields } = req.body;
    
            // Find the existing document to compare against
            const doc = await Model.findById(req.params.id);
            if (!doc) {
                return res.status(404).json({ success: false, error: 'Entry not found' });
            }
    
            // Define a list of fields to ignore when logging changes
            const excludedFields = ['createdAt', 'updatedAt', 'overallMarks', '__v', 'date'];
    
            // Calculate changes between the old doc and the incoming update
            const changes = [];
            for (const field in updateFields) {
                // Check if the field is a direct property and is NOT in the excluded list
                if (Object.prototype.hasOwnProperty.call(updateFields, field) && !excludedFields.includes(field)) {
                    // Convert both values to string for a consistent comparison
                    // Handles null, undefined, numbers, and dates becoming strings
                    const oldValue = String(doc[field] || '').trim();
                    const newValue = String(updateFields[field] || '').trim();

                    if (oldValue !== newValue) {
                        changes.push({
                            field: field,
                            from: oldValue,
                            to: newValue,
                        });
                    }
                }
            }
    
            // If there are actual changes, create a history entry
            if (changes.length > 0) {
                const historyEntry = {
                    user: req.user.id,
                    timestamp: new Date(),
                    changes: changes // Store the captured changes
                };
                doc.updatedBy.push(historyEntry);
            }
    
            // Apply the updates to the document
            Object.assign(doc, updateFields);
            
            // Save the document with the new data and history
            const updatedData = await doc.save();

            // Repopulate user details for the response, so the frontend has the necessary info
            const populatedData = await Model.findById(updatedData._id)
                                              .populate('createdBy', 'username firstName lastName')
                                              .populate('updatedBy.user', 'username firstName lastName');

            res.status(200).json({ success: true, data: populatedData });

        } catch (error) {
            console.error(`Error updating entry in ${Model.modelName}:`, error);
            res.status(400).json({ success: false, error: 'Failed to update entry: ' + error.message });
        }
    },
    // --- END: MODIFIED CONTROLLER ---
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
