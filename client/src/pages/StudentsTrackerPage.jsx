// // client/src/pages/StudentsTrackerPage.jsx
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// // --- START MODIFICATION: Imported Dropdown component ---
// import { Nav, Card, Alert, Spinner, Button, Modal, Form, Table, InputGroup, Dropdown } from 'react-bootstrap';
// // --- END MODIFICATION ---
// import { Navigate } from 'react-router-dom';
// import DatePicker from 'react-datepicker';
// import "react-datepicker/dist/react-datepicker.css";
// import studentsTrackerService from '../services/studentsTrackerService.js';
// import { sheetConfig, ratingCalculations, aggregateAssignmentMarks, calculateCompanyClosingScore } from '../utils/studentsTrackerConfig.js';
// import Papa from 'papaparse';
// import CompanyInteractionAdminView from '../components/students-tracker/CompanyInteractionAdminView.jsx';
// import useAuth from '../hooks/useAuth.js';

// // --- START MODIFICATION: Added ActionMenuToggle component for the dropdown ---
// const ActionMenuToggle = React.forwardRef(({ onClick }, ref) => (
//     <Button
//       variant="link"
//       ref={ref}
//       onClick={(e) => {
//         e.preventDefault();
//         onClick(e);
//       }}
//       className="p-1 text-muted no-caret"
//       title="Actions"
//     >
//       <i className="fas fa-ellipsis-v"></i>
//     </Button>
// ));
// ActionMenuToggle.displayName = 'ActionMenuToggle';
// // --- END MODIFICATION ---

// const StudentsTrackerPage = () => {
//     const { user } = useAuth();

//     if ((user.role === 'instructor' || user.role === 'crm') && !user.canAccessStudentsTracker) {
//         return <Navigate to="/not-authorized" replace />;
//     }

//     const canEdit = user.role === 'admin' || user.role === 'instructor' || user.role === 'crm';

//     const [activeTab, setActiveTab] = useState('aseRatings');
//     const [data, setData] = useState({});
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [actionLoading, setActionLoading] = useState(false);

//     const [viewMode, setViewMode] = useState('students');
//     const [searchTerm, setSearchTerm] = useState('');

//     // Modal States
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [newEntriesData, setNewEntriesData] = useState([]);
//     const [showEditModal, setShowEditModal] = useState(false);
//     const [editingRecord, setEditingRecord] = useState(null);
//     const [showDeleteModal, setShowDeleteModal] = useState(false);
//     const [recordToDelete, setRecordToDelete] = useState(null);
//     const [showRemarksModal, setShowRemarksModal] = useState(false);
//     const [remarksModalContent, setRemarksModalContent] = useState('');
//     const [showHistoryModal, setShowHistoryModal] = useState(false);
//     const [historyModalData, setHistoryModalData] = useState(null);

//     const currentSheetConfig = useMemo(() => sheetConfig[activeTab], [activeTab]);

//     const fetchDataForTab = useCallback(async (tabKey) => {
//         if (tabKey === 'companyInteractionTracking') {
//             setLoading(false);
//             return;
//         }
        
//         setLoading(true);
//         setError('');
//         try {
//             const service = studentsTrackerService[tabKey];
//             if (!service) throw new Error(`Service for tab "${tabKey}" not found.`);
//             const response = await service.getAll();
//             setData(prev => ({ ...prev, [tabKey]: response.data || [] }));
//         } catch (err) {
//             setError(`Failed to load data for ${currentSheetConfig?.title || tabKey}.`);
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     }, [currentSheetConfig]);

//     useEffect(() => {
//         fetchDataForTab(activeTab);
//     }, [activeTab, fetchDataForTab]);
    
//     useEffect(() => {
//         if (activeTab !== 'aseRatings') {
//             setViewMode('students');
//         }
//         setSearchTerm('');
//     }, [activeTab]);

//     const handleShowRemarksModal = (remarks) => {
//         setRemarksModalContent(remarks);
//         setShowRemarksModal(true);
//     };

//     const handleCloseRemarksModal = () => {
//         setShowRemarksModal(false);
//         setRemarksModalContent('');
//     };

//     const formatDateForDisplay = (dateString) => {
//         if (!dateString) return '';
//         try {
//             return new Date(dateString).toLocaleDateString('en-US'); 
//         } catch (e) {
//             return 'Invalid Date';
//         }
//     };

//     const formatDateTimeForDisplay = (dateString) => {
//         if (!dateString) return '';
//         try {
//             return new Date(dateString).toLocaleString('en-US', {
//                 year: 'numeric', month: 'short', day: 'numeric',
//                 hour: 'numeric', minute: '2-digit', hour12: true
//             });
//         } catch (e) {
//             return 'Invalid Date';
//         }
//     };
    
//     const handleShowHistoryModal = (row) => {
//         setHistoryModalData(row);
//         setShowHistoryModal(true);
//     };
    
//     const handlePaste = (e, startingIndex) => {
//         e.preventDefault();
//         const pasteData = e.clipboardData.getData('text');
//         const rows = pasteData.split(/[\r\n]+/).filter(row => row.trim() !== '');
//         const formFields = currentSheetConfig.columns.filter(c => !c.readOnly).map(c => c.field);
    
//         setNewEntriesData(prev => {
//             let dataCopy = [...prev];
    
//             rows.forEach((row, rowIndex) => {
//                 const values = row.split('\t');
//                 const currentRowIndex = startingIndex + rowIndex;
    
//                 if (currentRowIndex >= dataCopy.length) {
//                     dataCopy.push(currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {}));
//                 }
    
//                 values.forEach((value, colIndex) => {
//                     if (colIndex < formFields.length) {
//                         const fieldName = formFields[colIndex];
//                         dataCopy[currentRowIndex][fieldName] = value.trim();
//                     }
//                 });
//             });
    
//             return dataCopy;
//         });
//     };
    
//     const handleDelete = async (recordId) => {
//         if (!recordId) return;
//         setActionLoading(true);
//         setError('');
//         try {
//             await studentsTrackerService[activeTab].remove(recordId);
//             fetchDataForTab(activeTab); 
//         } catch (err) {
//             setError('Failed to delete entry.');
//         } finally {
//             setActionLoading(false);
//             setRecordToDelete(null); 
//             setShowDeleteModal(false); 
//         }
//     };
    
//     const handleOpenDeleteModal = (record) => {
//         setRecordToDelete(record);
//         setShowDeleteModal(true);
//     };

//     const handleConfirmDelete = () => {
//         if (recordToDelete) {
//             handleDelete(recordToDelete._id);
//         }
//     };
    
//     const handleOpenAddModal = () => {
//         const newRow = currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {});
//         setNewEntriesData([newRow]);
//         setShowAddModal(true);
//         setError('');
//     };

//     const handleAddRowInModal = () => {
//         const newRow = currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {});
//         setNewEntriesData(prev => [...prev, newRow]);
//     };

//     const handleRemoveRowInModal = (indexToRemove) => {
//         setNewEntriesData(prev => prev.filter((_, index) => index !== indexToRemove));
//     };

//     const handleNewEntryChange = (index, field, value) => {
//         setNewEntriesData(prev => {
//             const updated = [...prev];
//             updated[index][field] = value;
//             return updated;
//         });
//     };
    
//     const handleCreateMultiple = async () => {
//         const validData = newEntriesData.filter(row => 
//             Object.values(row).some(val => val && val.toString().trim() !== '')
//         );
//         if (validData.length === 0) {
//             setError("Cannot submit empty entries."); return;
//         }
//         setActionLoading(true);
//         setError('');
//         try {
//             await studentsTrackerService[activeTab].create(validData);
//             setShowAddModal(false);
//             fetchDataForTab(activeTab);
//         } catch(err) { setError('Failed to create entries.'); }
//         finally { setActionLoading(false); }
//     };

//     const handleOpenEditModal = (record) => {
//         setEditingRecord(record);
//         setShowEditModal(true);
//         setError('');
//     };

//     const handleEditingRecordChange = (field, value) => {
//         setEditingRecord(prev => ({...prev, [field]: value}));
//     };
    
//     const handleUpdate = async () => {
//         if (!editingRecord) return;
//         setActionLoading(true);
//         setError('');
//         try {
//             await studentsTrackerService[activeTab].update(editingRecord._id, editingRecord);
//             setShowEditModal(false);
//             fetchDataForTab(activeTab);
//         } catch(err) { setError(`Failed to update entry.`); }
//         finally { setActionLoading(false); }
//     };
    
//     const calculatedData = useMemo(() => {
//         const currentData = data[activeTab] || [];
//         if (activeTab === 'assignmentRatings') {
//             return aggregateAssignmentMarks(currentData);
//         }
//         if (activeTab === 'companyClosings') {
//             return calculateCompanyClosingScore(currentData);
//         }
//         return currentData.map(row => ({
//             ...row,
//             overallMarks: ratingCalculations[activeTab] ? ratingCalculations[activeTab](row) : 'N/A'
//         }));
//     }, [data, activeTab]);

//     const companyAggregatedData = useMemo(() => {
//         if (activeTab !== 'aseRatings' || !data.aseRatings) {
//             return [];
//         }
        
//         const aggregationMap = new Map();
//         const aseRatingsData = data.aseRatings || [];

//         aseRatingsData.forEach(record => {
//             const key = `${record.companyName}|${record.ase || 'N/A'}`;
//             if (!aggregationMap.has(key)) {
//                 aggregationMap.set(key, {
//                     companyName: record.companyName,
//                     ase: record.ase || 'N/A',
//                     studentCount: 0
//                 });
//             }
//             aggregationMap.get(key).studentCount += 1;
//         });

//         return Array.from(aggregationMap.values()).sort((a,b) => a.companyName.localeCompare(b.companyName) || a.ase.localeCompare(b.ase));
//     }, [data, activeTab]);

//     const filteredAndCalculatedData = useMemo(() => {
//         if (!searchTerm) {
//             return calculatedData;
//         }
//         const lowerCaseSearch = searchTerm.toLowerCase();
//         return calculatedData.filter(row => 
//             Object.values(row).some(value => 
//                 String(value).toLowerCase().includes(lowerCaseSearch)
//             )
//         );
//     }, [calculatedData, searchTerm]);

//     const handleExportCSV = () => {
//         if (filteredAndCalculatedData.length === 0) {
//             alert("No data to export.");
//             return;
//         }
        
//         const dataToExport = filteredAndCalculatedData.map(row => {
//             const rowData = {};
//             currentSheetConfig.columns.forEach(col => {
//                 rowData[col.header] = row[col.field];
//             });
//             return rowData;
//         });

//         const csv = Papa.unparse(dataToExport);
//         const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//         const link = document.createElement("a");
//         const url = URL.createObjectURL(blob);
//         link.setAttribute("href", url);
//         link.setAttribute("download", `${activeTab}_export_${new Date().toISOString().slice(0,10)}.csv`);
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     };

//     const getAddModalClassName = () => {
//         return activeTab === 'aseRatings' ? 'ase-ratings-modal' : '';
//     };

//     const renderTruncatableContent = (text) => {
//         const maxLength = 60;
//         if (typeof text !== 'string' || text.length <= maxLength) {
//             return text;
//         }
//         return (
//             <span>
//                 {text.substring(0, maxLength)}...
//                 <Button variant="link" size="sm" className="p-0 ms-1" onClick={() => handleShowRemarksModal(text)}>
//                     More
//                 </Button>
//             </span>
//         );
//     };
    
//     const getFieldName = (fieldKey) => {
//         const columnConfig = currentSheetConfig?.columns.find(c => c.field === fieldKey);
//         if (columnConfig?.header) {
//             return columnConfig.header;
//         }
//         const result = fieldKey.replace(/([A-Z])/g, ' $1');
//         return result.charAt(0).toUpperCase() + result.slice(1);
//     };

//     return (
//         <div>
//             {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
//             <div className="mb-3">
//                <Nav className="nav-tabs border-bottom-0 bg-transparent" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'aseRatings')}>
//                    {Object.entries(sheetConfig).map(([key, config]) => (
//                        <Nav.Item key={key}>
//                            <Nav.Link 
//                                eventKey={key} 
//                                className={`px-4 py-2 border-0 bg-transparent ${activeTab === key ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
//                            >
//                                {config.title}
//                            </Nav.Link>
//                        </Nav.Item>
//                    ))}
//                    <Nav.Item>
//                        <Nav.Link 
//                            eventKey="companyInteractionTracking"
//                            className={`px-4 py-2 border-0 bg-transparent ${activeTab === 'companyInteractionTracking' ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
//                         >
//                            Interaction Tracking
//                         </Nav.Link>
//                    </Nav.Item>
//                </Nav>
//            </div>

//             {activeTab === 'companyInteractionTracking' ? (
//                 <CompanyInteractionAdminView onUpdate={fetchDataForTab} user={user} />
//             ) : (
//                 <Card className="shadow-sm">
//                     <Card.Header className="d-flex justify-content-between align-items-center bg-light flex-wrap gap-2">
//                         <h5 className="mb-0">{currentSheetConfig?.title}</h5>
//                         <div className="d-flex align-items-center">
//                             {activeTab === 'aseRatings' && (
//                                 <div className="d-flex align-items-center me-3">
//                                     <div className="btn-group btn-group-sm" role="group" aria-label="View toggle">
//                                         <Button variant={viewMode === 'companies' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('companies')} title="Company View">
//                                             <i className="fas fa-building"></i>
//                                         </Button>
//                                         <Button variant={viewMode === 'students' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('students')} title="Student View">
//                                             <i className="fas fa-users"></i>
//                                         </Button>
//                                     </div>
//                                 </div>
//                             )}
//                              <div className="d-flex align-items-center gap-2">
//                                 <InputGroup size="sm" style={{ width: '250px' }}>
//                                     <Form.Control 
//                                         placeholder="Search this sheet..."
//                                         value={searchTerm}
//                                         onChange={e => setSearchTerm(e.target.value)}
//                                     />
//                                     {searchTerm && 
//                                         <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
//                                             <i className="fas fa-times"></i>
//                                         </Button>
//                                     }
//                                 </InputGroup>
//                                 <Button variant="outline-success" size="sm" onClick={handleExportCSV}>
//                                     <i className="fas fa-file-csv me-2"></i>Export
//                                 </Button>
//                                 {canEdit && (
//                                     <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
//                                         <i className="fas fa-plus me-2"></i>Add Entries
//                                     </Button>
//                                 )}
//                              </div>
//                         </div>
//                     </Card.Header>
//                     <Card.Body className="p-0">
//                         {loading ? (
//                             <div className="text-center p-5"><Spinner /></div>
//                         ) : (
//                             <div className="table-responsive">
//                                  {activeTab === 'aseRatings' && viewMode === 'companies' ? (
//                                     <Table striped bordered hover size="sm">
//                                         <thead className="table-light">
//                                             <tr>
//                                                 <th>Company</th>
//                                                 <th className="text-center">Students</th>
//                                                 <th>ASE</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {companyAggregatedData.length === 0 ? (
//                                                 <tr><td colSpan="3" className="text-center text-muted p-4">No data available to aggregate.</td></tr>
//                                             ) : (
//                                                 companyAggregatedData.map((item, index) => (
//                                                     <tr key={index}>
//                                                         <td className="fw-medium">{item.companyName}</td>
//                                                         <td className="text-center">{item.studentCount}</td>
//                                                         <td>{item.ase}</td>
//                                                     </tr>
//                                                 ))
//                                             )}
//                                         </tbody>
//                                     </Table>
//                                 ) : (
//                                     <Table striped bordered hover size="sm">
//                                         <thead className="table-light">
//                                             <tr>
//                                                 {currentSheetConfig?.columns.map(col => <th key={col.field}>{col.header}</th>)}
//                                                 {canEdit && <th className="text-center">Actions</th>}
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {filteredAndCalculatedData.length === 0 ? (
//                                                 <tr><td colSpan={canEdit ? currentSheetConfig.columns.length + 1 : currentSheetConfig.columns.length} className="text-center text-muted p-4">No data available.</td></tr>
//                                             ) : (
//                                                 filteredAndCalculatedData.map(row => (
//                                                     <tr key={row._id}>
//                                                         {currentSheetConfig.columns.map(col => {
//                                                             const truncatableColumns = ['remarks', 'studentQuestion', 'studentAnswer'];
//                                                             if (col.field === 'editHistory') {
//                                                                 const hasHistory = row.createdBy || (row.updatedBy && row.updatedBy.length > 0);
//                                                                 return (
//                                                                     <td key={col.field} className="text-center">
//                                                                         {hasHistory ? (
//                                                                             <Button 
//                                                                                 variant="link" 
//                                                                                 size="sm" 
//                                                                                 className="p-0 text-decoration-none" 
//                                                                                 onClick={() => handleShowHistoryModal(row)}
//                                                                             >
//                                                                                 View
//                                                                             </Button>
//                                                                         ) : (
//                                                                             <span className="text-muted"></span>
//                                                                         )}
//                                                                     </td>
//                                                                 );
//                                                             }
//                                                             return (
//                                                                 <td key={col.field}>
//                                                                     {truncatableColumns.includes(col.field)
//                                                                         ? renderTruncatableContent(row[col.field])
//                                                                         : col.type === 'date' 
//                                                                             ? formatDateForDisplay(row[col.field]) 
//                                                                             : col.type === 'link' && row[col.field]
//                                                                                 ? <a href={row[col.field]} target="_blank" rel="noopener noreferrer">Link</a> 
//                                                                                 : row[col.field]}
//                                                                 </td>
//                                                             );
//                                                         })}
//                                                         {/* --- START MODIFICATION: Replaced buttons with Dropdown menu --- */}
//                                                         {canEdit && (
//                                                             <td className="text-center">
//                                                                 <Dropdown>
//                                                                     <Dropdown.Toggle as={ActionMenuToggle} id={`actions-dropdown-${row._id}`} />
//                                                                     <Dropdown.Menu align="end">
//                                                                         <Dropdown.Item onClick={() => handleOpenEditModal(row)}>
//                                                                             <i className="fas fa-edit me-2 text-primary"></i> Edit
//                                                                         </Dropdown.Item>
//                                                                         <Dropdown.Item onClick={() => handleOpenDeleteModal(row)} className="text-danger">
//                                                                             <i className="fas fa-trash me-2"></i> Delete
//                                                                         </Dropdown.Item>
//                                                                     </Dropdown.Menu>
//                                                                 </Dropdown>
//                                                             </td>
//                                                         )}
//                                                         {/* --- END MODIFICATION --- */}
//                                                     </tr>
//                                                 ))
//                                             )}
//                                         </tbody>
//                                     </Table>
//                                 )}
//                             </div>
//                         )}
//                     </Card.Body>
//                 </Card>
//             )}

//             <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="xl" centered dialogClassName={getAddModalClassName()}>
//                 <Modal.Header closeButton>
//                     <Modal.Title>Add to {currentSheetConfig?.title}</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {error && <Alert variant="danger" size="sm" className="py-2">{error}</Alert>}
//                      <div className="table-responsive" style={{ maxHeight: '60vh' }}>
//                         <Table striped bordered size="sm">
//                             <thead>
//                                 <tr>
//                                     {currentSheetConfig?.columns.map(col => !col.readOnly && col.field !== 'editHistory' && <th key={col.field} style={{ minWidth: col.minWidth || '120px' }}>{col.header}</th>)}
//                                     <th style={{ width: '50px' }}>Action</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {newEntriesData.map((row, index) => (
//                                     <tr key={index}>
//                                         {currentSheetConfig?.columns.map((col, colIndex) => !col.readOnly && col.field !== 'editHistory' && (
//                                             <td key={col.field}>
//                                                 {col.type === 'dropdown' ? (
//                                                     <Form.Select size="sm" value={row[col.field] || ''} onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}>
//                                                         <option value="">Select...</option>
//                                                         {(col.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//                                                     </Form.Select>
//                                                 ) : col.type === 'textarea' ? (
//                                                     <Form.Control
//                                                         as="textarea"
//                                                         rows={2}
//                                                         size="sm"
//                                                         value={row[col.field] || ''}
//                                                         onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}
//                                                     />
//                                                 ) : (
//                                                     <Form.Control
//                                                         size="sm"
//                                                         type={col.type === 'link' ? 'text' : (col.type || 'text')}
//                                                         value={row[col.field] || ''}
//                                                         onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}
//                                                         onPaste={colIndex === 0 ? (e) => handlePaste(e, index) : undefined}
//                                                     />
//                                                 )}
//                                             </td>
//                                         ))}
//                                         <td className="text-center">
//                                             <Button variant="outline-danger" size="sm" onClick={() => handleRemoveRowInModal(index)}>
//                                                 <i className="fas fa-trash"></i>
//                                             </Button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </Table>
//                     </div>
//                     <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddRowInModal}>
//                         <i className="fas fa-plus me-1"></i> Add
//                     </Button>
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
//                     <Button variant="primary" onClick={handleCreateMultiple} disabled={actionLoading}>
//                         {actionLoading ? <Spinner size="sm" /> : `Save ${newEntriesData.length} Entr${newEntriesData.length > 1 ? 'ies' : 'y'}`}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
//                 <Modal.Header closeButton>
//                     <Modal.Title>Edit {currentSheetConfig?.title}</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {error && <Alert variant="danger" size="sm" className="py-2">{error}</Alert>}
//                     {editingRecord && (
//                         <Form>
//                             {currentSheetConfig?.columns.map(col => !col.readOnly && col.field !== 'editHistory' && (
//                                 <Form.Group key={col.field} className="mb-3">
//                                     <Form.Label>{col.header}</Form.Label>
//                                     {col.type === 'dropdown' ? (
//                                         <Form.Select value={editingRecord[col.field] || ''} onChange={(e) => handleEditingRecordChange(col.field, e.target.value)}>
//                                             <option value="">Select...</option>
//                                             {(col.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//                                         </Form.Select>
//                                     ) : col.type === 'date' ? (
//                                         <DatePicker 
//                                             selected={editingRecord[col.field] ? new Date(editingRecord[col.field]) : null}
//                                             onChange={date => handleEditingRecordChange(col.field, date)}
//                                             className="form-control"
//                                             dateFormat="MM/dd/yyyy"
//                                         />
//                                     ) : col.type === 'textarea' ? (
//                                         <Form.Control 
//                                             as="textarea"
//                                             rows={4}
//                                             value={editingRecord[col.field] || ''} 
//                                             onChange={(e) => handleEditingRecordChange(col.field, e.target.value)} 
//                                         />
//                                     ) : (
//                                         <Form.Control 
//                                             type={col.type === 'link' ? 'text' : (col.type || 'text')} 
//                                             value={editingRecord[col.field] || ''} 
//                                             onChange={(e) => handleEditingRecordChange(col.field, e.target.value)} 
//                                         />
//                                     )}
//                                 </Form.Group>
//                             ))}
//                         </Form>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
//                     <Button variant="primary" onClick={handleUpdate} disabled={actionLoading}>
//                         {actionLoading ? <Spinner size="sm" /> : 'Save Changes'}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
//                 <Modal.Header closeButton className="bg-danger text-white">
//                     <Modal.Title><i className="fas fa-exclamation-triangle me-2"></i>Confirm Deletion</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     <p>Are you sure you want to permanently delete this entry?</p>
//                     {recordToDelete && <p className="text-muted small"><strong>Details:</strong> {recordToDelete.studentName} ({recordToDelete.companyName})</p>}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>Cancel</Button>
//                     <Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>
//                         {actionLoading ? <Spinner size="sm" /> : 'Delete Entry'}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <Modal show={showRemarksModal} onHide={handleCloseRemarksModal} centered>
//                 <Modal.Header closeButton>
//                     <Modal.Title>View Full Text</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}>
//                     {remarksModalContent}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={handleCloseRemarksModal}>
//                         Close
//                     </Button>
//                 </Modal.Footer>
//             </Modal>

//             <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="xl">
//                 <Modal.Header closeButton>
//                     <Modal.Title><i className="fas fa-history me-2"></i>Edit History</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {historyModalData && (
//                         <>
//                             <p className="mb-2">
//                                 <strong>Record:</strong> {historyModalData.studentName} ({historyModalData.companyName})
//                             </p>
//                             <Table striped bordered size="sm" responsive>
//                                 <thead className="table-light">
//                                     <tr>
//                                         <th>Action</th>
//                                         <th>User</th>
//                                         <th>Date & Time</th>
//                                         <th>Field Modified</th>
//                                         <th>Previous Value</th>
//                                         <th>Modified Value</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {historyModalData.createdBy && (
//                                         <tr>
//                                             <td>Created</td>
//                                             <td>{historyModalData.createdBy.firstName ? `${historyModalData.createdBy.firstName} ${historyModalData.createdBy.lastName || ''}`.trim() : historyModalData.createdBy.username}</td>
//                                             <td>{formatDateTimeForDisplay(historyModalData.createdAt)}</td>
//                                             <td colSpan="3" className="text-muted text-center">N/A (Initial Record)</td>
//                                         </tr>
//                                     )}
//                                     {(historyModalData.updatedBy || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((edit, editIndex) => (
//                                         <React.Fragment key={editIndex}>
//                                             {(edit.changes && edit.changes.length > 0) ? (
//                                                 edit.changes.map((change, changeIndex) => (
//                                                     <tr key={`${editIndex}-${changeIndex}`}>
//                                                         {changeIndex === 0 && (
//                                                             <>
//                                                                 <td rowSpan={edit.changes.length}>Edited</td>
//                                                                 <td rowSpan={edit.changes.length}>{edit.user ? (edit.user.firstName ? `${edit.user.firstName} ${edit.user.lastName || ''}`.trim() : edit.user.username) : 'Unknown User'}</td>
//                                                                 <td rowSpan={edit.changes.length}>{formatDateTimeForDisplay(edit.timestamp)}</td>
//                                                             </>
//                                                         )}
//                                                         <td><strong>{getFieldName(change.field)}</strong></td>
//                                                         <td style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '200px'}}>{change.from}</td>
//                                                         <td style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '200px'}}>{change.to}</td>
//                                                     </tr>
//                                                 ))
//                                             ) : (
//                                                 <tr key={editIndex}>
//                                                     <td>Edited</td>
//                                                     <td>{edit.user ? (edit.user.firstName ? `${edit.user.firstName} ${edit.user.lastName || ''}`.trim() : edit.user.username) : 'Unknown User'}</td>
//                                                     <td>{formatDateTimeForDisplay(edit.timestamp)}</td>
//                                                     <td colSpan="3" className="text-muted text-center">No field changes were recorded.</td>
//                                                 </tr>
//                                             )}
//                                         </React.Fragment>
//                                     ))}
//                                 </tbody>
//                             </Table>
//                         </>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Close</Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <style type="text/css">
//                 {`
//                     .ase-ratings-modal .modal-dialog {
//                         max-width: 95vw; 
//                     }
//                     .nav-tabs {
//                         border-bottom: 1px solid #dee2e6;
//                     }
//                     .nav-tabs .nav-link {
//                         margin-bottom: -1px;
//                         background: none;
//                         font-size: 0.9rem;
//                         font-weight: 500;
//                         transition: color 0.15s ease-in-out;
//                         border-radius: 0;
//                     }
//                     .nav-tabs .nav-link:hover:not(.active) {
//                         color: #495057;
//                         border-color: transparent;
//                     }
//                     .nav-tabs .nav-link.active {
//                         font-weight: 600;
//                     }
//                     @media (min-width: 1400px) {
//                         .ase-ratings-modal .modal-dialog {
//                             max-width: 1350px;
//                         }
//                     }
//                     /* For Dropdown menu styling */
//                     .no-caret::after {
//                         display: none;
//                     }
//                 `}
//             </style>
//         </div>
//     );
// };

// export default StudentsTrackerPage;



// // client/src/pages/StudentsTrackerPage.jsx
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { Nav, Card, Alert, Spinner, Button, Modal, Form, Table, InputGroup, Dropdown } from 'react-bootstrap';
// import { Navigate } from 'react-router-dom';
// import DatePicker from 'react-datepicker';
// import "react-datepicker/dist/react-datepicker.css";
// import studentsTrackerService from '../services/studentsTrackerService.js';
// import { sheetConfig, ratingCalculations, aggregateAssignmentMarks, calculateCompanyClosingScore } from '../utils/studentsTrackerConfig.js';
// import Papa from 'papaparse';
// import CompanyInteractionAdminView from '../components/students-tracker/CompanyInteractionAdminView.jsx';
// import useAuth from '../hooks/useAuth.js';

// const ActionMenuToggle = React.forwardRef(({ onClick }, ref) => (
//     <Button
//       variant="link"
//       ref={ref}
//       onClick={(e) => {
//         e.preventDefault();
//         onClick(e);
//       }}
//       className="p-1 text-muted no-caret"
//       title="Actions"
//     >
//       <i className="fas fa-ellipsis-v"></i>
//     </Button>
// ));
// ActionMenuToggle.displayName = 'ActionMenuToggle';

// const StudentsTrackerPage = () => {
//     const { user } = useAuth();

//     if ((user.role === 'instructor' || user.role === 'crm') && !user.canAccessStudentsTracker) {
//         return <Navigate to="/not-authorized" replace />;
//     }

//     const canEdit = user.role === 'admin' || user.role === 'instructor' || user.role === 'crm';

//     const [activeTab, setActiveTab] = useState('aseRatings');
//     const [data, setData] = useState({});
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [actionLoading, setActionLoading] = useState(false);

//     const [viewMode, setViewMode] = useState('students');
//     const [searchTerm, setSearchTerm] = useState('');

//     // Modal States
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [newEntriesData, setNewEntriesData] = useState([]);
//     const [showEditModal, setShowEditModal] = useState(false);
//     const [editingRecord, setEditingRecord] = useState(null);
//     const [showDeleteModal, setShowDeleteModal] = useState(false);
//     const [recordToDelete, setRecordToDelete] = useState(null);
//     const [showRemarksModal, setShowRemarksModal] = useState(false);
//     const [remarksModalContent, setRemarksModalContent] = useState('');
//     const [showHistoryModal, setShowHistoryModal] = useState(false);
//     const [historyModalData, setHistoryModalData] = useState(null);

//     const currentSheetConfig = useMemo(() => sheetConfig[activeTab], [activeTab]);

//     const fetchDataForTab = useCallback(async (tabKey) => {
//         if (tabKey === 'companyInteractionTracking') {
//             setLoading(false);
//             return;
//         }
        
//         setLoading(true);
//         setError('');
//         try {
//             const service = studentsTrackerService[tabKey];
//             if (!service) throw new Error(`Service for tab "${tabKey}" not found.`);
//             const response = await service.getAll();
//             setData(prev => ({ ...prev, [tabKey]: response.data || [] }));
//         } catch (err) {
//             setError(`Failed to load data for ${currentSheetConfig?.title || tabKey}.`);
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     }, [currentSheetConfig]);

//     useEffect(() => {
//         fetchDataForTab(activeTab);
//     }, [activeTab, fetchDataForTab]);
    
//     useEffect(() => {
//         if (activeTab !== 'aseRatings') {
//             setViewMode('students');
//         }
//         setSearchTerm('');
//     }, [activeTab]);

//     const handleShowRemarksModal = (remarks) => {
//         setRemarksModalContent(remarks);
//         setShowRemarksModal(true);
//     };

//     const handleCloseRemarksModal = () => {
//         setShowRemarksModal(false);
//         setRemarksModalContent('');
//     };

//     const formatDateForDisplay = (dateString) => {
//         if (!dateString) return '';
//         try {
//             return new Date(dateString).toLocaleDateString('en-US'); 
//         } catch (e) {
//             return 'Invalid Date';
//         }
//     };

//     const formatDateTimeForDisplay = (dateString) => {
//         if (!dateString) return '';
//         try {
//             return new Date(dateString).toLocaleString('en-US', {
//                 year: 'numeric', month: 'short', day: 'numeric',
//                 hour: 'numeric', minute: '2-digit', hour12: true
//             });
//         } catch (e) {
//             return 'Invalid Date';
//         }
//     };
    
//     const handleShowHistoryModal = (row) => {
//         setHistoryModalData(row);
//         setShowHistoryModal(true);
//     };
    
//     const handlePaste = (e, startingIndex) => {
//         e.preventDefault();
//         const pasteData = e.clipboardData.getData('text');
//         const rows = pasteData.split(/[\r\n]+/).filter(row => row.trim() !== '');
//         const formFields = currentSheetConfig.columns.filter(c => !c.readOnly).map(c => c.field);
    
//         setNewEntriesData(prev => {
//             let dataCopy = [...prev];
    
//             rows.forEach((row, rowIndex) => {
//                 const values = row.split('\t');
//                 const currentRowIndex = startingIndex + rowIndex;
    
//                 if (currentRowIndex >= dataCopy.length) {
//                     dataCopy.push(currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {}));
//                 }
    
//                 values.forEach((value, colIndex) => {
//                     if (colIndex < formFields.length) {
//                         const fieldName = formFields[colIndex];
//                         dataCopy[currentRowIndex][fieldName] = value.trim();
//                     }
//                 });
//             });
    
//             return dataCopy;
//         });
//     };
    
//     const handleDelete = async (recordId) => {
//         if (!recordId) return;
//         setActionLoading(true);
//         setError('');
//         try {
//             await studentsTrackerService[activeTab].remove(recordId);
//             fetchDataForTab(activeTab); 
//         } catch (err) {
//             setError('Failed to delete entry.');
//         } finally {
//             setActionLoading(false);
//             setRecordToDelete(null); 
//             setShowDeleteModal(false); 
//         }
//     };
    
//     const handleOpenDeleteModal = (record) => {
//         setRecordToDelete(record);
//         setShowDeleteModal(true);
//     };

//     const handleConfirmDelete = () => {
//         if (recordToDelete) {
//             handleDelete(recordToDelete._id);
//         }
//     };
    
//     const handleOpenAddModal = () => {
//         const newRow = currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {});
//         setNewEntriesData([newRow]);
//         setShowAddModal(true);
//         setError('');
//     };

//     const handleAddRowInModal = () => {
//         const newRow = currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {});
//         setNewEntriesData(prev => [...prev, newRow]);
//     };

//     const handleRemoveRowInModal = (indexToRemove) => {
//         setNewEntriesData(prev => prev.filter((_, index) => index !== indexToRemove));
//     };

//     const handleNewEntryChange = (index, field, value) => {
//         setNewEntriesData(prev => {
//             const updated = [...prev];
//             updated[index][field] = value;
//             return updated;
//         });
//     };
    
//     const handleCreateMultiple = async () => {
//         const validData = newEntriesData.filter(row => 
//             Object.values(row).some(val => val && val.toString().trim() !== '')
//         );
//         if (validData.length === 0) {
//             setError("Cannot submit empty entries."); return;
//         }
//         setActionLoading(true);
//         setError('');
//         try {
//             await studentsTrackerService[activeTab].create(validData);
//             setShowAddModal(false);
//             fetchDataForTab(activeTab);
//         } catch(err) { setError('Failed to create entries.'); }
//         finally { setActionLoading(false); }
//     };

//     const handleOpenEditModal = (record) => {
//         setEditingRecord(record);
//         setShowEditModal(true);
//         setError('');
//     };

//     const handleEditingRecordChange = (field, value) => {
//         setEditingRecord(prev => ({...prev, [field]: value}));
//     };
    
//     const handleUpdate = async () => {
//         if (!editingRecord) return;
//         setActionLoading(true);
//         setError('');
//         try {
//             await studentsTrackerService[activeTab].update(editingRecord._id, editingRecord);
//             setShowEditModal(false);
//             fetchDataForTab(activeTab);
//         } catch(err) { setError(`Failed to update entry.`); }
//         finally { setActionLoading(false); }
//     };
    
//     const calculatedData = useMemo(() => {
//         const currentData = data[activeTab] || [];
//         if (activeTab === 'assignmentRatings') {
//             return aggregateAssignmentMarks(currentData);
//         }
//         if (activeTab === 'companyClosings') {
//             return calculateCompanyClosingScore(currentData);
//         }
//         return currentData.map(row => ({
//             ...row,
//             overallMarks: ratingCalculations[activeTab] ? ratingCalculations[activeTab](row) : 'N/A'
//         }));
//     }, [data, activeTab]);

//     const companyAggregatedData = useMemo(() => {
//         if (activeTab !== 'aseRatings' || !data.aseRatings) {
//             return [];
//         }
        
//         const aggregationMap = new Map();
//         const aseRatingsData = data.aseRatings || [];

//         aseRatingsData.forEach(record => {
//             const key = `${record.companyName}|${record.ase || 'N/A'}`;
//             if (!aggregationMap.has(key)) {
//                 aggregationMap.set(key, {
//                     companyName: record.companyName,
//                     ase: record.ase || 'N/A',
//                     studentCount: 0
//                 });
//             }
//             aggregationMap.get(key).studentCount += 1;
//         });

//         return Array.from(aggregationMap.values()).sort((a,b) => a.companyName.localeCompare(b.companyName) || a.ase.localeCompare(b.ase));
//     }, [data, activeTab]);

//     const filteredAndCalculatedData = useMemo(() => {
//         if (!searchTerm) {
//             return calculatedData;
//         }
//         const lowerCaseSearch = searchTerm.toLowerCase();
//         return calculatedData.filter(row => 
//             Object.values(row).some(value => 
//                 String(value).toLowerCase().includes(lowerCaseSearch)
//             )
//         );
//     }, [calculatedData, searchTerm]);

//     const handleExportCSV = () => {
//         if (filteredAndCalculatedData.length === 0) {
//             alert("No data to export.");
//             return;
//         }
        
//         const dataToExport = filteredAndCalculatedData.map(row => {
//             const rowData = {};
//             currentSheetConfig.columns.forEach(col => {
//                 rowData[col.header] = row[col.field];
//             });
//             return rowData;
//         });

//         const csv = Papa.unparse(dataToExport);
//         const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//         const link = document.createElement("a");
//         const url = URL.createObjectURL(blob);
//         link.setAttribute("href", url);
//         link.setAttribute("download", `${activeTab}_export_${new Date().toISOString().slice(0,10)}.csv`);
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     };

//     const getAddModalClassName = () => {
//         return activeTab === 'aseRatings' ? 'ase-ratings-modal' : '';
//     };

//     // --- START MODIFICATION: Add interactionRemarks to truncatable columns ---
//     const renderTruncatableContent = (text) => {
//         const maxLength = 60;
//         if (typeof text !== 'string' || text.length <= maxLength) {
//             return text;
//         }
//         return (
//             <span>
//                 {text.substring(0, maxLength)}...
//                 <Button variant="link" size="sm" className="p-0 ms-1" onClick={() => handleShowRemarksModal(text)}>
//                     More
//                 </Button>
//             </span>
//         );
//     };
//     // --- END MODIFICATION ---
    
//     const getFieldName = (fieldKey) => {
//         const columnConfig = currentSheetConfig?.columns.find(c => c.field === fieldKey);
//         if (columnConfig?.header) {
//             return columnConfig.header;
//         }
//         const result = fieldKey.replace(/([A-Z])/g, ' $1');
//         return result.charAt(0).toUpperCase() + result.slice(1);
//     };

//     return (
//         <div>
//             {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
//             <div className="mb-3">
//                <Nav className="nav-tabs border-bottom-0 bg-transparent" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'aseRatings')}>
//                    {Object.entries(sheetConfig).map(([key, config]) => (
//                        <Nav.Item key={key}>
//                            <Nav.Link 
//                                eventKey={key} 
//                                className={`px-4 py-2 border-0 bg-transparent ${activeTab === key ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
//                            >
//                                {config.title}
//                            </Nav.Link>
//                        </Nav.Item>
//                    ))}
//                    <Nav.Item>
//                        <Nav.Link 
//                            eventKey="companyInteractionTracking"
//                            className={`px-4 py-2 border-0 bg-transparent ${activeTab === 'companyInteractionTracking' ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
//                         >
//                            Interaction Tracking
//                         </Nav.Link>
//                    </Nav.Item>
//                </Nav>
//            </div>

//             {activeTab === 'companyInteractionTracking' ? (
//                 <CompanyInteractionAdminView onUpdate={fetchDataForTab} user={user} />
//             ) : (
//                 <Card className="shadow-sm">
//                     <Card.Header className="d-flex justify-content-between align-items-center bg-light flex-wrap gap-2">
//                         <h5 className="mb-0">{currentSheetConfig?.title}</h5>
//                         <div className="d-flex align-items-center">
//                             {activeTab === 'aseRatings' && (
//                                 <div className="d-flex align-items-center me-3">
//                                     <div className="btn-group btn-group-sm" role="group" aria-label="View toggle">
//                                         <Button variant={viewMode === 'companies' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('companies')} title="Company View">
//                                             <i className="fas fa-building"></i>
//                                         </Button>
//                                         <Button variant={viewMode === 'students' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('students')} title="Student View">
//                                             <i className="fas fa-users"></i>
//                                         </Button>
//                                     </div>
//                                 </div>
//                             )}
//                              <div className="d-flex align-items-center gap-2">
//                                 <InputGroup size="sm" style={{ width: '250px' }}>
//                                     <Form.Control 
//                                         placeholder="Search this sheet..."
//                                         value={searchTerm}
//                                         onChange={e => setSearchTerm(e.target.value)}
//                                     />
//                                     {searchTerm && 
//                                         <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
//                                             <i className="fas fa-times"></i>
//                                         </Button>
//                                     }
//                                 </InputGroup>
//                                 <Button variant="outline-success" size="sm" onClick={handleExportCSV}>
//                                     <i className="fas fa-file-csv me-2"></i>Export
//                                 </Button>
//                                 {canEdit && (
//                                     <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
//                                         <i className="fas fa-plus me-2"></i>Add Entries
//                                     </Button>
//                                 )}
//                              </div>
//                         </div>
//                     </Card.Header>
//                     <Card.Body className="p-0">
//                         {loading ? (
//                             <div className="text-center p-5"><Spinner /></div>
//                         ) : (
//                             <div className="table-responsive">
//                                  {activeTab === 'aseRatings' && viewMode === 'companies' ? (
//                                     <Table striped bordered hover size="sm">
//                                         <thead className="table-light">
//                                             <tr>
//                                                 <th>Company</th>
//                                                 <th className="text-center">Students</th>
//                                                 <th>ASE</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {companyAggregatedData.length === 0 ? (
//                                                 <tr><td colSpan="3" className="text-center text-muted p-4">No data available to aggregate.</td></tr>
//                                             ) : (
//                                                 companyAggregatedData.map((item, index) => (
//                                                     <tr key={index}>
//                                                         <td className="fw-medium">{item.companyName}</td>
//                                                         <td className="text-center">{item.studentCount}</td>
//                                                         <td>{item.ase}</td>
//                                                     </tr>
//                                                 ))
//                                             )}
//                                         </tbody>
//                                     </Table>
//                                 ) : (
//                                     <Table striped bordered hover size="sm">
//                                         <thead className="table-light">
//                                             <tr>
//                                                 {currentSheetConfig?.columns.map(col => <th key={col.field}>{col.header}</th>)}
//                                                 {canEdit && <th className="text-center">Actions</th>}
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {filteredAndCalculatedData.length === 0 ? (
//                                                 <tr><td colSpan={canEdit ? currentSheetConfig.columns.length + 1 : currentSheetConfig.columns.length} className="text-center text-muted p-4">No data available.</td></tr>
//                                             ) : (
//                                                 filteredAndCalculatedData.map(row => (
//                                                     <tr key={row._id}>
//                                                         {currentSheetConfig.columns.map(col => (
//                                                             <td key={col.field}>
//                                                                 {(() => {
//                                                                     if (col.field === 'overallMarks') {
//                                                                         const marksString = row[col.field] || '0 / 20';
//                                                                         const score = parseInt(String(marksString).split('/')[0], 10);
//                                                                         if (!isNaN(score) && score < 0) {
//                                                                             return <strong className="text-danger">{marksString}</strong>;
//                                                                         }
//                                                                         return marksString;
//                                                                     }

//                                                                     if (col.field === 'editHistory') {
//                                                                         const hasHistory = row.createdBy || (row.updatedBy && row.updatedBy.length > 0);
//                                                                         return hasHistory ? (
//                                                                             <Button 
//                                                                                 variant="link" 
//                                                                                 size="sm" 
//                                                                                 className="p-0 text-decoration-none" 
//                                                                                 onClick={() => handleShowHistoryModal(row)}
//                                                                             >
//                                                                                 View
//                                                                             </Button>
//                                                                         ) : <span className="text-muted"></span>;
//                                                                     }
                                                                    
//                                                                     // --- START MODIFICATION ---
//                                                                     const truncatableColumns = ['remarks', 'studentQuestion', 'studentAnswer', 'interactionRemarks'];
//                                                                     // --- END MODIFICATION ---
//                                                                     if (truncatableColumns.includes(col.field)) {
//                                                                         return renderTruncatableContent(row[col.field]);
//                                                                     }

//                                                                     if (col.type === 'date') {
//                                                                         return formatDateForDisplay(row[col.field]);
//                                                                     }

//                                                                     if (col.type === 'link' && row[col.field]) {
//                                                                         return <a href={row[col.field]} target="_blank" rel="noopener noreferrer">Link</a>;
//                                                                     }
                                                                    
//                                                                     return row[col.field];
//                                                                 })()}
//                                                             </td>
//                                                         ))}
//                                                         {canEdit && (
//                                                             <td className="text-center">
//                                                                 <Dropdown>
//                                                                     <Dropdown.Toggle as={ActionMenuToggle} id={`actions-dropdown-${row._id}`} />
//                                                                     <Dropdown.Menu align="end">
//                                                                         <Dropdown.Item onClick={() => handleOpenEditModal(row)}>
//                                                                             <i className="fas fa-edit me-2 text-primary"></i> Edit
//                                                                         </Dropdown.Item>
//                                                                         <Dropdown.Item onClick={() => handleOpenDeleteModal(row)} className="text-danger">
//                                                                             <i className="fas fa-trash me-2"></i> Delete
//                                                                         </Dropdown.Item>
//                                                                     </Dropdown.Menu>
//                                                                 </Dropdown>
//                                                             </td>
//                                                         )}
//                                                     </tr>
//                                                 ))
//                                             )}
//                                         </tbody>
//                                     </Table>
//                                 )}
//                             </div>
//                         )}
//                     </Card.Body>
//                 </Card>
//             )}

//             <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="xl" centered dialogClassName={getAddModalClassName()}>
//                 <Modal.Header closeButton>
//                     <Modal.Title>Add to {currentSheetConfig?.title}</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {error && <Alert variant="danger" size="sm" className="py-2">{error}</Alert>}
//                      <div className="table-responsive" style={{ maxHeight: '60vh' }}>
//                         <Table striped bordered size="sm">
//                             <thead>
//                                 <tr>
//                                     {currentSheetConfig?.columns.map(col => !col.readOnly && col.field !== 'editHistory' && <th key={col.field} style={{ minWidth: col.minWidth || '120px' }}>{col.header}</th>)}
//                                     <th style={{ width: '50px' }}>Action</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {newEntriesData.map((row, index) => (
//                                     <tr key={index}>
//                                         {currentSheetConfig?.columns.map((col, colIndex) => !col.readOnly && col.field !== 'editHistory' && (
//                                             <td key={col.field}>
//                                                 {col.type === 'dropdown' ? (
//                                                     <Form.Select size="sm" value={row[col.field] || ''} onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}>
//                                                         <option value="">Select...</option>
//                                                         {(col.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//                                                     </Form.Select>
//                                                 ) : col.type === 'textarea' ? (
//                                                     <Form.Control
//                                                         as="textarea"
//                                                         rows={2}
//                                                         size="sm"
//                                                         value={row[col.field] || ''}
//                                                         onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}
//                                                     />
//                                                 ) : (
//                                                     <Form.Control
//                                                         size="sm"
//                                                         type={col.type === 'link' ? 'text' : (col.type || 'text')}
//                                                         value={row[col.field] || ''}
//                                                         onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}
//                                                         onPaste={colIndex === 0 ? (e) => handlePaste(e, index) : undefined}
//                                                     />
//                                                 )}
//                                             </td>
//                                         ))}
//                                         <td className="text-center">
//                                             <Button variant="outline-danger" size="sm" onClick={() => handleRemoveRowInModal(index)}>
//                                                 <i className="fas fa-trash"></i>
//                                             </Button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </Table>
//                     </div>
//                     <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddRowInModal}>
//                         <i className="fas fa-plus me-1"></i> Add
//                     </Button>
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
//                     <Button variant="primary" onClick={handleCreateMultiple} disabled={actionLoading}>
//                         {actionLoading ? <Spinner size="sm" /> : `Save ${newEntriesData.length} Entr${newEntriesData.length > 1 ? 'ies' : 'y'}`}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
//                 <Modal.Header closeButton>
//                     <Modal.Title>Edit {currentSheetConfig?.title}</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {error && <Alert variant="danger" size="sm" className="py-2">{error}</Alert>}
//                     {editingRecord && (
//                         <Form>
//                             {currentSheetConfig?.columns.map(col => !col.readOnly && col.field !== 'editHistory' && (
//                                 <Form.Group key={col.field} className="mb-3">
//                                     <Form.Label>{col.header}</Form.Label>
//                                     {col.type === 'dropdown' ? (
//                                         <Form.Select value={editingRecord[col.field] || ''} onChange={(e) => handleEditingRecordChange(col.field, e.target.value)}>
//                                             <option value="">Select...</option>
//                                             {(col.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//                                         </Form.Select>
//                                     ) : col.type === 'date' ? (
//                                         <DatePicker 
//                                             selected={editingRecord[col.field] ? new Date(editingRecord[col.field]) : null}
//                                             onChange={date => handleEditingRecordChange(col.field, date)}
//                                             className="form-control"
//                                             dateFormat="MM/dd/yyyy"
//                                         />
//                                     ) : col.type === 'textarea' ? (
//                                         <Form.Control 
//                                             as="textarea"
//                                             rows={4}
//                                             value={editingRecord[col.field] || ''} 
//                                             onChange={(e) => handleEditingRecordChange(col.field, e.target.value)} 
//                                         />
//                                     ) : (
//                                         <Form.Control 
//                                             type={col.type === 'link' ? 'text' : (col.type || 'text')} 
//                                             value={editingRecord[col.field] || ''} 
//                                             onChange={(e) => handleEditingRecordChange(col.field, e.target.value)} 
//                                         />
//                                     )}
//                                 </Form.Group>
//                             ))}
//                         </Form>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
//                     <Button variant="primary" onClick={handleUpdate} disabled={actionLoading}>
//                         {actionLoading ? <Spinner size="sm" /> : 'Save Changes'}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
//                 <Modal.Header closeButton className="bg-danger text-white">
//                     <Modal.Title><i className="fas fa-exclamation-triangle me-2"></i>Confirm Deletion</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     <p>Are you sure you want to permanently delete this entry?</p>
//                     {recordToDelete && <p className="text-muted small"><strong>Details:</strong> {recordToDelete.studentName} ({recordToDelete.companyName})</p>}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>Cancel</Button>
//                     <Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>
//                         {actionLoading ? <Spinner size="sm" /> : 'Delete Entry'}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <Modal show={showRemarksModal} onHide={handleCloseRemarksModal} centered>
//                 <Modal.Header closeButton>
//                     <Modal.Title>View Full Text</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}>
//                     {remarksModalContent}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={handleCloseRemarksModal}>
//                         Close
//                     </Button>
//                 </Modal.Footer>
//             </Modal>

//             <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="xl">
//                 <Modal.Header closeButton>
//                     <Modal.Title><i className="fas fa-history me-2"></i>Edit History</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {historyModalData && (
//                         <>
//                             <p className="mb-2">
//                                 <strong>Record:</strong> {historyModalData.studentName} ({historyModalData.companyName})
//                             </p>
//                             <Table striped bordered size="sm" responsive>
//                                 <thead className="table-light">
//                                     <tr>
//                                         <th>Action</th>
//                                         <th>User</th>
//                                         <th>Date & Time</th>
//                                         <th>Field Modified</th>
//                                         <th>Previous Value</th>
//                                         <th>Modified Value</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {historyModalData.createdBy && (
//                                         <tr>
//                                             <td>Created</td>
//                                             <td>{historyModalData.createdBy.firstName ? `${historyModalData.createdBy.firstName} ${historyModalData.createdBy.lastName || ''}`.trim() : historyModalData.createdBy.username}</td>
//                                             <td>{formatDateTimeForDisplay(historyModalData.createdAt)}</td>
//                                             <td colSpan="3" className="text-muted text-center">N/A (Initial Record)</td>
//                                         </tr>
//                                     )}
//                                     {(historyModalData.updatedBy || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((edit, editIndex) => (
//                                         <React.Fragment key={editIndex}>
//                                             {(edit.changes && edit.changes.length > 0) ? (
//                                                 edit.changes.map((change, changeIndex) => (
//                                                     <tr key={`${editIndex}-${changeIndex}`}>
//                                                         {changeIndex === 0 && (
//                                                             <>
//                                                                 <td rowSpan={edit.changes.length}>Edited</td>
//                                                                 <td rowSpan={edit.changes.length}>{edit.user ? (edit.user.firstName ? `${edit.user.firstName} ${edit.user.lastName || ''}`.trim() : edit.user.username) : 'Unknown User'}</td>
//                                                                 <td rowSpan={edit.changes.length}>{formatDateTimeForDisplay(edit.timestamp)}</td>
//                                                             </>
//                                                         )}
//                                                         <td><strong>{getFieldName(change.field)}</strong></td>
//                                                         <td style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '200px'}}>{change.from}</td>
//                                                         <td style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '200px'}}>{change.to}</td>
//                                                     </tr>
//                                                 ))
//                                             ) : (
//                                                 <tr key={editIndex}>
//                                                     <td>Edited</td>
//                                                     <td>{edit.user ? (edit.user.firstName ? `${edit.user.firstName} ${edit.user.lastName || ''}`.trim() : edit.user.username) : 'Unknown User'}</td>
//                                                     <td>{formatDateTimeForDisplay(edit.timestamp)}</td>
//                                                     <td colSpan="3" className="text-muted text-center">No field changes were recorded.</td>
//                                                 </tr>
//                                             )}
//                                         </React.Fragment>
//                                     ))}
//                                 </tbody>
//                             </Table>
//                         </>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Close</Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <style type="text/css">
//                 {`
//                     .ase-ratings-modal .modal-dialog {
//                         max-width: 95vw; 
//                     }
//                     .nav-tabs {
//                         border-bottom: 1px solid #dee2e6;
//                     }
//                     .nav-tabs .nav-link {
//                         margin-bottom: -1px;
//                         background: none;
//                         font-size: 0.9rem;
//                         font-weight: 500;
//                         transition: color 0.15s ease-in-out;
//                         border-radius: 0;
//                     }
//                     .nav-tabs .nav-link:hover:not(.active) {
//                         color: #495057;
//                         border-color: transparent;
//                     }
//                     .nav-tabs .nav-link.active {
//                         font-weight: 600;
//                     }
//                     @media (min-width: 1400px) {
//                         .ase-ratings-modal .modal-dialog {
//                             max-width: 1350px;
//                         }
//                     }
//                     /* For Dropdown menu styling */
//                     .no-caret::after {
//                         display: none;
//                     }
//                 `}
//             </style>
//         </div>
//     );
// };

// export default StudentsTrackerPage;


// // client/src/pages/StudentsTrackerPage.jsx
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { Nav, Card, Alert, Spinner, Button, Modal, Form, Table, InputGroup, Dropdown } from 'react-bootstrap';
// import { Navigate } from 'react-router-dom';
// import DatePicker from 'react-datepicker';
// import "react-datepicker/dist/react-datepicker.css";
// import studentsTrackerService from '../services/studentsTrackerService.js';
// import { sheetConfig, ratingCalculations, aggregateAssignmentMarks, calculateCompanyClosingScore } from '../utils/studentsTrackerConfig.js';
// import Papa from 'papaparse';
// import CompanyInteractionAdminView from '../components/students-tracker/CompanyInteractionAdminView.jsx';
// import useAuth from '../hooks/useAuth.js';

// const ActionMenuToggle = React.forwardRef(({ onClick }, ref) => (
//     <Button
//       variant="link"
//       ref={ref}
//       onClick={(e) => {
//         e.preventDefault();
//         onClick(e);
//       }}
//       className="p-1 text-muted no-caret"
//       title="Actions"
//     >
//       <i className="fas fa-ellipsis-v"></i>
//     </Button>
// ));
// ActionMenuToggle.displayName = 'ActionMenuToggle';

// const StudentsTrackerPage = () => {
//     const { user } = useAuth();

//     if ((user.role === 'instructor' || user.role === 'crm') && !user.canAccessStudentsTracker) {
//         return <Navigate to="/not-authorized" replace />;
//     }

//     const canEdit = user.role === 'admin' || user.role === 'instructor' || user.role === 'crm';

//     const [activeTab, setActiveTab] = useState('aseRatings');
//     const [data, setData] = useState({});
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [actionLoading, setActionLoading] = useState(false);

//     const [viewMode, setViewMode] = useState('students');
//     const [searchTerm, setSearchTerm] = useState('');

//     // Modal States
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [newEntriesData, setNewEntriesData] = useState([]);
//     const [showEditModal, setShowEditModal] = useState(false);
//     const [editingRecord, setEditingRecord] = useState(null);
//     const [showDeleteModal, setShowDeleteModal] = useState(false);
//     const [recordToDelete, setRecordToDelete] = useState(null);
//     const [showRemarksModal, setShowRemarksModal] = useState(false);
//     const [remarksModalContent, setRemarksModalContent] = useState('');
//     const [showHistoryModal, setShowHistoryModal] = useState(false);
//     const [historyModalData, setHistoryModalData] = useState(null);

//     const currentSheetConfig = useMemo(() => sheetConfig[activeTab], [activeTab]);

//     const fetchDataForTab = useCallback(async (tabKey) => {
//         if (tabKey === 'companyInteractionTracking') {
//             setLoading(false);
//             return;
//         }
        
//         setLoading(true);
//         setError('');
//         try {
//             const service = studentsTrackerService[tabKey];
//             if (!service) throw new Error(`Service for tab "${tabKey}" not found.`);
//             const response = await service.getAll();
//             setData(prev => ({ ...prev, [tabKey]: response.data || [] }));
//         } catch (err) {
//             setError(`Failed to load data for ${currentSheetConfig?.title || tabKey}.`);
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     }, [currentSheetConfig]);

//     useEffect(() => {
//         fetchDataForTab(activeTab);
//     }, [activeTab, fetchDataForTab]);
    
//     useEffect(() => {
//         if (activeTab !== 'aseRatings') {
//             setViewMode('students');
//         }
//         setSearchTerm('');
//     }, [activeTab]);

//     const handleShowRemarksModal = (remarks) => {
//         setRemarksModalContent(remarks);
//         setShowRemarksModal(true);
//     };

//     const handleCloseRemarksModal = () => {
//         setShowRemarksModal(false);
//         setRemarksModalContent('');
//     };

//     const formatDateForDisplay = (dateString) => {
//         if (!dateString) return '';
//         try {
//             return new Date(dateString).toLocaleDateString('en-US'); 
//         } catch (e) {
//             return 'Invalid Date';
//         }
//     };

//     const formatDateTimeForDisplay = (dateString) => {
//         if (!dateString) return '';
//         try {
//             return new Date(dateString).toLocaleString('en-US', {
//                 year: 'numeric', month: 'short', day: 'numeric',
//                 hour: 'numeric', minute: '2-digit', hour12: true
//             });
//         } catch (e) {
//             return 'Invalid Date';
//         }
//     };
    
//     const handleShowHistoryModal = (row) => {
//         setHistoryModalData(row);
//         setShowHistoryModal(true);
//     };
    
//     const handlePaste = (e, startingIndex) => {
//         e.preventDefault();
//         const pasteData = e.clipboardData.getData('text');
//         const rows = pasteData.split(/[\r\n]+/).filter(row => row.trim() !== '');
//         const formFields = currentSheetConfig.columns.filter(c => !c.readOnly).map(c => c.field);
    
//         setNewEntriesData(prev => {
//             let dataCopy = [...prev];
    
//             rows.forEach((row, rowIndex) => {
//                 const values = row.split('\t');
//                 const currentRowIndex = startingIndex + rowIndex;
    
//                 if (currentRowIndex >= dataCopy.length) {
//                     dataCopy.push(currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {}));
//                 }
    
//                 values.forEach((value, colIndex) => {
//                     if (colIndex < formFields.length) {
//                         const fieldName = formFields[colIndex];
//                         dataCopy[currentRowIndex][fieldName] = value.trim();
//                     }
//                 });
//             });
    
//             return dataCopy;
//         });
//     };
    
//     const handleDelete = async (recordId) => {
//         if (!recordId) return;
//         setActionLoading(true);
//         setError('');
//         try {
//             await studentsTrackerService[activeTab].remove(recordId);
//             fetchDataForTab(activeTab); 
//         } catch (err) {
//             setError('Failed to delete entry.');
//         } finally {
//             setActionLoading(false);
//             setRecordToDelete(null); 
//             setShowDeleteModal(false); 
//         }
//     };
    
//     const handleOpenDeleteModal = (record) => {
//         setRecordToDelete(record);
//         setShowDeleteModal(true);
//     };

//     const handleConfirmDelete = () => {
//         if (recordToDelete) {
//             handleDelete(recordToDelete._id);
//         }
//     };
    
//     const handleOpenAddModal = () => {
//         const newRow = currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {});
//         setNewEntriesData([newRow]);
//         setShowAddModal(true);
//         setError('');
//     };

//     const handleAddRowInModal = () => {
//         const newRow = currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {});
//         setNewEntriesData(prev => [...prev, newRow]);
//     };

//     const handleRemoveRowInModal = (indexToRemove) => {
//         setNewEntriesData(prev => prev.filter((_, index) => index !== indexToRemove));
//     };

//     const handleNewEntryChange = (index, field, value) => {
//         setNewEntriesData(prev => {
//             const updated = [...prev];
//             updated[index][field] = value;
//             return updated;
//         });
//     };
    
//     const handleCreateMultiple = async () => {
//         const validData = newEntriesData.filter(row => 
//             Object.values(row).some(val => val && val.toString().trim() !== '')
//         );
//         if (validData.length === 0) {
//             setError("Cannot submit empty entries."); return;
//         }
//         setActionLoading(true);
//         setError('');
//         try {
//             await studentsTrackerService[activeTab].create(validData);
//             setShowAddModal(false);
//             fetchDataForTab(activeTab);
//         } catch(err) { setError('Failed to create entries.'); }
//         finally { setActionLoading(false); }
//     };

//     const handleOpenEditModal = (record) => {
//         setEditingRecord(record);
//         setShowEditModal(true);
//         setError('');
//     };

//     const handleEditingRecordChange = (field, value) => {
//         setEditingRecord(prev => ({...prev, [field]: value}));
//     };
    
//     const handleUpdate = async () => {
//         if (!editingRecord) return;
//         setActionLoading(true);
//         setError('');
//         try {
//             await studentsTrackerService[activeTab].update(editingRecord._id, editingRecord);
//             setShowEditModal(false);
//             fetchDataForTab(activeTab);
//         } catch(err) { setError(`Failed to update entry.`); }
//         finally { setActionLoading(false); }
//     };
    
//     const calculatedData = useMemo(() => {
//         const currentData = data[activeTab] || [];
//         if (activeTab === 'assignmentRatings') {
//             return aggregateAssignmentMarks(currentData);
//         }
//         if (activeTab === 'companyClosings') {
//             return calculateCompanyClosingScore(currentData);
//         }
//         return currentData.map(row => ({
//             ...row,
//             overallMarks: ratingCalculations[activeTab] ? ratingCalculations[activeTab](row) : 'N/A'
//         }));
//     }, [data, activeTab]);

//     const companyAggregatedData = useMemo(() => {
//         if (activeTab !== 'aseRatings' || !data.aseRatings) {
//             return [];
//         }
        
//         const aggregationMap = new Map();
//         const aseRatingsData = data.aseRatings || [];

//         aseRatingsData.forEach(record => {
//             const key = `${record.companyName}|${record.ase || 'N/A'}`;
//             if (!aggregationMap.has(key)) {
//                 aggregationMap.set(key, {
//                     companyName: record.companyName,
//                     ase: record.ase || 'N/A',
//                     studentCount: 0
//                 });
//             }
//             aggregationMap.get(key).studentCount += 1;
//         });

//         return Array.from(aggregationMap.values()).sort((a,b) => a.companyName.localeCompare(b.companyName) || a.ase.localeCompare(b.ase));
//     }, [data, activeTab]);

//     const filteredAndCalculatedData = useMemo(() => {
//         if (!searchTerm) {
//             return calculatedData;
//         }
//         const lowerCaseSearch = searchTerm.toLowerCase();
//         return calculatedData.filter(row => 
//             Object.values(row).some(value => 
//                 String(value).toLowerCase().includes(lowerCaseSearch)
//             )
//         );
//     }, [calculatedData, searchTerm]);

//     const handleExportCSV = () => {
//         if (filteredAndCalculatedData.length === 0) {
//             alert("No data to export.");
//             return;
//         }
        
//         const dataToExport = filteredAndCalculatedData.map(row => {
//             const rowData = {};
//             currentSheetConfig.columns.forEach(col => {
//                 rowData[col.header] = row[col.field];
//             });
//             return rowData;
//         });

//         const csv = Papa.unparse(dataToExport);
//         const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//         const link = document.createElement("a");
//         const url = URL.createObjectURL(blob);
//         link.setAttribute("href", url);
//         link.setAttribute("download", `${activeTab}_export_${new Date().toISOString().slice(0,10)}.csv`);
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     };

//     const getAddModalClassName = () => {
//         return activeTab === 'aseRatings' ? 'ase-ratings-modal' : '';
//     };

//     const renderTruncatableContent = (text) => {
//         const maxLength = 40;
//         if (typeof text !== 'string' || text.length <= maxLength) {
//             return text;
//         }
//         return (
//             <span>
//                 {text.substring(0, maxLength)}...
//                 <Button variant="link" size="sm" className="p-0 ms-1" onClick={() => handleShowRemarksModal(text)}>
//                     More
//                 </Button>
//             </span>
//         );
//     };
    
//     const getFieldName = (fieldKey) => {
//         const columnConfig = currentSheetConfig?.columns.find(c => c.field === fieldKey);
//         if (columnConfig?.header) {
//             return columnConfig.header;
//         }
//         const result = fieldKey.replace(/([A-Z])/g, ' $1');
//         return result.charAt(0).toUpperCase() + result.slice(1);
//     };

//     return (
//         <div>
//             {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
//             <div className="mb-3">
//                <Nav className="nav-tabs border-bottom-0 bg-transparent" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'aseRatings')}>
//                    {Object.entries(sheetConfig).map(([key, config]) => (
//                        <Nav.Item key={key}>
//                            <Nav.Link 
//                                eventKey={key} 
//                                className={`px-4 py-2 border-0 bg-transparent ${activeTab === key ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
//                            >
//                                {config.title}
//                            </Nav.Link>
//                        </Nav.Item>
//                    ))}
//                    <Nav.Item>
//                        <Nav.Link 
//                            eventKey="companyInteractionTracking"
//                            className={`px-4 py-2 border-0 bg-transparent ${activeTab === 'companyInteractionTracking' ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
//                         >
//                            Interaction Tracking
//                         </Nav.Link>
//                    </Nav.Item>
//                </Nav>
//            </div>

//             {activeTab === 'companyInteractionTracking' ? (
//                 <CompanyInteractionAdminView onUpdate={fetchDataForTab} user={user} />
//             ) : (
//                 <Card className="shadow-sm">
//                     <Card.Header className="d-flex justify-content-between align-items-center bg-light flex-wrap gap-2">
//                         <h5 className="mb-0">{currentSheetConfig?.title}</h5>
//                         <div className="d-flex align-items-center">
//                             {activeTab === 'aseRatings' && (
//                                 <div className="d-flex align-items-center me-3">
//                                     <div className="btn-group btn-group-sm" role="group" aria-label="View toggle">
//                                         <Button variant={viewMode === 'companies' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('companies')} title="Company View">
//                                             <i className="fas fa-building"></i>
//                                         </Button>
//                                         <Button variant={viewMode === 'students' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('students')} title="Student View">
//                                             <i className="fas fa-users"></i>
//                                         </Button>
//                                     </div>
//                                 </div>
//                             )}
//                              <div className="d-flex align-items-center gap-2">
//                                 <InputGroup size="sm" style={{ width: '250px' }}>
//                                     <Form.Control 
//                                         placeholder="Search this sheet..."
//                                         value={searchTerm}
//                                         onChange={e => setSearchTerm(e.target.value)}
//                                     />
//                                     {searchTerm && 
//                                         <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
//                                             <i className="fas fa-times"></i>
//                                         </Button>
//                                     }
//                                 </InputGroup>
//                                 <Button variant="outline-success" size="sm" onClick={handleExportCSV}>
//                                     <i className="fas fa-file-csv me-2"></i>Export
//                                 </Button>
//                                 {canEdit && (
//                                     <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
//                                         <i className="fas fa-plus me-2"></i>Add Entries
//                                     </Button>
//                                 )}
//                              </div>
//                         </div>
//                     </Card.Header>
//                     <Card.Body className="p-0">
//                         {loading ? (
//                             <div className="text-center p-5"><Spinner /></div>
//                         ) : (
//                             <div className="table-responsive">
//                                  {activeTab === 'aseRatings' && viewMode === 'companies' ? (
//                                     <Table striped bordered hover size="sm">
//                                         <thead className="table-light">
//                                             <tr>
//                                                 <th>Company</th>
//                                                 <th className="text-center">Students</th>
//                                                 <th>ASE</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {companyAggregatedData.length === 0 ? (
//                                                 <tr><td colSpan="3" className="text-center text-muted p-4">No data available to aggregate.</td></tr>
//                                             ) : (
//                                                 companyAggregatedData.map((item, index) => (
//                                                     <tr key={index}>
//                                                         <td className="fw-medium">{item.companyName}</td>
//                                                         <td className="text-center">{item.studentCount}</td>
//                                                         <td>{item.ase}</td>
//                                                     </tr>
//                                                 ))
//                                             )}
//                                         </tbody>
//                                     </Table>
//                                 ) : (
//                                     <Table striped bordered hover size="sm">
//                                         <thead className="table-light">
//                                             <tr>
//                                                 {currentSheetConfig?.columns.map(col => <th key={col.field}>{col.header}</th>)}
//                                                 {canEdit && <th className="text-center">Actions</th>}
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {filteredAndCalculatedData.length === 0 ? (
//                                                 <tr><td colSpan={canEdit ? currentSheetConfig.columns.length + 1 : currentSheetConfig.columns.length} className="text-center text-muted p-4">No data available.</td></tr>
//                                             ) : (
//                                                 filteredAndCalculatedData.map(row => (
//                                                     <tr key={row._id}>
//                                                         {currentSheetConfig.columns.map(col => (
//                                                             <td key={col.field}>
//                                                                 {(() => {
//                                                                     if (col.field === 'overallMarks') {
//                                                                         const marksString = row[col.field] || '0 / 20';
//                                                                         const score = parseInt(String(marksString).split('/')[0], 10);
//                                                                         if (!isNaN(score) && score < 0) {
//                                                                             return <strong className="text-danger">{marksString}</strong>;
//                                                                         }
//                                                                         return marksString;
//                                                                     }

//                                                                     if (col.field === 'editHistory') {
//                                                                         const hasHistory = row.createdBy || (row.updatedBy && row.updatedBy.length > 0);
//                                                                         return hasHistory ? (
//                                                                             <Button 
//                                                                                 variant="link" 
//                                                                                 size="sm" 
//                                                                                 className="p-0 text-decoration-none" 
//                                                                                 onClick={() => handleShowHistoryModal(row)}
//                                                                             >
//                                                                                 View
//                                                                             </Button>
//                                                                         ) : <span className="text-muted"></span>;
//                                                                     }
                                                                    
//                                                                     const truncatableColumns = ['techStack', 'remarks', 'studentQuestion', 'studentAnswer', 'interactionRemarks'];
//                                                                     if (truncatableColumns.includes(col.field)) {
//                                                                         return renderTruncatableContent(row[col.field]);
//                                                                     }

//                                                                     if (col.type === 'date') {
//                                                                         return formatDateForDisplay(row[col.field]);
//                                                                     }

//                                                                     if (col.type === 'link' && row[col.field]) {
//                                                                         return <a href={row[col.field]} target="_blank" rel="noopener noreferrer">Link</a>;
//                                                                     }
                                                                    
//                                                                     return row[col.field];
//                                                                 })()}
//                                                             </td>
//                                                         ))}
//                                                         {canEdit && (
//                                                             <td className="text-center">
//                                                                 <Dropdown>
//                                                                     <Dropdown.Toggle as={ActionMenuToggle} id={`actions-dropdown-${row._id}`} />
//                                                                     <Dropdown.Menu align="end">
//                                                                         <Dropdown.Item onClick={() => handleOpenEditModal(row)}>
//                                                                             <i className="fas fa-edit me-2 text-primary"></i> Edit
//                                                                         </Dropdown.Item>
//                                                                         <Dropdown.Item onClick={() => handleOpenDeleteModal(row)} className="text-danger">
//                                                                             <i className="fas fa-trash me-2"></i> Delete
//                                                                         </Dropdown.Item>
//                                                                     </Dropdown.Menu>
//                                                                 </Dropdown>
//                                                             </td>
//                                                         )}
//                                                     </tr>
//                                                 ))
//                                             )}
//                                         </tbody>
//                                     </Table>
//                                 )}
//                             </div>
//                         )}
//                     </Card.Body>
//                 </Card>
//             )}

//             <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="xl" centered dialogClassName={getAddModalClassName()}>
//                 <Modal.Header closeButton>
//                     <Modal.Title>Add to {currentSheetConfig?.title}</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {error && <Alert variant="danger" size="sm" className="py-2">{error}</Alert>}
//                      <div className="table-responsive" style={{ maxHeight: '60vh' }}>
//                         <Table striped bordered size="sm">
//                             <thead>
//                                 <tr>
//                                     {currentSheetConfig?.columns.map(col => !col.readOnly && col.field !== 'editHistory' && <th key={col.field} style={{ minWidth: col.minWidth || '120px' }}>{col.header}</th>)}
//                                     <th style={{ width: '50px' }}>Action</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {newEntriesData.map((row, index) => (
//                                     <tr key={index}>
//                                         {currentSheetConfig?.columns.map((col, colIndex) => !col.readOnly && col.field !== 'editHistory' && (
//                                             <td key={col.field}>
//                                                 {col.type === 'dropdown' ? (
//                                                     <Form.Select size="sm" value={row[col.field] || ''} onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}>
//                                                         <option value="">Select...</option>
//                                                         {(col.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//                                                     </Form.Select>
//                                                 ) : col.type === 'textarea' ? (
//                                                     <Form.Control
//                                                         as="textarea"
//                                                         rows={2}
//                                                         size="sm"
//                                                         value={row[col.field] || ''}
//                                                         onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}
//                                                     />
//                                                 ) : (
//                                                     <Form.Control
//                                                         size="sm"
//                                                         type={col.type === 'link' ? 'text' : (col.type || 'text')}
//                                                         value={row[col.field] || ''}
//                                                         onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}
//                                                         onPaste={colIndex === 0 ? (e) => handlePaste(e, index) : undefined}
//                                                     />
//                                                 )}
//                                             </td>
//                                         ))}
//                                         <td className="text-center">
//                                             <Button variant="outline-danger" size="sm" onClick={() => handleRemoveRowInModal(index)}>
//                                                 <i className="fas fa-trash"></i>
//                                             </Button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </Table>
//                     </div>
//                     <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddRowInModal}>
//                         <i className="fas fa-plus me-1"></i> Add
//                     </Button>
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
//                     <Button variant="primary" onClick={handleCreateMultiple} disabled={actionLoading}>
//                         {actionLoading ? <Spinner size="sm" /> : `Save ${newEntriesData.length} Entr${newEntriesData.length > 1 ? 'ies' : 'y'}`}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
//                 <Modal.Header closeButton>
//                     <Modal.Title>Edit {currentSheetConfig?.title}</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {error && <Alert variant="danger" size="sm" className="py-2">{error}</Alert>}
//                     {editingRecord && (
//                         <Form>
//                             {currentSheetConfig?.columns.map(col => !col.readOnly && col.field !== 'editHistory' && (
//                                 <Form.Group key={col.field} className="mb-3">
//                                     <Form.Label>{col.header}</Form.Label>
//                                     {col.type === 'dropdown' ? (
//                                         <Form.Select value={editingRecord[col.field] || ''} onChange={(e) => handleEditingRecordChange(col.field, e.target.value)}>
//                                             <option value="">Select...</option>
//                                             {(col.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//                                         </Form.Select>
//                                     ) : col.type === 'date' ? (
//                                         <DatePicker 
//                                             selected={editingRecord[col.field] ? new Date(editingRecord[col.field]) : null}
//                                             onChange={date => handleEditingRecordChange(col.field, date)}
//                                             className="form-control"
//                                             dateFormat="MM/dd/yyyy"
//                                         />
//                                     ) : col.type === 'textarea' ? (
//                                         <Form.Control 
//                                             as="textarea"
//                                             rows={4}
//                                             value={editingRecord[col.field] || ''} 
//                                             onChange={(e) => handleEditingRecordChange(col.field, e.target.value)} 
//                                         />
//                                     ) : (
//                                         <Form.Control 
//                                             type={col.type === 'link' ? 'text' : (col.type || 'text')} 
//                                             value={editingRecord[col.field] || ''} 
//                                             onChange={(e) => handleEditingRecordChange(col.field, e.target.value)} 
//                                         />
//                                     )}
//                                 </Form.Group>
//                             ))}
//                         </Form>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
//                     <Button variant="primary" onClick={handleUpdate} disabled={actionLoading}>
//                         {actionLoading ? <Spinner size="sm" /> : 'Save Changes'}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
//                 <Modal.Header closeButton className="bg-danger text-white">
//                     <Modal.Title><i className="fas fa-exclamation-triangle me-2"></i>Confirm Deletion</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     <p>Are you sure you want to permanently delete this entry?</p>
//                     {recordToDelete && <p className="text-muted small"><strong>Details:</strong> {recordToDelete.studentName} ({recordToDelete.companyName})</p>}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>Cancel</Button>
//                     <Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>
//                         {actionLoading ? <Spinner size="sm" /> : 'Delete Entry'}
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <Modal show={showRemarksModal} onHide={handleCloseRemarksModal} centered>
//                 <Modal.Header closeButton>
//                     <Modal.Title>View Full Text</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}>
//                     {remarksModalContent}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={handleCloseRemarksModal}>
//                         Close
//                     </Button>
//                 </Modal.Footer>
//             </Modal>

//             <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="xl">
//                 <Modal.Header closeButton>
//                     <Modal.Title><i className="fas fa-history me-2"></i>Edit History</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {historyModalData && (
//                         <>
//                             <p className="mb-2">
//                                 <strong>Record:</strong> {historyModalData.studentName} ({historyModalData.companyName})
//                             </p>
//                             <Table striped bordered size="sm" responsive>
//                                 <thead className="table-light">
//                                     <tr>
//                                         <th>Action</th>
//                                         <th>User</th>
//                                         <th>Date & Time</th>
//                                         <th>Field Modified</th>
//                                         <th>Previous Value</th>
//                                         <th>Modified Value</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {historyModalData.createdBy && (
//                                         <tr>
//                                             <td>Created</td>
//                                             <td>{historyModalData.createdBy.firstName ? `${historyModalData.createdBy.firstName} ${historyModalData.createdBy.lastName || ''}`.trim() : historyModalData.createdBy.username}</td>
//                                             <td>{formatDateTimeForDisplay(historyModalData.createdAt)}</td>
//                                             <td colSpan="3" className="text-muted text-center">N/A (Initial Record)</td>
//                                         </tr>
//                                     )}
//                                     {(historyModalData.updatedBy || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((edit, editIndex) => (
//                                         <React.Fragment key={editIndex}>
//                                             {(edit.changes && edit.changes.length > 0) ? (
//                                                 edit.changes.map((change, changeIndex) => (
//                                                     <tr key={`${editIndex}-${changeIndex}`}>
//                                                         {changeIndex === 0 && (
//                                                             <>
//                                                                 <td rowSpan={edit.changes.length}>Edited</td>
//                                                                 <td rowSpan={edit.changes.length}>{edit.user ? (edit.user.firstName ? `${edit.user.firstName} ${edit.user.lastName || ''}`.trim() : edit.user.username) : 'Unknown User'}</td>
//                                                                 <td rowSpan={edit.changes.length}>{formatDateTimeForDisplay(edit.timestamp)}</td>
//                                                             </>
//                                                         )}
//                                                         <td><strong>{getFieldName(change.field)}</strong></td>
//                                                         <td style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '200px'}}>{change.from}</td>
//                                                         <td style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '200px'}}>{change.to}</td>
//                                                     </tr>
//                                                 ))
//                                             ) : (
//                                                 <tr key={editIndex}>
//                                                     <td>Edited</td>
//                                                     <td>{edit.user ? (edit.user.firstName ? `${edit.user.firstName} ${edit.user.lastName || ''}`.trim() : edit.user.username) : 'Unknown User'}</td>
//                                                     <td>{formatDateTimeForDisplay(edit.timestamp)}</td>
//                                                     <td colSpan="3" className="text-muted text-center">No field changes were recorded.</td>
//                                                 </tr>
//                                             )}
//                                         </React.Fragment>
//                                     ))}
//                                 </tbody>
//                             </Table>
//                         </>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Close</Button>
//                 </Modal.Footer>
//             </Modal>
            
//             <style type="text/css">
//                 {`
//                     .ase-ratings-modal .modal-dialog {
//                         max-width: 95vw; 
//                     }
//                     .nav-tabs {
//                         border-bottom: 1px solid #dee2e6;
//                     }
//                     .nav-tabs .nav-link {
//                         margin-bottom: -1px;
//                         background: none;
//                         font-size: 0.9rem;
//                         font-weight: 500;
//                         transition: color 0.15s ease-in-out;
//                         border-radius: 0;
//                     }
//                     .nav-tabs .nav-link:hover:not(.active) {
//                         color: #495057;
//                         border-color: transparent;
//                     }
//                     .nav-tabs .nav-link.active {
//                         font-weight: 600;
//                     }
//                     @media (min-width: 1400px) {
//                         .ase-ratings-modal .modal-dialog {
//                             max-width: 1350px;
//                         }
//                     }
//                     /* For Dropdown menu styling */
//                     .no-caret::after {
//                         display: none;
//                     }
//                 `}
//             </style>
//         </div>
//     );
// };

// export default StudentsTrackerPage;




// client/src/pages/StudentsTrackerPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Nav, Card, Alert, Spinner, Button, Modal, Form, Table, InputGroup, Dropdown } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import studentsTrackerService from '../services/studentsTrackerService.js';
import { sheetConfig, ratingCalculations, aggregateAssignmentMarks, calculateCompanyClosingScore } from '../utils/studentsTrackerConfig.js';
import Papa from 'papaparse';
import CompanyInteractionAdminView from '../components/students-tracker/CompanyInteractionAdminView.jsx';
import useAuth from '../hooks/useAuth.js';

const ActionMenuToggle = React.forwardRef(({ onClick }, ref) => (
    <Button
      variant="link"
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className="p-1 text-muted no-caret"
      title="Actions"
    >
      <i className="fas fa-ellipsis-v"></i>
    </Button>
));
ActionMenuToggle.displayName = 'ActionMenuToggle';

const StudentsTrackerPage = () => {
    const { user } = useAuth();

    if ((user.role === 'instructor' || user.role === 'crm') && !user.canAccessStudentsTracker) {
        return <Navigate to="/not-authorized" replace />;
    }

    const canEdit = user.role === 'admin' || user.role === 'instructor' || user.role === 'crm';

    const [activeTab, setActiveTab] = useState('aseRatings');
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [viewMode, setViewMode] = useState('students');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEntriesData, setNewEntriesData] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [remarksModalContent, setRemarksModalContent] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyModalData, setHistoryModalData] = useState(null);

    const currentSheetConfig = useMemo(() => sheetConfig[activeTab], [activeTab]);

    const fetchDataForTab = useCallback(async (tabKey) => {
        if (tabKey === 'companyInteractionTracking') {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            const service = studentsTrackerService[tabKey];
            if (!service) throw new Error(`Service for tab "${tabKey}" not found.`);
            const response = await service.getAll();
            setData(prev => ({ ...prev, [tabKey]: response.data || [] }));
        } catch (err) {
            setError(`Failed to load data for ${currentSheetConfig?.title || tabKey}.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentSheetConfig]);

    useEffect(() => {
        fetchDataForTab(activeTab);
    }, [activeTab, fetchDataForTab]);
    
    useEffect(() => {
        if (activeTab !== 'aseRatings') {
            setViewMode('students');
        }
        setSearchTerm('');
    }, [activeTab]);

    const handleShowRemarksModal = (remarks) => {
        setRemarksModalContent(remarks);
        setShowRemarksModal(true);
    };

    const handleCloseRemarksModal = () => {
        setShowRemarksModal(false);
        setRemarksModalContent('');
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-US'); 
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const formatDateTimeForDisplay = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };
    
    const handleShowHistoryModal = (row) => {
        setHistoryModalData(row);
        setShowHistoryModal(true);
    };
    
    const handlePaste = (e, startingIndex) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const rows = pasteData.split(/[\r\n]+/).filter(row => row.trim() !== '');
        const formFields = currentSheetConfig.columns.filter(c => !c.readOnly).map(c => c.field);
    
        setNewEntriesData(prev => {
            let dataCopy = [...prev];
    
            rows.forEach((row, rowIndex) => {
                const values = row.split('\t');
                const currentRowIndex = startingIndex + rowIndex;
    
                if (currentRowIndex >= dataCopy.length) {
                    dataCopy.push(currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {}));
                }
    
                values.forEach((value, colIndex) => {
                    if (colIndex < formFields.length) {
                        const fieldName = formFields[colIndex];
                        dataCopy[currentRowIndex][fieldName] = value.trim();
                    }
                });
            });
    
            return dataCopy;
        });
    };
    
    const handleDelete = async (recordId) => {
        if (!recordId) return;
        setActionLoading(true);
        setError('');
        try {
            await studentsTrackerService[activeTab].remove(recordId);
            fetchDataForTab(activeTab); 
        } catch (err) => {
            setError('Failed to delete entry.');
        } finally {
            setActionLoading(false);
            setRecordToDelete(null); 
            setShowDeleteModal(false); 
        }
    };
    
    const handleOpenDeleteModal = (record) => {
        setRecordToDelete(record);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (recordToDelete) {
            handleDelete(recordToDelete._id);
_id);
        }
    };
    
    const handleOpenAddModal = () => {
        const newRow = currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {});
        setNewEntriesData([newRow]);
        setShowAddModal(true);
        setError('');
    };

    const handleAddRowInModal = () => {
        const newRow = currentSheetConfig.columns.reduce((acc, col) => ({ ...acc, [col.field]: '' }), {});
        setNewEntriesData(prev => [...prev, newRow]);
    };

    const handleRemoveRowInModal = (indexToRemove) => {
        setNewEntriesData(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleNewEntryChange = (index, field, value) => {
        setNewEntriesData(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };
    
    const handleCreateMultiple = async () => {
        const validData = newEntriesData.filter(row => 
            Object.values(row).some(val => val && val.toString().trim() !== '')
        );
        if (validData.length === 0) {
            setError("Cannot submit empty entries."); return;
        }
        setActionLoading(true);
        setError('');
        try {
            await studentsTrackerService[activeTab].create(validData);
            setShowAddModal(false);
            fetchDataForTab(activeTab);
        } catch(err) { setError('Failed to create entries.'); }
        finally { setActionLoading(false); }
    };

    const handleOpenEditModal = (record) => {
        setEditingRecord(record);
        setShowEditModal(true);
        setError('');
    };

    const handleEditingRecordChange = (field, value) => {
        setEditingRecord(prev => ({...prev, [field]: value}));
    };
    
    const handleUpdate = async () => {
        if (!editingRecord) return;
        setActionLoading(true);
        setError('');
        try {
            await studentsTrackerService[activeTab].update(editingRecord._id, editingRecord);
            setShowEditModal(false);
            fetchDataForTab(activeTab);
        } catch(err) { setError(`Failed to update entry.`); }
        finally { setActionLoading(false); }
    };
    
    const calculatedData = useMemo(() => {
        const currentData = data[activeTab] || [];
        if (activeTab === 'assignmentRatings') {
            return aggregateAssignmentMarks(currentData);
        }
        if (activeTab === 'companyClosings') {
            return calculateCompanyClosingScore(currentData);
        }
        return currentData.map(row => ({
            ...row,
            overallMarks: ratingCalculations[activeTab] ? ratingCalculations[activeTab](row) : 'N/A'
        }));
    }, [data, activeTab]);

    const companyAggregatedData = useMemo(() => {
        if (activeTab !== 'aseRatings' || !data.aseRatings) {
            return [];
        }
        
        const aggregationMap = new Map();
        const aseRatingsData = data.aseRatings || [];

        aseRatingsData.forEach(record => {
            const key = `${record.companyName}|${record.ase || 'N/A'}`;
            if (!aggregationMap.has(key)) {
                aggregationMap.set(key, {
                    companyName: record.companyName,
                    ase: record.ase || 'N/A',
                    studentCount: 0
                });
            }
            aggregationMap.get(key).studentCount += 1;
        });

        return Array.from(aggregationMap.values()).sort((a,b) => a.companyName.localeCompare(b.companyName) || a.ase.localeCompare(b.ase));
    }, [data, activeTab]);

    const filteredAndCalculatedData = useMemo(() => {
        if (!searchTerm) {
            return calculatedData;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        return calculatedData.filter(row => 
            Object.values(row).some(value => 
                String(value).toLowerCase().includes(lowerCaseSearch)
            )
        );
    }, [calculatedData, searchTerm]);

    const handleExportCSV = () => {
        if (filteredAndCalculatedData.length === 0) {
            alert("No data to export.");
            return;
        }
        
        const dataToExport = filteredAndCalculatedData.map(row => {
            const rowData = {};
            currentSheetConfig.columns.forEach(col => {
                rowData[col.header] = row[col.field];
            });
            return rowData;
        });

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${activeTab}_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getAddModalClassName = () => {
        return activeTab === 'aseRatings' ? 'ase-ratings-modal' : '';
    };

    const renderTruncatableContent = (text) => {
        const maxLength = 40;
        if (typeof text !== 'string' || text.length <= maxLength) {
            return text;
        }
        return (
            <span>
                {text.substring(0, maxLength)}...
                <Button variant="link" size="sm" className="p-0 ms-1" onClick={() => handleShowRemarksModal(text)}>
                    More
                </Button>
            </span>
        );
    };
    
    const getFieldName = (fieldKey) => {
        const columnConfig = currentSheetConfig?.columns.find(c => c.field === fieldKey);
        if (columnConfig?.header) {
            return columnConfig.header;
        }
        const result = fieldKey.replace(/([A-Z])/g, ' $1');
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    return (
        <div>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            <div className="mb-3">
               <Nav className="nav-tabs border-bottom-0 bg-transparent" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'aseRatings')}>
                   {Object.entries(sheetConfig).map(([key, config]) => (
                       <Nav.Item key={key}>
                           <Nav.Link 
                               eventKey={key} 
                               className={`px-4 py-2 border-0 bg-transparent ${activeTab === key ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
                           >
                               {config.title}
                           </Nav.Link>
                       </Nav.Item>
                   ))}
                   <Nav.Item>
                       <Nav.Link 
                           eventKey="companyInteractionTracking"
                           className={`px-4 py-2 border-0 bg-transparent ${activeTab === 'companyInteractionTracking' ? 'text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
                        >
                           Interaction Tracking
                        </Nav.Link>
                   </Nav.Item>
               </Nav>
           </div>

            {activeTab === 'companyInteractionTracking' ? (
                <CompanyInteractionAdminView onUpdate={fetchDataForTab} user={user} />
            ) : (
                <Card className="shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-light flex-wrap gap-2">
                        <h5 className="mb-0">{currentSheetConfig?.title}</h5>
                        <div className="d-flex align-items-center">
                            {activeTab === 'aseRatings' && (
                                <div className="d-flex align-items-center me-3">
                                    <div className="btn-group btn-group-sm" role="group" aria-label="View toggle">
                                        <Button variant={viewMode === 'companies' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('companies')} title="Company View">
                                            <i className="fas fa-building"></i>
                                        </Button>
                                        <Button variant={viewMode === 'students' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('students')} title="Student View">
                                            <i className="fas fa-users"></i>
                                        </Button>
                                    </div>
                                </div>
                            )}
                             <div className="d-flex align-items-center gap-2">
                                <InputGroup size="sm" style={{ width: '250px' }}>
                                    <Form.Control 
                                        placeholder="Search this sheet..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && 
                                        <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                                            <i className="fas fa-times"></i>
                                        </Button>
                                    }
                                </InputGroup>
                                <Button variant="outline-success" size="sm" onClick={handleExportCSV}>
                                    <i className="fas fa-file-csv me-2"></i>Export
                                </Button>
                                {canEdit && (
                                    <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                                        <i className="fas fa-plus me-2"></i>Add Entries
                                    </Button>
                                )}
                             </div>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center p-5"><Spinner /></div>
                        ) : (
                            <div className="table-responsive">
                                 {activeTab === 'aseRatings' && viewMode === 'companies' ? (
                                    <Table striped bordered hover size="sm">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Company</th>
                                                <th className="text-center">Students</th>
                                                <th>ASE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {companyAggregatedData.length === 0 ? (
                                                <tr><td colSpan="3" className="text-center text-muted p-4">No data available to aggregate.</td></tr>
                                            ) : (
                                                companyAggregatedData.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="fw-medium">{item.companyName}</td>
                                                        <td className="text-center">{item.studentCount}</td>
                                                        <td>{item.ase}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <Table striped bordered hover size="sm">
                                        <thead className="table-light">
                                            <tr>
                                                {currentSheetConfig?.columns.map(col => <th key={col.field}>{col.header}</th>)}
                                                {canEdit && <th className="text-center">Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndCalculatedData.length === 0 ? (
                                                <tr><td colSpan={canEdit ? currentSheetConfig.columns.length + 1 : currentSheetConfig.columns.length} className="text-center text-muted p-4">No data available.</td></tr>
                                            ) : (
                                                filteredAndCalculatedData.map(row => (
                                                    <tr key={row._id}>
                                                        {currentSheetConfig.columns.map(col => (
                                                            <td key={col.field}>
                                                                {(() => {
                                                                    if (col.field === 'overallMarks') {
                                                                        const marksString = row[col.field] || '0 / 20';
                                                                        const score = parseInt(String(marksString).split('/')[0], 10);
                                                                        if (!isNaN(score) && score < 0) {
                                                                            return <strong className="text-danger">{marksString}</strong>;
                                                                        }
                                                                        return marksString;
                                                                    }

                                                                    if (col.field === 'editHistory') {
                                                                        const hasHistory = row.createdBy || (row.updatedBy && row.updatedBy.length > 0);
                                                                        return hasHistory ? (
                                                                            <Button 
                                                                                variant="link" 
                                                                                size="sm" 
                                                                                className="p-0 text-decoration-none" 
                                                                                onClick={() => handleShowHistoryModal(row)}
                                                                            >
                                                                                View
                                                                            </Button>
                                                                        ) : <span className="text-muted"></span>;
                                                                    }
                                                                    
                                                                    const truncatableColumns = ['techStack', 'remarks', 'studentQuestion', 'studentAnswer', 'interactionRemarks'];
                                                                    if (truncatableColumns.includes(col.field)) {
                                                                        return renderTruncatableContent(row[col.field]);
                                                                    }

                                                                    if (col.type === 'date') {
                                                                        return formatDateForDisplay(row[col.field]);
                                                                    }

                                                                    if (col.type === 'link' && row[col.field]) {
                                                                        return <a href={row[col.field]} target="_blank" rel="noopener noreferrer">Link</a>;
                                                                    }
                                                                    
                                                                    return row[col.field];
                                                                })()}
                                                            </td>
                                                        ))}
                                                        {canEdit && (
                                                            <td className="text-center">
                                                                <Dropdown>
                                                                    <Dropdown.Toggle as={ActionMenuToggle} id={`actions-dropdown-${row._id}`} />
                                                                    <Dropdown.Menu align="end">
                                                                        <Dropdown.Item onClick={() => handleOpenEditModal(row)}>
                                                                            <i className="fas fa-edit me-2 text-primary"></i> Edit
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item onClick={() => handleOpenDeleteModal(row)} className="text-danger">
                                                                            <i className="fas fa-trash me-2"></i> Delete
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                )}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}

            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="xl" centered dialogClassName={getAddModalClassName()}>
                <Modal.Header closeButton>
                    <Modal.Title>Add to {currentSheetConfig?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger" size="sm" className="py-2">{error}</Alert>}
                     <div className="table-responsive" style={{ maxHeight: '70vh' }}>
                        <Table striped bordered size="sm">
                            <thead>
                                <tr>
                                    {currentSheetConfig?.columns.map(col => !col.readOnly && col.field !== 'editHistory' && <th key={col.field} style={{ minWidth: col.minWidth || '120px' }}>{col.header}</th>)}
                                    <th style={{ width: '50px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newEntriesData.map((row, index) => (
                                    <tr key={index}>
                                        {currentSheetConfig?.columns.map((col, colIndex) => !col.readOnly && col.field !== 'editHistory' && (
                                            <td key={col.field}>
                                                {col.type === 'dropdown' ? (
                                                    <Form.Select size="sm" value={row[col.field] || ''} onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}>
                                                        <option value="">Select...</option>
                                                        {(col.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </Form.Select>
                                                ) : col.type === 'textarea' ? (
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        size="sm"
                                                        value={row[col.field] || ''}
                                                        onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}
                                                    />
                                                ) : (
                                                    <Form.Control
                                                        size="sm"
                                                        type={col.type === 'link' ? 'text' : (col.type || 'text')}
                                                        value={row[col.field] || ''}
                                                        onChange={(e) => handleNewEntryChange(index, col.field, e.target.value)}
                                                        onPaste={colIndex === 0 ? (e) => handlePaste(e, index) : undefined}
                                                    />
                                                )}
                                            </td>
                                        ))}
                                        <td className="text-center">
                                            <Button variant="outline-danger" size="sm" onClick={() => handleRemoveRowInModal(index)}>
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                    <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddRowInModal}>
                        <i className="fas fa-plus me-1"></i> Add
                    </Button>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreateMultiple} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" /> : `Save ${newEntriesData.length} Entr${newEntriesData.length > 1 ? 'ies' : 'y'}`}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit {currentSheetConfig?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger" size="sm" className="py-2">{error}</Alert>}
                    {editingRecord && (
                        <Form>
                            {currentSheetConfig?.columns.map(col => !col.readOnly && col.field !== 'editHistory' && (
                                <Form.Group key={col.field} className="mb-3">
                                    <Form.Label>{col.header}</Form.Label>
                                    {col.type === 'dropdown' ? (
                                        <Form.Select value={editingRecord[col.field] || ''} onChange={(e) => handleEditingRecordChange(col.field, e.target.value)}>
                                            <option value="">Select...</option>
                                            {(col.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </Form.Select>
                                    ) : col.type === 'date' ? (
                                        <DatePicker 
                                            selected={editingRecord[col.field] ? new Date(editingRecord[col.field]) : null}
                                            onChange={date => handleEditingRecordChange(col.field, date)}
                                            className="form-control"
                                            dateFormat="MM/dd/yyyy"
                                        />
                                    ) : col.type === 'textarea' ? (
                                        <Form.Control 
                                            as="textarea"
                                            rows={4}
                                            value={editingRecord[col.field] || ''} 
                                            onChange={(e) => handleEditingRecordChange(col.field, e.target.value)} 
                                        />
                                    ) : (
                                        <Form.Control 
                                            type={col.type === 'link' ? 'text' : (col.type || 'text')} 
                                            value={editingRecord[col.field] || ''} 
                                            onChange={(e) => handleEditingRecordChange(col.field, e.target.value)} 
                                        />
                                    )}
                                </Form.Group>
                            ))}
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleUpdate} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" /> : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title><i className="fas fa-exclamation-triangle me-2"></i>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to permanently delete this entry?</p>
                    {recordToDelete && <p className="text-muted small"><strong>Details:</strong> {recordToDelete.studentName} ({recordToDelete.companyName})</p>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>Cancel</Button>
                    <Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>
                        {actionLoading ? <Spinner size="sm" /> : 'Delete Entry'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            <Modal show={showRemarksModal} onHide={handleCloseRemarksModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>View Full Text</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}>
                    {remarksModalContent}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseRemarksModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="xl">
                <Modal.Header closeButton>
                    <Modal.Title><i className="fas fa-history me-2"></i>Edit History</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {historyModalData && (
                        <>
                            <p className="mb-2">
                                <strong>Record:</strong> {historyModalData.studentName} ({historyModalData.companyName})
                            </p>
                            <Table striped bordered size="sm" responsive>
                                <thead className="table-light">
                                    <tr>
                                        <th>Action</th>
                                        <th>User</th>
                                        <th>Date & Time</th>
                                        <th>Field Modified</th>
                                        <th>Previous Value</th>
                                        <th>Modified Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyModalData.createdBy && (
                                        <tr>
                                            <td>Created</td>
                                            <td>{historyModalData.createdBy.firstName ? `${historyModalData.createdBy.firstName} ${historyModalData.createdBy.lastName || ''}`.trim() : historyModalData.createdBy.username}</td>
                                            <td>{formatDateTimeForDisplay(historyModalData.createdAt)}</td>
                                            <td colSpan="3" className="text-muted text-center">N/A (Initial Record)</td>
                                        </tr>
                                    )}
                                    {(historyModalData.updatedBy || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((edit, editIndex) => (
                                        <React.Fragment key={editIndex}>
                                            {(edit.changes && edit.changes.length > 0) ? (
                                                edit.changes.map((change, changeIndex) => (
                                                    <tr key={`${editIndex}-${changeIndex}`}>
                                                        {changeIndex === 0 && (
                                                            <>
                                                                <td rowSpan={edit.changes.length}>Edited</td>
                                                                <td rowSpan={edit.changes.length}>{edit.user ? (edit.user.firstName ? `${edit.user.firstName} ${edit.user.lastName || ''}`.trim() : edit.user.username) : 'Unknown User'}</td>
                                                                <td rowSpan={edit.changes.length}>{formatDateTimeForDisplay(edit.timestamp)}</td>
                                                            </>
                                                        )}
                                                        <td><strong>{getFieldName(change.field)}</strong></td>
                                                        <td style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '200px'}}>{change.from}</td>
                                                        <td style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '200px'}}>{change.to}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr key={editIndex}>
                                                    <td>Edited</td>
                                                    <td>{edit.user ? (edit.user.firstName ? `${edit.user.firstName} ${edit.user.lastName || ''}`.trim() : edit.user.username) : 'Unknown User'}</td>
                                                    <td>{formatDateTimeForDisplay(edit.timestamp)}</td>
                                                    <td colSpan="3" className="text-muted text-center">No field changes were recorded.</td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
            
            <style type="text/css">
                {`
                    .ase-ratings-modal .modal-dialog {
                        max-width: 95vw;
                    }
                    .ase-ratings-modal .modal-body {
                        max-height: 80vh;
                    }
                    .nav-tabs {
                        border-bottom: 1px solid #dee2e6;
                    }
                    .nav-tabs .nav-link {
                        margin-bottom: -1px;
                        background: none;
                        font-size: 0.9rem;
                        font-weight: 500;
                        transition: color 0.15s ease-in-out;
                        border-radius: 0;
                    }
                    .nav-tabs .nav-link:hover:not(.active) {
                        color: #495057;
                        border-color: transparent;
                    }
                    .nav-tabs .nav-link.active {
                        font-weight: 600;
                    }
                    @media (min-width: 1400px) {
                        .ase-ratings-modal .modal-dialog {
                            max-width: 1350px;
                        }
                    }
                    /* For Dropdown menu styling */
                    .no-caret::after {
                        display: none;
                    }
                `}
            </style>
        </div>
    );
};

export default StudentsTrackerPage;
