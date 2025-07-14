// // client/src/components/critical-points/InteractionsFeedback.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import { Table, Button, Spinner, Alert, Card, Modal, Form, Row, Col, Dropdown } from 'react-bootstrap';
// import { interactionsService } from '../../services/criticalPointsService.js';
// import Papa from 'papaparse';

// // --- START: MODIFIED COMPONENT ---
// // New custom component for the three-dot action menu toggle
// const ActionMenuToggle = React.forwardRef(({ onClick }, ref) => (
//     <Button
//       variant="link"
//       ref={ref}
//       onClick={(e) => {
//         e.preventDefault();
//         onClick(e);
//       }}
//       className="p-1 text-muted"
//       title="More Actions"
//     >
//       <i className="fas fa-ellipsis-v"></i>
//     </Button>
// ));
// ActionMenuToggle.displayName = 'ActionMenuToggle';
// // --- END: MODIFIED COMPONENT ---

// // Reusable modal for adding/editing main records
// const InteractionRecordModal = ({ show, handleClose, isEditing, data, onSave, loading }) => {
//     const [formData, setFormData] = useState(data);
    
//     useEffect(() => { 
//         setFormData(data); 
//     }, [data]);
    
//     const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    
//     const handleSubmit = (e) => {
//         e.preventDefault();
//         onSave(formData);
//     };
    
//     return (
//         <Modal show={show} onHide={handleClose} centered>
//             <Modal.Header closeButton>
//                 <Modal.Title>{isEditing ? 'Edit' : 'Add'} Interaction Record</Modal.Title>
//             </Modal.Header>
//             <Form onSubmit={handleSubmit}>
//                 <Modal.Body>
//                     <Row>
//                         <Col md={6}>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Company</Form.Label>
//                                 <Form.Control 
//                                     type="text" 
//                                     name="company" 
//                                     value={formData.company || ''} 
//                                     onChange={handleChange} 
//                                     required
//                                 />
//                             </Form.Group>
//                         </Col>
//                         <Col md={6}>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Role</Form.Label>
//                                 <Form.Control 
//                                     type="text" 
//                                     name="role" 
//                                     value={formData.role || ''} 
//                                     onChange={handleChange} 
//                                     required
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>
//                     <Form.Group className="mb-3">
//                         <Form.Label>Roadmap Review by Company</Form.Label>
//                         <Form.Control 
//                             type="text" 
//                             name="roadmapReviewByCompany" 
//                             value={formData.roadmapReviewByCompany || ''} 
//                             onChange={handleChange} 
//                             placeholder="e.g., Yes, Reviewed, No" 
//                         />
//                     </Form.Group>
//                     <Form.Group className="mb-3">
//                         <Form.Label>Roadmap Changes Status</Form.Label>
//                         <Form.Control 
//                             type="text" 
//                             name="roadmapChangesStatus" 
//                             value={formData.roadmapChangesStatus || ''} 
//                             onChange={handleChange} 
//                             placeholder="e.g., Implemented, Done" 
//                         />
//                     </Form.Group>
//                     <Form.Group className="mb-3">
//                         <Form.Label>Feedback Implementation Status</Form.Label>
//                         <Form.Select 
//                             name="feedbackImplementationStatus" 
//                             value={formData.feedbackImplementationStatus || 'Yet to Implement'} 
//                             onChange={handleChange}
//                         >
//                             <option value="Yet to Implement">Yet to Implement</option>
//                             <option value="In Progress">In Progress</option>
//                             <option value="Completed">Completed</option>
//                         </Form.Select>
//                     </Form.Group>
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={handleClose}>Cancel</Button>
//                     <Button variant="primary" type="submit" disabled={loading}>
//                         {loading ? <Spinner size="sm"/> : 'Save Record'}
//                     </Button>
//                 </Modal.Footer>
//             </Form>
//         </Modal>
//     );
// };

// // Modal for ADDING or EDITING a nested interaction log
// const LogInteractionModal = ({ show, handleClose, onSave, loading, isEditing, initialData }) => {
//     const [subData, setSubData] = useState(initialData);
    
//     useEffect(() => { 
//         setSubData(initialData); 
//     }, [initialData]);
    
//     const handleChange = e => setSubData({...subData, [e.target.name]: e.target.value });
    
//     const handleSubmit = (e) => { 
//         e.preventDefault(); 
//         onSave(subData); 
//     };
    
//     return (
//         <Modal show={show} onHide={handleClose} centered size="lg">
//             <Modal.Header closeButton>
//                 <Modal.Title>{isEditing ? 'Edit' : 'Log New'} Interaction</Modal.Title>
//             </Modal.Header>
//             <Form onSubmit={handleSubmit}>
//                 <Modal.Body>
//                     <Row>
//                         <Col md={6}>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Interaction Type</Form.Label>
//                                 <Form.Select 
//                                     name="interactionType" 
//                                     value={subData.interactionType} 
//                                     onChange={handleChange}
//                                 >
//                                     <option>Interaction 1</option>
//                                     <option>Interaction 2</option>
//                                     <option>Interaction 3</option>
//                                     <option>Interaction 4</option>
//                                 </Form.Select>
//                             </Form.Group>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Interaction Summary</Form.Label>
//                                 <Form.Select 
//                                     name="interactionSummary" 
//                                     value={subData.interactionSummary} 
//                                     onChange={handleChange}
//                                 >
//                                     <option>Neutral</option>
//                                     <option>Positive feedback</option>
//                                     <option>Negative feedback</option>
//                                 </Form.Select>
//                             </Form.Group>
//                         </Col>
//                         <Col md={6}>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Interaction Attendees</Form.Label>
//                                 <Form.Control 
//                                     type="text" 
//                                     name="interactionAttendees" 
//                                     value={subData.interactionAttendees || ''} 
//                                     onChange={handleChange} 
//                                     placeholder="e.g., Mr. Sharma, Ranjith P" 
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>
//                     <Form.Group className="mb-3">
//                         <Form.Label>Interaction Overall Remarks</Form.Label>
//                         <Form.Control 
//                             as="textarea" 
//                             rows={5} 
//                             name="interactionOverallRemarks" 
//                             value={subData.interactionOverallRemarks || ''} 
//                             onChange={handleChange} 
//                             required
//                         />
//                     </Form.Group>
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={handleClose}>Cancel</Button>
//                     <Button variant="primary" type="submit" disabled={loading}>
//                         {loading ? <Spinner size="sm"/> : 'Save Changes'}
//                     </Button>
//                 </Modal.Footer>
//             </Form>
//         </Modal>
//     );
// };

// const formatDate = (dateString) => {
//     if (!dateString) return '';
//     return new Date(dateString).toLocaleString('en-US', {
//         month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
//     });
// };

// const InteractionsFeedback = ({ data, canEdit, onUpdate }) => {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [showRecordModal, setShowRecordModal] = useState(false);
//     const [showLogModal, setShowLogModal] = useState(false);
//     const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//     const [itemToDelete, setItemToDelete] = useState(null);
//     const [isEditingRecord, setIsEditingRecord] = useState(false);
//     const [currentRecord, setCurrentRecord] = useState(null);
//     const [isEditingLog, setIsEditingLog] = useState(false);
//     const [currentSubInteraction, setCurrentSubInteraction] = useState(null);
//     const [showInteractionDetailsModal, setShowInteractionDetailsModal] = useState(false);
//     const [selectedInteractionForDetails, setSelectedInteractionForDetails] = useState(null);
    
//     // STATES for CSV Upload
//     const [showUploadModal, setShowUploadModal] = useState(false);
//     const [uploadingCsv, setUploadingCsv] = useState(false);
//     const [csvError, setCsvError] = useState('');
//     const [csvData, setCsvData] = useState([]);
//     const [csvHeaders, setCsvHeaders] = useState([]);
//     const fileInputRef = useRef(null);
  
//     const handleShowRecordModal = (record = null) => {
//         setIsEditingRecord(!!record);
//         setCurrentRecord(record || { 
//             company: '', 
//             role: '', 
//             roadmapReviewByCompany: '', 
//             roadmapChangesStatus: '', 
//             feedbackImplementationStatus: 'Yet to Implement' 
//         });
//         setShowRecordModal(true);
//     };
    
//     const handleSaveRecord = async (formData) => {
//         setLoading(true); 
//         setError(null);
//         try {
//             if (isEditingRecord) {
//                 await interactionsService.update(formData._id, formData);
//             } else {
//                 await interactionsService.create(formData);
//             }
//             onUpdate(); 
//             setShowRecordModal(false);
//         } catch (err) { 
//             setError(err.response?.data?.error || 'Failed to save record.'); 
//         } finally { 
//             setLoading(false); 
//         }
//     };
    
//     const handleOpenLogModal = (parentRecord, subInteraction = null) => {
//         setCurrentRecord(parentRecord);
//         setIsEditingLog(!!subInteraction);
//         setCurrentSubInteraction(subInteraction || { 
//             interactionType: 'Interaction 1', 
//             interactionAttendees: '', 
//             interactionOverallRemarks: '', 
//             interactionSummary: 'Neutral' 
//         });
//         setShowLogModal(true);
//     };
    
//     const handleSaveLog = async (logData) => {
//         setLoading(true); 
//         setError(null);
//         try {
//             if (isEditingLog) {
//                 await interactionsService.updateSubInteraction(currentRecord._id, logData._id, logData);
//             } else {
//                 await interactionsService.addInteraction(currentRecord._id, logData);
//             }
//             onUpdate(); 
//             setShowLogModal(false);
//         } catch(err) { 
//             setError(err.response?.data?.error || 'Failed to save interaction log.'); 
//         } finally { 
//             setLoading(false); 
//         }
//     };
    
//     const handleDeleteClick = (record, subRecord = null) => {
//         setItemToDelete({ record, subRecord });
//         setShowDeleteConfirm(true);
//     };
    
//     const confirmDelete = async () => {
//         if (!itemToDelete) return;
//         const { record, subRecord } = itemToDelete;
//         setLoading(true);
//         try {
//             if (subRecord) {
//                 await interactionsService.deleteSubInteraction(record._id, subRecord._id);
//             } else {
//                 await interactionsService.delete(record._id);
//             }
//             onUpdate();
//         } catch (err) { 
//             setError(err.response?.data?.error || 'Failed to delete item.'); 
//         } finally { 
//             setLoading(false); 
//             setShowDeleteConfirm(false); 
//             setItemToDelete(null); 
//         }
//     };
    
//     const handleOpenUploadModal = () => {
//         setCsvData([]);
//         setCsvHeaders([]);
//         setCsvError('');
//         if (fileInputRef.current) fileInputRef.current.value = "";
//         setShowUploadModal(true);
//     };
    
//     const handleFileChange = (e) => {
//         const file = e.target.files[0];
//         if (!file) {
//             setCsvData([]);
//             setCsvHeaders([]);
//             return;
//         }
//         Papa.parse(file, {
//             header: true,
//             skipEmptyLines: true,
//             complete: (results) => {
//                 setCsvHeaders(results.meta.fields || []);
//                 setCsvData(results.data);
//                 setCsvError('');
//             },
//             error: (err) => setCsvError('Error parsing CSV: ' + err.message),
//         });
//     };
    
//     const handleSaveCsvData = async () => {
//         if (!csvData.length) return;
//         setUploadingCsv(true);
//         setCsvError('');
//         try {
//             await interactionsService.bulkUpload(csvData);
//             setShowUploadModal(false);
//             onUpdate();
//         } catch (err) {
//             setCsvError(err.response?.data?.error || 'Failed to upload CSV data.');
//         } finally {
//             setUploadingCsv(false);
//         }
//     };

//     const handleShowInteractionDetails = (interactionLog) => {
//         setSelectedInteractionForDetails(interactionLog);
//         setShowInteractionDetailsModal(true);
//     };

//     const handleCloseInteractionDetails = () => {
//         setShowInteractionDetailsModal(false);
//     };
  
//     return (
//         <>
//             {/* --- START MODIFICATION --- */}
//             <style>{`
//                 .interactions-table {
//                     table-layout: fixed;
//                     border-collapse: collapse;
//                     font-size: 0.875rem; 
//                 }
                
//                 .interactions-table th, 
//                 .interactions-table td {
//                     padding: 0.85rem 0.6rem; 
//                     border: 1px solid #dee2e6;
//                     vertical-align: top;
//                 }
                
//                 .interactions-table th {
//                     background-color: #f8f9fa;
//                     font-weight: 600;
//                     font-size: 0.8rem;
//                 }
                
//                 .interactions-table td {
//                     word-wrap: break-word;
//                     overflow-wrap: break-word;
//                 }
                
//                 .interaction-container {
//                     max-height: 250px;
//                     overflow-y: auto;
//                     padding-right: 5px;
//                 }
                
//                 .interaction-item {
//                     display: flex;
//                     justify-content: space-between;
//                     align-items: center;
//                     padding-bottom: 8px;
//                     margin-bottom: 8px;
//                     border-bottom: 1px solid #f0f0f0;
//                 }

//                 .interaction-item:last-child {
//                     margin-bottom: 0;
//                     border-bottom: none;
//                     padding-bottom: 0;
//                 }

//                 .interaction-header {
//                     flex-grow: 1;
//                 }

//                 .interaction-type {
//                     font-weight: 500;
//                     color: #0d6efd;
//                     font-size: 0.9rem; 
//                 }
                
//                 .interaction-date {
//                     font-size: 0.8rem;
//                     color: #6c757d;
//                 }

//                 .action-buttons {
//                     display: inline-flex;
//                     gap: 5px;
//                 }

//                 .icon-button {
//                     background: none;
//                     border: none;
//                     cursor: pointer;
//                     padding: 4px;
//                     line-height: 1;
//                     font-size: 0.9rem;
//                 }
                
//                 .edit-button { color: #0d6efd; }
//                 .delete-button { color: #dc3545; }
//                 .add-button { color: #198754; } 
//             `}</style>
//             {/* --- END MODIFICATION --- */}
            
//             <Card className="shadow-sm">
//                 <Card.Header className="d-flex justify-content-between align-items-center py-3">
//                     <h5 className="mb-0">Interactions & Feedback</h5>
//                     {canEdit && (
//                         <div className="d-flex gap-2">
//                             <Button 
//                                 onClick={handleOpenUploadModal} 
//                                 variant="outline-success" 
//                                 size="sm"
//                                 className="d-flex align-items-center"
//                             >
//                                 <i className="fas fa-file-csv me-2"></i>
//                                 Upload CSV
//                             </Button>
//                             <Button 
//                                 onClick={() => handleShowRecordModal()} 
//                                 variant="primary" 
//                                 size="sm"
//                                 className="d-flex align-items-center"
//                             >
//                                 <i className="fas fa-plus me-2"></i>
//                                 Add Record
//                             </Button>
//                         </div>
//                     )}
//                 </Card.Header>
//                 <Card.Body>
//                     {error && (
//                         <Alert 
//                             variant="danger" 
//                             onClose={() => setError(null)} 
//                             dismissible
//                             className="mb-3"
//                         >
//                             {error}
//                         </Alert>
//                     )}
                    
//                     <div className="table-responsive">
//                         <table className="interactions-table">
//                             <thead>
//                                 <tr>
//                                     <th style={{minWidth: '160px'}}>COMPANY</th>
//                                     <th style={{minWidth: '260px'}}>SKILLS</th>
//                                     <th style={{minWidth: '140px'}}>ROADMAP REVIEW</th>
//                                     <th style={{minWidth: '140px'}}>CHANGE STATUS</th>
//                                     <th style={{minWidth: '120px'}}>IMPLEMENTATION</th>
//                                     <th style={{minWidth: '340px'}}>INTERACTIONS LOG</th>
//                                     {canEdit && <th style={{minWidth: '30px'}} className="text-center">Actions</th>}
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {!data || data.length === 0 ? (
//                                     <tr>
//                                         <td colSpan={canEdit ? 7 : 6} className="text-center p-4">No records found.</td>
//                                     </tr>
//                                 ) : (
//                                     data.map(item => (
//                                         <tr key={item._id}>
//                                             <td className="align-middle">{item.company}</td>
//                                             <td className="align-middle">{item.role}</td>
//                                             <td className="align-middle">{item.roadmapReviewByCompany}</td>
//                                             <td className="align-middle">{item.roadmapChangesStatus}</td>
//                                             <td className="align-middle">{item.feedbackImplementationStatus}</td>
//                                             <td>
//                                                 <div className="interaction-container">
//                                                     {item.interactions && item.interactions.length > 0 ? (
//                                                         item.interactions.map(sub => (
//                                                             // --- START MODIFICATION ---
//                                                             <div key={sub._id} className="interaction-item">
//                                                                 <div className="interaction-header">
//                                                                     <Button variant="link" className="p-0 text-start text-decoration-underline interaction-type" onClick={() => handleShowInteractionDetails(sub)}>{sub.interactionType}</Button>
//                                                                 </div>
//                                                                 <div className="d-flex align-items-center text-nowrap">
//                                                                     <span className="interaction-date me-3">{formatDate(sub.date)}</span>
//                                                                     {canEdit && (
//                                                                         <div className="action-buttons">
//                                                                             <button className="icon-button edit-button" onClick={() => handleOpenLogModal(item, sub)} title="Edit Interaction"><i className="fas fa-edit"></i></button>
//                                                                             <button className="icon-button delete-button" onClick={() => handleDeleteClick(item, sub)} title="Delete Interaction"><i className="fas fa-trash"></i></button>
//                                                                             <button className="icon-button add-button" onClick={() => handleOpenLogModal(item)} title="Add New Interaction"><i className="fas fa-plus-circle"></i></button>
//                                                                         </div>
//                                                                     )}
//                                                                 </div>
//                                                             </div>
//                                                             // --- END MODIFICATION ---
//                                                         ))
//                                                     ) : (
//                                                         <div className="text-muted fst-italic p-2 text-center">
//                                                             No interactions. 
//                                                             {canEdit && <Button variant="link" size="sm" className="p-1 ms-2" onClick={() => handleOpenLogModal(item)}>Add one</Button>}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             </td>
                                            
//                                             {canEdit && (
//                                                 <td className="text-center align-middle">
//                                                     {/* --- START MODIFICATION --- */}
//                                                     <Dropdown>
//                                                         <Dropdown.Toggle as={ActionMenuToggle} id={`actions-dropdown-${item._id}`} />
//                                                         <Dropdown.Menu align="end">
//                                                             <Dropdown.Item onClick={() => handleShowRecordModal(item)}>
//                                                                 <i className="fas fa-edit text-primary me-2"></i> Edit Record
//                                                             </Dropdown.Item>
//                                                             <Dropdown.Item onClick={() => handleDeleteClick(item)} className="text-danger">
//                                                                 <i className="fas fa-trash me-2"></i> Delete Record
//                                                             </Dropdown.Item>
//                                                         </Dropdown.Menu>
//                                                     </Dropdown>
//                                                     {/* --- END MODIFICATION --- */}
//                                                 </td>
//                                             )}
//                                         </tr>
//                                     ))
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>
//                 </Card.Body>
//             </Card>
            
//             {/* Modals */}
//             {showRecordModal && (
//                 <InteractionRecordModal 
//                     show={showRecordModal} 
//                     handleClose={() => setShowRecordModal(false)} 
//                     isEditing={isEditingRecord} 
//                     data={currentRecord} 
//                     onSave={handleSaveRecord} 
//                     loading={loading} 
//                 />
//             )}
            
//             {showLogModal && (
//                 <LogInteractionModal 
//                     show={showLogModal} 
//                     handleClose={() => setShowLogModal(false)} 
//                     onSave={handleSaveLog} 
//                     loading={loading} 
//                     isEditing={isEditingLog} 
//                     initialData={currentSubInteraction} 
//                 />
//             )}
            
//             {/* Delete Confirmation Modal */}
//             <Modal 
//                 show={showDeleteConfirm} 
//                 onHide={() => setShowDeleteConfirm(false)} 
//                 centered 
//                 size="sm"
//             >
//                 <Modal.Header closeButton>
//                     <Modal.Title>Confirm Delete</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     Are you sure you want to delete this {itemToDelete?.subRecord ? 'interaction log' : 'record'}?
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
//                         Cancel
//                     </Button>
//                     <Button variant="danger" onClick={confirmDelete} disabled={loading}>
//                         {loading ? <Spinner size="sm"/> : 'Delete'}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             {/* Interaction Details Modal */}
//             <Modal show={showInteractionDetailsModal} onHide={handleCloseInteractionDetails} centered>
//                 <Modal.Header closeButton>
//                     <Modal.Title><i className="fas fa-info-circle text-primary me-2"></i>Interaction Context</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {selectedInteractionForDetails && (
//                         <div>
//                             <h5 className="mb-1">{selectedInteractionForDetails.interactionType}</h5>
//                             <p className="text-muted small border-bottom pb-2 mb-3">Interaction on: {formatDate(selectedInteractionForDetails.date)}</p>
//                             <p><strong>Summary:</strong> {selectedInteractionForDetails.interactionSummary}</p>
//                             <p><strong>Attendees:</strong> {selectedInteractionForDetails.interactionAttendees || 'N/A'}</p>
//                             <div>
//                                 <strong>Overall Remarks:</strong>
//                                 <div className="p-3 bg-light border rounded mt-1" style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', fontSize: '0.9rem' }}>
//                                     {selectedInteractionForDetails.interactionOverallRemarks || 'No remarks provided.'}
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={handleCloseInteractionDetails}>Close</Button>
//                 </Modal.Footer>
//             </Modal>
            
//             {/* CSV Upload Modal */}
//             <Modal 
//                 show={showUploadModal} 
//                 onHide={() => setShowUploadModal(false)} 
//                 size="lg" 
//                 centered 
//                 backdrop="static"
//             >
//                 <Modal.Header closeButton>
//                     <Modal.Title>Upload CSV for Interactions & Feedback</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {csvError && <Alert variant="danger">{csvError}</Alert>}
                    
//                     <p className="text-muted mb-3">
//                         Each row should represent a single interaction log. Main record fields like 'Company' and 'Role' will be grouped automatically.
//                         Required columns are <strong>Company, Role, Interaction Type, and Interaction Overall Remarks</strong>.
//                     </p>
                    
//                     <Form.Group controlId="csvFileInteractions" className="mb-3">
//                         <Form.Control 
//                             type="file" 
//                             accept=".csv" 
//                             onChange={handleFileChange} 
//                             ref={fileInputRef} 
//                         />
//                     </Form.Group>
                    
//                     {csvData.length > 0 && (
//                         <div>
//                             <h6 className="mb-2">CSV Preview ({csvData.length} rows found)</h6>
//                             <div className="table-responsive" style={{ maxHeight: '40vh' }}>
//                                 <Table striped bordered hover size="sm">
//                                     <thead>
//                                         <tr>
//                                             {csvHeaders.map(h => (
//                                                 <th key={h}>{h}</th>
//                                             ))}
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {csvData.slice(0, 10).map((row, i) => (
//                                             <tr key={i}>
//                                                 {csvHeaders.map(h => (
//                                                     <td key={h} title={row[h]}>{row[h]}</td>
//                                                 ))}
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </Table>
//                                 {csvData.length > 10 && (
//                                     <p className="text-muted small">Showing first 10 rows...</p>
//                                 )}
//                             </div>
//                         </div>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
//                         Cancel
//                     </Button>
//                     <Button 
//                         variant="primary" 
//                         onClick={handleSaveCsvData} 
//                         disabled={uploadingCsv || csvData.length === 0}
//                     >
//                         {uploadingCsv ? (
//                             <>
//                                 <Spinner as="span" size="sm" className="me-2" />
//                                 Uploading...
//                             </>
//                         ) : 'Upload & Save'}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
//         </>
//     );
// };

// export default InteractionsFeedback;



// client/src/components/critical-points/InteractionsFeedback.jsx
import React from 'react';
import { Table, Button, Dropdown } from 'react-bootstrap';

// Custom component for the three-dot action menu toggle
const ActionMenuToggle = React.forwardRef(({ onClick }, ref) => (
    <Button
        variant="link"
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        className="p-1 text-muted"
        title="More Actions"
    >
        <i className="fas fa-ellipsis-v"></i>
    </Button>
));
ActionMenuToggle.displayName = 'ActionMenuToggle';

// Helper function to format date
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const InteractionsFeedback = ({ data, canEdit, onShowRecordModal, onShowLogModal, onDeleteClick, onShowInteractionDetails }) => {

    return (
        <>
            <style>{`
                .interactions-table { table-layout: auto; border-collapse: collapse; font-size: 0.875rem; }
                .interactions-table th, .interactions-table td { padding: 0.85rem 0.6rem; border: 1px solid #dee2e6; vertical-align: top; }
                .interactions-table th { background-color: #f8f9fa; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
                .interactions-table td { word-wrap: break-word; overflow-wrap: break-word; }
                .interaction-container { max-height: 250px; overflow-y: auto; padding-right: 5px; }
                .interaction-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
                .interaction-item:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
                .interaction-header { flex-grow: 1; }
                .interaction-type { font-weight: 500; color: #0d6efd; font-size: 0.9rem;  }
                .interaction-date { font-size: 0.8rem; color: #6c757d; }
                .action-buttons { display: inline-flex; gap: 5px; }
                .icon-button { background: none; border: none; cursor: pointer; padding: 4px; line-height: 1; font-size: 0.9rem; }
                .edit-button { color: #0d6efd; }
                .delete-button { color: #dc3545; }
                .add-button { color: #198754; }
                .no-caret::after { display: none; }
            `}</style>

            <div className="table-responsive">
                <table className="interactions-table w-100">
                    <thead>
                        <tr>
                            <th style={{ width: '13%' }}>COMPANY</th>
                            <th style={{ width: '20%' }}>SKILLS</th>
                            <th style={{ width: '12%' }}>ROADMAP REVIEW</th>
                            <th style={{ width: '12%' }}>CHANGE STATUS</th>
                            <th style={{ width: '13%' }}>IMPLEMENTATION</th>
                            <th style={{ width: '22%' }}>INTERACTIONS LOG</th>
                            {canEdit && <th style={{ width: '8%' }} className="text-center">ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {!data || data.length === 0 ? (
                            <tr><td colSpan={canEdit ? 7 : 6} className="text-center p-4 text-muted">No records match the current filters.</td></tr>
                        ) : (
                            data.map(item => (
                                <tr key={item._id}>
                                    <td className="align-middle">{item.company}</td>
                                    <td className="align-middle" style={{whiteSpace: 'pre-wrap'}}>{item.role}</td>
                                    <td className="align-middle">{item.roadmapReviewByCompany}</td>
                                    <td className="align-middle">{item.roadmapChangesStatus}</td>
                                    <td className="align-middle">{item.feedbackImplementationStatus}</td>
                                    <td>
                                        <div className="interaction-container">
                                            {item.interactions && item.interactions.length > 0 ? (
                                                item.interactions.map(sub => (
                                                    <div key={sub._id} className="interaction-item">
                                                        <div className="interaction-header">
                                                            <Button variant="link" className="p-0 text-start text-decoration-none interaction-type" onClick={() => onShowInteractionDetails(sub)}>{sub.interactionType}</Button>
                                                        </div>
                                                        <div className="d-flex align-items-center text-nowrap">
                                                            <span className="interaction-date me-3">{formatDate(sub.date)}</span>
                                                            {canEdit && (
                                                                <div className="action-buttons">
                                                                    <button className="icon-button edit-button" onClick={() => onShowLogModal(item, sub)} title="Edit Interaction"><i className="fas fa-edit"></i></button>
                                                                    <button className="icon-button delete-button" onClick={() => onDeleteClick(item, sub)} title="Delete Interaction"><i className="fas fa-trash"></i></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (<div className="text-muted fst-italic p-2 text-center">No interactions.</div>)}
                                            {canEdit && <Button variant="link" size="sm" className="p-1 mt-2 w-100" onClick={() => onShowLogModal(item)}>+ Add</Button>}
                                        </div>
                                    </td>
                                    {canEdit && (
                                        <td className="text-center align-middle">
                                            <Dropdown>
                                                <Dropdown.Toggle as={ActionMenuToggle} id={`actions-dropdown-${item._id}`} />
                                                <Dropdown.Menu align="end">
                                                    <Dropdown.Item onClick={() => onShowRecordModal(item)}><i className="fas fa-edit text-primary me-2"></i> Edit Record</Dropdown.Item>
                                                    <Dropdown.Item onClick={() => onDeleteClick(item)} className="text-danger"><i className="fas fa-trash me-2"></i> Delete Record</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default InteractionsFeedback;
