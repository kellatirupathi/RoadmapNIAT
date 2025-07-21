// // client/src/pages/AdminDashboard.jsx
// import React, { useState, useEffect } from 'react';
// import { Card, Row, Col, Button, Table, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
// import { Link } from 'react-router-dom';
// import useAuth from '../hooks/useAuth';
// import statsService from '../services/statsService';
// import userService from '../services/userService'; 
// import activityLogService from '../services/activityLogService'; 
// import { getRoleBadgeColor } from '../services/rolesService';
// import InstructorProgressTable from '../components/InstructorProgress/InstructorProgressTable';

// // Helper function to format activity details
// const formatActivityDetails = (details, action, resourceName) => {
//   if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
//     if (resourceName) return `Resource: ${resourceName}`;
//     return '-';
//   }

//   switch (action) {
//     case 'user_management':
//       if (details.operation === 'update' && details.updatedFields) {
//         return `Updated: ${details.updatedFields.join(', ')} for user ID ${details.targetUser?.slice(-6) || 'N/A'}`;
//       }
//       if (details.operation === 'create') {
//         return `Created user ID ${details.targetUser?.slice(-6) || 'N/A'}`;
//       }
//       if (details.operation === 'delete') {
//         return `Deleted user ID ${details.targetUser?.slice(-6) || 'N/A'}`;
//       }
//       if (details.operation === 'reset_password') {
//         return `Reset password for user ID ${details.targetUser?.slice(-6) || 'N/A'}`;
//       }
//       return `Operation: ${details.operation || 'Unknown'}`;

//     case 'add_comment':
//     case 'delete_comment':
//       let commentMsg = action === 'add_comment' ? 'Added comment' : 'Deleted comment';
//       if (details.roadmapItemTopic) {
//         commentMsg += ` on "${details.roadmapItemTopic}"`;
//       } else if (details.roadmapItemId) {
//         commentMsg += ` on item ID ...${details.roadmapItemId.slice(-6)}`;
//       }
//       if (resourceName) {
//         commentMsg += ` in Tech Stack "${resourceName}"`;
//       }
//       if (details.commentId) {
//         commentMsg += ` (Comment ID: ...${details.commentId.slice(-6)})`;
//       }
//       return commentMsg;

//     case 'create_techstack':
//       return `Created Tech Stack: "${resourceName || 'N/A'}"`;
//     case 'edit_techstack':
//       return `Edited Tech Stack: "${resourceName || 'N/A'}"`;
//     case 'delete_techstack':
//       return `Deleted Tech Stack: "${resourceName || 'N/A'}"`;
    
//     case 'create_roadmap':
//       return `Created Roadmap: "${resourceName || 'N/A'}"`;
//     case 'edit_roadmap':
//       return `Edited Roadmap: "${resourceName || 'N/A'}"`;
//     case 'delete_roadmap':
//       return `Deleted Roadmap: "${resourceName || 'N/A'}"`;

//     case 'update_status':
//       let statusMsg = `Updated status`;
//       if (details.topic) {
//          statusMsg += ` for "${details.topic}"`;
//       } else if (details.itemId) {
//         statusMsg += ` for item ID ...${details.itemId.slice(-6)}`;
//       }
//       if (resourceName) {
//         statusMsg += ` in Tech Stack "${resourceName}"`;
//       }
//       if (details.newStatus) {
//         statusMsg += ` to "${details.newStatus}"`;
//       }
//       return statusMsg;
      
//     default:
//       return Object.entries(details)
//         .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`)
//         .join('; ');
//   }
// };


// const AdminDashboard = ({ setPageLoading }) => {
//   const { user } = useAuth();
//   const [stats, setStats] = useState({
//     counts: { users: 0, techStacks: 0, roadmaps: 0, totalItems: 0 },
//     itemStats: { 'Completed': 0, 'In Progress': 0, 'Yet to Start': 0 },
//     progressPercentage: 0,
//     recentActivity: [], 
//     userRoleCounts: {} 
//   });
//   const [techStackProgress, setTechStackProgress] = useState([]);
//   const [allInstructors, setAllInstructors] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [modalError, setModalError] = useState(null);

//   const [showInstructorsModal, setShowInstructorsModal] = useState(false);
//   const [instructorsListForModal, setInstructorsListForModal] = useState([]);
//   const [loadingInstructorsModal, setLoadingInstructorsModal] = useState(false);

//   const [showAllActivityModal, setShowAllActivityModal] = useState(false);
//   const [allActivityLogs, setAllActivityLogs] = useState([]);
//   const [loadingAllActivity, setLoadingAllActivity] = useState(false);


//   useEffect(() => {
//     const fetchAdminDashboardData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         setModalError(null);
//         if (setPageLoading) setPageLoading(true);
        
//         const [summaryResponse, timelineResponse, usersResponse, allLogsResponseIfAdmin] = await Promise.all([
//           statsService.getDashboardSummary(),
//           statsService.getTimelineStats(),
//           userService.getUsers(),
//           activityLogService.getAllActivityLogs() 
//         ]);
        
//         if (summaryResponse && summaryResponse.counts && summaryResponse.itemStats && summaryResponse.userRoleCounts) {
//           setStats({
//             counts: summaryResponse.counts || { users: 0, techStacks: 0, roadmaps: 0, totalItems: 0 },
//             itemStats: summaryResponse.itemStats || { 'Completed': 0, 'In Progress': 0, 'Yet to Start': 0 },
//             progressPercentage: summaryResponse.progressPercentage || 0,
//             recentActivity: summaryResponse.recentActivity || [], 
//             userRoleCounts: summaryResponse.userRoleCounts || {}
//           });
//         } else {
//           console.warn('Invalid summary stats response structure:', summaryResponse);
//           setError(prev => prev ? `${prev}\nReceived invalid summary data.` : 'Received invalid summary data.');
//         }

//         if (timelineResponse && timelineResponse.techStackProgress) {
//           setTechStackProgress(timelineResponse.techStackProgress);
//         }

//         if (usersResponse && usersResponse.data) {
//           setAllInstructors(usersResponse.data.filter(u => u.role === 'instructor'));
//         }

//         if (allLogsResponseIfAdmin && allLogsResponseIfAdmin.data) {
//           setAllActivityLogs(allLogsResponseIfAdmin.data);
//         } else {
//           console.warn('Failed to fetch all activity logs or no data returned for admin.');
//           setAllActivityLogs([]);
//         }
        
//       } catch (err) {
//         console.error('Failed to load admin dashboard data:', err);
//         setError('Failed to load dashboard statistics. Please try again later.');
//       } finally {
//         setLoading(false);
//         if (setPageLoading) setPageLoading(false);
//       }
//     };

//     fetchAdminDashboardData();
//   }, [setPageLoading]);

//   const getTechStackOverallStatusBadge = (percentage) => {
//     if (percentage === 100) return 'success';
//     if (percentage > 0) return 'warning';
//     return 'danger';
//   }
  
//   const getTechStackOverallStatusText = (percentage) => {
//     if (percentage === 100) return 'Completed';
//     if (percentage > 0) return 'In Progress';
//     return 'Yet to Start';
//   }

//   const getAssignedInstructorsForTechStack = (techStackId) => {
//     if (!techStackId || allInstructors.length === 0) return [];
//     return allInstructors
//       .filter(instructor => 
//         instructor.assignedTechStacks && 
//         instructor.assignedTechStacks.some(assignedTS => assignedTS._id === techStackId)
//       )
//       .map(instructor => `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.username);
//   };

//   const handleShowInstructorsModal = () => {
//     setModalError(null);
//     setInstructorsListForModal(allInstructors.map(instr => ({
//         ...instr,
//         assignedTechStacks: Array.isArray(instr.assignedTechStacks) ? instr.assignedTechStacks : []
//     })));
//     setShowInstructorsModal(true);
//   };

//   const handleShowAllActivityModal = async () => {
//     setShowAllActivityModal(true);
//   };


//   return (
//     <div className="">
//       <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
//         <div className="welcome-section">
//           <p className="text-muted mb-0">
//             <i className="fas fa-user-circle me-2"></i>
//             Welcome back, {user?.firstName || user?.username || 'Admin'}
//           </p>
//         </div>
//       </div>
      
//       {error && !showInstructorsModal && !showAllActivityModal && (
//         <Alert variant="danger" onClose={() => setError(null)} dismissible className="border-0 shadow-sm">
//           <i className="fas fa-exclamation-circle me-2"></i>
//           {error}
//         </Alert>
//       )}
      
//       {loading ? (
//         <div className="text-center py-5">
//           <Spinner animation="border" role="status" variant="primary" size="sm">
//             <span className="visually-hidden">Loading...</span>
//           </Spinner>
//           <p className="mt-2 text-muted small">Loading dashboard data...</p>
//         </div>
//       ) : (
//         <>
//           <Row xs={1} sm={2} md={3} lg={5} className="g-3 mb-4">
//             <Col xs={6} sm={4} md={true} className="col-lg">
//               <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
//                 <div className="bg-primary bg-opacity-10 py-1 px-3">
//                   <div className="d-flex align-items-center justify-content-between">
//                     <h6 className="text-primary mb-0 fw-bold">Users</h6>
//                     <i className="fas fa-users text-primary"></i>
//                   </div>
//                 </div>
//                 <Card.Body className="py-2 px-3 d-flex flex-column">
//                   <h3 className="mb-0 fw-bold">{stats.counts?.users || 0}</h3>
//                   <Link to="/users" className="text-decoration-none small d-block mt-auto pt-1">
//                     <span className="text-muted">Manage</span>
//                     <i className="fas fa-chevron-right ms-1 small"></i>
//                   </Link>
//                 </Card.Body>
//               </Card>
//             </Col>
            
//             <Col xs={6} sm={4} md={true} className="col-lg">
//               <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
//                 <div className="bg-success bg-opacity-10 py-1 px-3">
//                   <div className="d-flex align-items-center justify-content-between">
//                     <h6 className="text-success mb-0 fw-bold">Tech Stacks</h6>
//                     <i className="fas fa-layer-group text-success"></i>
//                   </div>
//                 </div>
//                 <Card.Body className="py-2 px-3 d-flex flex-column">
//                   <h3 className="mb-0 fw-bold">{stats.counts?.techStacks || 0}</h3>
//                   <Link to="/alltechstacks" className="text-decoration-none small d-block mt-auto pt-1">
//                     <span className="text-muted">View All</span>
//                     <i className="fas fa-chevron-right ms-1 small"></i>
//                   </Link>
//                 </Card.Body>
//               </Card>
//             </Col>

//             <Col xs={6} sm={4} md={true} className="col-lg">
//               <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
//                 <div className="bg-info bg-opacity-10 py-1 px-3">
//                   <div className="d-flex align-items-center justify-content-between">
//                     <h6 className="text-info mb-0 fw-bold">Instructors</h6>
//                     <i className="fas fa-chalkboard-teacher text-info"></i>
//                   </div>
//                 </div>
//                 <Card.Body className="py-2 px-3 d-flex flex-column">
//                   <h3 className="mb-0 fw-bold">{stats.userRoleCounts?.instructor || 0}</h3>
//                   <Button variant="link" className="text-decoration-none small d-block mt-auto pt-1 p-0 text-start" onClick={handleShowInstructorsModal}>
//                     <span className="text-muted">View Details</span>
//                     <i className="fas fa-chevron-right ms-1 small text-muted"></i>
//                   </Button>
//                 </Card.Body>
//               </Card>
//             </Col>
            
//             <Col xs={6} sm={6} md={true} className="col-lg">
//               <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
//                 <div className="bg-secondary bg-opacity-10 py-1 px-3">
//                   <div className="d-flex align-items-center justify-content-between">
//                     <h6 className="text-secondary mb-0 fw-bold">Roadmaps</h6>
//                     <i className="fas fa-map text-secondary"></i>
//                   </div>
//                 </div>
//                 <Card.Body className="py-2 px-3 d-flex flex-column">
//                   <h3 className="mb-0 fw-bold">{stats.counts?.roadmaps || 0}</h3>
//                   <Link to="/manage-roadmaps" className="text-decoration-none small d-block mt-auto pt-1">
//                     <span className="text-muted">View All</span>
//                     <i className="fas fa-chevron-right ms-1 small"></i>
//                   </Link>
//                 </Card.Body>
//               </Card>
//             </Col>
            
//             <Col xs={12} sm={6} md={true} className="col-lg">
//               <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
//                 <div className="bg-warning bg-opacity-10 py-1 px-3">
//                   <div className="d-flex align-items-center justify-content-between">
//                     <h6 className="text-warning mb-0 fw-bold">Total Items</h6>
//                     <i className="fas fa-tasks text-warning"></i>
//                   </div>
//                 </div>
//                 <Card.Body className="py-2 px-3 d-flex flex-column">
//                   <h3 className="mb-0 fw-bold">{stats.counts?.totalItems || 0}</h3>
//                   <Link to="/timeline" className="text-decoration-none small d-block mt-auto pt-1">
//                     <span className="text-muted">Timeline</span>
//                     <i className="fas fa-chevron-right ms-1 small"></i>
//                   </Link>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>

//           {/* Instructor Progress Table */}
//           <Row className="mb-4">
//             <Col><InstructorProgressTable /></Col>
//           </Row>
          
//           <Row className="mb-4">
//             <Col lg={8} className="mb-4 mb-lg-0">
//               <Card className="border-0 shadow-sm rounded-3 h-100">
//                 <Card.Header className="bg-white py-3 border-bottom-0 fw-bold">
//                   <h5 className="mb-0">Tech Stack Item Progress</h5>
//                 </Card.Header>
//                 <Card.Body className="p-0">
//                   {techStackProgress.length > 0 ? (
//                     <div className="table-responsive" style={{ maxHeight: '400px' }}>
//                       <Table hover className="mb-0 align-middle">
//                         <thead className="bg-light">
//                           <tr>
//                             <th>Instructor Name(s)</th>
//                             <th>Tech Stack</th>
//                             <th className="text-center">Total Items</th>
//                             <th className="text-center">Progress</th>
//                             <th className="text-center">Overall Status</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {techStackProgress.map((stack, index) => {
//                             const assignedInstructors = getAssignedInstructorsForTechStack(stack._id);
//                             return (
//                               <tr key={stack._id || index}>
//                                 <td>
//                                   {assignedInstructors.length > 0 ? (
//                                     assignedInstructors.map((name, idx) => (
//                                       <div key={idx} className="small">{name}</div>
//                                     ))
//                                   ) : (
//                                     <></> 
//                                   )}
//                                 </td>
//                                 <td className="fw-medium">{stack.name}</td>
//                                 <td className="text-center">{stack.totalItems}</td>
//                                 <td className="text-center">
//                                   <span className={`fw-bold text-${getTechStackOverallStatusBadge(stack.completionPercentage)}`}>
//                                     {Math.round(stack.completionPercentage)}%
//                                   </span>
//                                 </td>
//                                 <td className="text-center">
//                                   <Badge 
//                                     bg={getTechStackOverallStatusBadge(stack.completionPercentage)}
//                                     className="rounded-pill px-2 py-1"
//                                   >
//                                     {getTechStackOverallStatusText(stack.completionPercentage)}
//                                   </Badge>
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                         </tbody>
//                       </Table>
//                     </div>
//                   ) : (
//                      <div className="text-center p-4">
//                         <i className="fas fa-info-circle fa-2x text-muted mb-2"></i>
//                         <p className="text-muted mb-0">No tech stack progress data available.</p>
//                      </div>
//                   )}
//                 </Card.Body>
//               </Card>
//             </Col>
            
//             <Col lg={4}>
//               <Card className="border-0 shadow-sm rounded-3 h-100">
//                 <Card.Header className="bg-white py-3 border-0 fw-bold">
//                   <h5 className="mb-0">Quick Actions</h5>
//                 </Card.Header>
//                 <Card.Body className="py-2">
//                   <div className="list-group list-group-flush">
//                     <Link to="/newtechstack" className="list-group-item list-group-item-action border-0 py-2 px-3">
//                       <div className="d-flex justify-content-between align-items-center">
//                         <div className="d-flex align-items-center">
//                           <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
//                             <i className="fas fa-plus-circle text-primary"></i>
//                           </div>
//                           <span>Add New Tech Stack</span>
//                         </div>
//                         <i className="fas fa-chevron-right text-muted small"></i>
//                       </div>
//                     </Link>
//                     <Link to="/users" className="list-group-item list-group-item-action border-0 py-2 px-3">
//                       <div className="d-flex justify-content-between align-items-center">
//                         <div className="d-flex align-items-center">
//                           <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
//                             <i className="fas fa-user-cog text-info"></i>
//                           </div>
//                           <span>Manage Users</span>
//                         </div>
//                         <i className="fas fa-chevron-right text-muted small"></i>
//                       </div>
//                     </Link>
//                     <Link to="/alltechstacks" className="list-group-item list-group-item-action border-0 py-2 px-3">
//                       <div className="d-flex justify-content-between align-items-center">
//                         <div className="d-flex align-items-center">
//                           <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
//                             <i className="fas fa-edit text-success"></i>
//                           </div>
//                           <span>Edit Tech Stacks</span>
//                         </div>
//                         <i className="fas fa-chevron-right text-muted small"></i>
//                       </div>
//                     </Link>
//                     <Link to="/timeline" className="list-group-item list-group-item-action border-0 py-2 px-3">
//                       <div className="d-flex justify-content-between align-items-center">
//                         <div className="d-flex align-items-center">
//                           <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
//                             <i className="fas fa-tasks text-warning"></i>
//                           </div>
//                           <span>View Timeline</span>
//                         </div>
//                         <i className="fas fa-chevron-right text-muted small"></i>
//                       </div>
//                     </Link>
//                   </div>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
          
//           <Card className="border-0 shadow-sm rounded-3 mb-4">
//             <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center fw-bold">
//               <h5 className="mb-0">Recent Activity</h5>
//               <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={handleShowAllActivityModal}>
//                 <i className="fas fa-history me-1"></i>
//                 View All
//               </Button>
//             </Card.Header>
//             <div className="table-responsive">
//               <Table hover className="mb-0 align-middle">
//                 <thead className="bg-light">
//                   <tr>
//                     <th className="border-0">User</th>
//                     <th className="border-0">Action</th>
//                     <th className="border-0">Details</th>
//                     <th className="border-0">Time</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {stats.recentActivity && stats.recentActivity.length > 0 ? (
//                     stats.recentActivity.map((activity, index) => (
//                       <tr key={index}>
//                         <td>
//                           <div className="d-flex align-items-center">
//                             <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
//                               <i className="fas fa-user text-primary"></i>
//                             </div>
//                             <div>
//                               <div className="fw-medium">
//                                 {activity.user?.firstName 
//                                   ? `${activity.user.firstName} ${activity.user.lastName || ''}`
//                                   : activity.user?.username || 'Unknown User'
//                                 }
//                               </div>
//                               {activity.user?.role && (
//                                 <Badge 
//                                   bg={getRoleBadgeColor(activity.user.role)} 
//                                   className="rounded-pill small px-2 py-1"
//                                 >
//                                   {activity.user.role}
//                                 </Badge>
//                               )}
//                             </div>
//                           </div>
//                         </td>
//                         <td>
//                           <Badge 
//                             bg="light" 
//                             text="dark"
//                             className="rounded-pill small px-2 py-1"
//                           >
//                             {(activity.action || '').replace(/_/g, ' ')}
//                           </Badge>
//                         </td>
//                         <td className="text-truncate" style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
//                            {formatActivityDetails(activity.details, activity.action, activity.resourceId?.name)}
//                         </td>
//                         <td>
//                           <span className="text-muted small">
//                             {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : '-'}
//                           </span>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={4} className="text-center py-3">
//                         <p className="text-muted mb-0">No recent activity</p>
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </Table>
//             </div>
//           </Card>
//         </>
//       )}

//       <Modal show={showInstructorsModal} onHide={() => setShowInstructorsModal(false)} size="lg" centered>
//         <Modal.Header closeButton>
//           <Modal.Title><i className="fas fa-chalkboard-teacher me-2"></i>Instructors List</Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
//           {loadingInstructorsModal ? ( 
//             <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-2 mb-0 text-muted">Loading instructors...</p></div>
//           ) : modalError ? ( 
//             <Alert variant="danger">{modalError}</Alert>
//           ) : instructorsListForModal.length > 0 ? (
//             <Table striped bordered hover responsive size="sm">
//               <thead className="bg-light"><tr><th>Instructor Name</th><th>Assigned Tech Stacks</th></tr></thead>
//               <tbody>
//                 {instructorsListForModal.map(instructor => (
//                   <tr key={instructor._id}>
//                     <td>{instructor.firstName || instructor.username} {instructor.lastName || ''}</td>
//                     <td>
//                       {instructor.assignedTechStacks && instructor.assignedTechStacks.length > 0 ? (
//                         instructor.assignedTechStacks.map(stack => (
//                           <Badge key={stack._id} pill bg="secondary" className="me-1 mb-1 fw-normal">{stack.name}</Badge>
//                         ))
//                       ) : (<span className="text-muted fst-italic">None assigned</span>)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           ) : (<div className="text-center py-4"><i className="fas fa-user-times fa-2x text-muted mb-2"></i><p className="text-muted mb-0">No instructors found.</p></div>
//           )}
//         </Modal.Body>
//         <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowInstructorsModal(false)}>Close</Button></Modal.Footer>
//       </Modal>

//       <Modal show={showAllActivityModal} onHide={() => setShowAllActivityModal(false)} size="xl" centered scrollable>
//         <Modal.Header closeButton>
//           <Modal.Title><i className="fas fa-history me-2"></i>All Activity Logs</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {loadingAllActivity ? (
//              <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-2 mb-0 text-muted">Loading all activities...</p></div>
//           ) : modalError && allActivityLogs.length === 0 ? (
//              <Alert variant="danger">{modalError || "Failed to load activity logs."}</Alert>
//           ) : allActivityLogs.length > 0 ? (
//             <Table striped bordered hover responsive size="sm">
//               <thead className="bg-light sticky-top">
//                 <tr>
//                   <th>User</th>
//                   <th>Role</th>
//                   <th>Action</th>
//                   <th>Details</th>
//                   <th>Resource</th>
//                   <th>IP Address</th>
//                   <th>Timestamp</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {allActivityLogs.map(log => (
//                   <tr key={log._id}>
//                     <td>{log.user?.firstName ? `${log.user.firstName} ${log.user.lastName || ''}` : log.user?.username || 'N/A'}</td>
//                     <td>
//                       {log.user?.role && (
//                         <Badge bg={getRoleBadgeColor(log.user.role)} className="rounded-pill small px-2 py-1">
//                           {log.user.role}
//                         </Badge>
//                       )}
//                     </td>
//                     <td>
//                       <Badge bg="light" text="dark" className="rounded-pill small px-2 py-1">
//                         {(log.action || '').replace(/_/g, ' ')}
//                       </Badge>
//                     </td>
//                     <td className="small" style={{maxWidth: '250px', overflowWrap: 'break-word', whiteSpace: 'normal'}}>
//                       {formatActivityDetails(log.details, log.action, log.resourceId?.name)}
//                     </td>
//                     <td>{log.resourceId?.name || (log.resourceId ? `ID: ...${log.resourceId.toString().slice(-6)}` : '-')}</td>
//                     <td>{log.ip || '-'}</td>
//                     <td className="small">{new Date(log.timestamp).toLocaleString()}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           ) : (
//             <div className="text-center py-4"><i className="fas fa-folder-open fa-2x text-muted mb-2"></i><p className="text-muted mb-0">No activity logs found.</p></div>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="outline-secondary" onClick={() => setShowAllActivityModal(false)}>Close</Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default AdminDashboard;


// client/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import statsService from '../services/statsService';
import userService from '../services/userService'; 
import activityLogService from '../services/activityLogService'; 
import { getRoleDisplayName, getRoleBadgeColor } from '../services/rolesService';
import InstructorProgressTable from '../components/InstructorProgress/InstructorProgressTable';

// Helper function to format activity details
const formatActivityDetails = (details, action, resourceName) => {
  if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
    if (resourceName) return `Resource: ${resourceName}`;
    return '-';
  }

  switch (action) {
    case 'user_management':
      if (details.operation === 'update' && details.updatedFields) {
        return `Updated: ${details.updatedFields.join(', ')} for user ID ${details.targetUser?.slice(-6) || 'N/A'}`;
      }
      if (details.operation === 'create') {
        return `Created user ID ${details.targetUser?.slice(-6) || 'N/A'}`;
      }
      if (details.operation === 'delete') {
        return `Deleted user ID ${details.targetUser?.slice(-6) || 'N/A'}`;
      }
      if (details.operation === 'reset_password') {
        return `Reset password for user ID ${details.targetUser?.slice(-6) || 'N/A'}`;
      }
      return `Operation: ${details.operation || 'Unknown'}`;

    case 'add_comment':
    case 'delete_comment':
      let commentMsg = action === 'add_comment' ? 'Added comment' : 'Deleted comment';
      if (details.roadmapItemTopic) {
        commentMsg += ` on "${details.roadmapItemTopic}"`;
      } else if (details.roadmapItemId) {
        commentMsg += ` on item ID ...${details.roadmapItemId.slice(-6)}`;
      }
      if (resourceName) {
        commentMsg += ` in Tech Stack "${resourceName}"`;
      }
      if (details.commentId) {
        commentMsg += ` (Comment ID: ...${details.commentId.slice(-6)})`;
      }
      return commentMsg;

    case 'create_techstack':
      return `Created Tech Stack: "${resourceName || 'N/A'}"`;
    case 'edit_techstack':
      return `Edited Tech Stack: "${resourceName || 'N/A'}"`;
    case 'delete_techstack':
      return `Deleted Tech Stack: "${resourceName || 'N/A'}"`;
    
    case 'create_roadmap':
      return `Created Roadmap: "${resourceName || 'N/A'}"`;
    case 'edit_roadmap':
      return `Edited Roadmap: "${resourceName || 'N/A'}"`;
    case 'delete_roadmap':
      return `Deleted Roadmap: "${resourceName || 'N/A'}"`;

    case 'update_status':
      let statusMsg = `Updated status`;
      if (details.topic) {
         statusMsg += ` for "${details.topic}"`;
      } else if (details.itemId) {
        statusMsg += ` for item ID ...${details.itemId.slice(-6)}`;
      }
      if (resourceName) {
        statusMsg += ` in Tech Stack "${resourceName}"`;
      }
      if (details.newStatus) {
        statusMsg += ` to "${details.newStatus}"`;
      }
      return statusMsg;
      
    default:
      return Object.entries(details)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`)
        .join('; ');
  }
};


const AdminDashboard = ({ setPageLoading }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    counts: { 
      users: 0, 
      techStacks: 0, 
      roadmaps: 0, 
      companywiseStudents: 0,
      activeCompanies: 0,
      inactiveCompanies: 0,
      holdCompanies: 0,
      hubCount: 0,
      hiredCount: 0,
      holdCount: 0,
      rejectCount: 0,
      postInternshipCount: 0
    },
    itemStats: { 'Completed': 0, 'In Progress': 0, 'Yet to Start': 0 },
    progressPercentage: 0,
    recentActivity: [], 
    userRoleCounts: {} 
  });
  const [techStackProgress, setTechStackProgress] = useState([]);
  const [allInstructors, setAllInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);

  const [showInstructorsModal, setShowInstructorsModal] = useState(false);
  const [instructorsListForModal, setInstructorsListForModal] = useState([]);
  const [loadingInstructorsModal, setLoadingInstructorsModal] = useState(false);

  const [showAllActivityModal, setShowAllActivityModal] = useState(false);
  const [allActivityLogs, setAllActivityLogs] = useState([]);
  const [loadingAllActivity, setLoadingAllActivity] = useState(false);


  useEffect(() => {
    const fetchAdminDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        setModalError(null);
        if (setPageLoading) setPageLoading(true);
        
        const [summaryResponse, timelineResponse, usersResponse, allLogsResponseIfAdmin] = await Promise.all([
          statsService.getDashboardSummary(),
          statsService.getTimelineStats(),
          userService.getUsers(),
          activityLogService.getAllActivityLogs() 
        ]);
        
        if (summaryResponse && summaryResponse.counts && summaryResponse.itemStats && summaryResponse.userRoleCounts) {
          setStats({
            counts: summaryResponse.counts || { users: 0, techStacks: 0, roadmaps: 0, companywiseStudents: 0, activeCompanies: 0, inactiveCompanies: 0, holdCompanies: 0, hubCount: 0, hiredCount: 0, holdCount: 0, rejectCount: 0, postInternshipCount: 0 },
            itemStats: summaryResponse.itemStats || { 'Completed': 0, 'In Progress': 0, 'Yet to Start': 0 },
            progressPercentage: summaryResponse.progressPercentage || 0,
            recentActivity: summaryResponse.recentActivity || [], 
            userRoleCounts: summaryResponse.userRoleCounts || {}
          });
        } else {
          console.warn('Invalid summary stats response structure:', summaryResponse);
          setError(prev => prev ? `${prev}\nReceived invalid summary data.` : 'Received invalid summary data.');
        }

        if (timelineResponse && timelineResponse.techStackProgress) {
          setTechStackProgress(timelineResponse.techStackProgress);
        }

        if (usersResponse && usersResponse.data) {
          setAllInstructors(usersResponse.data.filter(u => u.role === 'instructor'));
        }

        if (allLogsResponseIfAdmin && allLogsResponseIfAdmin.data) {
          setAllActivityLogs(allLogsResponseIfAdmin.data);
        } else {
          console.warn('Failed to fetch all activity logs or no data returned for admin.');
          setAllActivityLogs([]);
        }
        
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
        setError('Failed to load dashboard statistics. Please try again later.');
      } finally {
        setLoading(false);
        if (setPageLoading) setPageLoading(false);
      }
    };

    fetchAdminDashboardData();
  }, [setPageLoading]);

  const getTechStackOverallStatusBadge = (percentage) => {
    if (percentage === 100) return 'success';
    if (percentage > 0) return 'warning';
    return 'danger';
  }
  
  const getTechStackOverallStatusText = (percentage) => {
    if (percentage === 100) return 'Completed';
    if (percentage > 0) return 'In Progress';
    return 'Yet to Start';
  }

  const getAssignedInstructorsForTechStack = (techStackId) => {
    if (!techStackId || allInstructors.length === 0) return [];
    return allInstructors
      .filter(instructor => 
        instructor.assignedTechStacks && 
        instructor.assignedTechStacks.some(assignedTS => assignedTS._id === techStackId)
      )
      .map(instructor => `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.username);
  };

  const handleShowInstructorsModal = () => {
    setModalError(null);
    setInstructorsListForModal(allInstructors.map(instr => ({
        ...instr,
        assignedTechStacks: Array.isArray(instr.assignedTechStacks) ? instr.assignedTechStacks : []
    })));
    setShowInstructorsModal(true);
  };

  const handleShowAllActivityModal = async () => {
    setShowAllActivityModal(true);
  };


  return (
    <div className="">

      {error && !showInstructorsModal && !showAllActivityModal && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="border-0 shadow-sm">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary" size="sm">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2 text-muted small">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <Row xs={1} sm={2} md={3} lg={5} className="g-3 mb-4">
            <Col xs={6} sm={4} md={true} className="col-lg">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-primary bg-opacity-10 py-1 px-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="text-primary mb-0 fw-bold">Users</h6>
                    <i className="fas fa-users text-primary"></i>
                  </div>
                </div>
                <Card.Body className="py-2 px-3 d-flex flex-column">
                  <h3 className="mb-0 fw-bold">{stats.counts?.users || 0}</h3>
                  <Link to="/users" className="text-decoration-none small d-block mt-auto pt-1">
                    <span className="text-muted">Manage</span>
                    <i className="fas fa-chevron-right ms-1 small"></i>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={6} sm={4} md={true} className="col-lg">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-success bg-opacity-10 py-1 px-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="text-success mb-0 fw-bold">Tech Stacks</h6>
                    <i className="fas fa-layer-group text-success"></i>
                  </div>
                </div>
                <Card.Body className="py-2 px-3 d-flex flex-column">
                  <h3 className="mb-0 fw-bold">{stats.counts?.techStacks || 0}</h3>
                  <Link to="/alltechstacks" className="text-decoration-none small d-block mt-auto pt-1">
                    <span className="text-muted">View All</span>
                    <i className="fas fa-chevron-right ms-1 small"></i>
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={6} sm={4} md={true} className="col-lg">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-info bg-opacity-10 py-1 px-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="text-info mb-0 fw-bold">Instructors</h6>
                    <i className="fas fa-chalkboard-teacher text-info"></i>
                  </div>
                </div>
                <Card.Body className="py-2 px-3 d-flex flex-column">
                  <h3 className="mb-0 fw-bold">{stats.userRoleCounts?.instructor || 0}</h3>
                  <Button variant="link" className="text-decoration-none small d-block mt-auto pt-1 p-0 text-start" onClick={handleShowInstructorsModal}>
                    <span className="text-muted">View Details</span>
                    <i className="fas fa-chevron-right ms-1 small text-muted"></i>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={6} sm={6} md={true} className="col-lg">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-secondary bg-opacity-10 py-1 px-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="text-secondary mb-0 fw-bold">Roadmaps</h6>
                    <i className="fas fa-map text-secondary"></i>
                  </div>
                </div>
                <Card.Body className="py-2 px-3 d-flex flex-column">
                  <h3 className="mb-0 fw-bold">{stats.counts?.roadmaps || 0}</h3>
                  <Link to="/manage-roadmaps" className="text-decoration-none small d-block mt-auto pt-1">
                    <span className="text-muted">View All</span>
                    <i className="fas fa-chevron-right ms-1 small"></i>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={12} sm={6} md={true} className="col-lg">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-warning bg-opacity-10 py-1 px-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="text-warning mb-0 fw-bold">Companywise Students</h6>
                    <i className="fas fa-user-graduate text-warning"></i>
                  </div>
                </div>
                <Card.Body className="py-2 px-3 d-flex flex-column">
                  <h3 className="mb-0 fw-bold">{stats.counts?.companywiseStudents || 0}</h3>
                  <Link to="/students-tracker" className="text-decoration-none small d-block mt-auto pt-1">
                    <span className="text-muted">View Progress</span>
                    <i className="fas fa-chevron-right ms-1 small"></i>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col><InstructorProgressTable /></Col>
          </Row>
          
          <Row className="mb-4">
            <Col lg={8} className="mb-4 mb-lg-0">
              <Card className="border-0 shadow-sm rounded-3 h-100">
                <Card.Header className="bg-white py-3 border-bottom-0 fw-bold">
                  <h5 className="mb-0">Tech Stack Item Progress</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  {techStackProgress.length > 0 ? (
                    <div className="table-responsive" style={{ maxHeight: '400px' }}>
                      <Table hover className="mb-0 align-middle">
                        <thead className="bg-light">
                          <tr>
                            <th>Instructor Name(s)</th>
                            <th>Tech Stack</th>
                            <th className="text-center">Total Items</th>
                            <th className="text-center">Progress</th>
                            <th className="text-center">Overall Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {techStackProgress.map((stack, index) => {
                            const assignedInstructors = getAssignedInstructorsForTechStack(stack._id);
                            return (
                              <tr key={stack._id || index}>
                                <td>
                                  {assignedInstructors.length > 0 ? (
                                    assignedInstructors.map((name, idx) => (
                                      <div key={idx} className="small">{name}</div>
                                    ))
                                  ) : (
                                    <></> 
                                  )}
                                </td>
                                <td className="fw-medium">{stack.name}</td>
                                <td className="text-center">{stack.totalItems}</td>
                                <td className="text-center">
                                  <span className={`fw-bold text-${getTechStackOverallStatusBadge(stack.completionPercentage)}`}>
                                    {Math.round(stack.completionPercentage)}%
                                  </span>
                                </td>
                                <td className="text-center">
                                  <Badge 
                                    bg={getTechStackOverallStatusBadge(stack.completionPercentage)}
                                    className="rounded-pill px-2 py-1"
                                  >
                                    {getTechStackOverallStatusText(stack.completionPercentage)}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                     <div className="text-center p-4">
                        <i className="fas fa-info-circle fa-2x text-muted mb-2"></i>
                        <p className="text-muted mb-0">No tech stack progress data available.</p>
                     </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4}>
                <Card className="border-0 shadow-sm rounded-3 h-100">
                    <Card.Header className="bg-white py-3 border-0 fw-bold">
                        <h5 className="mb-0">At a Glance</h5>
                    </Card.Header>
                    <Card.Body className="py-2">
                        <Table borderless size="sm" className="mb-0">
                            <tbody>
                                <tr className="border-bottom">
                                    <td className="py-2">Active Companies</td>
                                    <td className="text-end py-2"><Badge bg="success-subtle" text="success-emphasis" className="rounded-pill fs-6">{stats.counts?.activeCompanies || 0}</Badge></td>
                                </tr>
                                <tr className="border-bottom">
                                    <td className="py-2">Inactive Companies</td>
                                    <td className="text-end py-2"><Badge bg="secondary-subtle" text="secondary-emphasis" className="rounded-pill fs-6">{stats.counts?.inactiveCompanies || 0}</Badge></td>
                                </tr>
                                <tr className="border-bottom">
                                    <td className="py-2">Overall Students HUB</td>
                                    <td className="text-end py-2"><Badge bg="primary-subtle" text="primary-emphasis" className="rounded-pill fs-6">{stats.counts?.hubCount || 0}</Badge></td>
                                </tr>
                                <tr className="border-bottom">
                                    <td className="py-2">Hired Students</td>
                                    <td className="text-end py-2"><Badge bg="success-subtle" text="success-emphasis" className="rounded-pill fs-6">{stats.counts?.hiredCount || 0}</Badge></td>
                                </tr>
                                <tr className="border-bottom">
                                    <td className="py-2">Hold Students</td>
                                    <td className="text-end py-2"><Badge bg="warning-subtle" text="warning-emphasis" className="rounded-pill fs-6">{stats.counts?.holdCount || 0}</Badge></td>
                                </tr>
                                <tr className="border-bottom">
                                    <td className="py-2">Reject Students</td>
                                    <td className="text-end py-2"><Badge bg="danger-subtle" text="danger-emphasis" className="rounded-pill fs-6">{stats.counts?.rejectCount || 0}</Badge></td>
                                </tr>
                                <tr>
                                    <td className="py-2">Post Internships Students</td>
                                    <td className="text-end py-2"><Badge bg="info-subtle" text="info-emphasis" className="rounded-pill fs-6">{stats.counts?.postInternshipCount || 0}</Badge></td>
                                </tr>
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Col>
          </Row>
          
          <Card className="border-0 shadow-sm rounded-3 mb-4">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center fw-bold">
              <h5 className="mb-0">Recent Activity</h5>
              <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={handleShowAllActivityModal}>
                <i className="fas fa-history me-1"></i>
                View All
              </Button>
            </Card.Header>
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0">User</th>
                    <th className="border-0">Action</th>
                    <th className="border-0">Details</th>
                    <th className="border-0">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.map((activity, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                              <i className="fas fa-user text-primary"></i>
                            </div>
                            <div>
                              <div className="fw-medium">
                                {activity.user?.firstName 
                                  ? `${activity.user.firstName} ${activity.user.lastName || ''}`
                                  : activity.user?.username || 'Unknown User'
                                }
                              </div>
                              {activity.user?.role && (
                                <Badge 
                                  bg={getRoleBadgeColor(activity.user.role)} 
                                  className="rounded-pill small px-2 py-1"
                                >
                                  {activity.user.role}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge 
                            bg="light" 
                            text="dark"
                            className="rounded-pill small px-2 py-1"
                          >
                            {(activity.action || '').replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="text-truncate" style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                           {formatActivityDetails(activity.details, activity.action, activity.resourceId?.name)}
                        </td>
                        <td>
                          <span className="text-muted small">
                            {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-3">
                        <p className="text-muted mb-0">No recent activity</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <Modal show={showInstructorsModal} onHide={() => setShowInstructorsModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title><i className="fas fa-chalkboard-teacher me-2"></i>Instructors List</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loadingInstructorsModal ? ( 
            <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-2 mb-0 text-muted">Loading instructors...</p></div>
          ) : modalError ? ( 
            <Alert variant="danger">{modalError}</Alert>
          ) : instructorsListForModal.length > 0 ? (
            <Table striped bordered hover responsive size="sm">
              <thead className="bg-light"><tr><th>Instructor Name</th><th>Assigned Tech Stacks</th></tr></thead>
              <tbody>
                {instructorsListForModal.map(instructor => (
                  <tr key={instructor._id}>
                    <td>{instructor.firstName || instructor.username} {instructor.lastName || ''}</td>
                    <td>
                      {instructor.assignedTechStacks && instructor.assignedTechStacks.length > 0 ? (
                        instructor.assignedTechStacks.map(stack => (
                          <Badge key={stack._id} pill bg="secondary" className="me-1 mb-1 fw-normal">{stack.name}</Badge>
                        ))
                      ) : (<span className="text-muted fst-italic">None assigned</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (<div className="text-center py-4"><i className="fas fa-user-times fa-2x text-muted mb-2"></i><p className="text-muted mb-0">No instructors found.</p></div>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowInstructorsModal(false)}>Close</Button></Modal.Footer>
      </Modal>

      <Modal show={showAllActivityModal} onHide={() => setShowAllActivityModal(false)} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title><i className="fas fa-history me-2"></i>All Activity Logs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingAllActivity ? (
             <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-2 mb-0 text-muted">Loading all activities...</p></div>
          ) : modalError && allActivityLogs.length === 0 ? (
             <Alert variant="danger">{modalError || "Failed to load activity logs."}</Alert>
          ) : allActivityLogs.length > 0 ? (
            <Table striped bordered hover responsive size="sm">
              <thead className="bg-light sticky-top">
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Resource</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {allActivityLogs.map(log => (
                  <tr key={log._id}>
                    <td>{log.user?.firstName ? `${log.user.firstName} ${log.user.lastName || ''}` : log.user?.username || 'N/A'}</td>
                    <td>
                      {log.user?.role && (
                        <Badge bg={getRoleBadgeColor(log.user.role)} className="rounded-pill small px-2 py-1">
                          {log.user.role}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="rounded-pill small px-2 py-1">
                        {(log.action || '').replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="small" style={{maxWidth: '250px', overflowWrap: 'break-word', whiteSpace: 'normal'}}>
                      {formatActivityDetails(log.details, log.action, log.resourceId?.name)}
                    </td>
                    <td>{log.resourceId?.name || (log.resourceId ? `ID: ...${log.resourceId.toString().slice(-6)}` : '-')}</td>
                    <td>{log.ip || '-'}</td>
                    <td className="small">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4"><i className="fas fa-folder-open fa-2x text-muted mb-2"></i><p className="text-muted mb-0">No activity logs found.</p></div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAllActivityModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
