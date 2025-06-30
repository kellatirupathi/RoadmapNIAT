// // server/models/Roadmap.js
// import mongoose from 'mongoose';

// // Schema for individual role data within a consolidated roadmap
// const RoleSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   techStacks: [{ // This will store ObjectId references to TechStack documents
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'TechStack', // Crucial for Mongoose populate
//     required: true
//   }]
// });

// // Main Roadmap Schema
// const RoadmapSchema = new mongoose.Schema({
//   companyName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   role: { 
//     type: String, // Main role for non-consolidated, or e.g., "Consolidated" for type
//     required: true,
//     trim: true
//   },
//   techStacks: [{ // Overall list of tech stack *names* for the entire roadmap
//     type: String, 
//     required: true,
//     trim: true
//   }],
//   publishedUrl: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   filename: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   isConsolidated: {
//     type: Boolean,
//     default: false
//   },
//   crmAffiliation: { // Username of the CRM user/entity
//     type: String,
//     trim: true,
//     index: true, // Index for faster querying
//     default: null // Or an empty string, null allows easier "not assigned" queries
//   },
//   roles: [RoleSchema], // Array of role-specific details
//   createdDate: {
//     type: Date,
//     default: Date.now
//   }
// });

// const Roadmap = mongoose.model('Roadmap', RoadmapSchema);
// export default Roadmap;

// server/models/Roadmap.js
import mongoose from 'mongoose';

// A copy of the RoadmapItemSchema to be embedded.
// This ensures that each roadmap has its own version of the topics.
const RoadmapItemCopySchema = new mongoose.Schema({
  topic: { type: String, required: true, trim: true },
  subTopics: [{ name: { type: String, required: true, trim: true } }],
  projects: [{ name: { type: String, required: true, trim: true } }],
  completionStatus: {
    type: String,
    enum: ['Yet to Start', 'In Progress', 'Completed'],
    default: 'Yet to Start'
  },
  scheduledDate: { type: Date, default: null }
}, { _id: true }); // Keep _id for identifying topics within the copy

// A schema for the copied Tech Stack data.
const TechStackCopySchema = new mongoose.Schema({
  originalId: { // To trace back to the master tech stack if needed
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TechStack'
  },
  name: { type: String, required: true },
  description: { type: String, trim: true },
  headers: {
    topic: { type: String, default: "Topic" },
    subTopics: { type: String, default: "Sub-Topics" },
    projects: { type: String, default: "Projects" },
    status: { type: String, default: "Status" }
  },
  roadmapItems: [RoadmapItemCopySchema]
}, { _id: true });

// The Role schema now contains an array of these copied tech stacks.
const RoleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  techStacks: [TechStackCopySchema] // Embed the full tech stack copies
});

// Main Roadmap Schema
const RoadmapSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  role: { 
    type: String, // Main role title for non-consolidated roadmaps
    required: function() { return !this.isConsolidated; },
    trim: true
  },
  techStacks: [TechStackCopySchema], // Used for non-consolidated roadmaps
  isConsolidated: {
    type: Boolean,
    default: false
  },
  roles: [RoleSchema], // Array of role-specific details for consolidated roadmaps
  crmAffiliation: { // Username of the CRM user/entity
    type: String,
    trim: true,
    index: true,
    default: null
  },
  publishedUrl: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});

// Helper method to extract all unique tech stack names for quick lookup
RoadmapSchema.methods.getTechStackNames = function() {
    const names = new Set();
    if (this.isConsolidated) {
        this.roles.forEach(role => {
            role.techStacks.forEach(ts => names.add(ts.name));
        });
    } else {
        this.techStacks.forEach(ts => names.add(ts.name));
    }
    return Array.from(names);
};


const Roadmap = mongoose.model('Roadmap', RoadmapSchema);
export default Roadmap;
