// client/src/pages/ContentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Badge, Spinner, Alert, Form, InputGroup, Modal, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; 
import statsService from '../services/statsService';
import { getAllTechStacks, getTechStackById, updateTechStack, deleteTechStack } from '../services/techStackService'; 
import TechStackTable from '../components/TechStackTable/TechStackTable'; 
import Papa from 'papaparse'; 

const ContentDashboard = ({ setPageLoading }) => {
  const { user } = useAuth(); // Get user from AuthContext to check role
  const [dashboardStats, setDashboardStats] = useState({
    completed: { count: 0, percentage: 0 },
    inProgress: { count: 0, percentage: 0 },
    notStarted: { count: 0, percentage: 0 },
    totalItems: 0,
  });
  const [techStacks, setTechStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showTechStackModal, setShowTechStackModal] = useState(false);
  const [selectedTechStackForModal, setSelectedTechStackForModal] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); 
        if (setPageLoading) setPageLoading(true);
        
        const [allTechStacksResponse, techStackStatsResponse] = await Promise.all([
          getAllTechStacks(), 
          statsService.getTechStackStats('daily') 
        ]);

        let fullTechStacksData = [];
        if (allTechStacksResponse && allTechStacksResponse.data) {
            const techStackDetailsPromises = allTechStacksResponse.data.map(ts => getTechStackById(ts._id));
            const techStackDetailsResults = await Promise.allSettled(techStackDetailsPromises);
            fullTechStacksData = techStackDetailsResults
                .filter(result => result.status === 'fulfilled' && result.value && result.value.data)
                .map(result => result.value.data);
        }
        setTechStacks(fullTechStacksData);
        
        if (techStackStatsResponse && techStackStatsResponse.stats) {
          const { completed, inProgress, notStarted, total } = techStackStatsResponse.stats;
          setDashboardStats({
            completed: completed || { count: 0, percentage: 0 },
            inProgress: inProgress || { count: 0, percentage: 0 },
            notStarted: notStarted || { count: 0, percentage: 0 },
            totalItems: total || 0,
          });
        } else {
          console.warn("Stats response was not as expected:", techStackStatsResponse);
           setDashboardStats({
            completed: { count: 0, percentage: 0 },
            inProgress: { count: 0, percentage: 0 },
            notStarted: { count: 0, percentage: 0 },
            totalItems: 0,
          });
        }
        
        setLoading(false);
        if (setPageLoading) setPageLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
        if (setPageLoading) setPageLoading(false);
      }
    };

    fetchData();
  }, [setPageLoading]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTechStacks = techStacks.filter(techStack => {
    const searchLower = searchTerm.toLowerCase();
    return (
      techStack.name.toLowerCase().includes(searchLower) ||
      (techStack.description && techStack.description.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (techStack) => {
    if (!techStack.roadmapItems || techStack.roadmapItems.length === 0) {
      return 0;
    }
    const completed = techStack.roadmapItems.filter(item => 
      item.completionStatus === 'Completed'
    ).length;
    return Math.round((completed / techStack.roadmapItems.length) * 100);
  };

  const handleViewDetails = (techStack) => {
    setSelectedTechStackForModal(techStack);
    setShowTechStackModal(true);
  };

  const handleTechStackUpdate = (updatedTechStack) => {
    setTechStacks(prevTechStacks => 
      prevTechStacks.map(ts => ts._id === updatedTechStack._id ? updatedTechStack : ts)
    );
    if (selectedTechStackForModal && selectedTechStackForModal._id === updatedTechStack._id) {
      setSelectedTechStackForModal(updatedTechStack);
    }
  };

  const handleTechStackDelete = (deletedId) => {
    setTechStacks(prevTechStacks => prevTechStacks.filter(ts => ts._id !== deletedId));
    if (selectedTechStackForModal && selectedTechStackForModal._id === deletedId) {
      setShowTechStackModal(false);
      setSelectedTechStackForModal(null);
    }
  };

  const exportTechStackToCSV = (techStack) => {
    if (!techStack || !techStack.roadmapItems) {
        alert("No data to export.");
        return;
    }

    const headers = techStack.headers || { topic: "Topic", subTopics: "Sub-Topics", projects: "Projects", status: "Status" };
    
    const csvData = techStack.roadmapItems.map(item => {
        const subTopicsString = item.subTopics.map(st => st.name).join('; '); 
        const projectsString = item.projects.map(p => p.name).join('; ');
        return {
            [headers.topic]: item.topic,
            [headers.subTopics]: subTopicsString,
            [headers.projects]: projectsString,
            [headers.status]: item.completionStatus
        };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${techStack.name.replace(/\s+/g, '_')}_roadmap.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };


  return (
    <div className="content-dashboard">

      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <h5 className="mb-0 me-2">Manage Tech Stacks</h5>
                <Badge pill bg="secondary">
                  {techStacks.length}
                </Badge>
              </div>
              {/* Conditionally render Add New Tech Stack button */}
              {(user.role === 'content' || user.role === 'admin') && (
                <Link to="/newtechstack" className="btn btn-sm btn-primary">
                  <i className="fas fa-plus me-2"></i>
                  Add New Tech Stack
                </Link>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              <div className="p-3 border-bottom">
                <Row className="g-3">
                  <Col>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-search"></i>
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Search tech stacks..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                      {searchTerm && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setSearchTerm('')}
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      )}
                    </InputGroup>
                  </Col>
                </Row>
              </div>
              
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Tech Stack</th>
                      <th>Description</th>
                      <th>Items</th>
                      <th>Progress</th>
                      <th>Last Updated</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTechStacks.length > 0 ? (
                      filteredTechStacks.map((techStack, index) => (
                        <tr key={techStack._id || index}>
                          <td className="fw-medium">{techStack.name}</td>
                          <td>
                            {techStack.description ? (
                              <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                {techStack.description}
                              </span>
                            ) : (
                              <span className="text-muted">No description</span>
                            )}
                          </td>
                          <td className="text-center">
                            <Badge bg="light" text="dark" className="rounded-pill">
                              {techStack.roadmapItems?.length || 0}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="flex-grow-1 me-2">
                                <ProgressBar 
                                    now={calculateProgress(techStack)}
                                    variant={calculateProgress(techStack) > 70 ? 'success' : calculateProgress(techStack) > 30 ? 'warning' : 'danger'}
                                    style={{ height: '8px' }}
                                />
                              </div>
                              <span className="text-muted small">{calculateProgress(techStack)}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted small">
                              {formatDate(techStack.updatedAt)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <Button 
                                variant="outline-info" 
                                size="sm"
                                onClick={() => handleViewDetails(techStack)}
                                title="View & Edit Details"
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button 
                                variant="outline-success" 
                                size="sm"
                                onClick={() => exportTechStackToCSV(techStack)}
                                title="Export to CSV"
                              >
                                <i className="fas fa-file-csv"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <i className="fas fa-layer-group fa-2x text-muted mb-3"></i>
                          <h5>No Tech Stacks Found</h5>
                          <p className="text-muted mb-3">
                            {searchTerm 
                              ? "No tech stacks match your search criteria"
                              : (user.role === 'content' || user.role === 'admin') 
                                ? "You haven't created any tech stacks yet" 
                                : "No tech stacks available to view."
                            }
                          </p>
                          {(user.role === 'content' || user.role === 'admin') && (
                            <Link to="/newtechstack" className="btn btn-primary">
                              <i className="fas fa-plus me-2"></i>
                              Create New Tech Stack
                            </Link>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
          
          <Modal show={showTechStackModal} onHide={() => setShowTechStackModal(false)} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>{selectedTechStackForModal?.name || 'Tech Stack Details'}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {selectedTechStackForModal && (
                    <TechStackTable
                        techStackData={selectedTechStackForModal}
                        onUpdate={handleTechStackUpdate}
                        onDelete={handleTechStackDelete} 
                        userRole={user?.role} 
                    />
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowTechStackModal(false)}>
                    Close
                </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default ContentDashboard;