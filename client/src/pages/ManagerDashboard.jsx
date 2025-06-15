// client/src/pages/ManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Badge, Form, Spinner, Alert, Modal, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import statsService from '../services/statsService';
import userService from '../services/userService';
import { getRoleBadgeColor } from '../services/rolesService';
import InstructorProgressTable from '../components/InstructorProgress/InstructorProgressTable';

// Import Chart.js components
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ManagerDashboard = ({ setPageLoading }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null); 
  const [userActivityStats, setUserActivityStats] = useState(null); 
  const [loading,setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [techStackProgress, setTechStackProgress] = useState([]); 
  const [allInstructors, setAllInstructors] = useState([]); 

  const [showInstructorsModal, setShowInstructorsModal] = useState(false);
  const [instructorsList, setInstructorsList] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [modalError, setModalError] = useState(null); 

  const [showTechStackStatusModal, setShowTechStackStatusModal] = useState(false);
  const [techStackStatusModalTitle, setTechStackStatusModalTitle] = useState('');
  const [techStackStatusModalData, setTechStackStatusModalData] = useState([]);
  const [loadingTechStackStatusModal, setLoadingTechStackStatusModal] = useState(false);

  const [progressChartView, setProgressChartView] = useState('items'); 


  const dashboardDisplayName = user?.firstName ? `${user.firstName}'s` : user?.username ? `${user.username}'s` : "Manager";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (setPageLoading) setPageLoading(true);
        
        const [dashboardResponse, activityResponse, timelineResponse, usersResponse] = await Promise.all([
          statsService.getDashboardSummary(),
          statsService.getUserActivityStats(period),
          statsService.getTimelineStats(),
          userService.getUsers() 
        ]);
        
        setStats(dashboardResponse); 
        setUserActivityStats(activityResponse); 
        
        if (timelineResponse && timelineResponse.techStackProgress) {
          setTechStackProgress(timelineResponse.techStackProgress);
        }

        if (usersResponse && usersResponse.data) {
            setAllInstructors(usersResponse.data.filter(u => u.role === 'instructor'));
        }
        
      } catch (err) {
        setError('Failed to load dashboard data. ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
        if (setPageLoading) setPageLoading(false);
      }
    };

    fetchData();
  }, [period, setPageLoading]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleShowInstructorsModal = async () => {
    setShowInstructorsModal(true);
    setLoadingInstructors(true);
    setModalError(null);
    try {
      setInstructorsList(allInstructors.map(instr => ({
        ...instr,
        assignedTechStacks: Array.isArray(instr.assignedTechStacks) ? instr.assignedTechStacks : []
      })));
    } catch (err) { 
      setModalError("Failed to load instructor details. " + (err.response?.data?.error || err.message));
      setInstructorsList([]);
    } finally {
      setLoadingInstructors(false);
    }
  };

  const handleShowTechStackStatusModal = (statusTypeKey, title) => {
    if (stats && stats.techStackStatusDetails && stats.techStackStatusDetails[statusTypeKey]) {
      setTechStackStatusModalTitle(title);
      setTechStackStatusModalData(stats.techStackStatusDetails[statusTypeKey]);
      setModalError(null);
    } else {
      setModalError(`No data available for ${title}. Please refresh the dashboard.`);
      setTechStackStatusModalData([]);
      setTechStackStatusModalTitle(title);
    }
    setShowTechStackStatusModal(true);
  };

  const getAssignedInstructorsForTechStack = (techStackId) => {
    if (!techStackId || allInstructors.length === 0) return [];
    return allInstructors
      .filter(instructor => 
        instructor.assignedTechStacks && 
        instructor.assignedTechStacks.some(assignedTS => assignedTS._id === techStackId)
      )
      .map(instructor => `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.username);
  };

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

  const itemProgressChartData = {
    labels: ['Completed', 'In Progress', 'Yet to Start'],
    datasets: [
      {
        label: 'Number of Items',
        data: [
          stats?.itemStats?.['Completed'] || 0,
          stats?.itemStats?.['In Progress'] || 0,
          stats?.itemStats?.['Yet to Start'] || 0,
        ],
        backgroundColor: ['rgba(40, 167, 69, 0.7)','rgba(255, 193, 7, 0.7)','rgba(220, 53, 69, 0.7)',],
        borderColor: ['rgba(40, 167, 69, 1)','rgba(255, 193, 7, 1)','rgba(220, 53, 69, 1)',],
        borderWidth: 1,
      },
    ],
  };

  const itemProgressChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {legend: { display: false },title: { display: false },tooltip: {callbacks: {label: function(context) {return `${context.dataset.label || ''}: ${context.parsed.y} items`;}}}},
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Items' } }, x: { title: {display: true, text: 'Status'} } },
  };

  const techStackProgressChartData = {
    labels: ['Completed Stacks', 'In Progress Stacks', 'Yet to Start Stacks'],
    datasets: [
      {
        label: 'Number of Tech Stacks',
        data: [
          stats?.techStackStatusCounts?.completed || 0,
          stats?.techStackStatusCounts?.inProgress || 0,
          stats?.techStackStatusCounts?.yetToStart || 0,
        ],
        backgroundColor: ['rgba(40, 167, 69, 0.7)','rgba(255, 193, 7, 0.7)','rgba(220, 53, 69, 0.7)',],
        borderColor: ['rgba(40, 167, 69, 1)','rgba(255, 193, 7, 1)','rgba(220, 53, 69, 1)',],
        borderWidth: 1,
      },
    ],
  };

  const techStackProgressChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {legend: { display: false },title: { display: false },tooltip: {callbacks: {label: function(context) {return `${context.dataset.label || ''}: ${context.parsed.y} tech stacks`;}}}},
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Tech Stacks' } }, x: {title: {display: true, text: 'Overall Status'}} },
  };


  return (
    <div className="">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div>
          <h1 className="h4 fw-bold mb-1">{dashboardDisplayName} Dashboard</h1>
          <p className="text-muted mb-0">Welcome back, {user?.firstName || user?.username}</p>
        </div>
        <div className="btn-group mt-2 mt-md-0">
          <Button variant={period === 'daily' ? 'primary' : 'outline-primary'} onClick={() => handlePeriodChange('daily')} size="sm">Daily</Button>
          <Button variant={period === 'weekly' ? 'primary' : 'outline-primary'} onClick={() => handlePeriodChange('weekly')} size="sm">Weekly</Button>
          <Button variant={period === 'monthly' ? 'primary' : 'outline-primary'} onClick={() => handlePeriodChange('monthly')} size="sm">Monthly</Button>
        </div>
      </div>
      
      {error && !showInstructorsModal && !showTechStackStatusModal && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="border-0 shadow-sm">
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </Alert>
      )}
      
      {loading && !stats ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary" size="sm"/><p className="mt-2 text-muted small">Loading dashboard data...</p>
        </div>
      ) : stats ? (
        <>
          {/* 1. Quick Stats - Row of cards */}
          <Row xs={1} sm={2} md={3} lg={3} xl={6} className="g-3 mb-4"> {/* Adjusted xl={6} for 6 cards */}
            <Col className="col-xl">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-primary bg-opacity-10 py-1 px-3"><div className="d-flex align-items-center justify-content-between"><h6 className="text-primary mb-0 fw-bold">Total Stacks</h6><i className="fas fa-layer-group text-primary"></i></div></div>
                <Card.Body className="py-2 px-3 d-flex flex-column"><h3 className="mb-0 fw-bold">{stats.counts?.techStacks || 0}</h3>
                  <Link to="/alltechstacks" className="text-decoration-none small d-block mt-auto pt-1"><span className="text-muted">View All</span><i className="fas fa-chevron-right ms-1 small"></i></Link>
                </Card.Body>
              </Card>
            </Col>
            <Col className="col-xl">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-info bg-opacity-10 py-1 px-3"><div className="d-flex align-items-center justify-content-between"><h6 className="text-info mb-0 fw-bold">Instructors</h6><i className="fas fa-chalkboard-teacher text-info"></i></div></div>
                <Card.Body className="py-2 px-3 d-flex flex-column"><h3 className="mb-0 fw-bold">{stats.userRoleCounts?.instructor || 0}</h3>
                  <Button variant="link" className="text-decoration-none small d-block mt-auto pt-1 p-0 text-start" onClick={handleShowInstructorsModal}><span className="text-muted">View Details</span><i className="fas fa-chevron-right ms-1 small text-muted"></i></Button>
                </Card.Body>
              </Card>
            </Col>
            {/* ADDED ROADMAPS CARD */}
            <Col className="col-xl">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-secondary bg-opacity-10 py-1 px-3"> {/* Adjusted color */}
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="text-secondary mb-0 fw-bold">Roadmaps</h6><i className="fas fa-map-signs text-secondary"></i> {/* Changed icon */}
                  </div>
                </div>
                <Card.Body className="py-2 px-3 d-flex flex-column">
                  <h3 className="mb-0 fw-bold">{stats.counts?.roadmaps || 0}</h3>
                   <Link to="/manage-roadmaps" className="text-decoration-none small d-block mt-auto pt-1"><span className="text-muted">Manage</span><i className="fas fa-chevron-right ms-1 small"></i></Link>
                </Card.Body>
              </Card>
            </Col>
            <Col className="col-xl">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-success bg-opacity-10 py-1 px-3"><div className="d-flex align-items-center justify-content-between"><h6 className="text-success mb-0 fw-bold">Completed Stacks</h6><i className="fas fa-check-double text-success"></i></div></div>
                <Card.Body className="py-2 px-3 d-flex flex-column"><h3 className="mb-0 fw-bold">{stats.techStackStatusCounts?.completed || 0}</h3>
                   <Button variant="link" className="text-decoration-none small d-block mt-auto pt-1 p-0 text-start" onClick={() => handleShowTechStackStatusModal('completed', 'Completed Tech Stacks')}><span className="text-muted">View Details</span><i className="fas fa-chevron-right ms-1 small text-muted"></i></Button>
                </Card.Body>
              </Card>
            </Col>
            <Col className="col-xl">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-warning bg-opacity-10 py-1 px-3"><div className="d-flex align-items-center justify-content-between"><h6 className="text-warning mb-0 fw-bold">In Progress Stacks</h6><i className="fas fa-tasks text-warning"></i></div></div>
                <Card.Body className="py-2 px-3 d-flex flex-column"><h3 className="mb-0 fw-bold">{stats.techStackStatusCounts?.inProgress || 0}</h3>
                   <Button variant="link" className="text-decoration-none small d-block mt-auto pt-1 p-0 text-start" onClick={() => handleShowTechStackStatusModal('inProgress', 'In Progress Tech Stacks')}><span className="text-muted">View Details</span><i className="fas fa-chevron-right ms-1 small text-muted"></i></Button>
                </Card.Body>
              </Card>
            </Col>
            <Col className="col-xl">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100">
                <div className="bg-danger bg-opacity-10 py-1 px-3"><div className="d-flex align-items-center justify-content-between"><h6 className="text-danger mb-0 fw-bold">Yet to Start Stacks</h6><i className="fas fa-hourglass-start text-danger"></i></div></div>
                <Card.Body className="py-2 px-3 d-flex flex-column"><h3 className="mb-0 fw-bold">{stats.techStackStatusCounts?.yetToStart || 0}</h3>
                   <Button variant="link" className="text-decoration-none small d-block mt-auto pt-1 p-0 text-start" onClick={() => handleShowTechStackStatusModal('yetToStart', 'Yet To Start Tech Stacks')}><span className="text-muted">View Details</span><i className="fas fa-chevron-right ms-1 small text-muted"></i></Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* 2. Instructor Progress Table */}
          <Row className="mb-4">
            <Col><InstructorProgressTable /></Col>
          </Row>

          {/* 3. Tech Stack Item Progress and User Activity */}
          <Row className="mb-4">
            <Col lg={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white py-3 fw-bold"><h5 className="mb-0">Tech Stack Item Progress</h5></Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive" style={{ maxHeight: '400px' }}>
                    <Table hover className="mb-0 align-middle">
                      <thead className="bg-light">
                        <tr><th>Instructor Name(s)</th><th>Tech Stack</th><th className="text-center">Total Items</th><th className="text-center">Progress</th><th className="text-center">Overall Status</th></tr>
                      </thead>
                      <tbody>
                        {techStackProgress.length > 0 ? (
                          techStackProgress.map((stack) => { 
                            const assignedInstructors = getAssignedInstructorsForTechStack(stack._id);
                            return (
                            <tr key={stack._id || stack.name}>
                               <td>{assignedInstructors.length > 0 ? assignedInstructors.map((name, idx) => (<div key={idx} className="small">{name}</div>)) : (<></>)}</td>
                              <td className="fw-medium">{stack.name}</td>
                              <td className="text-center">{stack.totalItems}</td>
                              <td className="text-center"><span className={`fw-bold text-${getTechStackOverallStatusBadge(stack.completionPercentage)}`}>{Math.round(stack.completionPercentage)}%</span></td>
                              <td className="text-center"><Badge bg={getTechStackOverallStatusBadge(stack.completionPercentage)} className="rounded-pill px-2 py-1">{getTechStackOverallStatusText(stack.completionPercentage)}</Badge></td>
                            </tr>);
                          })
                        ) : (<tr><td colSpan={5} className="text-center py-4"><p className="mb-0 text-muted">No tech stack data available</p></td></tr>)}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center fw-bold"><h5 className="mb-0">User Activity</h5><div className="text-muted small">{period.charAt(0).toUpperCase() + period.slice(1)} report</div></Card.Header>
                <Card.Body className="p-0">
                  {userActivityStats && userActivityStats.userActivity && userActivityStats.userActivity.length > 0 ? (
                    <div className="table-responsive" style={{ maxHeight: '400px' }}>
                      <Table hover className="mb-0">
                        <thead className="bg-light"><tr><th>User</th><th>Role</th><th>Actions</th><th>Last Activity</th></tr></thead>
                        <tbody>
                          {userActivityStats.userActivity.map((activity, index) => (
                            <tr key={index}>
                              <td className="fw-medium">{activity.firstName ? `${activity.firstName} ${activity.lastName || ''}`: activity.username}</td>
                              <td><Badge bg={getRoleBadgeColor(activity.role)}>{activity.role}</Badge></td>
                              <td>{activity.count}</td>
                              <td className="text-muted small">{activity.actions && activity.actions.length > 0 ? new Date(activity.actions[0].timestamp).toLocaleString() : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (<div className="text-center py-4"><p className="mb-0 text-muted">No activity data available for the selected period.</p></div>)}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* 4. Overall Item/Tech Stack Progress Chart */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white py-3 fw-bold d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Overall Progress Overview</h5>
              <Dropdown onSelect={(eventKey) => setProgressChartView(eventKey)} size="sm">
                <Dropdown.Toggle variant="outline-secondary" id="progress-chart-view-dropdown">
                  View: {progressChartView === 'items' ? 'Items Wise' : 'Tech Stacks Wise'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item eventKey="items" active={progressChartView === 'items'}>Items Wise</Dropdown.Item>
                  <Dropdown.Item eventKey="techStacks" active={progressChartView === 'techStacks'}>Tech Stacks Wise</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Card.Header>
            <Card.Body>
              <div className="mb-3 d-flex justify-content-around text-center">
                {progressChartView === 'items' ? (
                    <>
                        <div><h4 className="text-success mb-0">{stats.itemStats?.['Completed'] || 0}</h4><small className="text-muted">Completed Items</small></div>
                        <div><h4 className="text-warning mb-0">{stats.itemStats?.['In Progress'] || 0}</h4><small className="text-muted">In Progress Items</small></div>
                        <div><h4 className="text-danger mb-0">{stats.itemStats?.['Yet to Start'] || 0}</h4><small className="text-muted">Yet to Start Items</small></div>
                        <div><h4 className="text-primary mb-0">{stats.counts?.totalItems || 0}</h4><small className="text-muted">Total Items</small></div>
                    </>
                ) : (
                    <>
                        <div><h4 className="text-success mb-0">{stats.techStackStatusCounts?.completed || 0}</h4><small className="text-muted">Completed Stacks</small></div>
                        <div><h4 className="text-warning mb-0">{stats.techStackStatusCounts?.inProgress || 0}</h4><small className="text-muted">In Progress Stacks</small></div>
                        <div><h4 className="text-danger mb-0">{stats.techStackStatusCounts?.yetToStart || 0}</h4><small className="text-muted">Yet to Start Stacks</small></div>
                        <div><h4 className="text-primary mb-0">{stats.counts?.techStacks || 0}</h4><small className="text-muted">Total Stacks</small></div>
                    </>
                )}
              </div>
              <div style={{ height: '300px' }}>
                <Bar 
                    data={progressChartView === 'items' ? itemProgressChartData : techStackProgressChartData} 
                    options={progressChartView === 'items' ? itemProgressChartOptions : techStackProgressChartOptions} 
                />
              </div>
            </Card.Body>
          </Card>
        </>
      ) : (
        <div className="text-center py-5">
          <i className="fas fa-exclamation-circle fa-3x text-secondary mb-3"></i><h4>No Data Available</h4>
          <p className="text-muted">Please try again later or contact support if the issue persists.</p>
          <Button variant="primary" onClick={() => window.location.reload()}><i className="fas fa-sync-alt me-2"></i>Refresh Page</Button>
        </div>
      )}

      {/* Modals ... */}
      <Modal show={showInstructorsModal} onHide={() => setShowInstructorsModal(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title><i className="fas fa-chalkboard-teacher me-2"></i>Instructors List</Modal.Title></Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loadingInstructors ? (<div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-2 mb-0 text-muted">Loading instructors...</p></div>
          ) : modalError ? (<Alert variant="danger">{modalError}</Alert>
          ) : instructorsList.length > 0 ? (
            <Table striped bordered hover responsive size="sm">
              <thead className="bg-light"><tr><th>Instructor Name</th><th>Assigned Tech Stacks</th></tr></thead>
              <tbody>
                {instructorsList.map(instructor => (
                  <tr key={instructor._id}>
                    <td>{instructor.firstName || instructor.username} {instructor.lastName || ''}</td>
                    <td>{instructor.assignedTechStacks && instructor.assignedTechStacks.length > 0 ? (instructor.assignedTechStacks.map(stack => (<Badge key={stack._id} pill bg="secondary" className="me-1 mb-1 fw-normal">{stack.name}</Badge>))) : (<span className="text-muted fst-italic">None assigned</span>)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (<div className="text-center py-4"><i className="fas fa-user-times fa-2x text-muted mb-2"></i><p className="text-muted mb-0">No instructors found.</p></div>)}
        </Modal.Body>
        <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowInstructorsModal(false)}>Close</Button></Modal.Footer>
      </Modal>

      <Modal show={showTechStackStatusModal} onHide={() => setShowTechStackStatusModal(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title><i className={`fas ${techStackStatusModalTitle.includes('Completed') ? 'fa-check-double text-success' : techStackStatusModalTitle.includes('Progress') ? 'fa-tasks text-warning' : 'fa-hourglass-start text-danger'} me-2`}></i>{techStackStatusModalTitle}</Modal.Title></Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loadingTechStackStatusModal ? (<div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-2 mb-0 text-muted">Loading data...</p></div>
          ) : modalError && techStackStatusModalData.length === 0 ? (<Alert variant="danger">{modalError}</Alert>
          ) : techStackStatusModalData.length > 0 ? (
            <Table striped bordered hover responsive size="sm">
              <thead className="bg-light"><tr><th>Tech Stack Name</th><th>Assigned Instructor(s)</th></tr></thead>
              <tbody>
                {techStackStatusModalData.map(tsItem => (
                  <tr key={tsItem._id}>
                    <td>{tsItem.name}</td>
                    <td>{tsItem.instructors.map((instructorName, idx) => (<Badge key={idx} pill bg="info" text="dark" className="me-1 mb-1 fw-normal">{instructorName}</Badge>))}{tsItem.instructors.length === 0 || (tsItem.instructors.length === 1 && tsItem.instructors[0] === 'N/A') ? (<span className="text-muted fst-italic"></span>): null}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (<div className="text-center py-4"><i className="fas fa-info-circle fa-2x text-muted mb-2"></i><p className="text-muted mb-0">No tech stacks found for this status.</p></div>)}
        </Modal.Body>
        <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowTechStackStatusModal(false)}>Close</Button></Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManagerDashboard;