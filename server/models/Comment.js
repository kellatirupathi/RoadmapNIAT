// server/models/Comment.js
import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  user: { // User who posted the comment
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  techStackId: { // Link to the TechStack document
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TechStack',
    required: true
  },
  roadmapItemId: { // ObjectId of the specific roadmapItem within the TechStack
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true
  },
  isPrivate: { // For potential future use or specific visibility rules
    type: Boolean,
    default: false // Default to public (visible to instructor, admin, manager)
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update updatedAt timestamp
CommentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.updatedAt = Date.now();
  }
  next();
});

// Indexes for faster queries, especially when fetching comments for an item
CommentSchema.index({ techStackId: 1, roadmapItemId: 1, createdAt: -1 });
CommentSchema.index({ user: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', CommentSchema);

export default Comment;