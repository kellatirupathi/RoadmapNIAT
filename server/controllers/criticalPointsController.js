// server/controllers/criticalPointsController.js
import InteractionFeedback from '../models/InteractionFeedback.js';
// --- MODIFICATION: Removed CompanyStatus and PostInternship imports ---

// Helper to normalize CSV keys
const transformKeysToLower = (obj) => {
    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key.toLowerCase().trim()] = obj[key];
        }
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
                if (!company) return;
                const role = lcRow.role || '';
                const key = `${company}|${role}`;
                if (!interactionMap.has(key)) {
                    interactionMap.set(key, { company, role, roadmapReviewByCompany: lcRow['roadmap review by company'], roadmapChangesStatus: lcRow['roadmap changes status'], feedbackImplementationStatus: lcRow['feedback implementation status'] || 'Yet to Implement', interactions: [] });
                }
                const record = interactionMap.get(key);
                if (lcRow['interaction type'] || lcRow['interaction overall remarks']) {
                    record.interactions.push({ interactionType: lcRow['interaction type'] || 'General', interactionAttendees: lcRow['interaction attendees'], interactionSummary: lcRow['interaction summary'] || 'Neutral', interactionOverallRemarks: lcRow['interaction overall remarks'], date: lcRow.date ? new Date(lcRow.date) : new Date() });
                }
            });
            documentsToInsert = Array.from(interactionMap.values());
        } 
        // --- MODIFICATION: Removed 'CompanyStatus' block ---

        if (documentsToInsert.length > 0) {
            await Model.insertMany(documentsToInsert, { ordered: false });
        }
        res.status(200).json({ success: true, message: `Successfully processed ${documentsToInsert.length} records.` });
    } catch (error) {
        res.status(500).json({ success: false, error: `Bulk upload failed: ${error.message}` });
    }
  }
});

const interactionsController = createCRUDController(InteractionFeedback);
// --- MODIFICATION: Removed companyStatusController initialization ---

// ... (Rest of interactionsController for sub-documents)
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
interactionsController.updateSubInteraction = async (req, res) => {
    try {
        const { id, subId } = req.params;
        const feedback = await InteractionFeedback.findById(id);
        if (!feedback) return res.status(404).json({ success: false, error: 'Parent record not found' });

        const subInteraction = feedback.interactions.id(subId);
        if (!subInteraction) return res.status(404).json({ success: false, error: 'Sub-interaction not found' });

        Object.assign(subInteraction, req.body);
        await feedback.save();
        res.status(200).json({ success: true, data: feedback });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Failed to update sub-interaction: ' + error.message });
    }
};
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

// --- MODIFICATION: Removed companyStatusController export ---
export { interactionsController };
