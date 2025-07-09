// server/controllers/overallHubController.js
import OverallHubStatus from '../models/OverallHubStatus.js';
import PostInternship from '../models/PostInternship.js';
import { AseRating } from '../models/StudentRatings.js';

// Controller to get all saved statuses
export const getAllStatuses = async (req, res) => {
    try {
        const statuses = await OverallHubStatus.find({});
        res.status(200).json({ success: true, data: statuses });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};

// Controller to update (or create) a student's overall status
export const updateOverallStatus = async (req, res) => {
    const { companyName, niatId, studentName, newStatus } = req.body;

    // --- MODIFICATION: The check for 'newStatus' has been removed ---
    // This allows an empty string '' (from "- Select -") to be passed,
    // which is a valid state for un-hiring a student.
    if (!companyName || !niatId) {
        return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    try {
        // Use findOneAndUpdate with upsert: true to create or update the record
        const hubStatus = await OverallHubStatus.findOneAndUpdate(
            { companyName, niatId },
            { $set: { studentName, overallStatus: newStatus } },
            { new: true, upsert: true, runValidators: true }
        );

        // --- AUTOMATED WORKFLOW FOR POST-INTERNSHIP ---
        const postInternshipQuery = { companyName, niatId };

        if (newStatus === 'Hired') {
            // Find any existing ASE rating to pull additional details
            const aseRecord = await AseRating.findOne({ companyName, niatId }).sort({ createdAt: -1 });

            // Use the techStack as the role for the Post-Internship page.
            const roleForPostInternship = aseRecord?.techStack || 'N/A';

            // Create or update a PostInternship record with the techStack as the role.
            await PostInternship.findOneAndUpdate(
                postInternshipQuery,
                { $set: { studentName: studentName, role: roleForPostInternship } }, 
                { upsert: true, new: true, runValidators: true }
            );
        } else {
            // If the status is not "Hired" (e.g., Hold, Reject, or cleared),
            // delete any existing post-internship record. This handles the un-hiring case.
            await PostInternship.deleteOne(postInternshipQuery);
        }

        res.status(200).json({ success: true, data: hubStatus });

    } catch (error) {
        console.error('Error updating overall status:', error);
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};
