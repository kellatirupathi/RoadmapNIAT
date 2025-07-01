// client/src/pages/RoadmapsManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Spinner, Alert, Modal, Form, Badge, Card, Row, Col, InputGroup, Dropdown, ProgressBar, Tab, Nav, Pagination } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import * as roadmapService from '../services/roadmapService';
import userService from '../services/userService';
import CreateRoadmapModal from '../components/CreateRoadmapModal/CreateRoadmapModal';
import TechStackTable from '../components/TechStackTable/TechStackTable';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Papa from 'papaparse'; // **Import papaparse for CSV generation**

// Helper component for displaying lists with a dropdown for overflow
const OverflowDropdownDisplay = ({ items, label }) => {
  if (!items || items.length === 0) {
    return <span className="text-muted small">N/A</span>;
  }

  if (items.length <= 1) {
    return items.map((item, i) => (
      <Badge key={i} bg="light" text="dark" className="me-1 border fw-normal">{item}</Badge>
    ));
  }

  return (
    <Dropdown size="sm">
      <Dropdown.Toggle variant="outline-secondary" id={`dropdown-${label}`} className="py-1 px-2 rounded-pill">
        {items.length} {label}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {items.map((item, i) => <Dropdown.ItemText key={i} className="small">{item}</Dropdown.ItemText>)}
      </Dropdown.Menu>
    </Dropdown>
  );
};

// Custom Dropdown Toggle for Actions (the three-dot button)
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


const RoadmapsManagement = ({ setPageLoading }) => {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState(null);
  const [activeEditTab, setActiveEditTab] = useState('settings');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoadmapForDetails, setSelectedRoadmapForDetails] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState(null);

  const [showCrmDetailsModal, setShowCrmDetailsModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [crmUsers, setCrmUsers] = useState([]);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchRoadmapsAndUsers = async () => {
    try {
      setLoading(true); setError(null);
      if (setPageLoading) setPageLoading(true);
      const [roadmapsRes, usersRes] = await Promise.all([
        roadmapService.getAllRoadmaps(),
        userService.getUsers()
      ]);
      setRoadmaps(roadmapsRes.data || []);
      setCrmUsers((usersRes.data || []).filter(u => u.role === 'crm'));
    } catch (err) {
      setError('Failed to load roadmaps or user data. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false); if (setPageLoading) setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmapsAndUsers();
  }, [setPageLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, companyFilter, roleFilter, startDate, endDate]);

  const { uniqueCompanies, uniqueRoles } = useMemo(() => {
    if (!roadmaps) return { uniqueCompanies: [], uniqueRoles: [] };
    const companies = [...new Set(roadmaps.map(r => r.companyName).filter(Boolean))];
    const roles = [...new Set(
      roadmaps.flatMap(r => 
          r.isConsolidated ? (r.roles || []).map(role => role.title) : [r.role]
      ).filter(Boolean)
    )];
    return { uniqueCompanies: companies.sort(), uniqueRoles: roles.sort() };
  }, [roadmaps]);


  const dashboardStats = useMemo(() => {
    if (!roadmaps || roadmaps.length === 0) {
        return { totalRoadmaps: 0, uniqueCRMs: 0, totalRoles: 0, uniqueTechStacks: 0 };
    }
    
    const crmSet = new Set(roadmaps.map(r => r.crmAffiliation).filter(Boolean));
    const totalRoles = roadmaps.reduce((acc, roadmap) => acc + (roadmap.isConsolidated ? roadmap.roles?.length || 0 : 1), 0);
    const techStackNameSet = new Set(roadmaps.flatMap(r => (r.isConsolidated ? (r.roles || []).flatMap(role => role.techStacks || []) : (r.techStacks || [])).map(ts => ts?.name).filter(Boolean)));

    return { totalRoadmaps: roadmaps.length, uniqueCRMs: crmSet.size, totalRoles, uniqueTechStacks: techStackNameSet.size };
  }, [roadmaps]);
  
  const crmStats = useMemo(() => {
    if (!roadmaps || crmUsers.length === 0) return [];
  
    const crmDisplayNameMap = new Map();
    crmUsers.forEach(u => {
      const nameToUse = u.displayName || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username);
      crmDisplayNameMap.set(u.username, nameToUse);
    });
    
    const stats = roadmaps.reduce((acc, roadmap) => {
      const crmKey = roadmap.crmAffiliation;
      const crmDisplayName = crmKey ? (crmDisplayNameMap.get(crmKey) || crmKey) : 'Unassigned';
      acc[crmDisplayName] = (acc[crmDisplayName] || 0) + 1;
      return acc;
    }, {});
  
    return Object.entries(stats).map(([crmName, count]) => ({ crmName, count })).sort((a, b) => b.count - a.count);
  }, [roadmaps, crmUsers]);

  const handleEditClick = (roadmap) => {
    const roadmapCopy = JSON.parse(JSON.stringify(roadmap));
    setEditingRoadmap(roadmapCopy);
    setActiveEditTab('settings');
    setShowEditModal(true);
  };
  
  const handleShowDetails = (roadmap) => { setSelectedRoadmapForDetails(roadmap); setShowDetailsModal(true); };
  const handleCloseDetailsModal = () => { setShowDetailsModal(false); setSelectedRoadmapForDetails(null); };
  
  const handleEditModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditingRoadmap(prev => ({ ...prev, [name]: value }));
  };

  const handleEmbeddedTechStackUpdate = (updatedTechStack) => {
    setEditingRoadmap(prev => {
        if (!prev) return null;
        const newRoadmap = { ...prev };
        const updateLogic = (techStacks) => (techStacks || []).map(ts => ts._id === updatedTechStack._id ? updatedTechStack : ts);

        if (!newRoadmap.isConsolidated) { newRoadmap.techStacks = updateLogic(newRoadmap.techStacks); } 
        else { newRoadmap.roles = (newRoadmap.roles || []).map(role => ({ ...role, techStacks: updateLogic(role.techStacks) })); }
        
        setSuccess('Content updated locally. Click "Save & Re-publish" to apply.');
        return newRoadmap;
    });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!editingRoadmap) return;
    setActionLoading(true); setError(null); setSuccess(null);
    try {
      const payload = { ...editingRoadmap, filename: editingRoadmap.filename.endsWith('.html') ? editingRoadmap.filename : `${editingRoadmap.filename}.html` };
      await roadmapService.updateRoadmap(editingRoadmap._id, payload);
      setShowEditModal(false); setEditingRoadmap(null);
      await fetchRoadmapsAndUsers();
      setSuccess("Roadmap updated and re-published successfully!");
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update and re-publish roadmap.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (roadmap) => { setRoadmapToDelete(roadmap); setShowDeleteModal(true); };
  
  const handleDelete = async () => {
    if (!roadmapToDelete) return;
    setActionLoading(true);
    try {
      await roadmapService.deleteRoadmap(roadmapToDelete._id);
      await fetchRoadmapsAndUsers();
      setShowDeleteModal(false);
    } catch (err) { setError('Failed to delete roadmap.'); } 
    finally { setActionLoading(false); }
  };
  
  const crmUserMap = useMemo(() => new Map(crmUsers.map(u => [u.username, u.displayName])), [crmUsers]);

  const filteredRoadmaps = useMemo(() => roadmaps.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    
    const techStackNames = [...new Set((r.isConsolidated ? (r.roles || []).flatMap(role => role.techStacks || []) : (r.techStacks || [])).map(ts => ts?.name).filter(Boolean))];
    
    const searchMatch = !searchTerm || 
      (r.companyName || '').toLowerCase().includes(searchLower) ||
      (r.role || '').toLowerCase().includes(searchLower) ||
      (r.isConsolidated && (r.roles || []).some(role => (role.title || '').toLowerCase().includes(searchLower))) ||
      (r.filename || '').toLowerCase().includes(searchLower) ||
      (r.crmAffiliation && (crmUserMap.get(r.crmAffiliation) || '').toLowerCase().includes(searchLower)) ||
      techStackNames.some(name => name.toLowerCase().includes(searchLower));

    const companyMatch = !companyFilter || r.companyName === companyFilter;
    const roleMatch = !roleFilter || (r.isConsolidated ? (r.roles || []).some(role => role.title === roleFilter) : r.role === roleFilter);

    let dateMatch = true;
    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(r.createdDate) < start) dateMatch = false;
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(r.createdDate) > end) dateMatch = false;
    }
      
    return searchMatch && companyMatch && roleMatch && dateMatch;
  }), [roadmaps, searchTerm, crmUserMap, companyFilter, roleFilter, startDate, endDate]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRoadmaps.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRoadmaps, currentPage, rowsPerPage]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  
  const calculateRoadmapStatus = (roadmap) => {
    const allItems = (roadmap.isConsolidated ? (roadmap.roles || []).flatMap(r => r.techStacks || []) : (roadmap.techStacks || [])).flatMap(ts => ts?.roadmapItems || []);
    if (allItems.length === 0) return { status: 'Empty', percentage: 0 };
    const total = allItems.length;
    const completed = allItems.filter(item => item.completionStatus === 'Completed').length;
    const percentage = Math.round((completed / total) * 100);
    if (percentage === 100) return { status: 'Completed', percentage };
    if (completed === 0 && allItems.every(i => i.completionStatus === 'Yet to Start')) return { status: 'Yet to Start', percentage };
    return { status: 'In Progress', percentage };
  };

  const getStatusBadgeVariant = (status) => {
      switch (status) {
          case 'Completed': return 'success'; case 'In Progress': return 'warning'; case 'Yet to Start': return 'danger'; default: return 'secondary';
      }
  };

  const handleExportCSV = () => {
    if (filteredRoadmaps.length === 0) {
      alert("No data available to export based on the current filters.");
      return;
    }

    const dataForCSV = [];
    filteredRoadmaps.forEach(roadmap => {
      const commonData = {
        'Company Name': roadmap.companyName,
        'Filename': roadmap.filename,
        'Published URL': roadmap.publishedUrl,
        'Assigned CRM': crmUsers.find(c => c.username === roadmap.crmAffiliation)?.displayName || roadmap.crmAffiliation || 'N/A',
        'Created Date': formatDate(roadmap.createdDate),
        'Overall Status (%)': calculateRoadmapStatus(roadmap).percentage
      };

      if (roadmap.isConsolidated && roadmap.roles && roadmap.roles.length > 0) {
        roadmap.roles.forEach(roleDetail => {
          dataForCSV.push({
            ...commonData,
            'Roadmap Type': 'Consolidated',
            'Role Title': roleDetail.title,
            'Tech Stacks': (roleDetail.techStacks || []).map(ts => ts.name).join('; ')
          });
        });
      } else {
        dataForCSV.push({
          ...commonData,
          'Roadmap Type': 'Single',
          'Role Title': roadmap.role,
          'Tech Stacks': (roadmap.techStacks || []).map(ts => ts.name).join('; ')
        });
      }
    });

    const csv = Papa.unparse(dataForCSV);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `roadmaps_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const PaginationControls = ({ totalRows }) => {
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    if (totalPages <= 1) return null;

    let items = [];
    const pageRange = 2;
    let startPage = Math.max(1, currentPage - pageRange);
    let endPage = Math.min(totalPages, currentPage + pageRange);

    if (currentPage - pageRange <= 1) { endPage = Math.min(totalPages, 1 + pageRange * 2); }
    if (currentPage + pageRange >= totalPages) { startPage = Math.max(1, totalPages - pageRange * 2); }

    for (let number = startPage; number <= endPage; number++) { items.push(<Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>{number}</Pagination.Item>); }
    
    return (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
                <Form.Select size="sm" value={rowsPerPage} onChange={handleRowsPerPageChange} style={{width: 'auto'}}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option></Form.Select>
                 <span className="text-muted small">Showing {((currentPage-1)*rowsPerPage) + 1} - {Math.min(currentPage*rowsPerPage, totalRows)} of {totalRows} roadmaps</span>
            </div>
            <Pagination size="sm" className="mb-0">
                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                {startPage > 1 && (<><Pagination.Item onClick={() => handlePageChange(1)}>1</Pagination.Item>{startPage > 2 && <Pagination.Ellipsis disabled />}</>)}
                {items}
                {endPage < totalPages && (<><Pagination.Ellipsis disabled />{endPage < totalPages - 1 && <Pagination.Item onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>}</>)}
                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
        </div>
    );
  };


  return (
    <div>
      <div id="datepicker-portal"></div>
      
      <Row className="g-3 mb-4">
        {[
          { title: "Total Roadmaps", value: dashboardStats.totalRoadmaps, icon: "fa-route", color: "primary" },
          { title: "Unique CRMs Assigned", value: dashboardStats.uniqueCRMs, icon: "fa-headset", color: "info" },
          { title: "Total Roles Defined", value: dashboardStats.totalRoles, icon: "fa-user-tie", color: "success" },
          { title: "Unique Tech Stacks", value: dashboardStats.uniqueTechStacks, icon: "fa-layer-group", color: "warning" },
        ].map(stat => (
            <Col md={6} lg={3} key={stat.title}>
              <Card className="border-0 shadow-sm h-100" onClick={stat.title === 'Unique CRMs Assigned' ? () => setShowCrmDetailsModal(true) : undefined} style={stat.title === 'Unique CRMs Assigned' ? { cursor: 'pointer' } : {}}>
                  <Card.Body className="d-flex align-items-center">
                      <div className={`bg-${stat.color} bg-opacity-10 rounded-circle p-3 me-3`}><i className={`fas ${stat.icon} fa-lg text-${stat.color}`}></i></div>
                      <div>
                          <div className="fs-4 fw-bold">{stat.value}</div>
                          <div className="text-muted small">{stat.title}</div>
                      </div>
                  </Card.Body>
              </Card>
            </Col>
        ))}
      </Row>
      
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white p-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Roadmap Directory</h5>
          <div className="d-flex gap-2">
            <Button variant="outline-success" onClick={handleExportCSV} size="sm">
                <i className="fas fa-file-csv me-2"></i>Export as CSV
            </Button>
            {user.role === 'admin' && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)} size="sm">
                <i className="fas fa-plus me-2"></i>Create New Roadmap
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
            <Row className="g-2 mb-3 align-items-end">
                <Col lg={4}><InputGroup><InputGroup.Text><i className="fas fa-search text-muted"></i></InputGroup.Text><Form.Control type="text" placeholder="Search Company, Role.." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></InputGroup></Col>
                <Col><Form.Select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}><option value="">All Companies</option>{uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}</Form.Select></Col>
                <Col><Form.Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}><option value="">All Roles</option>{uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}</Form.Select></Col>
                <Col><DatePicker selected={startDate} onChange={date => setStartDate(date)} className="form-control" isClearable placeholderText="Start Date" portalId="datepicker-portal" popperPlacement="bottom-start" /></Col>
                <Col><DatePicker selected={endDate} onChange={date => setEndDate(date)} minDate={startDate} className="form-control" isClearable placeholderText="End Date" portalId="datepicker-portal" popperPlacement="bottom-start" /></Col>
            </Row>
        </Card.Body>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="m-0 align-middle">
                 <thead className="bg-light">
                    <tr>
                        <th style={{minWidth: '150px'}}>Company</th>
                        <th style={{minWidth: '120px'}}>Type / Role</th>
                        <th style={{minWidth: '130px'}}>Roles</th>
                        <th style={{minWidth: '130px'}}>Tech Stacks</th>
                        <th style={{minWidth: '100px'}}>CRM</th>
                        <th style={{minWidth: '110px'}}>Created</th>
                        <th style={{minWidth: '130px'}}>Status</th>
                        <th className="text-center" style={{width: '60px'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (<tr><td colSpan="8" className="text-center p-5"><Spinner /></td></tr>)
                    : paginatedData.length > 0 ? (
                        paginatedData.map(roadmap => {
                            const { status, percentage } = calculateRoadmapStatus(roadmap);
                            const techStackNames = [...new Set((roadmap.isConsolidated ? (roadmap.roles || []).flatMap(r => r.techStacks || []) : (roadmap.techStacks || [])).map(ts => ts?.name).filter(Boolean))];
                            const roleNames = roadmap.isConsolidated ? (roadmap.roles || []).map(r => r.title) : [];

                            return (
                                <tr key={roadmap._id}>
                                    <td className="fw-medium">
                                      <Button variant="link" className="p-0 company-name-link" onClick={() => handleShowDetails(roadmap)}>{roadmap.companyName}</Button>
                                    </td>
                                    <td>{roadmap.isConsolidated ? <Badge bg="primary">Consolidated</Badge> : roadmap.role}</td>
                                    <td><OverflowDropdownDisplay items={roleNames} label="Roles" /></td>
                                    <td><OverflowDropdownDisplay items={techStackNames} label="Stacks"/></td>
                                    <td>{crmUsers.find(c => c.username === roadmap.crmAffiliation)?.displayName || roadmap.crmAffiliation || <span className="text-muted small">N/A</span>}</td>
                                    <td>{formatDate(roadmap.createdDate)}</td>
                                    <td><Badge bg={getStatusBadgeVariant(status)}>{status}</Badge> <span className="small text-muted">({percentage}%)</span>
                                      <ProgressBar now={percentage} variant={getStatusBadgeVariant(status)} style={{height:'5px'}} className="mt-1" /></td>
                                    <td className="text-center">
                                      <Dropdown>
                                        <Dropdown.Toggle as={ActionMenuToggle} id={`actions-${roadmap._id}`} />
                                        <Dropdown.Menu align="end">
                                          <Dropdown.Item onClick={() => handleShowDetails(roadmap)}><i className="fas fa-info-circle fa-fw me-2 text-info"></i>View Details</Dropdown.Item>
                                          <Dropdown.Item href={roadmap.publishedUrl} target="_blank" rel="noopener noreferrer"><i className="fas fa-external-link-alt fa-fw me-2 text-success"></i>Open Roadmap</Dropdown.Item>
                                          <Dropdown.Item onClick={() => handleEditClick(roadmap)}><i className="fas fa-edit fa-fw me-2 text-primary"></i>Edit/Re-publish</Dropdown.Item>
                                          {user.role === 'admin' && (<><Dropdown.Divider /><Dropdown.Item onClick={() => handleDeleteClick(roadmap)} className="text-danger"><i className="fas fa-trash-alt fa-fw me-2"></i>Delete Roadmap</Dropdown.Item></>)}
                                        </Dropdown.Menu>
                                      </Dropdown>
                                    </td>
                                </tr>
                            )
                        })
                    ) : (<tr><td colSpan="8" className="text-center p-5 text-muted">No roadmaps found for the selected filters.</td></tr>)}
                </tbody>
            </Table>
          </div>
        </Card.Body>
        <Card.Footer className="bg-light">
           <PaginationControls totalRows={filteredRoadmaps.length} />
        </Card.Footer>
      </Card>
      
      <CreateRoadmapModal show={showCreateModal} onHide={() => setShowCreateModal(false)} onRoadmapCreated={fetchRoadmapsAndUsers} />

      {editingRoadmap && (
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl" centered>
           <Form onSubmit={handleSaveChanges}><Modal.Header closeButton><Modal.Title>Edit Roadmap: {editingRoadmap.companyName}</Modal.Title></Modal.Header><Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}><Tab.Container activeKey={activeEditTab} onSelect={(k) => setActiveEditTab(k)}><Nav variant="tabs" className="mb-3"><Nav.Item><Nav.Link eventKey="settings">Settings</Nav.Link></Nav.Item><Nav.Item><Nav.Link eventKey="content">Content</Nav.Link></Nav.Item></Nav><Tab.Content><Tab.Pane eventKey="settings"><h5 className="mb-3">Config</h5>{error && <Alert variant="danger" className="py-2 small">{error}</Alert>}<Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Company Name</Form.Label><Form.Control type="text" name="companyName" value={editingRoadmap.companyName || ''} onChange={handleEditModalInputChange} required/></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Filename</Form.Label><Form.Control type="text" name="filename" value={editingRoadmap.filename ? editingRoadmap.filename.replace('.html', '') : ''} onChange={handleEditModalInputChange} required/></Form.Group></Col></Row><Row><Col md={6}><Form.Group className="mb-3"><Form.Label>CRM</Form.Label><Form.Select name="crmAffiliation" value={editingRoadmap.crmAffiliation || ''} onChange={handleEditModalInputChange}><option value="">None</option>{crmUsers.map(c => <option key={c._id} value={c.username}>{c.displayName || c.username}</option>)}</Form.Select></Form.Group></Col></Row><Alert variant="warning" className="small mt-3"><strong>Note:</strong> Editing the core structure (e.g., adding/removing roles, changing tech stacks) requires creating a new roadmap. This section is for metadata and content edits only.</Alert></Tab.Pane><Tab.Pane eventKey="content"><h5 className="mb-3">Edit Content & Progress</h5>{success && <Alert variant="success" className="py-2 small">{success}</Alert>}{((editingRoadmap.isConsolidated ? (editingRoadmap.roles || []).flatMap(r => r.techStacks || []) : (editingRoadmap.techStacks || [])) || []).map(tsCopy => tsCopy ? (<div key={tsCopy._id} className="mb-4"><TechStackTable techStackData={tsCopy} isEditable={true} onUpdate={handleEmbeddedTechStackUpdate} isEmbedded={true} /></div>) : null)}</Tab.Pane></Tab.Content></Tab.Container></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button><Button variant="primary" type="submit" disabled={actionLoading}>{actionLoading ? <Spinner size="sm"/> : "Save & Re-publish"}</Button></Modal.Footer></Form>
        </Modal>
      )}

      {selectedRoadmapForDetails && (
          <Modal show={showDetailsModal} onHide={handleCloseDetailsModal} size="lg" centered>
              <Modal.Header closeButton><Modal.Title><i className="fas fa-info-circle me-2 text-primary"></i>{selectedRoadmapForDetails.companyName} Roadmap Details</Modal.Title></Modal.Header>
              <Modal.Body className="bg-light p-4"><Row className="g-3 mb-3"><Col md={7}> <div className="bg-white p-3 border rounded h-100"> <h6 className="fw-bold mb-3"><i className="fas fa-building me-2 text-muted"></i>Company Information</h6> <p className="mb-2"><strong>Name:</strong> {selectedRoadmapForDetails.companyName}</p> <p className="mb-2"><strong>Filename:</strong> <span className="text-muted">{selectedRoadmapForDetails.filename}</span></p> <p className="mb-0"><strong>Type:</strong> <Badge bg={selectedRoadmapForDetails.isConsolidated ? 'primary' : 'info'}>{selectedRoadmapForDetails.isConsolidated ? 'Consolidated' : 'Single Role'}</Badge></p> </div></Col><Col md={5}><div className="bg-white p-3 border rounded h-100"> <h6 className="fw-bold mb-3"><i className="fas fa-tasks me-2 text-muted"></i>Status & Assignment</h6> <p className="mb-2"><strong>Created:</strong> {formatDate(selectedRoadmapForDetails.createdDate)}</p> <p className="mb-2"><strong>Status:</strong> <Badge bg="success">Published</Badge></p> <p className="mb-0"><strong>Assigned CRM:</strong> <Badge pill bg="secondary" className="fw-normal">{crmUsers.find(c => c.username === selectedRoadmapForDetails.crmAffiliation)?.displayName || selectedRoadmapForDetails.crmAffiliation || 'N/A'}</Badge></p> </div></Col></Row>
                  <div className="bg-white border rounded">
                      <h6 className="fw-bold p-3 border-bottom mb-0"><i className="fas fa-users-cog me-2 text-muted"></i>Role-Specific Details</h6>
                      <Table responsive borderless className="m-0 details-role-table">
                          <thead><tr className="bg-light-subtle"><th>Role Title</th><th>Tech Stacks</th></tr></thead>
                          <tbody>{selectedRoadmapForDetails.isConsolidated ? ((selectedRoadmapForDetails.roles || []).map((role, i) => (<tr key={i}><td><i className="fas fa-user-tie me-2 text-secondary"></i>{role.title}</td><td>{(role.techStacks || []).map(ts => (<Badge key={ts._id} bg="secondary" className="me-1 mb-1 fw-normal">{ts.name}</Badge>))}</td></tr>))) : (<tr><td><i className="fas fa-user-tie me-2 text-secondary"></i>{selectedRoadmapForDetails.role}</td><td>{(selectedRoadmapForDetails.techStacks || []).map(ts => (<Badge key={ts._id} bg="secondary" className="me-1 mb-1 fw-normal">{ts.name}</Badge>))}</td></tr>)}</tbody>
                      </Table>
                  </div>
              </Modal.Body>
          </Modal>
      )}

      <Modal show={showCrmDetailsModal} onHide={() => setShowCrmDetailsModal(false)} centered>
          <Modal.Header closeButton>
              <Modal.Title><i className="fas fa-user-tie me-2 text-success"></i>CRM Roadmap Counts</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              {crmStats.length > 0 ? (
                  <Table striped bordered hover size="sm">
                      <thead><tr><th>CRM Name</th><th className="text-center">Roadmaps Assigned</th></tr></thead>
                      <tbody>
                          {crmStats.map(stat => (<tr key={stat.crmName}><td className="fw-medium">{stat.crmName}</td><td className="text-center">{stat.count}</td></tr>))}
                      </tbody>
                  </Table>
              ) : (<div className="text-center text-muted">No roadmaps are currently assigned.</div>)}
          </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Delete Roadmap</Modal.Title></Modal.Header>
          <Modal.Body>Are you sure you want to delete the roadmap for <strong>{roadmapToDelete?.companyName}</strong>?</Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDelete} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</Button></Modal.Footer>
      </Modal>

      <style>{`
        .no-caret::after { display: none; }
        .company-name-link { text-decoration: none; font-weight: 500; }
        .company-name-link:hover { text-decoration: underline; color: var(--bs-primary); }
        .details-role-table th { font-size: 0.8rem; text-transform: uppercase; color: #6c757d; }
        .details-role-table td { font-size: 0.9rem; }
        #datepicker-portal .react-datepicker-popper { z-index: 1060 !important; }
      `}</style>
    </div>
  );
};

export default RoadmapsManagement;
