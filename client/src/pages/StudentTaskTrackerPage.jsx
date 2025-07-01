// client/src/pages/StudentTaskTrackerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import postInternshipsService from '../services/postInternshipsService';
import useAuth from '../hooks/useAuth';

const StudentTaskTrackerPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [studentData, setStudentData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [currentTask, setCurrentTask] = useState({});
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTask, setNewTask] = useState({ date: new Date(), tasksGiven: '', category: '', completedInTime: '', reasonForDelay: '', isReported: '' });
    
    // --- START FIX: Modified canEdit logic ---
    // Now, instructors with the specific permission can also edit.
    const canEdit = user.role === 'admin' || user.role === 'crm' || (user.role === 'instructor' && user.canAccessPostInternships);
    // --- END FIX ---
    
    const categoryOptions = [ 'Understanding codebase', 'Adding new feature', 'Writing APIs', 'Gen AI Application', 'Making changes in existing code', 'Developing' ];
    const yesNoOptions = ['Yes', 'No'];

    const fetchStudentData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await postInternshipsService.getById(studentId);
            setStudentData(response.data);
            setTasks(response.data.tasks || []);
        } catch (err) {
            setError('Failed to fetch student data.');
        } finally { setLoading(false); }
    }, [studentId]);

    useEffect(() => {
        fetchStudentData();
    }, [fetchStudentData]);

    const handleTaskChange = (e) => {
        const { name, value } = e.target;
        setCurrentTask(prev => ({ ...prev, [name]: value }));
    };

    const handleNewTaskChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveTask = async (taskId) => {
        try {
            await postInternshipsService.updateTask(studentId, taskId, currentTask);
            setEditingTaskId(null);
            fetchStudentData(); // Refresh data
        } catch (err) {
            setError('Failed to save task.');
        }
    };
    
    const handleAddTask = async () => {
        if (!newTask.date || !newTask.tasksGiven) {
            setError('Date and Task Given fields are required.');
            return;
        }
        try {
            await postInternshipsService.addTask(studentId, newTask);
            setShowAddForm(false);
            setNewTask({ date: new Date(), tasksGiven: '', category: '', completedInTime: '', reasonForDelay: '', isReported: '' });
            fetchStudentData();
        } catch (err) {
            setError('Failed to add new task.');
        }
    };
    
    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await postInternshipsService.removeTask(studentId, taskId);
                fetchStudentData();
            } catch (err) {
                setError('Failed to delete task.');
            }
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    return (
        <>
            <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left me-2"></i>Back to Placements
            </Button>
            <Card className="mb-4 shadow-sm">
                <Card.Header as="h4">{studentData?.studentName}'s Task Tracker</Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}><strong>Company:</strong> {studentData?.companyName}</Col>
                        <Col md={4}><strong>Role:</strong> {studentData?.role}</Col>
                        <Col md={4}><strong>NIAT ID:</strong> {studentData?.niatId}</Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>Task List</h5>
                    {canEdit && <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>{showAddForm ? 'Cancel' : <><i className="fas fa-plus me-2"></i>Add Task</>}</Button>}
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive">
                        <Table striped bordered hover size="sm">
                            <thead className="table-light"><tr><th>Date</th><th>Tasks Given</th><th>Category</th><th>Completed On Time?</th><th>Reason for Delay</th><th>Reported?</th>{canEdit && <th>Actions</th>}</tr></thead>
                            <tbody>
                                {showAddForm && (
                                    <tr className="bg-light">
                                        <td>
                                            <DatePicker 
                                                selected={newTask.date} 
                                                onChange={date => setNewTask({...newTask, date})} 
                                                className="form-control form-control-sm"
                                                popperPlacement="bottom-start" 
                                                portalId="datepicker-portal"
                                            />
                                        </td>
                                        <td><Form.Control as="textarea" rows={1} size="sm" name="tasksGiven" value={newTask.tasksGiven} onChange={handleNewTaskChange} /></td>
                                        <td><Form.Select size="sm" name="category" value={newTask.category} onChange={handleNewTaskChange}><option value="">Select...</option>{categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Form.Select></td>
                                        <td><Form.Select size="sm" name="completedInTime" value={newTask.completedInTime} onChange={handleNewTaskChange}><option value="">Select...</option>{yesNoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Form.Select></td>
                                        <td><Form.Control as="textarea" rows={1} size="sm" name="reasonForDelay" value={newTask.reasonForDelay} onChange={handleNewTaskChange} /></td>
                                        <td><Form.Select size="sm" name="isReported" value={newTask.isReported} onChange={handleNewTaskChange}><option value="">Select...</option>{yesNoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Form.Select></td>
                                        <td><Button size="sm" variant="success" onClick={handleAddTask}>Save</Button></td>
                                    </tr>
                                )}
                                {tasks.map(task => (
                                    editingTaskId === task._id ? (
                                        <tr key={task._id}>
                                            <td>
                                                <DatePicker 
                                                    selected={new Date(currentTask.date)} 
                                                    onChange={date => setCurrentTask({...currentTask, date})} 
                                                    className="form-control form-control-sm" 
                                                    popperPlacement="bottom-start"
                                                    portalId="datepicker-portal"
                                                />
                                            </td>
                                            <td><Form.Control as="textarea" rows={1} size="sm" name="tasksGiven" value={currentTask.tasksGiven} onChange={handleTaskChange} /></td>
                                            <td><Form.Select size="sm" name="category" value={currentTask.category} onChange={handleTaskChange}><option value="">Select...</option>{categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Form.Select></td>
                                            <td><Form.Select size="sm" name="completedInTime" value={currentTask.completedInTime} onChange={handleTaskChange}><option value="">Select...</option>{yesNoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Form.Select></td>
                                            <td><Form.Control as="textarea" rows={1} size="sm" name="reasonForDelay" value={currentTask.reasonForDelay} onChange={handleTaskChange} /></td>
                                            <td><Form.Select size="sm" name="isReported" value={currentTask.isReported} onChange={handleTaskChange}><option value="">Select...</option>{yesNoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Form.Select></td>
                                            <td><Button size="sm" variant="success" onClick={() => handleSaveTask(task._id)} className="me-2"><i className="fas fa-save"></i></Button><Button size="sm" variant="secondary" onClick={() => setEditingTaskId(null)}><i className="fas fa-times"></i></Button></td>
                                        </tr>
                                    ) : (
                                        <tr key={task._id}>
                                            <td>{new Date(task.date).toLocaleDateString()}</td><td>{task.tasksGiven}</td><td>{task.category}</td><td>{task.completedInTime}</td><td>{task.reasonForDelay}</td><td>{task.isReported}</td>
                                            {canEdit && <td><Button size="sm" variant="outline-primary" onClick={() => { setEditingTaskId(task._id); setCurrentTask(task); }} className="me-2"><i className="fas fa-edit"></i></Button><Button size="sm" variant="outline-danger" onClick={() => handleDeleteTask(task._id)}><i className="fas fa-trash"></i></Button></td>}
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </>
    );
};
export default StudentTaskTrackerPage;
