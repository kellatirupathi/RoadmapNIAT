// // server/models/InternshipMaster.js
// import mongoose from 'mongoose';

// const TechProgressSchema = new mongoose.Schema({
//   techStackName: { type: String, required: true },
//   // ADDED: Field for manual progress override
//   manualProgress: { type: Number, default: null, min: 0, max: 100 }
// }, { _id: false });

// const InternshipMasterSchema = new mongoose.Schema({
//   companies: { type: String, default: '' },
//   roles: { type: String, default: '' },
//   internshipOffers: { type: Number, default: 0 },
//   companyStatus: { type: String, enum: ['Active', 'Inactive', ''], default: 'Active' },
//   reasonInactive: { type: String, default: '' },
//   studentMappingMethod: { type: String, default: '' },
//   studentMappingCounts: { type: Number, default: 0 },
//   internshipStartDate: { type: Date, default: null },
//   stackCompletionDate: { type: Date, default: null },
//   techProgress: [TechProgressSchema]
// }, { timestamps: true });

// const InternshipMaster = mongoose.model('InternshipMaster', InternshipMasterSchema);
// export default InternshipMaster;



import mongoose from 'mongoose';

// Schema for each tech stack mapping within a company
const TechMappingSchema = new mongoose.Schema({
    // Tech stack progress tracking
    techProgress: [{
        techStackName: { type: String, required: true },
        manualProgress: { type: Number, default: null, min: 0, max: 100 }
    }],
    // Mapping specific fields
    mappingOffers: { type: Number, default: 0 },
    technologies: { type: String, default: '' },
    internshipStartDate: { type: Date, default: null },
    stackCompletionDate: { type: Date, default: null },
    internshipDuration: { type: String, default: '' },
    stipendPerMonth: { type: Number, default: 0 },
    location: { type: String, default: '' }
}, { _id: false });

const InternshipMasterSchema = new mongoose.Schema({
    // Company level fields
    companies: { type: String, default: '', required: true },
    roles: { type: String, default: '' },
    internshipOffers: { type: Number, default: 0 },
    companyStatus: { type: String, enum: ['Active', 'Inactive', ''], default: 'Active' },
    reasonInactive: { type: String, default: '' },
    studentMappingMethod: { type: String, default: '' },
    
    // Mapping count (auto-calculated from the length of mappings array)
    studentMappingCounts: { type: Number, default: 0 },
    
    // Array of tech stack mappings
    mappings: [TechMappingSchema]
}, { timestamps: true });

// Virtual for backward compatibility - flattens the first mapping
InternshipMasterSchema.virtual('techProgress').get(function() {
    return this.mappings?.[0]?.techProgress || [];
});

// Virtual for backward compatibility
InternshipMasterSchema.virtual('internshipStartDate').get(function() {
    return this.mappings?.[0]?.internshipStartDate;
});

// Virtual for backward compatibility
InternshipMasterSchema.virtual('stackCompletionDate').get(function() {
    return this.mappings?.[0]?.stackCompletionDate;
});

// Pre-save middleware to update mapping counts
InternshipMasterSchema.pre('save', function(next) {
    if (this.mappings) {
        this.studentMappingCounts = this.mappings.length;
    }
    next();
});

const InternshipMaster = mongoose.model('InternshipMaster', InternshipMasterSchema);

export default InternshipMaster;
