// server/controllers/techStackController.js
import TechStack from '../models/TechStack.js';
import Roadmap from '../models/Roadmap.js'; // Added for finding affected roadmaps
import { generateRoadmapHtml } from '../utils/roadmapHtmlGenerator.js'; // Added HTML generator utility
import fetch from 'node-fetch'; // Added for GitHub API calls
import dotenv from 'dotenv'; // Added for ENV VARS
import User from '../models/User.js'; // ** ADDED for permission check **
dotenv.config(); // Load ENV VARS

// Get all tech stacks (names only for dropdown)
export const getAllTechStacks = async (req, res) => {
  try {
    const techStacks = await TechStack.find({}, 'name');
    res.status(200).json({
      success: true,
      count: techStacks.length,
      data: techStacks
    });
  } catch (error) {
    console.error('Error in getAllTechStacks:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get a specific tech stack by ID
export const getTechStackById = async (req, res) => {
  try {
    const techStack = await TechStack.findById(req.params.id);
    
    if (!techStack) {
      return res.status(404).json({
        success: false,
        error: 'Tech stack not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: techStack
    });
  } catch (error) {
    console.error('Error in getTechStackById:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get a specific tech stack by name
export const getTechStackByName = async (req, res) => {
  try {
    // Decode the name from URL component
    const techStackName = decodeURIComponent(req.params.name);
    const techStack = await TechStack.findOne({ name: techStackName });
    
    if (!techStack) {
      return res.status(404).json({
        success: false,
        error: 'Tech stack not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: techStack
    });
  } catch (error) {
    console.error('Error in getTechStackByName:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create a new tech stack
export const createTechStack = async (req, res) => {
  try {
    const techStack = await TechStack.create(req.body);
    
    res.status(201).json({
      success: true,
      data: techStack
    });
  } catch (error) {
    console.error('Error in createTechStack:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Tech stack with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update a tech stack
export const updateTechStack = async (req, res) => {
  try {
    const techStack = await TechStack.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!techStack) {
      return res.status(404).json({
        success: false,
        error: 'Tech stack not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: techStack
    });
  } catch (error) {
    console.error('Error in updateTechStack:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Delete a tech stack
export const deleteTechStack = async (req, res) => {
  try {
    const techStack = await TechStack.findByIdAndDelete(req.params.id);
    
    if (!techStack) {
      return res.status(404).json({
        success: false,
        error: 'Tech stack not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteTechStack:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Delete all tech stacks
export const deleteAllTechStacks = async (req, res) => {
  try {
    // Delete all tech stacks from the database
    await TechStack.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: 'All tech stacks have been deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteAllTechStacks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete all tech stacks'
    });
  }
};

// Add a roadmap item to a tech stack
export const addRoadmapItem = async (req, res) => {
  try {
    const techStack = await TechStack.findById(req.params.id);
    
    if (!techStack) {
      return res.status(404).json({
        success: false,
        error: 'Tech stack not found'
      });
    }
    
    techStack.roadmapItems.push(req.body);
    await techStack.save();
    
    res.status(200).json({
      success: true,
      data: techStack
    });
  } catch (error) {
    console.error('Error in addRoadmapItem:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};


// Helper function to upload content to GitHub (adapted from githubController's logic)
const internalUploadToGithub = async ({ filename, content, message }) => {
  const GITHUB_API_URL = 'https://api.github.com';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
  const GITHUB_REPO = process.env.GITHUB_REPO;
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'; // Default to main if not set

  if (!GITHUB_TOKEN || !GITHUB_USERNAME || !GITHUB_REPO) {
    console.error('[GitHub Sync Service] GitHub environment variables (TOKEN, USERNAME, REPO) are not fully configured.');
    throw new Error('GitHub sync service is not configured on the server.');
  }

  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  const repoPath = `${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${filename}`;
  let sha; // To store SHA if file exists (for updating)

  try {
    const fileCheckRes = await fetch(repoPath, { headers });
    if (fileCheckRes.ok) {
      const fileData = await fileCheckRes.json();
      sha = fileData.sha; // Get SHA of existing file
    } else if (fileCheckRes.status !== 404) {
      // Handle other errors during file check (e.g., auth issues)
      const errorData = await fileCheckRes.json();
      console.error(`[GitHub Sync Service] Error checking file ${filename}: Status ${fileCheckRes.status}`, errorData);
      throw new Error(`GitHub API error checking file: ${errorData.message || fileCheckRes.statusText}`);
    }
    // If 404, file doesn't exist, sha remains undefined, proceed to create
  } catch (e) {
    console.warn(`[GitHub Sync Service] Could not check for existing file ${filename}. Assuming it's new. Error: ${e.message}`);
    // This might happen for network errors or if the API changes its 404 behavior.
  }

  const body = {
    message: message || `Update ${filename} via system`,
    content: Buffer.from(content).toString('base64'), // Content must be base64 encoded
    branch: GITHUB_BRANCH,
    ...(sha && { sha }), // Include SHA if updating an existing file
  };

  const uploadRes = await fetch(repoPath, { method: 'PUT', headers, body: JSON.stringify(body) });

  if (!uploadRes.ok) { // Checks for 200 or 201 for create/update
    const errData = await uploadRes.json();
    console.error(`[GitHub Sync Service] GitHub upload failed for ${filename}: Status ${uploadRes.status}`, errData);
    throw new Error(`GitHub upload failed: ${errData.message || uploadRes.statusText}`);
  }
  
  const responseData = await uploadRes.json();
  // Construct the GitHub Pages URL for convenience, though GitHub API itself gives `html_url` to the repo view
  const publishedPageUrl = `https://${GITHUB_USERNAME}.github.io/${GITHUB_REPO}/${filename}`;
  
  return {
    github_api_response: responseData, // Full response from GitHub API
    published_url: publishedPageUrl   // Easy access to GitHub Pages URL
  };
};


// Function to find and update affected GitHub roadmaps when a TechStack item changes
const syncGitHubRoadmapsForTechStack = async (updatedTechStackId) => {
  const updatedTechStack = await TechStack.findById(updatedTechStackId);
  if (!updatedTechStack) {
    console.error(`[GitHub Sync Service] TechStack with ID ${updatedTechStackId} not found. Cannot sync GitHub roadmaps.`);
    return;
  }

  console.log(`[GitHub Sync Service] Initiated for TechStack "${updatedTechStack.name}" (ID: ${updatedTechStackId}) due to item status change.`);

  // Find all roadmaps that include this tech stack
  // Note: 'roles.techStacks' stores ObjectIds of TechStacks. 'techStacks' for single-role roadmaps stores names.
  const affectedRoadmaps = await Roadmap.find({
    $or: [
      { techStacks: updatedTechStack.name, isConsolidated: false }, 
      { 'roles.techStacks': updatedTechStack._id, isConsolidated: true }
    ]
  }).populate({ // Populate to get names for techStacks in consolidated roles.
      path: 'roles.techStacks',
      select: 'name' // Only need the name for constructing `fullTechStacksDataForRoadmap` names array.
  });

  if (affectedRoadmaps.length === 0) {
    console.log(`[GitHub Sync Service] No published roadmaps found containing TechStack "${updatedTechStack.name}".`);
    return;
  }

  console.log(`[GitHub Sync Service] Found ${affectedRoadmaps.length} roadmaps to update for TechStack "${updatedTechStack.name}".`);

  for (const roadmap of affectedRoadmaps) {
    try {
      console.log(`[GitHub Sync Service] Processing roadmap "${roadmap.filename}" for company "${roadmap.companyName}"`);

      // 1. Collect all unique tech stack names required for THIS roadmap.
      let techStackNamesForThisRoadmap = new Set();
      if (roadmap.isConsolidated) {
        roadmap.roles.forEach(role => {
          role.techStacks.forEach(ts => {
            if(ts && ts.name) techStackNamesForThisRoadmap.add(ts.name); // ts here is populated {_id, name}
          });
        });
      } else {
        roadmap.techStacks.forEach(name => techStackNamesForThisRoadmap.add(name)); // These are already names
      }
      const uniqueTechStackNamesArray = Array.from(techStackNamesForThisRoadmap);
      
      // 2. Fetch full, up-to-date data for ALL these tech stacks.
      // This ensures the regenerated HTML uses the very latest version of *every* tech stack involved.
      const fullTechStacksDataForRoadmap = await TechStack.find({ name: { $in: uniqueTechStackNamesArray } });

      // 3. Prepare the 'roles' structure for generateRoadmapHtml
      // It needs [{ title: 'RoleName', techStacks: [FULL_TECHSTACK_OBJECT_WITH_ITEMS] }]
      let rolesForHtmlGeneration;
      if (roadmap.isConsolidated) {
        rolesForHtmlGeneration = roadmap.roles.map(roleDetail => {
          const techStacksForThisRoleInHtml = fullTechStacksDataForRoadmap.filter(fullTS => 
            roleDetail.techStacks.some(tsInRole => tsInRole.name === fullTS.name)
          );
          return {
            title: roleDetail.title,
            techStacks: techStacksForThisRoleInHtml
          };
        });
      } else { // Single role roadmap
        rolesForHtmlGeneration = [{
          title: roadmap.role, 
          techStacks: fullTechStacksDataForRoadmap // All fetched tech stacks belong to this single role
        }];
      }

      // 4. Generate new HTML content
      const htmlContent = generateRoadmapHtml(roadmap.companyName, rolesForHtmlGeneration, fullTechStacksDataForRoadmap);
      if (!htmlContent || htmlContent.trim() === "") {
        console.warn(`[GitHub Sync Service] HTML generation returned empty content for roadmap "${roadmap.filename}". Skipping GitHub update.`);
        continue; // Skip to the next roadmap
      }

      // 5. Re-upload to GitHub
      console.log(`[GitHub Sync Service] Uploading updated "${roadmap.filename}" to GitHub...`);
      await internalUploadToGithub({
        filename: roadmap.filename, // Assumes filename already includes .html extension
        content: htmlContent,
        message: `Automated content update reflecting changes in ${updatedTechStack.name} for ${roadmap.filename}`
      });
      console.log(`[GitHub Sync Service] Successfully updated "${roadmap.filename}" on GitHub.`);

    } catch (syncError) {
      console.error(`[GitHub Sync Service] Failed to update roadmap "${roadmap.filename}" on GitHub:`, syncError.message, syncError.stack);
      // Log this error persistently. Don't let one failure stop others.
    }
  }
  console.log(`[GitHub Sync Service] Finished GitHub synchronization for TechStack "${updatedTechStack.name}".`);
};

// Update a roadmap item in a tech stack
export const updateRoadmapItem = async (req, res) => {
  try {
    const techStack = await TechStack.findById(req.params.id);
    
    if (!techStack) {
      return res.status(404).json({
        success: false,
        error: 'Tech stack not found'
      });
    }
    
    const itemIndex = techStack.roadmapItems.findIndex(
      item => item._id.toString() === req.params.itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap item not found'
      });
    }
    
    techStack.roadmapItems[itemIndex] = {
      ...techStack.roadmapItems[itemIndex].toObject(), 
      ...req.body 
    };
    
    await techStack.save();
    const updatedParentTechStack = await TechStack.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: updatedParentTechStack
    });

    // Asynchronously update GitHub roadmaps after successful DB update & response
    syncGitHubRoadmapsForTechStack(req.params.id).catch(syncError => {
      console.error(
        `[Background GitHub Sync] Error after updating item ${req.params.itemId} in tech stack ${req.params.id}:`,
        syncError.message,
        syncError.stack
      );
      // Add more robust error logging/notification here if needed
    });

  } catch (error) {
    console.error('Error in updateRoadmapItem:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Delete a roadmap item from a tech stack
export const deleteRoadmapItem = async (req, res) => {
  try {
    const techStack = await TechStack.findById(req.params.id);
    
    if (!techStack) {
      return res.status(404).json({
        success: false,
        error: 'Tech stack not found'
      });
    }
    
    techStack.roadmapItems = techStack.roadmapItems.filter(
      item => item._id.toString() !== req.params.itemId
    );
    
    await techStack.save();
    
    res.status(200).json({
      success: true,
      data: techStack
    });

    // Asynchronously update GitHub roadmaps after successful DB update & response
    // (If deleting an item should also trigger a sync)
    syncGitHubRoadmapsForTechStack(req.params.id).catch(syncError => {
      console.error(
        `[Background GitHub Sync] Error after deleting item ${req.params.itemId} in tech stack ${req.params.id}:`,
        syncError.message,
        syncError.stack
      );
    });

  } catch (error) {
    console.error('Error in deleteRoadmapItem:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update a roadmap item's scheduled date
export const updateRoadmapItemSchedule = async (req, res) => {
  try {
    const { id: techStackId, itemId } = req.params;
    const { scheduledDate } = req.body; // Expecting "YYYY-MM-DD" or null

    // Validate scheduledDate if provided
    if (scheduledDate !== null && scheduledDate !== undefined && scheduledDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Please use YYYY-MM-DD or null.',
      });
    }

    // Check instructor's assignment
    const instructor = await User.findById(req.user.id).select('assignedTechStacks');
    if (req.user.role !== 'admin' && (!instructor || !instructor.assignedTechStacks.map(id => id.toString()).includes(techStackId))) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to schedule items for this tech stack.'
      });
    }

    const techStack = await TechStack.findById(techStackId);
    if (!techStack) {
      return res.status(404).json({ success: false, error: 'Tech stack not found' });
    }

    const item = techStack.roadmapItems.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Roadmap item not found' });
    }

    item.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    
    // Explicitly mark as modified if it's a mixed type or Mongoose has trouble detecting
    // For Date types, direct assignment should work fine.
    // techStack.markModified('roadmapItems'); // Usually not needed for direct subdocument property update

    await techStack.save();

    // Return the updated tech stack or just the specific item for less data transfer
    // For consistency with updateRoadmapItem, returning the whole stack
    const updatedParentTechStack = await TechStack.findById(techStackId);

    res.status(200).json({ success: true, data: updatedParentTechStack });

    // Optionally, trigger GitHub sync if scheduledDate change affects published roadmaps
    // For now, focusing on status updates triggering sync. Schedule sync could be added if required.
    // syncGitHubRoadmapsForTechStack(techStackId).catch(syncError => {
    //   console.error(
    //     `[Background GitHub Sync] Error after updating schedule for item ${itemId} in tech stack ${techStackId}:`,
    //     syncError.message
    //   );
    // });

  } catch (error) {
    console.error('Error updating roadmap item schedule:', error);
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};