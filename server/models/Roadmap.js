// server/models/Roadmap.js
import mongoose from 'mongoose';

// Schema for individual role data within a consolidated roadmap
const RoleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  techStacks: [{ // This will store ObjectId references to TechStack documents
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TechStack', // Crucial for Mongoose populate
    required: true
  }]
});

// Main Roadmap Schema
const RoadmapSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  role: { 
    type: String, // Main role for non-consolidated, or e.g., "Consolidated" for type
    required: true,
    trim: true
  },
  techStacks: [{ // Overall list of tech stack *names* for the entire roadmap
    type: String, 
    required: true,
    trim: true
  }],
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
  isConsolidated: {
    type: Boolean,
    default: false
  },
  crmAffiliation: { // Username of the CRM user/entity
    type: String,
    trim: true,
    index: true, // Index for faster querying
    default: null // Or an empty string, null allows easier "not assigned" queries
  },
  roles: [RoleSchema], // Array of role-specific details
  createdDate: {
    type: Date,
    default: Date.now
  }
});

const Roadmap = mongoose.model('Roadmap', RoadmapSchema);
export default Roadmap;