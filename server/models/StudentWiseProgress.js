import mongoose from 'mongoose';

const StudentWiseProgressSchema = new mongoose.Schema({
  uuid: { type: String, default: '' },
  niatId: { type: String, default: '' },
  studentName: { type: String, default: '' },
  company: { type: String, default: '' },
  role: { type: String, default: '' },
}, { timestamps: true });

const StudentWiseProgress = mongoose.model('StudentWiseProgress', StudentWiseProgressSchema);
export default StudentWiseProgress;