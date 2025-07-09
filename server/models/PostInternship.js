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
  // Openings is now a manually managed field
  openings: { type: Number },
  studentName: { type: String, required: true, trim: true },
  niatId: { type: String, trim: true },
  // HiredDate defaults to when the record is created, can be edited manually
  hiredDate: { type: Date, default: Date.now },
  // This is still set manually in the "Add/Edit" modal on the PostInternships page
  internshipStartDate: { type: Date, default: null },

  // --- NEW FIELD ADDED ---
  tasks: [TaskSchema] // Array to hold all tasks for this student
  
}, { timestamps: true });

PostInternshipSchema.index({ companyName: 1, role: 1 });
PostInternshipSchema.index({ studentName: 1 });
PostInternshipSchema.index({ niatId: 1 }, { unique: true, partialFilterExpression: { niatId: { $ne: null, $ne: '' } } });

const PostInternship = mongoose.model('PostInternship', PostInternshipSchema);
export default PostInternship;
