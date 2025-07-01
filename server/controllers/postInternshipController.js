// server/controllers/postInternshipController.js
import PostInternship from '../models/PostInternship.js';

// Get a single post-internship record by ID
export const getPostInternshipById = async (req, res) => {
    try {
        const data = await PostInternship.findById(req.params.id);
        if (!data) return res.status(404).json({ success: false, error: 'Record not found' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
    }
};

// Get all post-internship records
export const getAllPostInternships = async (req, res) => {
  try {
    const data = await PostInternship.find().sort({ hiredDate: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// Create a new post-internship record
export const createPostInternship = async (req, res) => {
  try {
    const { companyName, role, studentName, niatId } = req.body;
    const query = { companyName, role, ...(niatId && niatId.trim() !== '' ? { niatId } : { studentName }) };
    const existingEntry = await PostInternship.findOne(query);
    if (existingEntry) {
        return res.status(409).json({ success: false, error: 'This student has already been marked as hired for this role and company.' });
    }
    const newData = await PostInternship.create(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to create entry: ' + error.message });
  }
};

// Update a record (main details only, not tasks)
export const updatePostInternship = async (req, res) => {
  try {
    const { tasks, ...mainDetails } = req.body; // Exclude tasks from this update
    const updatedData = await PostInternship.findByIdAndUpdate(req.params.id, mainDetails, { new: true, runValidators: true });
    if (!updatedData) return res.status(404).json({ success: false, error: 'Entry not found' });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to update entry: ' + error.message });
  }
};

// Delete a record
export const deletePostInternship = async (req, res) => {
  try {
    const deletedData = await PostInternship.findByIdAndDelete(req.params.id);
    if (!deletedData) return res.status(404).json({ success: false, error: 'Entry not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};


// --- START: NEW TASK-SPECIFIC CONTROLLERS ---

// Add a new task to a student's record
export const addTaskToStudent = async (req, res) => {
    try {
        const studentRecord = await PostInternship.findById(req.params.id);
        if (!studentRecord) return res.status(404).json({ success: false, error: 'Student record not found.' });

        studentRecord.tasks.push(req.body);
        await studentRecord.save();
        res.status(201).json({ success: true, data: studentRecord });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Failed to add task: ' + error.message });
    }
};

// Update a specific task for a student
export const updateTaskForStudent = async (req, res) => {
    try {
        const { id, taskId } = req.params;
        const studentRecord = await PostInternship.findById(id);
        if (!studentRecord) return res.status(404).json({ success: false, error: 'Student record not found.' });
        
        const task = studentRecord.tasks.id(taskId);
        if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

        Object.assign(task, req.body);
        await studentRecord.save();
        res.status(200).json({ success: true, data: studentRecord });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Failed to update task: ' + error.message });
    }
};

// Delete a specific task from a student's record
export const deleteTaskFromStudent = async (req, res) => {
    try {
        const { id, taskId } = req.params;
        const studentRecord = await PostInternship.findById(id);
        if (!studentRecord) return res.status(404).json({ success: false, error: 'Student record not found.' });

        const task = studentRecord.tasks.id(taskId);
        if (task) {
          task.remove(); // Use the .remove() method on the subdocument
          await studentRecord.save();
        } else {
            return res.status(404).json({ success: false, error: 'Task not found to delete.' });
        }
        
        res.status(200).json({ success: true, data: studentRecord });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete task: ' + error.message });
    }
};
// --- END: NEW TASK-SPECIFIC CONTROLLERS ---
