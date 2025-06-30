// // client/src/pages/RoadmapsManagement.jsx
// import React, { useState, useEffect, useMemo } from 'react';
// import { Table, Button, Spinner, Alert, Modal, Form, Badge, Card, Row, Col, InputGroup, Dropdown } from 'react-bootstrap';
// import useAuth from '../hooks/useAuth';
// import * as roadmapService from '../services/roadmapService';
// import { getAllTechStacks as fetchAllTechStackOptionsForDropdown, getTechStackByName } from '../services/techStackService';
// import TechStackDropdown from '../components/TechStackDropdown/TechStackDropdown';
// import CreateRoadmapModal from '../components/CreateRoadmapModal/CreateRoadmapModal';
// import { generateRoadmapHtml } from '../utils/roadmapHtmlGenerator';
// import { uploadToGithub } from '../services/githubService';
// import userService from '../services/userService';
// import DatePicker from 'react-datepicker';
// import "react-datepicker/dist/react-datepicker.css";

// const RoadmapsManagement = ({ setPageLoading }) => {
//   const { user } = useAuth();
//   const [roadmaps, setRoadmaps] = useState([]);
//   const [allTechStackOptions, setAllTechStackOptions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);

//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editingRoadmap, setEditingRoadmap] = useState(null);
//   const [currentRoadmapData, setCurrentRoadmapData] = useState({
//     companyName: '',
//     role: '',
//     techStacks: [],
//     isConsolidated: false,
//     roles: [{ id: Date.now(), title: '', techStacks: [] }],
//     publishedUrl: '',
//     filename: '',
//     crmAffiliation: '',
//   });

//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [selectedRoadmapForDetails, setSelectedRoadmapForDetails] = useState(null);

//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [roadmapToDelete, setRoadmapToDelete] = useState(null);

//   const [showCrmDetailsModal, setShowCrmDetailsModal] = useState(false);

//   const [searchTerm, setSearchTerm] = useState('');
//   const [companyFilter, setCompanyFilter] = useState('');
//   const [roleFilter, setRoleFilter] = useState('');
//   const [crmUsers, setCrmUsers] = useState([]);

//   // Date filter state
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);


//   const fetchRoadmapsData = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       if (setPageLoading) setPageLoading(true);

//       const response = await roadmapService.getAllRoadmaps();
//       setRoadmaps(response.data || []);

//     } catch (err) {
//       setError('Failed to load roadmaps. ' + (err.response?.data?.error || err.message));
//     } finally {
//       setLoading(false);
//       if (setPageLoading) setPageLoading(false);
//     }
//   };

//   const fetchTechStackNamesForDropdowns = async () => {
//     try {
//         const response = await fetchAllTechStackOptionsForDropdown();
//         setAllTechStackOptions(response.data || []);
//     } catch (err) {
//         console.error("Failed to fetch tech stack names for dropdown", err);
//     }
//   };

//   const fetchCrmUsersForDropdowns = async () => {
//     if (user && user.role === 'admin') {
//         try {
//             const response = await userService.getUsers();
//             setCrmUsers(response.data.filter(u => u.role === 'crm' && u.username));
//         } catch (err) {
//             console.error("Failed to load CRM users for dropdown:", err);
//         }
//     }
//   }

//   useEffect(() => {
//     fetchRoadmapsData();
//     if (user.role === 'admin') {
//         fetchTechStackNamesForDropdowns();
//         fetchCrmUsersForDropdowns();
//     }
//   }, [user.role, setPageLoading]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, companyFilter, roleFilter, startDate, endDate]);

//   const dashboardStats = useMemo(() => {
//     if (!roadmaps || roadmaps.length === 0) {
//         return { totalRoadmaps: 0, uniqueCRMs: 0, uniqueTechStacks: 0, totalRoles: 0 };
//     }
//     const totalRoadmaps = roadmaps.length;
//     const uniqueCRMs = new Set(roadmaps.map(r => r.crmAffiliation).filter(Boolean)).size;
//     const uniqueTechStacks = new Set(roadmaps.flatMap(r => r.techStacks || [])).size;
//     const totalRoles = roadmaps.reduce((acc, roadmap) => acc + (roadmap.isConsolidated ? roadmap.roles?.length || 0 : 1), 0);

//     return { totalRoadmaps, uniqueCRMs, uniqueTechStacks, totalRoles };
//   }, [roadmaps]);

//   const crmStats = useMemo(() => {
//     if (!roadmaps || roadmaps.length === 0) return [];
    
//     const stats = roadmaps.reduce((acc, roadmap) => {
//       const crm = roadmap.crmAffiliation || 'Unassigned';
//       acc[crm] = (acc[crm] || 0) + 1;
//       return acc;
//     }, {});

//     return Object.entries(stats)
//       .map(([crmName, count]) => ({ crmName, count }))
//       .sort((a, b) => b.count - a.count);
//   }, [roadmaps]);

//   const handleEdit = (roadmap) => {
//     setEditingRoadmap(roadmap);
//     const rolesForEdit = (roadmap.roles || []).map(roleDetail => ({
//         id: roleDetail._id || Date.now(),
//         title: roleDetail.title,
//         techStacks: (roleDetail.techStacks || []).map(tsObject => tsObject.name)
//     }));

//     setCurrentRoadmapData({
//         companyName: roadmap.companyName,
//         role: roadmap.isConsolidated ? 'Consolidated' : roadmap.role,
//         techStacks: [...(roadmap.techStacks || [])],
//         isConsolidated: roadmap.isConsolidated || false,
//         roles: roadmap.isConsolidated && rolesForEdit.length > 0 ? rolesForEdit : [{ id: Date.now(), title: '', techStacks: [] }],
//         publishedUrl: roadmap.publishedUrl,
//         filename: roadmap.filename.endsWith('.html') ? roadmap.filename.slice(0, -5) : roadmap.filename, 
//         crmAffiliation: roadmap.crmAffiliation || '',
//     });
//     setShowEditModal(true);
//   };

//   const handleDeleteClick = (roadmap) => {
//     setRoadmapToDelete(roadmap);
//     setShowDeleteModal(true);
//   };

//   const handleDelete = async () => {
//     if (!roadmapToDelete) return;
    
//     try {
//       setActionLoading(true);
//       await roadmapService.deleteRoadmap(roadmapToDelete._id);
//       fetchRoadmapsData();
//       setShowDeleteModal(false);
//       setRoadmapToDelete(null);
//       setTimeout(() => setSuccess(null), 3000);
//     } catch (err) {
//       setError('Failed to delete roadmap. ' + (err.response?.data?.error || err.message));
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleModalInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setCurrentRoadmapData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value,
//     }));
//   };

//   const handleSingleRoleTechStacksChange = (selectedNames) => {
//     setCurrentRoadmapData(prev => ({ ...prev, techStacks: selectedNames }));
//   };

//   const handleConsolidatedRoleChange = (roleIndex, field, value) => {
//     const updatedRoles = [...currentRoadmapData.roles];
//     updatedRoles[roleIndex] = { ...updatedRoles[roleIndex], [field]: value };
//     setCurrentRoadmapData(prev => ({ ...prev, roles: updatedRoles }));
//   };

//   const handleConsolidatedRoleTechStackChange = (roleIndex, selectedNames) => {
//     const updatedRoles = [...currentRoadmapData.roles];
//     updatedRoles[roleIndex] = { ...updatedRoles[roleIndex], techStacks: selectedNames };
//     setCurrentRoadmapData(prev => ({ ...prev, roles: updatedRoles }));
//   };

//   const addConsolidatedRole = () => {
//     setCurrentRoadmapData(prev => ({
//         ...prev,
//         roles: [...prev.roles, { id: Date.now(), title: '', techStacks: [] }]
//     }));
//   };

//   const removeConsolidatedRole = (roleIndexOrId) => {
//     const roleId = typeof roleIndexOrId === 'number' ? currentRoadmapData.roles[roleIndexOrId]?.id : roleIndexOrId;

//     if (currentRoadmapData.roles.length > 1) {
//         const updatedRoles = roleId
//             ? currentRoadmapData.roles.filter(role => role.id !== roleId)
//             : currentRoadmapData.roles.filter((_, index) => index !== roleIndexOrId);
//         setCurrentRoadmapData(prev => ({ ...prev, roles: updatedRoles }));
//     } else {
//         alert("At least one role is required for a consolidated roadmap.");
//     }
//   };

//   const handleSaveChanges = async (e) => {
//     e.preventDefault();
//     if (!editingRoadmap) return;

//     setActionLoading(true);
//     setError(null);
//     setSuccess(null);

//     try {
//         let overallTechStackNamesForHTML;
//         let rolesForHTMLGeneratorInput;

//         if (currentRoadmapData.isConsolidated) {
//             overallTechStackNamesForHTML = [...new Set(currentRoadmapData.roles.flatMap(role => role.techStacks))];
//         } else {
//             overallTechStackNamesForHTML = currentRoadmapData.techStacks;
//         }

//         const allUniqueNamesToFetch = [...new Set(overallTechStackNamesForHTML)];
//         let fetchedFullTechStacksForHTML = [];
//         if (allUniqueNamesToFetch.length > 0) {
//             const techStackPromises = allUniqueNamesToFetch.map(name =>
//                 getTechStackByName(name).catch(err => {
//                     console.error(`Error fetching tech stack '${name}' by name during edit:`, err.message);
//                     return { data: null, error: true, name };
//                 })
//             );
//             const techStackResults = await Promise.all(techStackPromises);
//             const missingNames = [];
//             techStackResults.forEach(result => {
//                 if (result && result.data && !result.error) {
//                     fetchedFullTechStacksForHTML.push(result.data);
//                 } else {
//                     const originalName = result && result.name ? result.name : allUniqueNamesToFetch[techStackResults.indexOf(result)];
//                     if (originalName) missingNames.push(originalName);
//                 }
//             });
//             if (missingNames.length > 0) {
//                 throw new Error(`HTML Generation during edit: Failed to fetch details for tech stack(s): ${missingNames.join(', ')}.`);
//             }
//         }

//         if (currentRoadmapData.isConsolidated) {
//             rolesForHTMLGeneratorInput = currentRoadmapData.roles.map(role => ({
//                 title: role.title,
//                 techStacks: fetchedFullTechStacksForHTML.filter(fullTS => role.techStacks.includes(fullTS.name))
//             }));
//         } else {
//             rolesForHTMLGeneratorInput = [{
//                 title: currentRoadmapData.role,
//                 techStacks: fetchedFullTechStacksForHTML.filter(fullTS => currentRoadmapData.techStacks.includes(fullTS.name))
//             }];
//         }

//         const htmlContent = generateRoadmapHtml(currentRoadmapData.companyName, rolesForHTMLGeneratorInput, fetchedFullTechStacksForHTML);
//         if (!htmlContent) {
//             throw new Error('Failed to generate roadmap HTML content during edit.');
//         }

//         const finalFilename = currentRoadmapData.filename.trim().endsWith('.html')
//             ? currentRoadmapData.filename.trim()
//             : `${currentRoadmapData.filename.trim()}.html`;

//         const githubResponse = await uploadToGithub({
//             filename: finalFilename,
//             content: htmlContent,
//             description: `Update roadmap: ${finalFilename} for ${currentRoadmapData.companyName}`
//         });

//         const dataToSaveForDB = {
//             ...currentRoadmapData,
//             crmAffiliation: currentRoadmapData.crmAffiliation || null,
//             roles: currentRoadmapData.isConsolidated ? currentRoadmapData.roles.map(r => ({ title: r.title, techStacks: r.techStacks })) : [],
//             publishedUrl: githubResponse.html_url || githubResponse.url, 
//             filename: finalFilename,
//         };
        
//         await roadmapService.updateRoadmap(editingRoadmap._id, dataToSaveForDB);
        
//         setShowEditModal(false);
//         setEditingRoadmap(null);
//         fetchRoadmapsData();
//         setTimeout(() => setSuccess(null), 3000);

//     } catch (err) {
//         console.error("Roadmap update error:", err);
//         setError(err.message || err.response?.data?.error || 'Failed to update and re-publish roadmap.');
//     } finally {
//         setActionLoading(false);
//     }
//   };


//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric', month: 'short', day: 'numeric',
//         hour: '2-digit', minute: '2-digit'
//       });
//     } catch {
//       return "Invalid Date";
//     }
//   };

//   const handleShowDetails = (roadmap) => {
//     setSelectedRoadmapForDetails(roadmap);
//     setShowDetailsModal(true);
//   }
//   const handleCloseDetailsModal = () => {
//     setShowDetailsModal(false);
//     setSelectedRoadmapForDetails(null);
//   }

//   const uniqueCompaniesForFilter = [...new Set(roadmaps.map(r => r.companyName).filter(Boolean))];
//   const uniqueRolesForFilter = [...new Set(roadmaps.flatMap(r => {
//       if (r.isConsolidated && r.roles && r.roles.length > 0) {
//           return r.roles.map(roleDetail => roleDetail.title);
//       }
//       return r.role ? [r.role] : [];
//   }).filter(Boolean))];


//   const filteredRoadmaps = roadmaps.filter(roadmap => {
//     const searchLower = searchTerm.toLowerCase();
//     const companyNameMatch = companyFilter === '' || (roadmap.companyName || '').toLowerCase().includes(companyFilter.toLowerCase());

//     let roleNameMatch = roleFilter === '';
//     if (!roleNameMatch) {
//         if (roadmap.isConsolidated && roadmap.roles) {
//             roleNameMatch = roadmap.roles.some(r => (r.title || '').toLowerCase().includes(roleFilter.toLowerCase()));
//         } else {
//             roleNameMatch = (roadmap.role || '').toLowerCase().includes(roleFilter.toLowerCase());
//         }
//     }

//     const contentMatch =
//         (roadmap.companyName || '').toLowerCase().includes(searchLower) ||
//         (roadmap.isConsolidated ? "consolidated" : (roadmap.role || '').toLowerCase()).includes(searchLower) ||
//         (roadmap.filename || '').toLowerCase().includes(searchLower) ||
//         (roadmap.techStacks && roadmap.techStacks.some(tsName => (tsName || '').toLowerCase().includes(searchLower))) ||
//         (roadmap.crmAffiliation && roadmap.crmAffiliation.toLowerCase().includes(searchLower)) ||
//         (roadmap.isConsolidated && roadmap.roles && roadmap.roles.some(r =>
//             (r.title || '').toLowerCase().includes(searchLower) ||
//             (r.techStacks && r.techStacks.some(tsPopulated =>
//                 (tsPopulated.name || '').toLowerCase().includes(searchLower)
//             ))
//         ));
    
//     const roadmapDate = new Date(roadmap.createdDate);
//     let dateMatch = true;
//     if (startDate) {
//         const start = new Date(startDate);
//         start.setHours(0, 0, 0, 0);
//         if (roadmapDate < start) dateMatch = false;
//     }
//     if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         if (roadmapDate > end) dateMatch = false;
//     }

//     return companyNameMatch && roleNameMatch && contentMatch && dateMatch;
//   });

//   const paginatedData = useMemo(() => {
//     if (loading) return [];
//     const startIndex = (currentPage - 1) * rowsPerPage;
//     const endIndex = startIndex + rowsPerPage;
//     return filteredRoadmaps.slice(startIndex, endIndex);
//   }, [filteredRoadmaps, currentPage, rowsPerPage, loading]);

//   const PaginationControls = ({ totalRows }) => {
//     const totalPages = Math.ceil(totalRows / rowsPerPage);

//     const handleRowsPerPageChange = (e) => {
//         setRowsPerPage(Number(e.target.value));
//         setCurrentPage(1);
//     };

//     const handlePageChange = (page) => {
//         if (page >= 1 && page <= totalPages) {
//             setCurrentPage(page);
//         }
//     };

//     if (totalPages <= 1) return null;

//     const renderPageNumbers = () => {
//         const pageNumbers = [];
//         let startPage, endPage;
//         const maxButtons = 4;

//         if (totalPages <= maxButtons) {
//             startPage = 1;
//             endPage = totalPages;
//         } else {
//             if (currentPage <= 2) {
//                 startPage = 1;
//                 endPage = maxButtons;
//             } else if (currentPage + 1 >= totalPages) {
//                 startPage = totalPages - maxButtons + 1;
//                 endPage = totalPages;
//             } else {
//                 startPage = currentPage - 1;
//                 endPage = currentPage + (maxButtons - 2);
//             }
//         }

//         for (let i = startPage; i <= endPage; i++) {
//             pageNumbers.push(
//                 <Button key={i} variant={currentPage === i ? 'primary' : 'outline-secondary'} size="sm" onClick={() => handlePageChange(i)} className="mx-1 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
//                     {i}
//                 </Button>
//             );
//         }
//         return pageNumbers;
//     };
  
//     return (
//         <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 py-2 px-3">
//             <div className="d-flex align-items-center gap-2">
//                 <Form.Select size="sm" value={rowsPerPage} onChange={handleRowsPerPageChange} style={{width: 'auto'}}>
//                     <option value="10">10</option>
//                     <option value="20">20</option>
//                     <option value="50">50</option>
//                     <option value="100">100</option>
//                 </Form.Select>
//             </div>

//             <div className="d-flex align-items-center gap-2">
//                 <Button variant="link" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="text-secondary"><i className="fas fa-chevron-left"></i></Button>
//                 {renderPageNumbers()}
//                 <Button variant="link" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="text-secondary"><i className="fas fa-chevron-right"></i></Button>
//             </div>
//         </div>
//     );
//   };


//   return (
//     <div className="">
//       <div id="date-picker-portal" style={{ zIndex: 9999 }}></div>
//       <Row className="mb-4 align-items-center justify-content-between">
//         <Col lg="auto">
//           <Row className="g-3">
//              <Col xs="auto">
//                 <Card className="border-0 shadow-sm h-100">
//                     <Card.Body className="d-flex align-items-center p-3">
//                         <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
//                             <i className="fas fa-route fa-lg text-primary"></i>
//                         </div>
//                         <div>
//                             <div className="fs-4 fw-bold">{dashboardStats.totalRoadmaps}</div>
//                             <div className="text-muted small">Total Roadmaps</div>
//                         </div>
//                     </Card.Body>
//                 </Card>
//             </Col>
//             <Col xs="auto">
//                 <Card className="border-0 shadow-sm h-100" onClick={() => setShowCrmDetailsModal(true)} style={{ cursor: 'pointer' }}>
//                     <Card.Body className="d-flex align-items-center p-3">
//                         <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
//                             <i className="fas fa-user-tie fa-lg text-success"></i>
//                         </div>
//                         <div>
//                             <div className="fs-4 fw-bold text-primary">{dashboardStats.uniqueCRMs}</div>
//                             <div className="text-muted small">Unique CRMs Assigned</div>
//                         </div>
//                     </Card.Body>
//                 </Card>
//             </Col>
//             <Col xs="auto">
//                 <Card className="border-0 shadow-sm h-100">
//                     <Card.Body className="d-flex align-items-center p-3">
//                         <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
//                             <i className="fas fa-users-cog fa-lg text-warning"></i>
//                         </div>
//                         <div>
//                             <div className="fs-4 fw-bold">{dashboardStats.totalRoles}</div>
//                             <div className="text-muted small">Total Roles Defined</div>
//                         </div>
//                     </Card.Body>
//                 </Card>
//             </Col>
//              <Col xs="auto">
//                 <Card className="border-0 shadow-sm h-100">
//                     <Card.Body className="d-flex align-items-center p-3">
//                         <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
//                             <i className="fas fa-layer-group fa-lg text-info"></i>
//                         </div>
//                         <div>
//                             <div className="fs-4 fw-bold">{dashboardStats.uniqueTechStacks}</div>
//                             <div className="text-muted small">Unique Tech Stacks</div>
//                         </div>
//                     </Card.Body>
//                 </Card>
//             </Col>
//           </Row>
//         </Col>
//         <Col lg="auto" className="mt-3 mt-lg-0">
//           {user.role === 'admin' && (
//             <Button 
//               variant="primary" 
//               onClick={() => setShowCreateModal(true)}
//               className="d-flex align-items-center shadow-sm"
//             >
//               <i className="fas fa-plus me-2"></i>
//               Create Roadmap
//             </Button>
//           )}
//         </Col>
//       </Row>

//       {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="shadow-sm">
//         <i className="fas fa-exclamation-triangle me-2"></i>
//         {error}
//       </Alert>}
//       {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="shadow-sm">
//         <i className="fas fa-check-circle me-2"></i>
//         {success}
//       </Alert>}

//       <Card className="mb-4 border-0 shadow-sm">
//         <Card.Body>
//           <Row className="g-3 align-items-end">
//             <Col xl={3}>
//               <Form.Group>
//                 <Form.Label className="small fw-medium">Search Roadmaps</Form.Label>
//                 <InputGroup>
//                   <InputGroup.Text><i className="fas fa-search text-muted"></i></InputGroup.Text>
//                   <Form.Control type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
//                 </InputGroup>
//               </Form.Group>
//             </Col>
//             <Col xl={2}>
//               <Form.Group>
//                 <Form.Label className="small fw-medium">Company</Form.Label>
//                 <Form.Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
//                   <option value="">All Companies</option>
//                   {uniqueCompaniesForFilter.map(company => <option key={company} value={company}>{company}</option>)}
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col xl={2}>
//               <Form.Group>
//                 <Form.Label className="small fw-medium">Role</Form.Label>
//                 <Form.Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
//                   <option value="">All Roles</option>
//                   {uniqueRolesForFilter.map(roleTitle => <option key={roleTitle} value={roleTitle}>{roleTitle}</option>)}
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col xl={2}>
//                 <Form.Group>
//                     <Form.Label className="small fw-medium">From Date</Form.Label>
//                     <DatePicker selected={startDate} onChange={date => setStartDate(date)} className="form-control" placeholderText="Start Date" isClearable portalId="date-picker-portal" popperPlacement="bottom-start" />
//                 </Form.Group>
//             </Col>
//             <Col xl={2}>
//                 <Form.Group>
//                     <Form.Label className="small fw-medium">To Date</Form.Label>
//                     <DatePicker selected={endDate} onChange={date => setEndDate(date)} className="form-control" placeholderText="End Date" minDate={startDate} isClearable portalId="date-picker-portal" popperPlacement="bottom-start" />
//                 </Form.Group>
//             </Col>
//             <Col xl={1}>
//                 <Button variant="outline-secondary" onClick={fetchRoadmapsData} className="w-100" disabled={loading || actionLoading}>
//                     <i className={`fas fa-sync-alt ${(loading || actionLoading) ? 'fa-spin' : ''}`}></i> 
//                 </Button>
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>

//       <Card className="border-0 shadow-sm">
//         <Card.Body className="p-0">
//           {(loading && roadmaps.length === 0) ? (
//             <div className="text-center py-5">
//                 <Spinner animation="border" variant="primary" style={{width: '3rem', height: '3rem'}} />
//                 <p className="mt-3 text-muted fs-5">Loading roadmaps...</p>
//             </div>
//           ) : (
//             <div className="table-responsive">
//               <Table hover className="m-0 align-middle roadmaps-table">
//                 <thead className="bg-light">
//                   <tr>
//                     <th>Company</th>
//                     <th>Type / Main Role</th>
//                     <th>Consolidated Roles</th>
//                     <th>Tech Stacks</th>
//                     <th>Assigned CRM</th>
//                     <th>Created</th>
//                     <th>Status</th>
//                     <th className="text-center">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {!loading && paginatedData.length === 0 && (
//                     <tr>
//                       <td colSpan="8" className="text-center py-5">
//                         <div className="mb-3"><i className="fas fa-route fa-3x text-muted"></i></div>
//                         <h5 className="mb-1">No Roadmaps Found</h5>
//                         <p className="text-muted small">
//                           {searchTerm || companyFilter || roleFilter || startDate || endDate ? "Try adjusting your search or filter criteria." : "No roadmaps have been created yet."}
//                         </p>
//                       </td>
//                     </tr>
//                   )}
                  
//                   {paginatedData.map(roadmap => (
//                     <tr key={roadmap._id}>
//                       <td className="fw-medium">
//                         <Button 
//                           variant="link" 
//                           className="p-0 text-start company-link text-decoration-none" 
//                           onClick={() => handleShowDetails(roadmap)}
//                         >
//                             <i className="fas fa-building me-2 text-muted"></i>
//                             {roadmap.companyName}
//                         </Button>
//                         <div className="small text-muted mt-1">
//                           <i className="fas fa-file-code me-1"></i>
//                           {roadmap.filename}
//                         </div>
//                       </td>
//                       <td>
//                         {roadmap.isConsolidated ? (
//                           <Badge bg="primary" className="roadmap-type-badge">
//                             <i className="fas fa-object-group me-1"></i>
//                             Consolidated
//                           </Badge>
//                         ) : (
//                           <Badge bg="info" className="roadmap-type-badge">
//                             <i className="fas fa-user me-1"></i>
//                             {roadmap.role}
//                           </Badge>
//                         )}
//                       </td>
//                        <td>
//                         {roadmap.isConsolidated && roadmap.roles && roadmap.roles.length > 0 ? (
//                             <div style={{ maxHeight: '100px', overflowY: 'auto' }} className="hide-scrollbar">
//                                 {roadmap.roles.slice(0, 2).map((roleDetail, idx) => (
//                                 <div key={roleDetail._id || idx} className="mb-2">
//                                     <div className="fw-medium small text-primary mb-1">{roleDetail.title}</div>
//                                     <div className="d-flex flex-wrap gap-1">
//                                         {(roleDetail.techStacks && roleDetail.techStacks.length > 0) ? (
//                                         roleDetail.techStacks.slice(0, 2).map((ts, tsIdx) => (
//                                             <Badge key={ts._id || tsIdx} bg="light" text="dark" className="border tech-stack-badge">
//                                             {ts.name}
//                                             </Badge>
//                                         ))
//                                         ) : (
//                                         <span className="text-muted small fst-italic">No tech stacks</span>
//                                         )}
//                                         {(roleDetail.techStacks && roleDetail.techStacks.length > 2) && (
//                                         <Badge bg="secondary" className="tech-stack-badge">
//                                             +{roleDetail.techStacks.length - 2}
//                                         </Badge>
//                                         )}
//                                     </div>
//                                 </div>
//                                 ))}
//                                 {roadmap.roles.length > 2 && (
//                                   <div className="text-muted small">
//                                     <i className="fas fa-ellipsis-h me-1"></i>
//                                     +{roadmap.roles.length - 2} more roles
//                                   </div>
//                                 )}
//                             </div>
//                         ) : (
//                             <span className="text-muted fst-italic small">Single role roadmap</span>
//                         )}
//                       </td>
//                       <td>
//                         <div className="d-flex flex-wrap gap-1" style={{maxWidth: '200px'}}>
//                           {(roadmap.techStacks || []).slice(0, 2).map((stackName, i) => (
//                             <Badge key={i} bg="info" text="dark" className="tech-stack-badge">{stackName}</Badge>
//                           ))}
//                           {(roadmap.techStacks || []).length > 2 && (
//                             <Badge bg="secondary" className="tech-stack-badge">
//                               +{roadmap.techStacks.length - 2}
//                             </Badge>
//                           )}
//                         </div>
//                       </td>
//                       <td>
//                         {roadmap.crmAffiliation ? (
//                           <Badge bg="success" className="crm-badge">
//                             <i className="fas fa-user-tie me-1"></i>
//                             {roadmap.crmAffiliation}
//                           </Badge>
//                         ) : (
//                           <Badge bg="light" text="dark" className="crm-badge border">
//                             <i className="fas fa-users me-1"></i>
//                             General
//                           </Badge>
//                         )}
//                       </td>
//                       <td>
//                         <div className="small text-muted">
//                           <i className="fas fa-calendar-alt me-1"></i>
//                           {formatDate(roadmap.createdDate)}
//                         </div>
//                       </td>
//                       <td>
//                         <Badge bg="success" className="status-badge">
//                           <i className="fas fa-check-circle me-1"></i>
//                           Published
//                         </Badge>
//                       </td>
//                       <td className="text-center">
//                         <Dropdown>
//                           <Dropdown.Toggle 
//                             variant="link" 
//                             id={`dropdown-actions-${roadmap._id}`} 
//                             className="p-1 text-muted no-caret"
//                             disabled={actionLoading}
//                           >
//                               <i className="fas fa-ellipsis-v"></i>
//                           </Dropdown.Toggle>
//                           <Dropdown.Menu align="end">
//                               <Dropdown.Item onClick={() => handleShowDetails(roadmap)}>
//                                 <i className="fas fa-eye me-2 text-info"></i>
//                                 View Details
//                               </Dropdown.Item>
//                               <Dropdown.Item 
//                                 href={roadmap.publishedUrl} 
//                                 target="_blank" 
//                                 rel="noopener noreferrer"
//                               >
//                                 <i className="fas fa-external-link-alt me-2 text-success"></i>
//                                 Open Roadmap
//                               </Dropdown.Item>
//                               {user.role === 'admin' && (
//                                 <>
//                                   <Dropdown.Divider />
//                                   <Dropdown.Item onClick={() => handleEdit(roadmap)}>
//                                     <i className="fas fa-edit me-2 text-primary"></i>
//                                     Edit Roadmap
//                                   </Dropdown.Item>
//                                   <Dropdown.Item onClick={() => handleDeleteClick(roadmap)} className="text-danger">
//                                     <i className="fas fa-trash-alt me-2"></i>
//                                     Delete Roadmap
//                                   </Dropdown.Item>
//                                 </>
//                               )}
//                           </Dropdown.Menu>
//                         </Dropdown>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//             </div>
//           )}
//         </Card.Body>
//         <Card.Footer className="bg-white border-top">
//            <PaginationControls totalRows={filteredRoadmaps.length} />
//         </Card.Footer>
//       </Card>

//       {user.role === 'admin' && (
//           <CreateRoadmapModal
//             show={showCreateModal}
//             onHide={() => setShowCreateModal(false)}
//             onRoadmapCreated={fetchRoadmapsData}
//           />
//       )}

//       {editingRoadmap && user.role === 'admin' && (
//         <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl" centered backdrop="static">
//           <Modal.Header closeButton>
//             <Modal.Title>
//               <i className="fas fa-edit me-2 text-primary"></i>
//               Edit Roadmap: <span className="fw-normal">{editingRoadmap.companyName} - {editingRoadmap.isConsolidated ? "Consolidated" : editingRoadmap.role}</span>
//             </Modal.Title>
//           </Modal.Header>
//           <Form onSubmit={handleSaveChanges}>
//             <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
//               {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
//               <Form.Group className="mb-3">
//                 <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
//                 <Form.Control type="text" name="companyName" value={currentRoadmapData.companyName} onChange={handleModalInputChange} required />
//               </Form.Group>
//               <Form.Group className="mb-3">
//                 <Form.Label>Filename (without .html) <span className="text-danger">*</span></Form.Label>
//                 <Form.Control type="text" name="filename" value={currentRoadmapData.filename} onChange={handleModalInputChange} required placeholder="e.g., NIAT_X_CompanyName"/>
//                 <Form.Text className="text-muted">The filename will be used for the published HTML file.</Form.Text>
//               </Form.Group>
//               {user && user.role === 'admin' && (
//                 <Form.Group className="mb-3">
//                   <Form.Label>Assign to CRM</Form.Label>
//                   <Form.Select
//                     name="crmAffiliation"
//                     value={currentRoadmapData.crmAffiliation || ''}
//                     onChange={handleModalInputChange}
//                   >
//                     <option value="">None (General / Unassigned)</option>
//                     {crmUsers.map(crm => (
//                       <option key={crm._id} value={crm.username}>
//                         {crm.displayName || crm.username} ({crm.username})
//                       </option>
//                     ))}
//                   </Form.Select>
//                    <Form.Text className="text-muted">Changes CRM assignment. Re-publishing updates GitHub content but does not alter the URL structure based on CRM.</Form.Text>
//                 </Form.Group>
//               )}

//               <Form.Group className="mb-3">
//                 <Form.Check type="switch" id="isConsolidatedSwitchEdit" label="Is Consolidated Roadmap" name="isConsolidated"
//                     checked={currentRoadmapData.isConsolidated} onChange={handleModalInputChange}
//                 />
//               </Form.Group>

//               {!currentRoadmapData.isConsolidated ? (
//                 <>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Role Title (for single role) <span className="text-danger">*</span></Form.Label>
//                     <Form.Control type="text" name="role" value={currentRoadmapData.role} onChange={handleModalInputChange} required={!currentRoadmapData.isConsolidated}/>
//                   </Form.Group>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Tech Stacks for this Role</Form.Label>
//                     <TechStackDropdown
//                         techStacks={allTechStackOptions}
//                         selectedTechStacks={currentRoadmapData.techStacks}
//                         onSelect={handleSingleRoleTechStacksChange}
//                         loading={loading} // General page loading, consider a specific one if dropdown load is slow
//                         isFormField={true}
//                     />
//                     <Form.Text className="text-muted">Select one or more tech stacks.</Form.Text>
//                   </Form.Group>
//                 </>
//               ) : (
//                 <>
//                   <h5 className="mt-4 mb-3">Consolidated Roles Configuration</h5>
//                   {currentRoadmapData.roles.map((roleItem, roleIndex) => (
//                     <Card key={roleItem.id || roleIndex} className="mb-3 p-3 bg-light" style={{ overflow: 'visible', position: 'relative' }}>
//                         <Row className="g-2 align-items-end">
//                             <Col md={5}>
//                                 <Form.Group>
//                                     <Form.Label className="small">Role Title #{roleIndex + 1} <span className="text-danger">*</span></Form.Label>
//                                     <Form.Control type="text" value={roleItem.title}
//                                         onChange={(e) => handleConsolidatedRoleChange(roleIndex, 'title', e.target.value)} required
//                                     />
//                                 </Form.Group>
//                             </Col>
//                             <Col md={6}>
//                                 <Form.Group style={{ position: 'relative' }}>
//                                     <Form.Label className="small">Tech Stacks for {roleItem.title || `Role ${roleIndex + 1}`}</Form.Label>
//                                     <TechStackDropdown
//                                         techStacks={allTechStackOptions}
//                                         selectedTechStacks={roleItem.techStacks} // Expects array of names
//                                         onSelect={(names) => handleConsolidatedRoleTechStackChange(roleIndex, names)}
//                                         loading={loading}
//                                         isFormField={true}
//                                     />
//                                 </Form.Group>
//                             </Col>
//                             <Col md={1} className="d-flex align-items-center justify-content-center">
//                                 {currentRoadmapData.roles.length > 1 && (
//                                     <Button variant="outline-danger" size="sm" onClick={() => removeConsolidatedRole(roleItem.id || roleIndex)} title="Remove Role" className="w-100" style={{ marginTop: '1.5rem' }}>
//                                         <i className="fas fa-times"></i>
//                                     </Button>
//                                 )}
//                             </Col>
//                         </Row>
//                     </Card>
//                   ))}
//                   <Button variant="outline-success" size="sm" onClick={addConsolidatedRole} className="mt-2">
//                     <i className="fas fa-plus me-1"></i> Add Another Role
//                   </Button>
//                 </>
//               )}
//             </Modal.Body>
//             <Modal.Footer>
//               <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={actionLoading}>Cancel</Button>
//               <Button variant="primary" type="submit" disabled={actionLoading}>
//                 {actionLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> Saving...</> : 'Save & Re-publish'}
//               </Button>
//             </Modal.Footer>
//           </Form>
//         </Modal>
//       )}

//       {/* Delete Confirmation Modal */}
//       <Modal show={showDeleteModal} onHide={() => {setShowDeleteModal(false); setRoadmapToDelete(null);}} centered>
//         <Modal.Header closeButton className="bg-danger-soft text-danger">
//           <Modal.Title>
//             <i className="fas fa-trash-alt me-2"></i>
//             Delete Roadmap Confirmation
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body className="text-center">
//           {roadmapToDelete && (
//             <>
//               <i className="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
//               <h5 className="mb-1">Are you absolutely sure?</h5>
//               <p>This will permanently delete the roadmap for <strong>{roadmapToDelete.companyName}</strong>.</p>
//               <div className="bg-light p-3 rounded mb-3">
//                 <div className="small text-muted mb-1">Roadmap Details:</div>
//                 <div><strong>Company:</strong> {roadmapToDelete.companyName}</div>
//                 <div><strong>Type:</strong> {roadmapToDelete.isConsolidated ? 'Consolidated' : roadmapToDelete.role}</div>
//                 <div><strong>Filename:</strong> {roadmapToDelete.filename}</div>
//               </div>
//               <p className="text-danger fw-bold">This action cannot be undone.</p>
//             </>
//           )}
//         </Modal.Body>
//         <Modal.Footer className="justify-content-center">
//           <Button variant="outline-secondary" onClick={() => {setShowDeleteModal(false); setRoadmapToDelete(null);}}>
//             Cancel
//           </Button>
//           <Button variant="danger" onClick={handleDelete} disabled={actionLoading}>
//             {actionLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> : null}
//             {actionLoading ? 'Deleting...' : 'Yes, Delete Roadmap'}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* CRM Details Modal */}
//       <Modal show={showCrmDetailsModal} onHide={() => setShowCrmDetailsModal(false)} centered>
//         <Modal.Header closeButton>
//             <Modal.Title>
//                 <i className="fas fa-user-tie me-2"></i>
//                 CRM Roadmap Counts
//             </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//             {crmStats.length > 0 ? (
//                 <Table striped bordered hover size="sm">
//                     <thead>
//                         <tr>
//                             <th>CRM Name</th>
//                             <th>Roadmaps Assigned</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {crmStats.map(stat => (
//                             <tr key={stat.crmName}>
//                                 <td className="fw-medium">{stat.crmName}</td>
//                                 <td className="text-center">{stat.count}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </Table>
//             ) : (
//                 <div className="text-center text-muted">No roadmaps are currently assigned to any CRMs.</div>
//             )}
//         </Modal.Body>
//         <Modal.Footer>
//             <Button variant="secondary" onClick={() => setShowCrmDetailsModal(false)}>
//                 Close
//             </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Details Modal */}
//       <Modal show={showDetailsModal} onHide={handleCloseDetailsModal} size="lg" centered>
//         <Modal.Header closeButton>
//           <Modal.Title>
//             <i className="fas fa-info-circle me-2 text-info"></i>
//             {selectedRoadmapForDetails?.companyName} - Roadmap Details
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
//           {selectedRoadmapForDetails && (
//             <>
//               <Row className="mb-3">
//                 <Col md={6}>
//                   <Card className="h-100 border-0 bg-light">
//                     <Card.Body className="p-3">
//                       <h6 className="text-muted mb-2">
//                         <i className="fas fa-building me-1"></i>
//                         Company Information
//                       </h6>
//                       <div className="mb-2"><strong>Name:</strong> {selectedRoadmapForDetails.companyName}</div>
//                       <div className="mb-2"><strong>Filename:</strong> {selectedRoadmapForDetails.filename}</div>
//                       <div>
//                         <strong>Type:</strong>{' '}
//                         {selectedRoadmapForDetails.isConsolidated ? (
//                             <Badge bg="primary" className="ms-1">
//                               <i className="fas fa-object-group me-1"></i>Consolidated
//                             </Badge>
//                         ) : (
//                            <Badge bg="info" className="ms-1">
//                              <i className="fas fa-user me-1"></i>{selectedRoadmapForDetails.role || "Single Role"}
//                            </Badge>
//                         )}
//                       </div>
//                     </Card.Body>
//                   </Card>
//                 </Col>
//                 <Col md={6}>
//                   <Card className="h-100 border-0 bg-light">
//                     <Card.Body className="p-3">
//                       <h6 className="text-muted mb-2">
//                         <i className="fas fa-info me-1"></i>
//                         Status & Assignment
//                       </h6>
//                       <div className="mb-2">
//                         <strong>Created:</strong> {formatDate(selectedRoadmapForDetails.createdDate)}
//                       </div>
//                       <div className="mb-2">
//                         <strong>Status:</strong>{' '}
//                         <Badge bg="success" className="ms-1">
//                           <i className="fas fa-check-circle me-1"></i>Published
//                         </Badge>
//                       </div>
//                       <div>
//                         <strong>Assigned CRM:</strong>{' '}
//                         {selectedRoadmapForDetails.crmAffiliation ? 
//                           (<Badge bg="success" className="ms-1">
//                             <i className="fas fa-user-tie me-1"></i>{selectedRoadmapForDetails.crmAffiliation}
//                            </Badge>) : 
//                           (<Badge bg="light" text="dark" className="border ms-1">
//                             <i className="fas fa-users me-1"></i>General / Unassigned
//                            </Badge>)}
//                       </div>
//                     </Card.Body>
//                   </Card>
//                 </Col>
//               </Row>
              
//               <Card className="mb-3 border-0 bg-light">
//                 <Card.Body className="p-3">
//                   <h6 className="text-muted mb-2">
//                     <i className="fas fa-external-link-alt me-1"></i>
//                     Published URL
//                   </h6>
//                   <div className="d-flex align-items-center">
//                     <a 
//                       href={selectedRoadmapForDetails.publishedUrl} 
//                       target="_blank" 
//                       rel="noopener noreferrer" 
//                       className="text-break me-2 flex-grow-1"
//                     >
//                       {selectedRoadmapForDetails.publishedUrl}
//                     </a>
//                     <Button 
//                       variant="outline-primary" 
//                       size="sm"
//                       href={selectedRoadmapForDetails.publishedUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       <i className="fas fa-external-link-alt"></i>
//                     </Button>
//                   </div>
//                 </Card.Body>
//               </Card>

//               <h6 className="text-muted mb-2">
//                 <i className="fas fa-layer-group me-1"></i>
//                 Tech Stacks Included (Overall)
//               </h6>
//               <div className="d-flex flex-wrap gap-1 mb-3">
//                     {(selectedRoadmapForDetails.techStacks || []).map((stackName, idx) => (
//                         <Badge key={idx} bg="info" text="dark" className="tech-stack-badge">{stackName}</Badge>
//                     ))}
//               </div>
              
//               {selectedRoadmapForDetails.isConsolidated && selectedRoadmapForDetails.roles && selectedRoadmapForDetails.roles.length > 0 && (
//                 <>
//                 <h6 className="text-muted mb-2 mt-4">
//                   <i className="fas fa-users-cog me-1"></i>
//                   Role-Specific Details
//                 </h6>
//                 <Table striped bordered hover size="sm" className="mt-1">
//                   <thead className="table-light">
//                     <tr>
//                       <th style={{width: '30%'}}>Role Title</th>
//                       <th>Tech Stacks for this Role</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {selectedRoadmapForDetails.roles.map((roleItem, index) => (
//                       <tr key={roleItem._id || index}>
//                         <td className="fw-medium">
//                           <i className="fas fa-user-tag me-2 text-muted"></i>
//                           {roleItem.title}
//                         </td>
//                         <td>
//                           {roleItem.techStacks && roleItem.techStacks.length > 0 ? (
//                             <div className="d-flex flex-wrap gap-1">
//                               {roleItem.techStacks.map((tsObject, stackIdx) => {
//                                   return <Badge key={tsObject._id || stackIdx} bg="secondary" className="tech-stack-badge">{tsObject.name || 'Unknown'}</Badge>;
//                               })}
//                             </div>
//                           ) : (
//                             <span className="text-muted fst-italic">No tech stacks assigned</span>
//                           )}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </Table>
//                 </>
//               )}
//             </>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="outline-secondary" onClick={handleCloseDetailsModal}>Close</Button>
//           {selectedRoadmapForDetails && (
//             <Button 
//               variant="primary"
//               href={selectedRoadmapForDetails.publishedUrl}
//               target="_blank"
//               rel="noopener noreferrer"
//             >
//               <i className="fas fa-external-link-alt me-2"></i>
//               Open Roadmap
//             </Button>
//           )}
//         </Modal.Footer>
//       </Modal>
      
//       <style jsx global>{`
//         .roadmaps-management-page .table th {
//             font-size: 0.8rem;
//             text-transform: uppercase;
//             letter-spacing: 0.05em;
//             font-weight: 600;
//             color: #4A5568;
//         }
//         .roadmaps-management-page .table td {
//             font-size: 0.875rem;
//             vertical-align: middle;
//         }
//         .company-link { 
//           color: var(--bs-primary); 
//           font-weight: 500; 
//         }
//         .company-link:hover { 
//           color: var(--bs-primary); 
//           text-decoration: underline !important;
//         }
//         .roadmaps-table .no-caret::after { 
//           display: none; 
//         }
//         .roadmap-type-badge { 
//           font-size: 0.7rem !important; 
//           font-weight: 500 !important; 
//           padding: 0.4em 0.7em !important;
//         }
//         .tech-stack-badge { 
//           font-size: 0.65rem !important; 
//           font-weight: 500 !important; 
//           padding: 0.3em 0.5em !important;
//         }
//         .crm-badge { 
//           font-size: 0.7rem !important; 
//           font-weight: 500 !important; 
//           padding: 0.3em 0.6em !important;
//         }
//         .status-badge { 
//           font-size: 0.7rem !important; 
//           font-weight: 500 !important; 
//           padding: 0.3em 0.6em !important;
//         }
//         .hide-scrollbar {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
//         .hide-scrollbar::-webkit-scrollbar {
//           display: none;
//         }
//         .bg-danger-soft { 
//           background-color: rgba(220, 53, 69, 0.1) !important; 
//         }
//       `}</style>
//     </div>
//   );
// };

// export default RoadmapsManagement;


// client/src/pages/RoadmapsManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Spinner, Alert, Modal, Form, Badge, Card, Row, Col, InputGroup, Dropdown, ProgressBar, Tab, Nav, Pagination } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import * as roadmapService from '../services/roadmapService';
import CreateRoadmapModal from '../components/CreateRoadmapModal/CreateRoadmapModal';
import userService from '../services/userService';
import TechStackTable from '../components/TechStackTable/TechStackTable';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Helper component for displaying lists with a dropdown for overflow
const OverflowDropdownDisplay = ({ items, label }) => {
  if (!items || items.length === 0) {
    return <span className="text-muted small">N/A</span>;
  }

  // Display the first item directly
  if (items.length <= 1) {
    return items.map((item, i) => (
      <Badge key={i} bg="light" text="dark" className="me-1 border fw-normal">{item}</Badge>
    ));
  }

  // Use a dropdown for more than two items
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
  const [crmUsers, setCrmUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoadmapForDetails, setSelectedRoadmapForDetails] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState(null);
  const [activeEditTab, setActiveEditTab] = useState('settings');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState(null);

  // New states for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination State
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

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, companyFilter, roleFilter, startDate, endDate]);

  const { uniqueCompanies, uniqueRoles } = useMemo(() => {
    if (!roadmaps) return { uniqueCompanies: [], uniqueRoles: [] };
    const companies = [...new Set(roadmaps.map(r => r.companyName))];
    const roles = [...new Set(
      roadmaps.flatMap(r => 
          r.isConsolidated ? (r.roles || []).map(role => role.title) : [r.role]
      ).filter(Boolean)
    )];
    return { uniqueCompanies: companies.sort(), uniqueRoles: roles.sort() };
  }, [roadmaps]);

  // Calculate dashboard summary statistics
  const dashboardStats = useMemo(() => {
    if (!roadmaps || roadmaps.length === 0) {
        return { totalRoadmaps: 0, uniqueCRMs: 0, totalRoles: 0, uniqueTechStacks: 0 };
    }
    
    const crmSet = new Set(roadmaps.map(r => r.crmAffiliation).filter(Boolean));
    
    const totalRoles = roadmaps.reduce((acc, roadmap) => {
        if (roadmap.isConsolidated) {
            return acc + (roadmap.roles?.length || 0);
        }
        return acc + 1;
    }, 0);
    
    const techStackNameSet = new Set(
        roadmaps.flatMap(r => 
            (r.isConsolidated ? (r.roles || []).flatMap(role => role.techStacks || []) : r.techStacks || [])
            .map(ts => ts?.name).filter(Boolean)
        )
    );

    return {
        totalRoadmaps: roadmaps.length,
        uniqueCRMs: crmSet.size,
        totalRoles,
        uniqueTechStacks: techStackNameSet.size,
    };
  }, [roadmaps]);

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
      setTimeout(() => setSuccess(null), 3000);
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

  const PaginationControls = ({ totalRows }) => {
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    if (totalPages <= 1) return null;

    let items = [];
    const pageRange = 2; // Number of pages to show around current page
    let startPage = Math.max(1, currentPage - pageRange);
    let endPage = Math.min(totalPages, currentPage + pageRange);

    if (currentPage - pageRange <= 1) {
        endPage = Math.min(totalPages, 1 + pageRange * 2);
    }

    if (currentPage + pageRange >= totalPages) {
        startPage = Math.max(1, totalPages - pageRange * 2);
    }

    for (let number = startPage; number <= endPage; number++) {
        items.push(
            <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                {number}
            </Pagination.Item>,
        );
    }
    
    return (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
                <Form.Select size="sm" value={rowsPerPage} onChange={handleRowsPerPageChange} style={{width: 'auto'}}>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </Form.Select>
                 <span className="text-muted small">
                    Showing {((currentPage-1)*rowsPerPage) + 1} - {Math.min(currentPage*rowsPerPage, totalRows)} of {totalRows} roadmaps
                </span>
            </div>

            <Pagination size="sm" className="mb-0">
                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                {startPage > 1 && (
                    <>
                        <Pagination.Item onClick={() => handlePageChange(1)}>1</Pagination.Item>
                        {startPage > 2 && <Pagination.Ellipsis disabled />}
                    </>
                )}
                {items}
                {endPage < totalPages && (
                     <>
                        {endPage < totalPages - 1 && <Pagination.Ellipsis disabled />}
                        <Pagination.Item onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>
                    </>
                )}
                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
        </div>
    );
};


  return (
    <div>
      <div id="datepicker-portal"></div>
      
      {/* ----- REPLACEMENT OF HEADER TEXT WITH STATS CARDS ----- */}
      <Row className="g-3 mb-4">
        {[
          { title: "Total Roadmaps", value: dashboardStats.totalRoadmaps, icon: "fa-route", color: "primary" },
          { title: "Unique CRMs Assigned", value: dashboardStats.uniqueCRMs, icon: "fa-headset", color: "info" },
          { title: "Total Roles Defined", value: dashboardStats.totalRoles, icon: "fa-user-tie", color: "success" },
          { title: "Unique Tech Stacks", value: dashboardStats.uniqueTechStacks, icon: "fa-layer-group", color: "warning" },
        ].map(stat => (
            <Col md={6} lg={3} key={stat.title}>
              <Card className="border-0 shadow-sm h-100">
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
          {user.role === 'admin' && (
            <Button variant="primary" onClick={() => setShowCreateModal(true)} size="sm">
              <i className="fas fa-plus me-2"></i>Create New Roadmap
            </Button>
          )}
        </Card.Header>
        <Card.Body>
            <Row className="g-2 mb-3 align-items-end">
                <Col lg={4}>
                  <InputGroup>
                      <InputGroup.Text><i className="fas fa-search text-muted"></i></InputGroup.Text>
                      <Form.Control type="text" placeholder="Search Company, Role.." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </InputGroup>
                </Col>
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
                            return (
                                <tr key={roadmap._id}>
                                    <td className="fw-medium">
                                      <Button variant="link" className="p-0 company-name-link" onClick={() => handleShowDetails(roadmap)}>{roadmap.companyName}</Button>
                                    </td>
                                    <td>{roadmap.isConsolidated ? <Badge bg="primary">Consolidated</Badge> : roadmap.role}</td>
                                    <td><OverflowDropdownDisplay items={roadmap.isConsolidated ? (roadmap.roles || []).map(r => r.title) : []} label="Roles" /></td>
                                    <td><OverflowDropdownDisplay items={[...new Set((roadmap.isConsolidated ? (roadmap.roles || []).flatMap(r => r.techStacks || []) : (roadmap.techStacks || [])).map(ts => ts?.name).filter(Boolean))]} label="Stacks"/></td>
                                    <td>{crmUserMap.get(roadmap.crmAffiliation) || roadmap.crmAffiliation || <span className="text-muted small">N/A</span>}</td>
                                    <td>{formatDate(roadmap.createdDate)}</td>
                                    <td>
                                        <Badge bg={getStatusBadgeVariant(status)} className="me-2">{status}</Badge>
                                        <span className="small text-muted">({percentage}%)</span>
                                        <ProgressBar now={percentage} variant={getStatusBadgeVariant(status)} style={{ height: '5px' }} className="mt-1" />
                                    </td>
                                    <td className="text-center">
                                      <Dropdown>
                                        <Dropdown.Toggle as={ActionMenuToggle} id={`actions-${roadmap._id}`} />
                                        <Dropdown.Menu align="end">
                                          <Dropdown.Item href={roadmap.publishedUrl} target="_blank" rel="noopener noreferrer"><i className="fas fa-external-link-alt fa-fw me-2 text-success"></i>View Roadmap</Dropdown.Item>
                                          <Dropdown.Item onClick={() => handleEditClick(roadmap)}><i className="fas fa-edit fa-fw me-2 text-primary"></i>Edit Roadmap</Dropdown.Item>
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

      {selectedRoadmapForDetails && (
          <Modal show={showDetailsModal} onHide={handleCloseDetailsModal} size="lg" centered>
              <Modal.Header closeButton><Modal.Title><i className="fas fa-info-circle me-2 text-primary"></i>{selectedRoadmapForDetails.companyName} - Roadmap Details</Modal.Title></Modal.Header>
              <Modal.Body className="bg-light p-4">
                  <Row className="g-3 mb-3">
                      <Col md={7}>
                          <div className="bg-white p-3 border rounded h-100">
                              <h6 className="fw-bold mb-3"><i className="fas fa-building me-2 text-muted"></i>Company Information</h6>
                              <p className="mb-2"><strong>Name:</strong> {selectedRoadmapForDetails.companyName}</p>
                              <p className="mb-2"><strong>Filename:</strong> <span className="text-muted">{selectedRoadmapForDetails.filename}</span></p>
                              <p className="mb-0"><strong>Type:</strong> <Badge bg={selectedRoadmapForDetails.isConsolidated ? 'primary' : 'info'}>{selectedRoadmapForDetails.isConsolidated ? 'Consolidated' : 'Single Role'}</Badge></p>
                          </div>
                      </Col>
                      <Col md={5}>
                           <div className="bg-white p-3 border rounded h-100">
                              <h6 className="fw-bold mb-3"><i className="fas fa-tasks me-2 text-muted"></i>Status & Assignment</h6>
                              <p className="mb-2"><strong>Created:</strong> {new Date(selectedRoadmapForDetails.createdDate).toLocaleString()}</p>
                              <p className="mb-2"><strong>Status:</strong> <Badge bg="success">Published</Badge></p>
                              <p className="mb-0"><strong>Assigned CRM:</strong> <Badge pill bg="secondary" className="fw-normal">{crmUserMap.get(selectedRoadmapForDetails.crmAffiliation) || selectedRoadmapForDetails.crmAffiliation || 'N/A'}</Badge></p>
                           </div>
                      </Col>
                  </Row>
                  <div className="bg-white p-3 border rounded mb-3">
                      <h6 className="fw-bold mb-3"><i className="fas fa-link me-2 text-muted"></i>Published URL</h6>
                      <InputGroup>
                          <Form.Control value={selectedRoadmapForDetails.publishedUrl} readOnly className="bg-light"/>
                          <Button href={selectedRoadmapForDetails.publishedUrl} target="_blank" variant="outline-primary"><i className="fas fa-external-link-alt"></i></Button>
                      </InputGroup>
                  </div>
                  <div className="bg-white p-3 border rounded mb-3">
                      <h6 className="fw-bold mb-3"><i className="fas fa-layer-group me-2 text-muted"></i>Tech Stacks Included (Overall)</h6>
                      <div className="d-flex flex-wrap gap-2">{[...new Set((selectedRoadmapForDetails.isConsolidated ? (selectedRoadmapForDetails.roles || []).flatMap(r => r.techStacks || []) : (selectedRoadmapForDetails.techStacks || [])).map(ts => ts?.name).filter(Boolean))].map((name, i) => (<Badge key={i} pill bg="primary" className="fw-normal">{name}</Badge>))}</div>
                  </div>
                  <div className="bg-white border rounded">
                      <h6 className="fw-bold p-3 border-bottom mb-0"><i className="fas fa-users-cog me-2 text-muted"></i>Role-Specific Details</h6>
                      <Table responsive borderless className="m-0 details-role-table">
                          <thead><tr className="bg-light-subtle"><th>Role Title</th><th>Tech Stacks for this Role</th></tr></thead>
                          <tbody>
                            {selectedRoadmapForDetails.isConsolidated ? ((selectedRoadmapForDetails.roles || []).map((role, i) => (<tr key={i}><td><i className="fas fa-user-tie me-2 text-secondary"></i>{role.title}</td><td>{(role.techStacks || []).map(ts => (<Badge key={ts._id} bg="secondary" className="me-1 mb-1 fw-normal">{ts.name}</Badge>))}</td></tr>))) : (<tr><td><i className="fas fa-user-tie me-2 text-secondary"></i>{selectedRoadmapForDetails.role}</td><td>{(selectedRoadmapForDetails.techStacks || []).map(ts => (<Badge key={ts._id} bg="secondary" className="me-1 mb-1 fw-normal">{ts.name}</Badge>))}</td></tr>)}
                          </tbody>
                      </Table>
                  </div>
              </Modal.Body>
          </Modal>
      )}

      {editingRoadmap && (
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl" centered>
           <Form onSubmit={handleSaveChanges}><Modal.Header closeButton><Modal.Title>Edit Roadmap: {editingRoadmap.companyName}</Modal.Title></Modal.Header><Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}><Tab.Container activeKey={activeEditTab} onSelect={(k) => setActiveEditTab(k)}><Nav variant="tabs" className="mb-3"><Nav.Item><Nav.Link eventKey="settings">Settings</Nav.Link></Nav.Item><Nav.Item><Nav.Link eventKey="content">Content</Nav.Link></Nav.Item></Nav><Tab.Content><Tab.Pane eventKey="settings"><h5 className="mb-3">Config</h5>{error && <Alert variant="danger" className="py-2 small">{error}</Alert>}<Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Company Name</Form.Label><Form.Control type="text" name="companyName" value={editingRoadmap.companyName || ''} onChange={handleEditModalInputChange} required/></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Filename</Form.Label><Form.Control type="text" name="filename" value={editingRoadmap.filename ? editingRoadmap.filename.replace('.html', '') : ''} onChange={handleEditModalInputChange} required/></Form.Group></Col></Row><Row><Col md={6}><Form.Group className="mb-3"><Form.Label>CRM</Form.Label><Form.Select name="crmAffiliation" value={editingRoadmap.crmAffiliation || ''} onChange={handleEditModalInputChange}><option value="">None</option>{crmUsers.map(c => <option key={c._id} value={c.username}>{c.displayName || c.username}</option>)}</Form.Select></Form.Group></Col></Row><Alert variant="warning" className="small mt-3"><strong>Note:</strong> Editing the core structure is not available here. To change the structure, create a new roadmap.</Alert></Tab.Pane><Tab.Pane eventKey="content"><h5 className="mb-3">Edit Content & Progress</h5>{success && <Alert variant="success" className="py-2 small">{success}</Alert>}{((editingRoadmap.isConsolidated ? (editingRoadmap.roles || []).flatMap(r => r.techStacks || []) : (editingRoadmap.techStacks || [])) || []).map(tsCopy => tsCopy ? (<div key={tsCopy._id} className="mb-4"><TechStackTable techStackData={tsCopy} isEditable={true} onUpdate={handleEmbeddedTechStackUpdate} isEmbedded={true} /></div>) : null)}</Tab.Pane></Tab.Content></Tab.Container></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button><Button variant="primary" type="submit" disabled={actionLoading}>{actionLoading ? <Spinner size="sm"/> : "Save & Re-publish"}</Button></Modal.Footer></Form>
        </Modal>
      )}
      
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Confirm Deletion</Modal.Title></Modal.Header>
          <Modal.Body>Are you sure you want to delete the roadmap for <strong>{roadmapToDelete?.companyName}</strong>?</Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDelete} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</Button></Modal.Footer>
      </Modal>

      <style>{`
        .no-caret::after { display: none; }
        .company-name-link { text-decoration: none; font-weight: 500; }
        .company-name-link:hover { text-decoration: underline; color: var(--bs-primary); }
        .details-role-table th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; }
        .details-role-table td { font-size: 0.9rem; }
        .details-role-table tbody tr:last-child td { border-bottom: none; }
        #datepicker-portal .react-datepicker-popper { z-index: 1060 !important; }
      `}</style>
    </div>
  );
};

export default RoadmapsManagement;
