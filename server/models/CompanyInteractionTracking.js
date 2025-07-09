// server/models/CompanyInteractionTracking.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Using UUID for a non-guessable public ID

// Nested schema for each student within an interaction session
const StudentInteractionSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    niatId: { type: String, trim: true },
    trainingPlan: { type: String, trim: true }, // Set by admin
    trainingCovered: { type: String, trim: true }, // Set by admin
    interactionQuality: { type: String, default: '' }, // Editable by public
    remarks: { type: String, default: '', trim: true } // Editable by public
}, { _id: true });

// Nested schema for each distinct interaction session (e.g., Interaction 1, Interaction 2)
const InteractionSessionSchema = new mongoose.Schema({
    sessionName: { type: String, required: true },
    studentData: [StudentInteractionSchema]
});

// Main schema for a company's interaction tracking record
const CompanyInteractionTrackingSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true,
        unique: true // A company should only have one tracking record
    },
    publicId: { // The unique ID for the public URL
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    interactions: [InteractionSessionSchema]
}, { timestamps: true });

CompanyInteractionTrackingSchema.index({ publicId: 1 });

const CompanyInteractionTracking = mongoose.model('CompanyInteractionTracking', CompanyInteractionTrackingSchema);
export default CompanyInteractionTracking;
