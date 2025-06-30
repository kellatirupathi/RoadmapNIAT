// server/models/CompanyStatus.js
import mongoose from 'mongoose';

// Nested schema for individual student data within a company status record.
const StudentStatusSchema = new mongoose.Schema({
  studentName: { type: String, trim: true, required: true },
  niatId: { type: String, trim: true },
  // Raw scores are stored. Calculation will happen on the frontend.
  technicalScore: { type: Number, default: 0, min: 0, max: 100 },
  sincerityScore: { type: Number, default: 0, min: 0, max: 100 },
  communicationScore: { type: Number, default: 0, min: 0, max: 100 }
  // Removed overallProbability as it will be calculated on the fly.
}, { _id: true });

// Main schema for the "Company Status" records.
const CompanyStatusSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  openings: { type: Number, required: true, default: 1 },
  students: [StudentStatusSchema]
  // Removed overallCompanyProbability and closingStatus. They are now derived in the UI.
}, { timestamps: true });

// Add an index for faster queries by company and role.
CompanyStatusSchema.index({ companyName: 1, role: 1 }, { unique: true });

const CompanyStatus = mongoose.model('CompanyStatus', CompanyStatusSchema);
export default CompanyStatus;
