// import InternshipMaster from '../models/InternshipMaster.js';
// import TechStackRoadmapTracker from '../models/TechStackRoadmapTracker.js';
// import CompanyStudentProgress from '../models/CompanyStudentProgress.js';
// import StackToCompanyMapping from '../models/StackToCompanyMapping.js';
// import StudentWiseProgress from '../models/StudentWiseProgress.js';
// import CriticalPoints from '../models/CriticalPoints.js';

// const sheetModels = {
//     'internship-master': InternshipMaster,
//     'tech-stack-roadmaps': TechStackRoadmapTracker,
//     'companywise-students-progress': CompanyStudentProgress,
//     'stack-to-company-mapping': StackToCompanyMapping,
//     'student-wise-progress': StudentWiseProgress,
//     'critical-points': CriticalPoints
// };

// const getModel = (sheetName) => {
//     return sheetModels[sheetName];
// };

// export const getSheetData = async (req, res) => {
//     const Model = getModel(req.params.sheetName);
//     if (!Model) {
//         return res.status(404).json({ success: false, error: 'Subsheet not found' });
//     }
//     try {
//         const data = await Model.find().sort({ createdAt: 'desc' });
//         res.status(200).json({ success: true, data });
//     } catch (error) {
//         res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
//     }
// };

// export const createSheetRow = async (req, res) => {
//     const Model = getModel(req.params.sheetName);
//     if (!Model) {
//         return res.status(404).json({ success: false, error: 'Subsheet not found' });
//     }
//     try {
//         // --- START OF FIX: Replaced Model.create with findOneAndUpdate for "upsert" ---
//         const { companyName, roleName, niatId } = req.body;
        
//         // Define the query to find a unique document. Use NIAT ID if present.
//         const query = { companyName, roleName, niatId };

//         // We only want a unique student per company/role if the NIAT ID is provided.
//         // If NIAT ID is blank, we can't guarantee uniqueness, so we treat it as a new entry.
//         if (!niatId || niatId.trim() === '') {
//              const newRow = await Model.create(req.body);
//              return res.status(201).json({ success: true, data: newRow });
//         }

//         const updatedOrCreatedRow = await Model.findOneAndUpdate(
//             query, // The fields that make the document unique
//             req.body, // The data to insert or update with
//             {
//                 new: true,          // Return the modified document rather than the original
//                 upsert: true,       // Create a new document if one doesn't match the query
//                 runValidators: true // Ensure new/updated data adheres to schema rules
//             }
//         );
//         // --- END OF FIX ---
        
//         res.status(201).json({ success: true, data: updatedOrCreatedRow });
//     } catch (error) {
//         res.status(400).json({ success: false, error: 'Failed to create or update row: ' + error.message });
//     }
// };

// export const updateSheetRow = async (req, res) => {
//     const Model = getModel(req.params.sheetName);
//     if (!Model) {
//         return res.status(404).json({ success: false, error: 'Subsheet not found' });
//     }
//     try {
//         const updatedRow = await Model.findByIdAndUpdate(req.params.id, req.body, {
//             new: true,
//             runValidators: true,
//         });
//         if (!updatedRow) {
//             return res.status(404).json({ success: false, error: 'Row not found' });
//         }
//         res.status(200).json({ success: true, data: updatedRow });
//     } catch (error) {
//         res.status(400).json({ success: false, error: 'Failed to update row: ' + error.message });
//     }
// };

// export const deleteSheetRow = async (req, res) => {
//     const Model = getModel(req.params.sheetName);
//     if (!Model) {
//         return res.status(404).json({ success: false, error: 'Subsheet not found' });
//     }
//     try {
//         const deletedRow = await Model.findByIdAndDelete(req.params.id);
//         if (!deletedRow) {
//             return res.status(404).json({ success: false, error: 'Row not found' });
//         }
//         res.status(200).json({ success: true, data: {} });
//     } catch (error) {
//         res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
//     }
// };

// export const deleteSheetData = async (req, res) => {
//     const Model = getModel(req.params.sheetName);
//     if (!Model) {
//         return res.status(404).json({ success: false, error: 'Subsheet not found' });
//     }
//     try {
//         await Model.deleteMany({});
//         res.status(200).json({ success: true, message: 'All data for this sheet has been deleted.' });
//     } catch (error) {
//         res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
//     }
// };

// server/controllers/internshipsTrackerController.js
import mongoose from 'mongoose';
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

const getModel = (sheetName) => sheetModels[sheetName];

const transformKeysToLower = (obj) => {
    const newObj = {};
    for (const key in obj) {
        newObj[key.toLowerCase().trim()] = obj[key];
    }
    return newObj;
};

// =========================================================
//                  BULK CSV UPLOAD LOGIC (MODIFIED)
// =========================================================
export const bulkCreateSheetRows = async (req, res) => {
    const { sheetName } = req.params;
    const dataRows = req.body;
    const Model = getModel(sheetName);

    if (!Model) return res.status(404).json({ success: false, error: 'Subsheet not found' });
    if (!Array.isArray(dataRows) || dataRows.length === 0) return res.status(400).json({ success: false, error: 'No data rows provided.' });

    try {
        let documentsToInsert = [];

        // >> CHANGE: All logic now leads to a simple `documentsToInsert` array.
        // No more `updateOne` with `upsert`. We are only doing `insertMany`.

        if (sheetName === 'companywise-students-progress') {
             // For both manual structured data and flat CSV, we just create.
             // Manual data is already structured correctly.
            if (dataRows[0] && Array.isArray(dataRows[0].techAssignments)) {
                 documentsToInsert = dataRows;
            } else {
                 // Logic for flat CSV data
                const studentDataMap = new Map();
                for (const row of dataRows) {
                    // This logic remains the same to aggregate data from CSV
                    const lcRow = transformKeysToLower(row);
                    const niatId = lcRow['niat id'] || `TEMP-${Date.now()}-${Math.random()}`; // Handle cases without NIAT ID
                    const key = `${lcRow['company name']}|${lcRow['role name']}|${niatId}`.trim().toLowerCase();
    
                    if (!studentDataMap.has(key)) {
                        studentDataMap.set(key, {
                            companyName: lcRow['company name'], roleName: lcRow['role name'],
                            noOfOffers: lcRow['no of offers'],
                            roleDeadline: lcRow['role deadline'] ? new Date(lcRow['role deadline']) : null,
                            niatId: lcRow['niat id'], studentName: lcRow['student name'],
                            completionStatus: lcRow['completion status'] || 'In Progress',
                            techAssignments: [],
                        });
                    }
                    const studentData = studentDataMap.get(key);
                    const techStackName = lcRow['tech stack name'];
                    if (techStackName) {
                        studentData.techAssignments.push({
                            techStackName: techStackName,
                            deadline: lcRow['tech stack deadline'] ? new Date(lcRow['tech stack deadline']) : null,
                        });
                    }
                }
                documentsToInsert = Array.from(studentDataMap.values());
            }
        } 
        else if (sheetName === 'internship-master') {
            documentsToInsert = dataRows.map(row => {
                const lcRow = transformKeysToLower(row);
                return {
                    companies: lcRow.companies, roles: lcRow.roles, internshipOffers: lcRow.offers,
                    companyStatus: lcRow.status, reasonInactive: lcRow['reason (inactive)'],
                    studentMappingMethod: lcRow['mapping method'], studentMappingCounts: lcRow['mapping counts'],
                    internshipStartDate: lcRow['internship start'] ? new Date(lcRow['internship start']) : null,
                    stackCompletionDate: lcRow['stack completion'] ? new Date(lcRow['stack completion']) : null,
                    techProgress: (lcRow['tech stacks & progress'] || '').split(';').map(name => ({ techStackName: name.trim() })).filter(tp => tp.techStackName)
                };
            });
        }
        else if (sheetName === 'tech-stack-roadmaps') {
             documentsToInsert = dataRows.map(row => {
                const lcRow = transformKeysToLower(row);
                return {
                    techStack: lcRow['tech stack'], techStackRp: lcRow['tech stack rp'],
                    instructors: (lcRow.instructors || '').split(';').map(name => name.trim()).filter(Boolean),
                    roadmapLink: lcRow['roadmap link'], deadline: lcRow['techstack deadline'] ? new Date(lcRow['techstack deadline']) : null,
                    progress: lcRow['techstack progress'] ? parseInt(lcRow['techstack progress'], 10) : 0, version: lcRow.version,
                    versionRemarks: lcRow['version history remarks'], assignment25: lcRow['25% completion assignment'],
                    assignment50: lcRow['50% completion assignment'], assignment75: lcRow['75% completion assignment'],
                    assignment100: lcRow['100% completion assignment'], roadmapApproval: lcRow['roadmap approval from company (before starting the training)'],
                    companyAssignments: lcRow['conducting company assignments (ask for 2 assignments a month)'],
                    aseMockInterview: lcRow['ase mock interview (after 50% & 100%) completion'],
                    externalMockInterview: lcRow['external mock interview (after 100% completion)']
                };
            });
        }
        else if (sheetName === 'student-wise-progress') {
            documentsToInsert = dataRows.map(row => {
                 const lcRow = transformKeysToLower(row);
                 return { uuid: lcRow.uuid, niatId: lcRow['niat id'], studentName: lcRow['student name'], company: lcRow.company, role: lcRow.role };
            });
        }
        else if (sheetName === 'critical-points') {
            documentsToInsert = dataRows.map(row => {
                const lcRow = transformKeysToLower(row);
                return {
                    company: lcRow.company, role: lcRow.role, roadmapReviewByCompany: lcRow['roadmap review by company'],
                    roadmapChangesStatus: lcRow['roadmap changes status'], fortnightInteractionStatus: lcRow['fortnight interaction status'],
                    fortnightInteractionRemarks: lcRow['fortnight interaction remarks'], feedbackFromCompany: lcRow['feedback from company'],
                    assignmentGivenByCompany: lcRow['assignment given by company'], feedbackImplementationStatus: lcRow['feedback implementation status'],
                    feedbackImplementationRemarks: lcRow['feedback implementation remarks']
                };
            });
        } else {
            // For any other sheet, just use the body as is
            documentsToInsert = dataRows;
        }

        if (documentsToInsert.length > 0) {
            // >> CHANGE: Use insertMany to always create new documents <<
            await Model.insertMany(documentsToInsert, { ordered: false }); // {ordered: false} continues on error
        }

        return res.status(200).json({ success: true, message: `Successfully inserted ${documentsToInsert.length} records for "${sheetName}".` });
        
    } catch (error) {
        console.error(`Error during bulk upload for ${sheetName}:`, error);
        res.status(500).json({ success: false, error: 'Bulk upload failed: ' + error.message });
    }
};

// =========================================================
//                MANUAL ENTRY LOGIC (MODIFIED)
// =========================================================
export const createSheetRow = async (req, res) => {
    const sheetName = req.params.sheetName; 
    const Model = getModel(sheetName);
    if (!Model) { return res.status(404).json({ success: false, error: 'Subsheet not found' }); }
    try {
        // >> CHANGE: All manual additions now use `Model.create`. <<
        // This removes all 'update if exists' logic.
        const newRow = await Model.create(req.body);
        return res.status(201).json({ success: true, data: newRow });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: `Validation Error: ${messages.join(', ')}` });
        }
        res.status(400).json({ success: false, error: 'Failed to create row: ' + error.message });
    }
};

// =========================================================
//            OTHER FUNCTIONS (UNCHANGED)
// =========================================================
export const getSheetData = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) { return res.status(404).json({ success: false, error: 'Subsheet not found' }); }
    try { const data = await Model.find().sort({ createdAt: -1 }); res.status(200).json({ success: true, data }); } catch (error) { res.status(500).json({ success: false, error: 'Server Error: ' + error.message }); }
};

export const updateSheetRow = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) { return res.status(404).json({ success: false, error: 'Subsheet not found' }); }
    try {
        const updatedRow = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedRow) { return res.status(404).json({ success: false, error: 'Row not found' }); }
        res.status(200).json({ success: true, data: updatedRow });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Failed to update row: ' + error.message });
    }
};

export const deleteSheetRow = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) { return res.status(404).json({ success: false, error: 'Subsheet not found' }); }
    try {
        const deletedRow = await Model.findByIdAndDelete(req.params.id);
        if (!deletedRow) { return res.status(404).json({ success: false, error: 'Row not found' }); }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};

export const deleteSheetData = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) { return res.status(404).json({ success: false, error: 'Subsheet not found' }); }
    try { await Model.deleteMany({}); res.status(200).json({ success: true, message: 'All data for this sheet has been deleted.' }); } catch (error) { res.status(500).json({ success: false, error: 'Server Error: ' + error.message }); }
};
