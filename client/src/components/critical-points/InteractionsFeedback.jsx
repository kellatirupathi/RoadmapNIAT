// client/src/components/critical-points/InteractionsFeedback.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Spinner, Alert, Card, Modal, Form, Row, Col } from 'react-bootstrap';
import { interactionsService } from '../../services/criticalPointsService.js';
import Papa from 'papaparse';

// Reusable modal for adding/editing main records
const InteractionRecordModal = ({ show, handleClose, isEditing, data, onSave, loading }) => {
    const [formData, setFormData] = useState(data);

    useEffect(() => { setFormData(data); }, [data]);

    const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
         <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Add'} Interaction Record</Modal.Title></Modal.Header>
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                  <Row>
                      <Col md={6}><Form.Group className="mb-3"><Form.Label>Company</Form.Label><Form.Control type="text" name="company" value={formData.company || ''} onChange={handleChange} required/></Form.Group></Col>
                      <Col md={6}><Form.Group className="mb-3"><Form.Label>Role</Form.Label><Form.Control type="text" name="role" value={formData.role || ''} onChange={handleChange} required/></Form.Group></Col>
                  </Row>
                  <Form.Group className="mb-3"><Form.Label>Roadmap Review by Company</Form.Label><Form.Control type="text" name="roadmapReviewByCompany" value={formData.roadmapReviewByCompany || ''} onChange={handleChange} placeholder="e.g., Yes, Reviewed, No" /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Roadmap Changes Status</Form.Label><Form.Control type="text" name="roadmapChangesStatus" value={formData.roadmapChangesStatus || ''} onChange={handleChange} placeholder="e.g., Implemented, Done" /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Feedback Implementation Status</Form.Label>
                    <Form.Select name="feedbackImplementationStatus" value={formData.feedbackImplementationStatus || 'Yet to Implement'} onChange={handleChange}>
                        <option value="Yet to Implement">Yet to Implement</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
                    </Form.Select>
                  </Form.Group>
              </Modal.Body>
              <Modal.Footer><Button variant="secondary" onClick={handleClose}>Cancel</Button><Button variant="primary" type="submit" disabled={loading}>{loading ? <Spinner size="sm"/> : 'Save Record'}</Button></Modal.Footer>
            </Form>
        </Modal>
    );
};

// Modal for ADDING or EDITING a nested interaction log
const LogInteractionModal = ({ show, handleClose, onSave, loading, isEditing, initialData }) => {
    const [subData, setSubData] = useState(initialData);

    useEffect(() => { setSubData(initialData); }, [initialData]);
    
    const handleChange = e => setSubData({...subData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSave(subData); };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
             <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Log New'} Interaction</Modal.Title></Modal.Header>
             <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row>
                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Interaction Dropdown</Form.Label><Form.Select name="interactionType" value={subData.interactionType} onChange={handleChange}><option>Interaction 1</option><option>Interaction 2</option><option>Interaction 3</option><option>Interaction 4</option></Form.Select></Form.Group><Form.Group className="mb-3"><Form.Label>Interaction Summary</Form.Label><Form.Select name="interactionSummary" value={subData.interactionSummary} onChange={handleChange}><option>Neutral</option><option>Positive feedback</option><option>Negative feedback</option></Form.Select></Form.Group></Col>
                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Interaction Attendees</Form.Label><Form.Control type="text" name="interactionAttendees" value={subData.interactionAttendees || ''} onChange={handleChange} placeholder="e.g., Mr. Sharma, Ranjith P" /></Form.Group><Form.Group><Form.Label>Interaction Overall Remarks</Form.Label><Form.Control as="textarea" rows={5} name="interactionOverallRemarks" value={subData.interactionOverallRemarks || ''} onChange={handleChange} required/></Form.Group></Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={handleClose}>Cancel</Button><Button variant="primary" type="submit" disabled={loading}>{loading ? <Spinner size="sm"/> : 'Save Changes'}</Button></Modal.Footer>
             </Form>
        </Modal>
    );
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const InteractionsFeedback = ({ data, canEdit, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditingRecord, setIsEditingRecord] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [isEditingLog, setIsEditingLog] = useState(false);
    const [currentSubInteraction, setCurrentSubInteraction] = useState(null);

    // STATES for CSV Upload
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingCsv, setUploadingCsv] = useState(false);
    const [csvError, setCsvError] = useState('');
    const [csvData, setCsvData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const fileInputRef = useRef(null);
  
    const handleShowRecordModal = (record = null) => {
        setIsEditingRecord(!!record);
        setCurrentRecord(record || { company: '', role: '', roadmapReviewByCompany: '', roadmapChangesStatus: '', feedbackImplementationStatus: 'Yet to Implement' });
        setShowRecordModal(true);
    };

    const handleSaveRecord = async (formData) => {
        setLoading(true); setError(null);
        try {
            if (isEditingRecord) await interactionsService.update(formData._id, formData);
            else await interactionsService.create(formData);
            onUpdate(); setShowRecordModal(false);
        } catch (err) { setError(err.response?.data?.error || 'Failed to save record.'); } finally { setLoading(false); }
    };
    
    const handleOpenLogModal = (parentRecord, subInteraction = null) => {
        setCurrentRecord(parentRecord);
        setIsEditingLog(!!subInteraction);
        setCurrentSubInteraction(subInteraction || { interactionType: 'Fortnightly Review', interactionAttendees: '', interactionOverallRemarks: '', interactionSummary: 'Neutral' });
        setShowLogModal(true);
    };
    
    const handleSaveLog = async (logData) => {
        setLoading(true); setError(null);
        try {
            if (isEditingLog) await interactionsService.updateSubInteraction(currentRecord._id, logData._id, logData);
            else await interactionsService.addInteraction(currentRecord._id, logData);
            onUpdate(); setShowLogModal(false);
        } catch(err) { setError(err.response?.data?.error || 'Failed to save interaction log.'); } finally { setLoading(false); }
    };
    
    const handleDeleteClick = (record, subRecord = null) => {
        setItemToDelete({ record, subRecord });
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { record, subRecord } = itemToDelete;
        setLoading(true);
        try {
            if (subRecord) await interactionsService.deleteSubInteraction(record._id, subRecord._id);
            else await interactionsService.delete(record._id);
            onUpdate();
        } catch (err) { setError(err.response?.data?.error || 'Failed to delete item.'); } 
        finally { setLoading(false); setShowDeleteConfirm(false); setItemToDelete(null); }
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
            setCsvData([]);
            setCsvHeaders([]);
            return;
        }
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setCsvHeaders(results.meta.fields || []);
                setCsvData(results.data);
                setCsvError('');
            },
            error: (err) => setCsvError('Error parsing CSV: ' + err.message),
        });
    };
    
    const handleSaveCsvData = async () => {
        if (!csvData.length) return;
        setUploadingCsv(true);
        setCsvError('');
        try {
            await interactionsService.bulkUpload(csvData);
            setShowUploadModal(false);
            onUpdate();
        } catch (err) {
            setCsvError(err.response?.data?.error || 'Failed to upload CSV data.');
        } finally {
            setUploadingCsv(false);
        }
    };
  
    return (
    <>
      <style>{`.fixed-layout-table { table-layout: fixed; width: 100%; } .fixed-layout-table td { word-wrap: break-word; word-break: break-word; white-space: normal !important; } .interactions-log-cell { vertical-align: middle; } .interactions-list { font-size: 0.85rem; } .interaction-item { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 5px; margin-bottom: 5px; border-bottom: 1px solid #f0f0f0; } .interaction-item:last-child { border-bottom: none; } .add-interaction-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.8rem; } .action-icons button { font-size: 0.8rem; padding: 0.2rem 0.4rem; line-height: 1; }`}</style>
      
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
            <h5>Interactions & Feedback</h5>
            {canEdit &&
                <div className="d-flex gap-2">
                    <Button onClick={handleOpenUploadModal} variant="outline-success" size="sm">
                        <i className="fas fa-file-csv me-2"></i>Upload CSV
                    </Button>
                    <Button onClick={() => handleShowRecordModal()} size="sm">
                        <i className="fas fa-plus me-2"></i>Add Record
                    </Button>
                </div>
            }
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          <div className="table-responsive">
            <Table striped bordered hover size="sm" className="fixed-layout-table">
                <thead><tr><th style={{width: '12%'}}>Company</th><th style={{width: '12%'}}>Role</th><th style={{width: '14%'}}>Roadmap Review</th><th style={{width: '14%'}}>Changes Status</th><th style={{width: '10%'}}>Feedback Implementation</th><th>Interactions Log</th>{canEdit && <th className="text-center" style={{width: '8%'}}>Actions</th>}</tr></thead>
                <tbody>
                    {!data || data.length === 0 ? (<tr><td colSpan={canEdit ? "7" : "6"} className="text-center text-muted p-4">No records found.</td></tr>) : (
                        data.map(item => (
                            <tr key={item._id}>
                                <td className="align-middle">{item.company}</td><td className="align-middle">{item.role}</td><td className="align-middle">{item.roadmapReviewByCompany}</td><td className="align-middle">{item.roadmapChangesStatus}</td><td className="align-middle">{item.feedbackImplementationStatus}</td>
                                <td className="interactions-log-cell"><div className="interactions-list mb-2">{item.interactions.length > 0 ? (item.interactions.map(sub => (
                                    <div key={sub._id} className="interaction-item">
                                        <div>
                                            <div className="d-flex justify-content-between">
                                                <strong className="text-primary">{sub.interactionType}</strong>
                                                <small className="text-muted">{formatDate(sub.date)}</small>
                                            </div>
                                            <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{sub.interactionOverallRemarks}</p>
                                            <small className="text-muted">
                                                <strong>Summary:</strong> {sub.interactionSummary} | <strong>Attendees:</strong> {sub.interactionAttendees || 'N/A'}
                                            </small>
                                        </div>
                                        {canEdit && (<div className="action-icons d-flex flex-nowrap ps-2"><Button variant="link" size="sm" className="p-1 text-primary" onClick={() => handleOpenLogModal(item, sub)} title="Edit Interaction"><i className="fas fa-edit fa-xs"></i></Button><Button variant="link" size="sm" className="p-1 text-danger" onClick={() => handleDeleteClick(item, sub)} title="Delete Interaction"><i className="fas fa-trash fa-xs"></i></Button></div>)}
                                    </div>
                                    ))) : (<span className="text-muted fst-italic">No interactions.</span>)}
                                  </div>
                                  {canEdit && <Button variant="outline-primary" className="add-interaction-btn w-100" onClick={() => handleOpenLogModal(item)}><i className="fas fa-plus fa-xs"></i>Add</Button>}
                                </td>
                                {canEdit && <td className="text-center align-middle"><Button variant="link" onClick={() => handleShowRecordModal(item)} className="p-1 me-2" title="Edit Record"><i className="fas fa-edit"></i></Button><Button variant="link" onClick={() => handleDeleteClick(item)} className="p-1 text-danger" title="Delete Record"><i className="fas fa-trash"></i></Button></td>}
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
      
      {showRecordModal && <InteractionRecordModal show={showRecordModal} handleClose={() => setShowRecordModal(false)} isEditing={isEditingRecord} data={currentRecord} onSave={handleSaveRecord} loading={loading} />}
      {showLogModal && <LogInteractionModal show={showLogModal} handleClose={() => setShowLogModal(false)} onSave={handleSaveLog} loading={loading} isEditing={isEditingLog} initialData={currentSubInteraction} />}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered size="sm"><Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header><Modal.Body>Are you sure you want to delete this {itemToDelete?.subRecord ? 'interaction log' : 'record'}?</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button><Button variant="danger" onClick={confirmDelete} disabled={loading}>{loading ? <Spinner size="sm"/> : 'Delete'}</Button></Modal.Footer></Modal>

      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
            <Modal.Title>Upload CSV for Interactions & Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {csvError && <Alert variant="danger">{csvError}</Alert>}
            <p className="small text-muted">
                Each row should represent a single interaction log. Main record fields like 'Company' and 'Role' will be grouped automatically.
                Required columns are <strong>Company, Role, Interaction Type, and Interaction Overall Remarks</strong>.
            </p>
            <Form.Group controlId="csvFileInteractions" className="mb-3">
                <Form.Control type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
            </Form.Group>
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
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveCsvData} disabled={uploadingCsv || csvData.length === 0}>
                {uploadingCsv ? <><Spinner as="span" size="sm" /> Uploading...</> : 'Upload & Save'}
            </Button>
        </Modal.Footer>
    </Modal>
    </>
  );
};

export default InteractionsFeedback;
