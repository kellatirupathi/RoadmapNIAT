// server/models/ActivityLog.js
import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 
      'logout', 
      'create_techstack', 
      'edit_techstack', 
      'delete_techstack',
      'create_roadmap', 
      'edit_roadmap', 
      'delete_roadmap',
      'update_status',
      'add_comment',
      'delete_comment', // Add this if not present
      'user_management'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceModel'
  },
  resourceModel: {
    type: String,
    enum: ['TechStack', 'Roadmap', 'User', null]
  },
  ip: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ user: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

export default ActivityLog;