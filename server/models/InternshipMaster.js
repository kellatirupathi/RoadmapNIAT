import mongoose from 'mongoose';

const TechProgressSchema = new mongoose.Schema({
  techStackName: { type: String, required: true }
}, { _id: false });

const InternshipMasterSchema = new mongoose.Schema({
  companies: { type: String, default: '' },
  roles: { type: String, default: '' },
  internshipOffers: { type: Number, default: 0 },
  companyStatus: { type: String, enum: ['Active', 'Inactive', ''], default: 'Active' },
  reasonInactive: { type: String, default: '' },
  studentMappingMethod: { type: String, default: '' },
  studentMappingCounts: { type: Number, default: 0 },
  internshipStartDate: { type: Date, default: null },
  stackCompletionDate: { type: Date, default: null },
  techProgress: [TechProgressSchema] // Replaced individual tech stack fields
}, { timestamps: true });

const InternshipMaster = mongoose.model('InternshipMaster', InternshipMasterSchema);
export default InternshipMaster;