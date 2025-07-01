// client/src/components/critical-points/CompaniesStatus.jsx
import React, { useState, useMemo, useRef } from 'react';
import { Table, Button, Spinner, Alert, Card, Modal, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { companyStatusService } from '../../services/criticalPointsService.js';
import Papa from 'papaparse';

// Reusable Modal Component for creating/editing entire company records
const CompanyStatusModal = ({ show, handleClose, isEditing, data, onSave, loading }) => {
    const [formData, setFormData] = useState(JSON.parse(JSON.stringify(data)));

    const handleMainChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    
    const handleStudentChange = (index, e) => {
        const { name, value } = e.target;
        const newStudents = [...formData.students];
        newStudents[index][name] = value;
        setFormData(prev => ({...prev, students: newStudents}));
    };
    
    const handleAddStudent = () => {
        const newStudent = { studentName: '', niatId: '', technicalScore: '', sincerityScore: '', communicationScore: '' };
        setFormData(prev => ({ ...prev, students: [...prev.students, newStudent]}));
    };

    const handleRemoveStudent = (index) => {
        if (formData.students.length <= 1) return;
        const newStudents = [...formData.students];
        newStudents.splice(index, 1);
        setFormData(prev => ({ ...prev, students: newStudents}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
            <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Add'} Company Status</Modal.Title></Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem'}}>
                    <Row className="mb-4 align-items-center">
                        <Col md={5}><Form.Group><Form.Label>Company Name</Form.Label><Form.Control type="text" name="companyName" value={formData.companyName || ''} onChange={handleMainChange} required /></Form.Group></Col>
                        <Col md={4}><Form.Group><Form.Label>Role</Form.Label><Form.Control type="text" name="role" value={formData.role || ''} onChange={handleMainChange} required /></Form.Group></Col>
                        <Col md={3}><Form.Group><Form.Label>Openings</Form.Label><Form.Control type="number" name="openings" value={formData.openings || 1} onChange={handleMainChange} required min="1" /></Form.Group></Col>
                    </Row>
                    
                    <h5 className="mb-3">Student Details</h5>
                    <div className="d-none d-md-flex row g-2 mb-2 text-muted small">
                         <div className="col-md-3">Student Name</div><div className="col-md-3">NIAT ID</div>
                         <div className="col text-center">Tech %</div><div className="col text-center">Sincere %</div>
                         <div className="col text-center">Comm %</div><div className="col-auto" style={{width: '45px'}}></div>
                    </div>

                    {formData.students.map((student, index) => (
                        <Row key={index} className="g-2 align-items-center mb-2">
                            <Col md={3}><Form.Control size="sm" name="studentName" value={student.studentName} onChange={(e) => handleStudentChange(index, e)} placeholder="Student Name" required/></Col>
                            <Col md={3}><Form.Control size="sm" name="niatId" value={student.niatId} onChange={(e) => handleStudentChange(index, e)} placeholder="NIAT ID" /></Col>
                            <Col><InputGroup size="sm"><Form.Control type="text" name="technicalScore" value={student.technicalScore} onChange={(e) => handleStudentChange(index, e)} placeholder="Tech" title="Technical %"/><InputGroup.Text>%</InputGroup.Text></InputGroup></Col>
                            <Col><InputGroup size="sm"><Form.Control type="text" name="sincerityScore" value={student.sincerityScore} onChange={(e) => handleStudentChange(index, e)} placeholder="Sincere" title="Sincerity %" /><InputGroup.Text>%</InputGroup.Text></InputGroup></Col>
                            <Col><InputGroup size="sm"><Form.Control type="text" name="communicationScore" value={student.communicationScore} onChange={(e) => handleStudentChange(index, e)} placeholder="Comm" title="Communication %" /><InputGroup.Text>%</InputGroup.Text></InputGroup></Col>
                            <Col xs="auto"><Button variant="outline-danger" size="sm" onClick={() => handleRemoveStudent(index)} title="Remove Student"><i className="fas fa-times"></i></Button></Col>
                        </Row>
                    ))}
                    <Button variant="outline-primary" size="sm" onClick={handleAddStudent} className="mt-2"><i className="fas fa-plus me-2"></i>Add Student</Button>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={loading}>{loading ? <Spinner as="span" size="sm" /> : (isEditing ? 'Save Changes' : 'Save Record')}</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

// Main Component
const CompaniesStatus = ({ data, canEdit, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [currentRecord, setCurrentRecord] = useState(null);
    
    // States for CSV upload
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingCsv, setUploadingCsv] = useState(false);
    const [csvError, setCsvError] = useState('');
    const [csvData, setCsvData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const fileInputRef = useRef(null);

    const processedData = useMemo(() => {
        return data.map(item => {
            const studentsWithAvg = item.students.map(student => {
                const tech = parseFloat(student.technicalScore) || 0;
                const sincere = parseFloat(student.sincerityScore) || 0;
                const comm = parseFloat(student.communicationScore) || 0;
                const avg = Math.round((tech + sincere + comm) / 3);
                return { ...student, overallEachStudentProbability: avg };
            });
            const totalProbability = studentsWithAvg.reduce((sum, s) => sum + s.overallEachStudentProbability, 0);
            const overallCompanyProbability = studentsWithAvg.length > 0 ? Math.round(totalProbability / studentsWithAvg.length) : 0;
            const closingStatus = overallCompanyProbability >= 90 ? 'Can Close' : overallCompanyProbability >= 70 ? 'Moderate' : 'Risk';
            return { ...item, students: studentsWithAvg, overallCompanyProbability, closingStatus };
        });
    }, [data]);
    
    const handleShowModal = (record = null) => {
        setError(null);
        setCurrentRecord(record || { companyName: '', role: '', openings: 1, students: [{studentName: '', niatId: '', technicalScore: '', sincerityScore: '', communicationScore: '' }] });
        setShowModal(true);
    };

    const handleSave = async (formData) => {
        setLoading(true); setError(null);
        try {
            if (formData._id) await companyStatusService.update(formData._id, formData);
            else await companyStatusService.create(formData);
            onUpdate();
            setShowModal(false);
        } catch (err) { setError(err.response?.data?.error || 'Failed to save record.'); } 
        finally { setLoading(false); }
    };

    const handleDeleteClick = (record) => { setRecordToDelete(record); setShowDeleteConfirm(true); };

    const confirmDelete = async () => {
        if (!recordToDelete) return; 
        setLoading(true);
        try {
            await companyStatusService.delete(recordToDelete._id);
            onUpdate();
        } catch (err) { setError(err.response?.data?.error || 'Failed to delete record.'); }
        finally { setLoading(false); setShowDeleteConfirm(false); setRecordToDelete(null); }
    };
    
    const handleOverallStatusChange = async (companyId, studentId, newStatus) => {
        setActionLoading(true);
        setError(null);
        try {
            await companyStatusService.updateStudentStatus(companyId, studentId, newStatus);
            onUpdate(); 
        } catch (err) {
            setError(err.response?.data?.error || "An error occurred while updating status.");
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleOpenUploadModal = () => {
        setCsvData([]);
        setCsvHeaders([]);
        setCsvError('');
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowUploadModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setCsvData([]); setCsvHeaders([]);
            return;
        }
        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: (results) => {
                setCsvHeaders(results.meta.fields || []);
                setCsvData(results.data);
                setCsvError('');
            },
            error: (err) => setCsvError('Error parsing CSV: ' + err.message),
        });
    };

    const handleSaveCsvData = async () => {
        if (!csvData.length) { setCsvError('No data to upload.'); return; }
        setUploadingCsv(true); setCsvError(''); setError('');
        try {
            await companyStatusService.bulkUpload(csvData);
            setShowUploadModal(false); onUpdate();
        } catch (err) { setCsvError(err.response?.data?.error || 'Failed to upload CSV data.'); }
        finally { setUploadingCsv(false); }
    };

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'Can Close': return 'text-success';
            case 'Moderate': return 'text-warning';
            case 'Risk': return 'text-danger';
            default: return 'text-muted';
        }
    };
  
    const renderTableRows = () => {
        if (!processedData || processedData.length === 0) {
            return (<tr><td colSpan={canEdit ? 13 : 12} className="text-center text-muted p-4">No records found.</td></tr>);
        }

        const rows = [];
        processedData.forEach(item => {
            if (!item.students || item.students.length === 0) {
                 rows.push(<tr key={item._id}><td className="align-middle">{item.companyName}</td><td className="align-middle">{item.role}</td><td className="align-middle text-center">{item.openings}</td><td className="align-middle text-center">0</td><td colSpan="5" className="text-muted text-center">No students assigned.</td><td className="align-middle text-center fw-bold">0%</td><td className="align-middle text-center">N/A</td><td>-</td>{canEdit && <td className="text-center align-middle"><Button variant="link" className="p-1 me-2" onClick={() => handleShowModal(item)}><i className="fas fa-edit"></i></Button><Button variant="link" className="p-1 text-danger" onClick={() => handleDeleteClick(item)}><i className="fas fa-trash"></i></Button></td>}</tr>); return;
            }
            item.students.forEach((student, index) => {
                rows.push(
                    <tr key={`${item._id}-${student._id || index}`}>
                        {index === 0 && <><td className="align-middle" rowSpan={item.students.length}>{item.companyName}</td><td className="align-middle" rowSpan={item.students.length}>{item.role}</td><td className="align-middle text-center" rowSpan={item.students.length}>{item.openings}</td><td className="align-middle text-center" rowSpan={item.students.length}>{item.students.length}</td></>}
                        <td>{student.studentName}</td><td className="text-center">{student.technicalScore}%</td><td className="text-center">{student.sincerityScore}%</td><td className="text-center">{student.communicationScore}%</td><td className="text-center fw-bold">{student.overallEachStudentProbability}%</td>
                        {index === 0 && <><td className="align-middle text-center fw-bold" rowSpan={item.students.length}>{item.overallCompanyProbability}%</td><td className={`align-middle text-center fw-bold ${getStatusColorClass(item.closingStatus)}`} rowSpan={item.students.length}>{item.closingStatus}</td></>}
                        <td className="text-center align-middle">{canEdit ? <Form.Select size="sm" value={student.overallStatus || ''} onChange={(e) => handleOverallStatusChange(item._id, student._id, e.target.value)} disabled={actionLoading} style={{minWidth:'100px'}}><option value="">- Select -</option><option value="Hired">Hired</option><option value="Hold">Hold</option><option value="Reject">Reject</option></Form.Select> : student.overallStatus || <span className="text-muted fst-italic">N/A</span>}</td>
                        {canEdit && index === 0 && <td rowSpan={item.students.length} className="text-center align-middle"><Button variant="link" className="p-1 me-2" onClick={() => handleShowModal(item)} title="Edit"><i className="fas fa-edit"></i></Button><Button variant="link" className="p-1 text-danger" onClick={() => handleDeleteClick(item)} title="Delete"><i className="fas fa-trash"></i></Button></td>}
                    </tr>
                );
            });
        });
        return rows;
    };
  
    return (
        <>
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>Companies Closing Status</h5>
                    {canEdit && <div className="d-flex gap-2">
                        <Button onClick={handleOpenUploadModal} variant="outline-success" size="sm"><i className="fas fa-file-csv me-2"></i>Upload CSV</Button>
                        <Button onClick={() => handleShowModal()} size="sm"><i className="fas fa-plus me-2"></i>Add Record</Button>
                    </div>}
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
                    <div className="table-responsive">
                        <Table striped bordered hover size="sm">
                            <thead className="table-light text-center">
                                <tr><th>Company</th><th>Role</th><th>Openings</th><th>Students Assigned</th><th>Student Name</th><th>Tech %</th><th>Sincere %</th><th>Comm %</th><th>Overall (Student)</th><th>Overall (Company)</th><th>Closing Status</th><th>Overall Status</th>{canEdit && <th>Actions</th>}</tr>
                            </thead>
                            <tbody>{renderTableRows()}</tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {showModal && <CompanyStatusModal show={showModal} handleClose={() => setShowModal(false)} isEditing={!!currentRecord?._id} data={currentRecord} onSave={handleSave} loading={loading} />}

            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered size="sm">
                <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
                <Modal.Body>This action will delete the entire record for <strong>{recordToDelete?.companyName} - {recordToDelete?.role}</strong>.</Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button><Button variant="danger" onClick={confirmDelete} disabled={loading}>{loading ? <Spinner size="sm"/> : 'Delete'}</Button></Modal.Footer>
            </Modal>

            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg" centered backdrop="static">
                <Modal.Header closeButton><Modal.Title><i className="fas fa-file-csv me-2"></i>Upload CSV for Company Status</Modal.Title></Modal.Header>
                <Modal.Body>
                    {csvError && <Alert variant="danger">{csvError}</Alert>}
                    <p className="small text-muted">Required columns: <strong>Company Name, Role, Openings, Student Name, NIAT ID, Technical Score, Sincerity Score, Communication Score</strong>. Each row should represent one student assignment.</p>
                    <Form.Group controlId="csvFile" className="mb-3"><Form.Control type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} /></Form.Group>
                    {csvData.length > 0 && (
                        <div>
                            <h6>CSV Preview ({csvData.length} rows found)</h6>
                            <div className="table-responsive" style={{ maxHeight: '40vh' }}>
                                <Table striped bordered hover size="sm">
                                    <thead><tr>{csvHeaders.map(h => <th key={h}>{h}</th>)}</tr></thead>
                                    <tbody>{csvData.slice(0, 10).map((row, i) => <tr key={i}>{csvHeaders.map(h => <td key={h} title={row[h]}>{row[h]}</td>)}</tr>)}</tbody>
                                </Table>
                                {csvData.length > 10 && <p className="text-muted small">Showing first 10 rows...</p>}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveCsvData} disabled={uploadingCsv || csvData.length === 0}>{uploadingCsv ? <><Spinner as="span" size="sm" /> Uploading...</> : 'Upload & Save'}</Button></Modal.Footer>
            </Modal>
        </>
    );
};

export default CompaniesStatus;
