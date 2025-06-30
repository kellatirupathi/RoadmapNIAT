// // server/controllers/roadmapController.js
// import Roadmap from '../models/Roadmap.js';
// import TechStack from '../models/TechStack.js'; // Ensure this is imported

// // Get all roadmaps
// export const getAllRoadmaps = async (req, res) => {
//   try {
//     let query = {}; // Default: fetch all (for admin/manager)

//     // If the logged-in user is a CRM role, filter by their username
//     // This req.user is now available because of the 'protect' middleware on the route
//     if (req.user && req.user.role === 'crm') {
//       query = { crmAffiliation: req.user.username };
//       console.log(`CRM user ${req.user.username} is fetching roadmaps. Query:`, query); // For debugging
//     } else if (req.user) {
//       console.log(`User ${req.user.username} (role: ${req.user.role}) is fetching all roadmaps.`); // For debugging
//     } else {
//       // This case should not happen if 'protect' middleware is active
//       console.warn('getAllRoadmaps called without req.user. This indicates a middleware issue.');
//       return res.status(401).json({ success: false, error: 'Not authenticated' });
//     }

//     const roadmaps = await Roadmap.find(query)
//       .sort({ createdDate: -1 })
//       .populate({
//         path: 'roles.techStacks', // Populate the techStacks field within each object in the roles array
//         select: 'name' // Only select the 'name' field from the TechStack documents
//       });
    
//     res.status(200).json({
//       success: true,
//       count: roadmaps.length,
//       data: roadmaps
//     });
//   } catch (error) {
//     console.error('Error in getAllRoadmaps:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// // Get a specific roadmap by ID
// export const getRoadmapById = async (req, res) => {
//   try {
//     const roadmap = await Roadmap.findById(req.params.id)
//       .populate({
//         path: 'roles.techStacks',
//         select: 'name'
//       });
    
//     if (!roadmap) {
//       return res.status(404).json({
//         success: false,
//         error: 'Roadmap not found'
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       data: roadmap
//     });
//   } catch (error) {
//     console.error('Error in getRoadmapById:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// // Create a new roadmap
// export const createRoadmap = async (req, res) => {
//   try {
//     let roadmapData = { ...req.body }; // Make a mutable copy

//     // Ensure crmAffiliation is set to null if it's an empty string
//     if (roadmapData.crmAffiliation === '') {
//       roadmapData.crmAffiliation = null;
//     }

//     if (roadmapData.isConsolidated && roadmapData.roles && roadmapData.roles.length > 0) {
//       for (let i = 0; i < roadmapData.roles.length; i++) {
//         const role = roadmapData.roles[i];
//         if (role.techStacks && Array.isArray(role.techStacks) && role.techStacks.every(tsName => typeof tsName === 'string')) {
//           const techStackDocs = await TechStack.find({ name: { $in: role.techStacks } }, '_id name');
//           const nameToIdMap = new Map();
//           techStackDocs.forEach(doc => nameToIdMap.set(doc.name, doc._id));

//           const originalNamesForThisRole = [...role.techStacks];
//           const resolvedTechStackIds = originalNamesForThisRole
//             .map(name => nameToIdMap.get(name))
//             .filter(id => id); // Filter out undefined (names not found)

//           if (resolvedTechStackIds.length !== originalNamesForThisRole.length) {
//             const foundNames = techStackDocs.map(d => d.name);
//             const missingNames = originalNamesForThisRole.filter(name => !foundNames.includes(name));
//             console.warn(`Not all tech stack names converted to IDs for role "${role.title}". Missing: ${missingNames.join(', ')}. Original: ${originalNamesForThisRole.join(', ')}, Found IDs: ${resolvedTechStackIds.join(', ')}`);
//           }
//           roadmapData.roles[i].techStacks = resolvedTechStackIds; // Update the techStacks with ObjectIds
//         }
//       }
//     } else if (!roadmapData.isConsolidated) {
//       roadmapData.roles = []; // Ensure roles array is empty for single-role roadmaps
//     }


//     const newRoadmap = await Roadmap.create(roadmapData);
    
//     const populatedRoadmap = await Roadmap.findById(newRoadmap._id)
//       .populate({
//         path: 'roles.techStacks',
//         select: 'name _id' 
//       });

//     res.status(201).json({
//       success: true,
//       data: populatedRoadmap
//     });

//   } catch (error) {
//     console.error('Error in createRoadmap:', error.message, error.stack);
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(val => val.message);
//       return res.status(400).json({
//         success: false,
//         error: messages.join(', ')
//       });
//     }
//     res.status(500).json({
//       success: false,
//       error: 'Server Error: ' + error.message
//     });
//   }
// };

// // Update a roadmap
// export const updateRoadmap = async (req, res) => {
//   try {
//     let updateData = { ...req.body }; 

//     if (updateData.crmAffiliation === '') {
//         updateData.crmAffiliation = null;
//     } else if (updateData.crmAffiliation === undefined && !('crmAffiliation' in req.body)) {
//         // If crmAffiliation is not explicitly in the request body (i.e., client didn't send it)
//         // delete it from updateData to prevent Mongoose from trying to set it to undefined or null
//         delete updateData.crmAffiliation;
//     }


//     if (updateData.isConsolidated && updateData.roles && updateData.roles.length > 0) {
//       for (let i = 0; i < updateData.roles.length; i++) {
//         const role = updateData.roles[i];
//         if (role.techStacks && Array.isArray(role.techStacks) && role.techStacks.every(tsNameOrId => typeof tsNameOrId === 'string')) {
//           const techStackDocs = await TechStack.find({ name: { $in: role.techStacks } }, '_id name');
//           const nameToIdMap = new Map();
//           techStackDocs.forEach(doc => nameToIdMap.set(doc.name, doc._id));
          
//           const originalNamesForThisRole = [...role.techStacks];
//           const resolvedTechStackIds = originalNamesForThisRole
//             .map(name => nameToIdMap.get(name))
//             .filter(id => id);

//           if (resolvedTechStackIds.length !== originalNamesForThisRole.length) {
//              const foundNames = techStackDocs.map(d => d.name);
//              const missingNames = originalNamesForThisRole.filter(name => !foundNames.includes(name));
//              console.warn(`During update, not all tech stack names converted to IDs for role "${role.title}". Missing: ${missingNames.join(', ')}.`);
//           }
//           updateData.roles[i].techStacks = resolvedTechStackIds;
//         } else if (role.techStacks && Array.isArray(role.techStacks) && role.techStacks.every(tsObj => typeof tsObj === 'object' && tsObj._id)) {
//           updateData.roles[i].techStacks = role.techStacks.map(tsObj => tsObj._id);
//         }
//       }
//     } else if (updateData.hasOwnProperty('isConsolidated') && updateData.isConsolidated === false) {
//         updateData.roles = [];
//     }


//     const updatedRoadmap = await Roadmap.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     ).populate({ path: 'roles.techStacks', select: 'name _id' });
    
//     if (!updatedRoadmap) {
//       return res.status(404).json({
//         success: false,
//         error: 'Roadmap not found'
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       data: updatedRoadmap
//     });
//   } catch (error) {
//     console.error('Error in updateRoadmap:', error.message, error.stack);
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(val => val.message);
//       return res.status(400).json({
//         success: false,
//         error: messages.join(', ')
//       });
//     }
//     res.status(500).json({
//       success: false,
//       error: 'Server Error: ' + error.message
//     });
//   }
// };

// // Delete a roadmap
// export const deleteRoadmap = async (req, res) => {
//   try {
//     const roadmap = await Roadmap.findByIdAndDelete(req.params.id);
    
//     if (!roadmap) {
//       return res.status(404).json({
//         success: false,
//         error: 'Roadmap not found'
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       data: {}
//     });
//   } catch (error) {
//     console.error('Error in deleteRoadmap:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// // Get roadmaps by company name
// export const getRoadmapsByCompany = async (req, res) => {
//   try {
//     const roadmaps = await Roadmap.find({ 
//       companyName: { $regex: req.params.companyName, $options: 'i' } 
//     })
//     .sort({ createdDate: -1 })
//     .populate({ path: 'roles.techStacks', select: 'name' });
    
//     res.status(200).json({
//       success: true,
//       count: roadmaps.length,
//       data: roadmaps
//     });
//   } catch (error) {
//     console.error('Error in getRoadmapsByCompany:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// // Get roadmaps by role
// export const getRoadmapsByRole = async (req, res) => {
//   try {
//     const roadmaps = await Roadmap.find({ 
//       $or: [
//         { role: { $regex: req.params.role, $options: 'i' } },
//         { 'roles.title': { $regex: req.params.role, $options: 'i' } }
//       ]
//     })
//     .sort({ createdDate: -1 })
//     .populate({ path: 'roles.techStacks', select: 'name' });
    
//     res.status(200).json({
//       success: true,
//       count: roadmaps.length,
//       data: roadmaps
//     });
//   } catch (error) {
//     console.error('Error in getRoadmapsByRole:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// // Get consolidated roadmaps
// export const getConsolidatedRoadmaps = async (req, res) => {
//   try {
//     const roadmaps = await Roadmap.find({ isConsolidated: true })
//     .sort({ createdDate: -1 })
//     .populate({ path: 'roles.techStacks', select: 'name' });
    
//     res.status(200).json({
//       success: true,
//       count: roadmaps.length,
//       data: roadmaps
//     });
//   } catch (error) {
//     console.error('Error in getConsolidatedRoadmaps:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };


// server/controllers/roadmapController.js
import Roadmap from '../models/Roadmap.js';
import TechStack from '../models/TechStack.js';
import { generateRoadmapHtml } from '../utils/roadmapHtmlGenerator.js';
import { uploadRoadmap as callUploadToGithub } from './githubController.js'; // Renamed import for clarity

// Internal helper to create the tech stack copy structure
const createTechStackCopies = async (techStackNames) => {
    if (!techStackNames || techStackNames.length === 0) return [];
    
    const techStackDocs = await TechStack.find({ name: { $in: techStackNames } }).lean(); // Use .lean() for plain JS objects
    
    // Create a map for quick lookups
    const techStackMap = new Map(techStackDocs.map(doc => [doc.name, doc]));
    
    // Build the copies, ensuring the order matches the selection if possible
    const copies = techStackNames.map(name => {
      const original = techStackMap.get(name);
      if (!original) {
        console.warn(`Warning: Tech stack template "${name}" not found during copy operation.`);
        return null;
      }
      return {
        originalId: original._id,
        name: original.name,
        description: original.description,
        headers: original.headers,
        roadmapItems: JSON.parse(JSON.stringify(original.roadmapItems)) // Deep copy
      };
    }).filter(copy => copy !== null); // Filter out any not found
  
    return copies;
};
  

// Create a new roadmap
export const createRoadmap = async (req, res) => {
    try {
      let { companyName, role, isConsolidated, roles, crmAffiliation, publishedUrl, filename } = req.body;
  
      let roadmapData = { companyName, isConsolidated, crmAffiliation: crmAffiliation || null, publishedUrl, filename };
      
      if (isConsolidated) {
        // Handle consolidated roadmap: copy tech stacks for each role
        roadmapData.role = "Consolidated"; // Set main role field for clarity
        const processedRoles = await Promise.all(roles.map(async (roleDetail) => {
          const techStackCopies = await createTechStackCopies(roleDetail.techStacks || []);
          return {
            title: roleDetail.title,
            techStacks: techStackCopies
          };
        }));
        roadmapData.roles = processedRoles;
        roadmapData.techStacks = []; // Not used for consolidated, clear it
      } else {
        // Handle single role roadmap
        const techStackCopies = await createTechStackCopies(req.body.techStacks || []);
        roadmapData.role = role;
        roadmapData.techStacks = techStackCopies;
        roadmapData.roles = []; // Not used for single role
      }
  
      const newRoadmap = await Roadmap.create(roadmapData);
      
      res.status(201).json({
        success: true,
        data: newRoadmap
      });
  
    } catch (error) {
      console.error('Error in createRoadmap:', error);
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, error: messages.join(', ') });
      }
      res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};

// Update a roadmap (this now handles re-publishing to GitHub)
export const updateRoadmap = async (req, res) => {
    try {
      const roadmapId = req.params.id;
      const roadmapToUpdate = await Roadmap.findById(roadmapId);
  
      if (!roadmapToUpdate) {
        return res.status(404).json({ success: false, error: 'Roadmap not found' });
      }
  
      const updateData = { ...req.body };
  
      // --- RE-GENERATE & RE-PUBLISH HTML ---
      const htmlRoles = [];
      const allTechStacks = [];
      
      if (updateData.isConsolidated) {
        updateData.roles.forEach(role => {
            htmlRoles.push({ title: role.title, techStacks: role.techStacks });
            allTechStacks.push(...role.techStacks);
        });
      } else {
        htmlRoles.push({ title: updateData.role, techStacks: updateData.techStacks });
        allTechStacks.push(...updateData.techStacks);
      }
  
      const htmlContent = generateRoadmapHtml(updateData.companyName, htmlRoles, allTechStacks);
      
      const githubPayload = {
        filename: updateData.filename.endsWith('.html') ? updateData.filename : `${updateData.filename}.html`,
        content: htmlContent,
        description: `Admin updated roadmap for ${updateData.companyName}`
      };
      
      // We will fake a req/res object for the githubController
      let githubApiResponse = null;
      const fakeRes = {
        status: (code) => ({
          json: (data) => {
            if (code < 400) {
              githubApiResponse = data;
            } else {
              throw new Error(data.error || 'GitHub upload failed');
            }
          }
        })
      };
      await callUploadToGithub({ body: githubPayload }, fakeRes);

      if (!githubApiResponse || !githubApiResponse.html_url) {
        throw new Error("Failed to re-publish to GitHub during update.");
      }

      // Update the published URL and save to DB
      updateData.publishedUrl = githubApiResponse.html_url;

      const updatedRoadmap = await Roadmap.findByIdAndUpdate(roadmapId, updateData, { new: true, runValidators: true });
      
      res.status(200).json({
        success: true,
        data: updatedRoadmap
      });
  
    } catch (error) {
      console.error('Error in updateRoadmap:', error);
      res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};


// ----- Existing functions can be simplified as populate is no longer needed -----

// Get all roadmaps
export const getAllRoadmaps = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'crm') {
      query = { crmAffiliation: req.user.username };
    }
    
    // .populate() is no longer needed since data is embedded
    const roadmaps = await Roadmap.find(query).sort({ createdDate: -1 });
    
    res.status(200).json({
      success: true,
      count: roadmaps.length,
      data: roadmaps
    });
  } catch (error) {
    console.error('Error in getAllRoadmaps:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get a specific roadmap by ID
export const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, error: 'Roadmap not found' });
    }
    res.status(200).json({ success: true, data: roadmap });
  } catch (error) {
    console.error('Error in getRoadmapById:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


// Delete a roadmap
export const deleteRoadmap = async (req, res) => {
    try {
      const roadmap = await Roadmap.findByIdAndDelete(req.params.id);
      
      if (!roadmap) {
        return res.status(404).json({
          success: false,
          error: 'Roadmap not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      console.error('Error in deleteRoadmap:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
};


// (getRoadmapsByCompany, getRoadmapsByRole, getConsolidatedRoadmaps can be kept as is)
export const getRoadmapsByCompany = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ companyName: { $regex: req.params.companyName, $options: 'i' } }).sort({ createdDate: -1 });
    res.status(200).json({ success: true, count: roadmaps.length, data: roadmaps });
  } catch (error) { res.status(500).json({ success: false, error: 'Server Error' }); }
};

export const getRoadmapsByRole = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ $or: [ { role: { $regex: req.params.role, $options: 'i' } }, { 'roles.title': { $regex: req.params.role, $options: 'i' } }]}).sort({ createdDate: -1 });
    res.status(200).json({ success: true, count: roadmaps.length, data: roadmaps });
  } catch (error) { res.status(500).json({ success: false, error: 'Server Error' }); }
};

export const getConsolidatedRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ isConsolidated: true }).sort({ createdDate: -1 });
    res.status(200).json({ success: true, count: roadmaps.length, data: roadmaps });
  } catch (error) { res.status(500).json({ success: false, error: 'Server Error' }); }
};
