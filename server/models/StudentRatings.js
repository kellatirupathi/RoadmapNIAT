// server/models/StudentRatings.js
import mongoose from 'mongoose';

const baseSchemaOptions = { timestamps: true };

// --- START: MODIFIED SCHEMA ---
// Sub-schema for edit history, now including a 'changes' array to track modifications.
const EditHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    changes: [{
        field: { type: String, required: true },
        from: { type: String, default: '' },
        to: { type: String, default: '' }
    }]
}, { _id: false });

// This defines the structure of each record in the database.
const createRatingSchema = (extraFields) => new mongoose.Schema({
    ...extraFields,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: [EditHistorySchema] // Use the new history schema
}, baseSchemaOptions);

// Define specific fields for each rating type.
const aseRatingFields = {
    niatId: { type: String, trim: true, index: true }, studentName: { type: String, trim: true, required: true },
    companyName: { type: String, trim: true, required: true }, techStack: String, ase: String,
    presentation: String, communication: String, theoryAnswers: String, coding: String, projectExplanation: String,
    remarks: String, probability: String, interactionRemarks: String, studentFeeling: String
};
const companyInteractionFields = {
    companyName: { type: String, required: true, index: true }, niatId: { type: String, trim: true, index: true },
    studentName: { type: String, trim: true }, trainingPlan: String, trainingCovered: String,
    interactionQuality: String, remarks: String,
};
const assignmentRatingFields = {
    companyName: { type: String, trim: true, index: true }, niatId: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, trim: true }, date: Date, techStack: String, topic: String,
    studentQuestion: String, studentAnswer: String, marks: String, remarks: String,
};
const incrutierRatingFields = {
    companyName: { type: String, trim: true, index: true }, niatId: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, trim: true }, interviewDate: Date, interviewStatus: String,
    selfIntroduction: String, projectExplanation: String, communicationSkills: String,
    technicalTheory: String, programming: String, recordingLink: String, remarks: String,
};
const companyClosingFields = {
    companyName: { type: String, required: true, trim: true, index: true }, niatId: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, trim: true }, date: Date, rating: String, marks: Number, remarks: String,
};
// --- END: MODIFIED SCHEMA ---


export const AseRating = mongoose.model('AseRating', createRatingSchema(aseRatingFields));
export const CompanyInteraction = mongoose.model('CompanyInteraction', createRatingSchema(companyInteractionFields));
export const AssignmentRating = mongoose.model('AssignmentRating', createRatingSchema(assignmentRatingFields));
export const IncrutierRating = mongoose.model('IncrutierRating', createRatingSchema(incrutierRatingFields));
export const CompanyClosing = mongoose.model('CompanyClosing', createRatingSchema(companyClosingFields));
