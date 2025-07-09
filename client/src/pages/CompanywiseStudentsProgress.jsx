// File Path: src/pages/CompanywiseStudentsProgress.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Form, Button, Row, Col, InputGroup, Spinner, Alert, Table, Modal, Dropdown } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Papa from 'papaparse';
import internshipsTrackerService from '../services/internshipsTrackerService.js';
import * as techStackService from '../services/techStackService.js';
import EditableTable from '../components/EditableTable/EditableTable.jsx';
import TechStackDropdown from '../components/TechStackDropdown/TechStackDropdown.jsx'; 
import statsService from '../services/statsService.js';
import useAuth from '../hooks/useAuth';

const CompanywiseStudentsProgress = ({ user }) => {
    // Main data state
    const [savedData, setSavedData] = useState([]);
    const [techStackOptions, setTechStackOptions] = useState([]);
    const [techStackProgressMap, setTechStackProgressMap] = useState(new Map());
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Form states
    const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
    const [editingItemId, setEditingItemId] = useState(null);
    const idCounter = useRef(Date.now());
    
    // CSV upload states
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvError, setCsvError] = useState('');
    const [uploadingCsv, setUploadingCsv] = useState(false);
    const fileInputRef = useRef(null);
    
    // Add/Edit Form state
    const initialFormState = {
        companyName: '',
        roleName: '',
        noOfOffers: 1,
        roleDeadline: null,
        selectedTechStacks: [],
        students: [{
            id: idCounter.current++,
            niatId: '',
            studentName: '',
            techAssignments: []
        }]
    };
    
    const [formData, setFormData] = useState(initialFormState);
    
    // Delete state
    const [rowToDeleteId, setRowToDeleteId] = useState(null);
    
    const isAdmin = user && user.role === 'admin';

    // Fetch data functions
    const fetchSavedData = useCallback(async () => {
        setLoading(true);
        try {
            const savedDataRes = await internshipsTrackerService.getSheetData('companywise-students-progress');
            setSavedData(savedDataRes.data || []);
        } catch (err) {
            setError('Failed to load saved progress data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDependencies = useCallback(async () => {
        setLoading(true);
        try {
            const [techStacksRes, timelineStatsRes] = await Promise.all([
                techStackService.getAllTechStacks(),
                statsService.getTimelineStats()
            ]);
            await fetchSavedData();
            setTechStackOptions(techStacksRes.data || []);
            
            if (timelineStatsRes && timelineStatsRes.techStackProgress) {
                const progressMap = new Map();
                timelineStatsRes.techStackProgress.forEach(ts => {
                    progressMap.set(ts.name, ts.completionPercentage);
                });
                setTechStackProgressMap(progressMap);
            }
        } catch (err) {
            setError('Failed to load initial data.');
        } finally {
            setLoading(false);
        }
    }, [fetchSavedData]);

    // Load data on component mount
    useEffect(() => {
        fetchDependencies();
        setCurrentPage(1); // Reset page on data load
    }, [fetchDependencies]);
    
    const handleSaveTableRow = async (id, dataToUpdate) => {
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            await internshipsTrackerService.updateSheetRow(
                'companywise-students-progress',
                id,
                dataToUpdate
            );
            await fetchSavedData(); // Refresh the data to show changes
            setSuccess('Row updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError("Failed to update row: " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    // Modal handlers
    const handleOpenAddModal = () => {
        setFormData(initialFormState);
        setFormMode('add');
        setShowAddEditModal(true);
    };
    
    const handleOpenEditModal = (item) => {
        const students = [];
        
        const student = {
            id: idCounter.current++,
            niatId: item.niatId || '',
            studentName: item.studentName || '',
            techAssignments: item.techAssignments?.map(ta => ({
                techStackName: ta.techStackName,
                deadline: ta.deadline
            })) || []
        };
        
        students.push(student);
        
        setFormData({
            companyName: item.companyName || '',
            roleName: item.roleName || '',
            noOfOffers: item.noOfOffers || 1,
            roleDeadline: item.roleDeadline,
            selectedTechStacks: item.techAssignments?.map(ta => ta.techStackName) || [],
            students
        });
        
        setEditingItemId(item._id);
        setFormMode('edit');
        setShowAddEditModal(true);
    };
    
    const handleOpenUploadModal = () => {
        setCsvData([]);
        setCsvHeaders([]);
        setCsvError('');
        setCsvFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        setShowUploadModal(true);
    };
    
    const handleOpenDeleteModal = (id) => {
        setRowToDeleteId(id);
        setShowDeleteModal(true);
    };
    
    // Form handlers
    const handleFormInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleTechStackSelection = (selectedNames) => {
        setFormData(prev => {
            const newStudents = prev.students.map(student => ({
                ...student,
                techAssignments: selectedNames.map(name => {
                    const existing = student.techAssignments.find(a => a.techStackName === name);
                    return existing || { techStackName: name, deadline: null };
                })
            }));
            
            return { 
                ...prev, 
                selectedTechStacks: selectedNames, 
                students: newStudents 
            };
        });
    };
    
    const handleAddStudent = () => {
        const techAssignments = formData.selectedTechStacks.map(name => ({ 
            techStackName: name, 
            deadline: null 
        }));
        
        setFormData(prev => ({
            ...prev,
            students: [
                ...prev.students, 
                { 
                    id: idCounter.current++, 
                    niatId: '', 
                    studentName: '', 
                    techAssignments 
                }
            ]
        }));
    };
    
    const handleRemoveStudent = (studentId) => {
        if (formData.students.length <= 1) return;
        
        setFormData(prev => ({
            ...prev,
            students: prev.students.filter(s => s.id !== studentId)
        }));
    };
    
    const handleStudentChange = (studentId, field, value) => {
        setFormData(prev => ({
            ...prev,
            students: prev.students.map(s => 
                s.id === studentId ? { ...s, [field]: value } : s
            )
        }));
    };
    
    const handleStudentTechDeadlineChange = (studentId, techStackName, deadline) => {
        setFormData(prev => ({
            ...prev,
            students: prev.students.map(s => 
                s.id === studentId ? {
                    ...s,
                    techAssignments: s.techAssignments.map(a => 
                        a.techStackName === techStackName ? { ...a, deadline } : a
                    )
                } : s
            )
        }));
    };
    
    const handleStudentPaste = (e, startStudentIndex) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const rows = pasteData.split('\n').filter(r => r.trim());

        setFormData(prev => {
            const newStudents = [...prev.students];

            rows.forEach((row, rowIndex) => {
                const studentIndex = startStudentIndex + rowIndex;
                const columns = row.split('\t'); 
                
                if (studentIndex < newStudents.length) {
                    if (columns.length > 0) newStudents[studentIndex].niatId = columns[0] || '';
                    if (columns.length > 1) newStudents[studentIndex].studentName = columns[1] || '';
                }
            });
            
            return { ...prev, students: newStudents };
        });
    };
    
    const handleSaveForm = async () => {
        if (!formData.companyName.trim()) { setError("Company name is required."); return; }
        if (!formData.roleName.trim()) { setError("Role name is required."); return; }
        if (formData.selectedTechStacks.length === 0) { setError("At least one tech stack must be selected."); return; }
        const hasStudentData = formData.students.some(s => s.niatId.trim() || s.studentName.trim());
        if (!hasStudentData) { setError("At least one student must have data."); return; }
        
        setActionLoading(true);
        setError('');
        
        try {
            const dataToSave = formData.students
                .filter(student => student.niatId.trim() || student.studentName.trim())
                .map(student => ({
                    companyName: formData.companyName,
                    roleName: formData.roleName,
                    noOfOffers: formData.noOfOffers,
                    roleDeadline: formData.roleDeadline,
                    niatId: student.niatId,
                    studentName: student.studentName,
                    techAssignments: student.techAssignments,
                    completionStatus: "In Progress"
                }));
            
            if (formMode === 'add') {
                await internshipsTrackerService.bulkUploadSheetData('companywise-students-progress', dataToSave);
                setSuccess("Data added successfully!");
            } else {
                if (editingItemId) {
                    await internshipsTrackerService.updateSheetRow(
                        'companywise-students-progress', 
                        editingItemId, 
                        dataToSave[0]
                    );
                    setSuccess("Data updated successfully!");
                }
            }
            
            await fetchSavedData();
            setShowAddEditModal(false);
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to save data: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!rowToDeleteId) return;
        
        setActionLoading(true);
        setError('');
        
        try {
            await internshipsTrackerService.deleteSheetRow('companywise-students-progress', rowToDeleteId);
            setShowDeleteModal(false);
            await fetchSavedData();
            setSuccess("Data deleted successfully!");
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError("Failed to delete row: " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
            setRowToDeleteId(null);
        }
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
            setCsvError('');
            Papa.parse(file, {
                header: true, skipEmptyLines: true,
                complete: (results) => {
                    setCsvHeaders(results.meta.fields || []); setCsvData(results.data);
                },
                error: (err) => setCsvError('Failed to parse CSV file: ' + err.message)
            });
        } else {
            setCsvFile(null); setCsvData([]); setCsvHeaders([]);
            setCsvError('Please upload a valid CSV file.');
        }
    };
    
    const handleSaveCsvData = async () => {
        if (!csvData.length) return;
        
        setUploadingCsv(true); setCsvError('');
        
        try {
            await internshipsTrackerService.bulkUploadSheetData('companywise-students-progress', csvData);
            await fetchSavedData();
            setShowUploadModal(false);
            setSuccess("CSV data uploaded successfully!");
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setCsvError('Upload failed: ' + (err.response?.data?.error || err.message));
        } finally { setUploadingCsv(false); }
    };
    
    const handleExportCSV = () => {
        if (tableData.length === 0) { alert("No data to export."); return; }
        
        const exportData = tableData.map(item => {
            const row = {
                "Company Name": item.companyName, "Role Name": item.roleName,
                "Role Deadline": item.roleDeadline ? new Date(item.roleDeadline).toLocaleDateString() : '',
                "Offers": item.noOfOffers, "NIAT ID": item.niatId, "Student Name": item.studentName,
                "Completion Status": item.completionStatus
            };
            
            const techStacks = savedData.find(d => d._id === item._id)?.techAssignments || [];
            techStacks.forEach((tech, i) => {
                row[`Tech Stack ${i+1}`] = tech.techStackName;
                row[`Tech Stack ${i+1} Deadline`] = tech.deadline ? new Date(tech.deadline).toLocaleDateString() : '';
                row[`Tech Stack ${i+1} Progress`] = `${techStackProgressMap.get(tech.techStackName) || 0}%`;
            });
            return row;
        });
        
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Student_Progress.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const finalTableColumns = useMemo(() => {
        const base = [
            { header: 'Company Name', field: 'companyName' }, { header: 'Role Name', field: 'roleName' }, 
            { header: 'Role Deadline', field: 'roleDeadline', type: 'date' }, { header: 'Offers', field: 'noOfOffers', type: 'number' }, 
            { header: 'NIAT ID', field: 'niatId' }, { header: 'Student Name', field: 'studentName' }
        ];
        
        const end = [{ header: 'Completion', field: 'completionStatus' }];
        const maxTech = savedData.reduce((max, item) => Math.max(max, item.techAssignments?.length || 0), 0);
        
        const dynamic = [];
        for (let i = 1; i <= maxTech; i++) {
            dynamic.push({ header: `T${i}`, field: `techStack${i}Name` });
            dynamic.push({ header: `T${i} %`, field: `techStack${i}Progress`, type: 'progress' });
            dynamic.push({ header: `T${i} End`, field: `techStack${i}Deadline`, type: 'date' });
        }
        return [...base, ...dynamic, ...end];
    }, [savedData]);
    
    const tableData = useMemo(() => {
        if (!savedData) return [];
        
        return savedData.map(item => {
            let status = item.completionStatus || 'In Progress';
            if (item.techAssignments && item.techAssignments.length > 0) {
                const allDone = item.techAssignments.every(a => techStackProgressMap.get(a.techStackName) >= 100);
                if (allDone) { status = 'Completed'; } else if (status === 'Completed') { status = 'In Progress'; }
            }
            
            const flatItem = {
                _id: item._id, companyName: item.companyName, roleName: item.roleName, 
                roleDeadline: item.roleDeadline, noOfOffers: item.noOfOffers, 
                niatId: item.niatId, studentName: item.studentName, completionStatus: status,
            };
            
            (item.techAssignments || []).forEach((a, i) => {
                flatItem[`techStack${i + 1}Name`] = a.techStackName;
                flatItem[`techStack${i + 1}Deadline`] = a.deadline;
                flatItem[`techStack${i + 1}Progress`] = techStackProgressMap.get(a.techStackName) ?? null;
            });
            return flatItem;
        });
    }, [savedData, techStackProgressMap]);

    // --- START: CORRECTED SEARCH LOGIC ---
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return tableData;
        
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        return tableData.filter(item => {
            // Check fixed fields first for performance
            const hasMatchInFixedFields =
                (item.companyName && String(item.companyName).toLowerCase().includes(lowerSearchTerm)) ||
                (item.roleName && String(item.roleName).toLowerCase().includes(lowerSearchTerm)) ||
                (item.niatId && String(item.niatId).toLowerCase().includes(lowerSearchTerm)) ||
                (item.studentName && String(item.studentName).toLowerCase().includes(lowerSearchTerm)) ||
                (item.completionStatus && String(item.completionStatus).toLowerCase().includes(lowerSearchTerm));

            if (hasMatchInFixedFields) return true;

            // If no match in fixed fields, check the dynamic tech stack names
            for (const key in item) {
                // Search in keys that represent a tech stack's name, e.g., 'techStack1Name', 'techStack2Name'
                if (key.startsWith('techStack') && key.endsWith('Name')) {
                    const value = item[key];
                    if (value && String(value).toLowerCase().includes(lowerSearchTerm)) {
                        return true; // Found a match in a tech stack name
                    }
                }
            }

            return false; // No match found
        });
    }, [tableData, searchTerm]);
    // --- END: CORRECTED SEARCH LOGIC ---

    const paginatedData = useMemo(() => {
        if (loading) return [];
        
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage, loading]);
    
    const PaginationControls = () => {
        const totalRows = filteredData.length;
        if (totalRows === 0) return null;
    
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    
        const handleRowsPerPageChange = (e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
        };
    
        const handlePageChange = (page) => {
            if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
            }
        };
    
        const renderPageNumbers = () => {
            const pageNumbers = [];
            let startPage, endPage;
            
            if (totalPages <= 5) {
                startPage = 1;
                endPage = totalPages;
            } else {
                if (currentPage <= 3) { 
                    startPage = 1;
                    endPage = 5;
                } else if (currentPage + 2 >= totalPages) {
                    startPage = totalPages - 4;
                    endPage = totalPages;
                } else {
                    startPage = currentPage - 2;
                    endPage = currentPage + 2;
                }
            }
            
            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(
                    <Button key={i} variant={currentPage === i ? 'primary' : 'outline-secondary'} size="sm" onClick={() => handlePageChange(i)} className="mx-1" style={{minWidth: '38px'}} >
                        {i}
                    </Button>
                );
            }
            return pageNumbers;
        };
    
        return (
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-2">
                    <Form.Select size="sm" value={rowsPerPage} onChange={handleRowsPerPageChange} style={{width: '75px'}} >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </Form.Select>
                </div>
                
                <div className="d-flex align-items-center gap-3">
                    <span className="text-muted small">
                        {startIndex + 1}-{endIndex} of {totalRows}
                    </span>
                    <div className="btn-group" role="group">
                        <Button variant="outline-secondary" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                            <i className="fas fa-chevron-left"></i>
                        </Button>
                        {renderPageNumbers()}
                        <Button variant="outline-secondary" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                            <i className="fas fa-chevron-right"></i>
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="py-3">
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h5 className="mb-0 fs-6 text-muted text-uppercase">Consolidated Progress Overview</h5>
                        <div className="d-flex gap-2">
                            <InputGroup size="sm" style={{ width: '250px' }}>
                                <Form.Control
                                    placeholder="Search records..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && <Button variant="outline-secondary" onClick={() => setSearchTerm('')}> <i className="fas fa-times"></i> </Button>}
                            </InputGroup>
                            <Button variant="outline-primary" size="sm" onClick={handleExportCSV}>
                                <i className="fas fa-download me-1"></i> Export
                            </Button>
                            {isAdmin && (
                                <>
                                    <Button variant="outline-success" size="sm" onClick={handleOpenUploadModal}>
                                        <i className="fas fa-file-csv me-1"></i> Upload CSV
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                                        <i className="fas fa-plus me-1"></i> Add
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card.Header>
                
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading data...</p></div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-5"><p className="text-muted">No records found.</p></div>
                    ) : (
                        <div className="table-responsive-scroll">
                            <EditableTable 
                                columns={finalTableColumns} data={paginatedData} onSave={isAdmin ? handleSaveTableRow : undefined}
                                onDelete={isAdmin ? handleOpenDeleteModal : undefined} isLoading={actionLoading} allowAdd={false}
                            />
                        </div>
                    )}
                </Card.Body>
                
                <Card.Footer className="bg-light border-top">
                    <PaginationControls totalRows={filteredData.length} />
                </Card.Footer>
            </Card>

            <Modal show={showAddEditModal} onHide={() => setShowAddEditModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>{formMode === 'add' ? 'Add New Student Progress' : 'Edit Student Progress'}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mb-3">
                            <Col md={6}><Form.Group><Form.Label>Company Name</Form.Label><Form.Control type="text" value={formData.companyName} onChange={(e) => handleFormInputChange('companyName', e.target.value)} placeholder="Enter company name" required /></Form.Group></Col>
                            <Col md={6}><Form.Group><Form.Label>Role Name</Form.Label><Form.Control type="text" value={formData.roleName} onChange={(e) => handleFormInputChange('roleName', e.target.value)} placeholder="e.g., Frontend Developer" required /></Form.Group></Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={4}><Form.Group><Form.Label>No of Offers</Form.Label><Form.Control type="number" value={formData.noOfOffers} onChange={(e) => handleFormInputChange('noOfOffers', Number(e.target.value))} min="1" /></Form.Group></Col>
                            <Col md={4}><Form.Group><Form.Label>Role Deadline</Form.Label><DatePicker selected={formData.roleDeadline ? new Date(formData.roleDeadline) : null} onChange={(date) => handleFormInputChange('roleDeadline', date)} className="form-control" placeholderText="Select Deadline" showMonthDropdown showYearDropdown dropdownMode="select" /></Form.Group></Col>
                            <Col md={4}><Form.Group><Form.Label>Techstack Names</Form.Label><TechStackDropdown techStacks={techStackOptions} selectedTechStacks={formData.selectedTechStacks} onSelect={handleTechStackSelection} loading={loading} isFormField={true} /></Form.Group></Col>
                        </Row>
                        <div className="border-top pt-3 mt-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0">Students for "{formData.roleName || 'Role'}"</h6>
                                {formMode === 'add' && <Button variant="success" size="sm" onClick={handleAddStudent}> <i className="fas fa-user-plus me-2"></i>Add Student </Button>}
                            </div>
                            {formData.selectedTechStacks.length > 0 ? (
                                <Table striped bordered responsive size="sm" className="align-middle">
                                    <thead><tr>
                                        <th style={{width: '15%'}}>NIAT ID</th><th style={{width: '25%'}}>Student Name</th>
                                        {formData.selectedTechStacks.map(tsName => <th key={tsName}>{tsName} Deadline</th>)}
                                        {formMode === 'add' && <th style={{ width: '50px' }}></th>}
                                    </tr></thead>
                                    <tbody>{formData.students.map((student, sIndex) => (<tr key={student.id}>
                                        <td><Form.Control size="sm" type="text" value={student.niatId} onChange={(e) => handleStudentChange(student.id, 'niatId', e.target.value)} onPaste={(e) => handleStudentPaste(e, sIndex)}/></td>
                                        <td><Form.Control size="sm" type="text" value={student.studentName} onChange={(e) => handleStudentChange(student.id, 'studentName', e.target.value)} /></td>
                                        {formData.selectedTechStacks.map(tsName => {
                                            const assignment = student.techAssignments.find(a => a.techStackName === tsName);
                                            return <td key={tsName}><DatePicker selected={assignment?.deadline ? new Date(assignment.deadline) : null} onChange={(date) => handleStudentTechDeadlineChange(student.id, tsName, date)} className="form-control form-control-sm" placeholderText="Set Date" showMonthDropdown showYearDropdown dropdownMode="select"/></td>
                                        })}
                                        {formMode === 'add' && <td className="text-center"><Button variant="outline-danger" size="sm" onClick={() => handleRemoveStudent(student.id)} disabled={formData.students.length <= 1} title="Remove Student"> <i className="fas fa-trash"></i> </Button></td>}
                                    </tr>))}</tbody>
                                </Table>
                            ) : (<div className="text-muted text-center py-3">Please select Tech Stacks to assign deadlines to students.</div>)}
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddEditModal(false)} disabled={actionLoading}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveForm} disabled={actionLoading}> {actionLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2" /> Saving...</> : (formMode === 'add' ? 'Add Student Progress' : 'Update Student Progress')} </Button>
                </Modal.Footer>
            </Modal>
            
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title><i className="fas fa-file-csv me-2"></i>Upload Student Progress Data</Modal.Title></Modal.Header>
                <Modal.Body>
                    {csvError && <Alert variant="danger" className="py-2 small">{csvError}</Alert>}
                    <Form.Group controlId="formFile" className="mb-3"><Form.Label>Select CSV file</Form.Label><Form.Text className="d-block mb-2 text-muted">Required columns: `Company Name`, `Role Name`, `NIAT ID`, `Student Name`, `Tech Stack Name`. Others optional.</Form.Text><Form.Control type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} /></Form.Group>
                    {csvData.length > 0 && <div><h6>Preview Data ({csvData.length} rows)</h6><div className="table-responsive" style={{ maxHeight: '40vh', overflowY: 'auto' }}><Table striped bordered size="sm"><thead><tr>{csvHeaders.map((header, index) => <th key={index}>{header}</th>)}</tr></thead><tbody>{csvData.map((row, rowIndex) => <tr key={rowIndex}>{csvHeaders.map((header, colIndex) => <td key={colIndex}>{row[header]}</td>)}</tr>)}</tbody></Table></div></div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveCsvData} disabled={uploadingCsv || !csvData.length}> {uploadingCsv ? <><Spinner as="span" animation="border" size="sm" className="me-2" /> Uploading...</> : 'Upload Data'} </Button>
                </Modal.Footer>
            </Modal>
            
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Confirm Deletion</Modal.Title></Modal.Header>
                <Modal.Body>Are you sure you want to delete this student progress record? This action cannot be undone.</Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>{actionLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Delete'}</Button></Modal.Footer>
            </Modal>
            
            <style>{`
                .table-responsive-scroll { max-height: 70vh; overflow-y: auto; }
                .table-responsive-scroll thead th { position: sticky; top: 0; background-color: #f8f9fa; z-index: 1; }
                .progress-bar-custom { height: 20px; border-radius: 4px; }
                .react-datepicker-wrapper { display: block; width: 100%; }
                .table { font-size: 0.85rem; }
                .table th { font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }
                .card-header h5 { font-weight: 600; }
            `}</style>
        </div>
    );
};

export default CompanywiseStudentsProgress;
