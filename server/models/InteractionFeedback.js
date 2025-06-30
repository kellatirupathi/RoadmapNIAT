// server/models/InteractionFeedback.js
import mongoose from 'mongoose';

// Schema for the nested interaction logs
const InteractionSchema = new mongoose.Schema({
  interactionType: { 
    type: String, 
    required: true 
  },
  interactionAttendees: { 
    type: String, 
    trim: true 
  },
  interactionOverallRemarks: { 
    type: String, 
    trim: true 
  },
  // --- NEW FIELD ADDED ---
  interactionSummary: {
    type: String,
    enum: ['Positive feedback', 'Negative feedback', 'Neutral', ''],
    default: 'Neutral'
  },
  // --- END NEW FIELD ---
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: true });

// Main schema for the 'Interactions Feedback' sheet
const InteractionFeedbackSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  roadmapReviewByCompany: { type: String, trim: true },
  roadmapChangesStatus: { type: String, trim: true },
  feedbackImplementationStatus: {
    type: String,
    enum: ['Yet to Implement', 'In Progress', 'Completed', ''],
    default: 'Yet to Implement'
  },
  interactions: [InteractionSchema]
}, { timestamps: true });

// Index for faster querying
InteractionFeedbackSchema.index({ company: 1, role: 1 });

const InteractionFeedback = mongoose.model('InteractionFeedback', InteractionFeedbackSchema);
export default InteractionFeedback;
