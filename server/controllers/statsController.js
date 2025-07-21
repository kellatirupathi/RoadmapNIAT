// // server/controllers/statsController.js
// import TechStack from '../models/TechStack.js';
// import Roadmap from '../models/Roadmap.js';
// import User from '../models/User.js';
// import ActivityLog from '../models/ActivityLog.js';
// import Comment from '../models/Comment.js';
// import mongoose from 'mongoose';


// // Helper function to get date ranges
// const getDateRange = (period, dateParam) => {
//   let date;
  
//   // Use provided date or default to current date
//   if (dateParam) {
//     date = new Date(dateParam);
//     // If invalid date, use current date
//     if (isNaN(date.getTime())) {
//       date = new Date();
//     }
//   } else {
//     date = new Date();
//   }
  
//   // Create start and end dates based on period
//   let startDate, endDate;
  
//   if (period === 'daily') {
//     // Set to start of day
//     startDate = new Date(date.setHours(0, 0, 0, 0));
//     // End of day
//     endDate = new Date(new Date(startDate).setHours(23, 59, 59, 999));
//   } else if (period === 'weekly') {
//     // Start of week (Sunday)
//     const day = date.getDay();
//     startDate = new Date(date);
//     startDate.setDate(date.getDate() - day);
//     startDate.setHours(0, 0, 0, 0);
    
//     // End of week (Saturday)
//     endDate = new Date(startDate);
//     endDate.setDate(startDate.getDate() + 6);
//     endDate.setHours(23, 59, 59, 999);
//   } else if (period === 'monthly') {
//     // Start of month
//     startDate = new Date(date.getFullYear(), date.getMonth(), 1);
//     // End of month
//     endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
//   } else {
//     // Default to daily
//     startDate = new Date(date.setHours(0, 0, 0, 0));
//     endDate = new Date(new Date(startDate).setHours(23, 59, 59, 999));
//   }
  
//   return { startDate, endDate };
// };

// // Get techstack statistics (status counts, progress)
// export const getTechStackStats = async (req, res) => {
//     try {
//       const { period, date } = req.query;
      
//       // Get all tech stacks
//       const techStacks = await TechStack.find();
      
//       // Calculate overall statistics
//       let totalItems = 0;
//       let completedItems = 0;
//       let inProgressItems = 0;
//       let notStartedItems = 0;
      
//       // Process each tech stack
//       techStacks.forEach(techStack => {
//         techStack.roadmapItems.forEach(item => {
//           totalItems++;
          
//           if (item.completionStatus === 'Completed') {
//             completedItems++;
//           } else if (item.completionStatus === 'In Progress') {
//             inProgressItems++;
//           } else {
//             notStartedItems++;
//           }
//         });
//       });
      
//       // Calculate percentages
//       const stats = {
//         total: totalItems,
//         completed: {
//           count: completedItems,
//           percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
//         },
//         inProgress: {
//           count: inProgressItems,
//           percentage: totalItems > 0 ? Math.round((inProgressItems / totalItems) * 100) : 0
//         },
//         notStarted: {
//           count: notStartedItems,
//           percentage: totalItems > 0 ? Math.round((notStartedItems / totalItems) * 100) : 0
//         },
//         techStackCount: techStacks.length
//       };
      
//       // Get recent activity
//       const { startDate, endDate } = getDateRange(period || 'daily', date);
      
//       // Get status changes in the period
//       const recentStatusChanges = await ActivityLog.find({
//         action: 'update_status',
//         timestamp: { $gte: startDate, $lte: endDate }
//       })
//       .sort({ timestamp: -1 })
//       .limit(20)
//       .populate('user', 'username firstName lastName')
//       .populate('resourceId', 'name');
      
//       res.status(200).json({
//         success: true,
//         period: period || 'daily',
//         date: date || new Date(),
//         stats,
//         recentActivity: recentStatusChanges
//       });
//     } catch (error) {
//       console.error('Error getting tech stack stats:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Server Error'
//       });
//     }
//   };
  
//   // Get user activity statistics
//   export const getUserActivityStats = async (req, res) => {
//     try {
//       const { period, date } = req.query;
//       const { startDate, endDate } = getDateRange(period || 'daily', date);
      
//       // Get activity counts by users in the period
//       const userActivityCounts = await ActivityLog.aggregate([
//         { 
//           $match: { 
//             timestamp: { $gte: startDate, $lte: endDate } 
//           } 
//         },
//         {
//           $group: {
//             _id: '$user',
//             count: { $sum: 1 },
//             actions: { 
//               $push: {
//                 action: '$action',
//                 timestamp: '$timestamp'
//               }
//             }
//           }
//         },
//         {
//           $lookup: {
//             from: 'users',
//             localField: '_id',
//             foreignField: '_id',
//             as: 'userDetails'
//           }
//         },
//         {
//           $unwind: '$userDetails'
//         },
//         {
//           $project: {
//             _id: 1,
//             count: 1,
//             actions: 1,
//             username: '$userDetails.username',
//             firstName: '$userDetails.firstName',
//             lastName: '$userDetails.lastName',
//             role: '$userDetails.role'
//           }
//         },
//         {
//           $sort: { count: -1 }
//         }
//       ]);
      
//       // Get counts by activity type
//       const activityTypeCounts = await ActivityLog.aggregate([
//         { 
//           $match: { 
//             timestamp: { $gte: startDate, $lte: endDate } 
//           } 
//         },
//         {
//           $group: {
//             _id: '$action',
//             count: { $sum: 1 }
//           }
//         },
//         {
//           $sort: { count: -1 }
//         }
//       ]);
      
//       res.status(200).json({
//         success: true,
//         period: period || 'daily',
//         date: date || new Date(),
//         timeRange: {
//           start: startDate,
//           end: endDate
//         },
//         userActivity: userActivityCounts,
//         activityTypes: activityTypeCounts
//       });
//     } catch (error) {
//       console.error('Error getting user activity stats:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Server Error'
//       });
//     }
//   };
  
//   // Get timeline statistics for instructors
//   export const getTimelineStats = async (req, res) => {
//     try {
//       let techStackFilter = {};
//       // If the user is an instructor, we *only* want their assigned tech stacks.
//       if (req.user.role === 'instructor') {
//         // If they have assigned tech stacks, create the filter.
//         if (req.user.assignedTechStacks && req.user.assignedTechStacks.length > 0) {
//           techStackFilter = {
//             _id: { $in: req.user.assignedTechStacks.map(id => new mongoose.Types.ObjectId(id)) }
//           };
//         } else {
//           // If they are an instructor but have NO assigned stacks, they should see nothing.
//           return res.status(200).json({
//             success: true,
//             timelineStats: [],
//             techStackProgress: [],
//             recentComments: []
//           });
//         }
//       }

//       // Aggregate roadmap items by status for timeline view
//       const timelineStatsPipeline = [
//         { $match: techStackFilter }, 
//         { $unwind: '$roadmapItems' },
//         // Start: Add comment count
//         {
//           $lookup: {
//             from: 'comments', // Name of the comments collection in MongoDB
//             let: { roadmapItemId: '$roadmapItems._id', techStackId: '$_id' },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ['$roadmapItemId', '$$roadmapItemId'] },
//                       { $eq: ['$techStackId', '$$techStackId'] },
//                       // Add more conditions for "unread" if needed later.
//                       // For now, this counts all comments for the item.
//                     ]
//                   }
//                 }
//               },
//               { $count: 'count' }
//             ],
//             as: 'commentsForItem'
//           }
//         },
//         {
//           $addFields: {
//             'roadmapItems.commentCount': { $ifNull: [{ $arrayElemAt: ['$commentsForItem.count', 0] }, 0] }
//           }
//         },
//         // End: Add comment count
//         {
//           $group: {
//             _id: '$roadmapItems.completionStatus',
//             count: { $sum: 1 },
//             items: {
//               $push: {
//                 techStackId: '$_id',
//                 techStackName: '$name',
//                 itemId: '$roadmapItems._id',
//                 topic: '$roadmapItems.topic',
//                 status: '$roadmapItems.completionStatus',
//                 scheduledDate: '$roadmapItems.scheduledDate',
//                 subTopics: '$roadmapItems.subTopics', // Pushing subtopics and projects
//                 projects: '$roadmapItems.projects',
//                 commentCount: '$roadmapItems.commentCount' // Push the count
//               }
//             }
//           }
//         },
//         { $sort: { _id: 1 } }
//       ];
//       const timelineStats = await TechStack.aggregate(timelineStatsPipeline);
      
//       const techStackProgressPipeline = [
//         { $match: techStackFilter }, 
//         {
//           $project: {
//             name: 1,
//             totalItems: { $size: '$roadmapItems' },
//             completedItems: {
//               $size: {
//                 $filter: {
//                   input: '$roadmapItems',
//                   as: 'item',
//                   cond: { $eq: ['$$item.completionStatus', 'Completed'] }
//                 }
//               }
//             },
//           }
//         },
//         {
//           $project: {
//             name: 1,
//             totalItems: 1,
//             completedItems: 1,
//             completionPercentage: {
//               $cond: [
//                 { $eq: ['$totalItems', 0] },
//                 0,
//                 { $multiply: [{ $divide: ['$completedItems', '$totalItems'] }, 100] }
//               ]
//             }
//           }
//         },
//         { $sort: { completionPercentage: -1 } }
//       ];
//       const techStackProgress = await TechStack.aggregate(techStackProgressPipeline);
      
//       let commentFilter = {};
//       if (req.user.role === 'instructor' && req.user.assignedTechStacks && req.user.assignedTechStacks.length > 0) {
//         commentFilter = { 
//           techStackId: { $in: req.user.assignedTechStacks.map(id => new mongoose.Types.ObjectId(id)) } 
//         };
//       }
//       const recentComments = await Comment.find(commentFilter)
//         .sort({ createdAt: -1 })
//         .limit(10)
//         .populate('user', 'username firstName lastName role')
//         .populate({
//            path: 'techStackId', // Assuming Comment model has techStackId as ObjectId ref
//            select: 'name'
//         });
      
//       res.status(200).json({
//         success: true,
//         timelineStats,
//         techStackProgress,
//         recentComments
//       });
//     } catch (error) {
//       console.error('Error getting timeline stats:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Server Error: ' + error.message
//       });
//     }
//   };
  
//   export const getDashboardSummary = async (req, res) => {
//     try {
//       // Existing counts
//       const userCount = await User.countDocuments();
//       const techStackCount = await TechStack.countDocuments(); // Overall tech stack count
//       const roadmapCount = await Roadmap.countDocuments();
  
//       // User Role Counts
//       const userRolesAgg = await User.aggregate([
//         { $group: { _id: '$role', count: { $sum: 1 } } }
//       ]);
//       const userRoleCounts = {};
//       userRolesAgg.forEach(roleCount => {
//         if(roleCount._id) userRoleCounts[roleCount._id] = roleCount.count;
//       });
  
//       // Item Stats (remains for overall progress bar, can be removed if not needed)
//       const itemStatsResult = await TechStack.aggregate([
//         { $unwind: '$roadmapItems' },
//         { $group: { _id: '$roadmapItems.completionStatus', count: { $sum: 1 } } }
//       ]);
//       const itemStatsByStatus = { 'Completed': 0, 'In Progress': 0, 'Yet to Start': 0 };
//       itemStatsResult.forEach(stat => {
//         if (stat._id) itemStatsByStatus[stat._id] = stat.count;
//       });
//       const totalItems = Object.values(itemStatsByStatus).reduce((sum, count) => sum + count, 0);
//       const progressPercentage = totalItems > 0 ? Math.round((itemStatsByStatus['Completed'] / totalItems) * 100) : 0;
  
//       // Recent Activity
//       const recentActivity = await ActivityLog.find()
//         .sort({ timestamp: -1 })
//         .limit(10)
//         .populate('user', 'username firstName lastName role')
//         .populate('resourceId', 'name');
  
//       // --- NEW: Tech Stack Status Calculation ---
//       const allTechStacks = await TechStack.find().select('name roadmapItems');
//       const allInstructors = await User.find({ role: 'instructor' }).select('firstName lastName username assignedTechStacks');
  
//       const techStackStatusDetails = {
//         completed: [],
//         inProgress: [],
//         yetToStart: []
//       };
  
//       for (const ts of allTechStacks) {
//         const assignedInstructors = allInstructors
//           .filter(instructor => instructor.assignedTechStacks.some(assignedTSId => assignedTSId.equals(ts._id)))
//           .map(instructor => `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.username);
  
//         const techStackDetailPayload = {
//           _id: ts._id.toString(),
//           name: ts.name,
//           instructors: assignedInstructors.length > 0 ? assignedInstructors : ['N/A']
//         };
  
//         if (!ts.roadmapItems || ts.roadmapItems.length === 0) {
//           techStackStatusDetails.yetToStart.push(techStackDetailPayload);
//           continue;
//         }
  
//         const totalTsItems = ts.roadmapItems.length;
//         let completedTsItems = 0;
//         // let inProgressTsItems = 0; // Not strictly needed for categorization, but useful for other calcs
//         let yetToStartTsItems = 0;
  
//         ts.roadmapItems.forEach(item => {
//           if (item.completionStatus === 'Completed') completedTsItems++;
//           // else if (item.completionStatus === 'In Progress') inProgressTsItems++; // Can uncomment if needed
//           else if (item.completionStatus === 'Yet to Start') yetToStartTsItems++;
//         });
  
//         if (completedTsItems === totalTsItems) {
//           techStackStatusDetails.completed.push(techStackDetailPayload);
//         } else if (yetToStartTsItems === totalTsItems) {
//           techStackStatusDetails.yetToStart.push(techStackDetailPayload);
//         } else { // If not all completed and not all yet to start, it's in progress
//           techStackStatusDetails.inProgress.push(techStackDetailPayload);
//         }
//       }
//       // --- END: Tech Stack Status Calculation ---
  
//       res.status(200).json({
//         success: true,
//         counts: { // Overall counts
//           users: userCount,
//           techStacks: techStackCount, // This is the total number of tech stacks
//           roadmaps: roadmapCount,
//           totalItems
//         },
//         itemStats: itemStatsByStatus, // Individual item statuses for progress bar
//         progressPercentage,
//         recentActivity,
//         userRoleCounts,
//         techStackStatusCounts: { // Counts for the new cards
//           completed: techStackStatusDetails.completed.length,
//           inProgress: techStackStatusDetails.inProgress.length,
//           yetToStart: techStackStatusDetails.yetToStart.length,
//         },
//         techStackStatusDetails // Full details for modals
//       });
//     } catch (error) {
//       console.error('Error getting dashboard summary:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Server Error'
//       });
//     }
//   };

// // Get instructor progress by specific date or date range
// export const getInstructorProgressByDate = async (req, res) => {
//   try {
//     const { date, startDate: queryStartDate, endDate: queryEndDate } = req.query;
//     let effectiveStartDate, effectiveEndDate;

//     if (queryStartDate && queryEndDate) {
//       effectiveStartDate = new Date(queryStartDate); // YYYY-MM-DD string from client
//       effectiveStartDate.setUTCHours(0, 0, 0, 0);
//       effectiveEndDate = new Date(queryEndDate);   // YYYY-MM-DD string from client
//       effectiveEndDate.setUTCHours(23, 59, 59, 999);
//     } else if (date) { // Single date provided
//       effectiveStartDate = new Date(date); // YYYY-MM-DD string from client
//       effectiveStartDate.setUTCHours(0, 0, 0, 0);
//       effectiveEndDate = new Date(date);
//       effectiveEndDate.setUTCHours(23, 59, 59, 999);
//     } else {
//       // Fallback or error if no date info is provided
//       // For now, let's default to today based on server's UTC time. Client should ideally always send a date.
//       effectiveStartDate = new Date();
//       effectiveStartDate.setUTCHours(0, 0, 0, 0);
//       effectiveEndDate = new Date();
//       effectiveEndDate.setUTCHours(23, 59, 59, 999);
//     }

//     if (isNaN(effectiveStartDate.getTime()) || isNaN(effectiveEndDate.getTime())) {
//         return res.status(400).json({ success: false, error: 'Invalid date format provided.' });
//     }

//     const instructors = await User.find({ role: 'instructor', isActive: true })
//                                   .select('firstName lastName username assignedTechStacks')
//                                   .lean();

//     if (!instructors.length) {
//       return res.status(200).json({ success: true, data: [] });
//     }
    
//     const scheduledTechStackItems = await TechStack.aggregate([
//       { $unwind: '$roadmapItems' },
//       { 
//         $match: {
//           'roadmapItems.scheduledDate': {
//             $gte: effectiveStartDate,
//             $lte: effectiveEndDate
//           }
//         }
//       },
//       {
//         $project: {
//           techStackId: '$_id',
//           techStackName: '$name',
//           item: '$roadmapItems'
//         }
//       }
//     ]);

//     const progressData = [];
//     for (const instructor of instructors) {
//       const instructorTechStackIds = instructor.assignedTechStacks.map(id => id.toString());

//       for (const scheduledItem of scheduledTechStackItems) {
//         if (instructorTechStackIds.includes(scheduledItem.techStackId.toString())) {
//           // Fetch comment count for this item
//           const commentCount = await Comment.countDocuments({
//             techStackId: scheduledItem.techStackId,
//             roadmapItemId: scheduledItem.item._id
//           });

//           progressData.push({
//             instructorId: instructor._id,
//             instructorName: `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.username,
//             techStackId: scheduledItem.techStackId,
//             techStackName: scheduledItem.techStackName,
//             topic: scheduledItem.item.topic,
//             // Include subTopics and projects if needed for the modal context
//             subTopics: scheduledItem.item.subTopics,
//             projects: scheduledItem.item.projects,
//             status: scheduledItem.item.completionStatus,
//             scheduledDate: scheduledItem.item.scheduledDate.toISOString().split('T')[0], // Keep as YYYY-MM-DD for client
//             itemId: scheduledItem.item._id,
//             commentCount: commentCount // Add comment count
//           });
//         }
//       }
//     }

//     progressData.sort((a,b) => {
//         if (a.instructorName.toLowerCase() < b.instructorName.toLowerCase()) return -1;
//         if (a.instructorName.toLowerCase() > b.instructorName.toLowerCase()) return 1;
//         if (a.techStackName.toLowerCase() < b.techStackName.toLowerCase()) return -1;
//         if (a.techStackName.toLowerCase() > b.techStackName.toLowerCase()) return 1;
//         return (a.topic || "").toLowerCase().localeCompare((b.topic || "").toLowerCase());
//     });

//     res.status(200).json({ success: true, data: progressData });

//   } catch (error) {
//     console.error('Error fetching instructor progress by date:', error);
//     res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
//   }
// };



// server/controllers/statsController.js
import TechStack from '../models/TechStack.js';
import Roadmap from '../models/Roadmap.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import Comment from '../models/Comment.js';
import mongoose from 'mongoose';
import InternshipMaster from '../models/InternshipMaster.js';
import OverallHubStatus from '../models/OverallHubStatus.js';
import PostInternship from '../models/PostInternship.js';
import CompanyStudentProgress from '../models/CompanyStudentProgress.js';
import { AseRating, CompanyInteraction, AssignmentRating, IncrutierRating, CompanyClosing } from '../models/StudentRatings.js';

// Helper function to get date ranges
const getDateRange = (period, dateParam) => {
  let date;
  
  if (dateParam) {
    date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      date = new Date();
    }
  } else {
    date = new Date();
  }
  
  let startDate, endDate;
  
  if (period === 'daily') {
    startDate = new Date(date.setHours(0, 0, 0, 0));
    endDate = new Date(new Date(startDate).setHours(23, 59, 59, 999));
  } else if (period === 'weekly') {
    const day = date.getDay();
    startDate = new Date(date);
    startDate.setDate(date.getDate() - day);
    startDate.setHours(0, 0, 0, 0);
    
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'monthly') {
    startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    startDate = new Date(date.setHours(0, 0, 0, 0));
    endDate = new Date(new Date(startDate).setHours(23, 59, 59, 999));
  }
  
  return { startDate, endDate };
};

// Get techstack statistics (status counts, progress)
export const getTechStackStats = async (req, res) => {
    try {
      const { period, date } = req.query;
      
      const techStacks = await TechStack.find();
      
      let totalItems = 0;
      let completedItems = 0;
      let inProgressItems = 0;
      let notStartedItems = 0;
      
      techStacks.forEach(techStack => {
        techStack.roadmapItems.forEach(item => {
          totalItems++;
          
          if (item.completionStatus === 'Completed') {
            completedItems++;
          } else if (item.completionStatus === 'In Progress') {
            inProgressItems++;
          } else {
            notStartedItems++;
          }
        });
      });
      
      const stats = {
        total: totalItems,
        completed: {
          count: completedItems,
          percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
        },
        inProgress: {
          count: inProgressItems,
          percentage: totalItems > 0 ? Math.round((inProgressItems / totalItems) * 100) : 0
        },
        notStarted: {
          count: notStartedItems,
          percentage: totalItems > 0 ? Math.round((notStartedItems / totalItems) * 100) : 0
        },
        techStackCount: techStacks.length
      };
      
      const { startDate, endDate } = getDateRange(period || 'daily', date);
      
      const recentStatusChanges = await ActivityLog.find({
        action: 'update_status',
        timestamp: { $gte: startDate, $lte: endDate }
      })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('user', 'username firstName lastName')
      .populate('resourceId', 'name');
      
      res.status(200).json({
        success: true,
        period: period || 'daily',
        date: date || new Date(),
        stats,
        recentActivity: recentStatusChanges
      });
    } catch (error) {
      console.error('Error getting tech stack stats:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };
  
  // Get user activity statistics
  export const getUserActivityStats = async (req, res) => {
    try {
      const { period, date } = req.query;
      const { startDate, endDate } = getDateRange(period || 'daily', date);
      
      const userActivityCounts = await ActivityLog.aggregate([
        { 
          $match: { 
            timestamp: { $gte: startDate, $lte: endDate } 
          } 
        },
        {
          $group: {
            _id: '$user',
            count: { $sum: 1 },
            actions: { 
              $push: {
                action: '$action',
                timestamp: '$timestamp'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: '$userDetails'
        },
        {
          $project: {
            _id: 1,
            count: 1,
            actions: 1,
            username: '$userDetails.username',
            firstName: '$userDetails.firstName',
            lastName: '$userDetails.lastName',
            role: '$userDetails.role'
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      const activityTypeCounts = await ActivityLog.aggregate([
        { 
          $match: { 
            timestamp: { $gte: startDate, $lte: endDate } 
          } 
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      res.status(200).json({
        success: true,
        period: period || 'daily',
        date: date || new Date(),
        timeRange: {
          start: startDate,
          end: endDate
        },
        userActivity: userActivityCounts,
        activityTypes: activityTypeCounts
      });
    } catch (error) {
      console.error('Error getting user activity stats:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };
  
  // Get timeline statistics for instructors
  export const getTimelineStats = async (req, res) => {
    try {
      let techStackFilter = {};
      if (req.user.role === 'instructor') {
        if (req.user.assignedTechStacks && req.user.assignedTechStacks.length > 0) {
          techStackFilter = {
            _id: { $in: req.user.assignedTechStacks.map(id => new mongoose.Types.ObjectId(id)) }
          };
        } else {
          return res.status(200).json({
            success: true,
            timelineStats: [],
            techStackProgress: [],
            recentComments: []
          });
        }
      }

      const timelineStatsPipeline = [
        { $match: techStackFilter }, 
        { $unwind: '$roadmapItems' },
        {
          $lookup: {
            from: 'comments',
            let: { roadmapItemId: '$roadmapItems._id', techStackId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$roadmapItemId', '$$roadmapItemId'] },
                      { $eq: ['$techStackId', '$$techStackId'] },
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'commentsForItem'
          }
        },
        {
          $addFields: {
            'roadmapItems.commentCount': { $ifNull: [{ $arrayElemAt: ['$commentsForItem.count', 0] }, 0] }
          }
        },
        {
          $group: {
            _id: '$roadmapItems.completionStatus',
            count: { $sum: 1 },
            items: {
              $push: {
                techStackId: '$_id',
                techStackName: '$name',
                itemId: '$roadmapItems._id',
                topic: '$roadmapItems.topic',
                status: '$roadmapItems.completionStatus',
                scheduledDate: '$roadmapItems.scheduledDate',
                subTopics: '$roadmapItems.subTopics',
                projects: '$roadmapItems.projects',
                commentCount: '$roadmapItems.commentCount'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ];
      const timelineStats = await TechStack.aggregate(timelineStatsPipeline);
      
      const techStackProgressPipeline = [
        { $match: techStackFilter }, 
        {
          $project: {
            name: 1,
            totalItems: { $size: '$roadmapItems' },
            completedItems: {
              $size: {
                $filter: {
                  input: '$roadmapItems',
                  as: 'item',
                  cond: { $eq: ['$$item.completionStatus', 'Completed'] }
                }
              }
            },
          }
        },
        {
          $project: {
            name: 1,
            totalItems: 1,
            completedItems: 1,
            completionPercentage: {
              $cond: [
                { $eq: ['$totalItems', 0] },
                0,
                { $multiply: [{ $divide: ['$completedItems', '$totalItems'] }, 100] }
              ]
            }
          }
        },
        { $sort: { completionPercentage: -1 } }
      ];
      const techStackProgress = await TechStack.aggregate(techStackProgressPipeline);
      
      let commentFilter = {};
      if (req.user.role === 'instructor' && req.user.assignedTechStacks && req.user.assignedTechStacks.length > 0) {
        commentFilter = { 
          techStackId: { $in: req.user.assignedTechStacks.map(id => new mongoose.Types.ObjectId(id)) } 
        };
      }
      const recentComments = await Comment.find(commentFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'username firstName lastName role')
        .populate({
           path: 'techStackId',
           select: 'name'
        });
      
      res.status(200).json({
        success: true,
        timelineStats,
        techStackProgress,
        recentComments
      });
    } catch (error) {
      console.error('Error getting timeline stats:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error: ' + error.message
      });
    }
  };
  
  export const getDashboardSummary = async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      const techStackCount = await TechStack.countDocuments();
      const roadmapCount = await Roadmap.countDocuments();

      const companywiseStudentsCount = await CompanyStudentProgress.countDocuments();

      const companyStatusCounts = await InternshipMaster.aggregate([
        { $group: { _id: '$companyStatus', count: { $sum: 1 } } }
      ]);
      const activeCompanies = companyStatusCounts.find(c => c._id === 'Active')?.count || 0;
      const inactiveCompanies = companyStatusCounts.find(c => c._id === 'Inactive')?.count || 0;
      const holdCompanies = companyStatusCounts.find(c => c._id === 'Hold')?.count || 0;

      // --- START: MODIFIED HUB COUNT LOGIC ---
      const [
          aseRecords, interactionRecords, assignmentRecords, 
          incrutierRecords, closingRecords
      ] = await Promise.all([
          AseRating.find({}, 'companyName niatId').lean(),
          CompanyInteraction.find({}, 'companyName niatId').lean(),
          AssignmentRating.find({}, 'companyName niatId').lean(),
          IncrutierRating.find({}, 'companyName niatId').lean(),
          CompanyClosing.find({}, 'companyName niatId').lean()
      ]);
  
      const hubKeySet = new Set();
      const allRecords = [
          ...aseRecords, ...interactionRecords, ...assignmentRecords,
          ...incrutierRecords, ...closingRecords
      ];
  
      allRecords.forEach(item => {
          if (item.companyName && item.niatId) {
              hubKeySet.add(`${item.companyName}|${item.niatId}`);
          }
      });
  
      const hubCount = hubKeySet.size;
      // --- END: MODIFIED HUB COUNT LOGIC ---

      const overallStatusCounts = await OverallHubStatus.aggregate([
        { $group: { _id: '$overallStatus', count: { $sum: 1 } } }
      ]);
      const hiredCount = overallStatusCounts.find(s => s._id === 'Hired')?.count || 0;
      const holdCount = overallStatusCounts.find(s => s._id === 'Hold')?.count || 0;
      const rejectCount = overallStatusCounts.find(s => s._id === 'Reject')?.count || 0;

      const postInternshipCount = await PostInternship.countDocuments();
      
      const userRolesAgg = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      const userRoleCounts = {};
      userRolesAgg.forEach(roleCount => {
        if(roleCount._id) userRoleCounts[roleCount._id] = roleCount.count;
      });
  
      const itemStatsResult = await TechStack.aggregate([
        { $unwind: '$roadmapItems' },
        { $group: { _id: '$roadmapItems.completionStatus', count: { $sum: 1 } } }
      ]);
      const itemStatsByStatus = { 'Completed': 0, 'In Progress': 0, 'Yet to Start': 0 };
      itemStatsResult.forEach(stat => {
        if (stat._id) itemStatsByStatus[stat._id] = stat.count;
      });
      const totalItems = Object.values(itemStatsByStatus).reduce((sum, count) => sum + count, 0);
      const progressPercentage = totalItems > 0 ? Math.round((itemStatsByStatus['Completed'] / totalItems) * 100) : 0;
  
      const recentActivity = await ActivityLog.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('user', 'username firstName lastName role')
        .populate('resourceId', 'name');
  
      const allTechStacks = await TechStack.find().select('name roadmapItems');
      const allInstructors = await User.find({ role: 'instructor' }).select('firstName lastName username assignedTechStacks');
  
      const techStackStatusDetails = {
        completed: [],
        inProgress: [],
        yetToStart: []
      };
  
      for (const ts of allTechStacks) {
        const assignedInstructors = allInstructors
          .filter(instructor => instructor.assignedTechStacks.some(assignedTSId => assignedTSId.equals(ts._id)))
          .map(instructor => `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.username);
  
        const techStackDetailPayload = {
          _id: ts._id.toString(),
          name: ts.name,
          instructors: assignedInstructors.length > 0 ? assignedInstructors : ['N/A']
        };
  
        if (!ts.roadmapItems || ts.roadmapItems.length === 0) {
          techStackStatusDetails.yetToStart.push(techStackDetailPayload);
          continue;
        }
  
        const totalTsItems = ts.roadmapItems.length;
        let completedTsItems = 0;
        let yetToStartTsItems = 0;
  
        ts.roadmapItems.forEach(item => {
          if (item.completionStatus === 'Completed') completedTsItems++;
          else if (item.completionStatus === 'Yet to Start') yetToStartTsItems++;
        });
  
        if (completedTsItems === totalTsItems) {
          techStackStatusDetails.completed.push(techStackDetailPayload);
        } else if (yetToStartTsItems === totalTsItems) {
          techStackStatusDetails.yetToStart.push(techStackDetailPayload);
        } else {
          techStackStatusDetails.inProgress.push(techStackDetailPayload);
        }
      }
      
      res.status(200).json({
        success: true,
        counts: {
          users: userCount,
          techStacks: techStackCount,
          roadmaps: roadmapCount,
          companywiseStudents: companywiseStudentsCount,
          activeCompanies: activeCompanies,
          inactiveCompanies: inactiveCompanies,
          holdCompanies: holdCompanies,
          hubCount: hubCount,
          hiredCount: hiredCount,
          holdCount: holdCount,
          rejectCount: rejectCount,
          postInternshipCount: postInternshipCount
        },
        itemStats: itemStatsByStatus,
        progressPercentage,
        recentActivity,
        userRoleCounts,
        techStackStatusCounts: { 
          completed: techStackStatusDetails.completed.length,
          inProgress: techStackStatusDetails.inProgress.length,
          yetToStart: techStackStatusDetails.yetToStart.length,
        },
        techStackStatusDetails
      });
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };

// Get instructor progress by specific date or date range
export const getInstructorProgressByDate = async (req, res) => {
  try {
    const { date, startDate: queryStartDate, endDate: queryEndDate } = req.query;
    let effectiveStartDate, effectiveEndDate;

    if (queryStartDate && queryEndDate) {
      effectiveStartDate = new Date(queryStartDate); 
      effectiveStartDate.setUTCHours(0, 0, 0, 0);
      effectiveEndDate = new Date(queryEndDate);
      effectiveEndDate.setUTCHours(23, 59, 59, 999);
    } else if (date) { 
      effectiveStartDate = new Date(date);
      effectiveStartDate.setUTCHours(0, 0, 0, 0);
      effectiveEndDate = new Date(date);
      effectiveEndDate.setUTCHours(23, 59, 59, 999);
    } else {
      effectiveStartDate = new Date();
      effectiveStartDate.setUTCHours(0, 0, 0, 0);
      effectiveEndDate = new Date();
      effectiveEndDate.setUTCHours(23, 59, 59, 999);
    }

    if (isNaN(effectiveStartDate.getTime()) || isNaN(effectiveEndDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid date format provided.' });
    }

    const instructors = await User.find({ role: 'instructor', isActive: true })
                                  .select('firstName lastName username assignedTechStacks')
                                  .lean();

    if (!instructors.length) {
      return res.status(200).json({ success: true, data: [] });
    }
    
    const scheduledTechStackItems = await TechStack.aggregate([
      { $unwind: '$roadmapItems' },
      { 
        $match: {
          'roadmapItems.scheduledDate': {
            $gte: effectiveStartDate,
            $lte: effectiveEndDate
          }
        }
      },
      {
        $project: {
          techStackId: '$_id',
          techStackName: '$name',
          item: '$roadmapItems'
        }
      }
    ]);

    const progressData = [];
    for (const instructor of instructors) {
      const instructorTechStackIds = instructor.assignedTechStacks.map(id => id.toString());

      for (const scheduledItem of scheduledTechStackItems) {
        if (instructorTechStackIds.includes(scheduledItem.techStackId.toString())) {
          const commentCount = await Comment.countDocuments({
            techStackId: scheduledItem.techStackId,
            roadmapItemId: scheduledItem.item._id
          });

          progressData.push({
            instructorId: instructor._id,
            instructorName: `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.username,
            techStackId: scheduledItem.techStackId,
            techStackName: scheduledItem.techStackName,
            topic: scheduledItem.item.topic,
            subTopics: scheduledItem.item.subTopics,
            projects: scheduledItem.item.projects,
            status: scheduledItem.item.completionStatus,
            scheduledDate: scheduledItem.item.scheduledDate.toISOString().split('T')[0],
            itemId: scheduledItem.item._id,
            commentCount: commentCount
          });
        }
      }
    }

    progressData.sort((a,b) => {
        if (a.instructorName.toLowerCase() < b.instructorName.toLowerCase()) return -1;
        if (a.instructorName.toLowerCase() > b.instructorName.toLowerCase()) return 1;
        if (a.techStackName.toLowerCase() < b.techStackName.toLowerCase()) return -1;
        if (a.techStackName.toLowerCase() > b.techStackName.toLowerCase()) return 1;
        return (a.topic || "").toLowerCase().localeCompare((b.topic || "").toLowerCase());
    });

    res.status(200).json({ success: true, data: progressData });

  } catch (error) {
    console.error('Error fetching instructor progress by date:', error);
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};
