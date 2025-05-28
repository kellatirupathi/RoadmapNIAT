// server/models/Notification.js
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: { // User ID of the admin or manager
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  triggeredBy: { // User ID of who triggered the notification (e.g., instructor who commented)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['new_comment', 'status_update', 'system_message'], // Add more types as needed
  },
  message: {
    type: String,
    required: true,
  },
  link: { // URL to navigate to when notification is clicked
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  resourceId: { // e.g., techStackId
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceModel'
  },
  resourceModel: { // e.g., 'TechStack'
    type: String,
    enum: ['TechStack', 'Roadmap', 'User', null]
  },
  details: { // Additional context, like roadmapItemId or commentId
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;