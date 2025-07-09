// server/models/StudentRatings.js
import mongoose from 'mongoose';

const baseSchemaOptions = { timestamps: true };

const AseRatingSchema = new mongoose.Schema({
    niatId: { type: String, trim: true, index: true },
    studentName: { type: String, trim: true, required: true },
    companyName: { type: String, trim: true, required: true },
    section: String,
    techStack: String, // --- NEW FIELD ---
    ase: String,       // --- NEW FIELD ---
    presentation: String,
    communication: String,
    theoryAnswers: String,
    coding: String,
    projectExplanation: String,
    remarks: String,
    probability: String,
    interactionRemarks: String,
    studentFeeling: String,
}, baseSchemaOptions);

const CompanyInteractionSchema = new mongoose.Schema({
    companyName: { type: String, required: true, index: true },
    niatId: { type: String, trim: true, index: true },
    studentName: { type: String, trim: true },
    trainingPlan: String,
    trainingCovered: String, // <--- ADDED THIS LINE
    interactionQuality: String,
    remarks: String,
}, baseSchemaOptions);

// --- MODIFIED SCHEMA ---
const AssignmentRatingSchema = new mongoose.Schema({
    companyName: { type: String, trim: true, index: true },
    niatId: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, trim: true },
    date: Date,
    techStack: String,
    topic: String,
    studentQuestion: String, // --- NEW FIELD ---
    studentAnswer: String,   // --- NEW FIELD ---
    marks: String, // Stored as 'X/Y'
    remarks: String,
}, baseSchemaOptions);

// --- MODIFIED SCHEMA ---
const IncrutierRatingSchema = new mongoose.Schema({
    companyName: { type: String, trim: true, index: true },
    niatId: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, trim: true },
    interviewDate: Date,
    interviewStatus: String,
    selfIntroduction: String,
    projectExplanation: String,
    communicationSkills: String,
    technicalTheory: String,
    programming: String,
    recordingLink: String, // --- NEW FIELD ---
    remarks: String,
}, baseSchemaOptions);

const CompanyClosingSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true, index: true },
    niatId: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, trim: true },
    date: Date,
    rating: String,
    marks: Number,
    remarks: String,
}, baseSchemaOptions);

export const AseRating = mongoose.model('AseRating', AseRatingSchema);
export const CompanyInteraction = mongoose.model('CompanyInteraction', CompanyInteractionSchema);
export const AssignmentRating = mongoose.model('AssignmentRating', AssignmentRatingSchema);
export const IncrutierRating = mongoose.model('IncrutierRating', IncrutierRatingSchema);
export const CompanyClosing = mongoose.model('CompanyClosing', CompanyClosingSchema);
