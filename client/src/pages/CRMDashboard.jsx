// client/src/pages/CRMDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Badge, Spinner, Alert, Form, InputGroup, Modal } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import * as roadmapService from '../services/roadmapService';

const CRMDashboard = ({ setPageLoading }) => {
  const { user } = useAuth(); 
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [companies, setCompanies] = useState([]);

  // State for the company details modal
  const [showCompanyDetailsModal, setShowCompanyDetailsModal] = useState(false);
  const [selectedRoadmapForDetails, setSelectedRoadmapForDetails] = useState(null);

  const dashboardDisplayName = user?.username || user?.firstName || "User";
  
  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        if (setPageLoading) setPageLoading(true);
        
        // This response should now have roles.techStacks populated with { _id, name } objects
        const response = await roadmapService.getAllRoadmaps();
        setRoadmaps(Array.isArray(response.data) ? response.data : []);
        
        if (Array.isArray(response.data)) {
            const uniqueCompanies = [...new Set(response.data.map(roadmap => roadmap.companyName).filter(Boolean))];
            setCompanies(uniqueCompanies);
        } else {
            setCompanies([]);
        }
        
        setLoading(false);
        if (setPageLoading) setPageLoading(false);
      } catch (err) {
        console.error('Failed to load roadmaps:', err);
        setError('Failed to load roadmaps');
        setRoadmaps([]); 
        setCompanies([]);
        setLoading(false);
        if (setPageLoading) setPageLoading(false);
      }
    };

    fetchRoadmaps();
  }, [setPageLoading]);

  const filteredRoadmaps = roadmaps.filter(roadmap => {
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = 
      (roadmap.companyName || '').toLowerCase().includes(searchLower) ||
      (roadmap.isConsolidated ? 'consolidated' : (roadmap.role || '')).toLowerCase().includes(searchLower) ||
      (roadmap.filename || '').toLowerCase().includes(searchLower) ||
      (roadmap.techStacks && roadmap.techStacks.some(stackName => // This is overall (array of strings)
        (stackName || '').toLowerCase().includes(searchLower)
      )) ||
      (roadmap.isConsolidated && roadmap.roles && roadmap.roles.some(roleDetail => 
        (roleDetail.title || '').toLowerCase().includes(searchLower) ||
        // Search within populated techStack names for consolidated roles
        (roleDetail.techStacks && Array.isArray(roleDetail.techStacks) && roleDetail.techStacks.some(tsObject => // Ensure techStacks is array
            tsObject && (tsObject.name || '').toLowerCase().includes(searchLower)
        ))
      ));
    
    const companyMatch = companyFilter ? roadmap.companyName === companyFilter : true;
    
    return searchMatch && companyMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCompanyFilterChange = (e) => {
    setCompanyFilter(e.target.value);
  };

  const handleShowCompanyDetails = (roadmap) => {
    setSelectedRoadmapForDetails(roadmap);
    setShowCompanyDetailsModal(true);
  };

  const handleCloseCompanyDetailsModal = () => {
    setShowCompanyDetailsModal(false);
    setSelectedRoadmapForDetails(null);
  };
  
  const refreshData = () => {
    if (setPageLoading) setPageLoading(true);
    roadmapService.getAllRoadmaps().then(response => {
        setRoadmaps(Array.isArray(response.data) ? response.data : []);
          if (Array.isArray(response.data)) {
            const uniqueCompanies = [...new Set(response.data.map(roadmap => roadmap.companyName).filter(Boolean))];
            setCompanies(uniqueCompanies);
        } else {
            setCompanies([]);
        }
        if (setPageLoading) setPageLoading(false);
        setSuccess("Roadmaps refreshed."); 
        setTimeout(() => setSuccess(null), 2000); 
    }).catch(err => {
        console.error('Failed to refresh roadmaps:', err);
        setError('Failed to refresh roadmaps');
        if (setPageLoading) setPageLoading(false);
    });
  }

  return (
    <div className="crm-dashboard p-3 p-md-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">{dashboardDisplayName}'s Dashboard</h1>
        <p className="text-muted">View all published roadmaps</p>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="shadow-sm">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}
       {success && ( 
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="shadow-sm">
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}
      
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col md={6} lg={5}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search roadmaps..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>
            
            <Col md={6} lg={4}>
              <Form.Select 
                value={companyFilter} 
                onChange={handleCompanyFilterChange}
                aria-label="Filter by company"
              >
                <option value="">All Companies</option>
                {companies.map((company, index) => (
                  <option key={index} value={company}>
                    {company}
                  </option>
                ))}
              </Form.Select>
            </Col>
            
            <Col md={12} lg={3}>
              <Button 
                variant="outline-primary"
                className="w-100"
                onClick={refreshData}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary" style={{width: '3rem', height: '3rem'}}>
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3 text-muted fs-5">Loading roadmaps...</p>
            </div>
          ) : filteredRoadmaps.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="m-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{minWidth: '180px'}}>Company</th>
                    <th>Type / Main Role</th>
                    <th>Consolidated Roles</th>
                    <th>Filename</th>
                    <th>Tech Stacks (Overall)</th>
                    <th>Created</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoadmaps.map((roadmap) => (
                    <tr key={roadmap._id}>
                      <td className="fw-medium align-middle">
                        <Button 
                            variant="link" 
                            className="p-0 text-start text-decoration-none company-link" 
                            onClick={() => handleShowCompanyDetails(roadmap)}
                            title={`View details for ${roadmap.companyName}`}
                        >
                            {roadmap.companyName}
                        </Button>
                      </td>
                      <td className="align-middle">
                        {roadmap.isConsolidated ? (
                          <Badge bg="primary" className="rounded-pill fs-0_8rem">
                            <i className="fas fa-object-group me-1"></i>
                            Consolidated
                          </Badge>
                        ) : (
                          roadmap.role 
                        )}
                      </td>
                      <td className="align-middle">
                        {roadmap.isConsolidated && roadmap.roles && roadmap.roles.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1" style={{maxWidth: '200px'}}>
                                {roadmap.roles.map((roleDetail, idx) => (
                                <Badge key={idx} bg="secondary" pill className="fw-normal">
                                    {roleDetail.title}
                                </Badge>
                                ))}
                            </div>
                        ) : (
                            <span className="text-muted fst-italic">N/A</span>
                        )}
                      </td>
                      <td className="align-middle">{roadmap.filename}</td>
                      <td className="align-middle">
                        <div className="d-flex flex-wrap gap-1" style={{maxWidth: '250px'}}>
                          {roadmap.techStacks && roadmap.techStacks.slice(0, 3).map((stack, i) => (
                            <Badge 
                              key={i} 
                              bg="light" 
                              text="dark"
                              className="border border-secondary-subtle fw-normal"
                            >
                              {stack}
                            </Badge>
                          ))}
                          {roadmap.techStacks && roadmap.techStacks.length > 3 && (
                             <Badge 
                              bg="light" 
                              text="dark"
                              className="border border-secondary-subtle fw-normal"
                            >
                              +{roadmap.techStacks.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="align-middle">
                        <span className="text-muted">
                          {formatDate(roadmap.createdDate)}
                        </span>
                      </td>
                      <td className="text-center align-middle">
                        <a 
                          href={roadmap.publishedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-sm btn-primary"
                        >
                          <i className="fas fa-external-link-alt me-1"></i>
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-road fa-3x text-muted mb-3"></i>
              <h4>No Roadmaps Found</h4>
              <p className="text-muted">
                {searchTerm || companyFilter 
                  ? "No roadmaps match your search criteria. Try adjusting your filters."
                  : "There are no published roadmaps available at this time."
                }
              </p>
              {(searchTerm || companyFilter) && (
                <Button 
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setCompanyFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Company Details Modal */}
      <Modal show={showCompanyDetailsModal} onHide={handleCloseCompanyDetailsModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedRoadmapForDetails?.companyName} - Roadmap Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRoadmapForDetails && (
            <>
              <Row className="mb-3">
                <Col md={6}><strong>Company:</strong> {selectedRoadmapForDetails.companyName}</Col>
                <Col md={6}><strong>Filename:</strong> {selectedRoadmapForDetails.filename}</Col>
              </Row>
              <Row className="mb-3">
                 <Col md={6}>
                    <strong>Type:</strong>{' '}
                    {selectedRoadmapForDetails.isConsolidated ? (
                        <Badge bg="primary"><i className="fas fa-object-group me-1"></i>Consolidated</Badge>
                    ) : (
                       <Badge bg="info">{selectedRoadmapForDetails.role || "Single Role"}</Badge>
                    )}
                </Col>
                <Col md={6}>
                  <strong>Created:</strong> {formatDate(selectedRoadmapForDetails.createdDate)}
                </Col>
              </Row>
               <Row className="mb-3">
                <Col>
                  <strong>Published URL:</strong>{' '}
                  <a href={selectedRoadmapForDetails.publishedUrl} target="_blank" rel="noopener noreferrer">
                    {selectedRoadmapForDetails.publishedUrl}
                  </a>
                </Col>
              </Row>

              <h5 className="mt-4">Role-Specific Tech Stacks:</h5>
              {selectedRoadmapForDetails.isConsolidated && selectedRoadmapForDetails.roles && selectedRoadmapForDetails.roles.length > 0 ? (
                <Table striped bordered size="sm" className="mt-2">
                  <thead className="table-light">
                    <tr>
                      <th style={{width: '30%'}}>Role</th>
                      <th>Tech Stacks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRoadmapForDetails.roles.map((roleItem, index) => (
                      <tr key={index}>
                        <td><strong>{roleItem.title}</strong></td>
                        <td>
                          {roleItem.techStacks && roleItem.techStacks.length > 0 ? (
                            roleItem.techStacks.map((ts, stackIdx) => (
                                <Badge key={ts?._id || stackIdx} bg="light" text="dark" className="border me-1 mb-1 fw-normal">
                                    {/* Now ts is an object { _id, name } due to population */}
                                    {ts && ts.name ? ts.name : "Unknown Tech Stack"} 
                                </Badge>
                            ))
                          ) : (
                            <span className="text-muted">No specific tech stacks listed for this role.</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : !selectedRoadmapForDetails.isConsolidated && selectedRoadmapForDetails.techStacks && selectedRoadmapForDetails.techStacks.length > 0 ? (
                 <Table striped bordered size="sm" className="mt-2">
                    <thead className="table-light">
                        <tr>
                            <th style={{width: '30%'}}>Main Role ({selectedRoadmapForDetails.role})</th>
                            <th>Overall Tech Stacks</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>{selectedRoadmapForDetails.role}</strong></td>
                            <td>
                                {selectedRoadmapForDetails.techStacks.map((stackName, stackIdx) => ( // techStacks is array of strings here
                                    <Badge key={stackIdx} bg="light" text="dark" className="border me-1 mb-1 fw-normal">
                                        {stackName}
                                    </Badge>
                                ))}
                            </td>
                        </tr>
                    </tbody>
                 </Table>
              ) : (
                <p className="text-muted mt-2">No detailed role-specific tech stacks available for this roadmap configuration.</p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCompanyDetailsModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <style jsx global>{`
        .company-link {
            color: var(--bs-primary);
            font-weight: 500;
        }
        .company-link:hover {
            text-decoration: underline !important;
            color: var(--bs-primary); 
        }
        .fs-0_8rem {
            font-size: 0.8rem !important;
        }
      `}</style>
    </div>
  );
};

export default CRMDashboard;