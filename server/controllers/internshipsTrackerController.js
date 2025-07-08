// File Path: src/controllers/internshipsTrackerController.js

import mongoose from 'mongoose';
import InternshipMaster from '../models/InternshipMaster.js';
import TechStackRoadmapTracker from '../models/TechStackRoadmapTracker.js';
import CompanyStudentProgress from '../models/CompanyStudentProgress.js';
import StudentWiseProgress from '../models/StudentWiseProgress.js';

const sheetModels = {
    'internship-master': InternshipMaster,
    'tech-stack-roadmaps': TechStackRoadmapTracker,
    'companywise-students-progress': CompanyStudentProgress,
    'student-wise-progress': StudentWiseProgress,
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
//                  BULK CSV UPLOAD LOGIC
// =========================================================
export const bulkCreateSheetRows = async (req, res) => {
    const { sheetName } = req.params;
    const dataRows = req.body;
    const Model = getModel(sheetName);

    if (!Model) return res.status(404).json({ success: false, error: 'Subsheet not found' });
    if (!Array.isArray(dataRows) || dataRows.length === 0) return res.status(400).json({ success: false, error: 'No data rows provided.' });

    try {
        let documentsToInsert = [];

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
            // Group CSV rows by company name
            const companyDataMap = new Map();
            
            for (const row of dataRows) {
                const lcRow = transformKeysToLower(row);
                const companyName = lcRow.companies?.trim();
                
                if (!companyName) continue; // Skip rows without company name
                
                // Create or update company entry
                if (!companyDataMap.has(companyName)) {
                    companyDataMap.set(companyName, {
                        companies: companyName,
                        roles: lcRow.roles || '',
                        internshipOffers: Number(lcRow.offers) || 0,
                        companyStatus: lcRow.status || 'Active',
                        reasonInactive: lcRow['reason (inactive)'] || '',
                        studentMappingMethod: lcRow['mapping method'] || '',
                        studentMappingCounts: 0, // Will be auto-updated based on mappings length
                        mappings: []
                    });
                }
                
                const companyData = companyDataMap.get(companyName);
                
                // Create tech stack mapping - all fields now stored as strings
                const techMapping = {
                    mappingOffers: Number(lcRow['mapping offers']) || 0,
                    technologies: lcRow.technologies || '',
                    internshipStartDate: lcRow['internship start'] || '', // Store as string
                    stackCompletionDate: lcRow['stack completion'] || '', // Store as string
                    internshipDuration: lcRow['internship duration'] || '',
                    stipendPerMonth: lcRow['stipend per month'] || '', // Store as string
                    location: lcRow.location || '',
                    techProgress: (lcRow['tech stacks & progress'] || '').split(';').map(item => {
                        const parts = item.trim().split(/\s*\(\s*(\d+%?)\s*\)/);
                        const techStackName = parts[0].trim();
                        
                        // Parse progress or set to null
                        let manualProgress = null;
                        if (parts[1]) { // If a value in parentheses like (90%) was found
                            const progressValue = parseInt(parts[1].replace('%', '').trim());
                            if (!isNaN(progressValue)) {
                                manualProgress = progressValue;
                            }
                        }
                        
                        return {
                            techStackName,
                            manualProgress // Will be a number or null
                        };
                    }).filter(tp => tp.techStackName)
                };
                
                companyData.mappings.push(techMapping);
            }
            
            // Convert map to array and set the correct mapping count
            documentsToInsert = Array.from(companyDataMap.values()).map(company => {
                company.studentMappingCounts = company.mappings.length;
                return company;
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
        else {
            // For any other sheet, just use the body as is
            documentsToInsert = dataRows;
        }

        if (documentsToInsert.length > 0) {
            await Model.insertMany(documentsToInsert, { ordered: false }); // {ordered: false} continues on error
        }

        return res.status(200).json({ success: true, message: `Successfully inserted ${documentsToInsert.length} records for "${sheetName}".` });
        
    } catch (error) {
        console.error(`Error during bulk upload for ${sheetName}:`, error);
        res.status(500).json({ success: false, error: 'Bulk upload failed: ' + error.message });
    }
};

// =========================================================
//                MANUAL ENTRY LOGIC
// =========================================================
export const createSheetRow = async (req, res) => {
    const sheetName = req.params.sheetName; 
    const Model = getModel(sheetName);
    if (!Model) { return res.status(404).json({ success: false, error: 'Subsheet not found' }); }
    
    try {
        let data = req.body;
        const newRow = await Model.create(data);
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
//            OTHER FUNCTIONS
// =========================================================
export const getSheetData = async (req, res) => {
    const Model = getModel(req.params.sheetName);
    if (!Model) { return res.status(404).json({ success: false, error: 'Subsheet not found' }); }
    try { 
        const data = await Model.find().sort({ createdAt: -1 }); 
        res.status(200).json({ success: true, data }); 
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message }); 
    }
};

export const updateSheetRow = async (req, res) => {
    const sheetName = req.params.sheetName;
    const Model = getModel(sheetName);
    if (!Model) { return res.status(404).json({ success: false, error: 'Subsheet not found' }); }
    
    try {
        let data = req.body;
        const updatedRow = await Model.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
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
    try { 
        await Model.deleteMany({}); 
        res.status(200).json({ success: true, message: 'All data for this sheet has been deleted.' }); 
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message }); 
    }
};
