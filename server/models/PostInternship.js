// server/models/PostInternship.js
import mongoose from 'mongoose';

// --- NEW: Schema for individual task tracking ---
const TaskSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  tasksGiven: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: [
      'Understanding codebase', 
      'Adding new feature', 
      'Writing APIs', 
      'Gen AI Application', 
      'Making changes in existing code', 
      'Developing'
    ],
    trim: true
  },
  completedInTime: {
    type: String,
    enum: ['Yes', 'No', ''],
    default: ''
  },
  reasonForDelay: { type: String, trim: true, default: '' },
  isReported: {
    type: String,
    enum: ['Yes', 'No', ''],
    default: ''
  }
}, { timestamps: true });

const PostInternshipSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  openings: { type: Number },
  studentName: { type: String, required: true, trim: true },
  niatId: { type: String, trim: true },
  technicalScore: { type: Number },
  sincerityScore: { type: Number },
  communicationScore: { type: Number },
  overallStudentProbability: { type: Number },
  hiredDate: { type: Date, default: Date.now },
  internshipStartDate: { type: Date, default: null },

  // --- NEW FIELD ADDED ---
  tasks: [TaskSchema] // Array to hold all tasks for this student
  
}, { timestamps: true });

PostInternshipSchema.index({ companyName: 1, role: 1 });
PostInternshipSchema.index({ studentName: 1 });
PostInternshipSchema.index({ niatId: 1 }, { unique: true, partialFilterExpression: { niatId: { $ne: null, $ne: '' } } });

const PostInternship = mongoose.model('PostInternship', PostInternshipSchema);
export default PostInternship;
