// client/src/pages/InternshipsTracker.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Nav, Spinner, Alert, Button, Modal, Table, Form, Row, Col, InputGroup, Dropdown, ProgressBar, Pagination } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Papa from 'papaparse'; // Import PapaParse
import internshipsTrackerService from '../services/internshipsTrackerService.js';
import userService from '../services/userService.js';
import * as techStackService from '../services/techStackService.js';
import EditableTable from '../components/EditableTable/EditableTable.jsx';
import CompanywiseStudentsProgress from './CompanywiseStudentsProgress.jsx';
import TechStackDropdown from '../components/TechStackDropdown/TechStackDropdown.jsx'; 
import statsService from '../services/statsService.js';
import useAuth from '../hooks/useAuth';


// --- Column Definitions for sheets ---
const techStackRoadmapColumns = [
    { header: 'Tech Stack', field: 'techStack' }, { header: 'Tech Stack RP', field: 'techStackRp' }, { header: 'Instructors', field: 'instructors' }, { header: 'Roadmap', field: 'roadmapLink' }, { header: 'Techstack Deadline', field: 'deadline', type: 'date' }, { header: 'Techstack Progress', field: 'progress', type: 'number' }, { header: 'Version', field: 'version' }, { header: 'Version history remarks', field: 'versionRemarks' }, { header: '25% completion Assignment', field: 'assignment25', group: 'Assessments + Assignments + NXT' }, { header: '50% completion Assignment', field: 'assignment50', group: 'Assessments + Assignments + NXT' }, { header: '75% completion Assignment', field: 'assignment75', group: 'Assessments + Assignments + NXT' }, { header: '100% completion Assignment', field: 'assignment100', group: 'Assessments + Assignments + NXT' }, { header: 'Roadmap Approval from company (Before starting the training)', field: 'roadmapApproval', group: 'Critical Points' }, { header: 'Conducting Company Assignments (Ask for 2 assignments a month)', field: 'companyAssignments', group: 'Critical Points' }, { header: 'ASE Mock Interview (After 50% & 100%) completion', field: 'aseMockInterview', group: 'Critical Points' }, { header: 'External Mock Interview (After 100% completion)', field: 'externalMockInterview', group: 'Critical Points' },
];
const stackToCompanyMappingColumns = [
    { header: 'Company Name', field: 'companyName' }, { header: 'Role', field: 'role' }, { header: 'Tech Stack', field: 'techStack' }, { header: 'Status', field: 'mappingStatus' },
];
const studentWiseProgressColumns = [
    { header: 'UUID', field: 'uuid' }, { header: 'NIAT ID', field: 'niatId' }, { header: 'Student Name', field: 'studentName' }, { header: 'Company', field: 'company' }, { header: 'Role', field: 'role' },
];
const criticalPointsColumns = [
    { header: 'Company', field: 'company' }, { header: 'Role', field: 'role' }, { header: 'Roadmap Review by Company', field: 'roadmapReviewByCompany' }, { header: 'Roadmap Changes Status', field: 'roadmapChangesStatus' }, { header: 'Fortnight Interaction Status', field: 'fortnightInteractionStatus' }, { header: 'Fortnight Interaction Remarks', field: 'fortnightInteractionRemarks' }, { header: 'Feedback from company', field: 'feedbackFromCompany' }, { header: 'Assignment Given by Company', field: 'assignmentGivenByCompany' }, { header: 'Feedback implementation status', field: 'feedbackImplementationStatus' }, { header: 'Feedback Implementation Remarks', field: 'feedbackImplementationRemarks' },
];
const subsheetConfigs = {
    'internship-master': { name: 'Internship Master' },
    'tech-stack-roadmaps': { name: 'Tech Stack Roadmaps', columns: techStackRoadmapColumns },
    'companywise-students-progress': { name: 'Companywise - Students Progress' },
    'stack-to-company-mapping': { name: 'Stack to Company Mapping' },
    'student-wise-progress': { name: 'Student Wise Progress', columns: studentWiseProgressColumns },
    'critical-points': { name: 'Critical Points', columns: criticalPointsColumns }
};
const TechStackRoadmapForm = ({ onSave, onCancel, initialData, isLoading, techStackOptions, instructors: instructorOptions, techStackProgressData }) => {
    const [formData, setFormData] = useState(initialData || {
        techStack: '', techStackRp: '', instructors: [], roadmapLink: '',
        deadline: null, progress: 0, version: 'V1', versionRemarks: '',
        assignment25: '', assignment50: '', assignment75: '', assignment100: '',
        roadmapApproval: '', companyAssignments: '', aseMockInterview: '', externalMockInterview: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, deadline: date }));
    };

    const handleTechStackChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        const progressInfo = (techStackProgressData || []).find(p => p.name === value);
        newFormData.progress = progressInfo ? Math.round(progressInfo.completionPercentage) : 0;

        setFormData(newFormData);
    };

    const handleInstructorToggle = (instructorName) => {
        const newSelection = formData.instructors.includes(instructorName)
            ? formData.instructors.filter(name => name !== instructorName)
            : [...formData.instructors, instructorName];
        setFormData(prev => ({...prev, instructors: newSelection}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
                <Col md={4}><Form.Group><Form.Label>Tech Stack</Form.Label><Form.Select name="techStack" value={formData.techStack} onChange={handleTechStackChange} required><option value="">Select Tech Stack</option>{(techStackOptions || []).map(ts => (<option key={ts._id} value={ts.name}>{ts.name}</option>))}</Form.Select></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Tech Stack RP</Form.Label><Form.Control type="text" name="techStackRp" value={formData.techStackRp} onChange={handleChange} /></Form.Group></Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Instructors</Form.Label>
                        <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start d-flex justify-content-between align-items-center">
                                {formData.instructors.length > 0 ? `${formData.instructors.length} selected` : 'Select Instructors...'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100" style={{maxHeight: '200px', overflowY: 'auto'}}>
                                {(instructorOptions || []).map(i => {
                                    const instructorName = `${i.firstName || ''} ${i.lastName || ''}`.trim();
                                    return (
                                        <Dropdown.Item key={i._id} as="div" onClick={(e) => e.stopPropagation()}>
                                            <Form.Check 
                                                type="checkbox"
                                                id={`inst-${i._id}`}
                                                label={instructorName}
                                                checked={formData.instructors.includes(instructorName)}
                                                onChange={() => handleInstructorToggle(instructorName)}
                                            />
                                        </Dropdown.Item>
                                    );
                                })}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Form.Group>
                </Col>
            </Row>
             <Row className="mb-3">
                <Col md={6}><Form.Group><Form.Label>Roadmap Link</Form.Label><Form.Control type="url" name="roadmapLink" value={formData.roadmapLink} onChange={handleChange} /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Deadline</Form.Label><DatePicker selected={formData.deadline ? new Date(formData.deadline) : null} onChange={handleDateChange} className="form-control" placeholderText="Select Deadline" /></Form.Group></Col>
                 <Col md={3}><Form.Group><Form.Label>Progress (%)</Form.Label><Form.Control type="number" name="progress" value={formData.progress} readOnly className="bg-light" /></Form.Group></Col>
             </Row>
             <Row className="mb-3">
                 <Col md={3}><Form.Group><Form.Label>Version</Form.Label><Form.Control type="text" name="version" value={formData.version} onChange={handleChange} /></Form.Group></Col>
                <Col md={9}><Form.Group><Form.Label>Version Remarks</Form.Label><Form.Control as="textarea" rows={1} name="versionRemarks" value={formData.versionRemarks} onChange={handleChange} /></Form.Group></Col>
             </Row>
            <h6 className="mt-4">Assessments & Assignments + Nxtmock</h6>
            <hr className="mt-1 mb-3" />
            <Row className="mb-3">
                <Col><Form.Group><Form.Label>25% completion</Form.Label><Form.Control type="text" name="assignment25" value={formData.assignment25} onChange={handleChange} /></Form.Group></Col>
                <Col><Form.Group><Form.Label>50% completion</Form.Label><Form.Control type="text" name="assignment50" value={formData.assignment50} onChange={handleChange} /></Form.Group></Col>
                <Col><Form.Group><Form.Label>75% completion</Form.Label><Form.Control type="text" name="assignment75" value={formData.assignment75} onChange={handleChange} /></Form.Group></Col>
                <Col><Form.Group><Form.Label>100% completion</Form.Label><Form.Control type="text" name="assignment100" value={formData.assignment100} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <h6 className="mt-4">Critical Points</h6>
            <hr className="mt-1 mb-3"/>
            <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Roadmap Approval from company (Before starting the training)</Form.Label><Form.Control type="text" name="roadmapApproval" value={formData.roadmapApproval} onChange={handleChange} /></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Conducting Company Assignments (Ask for 2 assignments a month)</Form.Label><Form.Control type="text" name="companyAssignments" value={formData.companyAssignments} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <Row>
                 <Col md={6}><Form.Group className="mb-3"><Form.Label>ASE Mock Interview (After 50% & 100%) completion</Form.Label><Form.Control type="text" name="aseMockInterview" value={formData.aseMockInterview} onChange={handleChange} /></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>External Mock Interview (After 100% completion)</Form.Label><Form.Control type="text" name="externalMockInterview" value={formData.externalMockInterview} onChange={handleChange} /></Form.Group></Col>
             </Row>
             <Modal.Footer className="px-0 pt-4">
                <Button variant="secondary" onClick={onCancel} disabled={isLoading}>Cancel</Button>
                 <Button variant="primary" type="submit" disabled={isLoading}>
                     {isLoading ? <><Spinner as="span" size="sm" /> Saving...</> : 'Save Roadmap'}
                 </Button>
             </Modal.Footer>
        </Form>
    );
};
const InternshipMasterForm = ({ data, setData, techStackOptions, loading, techStackProgress }) => {
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date, name) => {
        setData(prev => ({ ...prev, [name]: date }));
    };

    const handleTechStackDropdownSelect = (selectedNames) => {
        setData(prev => {
            const newTechProgress = selectedNames.map(name => {
                const existing = prev.techProgress.find(tp => tp.techStackName === name);
                return existing || { techStackName: name };
            });
            return { ...prev, techProgress: newTechProgress };
        });
    };
    
    const getProgressColorClass = (percentage) => {
        if (percentage === 100) return 'text-success';
        if (percentage <= 10) return 'text-danger';
        return 'text-warning';
    };

    return (
        <Form>
            <Row className="g-3 mb-3">
                <Col md={4}><Form.Group><Form.Label>Companies</Form.Label><Form.Control type="text" name="companies" value={data.companies || ''} onChange={handleInputChange} placeholder="Enter company name" /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Roles</Form.Label><Form.Control type="text" name="roles" value={data.roles || ''} onChange={handleInputChange} placeholder="Enter role title" /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Offers</Form.Label><Form.Control type="number" name="internshipOffers" value={data.internshipOffers || 0} onChange={handleInputChange} min="0" /></Form.Group></Col>
            </Row>
            <Row className="g-3 mb-3">
                <Col md={4}><Form.Group><Form.Label>Status</Form.Label><Form.Select name="companyStatus" value={data.companyStatus || 'Active'} onChange={handleInputChange}><option value="Active">Active</option><option value="Inactive">Inactive</option></Form.Select></Form.Group></Col>
                {data.companyStatus === 'Inactive' && (
                    <Col md={8}><Form.Group><Form.Label>Reason</Form.Label><Form.Control as="textarea" rows={1} name="reasonInactive" value={data.reasonInactive || ''} onChange={handleInputChange} placeholder="Reason if inactive" /></Form.Group></Col>
                )}
            </Row>
            <Row className="g-3 mb-4">
                <Col md={4}><Form.Group><Form.Label>Student Mapping Method</Form.Label><Form.Control type="text" name="studentMappingMethod" value={data.studentMappingMethod || ''} onChange={handleInputChange} placeholder="e.g., Internal Evaluation" /></Form.Group></Col>
                <Col md={2}><Form.Group><Form.Label>Mapping Counts</Form.Label><Form.Control type="number" name="studentMappingCounts" value={data.studentMappingCounts || 0} onChange={handleInputChange} min="0" /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Internship Start Date</Form.Label><DatePicker selected={data.internshipStartDate ? new Date(data.internshipStartDate) : null} onChange={date => handleDateChange(date, 'internshipStartDate')} className="form-control" placeholderText="Select Date" showMonthDropdown showYearDropdown dropdownMode="select" /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Stack Completion Date</Form.Label><DatePicker selected={data.stackCompletionDate ? new Date(data.stackCompletionDate) : null} onChange={date => handleDateChange(date, 'stackCompletionDate')} className="form-control" placeholderText="Select Date" showMonthDropdown showYearDropdown dropdownMode="select" /></Form.Group></Col>
            </Row>
            <div className="border-top mt-3 pt-3">
                <Row>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Tech Stacks</Form.Label>
                            <TechStackDropdown 
                                techStacks={techStackOptions}
                                selectedTechStacks={(data.techProgress || []).map(tp => tp.techStackName)}
                                onSelect={handleTechStackDropdownSelect}
                                loading={loading}
                                isFormField={true}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        {(data.techProgress || []).length > 0 && <Form.Label>Tech Stacks Progress</Form.Label>}
                        <div style={{maxHeight: '130px', overflowY: 'auto'}} className="px-1">
                            {(data.techProgress || []).map((tp, index) => {
                                const progressData = (techStackProgress || []).find(p => p.name === tp.techStackName);
                                const progressPercentage = progressData ? Math.round(progressData.completionPercentage) : 0;
                                const colorClass = getProgressColorClass(progressPercentage);

                                return (
                                    <div className="d-flex align-items-center mb-2" key={index}>
                                        <div className="fw-medium text-truncate me-2" style={{flex: '1 1 120px'}} title={tp.techStackName}>{tp.techStackName}</div>
                                        <div className={`ms-auto fw-bold ${colorClass}`} style={{minWidth: '40px', textAlign: 'right'}}>
                                            {progressPercentage}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Col>
                </Row>
            </div>
        </Form>
    );
};

const InternshipsTracker = () => {
    const { user } = useAuth();
    const [activeSheet, setActiveSheet] = useState('internship-master');
    const [sheetData, setSheetData] = useState([]);
    const [companyProgressData, setCompanyProgressData] = useState([]);
    const [mappingData, setMappingData] = useState([]);
    const [techStackOptions, setTechStackOptions] = useState([]);
    const [techStackProgress, setTechStackProgress] = useState([]);
    const [loading, setLoading] = useState(false);
    const [instructors, setInstructors] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const [newRowData, setNewRowData] = useState({});

    const initialNewInternshipState = useMemo(() => ({
        companies: '', roles: '', internshipOffers: 1, companyStatus: 'Active', reasonInactive: '', studentMappingMethod: '', studentMappingCounts: 0, internshipStartDate: null, stackCompletionDate: null, techProgress: []
    }), []);
    
    const [newInternship, setNewInternship] = useState(initialNewInternshipState);
    const [editingInternship, setEditingInternship] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteRowId, setDeleteRowId] = useState(null);
    const [showTechStackRoadmapModal, setShowTechStackRoadmapModal] = useState(false);
    const [editingTechStackRoadmap, setEditingTechStackRoadmap] = useState(null);
    const [showDeleteTSRModal, setShowDeleteTSRModal] = useState(false);
    const [deleteTSRId, setDeleteTSRId] = useState(null);

    const fetchData = useCallback(async (sheetName) => {
        setLoading(true);
        setError('');
        try {
            const response = await internshipsTrackerService.getSheetData(sheetName);
            setSheetData(response.data || []);
        } catch (err) {
            setError(`Failed to fetch data for ${subsheetConfigs[sheetName]?.name}.`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setNewRowData({});
        if (activeSheet !== 'companywise-students-progress') {
            fetchData(activeSheet);
        }
        setCurrentPage(1); // Reset page on tab change
    }, [activeSheet, fetchData]);
    
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [techStacksRes, timelineStatsRes, usersRes, companyProgressRes] = await Promise.all([
                    techStackService.getAllTechStacks(),
                    statsService.getTimelineStats(),
                    userService.getUsers(),
                    internshipsTrackerService.getSheetData('companywise-students-progress')
                ]);
                setTechStackOptions(techStacksRes.data || []);
                setTechStackProgress(timelineStatsRes.techStackProgress || []);
                setInstructors((usersRes.data || []).filter(u => u.role === 'instructor'));
                setCompanyProgressData(companyProgressRes.data || []);
            } catch (err) {
                setError("Failed to load initial data.");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useMemo(() => {
        const progressMap = new Map();
        techStackProgress.forEach(ts => {
            progressMap.set(ts.name, ts.completionPercentage);
        });
        
        const processedMappings = {};
        companyProgressData.forEach(item => {
            if (!item.companyName || !item.roleName) return;
    
            const key = `${item.companyName}|${item.roleName}`;
            if (!processedMappings[key]) {
                processedMappings[key] = {
                    companyName: item.companyName,
                    roleName: item.roleName,
                    roleDeadline: item.roleDeadline,
                    techStacks: new Map() 
                };
            }
    
            item.techAssignments?.forEach(assignment => {
                const techStackName = assignment.techStackName;
                const techStackDeadline = assignment.deadline;
                
                if (techStackName) {
                    if (!processedMappings[key].techStacks.has(techStackName)) {
                        processedMappings[key].techStacks.set(techStackName, {
                            name: techStackName,
                            deadline: techStackDeadline,
                            progress: Math.round(progressMap.get(techStackName) || 0)
                        });
                    } else {
                        const existingStack = processedMappings[key].techStacks.get(techStackName);
                        if (techStackDeadline && (!existingStack.deadline || new Date(techStackDeadline) > new Date(existingStack.deadline))) {
                            existingStack.deadline = techStackDeadline;
                        }
                    }
                }
            });
        });
        
        const finalMappingData = Object.values(processedMappings).map(mapping => ({
            ...mapping,
            techStacks: Array.from(mapping.techStacks.values())
        })).sort((a,b) => a.companyName.localeCompare(b.companyName) || a.roleName.localeCompare(b.roleName));
    
        setMappingData(finalMappingData);
    
    }, [companyProgressData, techStackProgress]);
    
    const handleAction = useCallback(async (actionFunc, ...args) => {
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            await actionFunc(...args);
            return true; // Indicate success
        } catch(err) {
            const defaultMessage = `An error occurred.`;
            setError(err.response?.data?.error || err.message || defaultMessage);
            return false; // Indicate failure
        } finally {
            setActionLoading(false);
        }
    }, []);
    
    const handleNewRowDataChange = (field, value) => {
        setNewRowData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddNewGenericRow = useCallback(async () => {
        const config = subsheetConfigs[activeSheet];
        if (!config || !config.columns) return;
        
        const requiredFields = config.columns.map(c => c.field);
        const isMissingField = requiredFields.some(field => !newRowData[field] && newRowData[field] !== 0);

        if (isMissingField) {
            setError("Please fill all fields before adding.");
            return;
        }

        const wasSuccessful = await handleAction(internshipsTrackerService.createSheetRow, activeSheet, newRowData);

        if (wasSuccessful) {
            await fetchData(activeSheet);
            setNewRowData({});
        }
    }, [activeSheet, newRowData, handleAction, fetchData, setError, setSuccess]);
    
    const handleAddNewInternship = useCallback(async () => {
        if (!newInternship.companies.trim()) {
            setError("Company name is required.");
            return;
        }
        await handleAction(async () => {
            await internshipsTrackerService.createSheetRow(activeSheet, newInternship);
            setNewInternship(initialNewInternshipState);
            fetchData(activeSheet);
        });
    }, [handleAction, newInternship, initialNewInternshipState, activeSheet, fetchData]);

    const handleOpenEditModal = (rowData, sheet) => {
        if (sheet === 'internship-master') {
            setEditingInternship(JSON.parse(JSON.stringify(rowData)));
            setShowEditModal(true);
        } else if (sheet === 'tech-stack-roadmaps') {
            setEditingTechStackRoadmap(JSON.parse(JSON.stringify(rowData)));
            setShowTechStackRoadmapModal(true);
        }
    };
    
    const handleSaveFromModal = (sheetName) => async (data) => {
        if (!data) return;
        const action = data._id ? internshipsTrackerService.updateSheetRow : internshipsTrackerService.createSheetRow;
        const id = data._id ? data._id : undefined;

        if(data._id){
            await handleAction(action, sheetName, id, data).then(() => fetchData(sheetName));
        }else{
             await handleAction(action, sheetName, data).then(() => fetchData(sheetName));
        }
            if (sheetName === 'tech-stack-roadmaps') {
                setShowTechStackRoadmapModal(false);
                setEditingTechStackRoadmap(null);
            }
            if (sheetName === 'internship-master') {
                setShowEditModal(false);
                setEditingInternship(null);
            }
        
    };
    
    const handleSaveRow = (id, updatedData) => handleAction(internshipsTrackerService.updateSheetRow, activeSheet, id, updatedData).then(() => fetchData(activeSheet));
    const openDeleteRowModal = (id) => { setDeleteRowId(id); setShowDeleteModal(true); };

    const handleConfirmDelete = () => {
        if (deleteRowId) {
            handleAction(internshipsTrackerService.deleteSheetRow, activeSheet, deleteRowId)
                .then(() => fetchData(activeSheet))
                .finally(() => setShowDeleteModal(false));
        }
    };

    const getProgressColorClass = (percentage) => {
        if (percentage >= 75) return 'text-success';
        if (percentage <= 25) return 'text-danger';
        return 'text-warning';
    };

    // Pagination Component - NEW IMPLEMENTATION
    const PaginationControls = ({ totalRows }) => {
        const handleRowsPerPageChange = (e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1); // Reset to first page
        };
    
        const handlePageChange = (page) => {
            if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
            }
        };

        if (totalRows === 0) return null;
    
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    
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
                    <Button
                        key={i}
                        variant={currentPage === i ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => handlePageChange(i)}
                        className="mx-1"
                        style={{minWidth: '38px'}}
                    >
                        {i}
                    </Button>
                );
            }
            return pageNumbers;
        };
    
        return (
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small"></span>
                    <Form.Select size="sm" value={rowsPerPage} onChange={handleRowsPerPageChange} style={{width: '75px'}}>
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
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </Button>
                        {renderPageNumbers()}
                        <Button
                             variant="outline-secondary"
                             size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const handleExportMappingCSV = () => {
        if (mappingData.length === 0) {
            alert("No mapping data to export.");
            return;
        }
    
        const csvRows = mappingData.flatMap(item => {
            if (item.techStacks.length === 0) {
                return [{
                    "Company Name": item.companyName,
                    "Role Name": item.roleName,
                    "Role Deadline": item.roleDeadline ? new Date(item.roleDeadline).toLocaleDateString('en-CA') : 'N/A',
                    "Techstack Name": "N/A",
                    "Completion %": "N/A",
                    "Techstack Deadline": "N/A"
                }];
            }
            return item.techStacks.map(ts => ({
                "Company Name": item.companyName,
                "Role Name": item.roleName,
                "Role Deadline": item.roleDeadline ? new Date(item.roleDeadline).toLocaleDateString('en-CA') : 'N/A',
                "Techstack Name": ts.name,
                "Completion %": `${ts.progress}%`,
                "Techstack Deadline": ts.deadline ? new Date(ts.deadline).toLocaleDateString('en-CA') : 'N/A'
            }));
        });
    
        const csv = Papa.unparse(csvRows, { header: true });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Stack_to_Company_Mapping.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const renderAddFormForSheet = (sheetKey) => {
        const config = subsheetConfigs[sheetKey];
        if (!config || !config.columns) return null;
    
        const fields = config.columns.map(col => {
            if (col.field === 'techStack') {
                return (
                    <Col md={3} key={col.field} className="mb-2">
                        <Form.Label>{col.header}</Form.Label>
                        <TechStackDropdown
                            techStacks={techStackOptions}
                            selectedTechStacks={newRowData[col.field] ? [newRowData[col.field]] : []}
                            onSelect={(names) => handleNewRowDataChange(col.field, names[0] || '')}
                            loading={loading}
                        />
                    </Col>
                );
            }
    
            if (col.type === 'date') {
                return (
                    <Col md={3} key={col.field} className="mb-2">
                        <Form.Label>{col.header}</Form.Label>
                        <DatePicker
                            selected={newRowData[col.field] ? new Date(newRowData[col.field]) : null}
                            onChange={(date) => handleNewRowDataChange(col.field, date)}
                            className="form-control"
                            placeholderText={`Enter ${col.header}`}
                        />
                    </Col>
                );
            }
    
            return (
                <Col md={3} key={col.field} className="mb-2">
                    <Form.Label>{col.header}</Form.Label>
                    <Form.Control
                        type={col.type || 'text'}
                        placeholder={`Enter ${col.header}`}
                        value={newRowData[col.field] || ''}
                        onChange={(e) => handleNewRowDataChange(col.field, e.target.value)}
                    />
                </Col>
            );
        });
    
        return (
            <Card className="mb-4 shadow-sm">
                <Card.Header as="h6" className="bg-light">Add New Entry to "{config.name}"</Card.Header>
                <Card.Body>
                    <Form>
                        <Row>{fields}</Row>
                        <div className="text-end mt-2">
                            <Button variant="primary" onClick={handleAddNewGenericRow} disabled={actionLoading}>
                                {actionLoading ? <Spinner size="sm" /> : 'Add Entry'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        );
    };

    // ** FIX: Moved useMemo out of renderActiveSheet to the top level **
    const paginatedData = useMemo(() => {
        if (loading) return [];
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sheetData.slice(startIndex, endIndex);
    }, [sheetData, currentPage, rowsPerPage, loading]);
    
    const renderActiveSheet = () => {
        const { columns } = subsheetConfigs[activeSheet] || {};

        if (loading) {
            return (<div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2 text-muted">Loading data...</p></div>);
        }

        // Special views
        if (activeSheet === 'companywise-students-progress') return <CompanywiseStudentsProgress user={user} />;
        if (activeSheet === 'stack-to-company-mapping') {
            return (
                <Card className="shadow-sm">
                    <Card.Header as="h6" className="bg-light d-flex justify-content-between align-items-center">
                        Stack to Company Mapping Overview
                        <Button variant="outline-success" size="sm" onClick={handleExportMappingCSV} title="Export as CSV">
                            <i className="fas fa-download"></i>
                        </Button>
                    </Card.Header>
                    <Card.Body className="p-0 table-container-scroll">
                        <Table striped bordered hover responsive>
                            <thead className="table-light">
                                <tr>
                                    <th style={{width: '20%'}}>Company Name</th>
                                    <th style={{width: '20%'}}>Role Name</th>
                                    <th style={{width: '15%'}}>Role Deadline</th>
                                    <th style={{width: '15%'}}>Techstack Name</th>
                                    <th style={{width: '15%'}}>Completion %</th>
                                    <th style={{width: '15%'}}>Techstack Deadline</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-4"><Spinner animation="border" size="sm"/> Loading mapping data...</td></tr> 
                                ) : mappingData.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center text-muted py-4">No data to display. Add progress data in the 'Companywise Students Progress' section.</td></tr>
                                ) : (
                                    mappingData.map((mapping, mapIndex) => (
                                        mapping.techStacks.length > 0 ? (
                                            mapping.techStacks.map((techStack, tsIndex) => (
                                                <tr key={`${mapIndex}-${tsIndex}`}>
                                                    {tsIndex === 0 && <td rowSpan={mapping.techStacks.length || 1}>{mapping.companyName}</td>}
                                                    {tsIndex === 0 && <td rowSpan={mapping.techStacks.length || 1}>{mapping.roleName}</td>}
                                                    {tsIndex === 0 && <td rowSpan={mapping.techStacks.length || 1}>{mapping.roleDeadline ? new Date(mapping.roleDeadline).toLocaleDateString() : 'N/A'}</td>}
                                                    <td>{techStack.name}</td>
                                                    <td>
                                                        <span className={`fw-bold ${getProgressColorClass(techStack.progress)}`}>
                                                            {techStack.progress}%
                                                        </span>
                                                    </td>
                                                    <td>{techStack.deadline ? new Date(techStack.deadline).toLocaleDateString() : 'N/A'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr key={mapIndex}>
                                                <td>{mapping.companyName}</td>
                                                <td>{mapping.roleName}</td>
                                                <td>{mapping.roleDeadline ? new Date(mapping.roleDeadline).toLocaleDateString() : 'N/A'}</td>
                                                <td colSpan="3" className="text-center text-muted fst-italic">No tech stacks assigned for this role.</td>
                                            </tr>
                                        )
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                     <Card.Footer className="bg-light border-top">
                        <PaginationControls totalRows={mappingData.length} />
                    </Card.Footer>
                </Card>
            );
        }
        if (activeSheet === 'internship-master') { 
             return (
                <div>
                     {user.role === 'admin' && (
                         <div className="d-flex justify-content-end mb-3">
                             <Button onClick={() => { setEditingInternship(null); setShowEditModal(true); }}><i className="fas fa-plus me-2"></i>Add Internship</Button>
                         </div>
                     )}
                    <div className="table-responsive table-container-scroll">
                        <Table striped bordered hover size="sm" className="align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Companies</th><th>Roles</th><th>Offers</th><th>Status</th><th>Reason (Inactive)</th><th>Mapping Method</th><th>Mapping Counts</th><th>Tech Stacks & Progress</th><th>Internship Start</th><th>Stack Completion</th>
                                    {user.role === 'admin' && <th className="text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length === 0 && !loading && (<tr><td colSpan="11" className="text-center text-muted py-4">No data available for this sheet.</td></tr>)}
                                {paginatedData.map(row => (
                                    <tr key={row._id}>
                                        <td>{row.companies}</td><td>{row.roles}</td><td>{row.internshipOffers}</td><td><span className={`badge ${row.companyStatus === 'Active' ? 'bg-success' : 'bg-secondary'}`}>{row.companyStatus}</span></td><td style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.companyStatus === 'Inactive' ? row.reasonInactive : 'N/A'}</td><td>{row.studentMappingMethod}</td><td>{row.studentMappingCounts}</td>
                                        <td style={{minWidth: '200px'}}>{(row.techProgress || []).map(tp => {
                                            const progressInfo = techStackProgress.find(p => p.name === tp.techStackName);
                                            const progressValue = progressInfo ? Math.round(progressInfo.completionPercentage) : 0;
                                            return (<div key={tp.techStackName} className="d-flex align-items-center my-1"><span className="me-2 text-truncate" style={{maxWidth:'100px'}}>{tp.techStackName}</span> <span className={`ms-auto small fw-bold ${getProgressColorClass(progressValue)}`}>{progressValue}%</span></div>);
                                        })}</td>
                                        <td>{row.internshipStartDate ? new Date(row.internshipStartDate).toLocaleDateString() : 'N/A'}</td><td>{row.stackCompletionDate ? new Date(row.stackCompletionDate).toLocaleDateString() : 'N/A'}</td>
                                        {user.role === 'admin' && (
                                            <td className="text-center">
                                                <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(row, 'internship-master')} className="me-2" title="Edit Row"><i className="fas fa-edit"></i></Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => openDeleteRowModal(row._id)} title="Delete Row"><i className="fas fa-trash"></i></Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                    <div className="bg-light border-top">
                         <PaginationControls totalRows={sheetData.length} />
                    </div>
                </div>
            );
        }
        if (activeSheet === 'tech-stack-roadmaps') { 
            return (
                <div>
                     {user.role === 'admin' && (
                        <div className="d-flex justify-content-end mb-3">
                           <Button variant="primary" onClick={() => { setEditingTechStackRoadmap(null); setShowTechStackRoadmapModal(true); }}>
                               <i className="fas fa-plus me-2" />Add Roadmap
                           </Button>
                       </div>
                     )}
                     <div className="table-container-scroll">
                         <EditableTable
                        columns={columns} 
                        data={paginatedData} 
                        onSave={user.role === 'admin' ? handleSaveRow : undefined} 
                        onDelete={user.role === 'admin' ? openDeleteRowModal : undefined}
                        isLoading={actionLoading} 
                        allowAdd={false} 
                        activeSheet={activeSheet} />
                     </div>
                     <div className="bg-light border-top">
                        <PaginationControls totalRows={sheetData.length} />
                    </div>
                 </div>
            );
        }
        
        if (['student-wise-progress', 'critical-points'].includes(activeSheet)) {
            return (
                <>
                    {user.role === 'admin' && renderAddFormForSheet(activeSheet)}
                    <Card className="mt-4 shadow-sm">
                        <Card.Header as="h6" className="bg-light">{subsheetConfigs[activeSheet].name} Data</Card.Header>
                        <Card.Body className="p-0"> 
                             <div className="table-container-scroll">
                                <EditableTable
                                    columns={columns}
                                    data={paginatedData}
                                    onSave={user.role === 'admin' ? handleSaveRow : undefined}
                                    onDelete={user.role === 'admin' ? openDeleteRowModal : undefined}
                                    isLoading={actionLoading || loading}
                                    allowAdd={false} 
                                    activeSheet={activeSheet}
                                />
                             </div>
                            <div className="bg-light border-top">
                                <PaginationControls totalRows={sheetData.length} />
                            </div>
                        </Card.Body>
                    </Card>
                </>
            );
        }
    };

    return (
        <div className="container-fluid p-md-1">
            <Card className="border-0 shadow-sm">
                <Card.Header>
                     <Nav variant="tabs" activeKey={activeSheet} onSelect={(k) => setActiveSheet(k)}>
                         {Object.entries(subsheetConfigs).map(([key, config]) => (
                            <Nav.Item key={key}><Nav.Link eventKey={key}>{config.name}</Nav.Link></Nav.Item>
                         ))}
                    </Nav>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                    {renderActiveSheet()}
                </Card.Body>
            </Card>
            
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>{editingInternship ? 'Edit' : 'Add'} Internship Master</Modal.Title></Modal.Header>
                 <Modal.Body className="p-4">
                     {showEditModal && (
                        <InternshipMasterForm 
                            data={editingInternship || newInternship} 
                            setData={editingInternship ? setEditingInternship : setNewInternship}
                            techStackOptions={techStackOptions}
                            loading={loading}
                            techStackProgress={techStackProgress} 
                        />
                     )}
                 </Modal.Body>
                 <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={actionLoading}>Cancel</Button>
                     <Button variant="primary" onClick={() => editingInternship ? handleSaveFromModal('internship-master')(editingInternship) : handleAddNewInternship()} disabled={actionLoading}>
                        {actionLoading ? <><Spinner size="sm" /> Saving...</> : (editingInternship ? 'Save Changes' : 'Add Internship')}
                     </Button>
                </Modal.Footer>
            </Modal>
            
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Delete Row</Modal.Title></Modal.Header>
                <Modal.Body>Are you sure you want to delete this row? This action cannot be undone.</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>{actionLoading ? <Spinner animation="border" size="sm" /> : 'Delete'}</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showTechStackRoadmapModal} onHide={() => setShowTechStackRoadmapModal(false)} size="lg" centered>
                 <Modal.Header closeButton>
                     <Modal.Title>{editingTechStackRoadmap ? 'Edit' : 'Add'} Tech Stack Roadmap</Modal.Title>
                 </Modal.Header>
                 <Modal.Body>
                     <TechStackRoadmapForm 
                        onSave={handleSaveFromModal('tech-stack-roadmaps')}
                        onCancel={() => setShowTechStackRoadmapModal(false)}
                        techStackProgressData={techStackProgress}
                        initialData={editingTechStackRoadmap}
                        techStackOptions={techStackOptions}
                        instructors={instructors}
                        isLoading={actionLoading}
                    />
                 </Modal.Body>
            </Modal>

            <Modal show={showDeleteTSRModal} onHide={() => setShowDeleteTSRModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
                <Modal.Body>Are you sure you want to delete this Tech Stack Roadmap?</Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteTSRModal(false)}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>{actionLoading? <Spinner size="sm" /> : 'Delete'}</Button></Modal.Footer>
            </Modal>
            <style>{`
                .table-container-scroll {
                    max-height: 70vh; /* Adjust as needed */
                    overflow-y: auto;
                }
                .table-container-scroll thead th {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background-color: #f8f9fa; /* Match existing table header bg */
                }
            `}</style>
        </div>
    );
};

export default InternshipsTracker;