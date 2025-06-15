// server/models/CompanyStudentProgress.js
import mongoose from 'mongoose';

const TechAssignmentSchema = new mongoose.Schema({
  techStackName: { type: String, trim: true, required: true },
  deadline: { type: Date }
});

const CompanyStudentProgressSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  roleName: { type: String, required: true, trim: true },
  roleDeadline: { type: Date },
  noOfOffers: { type: Number, default: 1 },
  niatId: { type: String, trim: true },
  studentName: { type: String, trim: true, required: true },
  
  // Replaced fixed fields with a flexible array
  techAssignments: [TechAssignmentSchema],
  
  // A general status for the student's progress in this company-role context
  completionStatus: { type: String, default: 'Pending' }
}, { timestamps: true });

// Ensure a student is unique per company and role. This prevents duplicate entries.
// IMPORTANT: You will need to drop the old index from your MongoDB collection.
CompanyStudentProgressSchema.index({ companyName: 1, roleName: 1, niatId: 1 }, { unique: true, partialFilterExpression: { niatId: { $type: "string", $ne: "" } } });

const CompanyStudentProgress = mongoose.model('CompanyStudentProgress', CompanyStudentProgressSchema);
export default CompanyStudentProgress;