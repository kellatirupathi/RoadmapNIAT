// server/controllers/criticalPointsController.js
import InteractionFeedback from '../models/InteractionFeedback.js';
import CompanyStatus from '../models/CompanyStatus.js';

// Helper to normalize CSV keys
const transformKeysToLower = (obj) => {
    const newObj = {};
    for (const key in obj) {
        newObj[key.toLowerCase().trim()] = obj[key];
    }
    return newObj;
};

// Reusable CRUD controller for top-level documents
const createCRUDController = (Model) => ({
  // Get all documents
  getAll: async (req, res) => {
    try {
      const data = await Model.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
  },
  // Create a new document
  create: async (req, res) => {
    try {
      const newData = await Model.create(req.body);
      res.status(201).json({ success: true, data: newData });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Failed to create entry: ' + error.message });
    }
  },
  // Update a document by ID
  update: async (req, res) => {
    try {
      const updatedData = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!updatedData) return res.status(404).json({ success: false, error: 'Entry not found' });
      res.status(200).json({ success: true, data: updatedData });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Failed to update entry: ' + error.message });
    }
  },
  // Delete a document by ID
  delete: async (req, res) => {
    try {
      const deletedData = await Model.findByIdAndDelete(req.params.id);
      if (!deletedData) return res.status(404).json({ success: false, error: 'Entry not found' });
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
  },
  // Method for bulk CSV upload
  bulkCreate: async (req, res) => {
    const dataRows = req.body;
    if (!Array.isArray(dataRows) || dataRows.length === 0) {
      return res.status(400).json({ success: false, error: 'No data rows provided.' });
    }

    try {
        let documentsToInsert = [];
        const modelName = Model.modelName;

        if (modelName === 'InteractionFeedback') {
            const interactionMap = new Map();
            dataRows.forEach(row => {
                const lcRow = transformKeysToLower(row);
                const company = lcRow.company;
                const role = lcRow.role;
                if (!company || !role) return;

                const key = `${company}|${role}`;
                
                // If this is the first time we see this company/role, create the main record
                if (!interactionMap.has(key)) {
                    interactionMap.set(key, {
                        company,
                        role,
                        roadmapReviewByCompany: lcRow['roadmap review by company'],
                        roadmapChangesStatus: lcRow['roadmap changes status'],
                        feedbackImplementationStatus: lcRow['feedback implementation status'] || 'Yet to Implement',
                        interactions: [], // Initialize the logs array
                    });
                }
                
                // Get the parent record
                const record = interactionMap.get(key);
                
                // Add the interaction log from the current row
                if (lcRow['interaction type'] || lcRow['interaction overall remarks']) {
                    record.interactions.push({
                        interactionType: lcRow['interaction type'] || 'General',
                        interactionAttendees: lcRow['interaction attendees'],
                        interactionSummary: lcRow['interaction summary'] || 'Neutral',
                        interactionOverallRemarks: lcRow['interaction overall remarks'],
                        date: lcRow.date ? new Date(lcRow.date) : new Date(),
                    });
                }
            });
            documentsToInsert = Array.from(interactionMap.values());
        } 
        else if (modelName === 'CompanyStatus') {
            const companyStatusMap = new Map();
            dataRows.forEach(row => {
                const lcRow = transformKeysToLower(row);
                const companyName = lcRow['company name'];
                const role = lcRow.role;
                if (!companyName || !role) return; // Skip invalid rows

                const key = `${companyName}|${role}`;
                if (!companyStatusMap.has(key)) {
                    companyStatusMap.set(key, {
                        companyName,
                        role,
                        openings: parseInt(lcRow.openings, 10) || 1,
                        students: [],
                    });
                }
                const record = companyStatusMap.get(key);
                
                if (lcRow['student name']) {
                    record.students.push({
                        studentName: lcRow['student name'],
                        niatId: lcRow['niat id'],
                        technicalScore: parseFloat(lcRow['technical score']) || 0,
                        sincerityScore: parseFloat(lcRow['sincerity score']) || 0,
                        communicationScore: parseFloat(lcRow['communication score']) || 0,
                    });
                }
            });
            documentsToInsert = Array.from(companyStatusMap.values());
        }

        if (documentsToInsert.length > 0) {
            await Model.insertMany(documentsToInsert, { ordered: false });
        }
        res.status(200).json({ success: true, message: `Successfully processed ${documentsToInsert.length} records.` });
    } catch (error) {
        res.status(500).json({ success: false, error: `Bulk upload failed: ${error.message}` });
    }
  }
});


// Create controllers for both models
const interactionsController = createCRUDController(InteractionFeedback);
const companyStatusController = createCRUDController(CompanyStatus);

// --- SPECIFIC CONTROLLERS FOR NESTED INTERACTIONS ---

// ADD a new interaction to a record
interactionsController.addInteraction = async (req, res) => {
  try {
    const feedback = await InteractionFeedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, error: 'Entry not found' });
    feedback.interactions.push(req.body);
    await feedback.save();
    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to add interaction: ' + error.message });
  }
};

// UPDATE a specific interaction sub-document
interactionsController.updateSubInteraction = async (req, res) => {
    try {
        const { id, subId } = req.params;
        const feedback = await InteractionFeedback.findById(id);
        if (!feedback) return res.status(404).json({ success: false, error: 'Parent record not found' });

        const subInteraction = feedback.interactions.id(subId);
        if (!subInteraction) return res.status(404).json({ success: false, error: 'Sub-interaction not found' });

        // Update fields from request body
        Object.assign(subInteraction, req.body);
        
        await feedback.save();
        res.status(200).json({ success: true, data: feedback });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Failed to update sub-interaction: ' + error.message });
    }
};

// DELETE a specific interaction sub-document
interactionsController.deleteSubInteraction = async (req, res) => {
    try {
        const { id, subId } = req.params;
        const feedback = await InteractionFeedback.findByIdAndUpdate(
            id,
            { $pull: { interactions: { _id: subId } } },
            { new: true }
        );

        if (!feedback) return res.status(404).json({ success: false, error: 'Record not found' });
        
        res.status(200).json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};

export { interactionsController, companyStatusController };
