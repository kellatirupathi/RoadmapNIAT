import mongoose from 'mongoose';

const CriticalPointsSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  role: { type: String, default: '' },
  roadmapReviewByCompany: { type: String, default: '' },
  roadmapChangesStatus: { type: String, default: '' },
  fortnightInteractionStatus: { type: String, default: '' },
  fortnightInteractionRemarks: { type: String, default: '' },
  feedbackFromCompany: { type: String, default: '' },
  assignmentGivenByCompany: { type: String, default: '' },
  feedbackImplementationStatus: { type: String, default: '' },
  feedbackImplementationRemarks: { type: String, default: '' }
}, { timestamps: true });

const CriticalPoints = mongoose.model('CriticalPoints', CriticalPointsSchema);
export default CriticalPoints;