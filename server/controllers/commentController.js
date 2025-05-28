// server/controllers/commentController.js
import Comment from '../models/Comment.js';
import TechStack from '../models/TechStack.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js'; // Ensure this is imported

// getComments and deleteComment functions remain the same as previously provided...

// Add a comment to a tech stack roadmap item
export const addComment = async (req, res) => {
  const io = req.io; // Access io from the request object
  const activeUsers = req.activeUsers; // Access activeUsers map

  try {
    const { techStackId, roadmapItemId } = req.params;
    const { content, isPrivate } = req.body;
    const commenter = req.user; // This is the logged-in user making the comment
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }
    
    const techStack = await TechStack.findById(techStackId);
    if (!techStack) {
      return res.status(404).json({ success: false, error: 'Tech stack not found' });
    }
    
    const roadmapItem = techStack.roadmapItems.id(roadmapItemId);
    if (!roadmapItem) {
      return res.status(404).json({ success: false, error: 'Roadmap item not found' });
    }
    
    const newComment = await Comment.create({
      user: commenter.id, 
      techStackId,
      roadmapItemId,
      content: content.trim(),
      isPrivate: isPrivate || false 
    });
    
    const populatedComment = await Comment.findById(newComment._id)
        .populate('user', 'username firstName lastName role'); // Populate user info for comment response

    // Log the activity (common for all commenters)
    await ActivityLog.create({
      user: commenter.id,
      action: 'add_comment',
      resourceId: techStackId, 
      resourceModel: 'TechStack',
      details: { 
          roadmapItemId: roadmapItemId.toString(),
          commentId: newComment._id.toString(),
          commentSnippet: content.trim().substring(0,50) + "..."
      }
    });
    
    // ---- START NOTIFICATION & REAL-TIME SOCKET EMIT LOGIC ----
    const commenterName = commenter.firstName && commenter.lastName 
        ? `${commenter.firstName} ${commenter.lastName}` 
        : commenter.username;

    const commentContentSnippet = content.trim().substring(0, 70) + (content.trim().length > 70 ? '...' : '');

    // Case 1: Admin is commenting - Notify relevant Instructors
    if (commenter.role === 'admin') {
      // Find instructors assigned to this tech stack
      const assignedInstructors = await User.find({
        role: 'instructor',
        assignedTechStacks: techStackId,
        isActive: true
      }).select('_id');

      for (const instructor of assignedInstructors) {
        // Ensure admin is not notifying themselves if they happen to also be an assigned instructor (unlikely edge case but good to check)
        if (instructor._id.toString() === commenter.id) continue;

        const notificationData = {
          recipient: instructor._id,
          triggeredBy: commenter.id,
          type: 'new_comment', 
          message: `Admin ${commenterName} commented on "${roadmapItem.topic}" in Tech Stack "${techStack.name}".`,
          link: `/timeline?techStackId=${techStackId}&itemId=${roadmapItemId}&commentId=${newComment._id}`, // Link to timeline or specific item view
          resourceId: techStackId,
          resourceModel: 'TechStack',
          details: { 
            roadmapItemId: roadmapItemId.toString(),
            roadmapItemTopic: roadmapItem.topic,
            techStackName: techStack.name,
            commentId: newComment._id.toString(),
            commentContentSnippet,
            commenterName: commenterName,
            commenterRole: commenter.role // Explicitly set 'admin'
          }
        };
        
        try {
          const savedNotification = await Notification.create(notificationData);
          const notificationToSend = await Notification.findById(savedNotification._id)
                                          .populate('triggeredBy', 'username firstName lastName role') // Populate who triggered it
                                          .lean(); // Use .lean() for a plain JS object to send via socket

          const recipientSocketId = activeUsers.get(instructor._id.toString());
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('new_notification', notificationToSend);
            console.log(`📨 Emitted 'new_notification' (admin comment) to instructor ${instructor._id} (socket ${recipientSocketId})`);
          } else {
            console.log(`ℹ️ Instructor ${instructor._id} not currently connected via socket for admin comment notification.`);
          }
        } catch (err) {
          console.error(`Error creating or emitting notification for instructor ${instructor._id}:`, err);
        }
      }
    } 
    // Case 2: Instructor is commenting - Notify Admins and Managers (Existing Logic)
    else if (commenter.role === 'instructor') { 
      const adminsAndManagers = await User.find({ 
          role: { $in: ['admin', 'manager'] }, 
          isActive: true 
      });

      for (const recipient of adminsAndManagers) {
        if (recipient._id.toString() === commenter.id) continue; 

        const notificationData = {
          recipient: recipient._id,
          triggeredBy: commenter.id,
          type: 'new_comment',
          message: `Instructor ${commenterName} commented on "${roadmapItem.topic}" in Tech Stack "${techStack.name}".`,
          link: `/timeline?techStackId=${techStackId}&itemId=${roadmapItemId}&commentId=${newComment._id}`, // Or manager dashboard link
          resourceId: techStackId,
          resourceModel: 'TechStack',
          details: { 
            roadmapItemId: roadmapItemId.toString(),
            roadmapItemTopic: roadmapItem.topic,
            techStackName: techStack.name,
            commentId: newComment._id.toString(),
            commentContentSnippet,
            commenterName: commenterName,
            commenterRole: commenter.role // Explicitly set 'instructor'
          }
        };
        
        try {
          const savedNotification = await Notification.create(notificationData);
          const notificationToSend = await Notification.findById(savedNotification._id)
                                          .populate('triggeredBy', 'username firstName lastName role')
                                          .lean();

          const recipientSocketId = activeUsers.get(recipient._id.toString());
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('new_notification', notificationToSend);
            console.log(`📨 Emitted 'new_notification' (instructor comment) to ${recipient.role} ${recipient._id} (socket ${recipientSocketId})`);
          } else {
            console.log(`ℹ️ ${recipient.role} ${recipient._id} not currently connected via socket for instructor comment notification.`);
          }
        } catch (err) {
          console.error(`Error creating or emitting notification for ${recipient.role} ${recipient._id}:`, err);
        }
      }
    }
    // Note: Manager comments currently don't send notifications based on this structure. Add an `else if (commenter.role === 'manager')` block if needed.
    // ---- END NOTIFICATION & REAL-TIME SOCKET EMIT LOGIC ----
    
    res.status(201).json({
      success: true,
      data: populatedComment // Send populated comment back
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// getComments and deleteComment function from previous good version
export const getComments = async (req, res) => {
  try {
    const { techStackId, roadmapItemId } = req.params;
    
    const techStack = await TechStack.findById(techStackId);
    if (!techStack) {
      return res.status(404).json({ success: false, error: 'Tech stack not found' });
    }
    
    const roadmapItem = techStack.roadmapItems.id(roadmapItemId);
    if (!roadmapItem) {
      return res.status(404).json({ success: false, error: 'Roadmap item not found' });
    }
    
    let query = { techStackId, roadmapItemId };
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        query.$or = [
            { isPrivate: false },
            { isPrivate: true, user: req.user.id } 
        ];
    }

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 }) 
      .populate({
        path: 'user',
        select: 'username firstName lastName role' 
      });
    
    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const deleteComment = async (req, res) => {
    try {
      const { techStackId, roadmapItemId, commentId } = req.params; 
  
      const comment = await Comment.findById(commentId);
  
      if (!comment) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
      }
  
      const canDelete = 
        comment.user.toString() === req.user.id || 
        req.user.role === 'admin' || 
        req.user.role === 'manager';
  
      if (!canDelete) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
      }
  
      await Comment.findByIdAndDelete(commentId);
      
      await ActivityLog.create({
        user: req.user.id,
        action: 'delete_comment', 
        resourceId: techStackId,
        resourceModel: 'TechStack',
        details: { roadmapItemId, commentId }
      });
  
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ success: false, error: 'Server Error' });
    }
};