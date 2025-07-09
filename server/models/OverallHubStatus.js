// server/models/OverallHubStatus.js
import mongoose from 'mongoose';

const OverallHubStatusSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    niatId: { type: String, required: true, trim: true },
    studentName: { type: String, trim: true }, // For reference
    overallStatus: {
        type: String,
        enum: ['Hired', 'Hold', 'Reject', ''],
        default: ''
    }
}, { timestamps: true });

// A unique index ensures that there is only one status record
// for each unique combination of a student (by niatId) and a company.
OverallHubStatusSchema.index({ companyName: 1, niatId: 1 }, { unique: true });

const OverallHubStatus = mongoose.model('OverallHubStatus', OverallHubStatusSchema);
export default OverallHubStatus;
