// server/controllers/companyInteractionTrackingController.js
import CompanyInteractionTracking from '../models/CompanyInteractionTracking.js';

const companyInteractionTrackingController = {
    // [PROTECTED] Get all records for the admin summary view
    getAllInteractions: async (req, res) => {
        try {
            // --- MODIFIED: Return full documents instead of aggregated data ---
            const interactions = await CompanyInteractionTracking.find({}).sort({ companyName: 1 });
            res.status(200).json({ success: true, data: interactions });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
        }
    },

    // --- NEW: [PROTECTED] Get a single full record by ID ---
    getById: async (req, res) => {
        try {
            const record = await CompanyInteractionTracking.findById(req.params.id);
            if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
            res.status(200).json({ success: true, data: record });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
        }
    },

    // [PROTECTED] Create a new company interaction record
    createCompanyInteraction: async (req, res) => {
        try {
            const { companyName, students } = req.body;
            if (!companyName) {
                return res.status(400).json({ success: false, error: 'Company name is required.' });
            }

            const newRecord = new CompanyInteractionTracking({
                companyName,
                interactions: [{
                    sessionName: 'Interaction 1',
                    studentData: students.map(s => ({
                        studentName: s.studentName,
                        niatId: s.niatId,
                        trainingPlan: s.trainingPlan,
                        trainingCovered: s.trainingCovered,
                    }))
                }]
            });
            await newRecord.save();
            res.status(201).json({ success: true, data: newRecord });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to create interaction record: ' + error.message });
        }
    },
    
    // --- NEW: [PROTECTED] Update an existing company interaction record ---
    updateCompanyInteraction: async (req, res) => {
        try {
            const { companyName, interactions } = req.body;
            const updatedRecord = await CompanyInteractionTracking.findByIdAndUpdate(
                req.params.id, 
                { companyName, interactions },
                { new: true, runValidators: true }
            );
            if (!updatedRecord) return res.status(404).json({ success: false, error: 'Record not found' });
            res.status(200).json({ success: true, data: updatedRecord });
        } catch(error) {
            res.status(400).json({ success: false, error: 'Failed to update record: ' + error.message });
        }
    },
    
    // --- NEW: [PROTECTED] Delete a company interaction record ---
    deleteCompanyInteraction: async (req, res) => {
        try {
            const deletedRecord = await CompanyInteractionTracking.findByIdAndDelete(req.params.id);
            if (!deletedRecord) return res.status(404).json({ success: false, error: 'Record not found' });
            res.status(200).json({ success: true, data: {} });
        } catch(error) {
            res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
        }
    },

    // [PROTECTED] Add a new interaction session, copying the previous one
    addInteractionSession: async (req, res) => {
        try {
            const { id } = req.params;
            const record = await CompanyInteractionTracking.findById(id);
            if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
            
            const lastInteraction = record.interactions[record.interactions.length - 1];
            if (!lastInteraction) {
                return res.status(400).json({ success: false, error: 'No existing interaction to copy from.' });
            }
            
            const newSession = {
                sessionName: `Interaction ${record.interactions.length + 1}`,
                studentData: lastInteraction.studentData.map(student => ({
                    studentName: student.studentName,
                    niatId: student.niatId,
                    trainingPlan: student.trainingPlan,
                    trainingCovered: student.trainingCovered,
                    interactionQuality: '',
                    remarks: ''
                }))
            };
            
            record.interactions.push(newSession);
            await record.save();
            res.status(200).json({ success: true, data: record });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
        }
    },

    // [PROTECTED] Remove the last interaction session
    removeInteractionSession: async (req, res) => {
        try {
            const { id } = req.params;
            const record = await CompanyInteractionTracking.findById(id);
            if (!record) return res.status(404).json({ success: false, error: 'Record not found' });

            if (record.interactions.length <= 1) {
                return res.status(400).json({ success: false, error: 'Cannot remove the last interaction session.' });
            }

            record.interactions.pop();
            await record.save();
            res.status(200).json({ success: true, data: record });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
        }
    },

    // [PUBLIC] Get data for the public page
    getPublicInteraction: async (req, res) => {
        try {
            const { publicId } = req.params;
            const record = await CompanyInteractionTracking.findOne({ publicId });
            if (!record) {
                return res.status(404).json({ success: false, error: 'Interaction page not found.' });
            }
            res.status(200).json({ success: true, data: record });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
        }
    },
    
    // [PUBLIC] Update feedback from the public page
    updatePublicInteraction: async (req, res) => {
        try {
            const { publicId, sessionId, studentId } = req.params;
            const { field, value } = req.body;

            if (!['interactionQuality', 'remarks'].includes(field)) {
                return res.status(400).json({ success: false, error: 'Invalid field to update.' });
            }

            const update = { [`interactions.$[session].studentData.$[student].${field}`]: value };
            
            const updatedRecord = await CompanyInteractionTracking.findOneAndUpdate(
                { publicId },
                { $set: update },
                {
                    arrayFilters: [
                        { "session._id": sessionId },
                        { "student._id": studentId }
                    ],
                    new: true
                }
            );

            if (!updatedRecord) {
                return res.status(404).json({ success: false, error: 'Record or specific student entry not found.' });
            }
            
            res.status(200).json({ success: true, message: "Update successful." });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to update feedback: ' + error.message });
        }
    }
};

export default companyInteractionTrackingController;
