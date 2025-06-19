// client/src/pages/CompanywiseStudentsProgress.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Form, Button, Row, Col, InputGroup, Spinner, Alert, Table, Modal, Pagination } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Papa from 'papaparse';
import * as techStackService from '../services/techStackService';
import internshipsTrackerService from '../services/internshipsTrackerService.js';
import TechStackDropdown from '../components/TechStackDropdown/TechStackDropdown';
import EditableTable from '../components/EditableTable/EditableTable.jsx';
import statsService from '../services/statsService';

const CompanywiseStudentsProgress = ({ user }) => {
    const [companyName, setCompanyName] = useState('');
    const [roles, setRoles] = useState([{ id: 1, roleName: '', noOfOffers: 1, roleDeadline: null, selectedTechStacks: [], students: [{ id: 1, niatId: '', studentName: '', techAssignments: [] }] }]);
    const [techStackOptions, setTechStackOptions] = useState([]);
    const [savedData, setSavedData] = useState([]);
    const [techStackProgressMap, setTechStackProgressMap] = useState(new Map());

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const idCounter = useRef(Date.now());

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rowToDeleteId, setRowToDeleteId] = useState(null);
    
    const isAdmin = user && user.role === 'admin';

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
            const [techStacksRes, timelineStatsRes, companyProgressRes] = await Promise.all([
                techStackService.getAllTechStacks(),
                statsService.getTimelineStats(),
                fetchSavedData()
            ]);
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

    useEffect(() => {
        fetchDependencies();
        setCurrentPage(1); // Reset page on data load
    }, [fetchDependencies]);

    const getNextId = () => {
        idCounter.current += 1;
        return idCounter.current;
    };

    const handleAddRole = () => setRoles([...roles, { id: getNextId(), roleName: '', noOfOffers: 1, roleDeadline: null, selectedTechStacks: [], students: [{ id: getNextId(), niatId: '', studentName: '', techAssignments: [] }] }]);
    const handleRemoveRole = (roleId) => roles.length > 1 && setRoles(roles.filter(r => r.id !== roleId));
    const handleRoleChange = (roleId, field, value) => setRoles(roles.map(r => r.id === roleId ? { ...r, [field]: value } : r));
    
    const handleTechStackSelection = (roleId, selectedNames) => {
        setRoles(roles.map(r => {
            if (r.id === roleId) {
                const newStudents = r.students.map(student => ({
                    ...student,
                    techAssignments: selectedNames.map(name => {
                        const existing = student.techAssignments.find(a => a.techStackName === name);
                        return existing || { techStackName: name, deadline: null };
                    })
                }));
                return { ...r, selectedTechStacks: selectedNames, students: newStudents };
            }
            return r;
        }));
    };

    const handleAddStudent = (roleId) => {
        setRoles(roles.map(r => {
            if (r.id === roleId) {
                const techAssignments = r.selectedTechStacks.map(name => ({ techStackName: name, deadline: null }));
                return { ...r, students: [...r.students, { id: getNextId(), niatId: '', studentName: '', techAssignments }] };
            }
            return r;
        }));
        setCurrentPage(1); // Reset when student list structure changes
    };
    
    const handleRemoveStudent = (roleId, studentId) => {
        setRoles(prevRoles =>
            prevRoles.map(role => {
                if (role.id !== roleId) {
                    return role;
                }
                if (role.students.length <= 1) {
                    return role;
                }
                return {
                    ...role,
                    students: role.students.filter(student => student.id !== studentId)
                };
            })
        );
        setCurrentPage(1); // Reset when student list structure changes
    };

    const handleStudentChange = (roleId, studentId, field, value) => {
        setRoles(roles.map(r => r.id === roleId ? { ...r, students: r.students.map(s => s.id === studentId ? { ...s, [field]: value } : s) } : r));
    };

    const handleStudentTechDeadlineChange = (roleId, studentId, techStackName, deadline) => {
        setRoles(roles.map(r => r.id === roleId ? { ...r, students: r.students.map(s => s.id === studentId ? { ...s, techAssignments: s.techAssignments.map(a => a.techStackName === techStackName ? { ...a, deadline } : a) } : s) } : r));
    };

    const handleStudentPaste = (e, roleId, startStudentIndex) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const parsedRows = pasteData.split('\n').map(row => row.split('\t'));

        setRoles(prevRoles => {
            const newRoles = JSON.parse(JSON.stringify(prevRoles));
            const roleIndex = newRoles.findIndex(r => r.id === roleId);
            if (roleIndex === -1) return prevRoles;

            const targetRole = newRoles[roleIndex];
            const newStudents = targetRole.students;

            parsedRows.forEach((rowData, rowIndex) => {
                if (rowData.every(cell => cell.trim() === '')) return;

                const currentStudentIndex = startStudentIndex + rowIndex;
                
                if (currentStudentIndex >= newStudents.length) {
                    const techAssignments = targetRole.selectedTechStacks.map(name => ({ techStackName: name, deadline: null }));
                    newStudents.push({ id: getNextId(), niatId: '', studentName: '', techAssignments });
                }

                const studentToUpdate = newStudents[currentStudentIndex];
                
                if (rowData[0] !== undefined) {
                    studentToUpdate.niatId = rowData[0].trim();
                }
                if (rowData[1] !== undefined) {
                    studentToUpdate.studentName = rowData[1].trim();
                }

                targetRole.selectedTechStacks.forEach((tsName, tsIndex) => {
                    const deadlineDataIndex = tsIndex + 2;
                    if (rowData[deadlineDataIndex] !== undefined && rowData[deadlineDataIndex].trim()) {
                        const parsedDate = new Date(rowData[deadlineDataIndex].trim());
                        if (!isNaN(parsedDate.getTime())) {
                             const assignmentIndex = studentToUpdate.techAssignments.findIndex(a => a.techStackName === tsName);
                             if (assignmentIndex !== -1) {
                                studentToUpdate.techAssignments[assignmentIndex].deadline = parsedDate;
                             }
                        }
                    }
                });
            });

            newRoles[roleIndex].students = newStudents;
            return newRoles;
        });
    };

    const handleSave = async () => {
        if (!isAdmin) return;
        if (!companyName.trim()) return setError("Company Name is required.");
        
        const payload = roles.flatMap(role => {
            if (!role.roleName.trim()) {
                setError(`Role name is required for all roles.`);
                return [];
            }
            return role.students
                .filter(student => student.studentName.trim() || student.niatId.trim())
                .map(student => ({
                    companyName: companyName.trim(),
                    roleName: role.roleName.trim(),
                    noOfOffers: role.noOfOffers,
                    roleDeadline: role.roleDeadline,
                    niatId: student.niatId.trim(),
                    studentName: student.studentName.trim(),
                    completionStatus: 'In Progress',
                    techAssignments: student.techAssignments.filter(ta => ta.techStackName)
                }));
        });
        
        if (payload.length === 0) return setError("No student data to save.");

        setSaving(true);
        setError('');
        setSuccess('');
        try {
            for (const data of payload) {
                await internshipsTrackerService.createSheetRow('companywise-students-progress', data);
            }
            await fetchSavedData();
            // --- START OF FIX: Add success message and reset form ---
            setSuccess('Progress data saved successfully!');
            setCompanyName('');
            setRoles([{ id: 1, roleName: '', noOfOffers: 1, roleDeadline: null, selectedTechStacks: [], students: [{ id: 1, niatId: '', studentName: '', techAssignments: [] }] }]);
            // --- END OF FIX ---
        } catch (err) {
            setError("Failed to save data. " + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };
    
    const handleUpdateRow = async (id, updatedFlatData) => {
        setActionLoading(true);
        try {
            const techAssignments = [];
            let i = 1;
            while (updatedFlatData[`techStack${i}Name`]) {
                techAssignments.push({
                    techStackName: updatedFlatData[`techStack${i}Name`],
                    deadline: updatedFlatData[`techStack${i}Deadline`],
                });
                i++;
            }

            const reconstructedData = {
                companyName: updatedFlatData.companyName,
                roleName: updatedFlatData.roleName,
                roleDeadline: updatedFlatData.roleDeadline,
                noOfOffers: updatedFlatData.noOfOffers,
                niatId: updatedFlatData.niatId,
                studentName: updatedFlatData.studentName,
                completionStatus: updatedFlatData.completionStatus,
                techAssignments,
            };

            await internshipsTrackerService.updateSheetRow('companywise-students-progress', id, reconstructedData);
            await fetchSavedData();
        } catch (err) {
            setError("Failed to update row. " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleDeleteRowClick = (id) => {
        setRowToDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (rowToDeleteId) {
            setActionLoading(true);
            try {
                await internshipsTrackerService.deleteSheetRow('companywise-students-progress', rowToDeleteId);
                await fetchSavedData();
            } catch (err) {
                setError("Failed to delete row. " + (err.response?.data?.error || err.message));
            } finally {
                setShowDeleteModal(false);
                setRowToDeleteId(null);
                setActionLoading(false);
            }
        }
    };
    
    const finalTableColumns = useMemo(() => {
        const baseColumns = [
            { header: 'Company Name', field: 'companyName' },
            { header: 'Role Name', field: 'roleName' },
            { header: 'Role Deadline', field: 'roleDeadline', type: 'date' },
            { header: 'No of Offers', field: 'noOfOffers', type: 'number' },
            { header: 'NIAT ID', field: 'niatId' },
            { header: 'Student Name', field: 'studentName' },
        ];
        
        const endColumns = [
            { header: 'Completion Status', field: 'completionStatus' }
        ];

        const maxTechStacks = savedData.reduce((max, item) => Math.max(max, item.techAssignments?.length || 0), 0);

        const dynamicColumns = [];
        for (let i = 1; i <= maxTechStacks; i++) {
            dynamicColumns.push({ header: `Techstack ${i}`, field: `techStack${i}Name` });
            dynamicColumns.push({ header: `T${i} Progress`, field: `techStack${i}Progress`, type: 'progress' });
            dynamicColumns.push({ header: `T${i} Deadline`, field: `techStack${i}Deadline`, type: 'date' });
        }
        
        return [...baseColumns, ...dynamicColumns, ...endColumns];
    }, [savedData]);
    
    const tableData = useMemo(() => {
        if (!savedData) return [];
        return savedData.map(item => {
            let determinedStatus = item.completionStatus || 'In Progress';

            if (item.techAssignments && item.techAssignments.length > 0) {
                const isAllComplete = item.techAssignments.every(assignment => {
                    const progress = techStackProgressMap.get(assignment.techStackName);
                    return progress !== undefined && progress >= 100;
                });

                if (isAllComplete) {
                    determinedStatus = 'Completed';
                } else if (determinedStatus === 'Completed') {
                    determinedStatus = 'In Progress';
                }
            }
            
            const flatItem = {
                _id: item._id,
                companyName: item.companyName,
                roleName: item.roleName,
                roleDeadline: item.roleDeadline,
                noOfOffers: item.noOfOffers,
                niatId: item.niatId,
                studentName: item.studentName,
                completionStatus: determinedStatus,
            };
            item.techAssignments?.forEach((assignment, index) => {
                const techStackName = assignment.techStackName;
                flatItem[`techStack${index + 1}Name`] = techStackName;
                flatItem[`techStack${index + 1}Deadline`] = assignment.deadline;

                if (techStackName) {
                    flatItem[`techStack${index + 1}Progress`] = techStackProgressMap.get(techStackName) || 0;
                } else {
                    flatItem[`techStack${index + 1}Progress`] = null;
                }
            });
            return flatItem;
        });
    }, [savedData, techStackProgressMap]);

    const paginatedData = useMemo(() => {
        if (loading) return [];
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return tableData.slice(startIndex, endIndex);
    }, [tableData, currentPage, rowsPerPage, loading]);

    const PaginationControls = () => {
        const totalRows = tableData.length;
        if (totalRows === 0) return null;
    
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    
        const handleRowsPerPageChange = (e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1); // Reset to first page
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

    const handleExportCSV = () => {
        if (tableData.length === 0) {
            alert("No data to export.");
            return;
        }

        const headers = finalTableColumns.map(col => col.header);
        const rows = tableData.map(row => 
            finalTableColumns.map(col => {
                let value = row[col.field];
                if (col.type === 'date' && value) {
                    try {
                        value = new Date(value).toLocaleDateString('en-CA'); // YYYY-MM-DD
                    } catch (e) {
                        value = 'Invalid Date';
                    }
                }
                return value ?? ''; 
            })
        );

        const csv = Papa.unparse([headers, ...rows]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Consolidated_Progress_Overview.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="py-3">
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            {isAdmin && (
                <>
                    <Card className="mb-4">
                        <Card.Header as="h5">Company</Card.Header>
                        <Card.Body>
                            <Row className="g-3 align-items-end">
                                <Col md={8}>
                                    <Form.Group>
                                        <Form.Label>Company Name</Form.Label>
                                        <Form.Control type="text" placeholder="Enter Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Number of Roles</Form.Label>
                                        <InputGroup>
                                            <Button variant="outline-secondary" onClick={() => roles.length > 1 && setRoles(roles.slice(0, -1))} disabled={roles.length <= 1}>-</Button>
                                            <Form.Control type="text" readOnly value={roles.length} className="text-center" />
                                            <Button variant="outline-secondary" onClick={handleAddRole}>+</Button>
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {roles.map((role, index) => (
                        <Card key={role.id} className="mb-4" style={{ overflow: 'visible' }}>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h6>Role #{index + 1} Details</h6>
                                <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveRole(role.id)} disabled={roles.length <= 1} title="Remove Role">
                                <i className="fas fa-trash-alt fa-lg"></i>
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                <Row className="mb-3 g-3 align-items-end">
                                    <Col md={3}><Form.Group><Form.Label>Role Name</Form.Label><Form.Control type="text" placeholder="e.g., Frontend Developer" value={role.roleName} onChange={e => handleRoleChange(role.id, 'roleName', e.target.value)} /></Form.Group></Col>
                                    <Col md={2}><Form.Group><Form.Label>No of Offers</Form.Label><Form.Control type="number" value={role.noOfOffers} onChange={e => handleRoleChange(role.id, 'noOfOffers', e.target.value)} min="1" /></Form.Group></Col>
                                    <Col md={3}><Form.Group><Form.Label>Role Deadline</Form.Label><DatePicker selected={role.roleDeadline} onChange={date => handleRoleChange(role.id, 'roleDeadline', date)} className="form-control" placeholderText="Select Deadline" portalId="popup-portal" popperPlacement="bottom-start" /></Form.Group></Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Techstack Names</Form.Label>
                                            <TechStackDropdown techStacks={techStackOptions} selectedTechStacks={role.selectedTechStacks} onSelect={names => handleTechStackSelection(role.id, names)} loading={loading} isFormField={true} />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="border-top pt-3 mt-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0">Students for "{role.roleName || `Role #${index + 1}`}"</h6>
                                        <Button variant="success" size="sm" onClick={() => handleAddStudent(role.id)}><i className="fas fa-user-plus me-2"></i>Add Student</Button>
                                    </div>
                                    {role.selectedTechStacks.length > 0 ? (
                                        <Table striped bordered responsive size="sm" className="align-middle">
                                            <thead>
                                                <tr>
                                                    <th style={{width: '15%'}}>NIAT ID</th>
                                                    <th style={{width: '25%'}}>Student Name</th>
                                                    {role.selectedTechStacks.map(tsName => <th key={tsName}>{tsName} Deadline</th>)}
                                                    <th style={{ width: '50px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {role.students.map((student, sIndex) => (
                                                    <tr key={student.id}>
                                                        <td>
                                                            <Form.Control 
                                                                size="sm" 
                                                                type="text" 
                                                                value={student.niatId} 
                                                                onChange={e => handleStudentChange(role.id, student.id, 'niatId', e.target.value)}
                                                                onPaste={(e) => handleStudentPaste(e, role.id, sIndex)}
                                                            />
                                                        </td>
                                                        <td><Form.Control size="sm" type="text" value={student.studentName} onChange={e => handleStudentChange(role.id, student.id, 'studentName', e.target.value)} /></td>
                                                        {role.selectedTechStacks.map(tsName => {
                                                            const assignment = student.techAssignments.find(a => a.techStackName === tsName);
                                                            return (
                                                                <td key={tsName}>
                                                                    <DatePicker 
                                                                        selected={assignment?.deadline ? new Date(assignment.deadline) : null} 
                                                                        onChange={date => handleStudentTechDeadlineChange(role.id, student.id, tsName, date)} 
                                                                        className="form-control form-control-sm" 
                                                                        placeholderText="Set Date" 
                                                                        portalId="popup-portal" 
                                                                        popperPlacement="top-start" 
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="text-center"><Button variant="outline-danger" size="sm" onClick={() => handleRemoveStudent(role.id, student.id)} disabled={role.students.length <= 1} title="Remove Student"><i className="fas fa-trash"></i></Button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-muted text-center py-3">Please select Tech Stacks to assign deadlines to students.</div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    ))}

                    <div className="text-end mt-4">
                        <Button variant="primary" size="lg" onClick={handleSave} disabled={saving || !companyName.trim()}>
                            {saving ? <Spinner as="span" animation="border" size="sm" /> : <><i className="fas fa-save me-2"></i>Save All Progress Data</>}
                        </Button>
                    </div>
                </>
            )}
            
            <Card className="mt-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Consolidated Progress Overview</h5>
                    <Button variant="outline-success" size="sm" onClick={handleExportCSV} title="Export as CSV">
                        <i className="fas fa-download"></i>
                    </Button>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <div className="table-responsive-scroll">
                            <EditableTable
                                columns={finalTableColumns}
                                data={paginatedData}
                                onSave={isAdmin ? handleUpdateRow : undefined}
                                onDelete={isAdmin ? handleDeleteRowClick : undefined}
                                isLoading={actionLoading}
                                allowAdd={false}
                            />
                        </div>
                    )}
                </Card.Body>
                 <Card.Footer className="bg-light border-top">
                    <PaginationControls totalRows={tableData.length} />
                </Card.Footer>
            </Card>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Confirm Deletion</Modal.Title></Modal.Header>
                <Modal.Body>Are you sure you want to delete this row? This action cannot be undone.</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleConfirmDelete} disabled={actionLoading}>{actionLoading ? <Spinner animation="border" size="sm" /> : 'Delete'}</Button>
                </Modal.Footer>
            </Modal>
             <style>{`
                .table-responsive-scroll {
                    max-height: 70vh;
                    overflow: auto;
                }
                .table-responsive-scroll thead th {
                    position: sticky;
                    top: 0;
                    background-color: #f8f9fa; /* Ensure header has a background */
                }
            `}</style>
        </div>
    );
};

export default CompanywiseStudentsProgress;
