import mongoose from 'mongoose';

const TechStackRoadmapTrackerSchema = new mongoose.Schema({
  techStack: { type: String, default: '' },
  techStackRp: { type: String, default: '' },
  instructors: { type: [String], default: [] },
  roadmapLink: { type: String, default: '' },
  deadline: { type: Date, default: null },
  progress: { type: Number, default: 0 },
  version: { type: String, default: 'V1' },
  versionRemarks: { type: String, default: '' },
  assignment25: { type: String, default: '' },
  assignment50: { type: String, default: '' },
  assignment75: { type: String, default: '' },
  assignment100: { type: String, default: '' },
  roadmapApproval: { type: String, default: '' },
  companyAssignments: { type: String, default: '' },
  aseMockInterview: { type: String, default: '' },
  externalMockInterview: { type: String, default: '' }
}, { timestamps: true });

const TechStackRoadmapTracker = mongoose.model('TechStackRoadmapTracker', TechStackRoadmapTrackerSchema);
export default TechStackRoadmapTracker;