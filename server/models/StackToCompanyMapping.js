import mongoose from 'mongoose';

const StackToCompanyMappingSchema = new mongoose.Schema({
    // Placeholder schema based on name, as no fields were provided
    companyName: { type: String, default: '' },
    role: { type: String, default: '' },
    techStack: { type: String, default: '' },
    mappingStatus: { type: String, default: 'Active' },
}, { timestamps: true });

const StackToCompanyMapping = mongoose.model('StackToCompanyMapping', StackToCompanyMappingSchema);
export default StackToCompanyMapping;