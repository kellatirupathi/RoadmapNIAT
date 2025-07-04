import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Nav, Spinner, Alert, Button, Modal, Table, Form, Row, Col, InputGroup, Dropdown, Pagination } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Papa from 'papaparse';
import internshipsTrackerService from '../services/internshipsTrackerService.js';
import userService from '../services/userService.js';
import * as techStackService from '../services/techStackService.js';
import EditableTable from '../components/EditableTable/EditableTable.jsx';
import CompanywiseStudentsProgress from './CompanywiseStudentsProgress.jsx';
import TechStackDropdown from '../components/TechStackDropdown/TechStackDropdown.jsx'; 
import statsService from '../services/statsService.js';
import useAuth from '../hooks/useAuth';

// --- Column Definitions ---
const techStackRoadmapColumns = [
    { header: 'Tech Stack', field: 'techStack' }, 
    { header: 'Tech Stack RP', field: 'techStackRp' }, 
    { header: 'Instructors', field: 'instructors' }, 
    { header: 'Roadmap', field: 'roadmapLink' }, 
    { header: 'Techstack Deadline', field: 'deadline', type: 'date' }, 
    { header: 'Techstack Progress', field: 'progress', type: 'number' }, 
    { header: 'Version', field: 'version' }, 
    { header: 'Version history remarks', field: 'versionRemarks' }, 
    { header: '25% completion Assignment', field: 'assignment25', group: 'Assessments + Assignments + NXT' }, 
    { header: '50% completion Assignment', field: 'assignment50', group: 'Assessments + Assignments + NXT' }, 
    { header: '75% completion Assignment', field: 'assignment75', group: 'Assessments + Assignments + NXT' }, 
    { header: '100% completion Assignment', field: 'assignment100', group: 'Assessments + Assignments + NXT' }, 
    { header: 'Roadmap Approval from company (Before starting the training)', field: 'roadmapApproval', group: 'Critical Points' }, 
    { header: 'Conducting Company Assignments (Ask for 2 assignments a month)', field: 'companyAssignments', group: 'Critical Points' }, 
    { header: 'ASE Mock Interview (After 50% & 100%) completion', field: 'aseMockInterview', group: 'Critical Points' }, 
    { header: 'External Mock Interview (After 100% completion)', field: 'externalMockInterview', group: 'Critical Points' },
];

const subsheetConfigs = {
    'internship-master': { name: 'Internship Master' },
    // 'tech-stack-roadmaps': { name: 'Tech Stack Roadmaps', columns: techStackRoadmapColumns },
    'companywise-students-progress': { name: 'Companywise - Students Progress' },
    'student-wise-progress': { name: 'Student Wise Progress' },
};

// List of available locations for dropdown
const locationOptions = [
    'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Remote', 'Other'
];

const TechStackRoadmapForm = ({ onSave, onCancel, initialData, isLoading, techStackOptions, instructors: instructorOptions, techStackProgressData }) => {
    const [formData, setFormData] = useState(initialData || {
        techStack: '', techStackRp: '', instructors: [], roadmapLink: '',
        deadline: null, progress: 0, version: 'V1', versionRemarks: '',
        assignment25: '', assignment50: '', assignment75: '', assignment100: '',
        roadmapApproval: '', companyAssignments: '', aseMockInterview: '', externalMockInterview: ''
    });

    useEffect(() => {
        setFormData(initialData || {
            techStack: '', techStackRp: '', instructors: [], roadmapLink: '',
            deadline: null, progress: 0, version: 'V1', versionRemarks: '',
            assignment25: '', assignment50: '', assignment75: '', assignment100: '',
            roadmapApproval: '', companyAssignments: '', aseMockInterview: '', externalMockInterview: ''
        });
    }, [initialData]);

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
        onSave({...formData, progress: Number(formData.progress) || 0});
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
                <Col md={4}><Form.Group><Form.Label>Tech Stack</Form.Label><Form.Select name="techStack" value={formData.techStack} onChange={handleTechStackChange} required><option value="">Select Tech Stack</option>{(techStackOptions || []).map(ts => (<option key={ts._id} value={ts.name}>{ts.name}</option>))}</Form.Select></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Tech Stack RP</Form.Label><Form.Control type="text" name="techStackRp" value={formData.techStackRp || ''} onChange={handleChange} /></Form.Group></Col>
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
                <Col md={6}><Form.Group><Form.Label>Roadmap Link</Form.Label><Form.Control type="url" name="roadmapLink" value={formData.roadmapLink || ''} onChange={handleChange} /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Deadline</Form.Label><DatePicker selected={formData.deadline ? new Date(formData.deadline) : null} onChange={handleDateChange} className="form-control" placeholderText="Select Deadline" /></Form.Group></Col>
                 <Col md={3}>
                     <Form.Group>
                        <Form.Label>Progress (%)</Form.Label>
                        <Form.Control type="number" name="progress" value={formData.progress} onChange={handleChange} min="0" max="100" placeholder="Manual override"/>
                    </Form.Group>
                </Col>
             </Row>
             <Row className="mb-3">
                 <Col md={3}><Form.Group><Form.Label>Version</Form.Label><Form.Control type="text" name="version" value={formData.version || ''} onChange={handleChange} /></Form.Group></Col>
                <Col md={9}><Form.Group><Form.Label>Version Remarks</Form.Label><Form.Control as="textarea" rows={1} name="versionRemarks" value={formData.versionRemarks || ''} onChange={handleChange} /></Form.Group></Col>
             </Row>
            <h6 className="mt-4">Assessments & Assignments + Nxtmock</h6>
            <hr className="mt-1 mb-3" />
            <Row className="mb-3">
                <Col><Form.Group><Form.Label>25% completion</Form.Label><Form.Control type="text" name="assignment25" value={formData.assignment25 || ''} onChange={handleChange} /></Form.Group></Col>
                <Col><Form.Group><Form.Label>50% completion</Form.Label><Form.Control type="text" name="assignment50" value={formData.assignment50 || ''} onChange={handleChange} /></Form.Group></Col>
                <Col><Form.Group><Form.Label>75% completion</Form.Label><Form.Control type="text" name="assignment75" value={formData.assignment75 || ''} onChange={handleChange} /></Form.Group></Col>
                <Col><Form.Group><Form.Label>100% completion</Form.Label><Form.Control type="text" name="assignment100" value={formData.assignment100 || ''} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <h6 className="mt-4">Critical Points</h6>
            <hr className="mt-1 mb-3"/>
            <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Roadmap Approval from company (Before starting the training)</Form.Label><Form.Control type="text" name="roadmapApproval" value={formData.roadmapApproval || ''} onChange={handleChange} /></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Conducting Company Assignments (Ask for 2 assignments a month)</Form.Label><Form.Control type="text" name="companyAssignments" value={formData.companyAssignments || ''} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <Row>
                 <Col md={6}><Form.Group className="mb-3"><Form.Label>ASE Mock Interview (After50% & 100%) completion</Form.Label><Form.Control type="text" name="aseMockInterview" value={formData.aseMockInterview || ''} onChange={handleChange} /></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>External Mock Interview (After 100% completion)</Form.Label><Form.Control type="text" name="externalMockInterview" value={formData.externalMockInterview || ''} onChange={handleChange} /></Form.Group></Col>
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

// Tech Stack Mapping Form Component - For individual mappings within a company
const TechMappingForm = ({ 
    mapping = {}, 
    index, 
    onChange, 
    onRemove, 
    techStackOptions, 
    techStackProgress,
    isRemovable = true
}) => {
    // Initialize with empty values if not provided
    const data = {
        techProgress: [],
        mappingOffers: 0,
        technologies: '',
        internshipStartDate: null,
        stackCompletionDate: null,
        internshipDuration: '',
        stipendPerMonth: 0,
        location: '',
        ...mapping
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onChange(index, { ...data, [name]: value });
    };

    const handleNumberInputChange = (e) => {
        const { name, value } = e.target;
        if (value === '' || !isNaN(Number(value))) {
            onChange(index, { ...data, [name]: value === '' ? 0 : Number(value) });
        }
    };

    const handleDateChange = (date, name) => {
        onChange(index, { ...data, [name]: date });
    };

    const handleTechStackDropdownSelect = (selectedNames) => {
        const newTechProgress = selectedNames.map(name => {
            const existing = (data.techProgress || []).find(tp => tp.techStackName === name);
            return existing || { techStackName: name, manualProgress: null };
        });
        
        onChange(index, { ...data, techProgress: newTechProgress });
    };
    
    const handleProgressChange = (techStackName, manualValue) => {
        const newTechProgress = (data.techProgress || []).map(tp => 
            tp.techStackName === techStackName 
            ? { ...tp, manualProgress: manualValue === '' ? null : Number(manualValue) } 
            : tp
        );
        
        onChange(index, { ...data, techProgress: newTechProgress });
    };

    // Format stipend with commas
    const formatStipend = (value) => {
        if (!value) return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleStipendChange = (e) => {
        // Remove commas and validate as number
        const value = e.target.value.replace(/,/g, '');
        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
            onChange(index, { ...data, stipendPerMonth: value === '' ? 0 : Number(value) });
        }
    };

    return (
        <div className={`tech-mapping-form p-3 ${index > 0 ? 'border-top mt-4' : ''}`}>
            {index > 0 && (
                <div className="d-flex justify-content-between mb-3">
                    <h6 className="text-muted">Mapping #{index + 1}</h6>
                    {isRemovable && (
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => onRemove(index)}
                            title="Remove this mapping"
                        >
                            <i className="fas fa-times"></i> Remove Mapping
                        </Button>
                    )}
                </div>
            )}
            
            <Row className="mb-3">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Mapping Offers</Form.Label>
                        <Form.Control 
                            type="number" 
                            name="mappingOffers" 
                            value={data.mappingOffers || 0} 
                            onChange={handleNumberInputChange} 
                            min="0"
                        />
                    </Form.Group>
                </Col>
                <Col md={9}>
                    <Form.Group>
                    <Form.Label>Technologies</Form.Label>
                        <Form.Control 
                            type="text" 
                            name="technologies" 
                            value={data.technologies || ''} 
                            onChange={handleInputChange} 
                            placeholder="Brief description of technologies (e.g., MERN Stack, Java Spring)"
                        />
                    </Form.Group>
                </Col>
            </Row>
            
            <Row className="mb-3">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Internship Start</Form.Label>
                        <DatePicker 
                            selected={data.internshipStartDate ? new Date(data.internshipStartDate) : null} 
                            onChange={(date) => handleDateChange(date, 'internshipStartDate')} 
                            className="form-control" 
                            placeholderText="Select date" 
                            showMonthDropdown 
                            showYearDropdown 
                            dropdownMode="select"
                        />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Stack Completion</Form.Label>
                        <DatePicker 
                            selected={data.stackCompletionDate ? new Date(data.stackCompletionDate) : null} 
                            onChange={(date) => handleDateChange(date, 'stackCompletionDate')} 
                            className="form-control" 
                            placeholderText="Select date" 
                            showMonthDropdown 
                            showYearDropdown 
                            dropdownMode="select"
                        />
                    </Form.Group>
                </Col>
                <Col md={2}>
                    <Form.Group>
                        <Form.Label>Duration</Form.Label>
                        <Form.Select 
                            name="internshipDuration" 
                            value={data.internshipDuration || ''} 
                            onChange={handleInputChange}
                        >
                            <option value="">Select Duration</option>
                            <option value="6 Months">6 Months</option>
                            <option value="6 Mth to 1 Yr">6 Mth to 1 Yr</option>
                            <option value="1 Yr+">1 Yr+</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={2}>
                    <Form.Group>
                        <Form.Label>Stipend Per Month</Form.Label>
                        <InputGroup>
                            <InputGroup.Text>₹</InputGroup.Text>
                            <Form.Control 
                                type="text" 
                                name="stipendPerMonth" 
                                value={formatStipend(data.stipendPerMonth)} 
                                onChange={handleStipendChange} 
                                placeholder="0"
                            />
                        </InputGroup>
                    </Form.Group>
                </Col>
                <Col md={2}>
                    <Form.Group>
                        <Form.Label>Location</Form.Label>
                        <Form.Select 
                            name="location" 
                            value={data.location || ''} 
                            onChange={handleInputChange}
                        >
                            <option value="">Select Location</option>
                            {locationOptions.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>
            
            <Row>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Tech Stacks</Form.Label>
                        <TechStackDropdown 
                            techStacks={techStackOptions}
                            selectedTechStacks={(data.techProgress || []).map(tp => tp.techStackName)}
                            onSelect={handleTechStackDropdownSelect}
                            isFormField={true}
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    {(data.techProgress || []).length > 0 && <Form.Label>Tech Stacks Progress (Editable)</Form.Label>}
                    <div style={{maxHeight: '130px', overflowY: 'auto'}} className="px-1">
                        {(data.techProgress || []).map((tp, tpIndex) => {
                            const automaticProgressData = (techStackProgress || []).find(p => p.name === tp.techStackName);
                            const automaticProgress = automaticProgressData ? Math.round(automaticProgressData.completionPercentage) : 0;
                            const displayValue = tp.manualProgress !== null && tp.manualProgress !== undefined ? tp.manualProgress : automaticProgress;
                            
                            return (
                                <div className="d-flex align-items-center mb-2" key={tpIndex}>
                                    <div className="fw-medium text-truncate me-2" style={{flex: '1 1 120px'}} title={tp.techStackName}>{tp.techStackName}</div>
                                    <div className="d-flex align-items-center" style={{flex: '0 0 100px'}}>
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            value={displayValue}
                                            onChange={(e) => handleProgressChange(tp.techStackName, e.target.value)}
                                            min="0"
                                            max="100"
                                            title={`Automatic: ${automaticProgress}%`}
                                        />
                                        <span className="ms-1">%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Col>
            </Row>
        </div>
    );
};

// Main InternshipMasterForm Component
const InternshipMasterForm = ({ data, setData, techStackOptions, loading, techStackProgress }) => {
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberInputChange = (e) => {
        const { name, value } = e.target;
        // Only update if the value is a valid number or empty
        if (value === '' || !isNaN(Number(value))) {
            setData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
        }
    };

    // Handle changes to an individual mapping
    const handleMappingChange = (index, updatedMapping) => {
        setData(prev => {
            const newMappings = [...(prev.mappings || [])];
            newMappings[index] = updatedMapping;
            return { ...prev, mappings: newMappings };
        });
    };

    // Add a new mapping
    const handleAddMapping = () => {
        setData(prev => {
            const newMappings = [...(prev.mappings || []), {
                techProgress: [],
                mappingOffers: 0,
                technologies: '',
                internshipStartDate: null,
                stackCompletionDate: null,
                internshipDuration: '',
                stipendPerMonth: 0,
                location: ''
            }];
            return { ...prev, mappings: newMappings };
        });
    };

    // Remove a mapping
    const handleRemoveMapping = (index) => {
        setData(prev => {
            const newMappings = [...(prev.mappings || [])];
            newMappings.splice(index, 1);
            return { ...prev, mappings: newMappings };
        });
    };
    
    // Ensure we have at least one mapping
    useEffect(() => {
        if (!data.mappings || data.mappings.length === 0) {
            setData(prev => ({
                ...prev,
                mappings: [{
                    techProgress: [],
                    mappingOffers: 0,
                    technologies: '',
                    internshipStartDate: null,
                    stackCompletionDate: null,
                    internshipDuration: '',
                    stipendPerMonth: 0,
                    location: ''
                }]
            }));
        }
    }, [data.mappings, setData]);

    return (
        <Form>
            <Row className="g-3 mb-3">
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Companies</Form.Label>
                        <Form.Control 
                            type="text" 
                            name="companies" 
                            value={data.companies || ''} 
                            onChange={handleInputChange} 
                            placeholder="Enter company name" 
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Roles</Form.Label>
                        <Form.Control 
                            type="text" 
                            name="roles" 
                            value={data.roles || ''} 
                            onChange={handleInputChange} 
                            placeholder="Enter role title" 
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Total Offers</Form.Label>
                        <Form.Control 
                            type="number" 
                            name="internshipOffers" 
                            value={data.internshipOffers || 0} 
                            onChange={handleNumberInputChange} 
                            min="0" 
                        />
                    </Form.Group>
                </Col>
            </Row>
            <Row className="g-3 mb-3">
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <Form.Select 
                            name="companyStatus" 
                            value={data.companyStatus || 'Active'} 
                            onChange={handleInputChange}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Hold">Hold</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
                {(data.companyStatus === 'Inactive' || data.companyStatus === 'Hold') && (
                    <Col md={8}>
                        <Form.Group>
                            <Form.Label>Reason</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={1} 
                                name="reasonInactive" 
                                value={data.reasonInactive || ''} 
                                onChange={handleInputChange} 
                                placeholder={`Reason if ${data.companyStatus?.toLowerCase()}`} 
                            />
                        </Form.Group>
                    </Col>
                )}
            </Row>
            <Row className="g-3 mb-4">
                <Col md={12}>
                    <Form.Group>
                        <Form.Label>Student Mapping Method</Form.Label>
                        <Form.Control 
                            type="text" 
                            name="studentMappingMethod" 
                            value={data.studentMappingMethod || ''} 
                            onChange={handleInputChange} 
                            placeholder="e.g., Internal Evaluation" 
                        />
                    </Form.Group>
                </Col>
            </Row>

            {/* Tech Stack Mappings Section */}
            <div className="border rounded p-3 bg-light">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Tech Stack Mappings</h5>
                    <span className="text-muted">Total: {(data.mappings || []).length}</span>
                </div>

                {/* Individual Mapping Forms */}
                {(data.mappings || []).map((mapping, index) => (
                    <TechMappingForm
                        key={index}
                        mapping={mapping}
                        index={index}
                        onChange={handleMappingChange}
                        onRemove={handleRemoveMapping}
                        techStackOptions={techStackOptions}
                        techStackProgress={techStackProgress}
                        isRemovable={index > 0} // First mapping can't be removed
                    />
                ))}

                <div className="text-center mt-3">
                    <Button 
                        variant="outline-primary" 
                        onClick={handleAddMapping}
                        className="px-4"
                    >
                        <i className="fas fa-plus me-2"></i>Add Another Mapping
                    </Button>
                </div>
            </div>
        </Form>
    );
};

// Student Wise Progress Component
const StudentWiseProgress = ({ user, techStackProgressMap }) => {
    const [consolidatedData, setConsolidatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch consolidated data from companywise-students-progress
    const fetchConsolidatedData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await internshipsTrackerService.getSheetData('companywise-students-progress');
            const rawData = response.data || [];
            
            // Group by student (NIAT ID) and consolidate
            const studentMap = new Map();
            
            rawData.forEach(item => {
                const key = item.niatId || `temp-${item.studentName}`;
                
                if (!studentMap.has(key)) {
                    studentMap.set(key, {
                        niatId: item.niatId,
                        studentName: item.studentName,
                        companyName: item.companyName,
                        roleName: item.roleName,
                        roleDeadline: item.roleDeadline,
                        techStacks: [],
                        overallProgress: 0
                    });
                }
                
                const student = studentMap.get(key);
                
                // Add tech stacks
                if (item.techAssignments && item.techAssignments.length > 0) {
                    item.techAssignments.forEach(assignment => {
                        if (assignment.techStackName) {
                            const progress = techStackProgressMap.get(assignment.techStackName) || 0;
                            student.techStacks.push({
                                name: assignment.techStackName,
                                progress: Math.round(progress),
                                deadline: assignment.deadline
                            });
                        }
                    });
                }
            });
            
            // Calculate overall progress for each student
            const consolidatedArray = Array.from(studentMap.values()).map(student => {
                if (student.techStacks.length > 0) {
                    const totalProgress = student.techStacks.reduce((sum, ts) => sum + ts.progress, 0);
                    student.overallProgress = Math.round(totalProgress / student.techStacks.length);
                }
                return student;
            });
            
            setConsolidatedData(consolidatedArray);
        } catch (err) {
            setError('Failed to load student progress data.');
        } finally {
            setLoading(false);
        }
    }, [techStackProgressMap]);

    useEffect(() => {
        fetchConsolidatedData();
    }, [fetchConsolidatedData]);

    // Filter and paginate data
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return consolidatedData;
        
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        return consolidatedData.filter(student => 
            (student.niatId && student.niatId.toLowerCase().includes(lowerSearchTerm)) ||
            (student.studentName && student.studentName.toLowerCase().includes(lowerSearchTerm)) ||
            (student.companyName && student.companyName.toLowerCase().includes(lowerSearchTerm)) ||
            (student.roleName && student.roleName.toLowerCase().includes(lowerSearchTerm))
        );
    }, [consolidatedData, searchTerm]);
    
    const paginatedData = useMemo(() => {
        if (loading) return [];
        
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage, loading]);

    // Export to CSV
    const handleExportCSV = () => {
        if (filteredData.length === 0) {
            alert("No data to export.");
            return;
        }
        
        const exportData = filteredData.map(student => ({
            "NIAT ID": student.niatId || '',
            "Student Name": student.studentName || '',
            "Company Name": student.companyName || '',
            "Role Name": student.roleName || '',
            "Role Deadline": student.roleDeadline ? new Date(student.roleDeadline).toLocaleDateString() : '',
            "Overall Techstacks Progress": `${student.overallProgress}%`,
            "Tech Stacks": student.techStacks.map(ts => `${ts.name} (${ts.progress}%)`).join('; ')
        }));
        
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Student_Wise_Progress.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Pagination Controls
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
                    <Form.Select
                        size="sm"
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                        style={{width: '75px'}}
                    >
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

    const getProgressColorClass = (percentage) => {
        if (percentage >= 75) return 'bg-success';
        if (percentage >= 50) return 'bg-warning';
        return 'bg-danger';
    };

    return (
        <div className="py-3">
            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}
            
            <Card className="mb-4">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h5 className="mb-0">Student Wise Progress Overview</h5>
                        <div className="d-flex gap-2">
                            <div className="input-group input-group-sm" style={{ width: '250px' }}>
                                <Form.Control
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button 
                                        variant="outline-secondary"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <i className="fas fa-times"></i>
                                    </Button>
                                )}
                            </div>
                            
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={handleExportCSV}
                            >
                                <i className="fas fa-download me-1"></i> Export
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2">Loading data...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">No student records found.</p>
                        </div>
                    ) : (
                        <div className="table-responsive-scroll">
                            <Table striped bordered hover className="align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{width: '15%'}}>NIAT ID</th>
                                        <th style={{width: '20%'}}>Student Name</th>
                                        <th style={{width: '20%'}}>Company Name</th>
                                        <th style={{width: '20%'}}>Role Name</th>
                                        <th style={{width: '15%'}}>Role Deadline</th>
                                        <th style={{width: '25%'}}>Overall Techstacks Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((student, index) => (
                                        <tr key={`${student.niatId}-${index}`}>
                                            <td>
                                                <div className="fw-medium">{student.niatId || 'N/A'}</div>
                                            </td>
                                            <td>
                                                <div className="fw-medium">{student.studentName || 'N/A'}</div>
                                            </td>
                                            <td>
                                                <div className="fw-medium">{student.companyName || 'N/A'}</div>
                                            </td>
                                            <td>
                                                <div className="fw-medium">{student.roleName || 'N/A'}</div>
                                            </td>
                                            <td>
                                                <div className="fw-medium">
                                                    {student.roleDeadline ? new Date(student.roleDeadline).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="progress flex-grow-1" style={{height: '10px', minWidth: '150px', backgroundColor: '#f8f9fa'}}>
                                                        <div 
                                                            className={`progress-bar ${getProgressColorClass(student.overallProgress)}`}
                                                            style={{
                                                                width: `${student.overallProgress}%`,
                                                                fontSize: '12px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {student.overallProgress}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
                
                <Card.Footer className="bg-light border-top">
                    <PaginationControls />
                </Card.Footer>
            </Card>
        </div>
    );
};

const InternshipsTracker = () => {
    const { user } = useAuth();
    const [activeSheet, setActiveSheet] = useState('internship-master');
    const [sheetData, setSheetData] = useState([]);
    const [companyProgressData, setCompanyProgressData] = useState([]);
    const [techStackOptions, setTechStackOptions] = useState([]);
    const [techStackProgress, setTechStackProgress] = useState([]);
    const [techStackProgressMap, setTechStackProgressMap] = useState(new Map());
    const [loading, setLoading] = useState(false);
    const [instructors, setInstructors] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [newRowData, setNewRowData] = useState({});
    const [searchTerm, setSearchTerm] = useState(''); // Added search term state
    
    // --- START CSV UPLOAD STATE ---
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTargetSheet, setUploadTargetSheet] = useState('');
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvError, setCsvError] = useState('');
    const [uploadingCsv, setUploadingCsv] = useState(false);
    const fileInputRef = useRef(null);
    // --- END CSV UPLOAD STATE ---

    const initialNewInternshipState = useMemo(() => ({
        companies: '', 
        roles: '', 
        internshipOffers: 1, 
        companyStatus: 'Active', 
        reasonInactive: '', 
        studentMappingMethod: '',
        studentMappingCounts: 0,
        mappings: [{
            techProgress: [],
            mappingOffers: 0,
            technologies: '',
            internshipStartDate: null,
            stackCompletionDate: null,
            internshipDuration: '',
            stipendPerMonth: 0,
            location: ''
        }]
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
        if (activeSheet !== 'companywise-students-progress' && activeSheet !== 'student-wise-progress') {
            fetchData(activeSheet);
        }
        setCurrentPage(1);
        setSearchTerm(''); // Reset search term when changing sheets
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
                
                // Create tech stack progress map
                const progressMap = new Map();
                (timelineStatsRes.techStackProgress || []).forEach(ts => {
                    progressMap.set(ts.name, ts.completionPercentage);
                });
                setTechStackProgressMap(progressMap);
            } catch (err) {
                setError("Failed to load initial data.");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);
    
    const handleAction = useCallback(async (actionFunc, ...args) => {
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            await actionFunc(...args);
            return true; 
        } catch(err) {
            const defaultMessage = `An error occurred.`;
            setError(err.response?.data?.error || err.message || defaultMessage);
            return false;
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
    }, [activeSheet, newRowData, handleAction, fetchData, setError]);
    
    const handleAddNewInternship = useCallback(async () => {
        if (!newInternship.companies?.trim()) {
            setError("Company name is required.");
            return;
        }
        
        // Validate each mapping has at least one tech stack
        const invalidMapping = (newInternship.mappings || []).find(
            mapping => !mapping.techProgress || mapping.techProgress.length === 0
        );
        
        if (invalidMapping) {
            setError("Each mapping must have at least one tech stack selected.");
            return;
        }
        
        await handleAction(async () => {
            const wasSuccessful = await internshipsTrackerService.createSheetRow(activeSheet, newInternship);
            if (wasSuccessful) {
                setNewInternship(initialNewInternshipState);
                setShowEditModal(false); 
                fetchData(activeSheet);
            }
        });
    }, [handleAction, newInternship, initialNewInternshipState, activeSheet, fetchData]);

    const handleOpenEditModal = (rowData, sheet) => {
        if (sheet === 'internship-master') {
            // Ensure mappings array exists (for backward compatibility)
            const preparedData = { ...rowData };
            
            // If there are no mappings yet, create initial structure from legacy fields
            if (!preparedData.mappings || preparedData.mappings.length === 0) {
                preparedData.mappings = [{
                    techProgress: preparedData.techProgress || [],
                    mappingOffers: 0,
                    technologies: '',
                    internshipStartDate: preparedData.internshipStartDate || null,
                    stackCompletionDate: preparedData.stackCompletionDate || null,
                    internshipDuration: '',
                    stipendPerMonth: 0,
                    location: ''
                }];
            }
            
            setEditingInternship(JSON.parse(JSON.stringify(preparedData)));
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

    // Format stipend with commas for display
    const formatStipend = (value) => {
        if (!value) return 'N/A';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // --- START CSV UPLOAD FUNCTIONS ---
    const handleOpenUploadModal = (sheetKey) => {
        setUploadTargetSheet(sheetKey);
        setCsvData([]);
        setCsvHeaders([]);
        setCsvError('');
        setCsvFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        setShowUploadModal(true);
    };

    const handleCloseUploadModal = () => {
        setShowUploadModal(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
            setCsvError('');
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setCsvHeaders(results.meta.fields || []);
                    setCsvData(results.data);
                },
                error: (err) => {
                    setCsvError('Failed to parse CSV file: ' + err.message);
                }
            });
        } else {
            setCsvFile(null);
            setCsvData([]);
            setCsvHeaders([]);
            setCsvError('Please upload a valid CSV file.');
        }
    };
    
    const handleSaveCsvData = async () => {
        if (!csvData.length || !uploadTargetSheet) return;

        setUploadingCsv(true);
        setCsvError('');
        setSuccess('');
        try {
            await internshipsTrackerService.bulkUploadSheetData(uploadTargetSheet, csvData);
            await fetchData(uploadTargetSheet); // Refresh data for the current sheet
            setSuccess('CSV data uploaded successfully!');
            setTimeout(() => handleCloseUploadModal(), 1500);
        } catch (err) {
            setCsvError('Upload failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploadingCsv(false);
        }
    };
    // --- END CSV UPLOAD FUNCTIONS ---

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
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 p-2">
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

    // Export Internship Master data to CSV
    const handleExportInternshipMasterCSV = () => {
        if (sheetData.length === 0) {
            alert("No data to export.");
            return;
        }
        
        // Flatten the nested mappings structure for CSV export
        const csvRows = sheetData.flatMap(company => {
            // If no mappings, create a single row
            if (!company.mappings || company.mappings.length === 0) {
                return [{
                    "COMPANIES": company.companies || '',
                    "ROLES": company.roles || '',
                    "OFFERS": company.internshipOffers || 0,
                    "STATUS": company.companyStatus || '',
                    "REASON (INACTIVE/HOLD)": company.reasonInactive || '',
                    "MAPPING METHOD": company.studentMappingMethod || '',
                    "MAPPING COUNTS": company.studentMappingCounts || 0,
                    "MAPPING OFFERS": 0,
                    "TECH STACKS & PROGRESS": '',
                    "TECHNOLOGIES": '',
                    "INTERNSHIP START": '',
                    "STACK COMPLETION": '',
                    "INTERNSHIP DURATION": '',
                    "STIPEND PER MONTH": '',
                    "LOCATION": ''
                }];
            }
            
            // Create a row for each mapping
            return (company.mappings || []).map(mapping => {
                // Format tech stack progress
                const techStacksProgress = (mapping.techProgress || [])
                    .map(tp => {
                        const progress = tp.manualProgress !== null && tp.manualProgress !== undefined 
                            ? tp.manualProgress 
                            : 0;
                        return `${tp.techStackName} (${progress}%)`;
                    })
                    .join(';');
                
                return {
                    "COMPANIES": company.companies || '',
                    "ROLES": company.roles || '',
                    "OFFERS": company.internshipOffers || 0,
                    "STATUS": company.companyStatus || '',
                    "REASON (INACTIVE)": company.reasonInactive || '',
                    "MAPPING METHOD": company.studentMappingMethod || '',
                    "MAPPING COUNTS": company.studentMappingCounts || 0,
                    "MAPPING OFFERS": mapping.mappingOffers || 0,
                    "TECH STACKS & PROGRESS": techStacksProgress,
                    "TECHNOLOGIES": mapping.technologies || '',
                    "INTERNSHIP START": mapping.internshipStartDate ? new Date(mapping.internshipStartDate).toLocaleDateString('en-CA') : '',
                    "STACK COMPLETION": mapping.stackCompletionDate ? new Date(mapping.stackCompletionDate).toLocaleDateString('en-CA') : '',
                    "INTERNSHIP DURATION": mapping.internshipDuration || '',
                    "STIPEND PER MONTH": mapping.stipendPerMonth || 0,
                    "LOCATION": mapping.location || ''
                };
            });
        });
        
        const csv = Papa.unparse(csvRows, { header: true });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Internship_Master.csv');
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
                <Card.Header as="h6" className="bg-light d-flex justify-content-between align-items-center">
                    Add New Entry to "{config.name}"
                    <Button variant="outline-success" size="sm" onClick={() => handleOpenUploadModal(sheetKey)}>
                        <i className="fas fa-file-csv me-2"></i>Upload CSV
                    </Button>
                </Card.Header>
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
    
    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm || !searchTerm.trim()) return sheetData;
        
        const term = searchTerm.toLowerCase();
        
        return sheetData.filter(item => {
            if (activeSheet === 'internship-master') {
                return (
                    (item.companies && item.companies.toLowerCase().includes(term)) ||
                    (item.roles && item.roles.toLowerCase().includes(term)) ||
                    (item.studentMappingMethod && item.studentMappingMethod.toLowerCase().includes(term))
                );
            } else if (activeSheet === 'tech-stack-roadmaps') {
                return (
                    (item.techStack && item.techStack.toLowerCase().includes(term)) ||
                    (item.techStackRp && item.techStackRp.toLowerCase().includes(term)) ||
                    (Array.isArray(item.instructors) && item.instructors.some(instr => instr.toLowerCase().includes(term)))
                );
            }
            return false;
        });
    }, [sheetData, searchTerm, activeSheet]);
    
    const paginatedData = useMemo(() => {
        if (loading) return [];
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, rowsPerPage, loading]);

    // Render tech stack mapping display row
    const renderTechStackMapping = (company, mapping, index) => {
        // Only show company info in first mapping row
        const isFirstMapping = index === 0;
        
        // Get the tech stack progress info
        const techStacksDisplay = (mapping.techProgress || []).map(tp => {
            const progressData = techStackProgress.find(p => p.name === tp.techStackName);
            const progressValue = tp.manualProgress ?? (progressData ? Math.round(progressData.completionPercentage) : 0);
            return (
                <div key={tp.techStackName} className="d-flex align-items-center my-1">
                    <span className="me-2 text-truncate" style={{maxWidth:'100px'}}>{tp.techStackName}</span>
                    <span className={`ms-auto small fw-bold ${getProgressColorClass(progressValue)}`}>{progressValue}%</span>
                </div>
            );
        });
        
        return (
            <tr key={`${company._id}-mapping-${index}`} className={!isFirstMapping ? "bg-light" : ""}>
                {isFirstMapping && (
                    <>
                        <td rowSpan={company.mappings?.length || 1}>{company.companies}</td>
                        <td rowSpan={company.mappings?.length || 1}>{company.roles}</td>
                        <td rowSpan={company.mappings?.length || 1}>{company.internshipOffers}</td>
                        <td rowSpan={company.mappings?.length || 1}>
                        <span className={`badge ${
    company.companyStatus === 'Active' ? 'bg-success' : 
    company.companyStatus === 'Hold' ? 'bg-warning' : 
    'bg-secondary'
}`}>
    {company.companyStatus}
</span>
                        </td>
                        <td rowSpan={company.mappings?.length || 1} style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
    {(company.companyStatus === 'Inactive' || company.companyStatus === 'Hold') ? company.reasonInactive : 'N/A'}
</td>
                        <td rowSpan={company.mappings?.length || 1}>{company.studentMappingMethod}</td>
                        <td rowSpan={company.mappings?.length || 1}>{company.studentMappingCounts}</td>
                    </>
                )}
                <td>{mapping.mappingOffers}</td>
                <td style={{minWidth: '200px'}}>{techStacksDisplay}</td>
                <td>{mapping.technologies || 'N/A'}</td>
                <td>{mapping.internshipStartDate ? new Date(mapping.internshipStartDate).toLocaleDateString() : 'N/A'}</td>
                <td>{mapping.stackCompletionDate ? new Date(mapping.stackCompletionDate).toLocaleDateString() : 'N/A'}</td>
                <td>{mapping.internshipDuration || 'N/A'}</td>
                <td>{formatStipend(mapping.stipendPerMonth)}</td>
                <td>{mapping.location || 'N/A'}</td>
                {user.role === 'admin' && isFirstMapping && (
                    <td rowSpan={company.mappings?.length || 1} className="text-center">
                        <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleOpenEditModal(company, 'internship-master')} 
                            className="me-2" 
                            title="Edit Company"
                        >
                            <i className="fas fa-edit"></i>
                        </Button>
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => openDeleteRowModal(company._id)} 
                            title="Delete Company"
                        >
                            <i className="fas fa-trash"></i>
                        </Button>
                    </td>
                )}
            </tr>
        );
    };
    
    const renderActiveSheet = () => {
        const { columns, name } = subsheetConfigs[activeSheet] || {};
        const config = subsheetConfigs[activeSheet];

        if (loading) {
            return (<div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2 text-muted">Loading data...</p></div>);
        }
        
        // --- ADD ACTION BUTTONS TO CARD HEADER ---
        const cardHeader = (title, showAddButton = true, showUploadButton = true, showExportButton = true, onAddClick = null, onUploadClick = null, onExportClick = null) => (
            <Card.Header as="h6" className="bg-light d-flex justify-content-between align-items-center">
                {title}
                <div className="d-flex gap-2">
                    {/* Search input box for Internship Master */}
                    {activeSheet === 'internship-master' && (
                        <div className="input-group input-group-sm" style={{ width: '250px' }}>
                            <Form.Control
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <Button 
                                    variant="outline-secondary"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <i className="fas fa-times"></i>
                                </Button>
                            )}
                        </div>
                    )}

                    {showExportButton && (
                        <Button variant="outline-primary" size="sm" onClick={onExportClick} title="Export as CSV">
                            <i className="fas fa-download me-2"></i>Export
                        </Button>
                    )}
                    {showUploadButton && user.role === 'admin' && (
                        <Button variant="outline-success" size="sm" onClick={onUploadClick}>
                            <i className="fas fa-file-csv me-2"></i>Upload CSV
                        </Button>
                    )}
                    {showAddButton && user.role === 'admin' && (
                        <Button variant="primary" size="sm" onClick={onAddClick}>
                            <i className="fas fa-plus me-2"></i>Add
                        </Button>
                    )}
                </div>
            </Card.Header>
        );

        if (activeSheet === 'companywise-students-progress') return <CompanywiseStudentsProgress user={user} />;
        
        if (activeSheet === 'student-wise-progress') {
            return <StudentWiseProgress user={user} techStackProgressMap={techStackProgressMap} />;
        }
        
        if (activeSheet === 'internship-master') { 
            return (
               <div>
                    <Card className="shadow-sm">
                       {cardHeader(
                           config.name, 
                           true, 
                           true, 
                           true, 
                           () => { setEditingInternship(null); setShowEditModal(true); }, 
                           () => handleOpenUploadModal(activeSheet),
                           handleExportInternshipMasterCSV
                       )}
                       <Card.Body className="p-0">
                           <div className="table-responsive table-container-scroll">
                               <Table striped bordered hover size="sm" className="align-middle">
                                   <thead className="table-light">
                                       <tr>
                                           <th>Companies</th>
                                           <th>Roles</th>
                                           <th>Offers</th>
                                           <th>Status</th>
                                           <th>Reason (Inactive)</th>
                                           <th>Mapping Method</th>
                                           <th>Mapping Counts</th>
                                           <th>Mapping Offers</th>
                                           <th>Tech Stacks & Progress</th>
                                           <th>Technologies</th>
                                           <th>Internship Start</th>
                                           <th>Stack Completion</th>
                                           <th>Internship Duration</th>
                                           <th>Stipend Per Month</th>
                                           <th>Location</th>
                                           {user.role === 'admin' && <th className="text-center">Actions</th>}
                                       </tr>
                                   </thead>
                                   <tbody>
                                       {paginatedData.length === 0 && !loading && (
                                           <tr>
                                               <td colSpan={user.role === 'admin' ? 16 : 15} className="text-center text-muted py-4">
                                                   No data.
                                               </td>
                                           </tr>
                                       )}
                                       
                                       {paginatedData.map(company => {
                                           // Check if company has mappings
                                           if (company.mappings && company.mappings.length > 0) {
                                               // Render a row for each mapping
                                               return company.mappings.map((mapping, idx) => 
                                                   renderTechStackMapping(company, mapping, idx)
                                               );
                                           } else {
                                               // Backward compatibility - render legacy data structure
                                               const legacyMapping = {
                                                   techProgress: company.techProgress || [],
                                                   mappingOffers: 0,
                                                   technologies: '',
                                                   internshipStartDate: company.internshipStartDate,
                                                   stackCompletionDate: company.stackCompletionDate,
                                                   internshipDuration: company.internshipDuration || '',
                                                   stipendPerMonth: company.stipendPerMonth || 0,
                                                   location: company.location || ''
                                               };
                                               
                                               return renderTechStackMapping(company, legacyMapping, 0);
                                           }
                                       })}
                                   </tbody>
                               </Table>
                           </div>
                       </Card.Body>
                       <Card.Footer className="bg-light"><PaginationControls totalRows={filteredData.length} /></Card.Footer>
                   </Card>
                </div>
           );
       }

       if (activeSheet === 'tech-stack-roadmaps') { 
           return (
               <div>
                    <Card className="shadow-sm">
                       {cardHeader(config.name, true, true, false, () => { setEditingTechStackRoadmap(null); setShowTechStackRoadmapModal(true); }, () => handleOpenUploadModal(activeSheet))}
                       <Card.Body className="p-0">
                           <div className="table-container-scroll">
                               <EditableTable columns={columns} data={paginatedData} onSave={user.role === 'admin' ? handleSaveRow : undefined} onDelete={user.role === 'admin' ? openDeleteRowModal : undefined} isLoading={actionLoading} allowAdd={false} activeSheet={activeSheet} />
                           </div>
                       </Card.Body>
                       <Card.Footer className="bg-light"><PaginationControls totalRows={filteredData.length} /></Card.Footer>
                   </Card>
                </div>
           );
       }
   };
   
   return (
       <div className="container-fluid p-md-1">
           <Card className="border-0 shadow-sm">
               <Card.Header>
                   <Nav variant="tabs" activeKey={activeSheet} onSelect={(k) => setActiveSheet(k)} className="nav-fill">
                       {Object.entries(subsheetConfigs).map(([key, config]) => (<Nav.Item key={key}><Nav.Link eventKey={key}>{config.name}</Nav.Link></Nav.Item>))}
                   </Nav>
               </Card.Header>
               <Card.Body>
                   {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                   {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                   {renderActiveSheet()}
               </Card.Body>
           </Card>

           <Modal show={showUploadModal} onHide={handleCloseUploadModal} size="xl" centered>
               <Modal.Header closeButton>
                   <Modal.Title><i className="fas fa-file-csv me-2"></i>Upload CSV for "{subsheetConfigs[uploadTargetSheet]?.name}"</Modal.Title>
               </Modal.Header>
               <Modal.Body>
                   {csvError && <Alert variant="danger" className="py-2 small">{csvError}</Alert>}
                   {success && <Alert variant="success" className="py-2 small">{success}</Alert>}
                   <Form.Group controlId="formFile" className="mb-3">
                       <Form.Label>Select CSV file</Form.Label>
                       <Form.Control type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
                   </Form.Group>
                   {csvData.length > 0 && (
                       <div>
                           <h6>Preview Data ({csvData.length} rows)</h6>
                           <div className="table-responsive" style={{ maxHeight: '40vh', overflowY: 'auto' }}><Table striped bordered size="sm">
                               <thead>
                                   <tr>
                                       {csvHeaders.map((header, index) => <th key={index}>{header}</th>)}
                                   </tr>
                               </thead>
                               <tbody>
                                   {csvData.map((row, rowIndex) => (
                                       <tr key={rowIndex}>{csvHeaders.map((header, colIndex) => <td key={colIndex} title={row[header]}>{row[header]}</td>)}
                                       </tr>
                                   ))}
                               </tbody>
                           </Table></div>
                       </div>
                   )}
               </Modal.Body>
               <Modal.Footer>
                   <Button variant="secondary" onClick={handleCloseUploadModal}>Cancel</Button>
                   <Button variant="primary" onClick={handleSaveCsvData} disabled={uploadingCsv || !csvData.length}>
                       {uploadingCsv ? <Spinner as="span" size="sm" /> : 'Save Data'}
                   </Button>
               </Modal.Footer>
           </Modal>
           
           <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl" centered>
               <Modal.Header closeButton>
                   <Modal.Title>{editingInternship ? 'Edit' : 'Add'} Internship Master</Modal.Title>
               </Modal.Header>
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
                   <Button 
                       variant="primary" 
                       onClick={() => editingInternship ? handleSaveFromModal('internship-master')(editingInternship) : handleAddNewInternship()} 
                       disabled={actionLoading}
                   >
                       {actionLoading ? <><Spinner size="sm" /> Saving...</> : (editingInternship ? 'Save Changes' : 'Add Internship')}
                   </Button>
               </Modal.Footer>
           </Modal>

           <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
               <Modal.Header closeButton>
                   <Modal.Title>Delete Row</Modal.Title>
               </Modal.Header>
               <Modal.Body>Are you sure you want to delete this item? This action cannot be undone.</Modal.Body>
               <Modal.Footer>
                   <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                   <Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>
                       {actionLoading ? <Spinner animation="border" size="sm" /> : 'Delete'}
                   </Button>
               </Modal.Footer>
           </Modal>

           <Modal show={showTechStackRoadmapModal} onHide={() => setShowTechStackRoadmapModal(false)} size="xl" centered>
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
               <Modal.Header closeButton>
                   <Modal.Title>Confirm Delete</Modal.Title>
               </Modal.Header>
               <Modal.Body>Are you sure you want to delete this tech stack roadmap?</Modal.Body>
               <Modal.Footer>
                   <Button variant="secondary" onClick={() => setShowDeleteTSRModal(false)}>Cancel</Button>
                   <Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>
                       {actionLoading? <Spinner size="sm" /> : 'Delete'}
                   </Button>
               </Modal.Footer>
           </Modal>
           
           <style>{`
               .table-container-scroll { 
                   max-height: 70vh; 
                   overflow-y: auto; 
               } 
               .table-container-scroll thead th { 
                   position: sticky; 
                   top: 0; 
                   z-index: 10; 
                   background-color: #f8f9fa; 
               }
               .tech-mapping-form {
                   background-color: #f8f9fa;
                   border-radius: 0.25rem;
               }
               .table-responsive-scroll { 
                   max-height: 70vh; 
                   overflow-y: auto; 
               }
               .table-responsive-scroll thead th { 
                   position: sticky; 
                   top: 0; 
                   background-color: #f8f9fa;
                   z-index: 1;
               }
               .progress-bar-custom {
                   height: 20px;
                   border-radius: 4px;
               }
               .react-datepicker-wrapper {
                   display: block;
                   width: 100%;
               }
               .progress {
                   background-color: #e9ecef;
                   border-radius: 0.375rem;
               }
               .progress-bar {
                   color: white;
                   text-align: center;
                   white-space: nowrap;
                   font-size: 12px;
                   line-height: 18px;
                   font-weight: 600;
               }
           `}</style>
       </div>
   );
};

export default InternshipsTracker;
