// // client/src/pages/CriticalPoints.jsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { Spinner, Alert, Card } from 'react-bootstrap';
// // --- REMOVED: Nav and useLocation are no longer needed as the tab interface is gone. ---
// import useAuth from '../hooks/useAuth.js';
// import InteractionsFeedback from '../components/critical-points/InteractionsFeedback.jsx';
// // --- REMOVED: 'companyStatusService' and 'CompaniesStatus' component imports were deleted. ---
// import { interactionsService } from '../services/criticalPointsService.js';

// const CriticalPointsPage = () => {
//     const { user } = useAuth();

//     // --- REMOVED: State management for activeTab is no longer necessary. ---
//     const [interactionsData, setInteractionsData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
    
//     // --- MODIFICATION: The fetchData function has been simplified. ---
//     // It no longer needs to fetch data for two different components and now only retrieves
//     // the 'interactions' data, reducing complexity and improving performance.
//     const fetchData = useCallback(async () => {
//         setLoading(true);
//         setError('');
//         try {
//             const interactionsRes = await interactionsService.getAll();
//             setInteractionsData(interactionsRes.data || []);
//             // --- REMOVED: The API call to companyStatusService.getAll() has been deleted. ---
//         } catch (err) {
//             setError(err.response?.data?.error || 'Failed to fetch critical points data.');
//         } finally {
//             setLoading(false);
//         }
//     }, []);
    
//     // Authorization check to determine if the user has editing rights on the page.
//     const canEdit = user.role === 'admin' || user.role === 'crm' || (user.role === 'instructor' && user.canAccessCriticalPoints);
    
//     // Initial data fetch when the component mounts.
//     useEffect(() => {
//         fetchData();
//     }, [fetchData]);

//     // --- REMOVED: The useEffect hook that synced the URL query param with the active tab is deleted. ---

//     return (
//         <div className="critical-points-page">

//             {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
//             {/* --- REMOVED: The entire Nav and Nav.Item structure for tabs has been deleted from the render block. --- */}

//             {loading ? (
//                  <div className="text-center py-5">
//                      <Spinner animation="border" variant="primary" />
//                      <p className="mt-3 text-muted">Loading data...</p>
//                  </div>
//             ) : (
//                 // --- MODIFICATION: The component now directly renders InteractionsFeedback ---
//                 // Conditional rendering based on activeTab has been removed, simplifying the JSX.
//                 <InteractionsFeedback data={interactionsData} canEdit={canEdit} onUpdate={fetchData} />
//             )}
//         </div>
//     );
// };

// export default CriticalPointsPage;

// client/src/pages/CriticalPoints.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Table, Spinner, Alert, Modal, Button, Form, Row, Col, InputGroup, Dropdown, Pagination } from 'react-bootstrap';
import useAuth from '../hooks/useAuth.js';
import InteractionsFeedback from '../components/critical-points/InteractionsFeedback.jsx';
import { interactionsService } from '../services/criticalPointsService.js';
import Papa from 'papaparse';

// Modals are now part of this parent component
const InteractionRecordModal = ({ show, handleClose, isEditing, data, onSave, loading }) => {
    const [formData, setFormData] = useState(data);
    useEffect(() => { setFormData(data); }, [data]);
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Add'} Interaction Record</Modal.Title></Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Company</Form.Label><Form.Control type="text" name="company" value={formData.company || ''} onChange={handleChange} required /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Role</Form.Label><Form.Control type="text" name="role" value={formData.role || ''} onChange={handleChange} required /></Form.Group></Col></Row>
                    <Form.Group className="mb-3"><Form.Label>Roadmap Review by Company</Form.Label><Form.Control type="text" name="roadmapReviewByCompany" value={formData.roadmapReviewByCompany || ''} onChange={handleChange} placeholder="e.g., Yes, Reviewed, No" /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Roadmap Changes Status</Form.Label><Form.Control type="text" name="roadmapChangesStatus" value={formData.roadmapChangesStatus || ''} onChange={handleChange} placeholder="e.g., Implemented, Done" /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Feedback Implementation Status</Form.Label><Form.Select name="feedbackImplementationStatus" value={formData.feedbackImplementationStatus || 'Yet to Implement'} onChange={handleChange}><option value="Yet to Implement">Yet to Implement</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></Form.Select></Form.Group>
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={handleClose}>Cancel</Button><Button variant="primary" type="submit" disabled={loading}>{loading ? <Spinner size="sm" /> : 'Save Record'}</Button></Modal.Footer>
            </Form>
        </Modal>
    );
};
const LogInteractionModal = ({ show, handleClose, onSave, loading, isEditing, initialData }) => {
    const [subData, setSubData] = useState(initialData);
    useEffect(() => { setSubData(initialData); }, [initialData]);
    const handleChange = e => setSubData({ ...subData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSave(subData); };
    return (
        <Modal show={show} onHide={handleClose} centered size="lg"><Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Log New'} Interaction</Modal.Title></Modal.Header><Form onSubmit={handleSubmit}><Modal.Body><Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Interaction Type</Form.Label><Form.Select name="interactionType" value={subData.interactionType} onChange={handleChange}><option>Interaction 1</option><option>Interaction 2</option><option>Interaction 3</option><option>Interaction 4</option></Form.Select></Form.Group><Form.Group className="mb-3"><Form.Label>Interaction Summary</Form.Label><Form.Select name="interactionSummary" value={subData.interactionSummary} onChange={handleChange}><option>Neutral</option><option>Positive feedback</option><option>Negative feedback</option></Form.Select></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Interaction Attendees</Form.Label><Form.Control type="text" name="interactionAttendees" value={subData.interactionAttendees || ''} onChange={handleChange} placeholder="e.g., Mr. Sharma, Ranjith P" /></Form.Group></Col></Row><Form.Group className="mb-3"><Form.Label>Interaction Overall Remarks</Form.Label><Form.Control as="textarea" rows={5} name="interactionOverallRemarks" value={subData.interactionOverallRemarks || ''} onChange={handleChange} required /></Form.Group></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleClose}>Cancel</Button><Button variant="primary" type="submit" disabled={loading}>{loading ? <Spinner size="sm" /> : 'Save Changes'}</Button></Modal.Footer></Form></Modal>
    );
};
const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null; let items = []; let startPage, endPage;
    if (totalPages <= 5) { startPage = 1; endPage = totalPages; } else { if (currentPage <= 3) { startPage = 1; endPage = 5; } else if (currentPage + 1 >= totalPages) { startPage = totalPages - 4; endPage = totalPages; } else { startPage = currentPage - 2; endPage = currentPage + 1; } }
    for (let number = startPage; number <= endPage; number++) { items.push(<Pagination.Item key={number} active={number === currentPage} onClick={() => onPageChange(number)}>{number}</Pagination.Item>); }
    return (<Pagination size="sm" className="justify-content-end mb-0"><Pagination.First onClick={() => onPageChange(1)} disabled={currentPage === 1} /><Pagination.Prev onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} />{startPage > 1 && <Pagination.Ellipsis />}{items}{endPage < totalPages && <Pagination.Ellipsis />}{<Pagination.Next onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} />}{<Pagination.Last onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} />}</Pagination>);
};

const CriticalPointsPage = () => {
    const { user } = useAuth();
    const canEdit = user.role === 'admin' || user.role === 'crm' || (user.role === 'instructor' && user.canAccessCriticalPoints);

    const [interactionsData, setInteractionsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const fileInputRef = useRef(null);
    
    // Modal states
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showInteractionDetailsModal, setShowInteractionDetailsModal] = useState(false);

    // Data for modals
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditingRecord, setIsEditingRecord] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [isEditingLog, setIsEditingLog] = useState(false);
    const [currentSubInteraction, setCurrentSubInteraction] = useState(null);
    const [selectedInteractionForDetails, setSelectedInteractionForDetails] = useState(null);
    
    // CSV Upload states
    const [uploadingCsv, setUploadingCsv] = useState(false);
    const [csvError, setCsvError] = useState('');
    const [csvData, setCsvData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);

    const fetchData = useCallback(async () => { setLoading(true); setError(''); try { const res = await interactionsService.getAll(); setInteractionsData(res.data || []); } catch (err) { setError(err.response?.data?.error || 'Failed to fetch critical points data.'); } finally { setLoading(false); } }, []);
    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, rowsPerPage]);

    // Filtering & Pagination
    const filteredData = useMemo(() => {
        if (!searchTerm) return interactionsData;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return interactionsData.filter(item => item.company?.toLowerCase().includes(lowerCaseSearch) || item.role?.toLowerCase().includes(lowerCaseSearch) || (item.interactions || []).some(sub => sub.interactionType?.toLowerCase().includes(lowerCaseSearch) || sub.interactionOverallRemarks?.toLowerCase().includes(lowerCaseSearch)));
    }, [interactionsData, searchTerm]);
    const paginatedData = useMemo(() => { const startIndex = (currentPage - 1) * rowsPerPage; return filteredData.slice(startIndex, startIndex + rowsPerPage); }, [filteredData, currentPage, rowsPerPage]);

    // Modal Handlers
    const handleShowRecordModal = (record = null) => { setIsEditingRecord(!!record); setCurrentRecord(record || { company: '', role: '', roadmapReviewByCompany: '', roadmapChangesStatus: '', feedbackImplementationStatus: 'Yet to Implement' }); setShowRecordModal(true); };
    const handleShowLogModal = (parentRecord, subInteraction = null) => { setCurrentRecord(parentRecord); setIsEditingLog(!!subInteraction); setCurrentSubInteraction(subInteraction || { interactionType: 'Interaction 1', interactionAttendees: '', interactionOverallRemarks: '', interactionSummary: 'Neutral' }); setShowLogModal(true); };
    const handleOpenUploadModal = () => { setCsvData([]); setCsvHeaders([]); setCsvError(''); if (fileInputRef.current) fileInputRef.current.value = ""; setShowUploadModal(true); };
    const handleShowInteractionDetails = (interactionLog) => { setSelectedInteractionForDetails(interactionLog); setShowInteractionDetailsModal(true); };

    // Action Handlers
    const handleSaveRecord = async (formData) => { setActionLoading(true); setError(''); try { if (isEditingRecord) { await interactionsService.update(formData._id, formData); } else { await interactionsService.create(formData); } fetchData(); setShowRecordModal(false); } catch (err) { setError(err.response?.data?.error || 'Failed to save record.'); } finally { setActionLoading(false); } };
    const handleSaveLog = async (logData) => { setActionLoading(true); setError(''); try { if (isEditingLog) { await interactionsService.updateSubInteraction(currentRecord._id, logData._id, logData); } else { await interactionsService.addInteraction(currentRecord._id, logData); } fetchData(); setShowLogModal(false); } catch(err) { setError(err.response?.data?.error || 'Failed to save interaction log.'); } finally { setActionLoading(false); } };
    const handleDeleteClick = (record, subRecord = null) => { setItemToDelete({ record, subRecord }); setShowDeleteConfirm(true); };
    const confirmDelete = async () => { if (!itemToDelete) return; const { record, subRecord } = itemToDelete; setActionLoading(true); try { if (subRecord) { await interactionsService.deleteSubInteraction(record._id, subRecord._id); } else { await interactionsService.delete(record._id); } fetchData(); } catch (err) { setError(err.response?.data?.error || 'Failed to delete item.'); } finally { setActionLoading(false); setShowDeleteConfirm(false); setItemToDelete(null); } };

    // CSV Handlers
    const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) { setCsvData([]); setCsvHeaders([]); return; } Papa.parse(file, { header: true, skipEmptyLines: true, complete: (results) => { setCsvHeaders(results.meta.fields || []); setCsvData(results.data); setCsvError(''); }, error: (err) => setCsvError('Error parsing CSV: ' + err.message) }); };
    const handleSaveCsvData = async () => { if (!csvData.length) return; setUploadingCsv(true); setCsvError(''); try { await interactionsService.bulkUpload(csvData); setShowUploadModal(false); fetchData(); } catch (err) { setCsvError(err.response?.data?.error || 'Failed to upload CSV data.'); } finally { setUploadingCsv(false); } };
    const handleExportCSV = () => { if (!filteredData || filteredData.length === 0) return alert("No data to export."); const csvData = []; filteredData.forEach(rec => { const commonData = { 'Company': rec.company, 'Role': rec.role, 'Roadmap Review': rec.roadmapReviewByCompany, 'Change Status': rec.roadmapChangesStatus, 'Implementation Status': rec.feedbackImplementationStatus }; if (rec.interactions && rec.interactions.length > 0) { rec.interactions.forEach(sub => { csvData.push({ ...commonData, 'Interaction Type': sub.interactionType, 'Interaction Date': sub.date ? new Date(sub.date).toLocaleDateString() : 'N/A', 'Attendees': sub.interactionAttendees, 'Summary': sub.interactionSummary, 'Remarks': sub.interactionOverallRemarks }); }); } else { csvData.push({ ...commonData, 'Interactions': 'No interactions' }); } }); const csv = Papa.unparse(csvData); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", `Interactions_and_Feedback_Export.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); };

    return (
        <div className="critical-points-page">
            <Card className="shadow-sm">
                <Card.Header as="div" className="py-2 px-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h5 className="mb-0 fw-medium">Interactions & Feedback</h5>
                        <div className="d-flex align-items-center gap-2">
                            <InputGroup size="sm" style={{width: '250px'}}>
                                <Form.Control placeholder="Search records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                {searchTerm && <Button variant="outline-secondary" onClick={() => setSearchTerm('')} title="Clear search"><i className="fas fa-times"></i></Button>}
                            </InputGroup>
                            <Button variant="outline-success" size="sm" onClick={handleExportCSV} title="Export current view as CSV"><i className="fas fa-file-csv me-2"></i>Export</Button>
                            {canEdit && <Button variant="primary" size="sm" onClick={() => handleShowRecordModal()} title="Add a new record"><i className="fas fa-plus me-2"></i>Add Record</Button>}
                            {canEdit && <Button variant="info" size="sm" onClick={handleOpenUploadModal} className="text-white" title="Bulk upload from CSV"><i className="fas fa-upload me-2"></i>Upload CSV</Button>}
                        </div>
                    </div>
                </Card.Header>
                 
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible className="m-3">{error}</Alert>}
            
                {loading ? (
                    <div className="text-center py-5"><Spinner /><p className="mt-3 text-muted">Loading data...</p></div>
                ) : (
                    <InteractionsFeedback 
                        data={paginatedData}
                        canEdit={canEdit}
                        onShowRecordModal={handleShowRecordModal}
                        onShowLogModal={handleShowLogModal}
                        onDeleteClick={handleDeleteClick}
                        onShowInteractionDetails={handleShowInteractionDetails}
                    />
                )}

                <Card.Footer className="bg-light d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2"><Form.Select size="sm" value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))} style={{width: 'auto'}}><option value={10}>10 rows</option><option value={25}>25 rows</option><option value={50}>50 rows</option></Form.Select><span className="text-muted small">Showing {paginatedData.length} of {filteredData.length} records</span></div>
                    <PaginationComponent currentPage={currentPage} totalPages={Math.ceil(filteredData.length / rowsPerPage)} onPageChange={setCurrentPage}/>
                </Card.Footer>
            </Card>

            {/* Modals for actions */}
            {showRecordModal && <InteractionRecordModal show={showRecordModal} handleClose={() => setShowRecordModal(false)} isEditing={isEditingRecord} data={currentRecord} onSave={handleSaveRecord} loading={actionLoading} />}
            {showLogModal && <LogInteractionModal show={showLogModal} handleClose={() => setShowLogModal(false)} onSave={handleSaveLog} loading={actionLoading} isEditing={isEditingLog} initialData={currentSubInteraction} />}
            {selectedInteractionForDetails && <Modal show={showInteractionDetailsModal} onHide={() => setSelectedInteractionForDetails(null)} centered><Modal.Header closeButton><Modal.Title><i className="fas fa-info-circle text-primary me-2"></i>Interaction Context</Modal.Title></Modal.Header><Modal.Body>{selectedInteractionForDetails && (<div><h5 className="mb-1">{selectedInteractionForDetails.interactionType}</h5><p className="text-muted small border-bottom pb-2 mb-3">Interaction on: {formatDate(selectedInteractionForDetails.date)}</p><p><strong>Summary:</strong> {selectedInteractionForDetails.interactionSummary}</p><p><strong>Attendees:</strong> {selectedInteractionForDetails.interactionAttendees || 'N/A'}</p><div><strong>Overall Remarks:</strong><div className="p-3 bg-light border rounded mt-1" style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', fontSize: '0.9rem' }}>{selectedInteractionForDetails.interactionOverallRemarks || 'No remarks provided.'}</div></div></div>)}</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setSelectedInteractionForDetails(null)}>Close</Button></Modal.Footer></Modal>}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered size="sm"><Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header><Modal.Body>Are you sure you want to delete this {itemToDelete?.subRecord ? 'interaction log' : 'record'}?</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button><Button variant="danger" onClick={confirmDelete} disabled={actionLoading}>{actionLoading ? <Spinner size="sm" /> : 'Delete'}</Button></Modal.Footer></Modal>
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg" centered backdrop="static"><Modal.Header closeButton><Modal.Title>Upload CSV for Interactions & Feedback</Modal.Title></Modal.Header><Modal.Body>{csvError && <Alert variant="danger">{csvError}</Alert>}<p className="text-muted mb-3">Each row should represent a single interaction log. Main record fields like 'Company' and 'Role' will be grouped automatically. Required columns are <strong>Company, Role, Interaction Type, and Interaction Overall Remarks</strong>.</p><Form.Group controlId="csvFileInteractions" className="mb-3"><Form.Control type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} /></Form.Group>{csvData.length > 0 && (<div><h6 className="mb-2">CSV Preview ({csvData.length} rows found)</h6><div className="table-responsive" style={{ maxHeight: '40vh' }}><Table striped bordered hover size="sm"><thead><tr>{csvHeaders.map(h => (<th key={h}>{h}</th>))}</tr></thead><tbody>{csvData.slice(0, 10).map((row, i) => (<tr key={i}>{csvHeaders.map(h => (<td key={h} title={row[h]}>{row[h]}</td>))}</tr>))}</tbody></Table>{csvData.length > 10 && (<p className="text-muted small">Showing first 10 rows...</p>)}</div></div>)}</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveCsvData} disabled={uploadingCsv || csvData.length === 0}>{uploadingCsv ? (<><Spinner as="span" size="sm" className="me-2" />Uploading...</>) : 'Upload & Save'}</Button></Modal.Footer></Modal>
        </div>
    );
};

export default CriticalPointsPage;
