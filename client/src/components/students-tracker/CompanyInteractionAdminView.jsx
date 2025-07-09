// client/src/components/students-tracker/CompanyInteractionAdminView.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Table, Button, Spinner, Alert, Modal, Form, Row, Col, InputGroup } from 'react-bootstrap';
import companyInteractionTrackingService from '../../services/companyInteractionTrackingService';
import { ratingCalculations } from '../../utils/studentsTrackerConfig.js';

const CompanyInteractionAdminView = ({ onUpdate, user }) => {
    // --- START MODIFICATION: Updated canEdit logic to restrict CRM role to view-only ---
    // Now, only the 'admin' role can add, edit, or delete records on this specific tab.
    const canEdit = user && user.role === 'admin';
    // --- END MODIFICATION ---

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); 
    const [error, setError] = useState('');
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null); 
    
    const [companyName, setCompanyName] = useState('');
    const [students, setStudents] = useState([{ niatId: '', studentName: '', trainingPlan: '', trainingCovered: '' }]);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [viewMode, setViewMode] = useState('company'); 

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const response = await companyInteractionTrackingService.getAll();
            setRecords(response.data || []);
        } catch (err) {
            setError('Failed to fetch interaction records.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const studentViewData = useMemo(() => {
        if (!records) return [];
        const flatList = [];
        records.forEach(companyRecord => {
            (companyRecord.interactions || []).forEach(session => {
                (session.studentData || []).forEach(student => {
                    flatList.push({
                        _id: `${companyRecord._id}-${session._id}-${student._id}`,
                        companyName: companyRecord.companyName,
                        niatId: student.niatId,
                        studentName: student.studentName,
                        interactionType: session.sessionName,
                        trainingPlan: student.trainingPlan,
                        trainingCovered: student.trainingCovered,
                        interactionQuality: student.interactionQuality,
                        remarks: student.remarks,
                        overallMarks: ratingCalculations.companyInteractions(student)
                    });
                });
            });
        });
        
        const studentMarksMap = new Map();
        
        flatList.forEach(item => {
            const key = `${item.companyName}|${item.niatId}`;
            const currentScore = parseInt(item.overallMarks.split('/')[0], 10);
            
            if (!studentMarksMap.has(key)) {
                studentMarksMap.set(key, { total: 0, count: 0 });
            }
            
            const entry = studentMarksMap.get(key);
            entry.total += currentScore;
            entry.count += 1;
        });

        return flatList.map(item => {
            const key = `${item.companyName}|${item.niatId}`;
            const stats = studentMarksMap.get(key);
            const average = stats.count > 0 ? (stats.total / stats.count) : 0;
            return {
                ...item,
                avgMarks: `${average.toFixed(2)} / 20`
            };
        });
    }, [records]);

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setCurrentRecord(null);
        setCompanyName('');
        setStudents([{ niatId: '', studentName: '', trainingPlan: '', trainingCovered: '' }]);
        setShowAddEditModal(true);
        setError('');
    };

    const handleOpenEditModal = async (recordSummary) => {
        setIsEditing(true);
        setActionLoading(recordSummary._id);
        setError('');

        try {
            const response = await companyInteractionTrackingService.getById(recordSummary._id);
            const fullRecord = response.data;
            setCurrentRecord(fullRecord);
            setCompanyName(fullRecord.companyName);
            if (fullRecord.interactions && fullRecord.interactions.length > 0) {
                setStudents(fullRecord.interactions[0].studentData.map(s => ({ ...s })));
            } else {
                setStudents([{ niatId: '', studentName: '', trainingPlan: '', trainingCovered: '' }]);
            }
            setShowAddEditModal(true);
        } catch (err) {
            setError('Failed to load record details.');
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleAddStudent = () => setStudents(prev => [...prev, { niatId: '', studentName: '', trainingPlan: '', trainingCovered: '' }]);
    
    const handleRemoveStudent = (index) => {
        if (students.length > 1) {
            setStudents(prev => prev.filter((_, i) => i !== index));
        }
    };
    
    const handleStudentChange = (index, e) => {
        const { name, value } = e.target;
        setStudents(prev => prev.map((s, i) => i === index ? { ...s, [name]: value } : s));
    };

    const handleSave = async () => {
        if (!companyName.trim() || students.every(s => !s.studentName.trim())) {
            setError('Company Name and at least one Student Name are required.');
            return;
        }
        setActionLoading(isEditing ? currentRecord._id : true);
        setError('');
        
        let payload;

        if (isEditing) {
            const updatedInteractions = currentRecord.interactions.map((session, index) => 
                index === 0 ? { ...session, studentData: students } : session
            );
            payload = {
                companyName,
                interactions: updatedInteractions
            };
        } else {
            payload = {
                companyName,
                students
            };
        }

        try {
            if (isEditing) {
                await companyInteractionTrackingService.update(currentRecord._id, payload);
            } else {
                await companyInteractionTrackingService.create(payload);
            }
            fetchRecords();
            if (onUpdate) onUpdate('companyInteractionTracking'); // Notify parent
            setShowAddEditModal(false);
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} record.`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddInteraction = async (recordId) => {
        setActionLoading(recordId);
        try { await companyInteractionTrackingService.addSession(recordId); fetchRecords(); if (onUpdate) onUpdate('companyInteractionTracking'); }
        catch (err) { setError(`Failed to add interaction for this company.`); }
        finally { setActionLoading(null); }
    };
    
    const handleRemoveInteraction = async (recordId) => {
        setActionLoading(recordId);
        try { await companyInteractionTrackingService.removeSession(recordId); fetchRecords(); if (onUpdate) onUpdate('companyInteractionTracking'); }
        catch (err) { setError(`Failed to remove interaction for this company.`); }
        finally { setActionLoading(null); }
    };
    
    const handleDeleteClick = (record) => { setCurrentRecord(record); setShowDeleteConfirm(true); };

    const confirmDelete = async () => {
        if (!currentRecord) return;
        setActionLoading(currentRecord._id);
        try {
            await companyInteractionTrackingService.remove(currentRecord._id);
            fetchRecords();
            if (onUpdate) onUpdate('companyInteractionTracking');
            setShowDeleteConfirm(false);
            setCurrentRecord(null);
        } catch(err) {
            setError(`Failed to delete record for ${currentRecord.companyName}.`);
        } finally {
            setActionLoading(null);
        }
    };
    
    const copyToClipboard = (text) => navigator.clipboard.writeText(text);

    return (
        <div>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            <Card.Header className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <h5 className="mb-0">Interaction Tracking Overview</h5>
                <div className="d-flex align-items-center gap-2">
                    <div className="btn-group btn-group-sm">
                        <Button variant={viewMode === 'company' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('company')} title="Company View"><i className="fas fa-building"></i></Button>
                        <Button variant={viewMode === 'student' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('student')} title="Student View"><i className="fas fa-users"></i></Button>
                    </div>
                    {canEdit && (
                        <Button onClick={handleOpenAddModal} size="sm"><i className="fas fa-plus me-2"></i>Add Record</Button>
                    )}
                </div>
            </Card.Header>

            {viewMode === 'company' ? (
                <div className="table-responsive">
                    <Table striped bordered hover size="sm" className="align-middle">
                        <thead className="table-light">
                            <tr><th>Company Name</th><th className="text-center">Students Count</th><th className="text-center">Interactions Count</th><th style={{ width: '40%' }}>Public Link</th>{canEdit && <th className="text-center" style={{width: '120px'}}>Actions</th>}</tr>
                        </thead>
                        <tbody>
                            {loading ? (<tr><td colSpan={canEdit ? 5 : 4} className="text-center p-4"><Spinner/></td></tr>)
                            : records.length === 0 ? (<tr><td colSpan={canEdit ? 5 : 4} className="text-center p-4 text-muted">No records found.</td></tr>)
                            : (records.map(rec => {
                                    const studentCount = rec.interactions?.[0]?.studentData?.length || 0;
                                    const interactionCount = rec.interactions?.length || 0;
                                    
                                    return (
                                    <tr key={rec._id}>
                                        <td className="fw-medium">{rec.companyName}</td>
                                        <td className="text-center">{studentCount}</td>
                                        <td className="text-center">
                                            {canEdit ? (
                                                <div className="d-flex justify-content-center align-items-center">
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleRemoveInteraction(rec._id)} disabled={actionLoading === rec._id || interactionCount <= 1}><i className="fas fa-minus"></i></Button>
                                                    <span className="mx-2 fw-bold">{interactionCount}</span>
                                                    <Button variant="outline-success" size="sm" onClick={() => handleAddInteraction(rec._id)} disabled={actionLoading === rec._id}><i className="fas fa-plus"></i></Button>
                                                </div>
                                            ) : (
                                                <span className="fw-bold">{interactionCount}</span>
                                            )}
                                        </td>
                                        <td>
                                            <InputGroup size="sm">
                                                <Form.Control readOnly value={`${window.location.origin}/public/interaction/${rec.publicId}`} />
                                                <Button variant="outline-secondary" onClick={() => copyToClipboard(`${window.location.origin}/public/interaction/${rec.publicId}`)}><i className="fas fa-copy"></i></Button>
                                            </InputGroup>
                                        </td>
                                        {canEdit && (
                                            <td className="text-center">
                                                <Button variant="link" className="text-primary p-1" onClick={() => handleOpenEditModal(rec)}>
                                                    {actionLoading === rec._id ? <Spinner size="sm" /> : <i className="fas fa-edit"></i>}
                                                </Button>
                                                <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteClick(rec)}><i className="fas fa-trash"></i></Button>
                                            </td>
                                        )}
                                    </tr>
                                    )
                                }))
                            }
                        </tbody>
                    </Table>
                </div>
            ) : (
                 <div className="table-responsive">
                    <Table striped bordered hover size="sm" className="align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Company</th><th>NIAT ID</th><th>Student Name</th><th>Interaction Type</th><th>Training Plan</th><th>Training Covered</th><th style={{ minWidth: '250px' }}>Interaction Quality</th><th>Remarks</th><th>Overall Marks</th><th>Avg Marks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (<tr><td colSpan="10" className="text-center p-4"><Spinner/></td></tr>)
                            : studentViewData.length === 0 ? (<tr><td colSpan="10" className="text-center p-4 text-muted">No student data found.</td></tr>)
                            : (studentViewData.map(row => (
                                <tr key={row._id}>
                                    <td>{row.companyName}</td><td>{row.niatId}</td><td>{row.studentName}</td><td>{row.interactionType}</td><td>{row.trainingPlan}</td><td>{row.trainingCovered}</td><td style={{ minWidth: '250px' }}>{row.interactionQuality}</td><td>{row.remarks}</td><td className="text-center ">{row.overallMarks}</td><td className="text-center fw-bold">{row.avgMarks}</td>
                                </tr>
                            )))}
                        </tbody>
                    </Table>
                </div>
            )}


             <Modal show={showAddEditModal} onHide={() => setShowAddEditModal(false)} size="xl" centered>
                <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Create'} Company Interaction Record</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3"><Form.Label>Company Name</Form.Label><Form.Control type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required /></Form.Group>
                    <hr/>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">{isEditing ? "Student List (Session 1)" : "Initial Student List"}</h6>
                        <Button variant="success" size="sm" onClick={handleAddStudent}><i className="fas fa-plus me-1"></i> Add Student</Button>
                    </div>
                    <div className="table-responsive" style={{ maxHeight: '50vh' }}>
                        <Table striped size="sm">
                            <thead><tr><th>NIAT ID</th><th>Student Name</th><th>Training Plan</th><th>Training Covered</th><th></th></tr></thead>
                            <tbody>{students.map((s, i) => (
                                <tr key={i}>
                                    <td><Form.Control size="sm" name="niatId" value={s.niatId} onChange={(e) => handleStudentChange(i, e)} /></td>
                                    <td><Form.Control size="sm" name="studentName" value={s.studentName} onChange={(e) => handleStudentChange(i, e)} /></td>
                                    <td><Form.Control as="textarea" rows={1} size="sm" name="trainingPlan" value={s.trainingPlan} onChange={(e) => handleStudentChange(i, e)} /></td>
                                    <td><Form.Control as="textarea" rows={1} size="sm" name="trainingCovered" value={s.trainingCovered} onChange={(e) => handleStudentChange(i, e)} /></td>
                                    <td><Button variant="outline-danger" size="sm" onClick={() => handleRemoveStudent(i)} disabled={students.length <= 1}><i className="fas fa-trash"></i></Button></td>
                                </tr>))}
                            </tbody>
                        </Table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={!!actionLoading}>{actionLoading ? <Spinner size="sm"/> : (isEditing ? 'Save Changes' : 'Create Record')}</Button>
                </Modal.Footer>
            </Modal>
            
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered size="sm">
                <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
                <Modal.Body>Delete record for <strong>{currentRecord?.companyName}</strong>?</Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button><Button variant="danger" onClick={confirmDelete} disabled={!!actionLoading}>{actionLoading ? <Spinner size="sm"/> : 'Delete'}</Button></Modal.Footer>
            </Modal>
        </div>
    );
};

export default CompanyInteractionAdminView;
