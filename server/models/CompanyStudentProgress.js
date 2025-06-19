// server/models/CompanyStudentProgress.js
import mongoose from 'mongoose';

const TechAssignmentSchema = new mongoose.Schema({
  techStackName: { type: String, trim: true, required: true },
  deadline: { type: Date },
  // ADDED: Field for manual progress override
  manualProgress: { type: Number, default: null, min: 0, max: 100 }
});

const CompanyStudentProgressSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  roleName: { type: String, required: true, trim: true },
  roleDeadline: { type: Date },
  noOfOffers: { type: Number, default: 1 },
  niatId: { type: String, trim: true },
  studentName: { type: String, trim: true, required: true },
  
  techAssignments: [TechAssignmentSchema],
  
  completionStatus: { type: String, default: 'Pending' }
}, { timestamps: true });

CompanyStudentProgressSchema.index({ companyName: 1, roleName: 1, niatId: 1 }, { unique: true, partialFilterExpression: { niatId: { $type: "string", $ne: "" } } });

const CompanyStudentProgress = mongoose.model('CompanyStudentProgress', CompanyStudentProgressSchema);
export default CompanyStudentProgress;
