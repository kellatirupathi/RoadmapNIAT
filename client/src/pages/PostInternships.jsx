// client/src/pages/PostInternships.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Card, Button, Spinner, Alert, Modal, Form, Row, Col, InputGroup, Pagination } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import postInternshipsService from '../services/postInternshipsService';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Papa from 'papaparse'; // PapaParse is used for CSV generation

// Reusable Form Component for the modal
const PostInternshipForm = ({ data, setData }) => {
    const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });
    const handleDateChange = (date) => setData({ ...data, internshipStartDate: date });
    
    return (
        <Form>
            <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Company Name</Form.Label><Form.Control type="text" name="companyName" value={data.companyName || ''} onChange={handleChange} required /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Role</Form.Label><Form.Control type="text" name="role" value={data.role || ''} onChange={handleChange} required /></Form.Group></Col></Row>
            <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Student Name</Form.Label><Form.Control type="text" name="studentName" value={data.studentName || ''} onChange={handleChange} required /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>NIAT ID</Form.Label><Form.Control type="text" name="niatId" value={data.niatId || ''} onChange={handleChange} /></Form.Group></Col></Row>
            <Row><Col><Form.Group className="mb-3"><Form.Label>Internship Start Date</Form.Label><DatePicker selected={data.internshipStartDate ? new Date(data.internshipStartDate) : null} onChange={handleDateChange} className="form-control" placeholderText="Click to select a date" dateFormat="MM/dd/yyyy" isClearable /></Form.Group></Col></Row>
        </Form>
    );
};

const PostInternships = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const canPerformCUD = user.role === 'admin' || user.role === 'crm';

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchRecords = useCallback(async () => {
        setLoading(true); setError('');
        try { const response = await postInternshipsService.getAll(); setRecords(response.data || []); } 
        catch (err) { setError(err.response?.data?.error || 'Failed to fetch records.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const handleShowModal = (record = null) => { setIsEditing(!!record); setCurrentRecord(record || { companyName: '', role: '', studentName: '', niatId: '', internshipStartDate: null }); setShowModal(true); };
    const handleSave = async () => { setActionLoading(true); try { if (isEditing) { await postInternshipsService.update(currentRecord._id, currentRecord); } else { await postInternshipsService.create(currentRecord); } fetchRecords(); setShowModal(false); } catch (err) { setError(err.response?.data?.error || 'Failed to save record.'); } finally { setActionLoading(false); } };
    const handleDeleteClick = (record) => { setCurrentRecord(record); setShowDeleteConfirm(true); };
    const confirmDelete = async () => { setActionLoading(true); try { await postInternshipsService.remove(currentRecord._id); fetchRecords(); setShowDeleteConfirm(false); } catch (err) { setError(err.response?.data?.error || 'Failed to delete record.'); } finally { setActionLoading(false); } };
    const formatDateForDisplay = (dateString) => { if (!dateString) return <span className="text-muted">Not Set</span>; return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

    // --- START: CORRECTED CSV EXPORT FUNCTION ---
    const handleExportCSV = () => {
        // Use the `filteredRecords` so the export matches what the user sees
        if (!filteredRecords || filteredRecords.length === 0) {
            alert("No data available to export based on the current filters.");
            return;
        }

        // Prepare the data for Papa.unparse by mapping and renaming keys
        const dataForCSV = filteredRecords.map(rec => ({
            "Company": rec.companyName,
            "Role": rec.role,
            "Student Name": rec.studentName,
            "NIAT ID": rec.niatId,
            "Hired Date": new Date(rec.hiredDate).toLocaleDateString(),
            "Internship Start Date": rec.internshipStartDate ? new Date(rec.internshipStartDate).toLocaleDateString() : 'N/A'
        }));

        const csv = Papa.unparse(dataForCSV);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `post-internship-placements-${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        
        link.click();
        
        document.body.removeChild(link);
    };
    // --- END: CORRECTED CSV EXPORT FUNCTION ---

    const filteredRecords = useMemo(() =>
        records.filter(rec => 
            Object.values(rec).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        ), [records, searchTerm]
    );

    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredRecords, currentPage, rowsPerPage]);

    return (
        <>
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
                    <h5>Post-Internship Placements ({records.length})</h5>
                    <div className="d-flex align-items-center gap-2">
                        <InputGroup size="sm" style={{width: '250px'}}><Form.Control placeholder="Search records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><Button variant="outline-secondary" onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></Button></InputGroup>
                        <Button variant="outline-success" size="sm" onClick={handleExportCSV}><i className="fas fa-file-csv me-2"></i>Export</Button>
                        {canPerformCUD && <Button onClick={() => handleShowModal()} size="sm"><i className="fas fa-plus me-2"></i>Add Record</Button>}
                    </div>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    <div className="table-responsive">
                        <Table striped bordered hover size="sm">
                            <thead className="table-light"><tr><th>Company</th><th>Role</th><th>Student</th><th>NIAT ID</th><th>Hired Date</th><th>Internship Start Date</th>{canPerformCUD && <th>Actions</th>}</tr></thead>
                            <tbody>
                                {loading ? (<tr><td colSpan={canPerformCUD ? 7 : 6} className="text-center py-4"><Spinner /></td></tr>)
                                : paginatedRecords.length > 0 ? (paginatedRecords.map(rec => (
                                    <tr key={rec._id}>
                                        <td>{rec.companyName}</td><td>{rec.role}</td>
                                        <td>
                                            <Link to={`/post-internships/${rec._id}/tasks`} className="fw-medium text-decoration-none">
                                                {rec.studentName}
                                            </Link>
                                        </td>
                                        <td>{rec.niatId}</td>
                                        <td>{new Date(rec.hiredDate).toLocaleDateString()}</td>
                                        <td>{formatDateForDisplay(rec.internshipStartDate)}</td>
                                        {canPerformCUD && <td className="text-center"><Button variant="outline-primary" size="sm" onClick={() => handleShowModal(rec)} className="me-2"><i className="fas fa-edit"></i></Button><Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(rec)}><i className="fas fa-trash"></i></Button></td>}
                                    </tr>
                                ))) : (<tr><td colSpan={canPerformCUD ? 7: 6} className="text-center text-muted p-4">No hired student records found.</td></tr>)}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
                {/* Pagination Controls can be added here */}
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Add'} Placement Record</Modal.Title></Modal.Header>
                <Modal.Body><PostInternshipForm data={currentRecord} setData={setCurrentRecord} /></Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={actionLoading}>{actionLoading ? <Spinner size="sm"/> : 'Save'}</Button></Modal.Footer>
            </Modal>
            
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered size="sm"><Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header><Modal.Body>Delete record for <strong>{currentRecord?.studentName}</strong>?</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button><Button variant="danger" onClick={confirmDelete} disabled={actionLoading}>{actionLoading ? <Spinner size="sm"/> : 'Delete'}</Button></Modal.Footer></Modal>
        </>
    );
};
export default PostInternships;
