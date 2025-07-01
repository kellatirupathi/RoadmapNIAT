// client/src/pages/CRMDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Button, Table, Badge, Spinner, Alert, Form, InputGroup, Modal } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import * as roadmapService from '../services/roadmapService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const CRMDashboard = ({ setPageLoading }) => {
  const { user } = useAuth(); 
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [companies, setCompanies] = useState([]);
  
  // Date filter state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // State for the company details modal
  const [showCompanyDetailsModal, setShowCompanyDetailsModal] = useState(false);
  const [selectedRoadmapForDetails, setSelectedRoadmapForDetails] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        if (setPageLoading) setPageLoading(true);
        
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, companyFilter, startDate, endDate]);

  const dashboardStats = useMemo(() => {
    if (!roadmaps || roadmaps.length === 0) {
      return { totalRoadmaps: 0, totalCompanies: 0, totalRoles: 0, uniqueTechStacks: 0 };
    }
    const totalRoadmaps = roadmaps.length;
    const totalCompanies = new Set(roadmaps.map(r => r.companyName)).size;
    const totalRoles = roadmaps.reduce((acc, roadmap) => acc + (roadmap.isConsolidated ? roadmap.roles?.length || 0 : 1), 0);
    // FIX: Access `ts.name` as techStacks are objects.
    const uniqueTechStacks = new Set(roadmaps.flatMap(r => (r.techStacks || []).map(ts => ts.name))).size;
    return { totalRoadmaps, totalCompanies, totalRoles, uniqueTechStacks };
  }, [roadmaps]);

  const filteredRoadmaps = roadmaps.filter(roadmap => {
    const searchLower = searchTerm.toLowerCase();
    // FIX: Access `stack.name` because `techStacks` contains objects.
    const searchMatch = 
      (roadmap.companyName || '').toLowerCase().includes(searchLower) ||
      (roadmap.isConsolidated ? 'consolidated' : (roadmap.role || '')).toLowerCase().includes(searchLower) ||
      (roadmap.filename || '').toLowerCase().includes(searchLower) ||
      (roadmap.techStacks && roadmap.techStacks.some(stack => 
        (stack.name || '').toLowerCase().includes(searchLower)
      )) ||
      (roadmap.isConsolidated && roadmap.roles && roadmap.roles.some(roleDetail => 
        (roleDetail.title || '').toLowerCase().includes(searchLower) ||
        (roleDetail.techStacks && Array.isArray(roleDetail.techStacks) && roleDetail.techStacks.some(tsObject => 
            tsObject && (tsObject.name || '').toLowerCase().includes(searchLower)
        ))
      ));
    
    const companyMatch = companyFilter ? roadmap.companyName === companyFilter : true;
    
    const roadmapDate = new Date(roadmap.createdDate);
    let dateMatch = true;
    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (roadmapDate < start) dateMatch = false;
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (roadmapDate > end) dateMatch = false;
    }

    return searchMatch && companyMatch && dateMatch;
  });

  const paginatedData = useMemo(() => {
    if (loading) return [];
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRoadmaps.slice(startIndex, endIndex);
  }, [filteredRoadmaps, currentPage, rowsPerPage, loading]);

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
        setTimeout(() => setSuccess(null), 2000); 
    }).catch(err => {
        console.error('Failed to refresh roadmaps:', err);
        setError('Failed to refresh roadmaps');
        if (setPageLoading) setPageLoading(false);
    });
  }

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

    const renderPageNumbers = () => {
        const pageNumbers = [];
        let startPage, endPage;
        const maxButtons = 4;

        if (totalPages <= maxButtons) {
            startPage = 1;
            endPage = totalPages;
        } else {
            if (currentPage <= 2) {
                startPage = 1;
                endPage = maxButtons;
            } else if (currentPage + 1 >= totalPages) {
                startPage = totalPages - maxButtons + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - 1;
                endPage = currentPage + (maxButtons - 2);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <Button key={i} variant={currentPage === i ? 'primary' : 'outline-secondary'} size="sm" onClick={() => handlePageChange(i)} className="mx-1 rounded-circle" style={{width: '28px', height: '28px'}}>
                    {i}
                </Button>
            );
        }
        return pageNumbers;
    };
  
    return (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
                <Form.Select size="sm" value={rowsPerPage} onChange={handleRowsPerPageChange} style={{width: 'auto'}}>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </Form.Select>
            </div>

            <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">
                    Page {currentPage} of {totalPages}
                </span>
                <Button variant="link" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="text-secondary">
                    <i className="fas fa-chevron-left"></i>
                </Button>
                {renderPageNumbers()}
                <Button variant="link" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="text-secondary">
                    <i className="fas fa-chevron-right"></i>
                </Button>
            </div>
        </div>
    );
  };

  return (
    <div className="">
      <div id="date-picker-portal" style={{ zIndex: 9999 }}></div>
      <Row className="g-3 mb-4">
        <Col md={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="fas fa-route fa-lg text-primary"></i>
                    </div>
                    <div>
                        <div className="fs-4 fw-bold">{dashboardStats.totalRoadmaps}</div>
                        <div className="text-muted small">Total Roadmaps</div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        <Col md={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="fas fa-building fa-lg text-info"></i>
                    </div>
                    <div>
                        <div className="fs-4 fw-bold">{dashboardStats.totalCompanies}</div>
                        <div className="text-muted small">Companies Managed</div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        <Col md={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="fas fa-user-tie fa-lg text-warning"></i>
                    </div>
                    <div>
                        <div className="fs-4 fw-bold">{dashboardStats.totalRoles}</div>
                        <div className="text-muted small">Roles Defined</div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        <Col md={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="fas fa-layer-group fa-lg text-success"></i>
                    </div>
                    <div>
                        <div className="fs-4 fw-bold">{dashboardStats.uniqueTechStacks}</div>
                        <div className="text-muted small">Unique Tech Stacks</div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
      </Row>
      
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
            <Col xl={3}>
              <InputGroup>
                <InputGroup.Text><i className="fas fa-search"></i></InputGroup.Text>
                <Form.Control placeholder="Search..." value={searchTerm} onChange={handleSearchChange}/>
              </InputGroup>
            </Col>
            <Col xl={3}>
              <Form.Select value={companyFilter} onChange={handleCompanyFilterChange} aria-label="Filter by company">
                <option value="">All Companies</option>
                {companies.map((company, index) => (
                  <option key={index} value={company}>{company}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xl={2}>
              <DatePicker selected={startDate} onChange={date => setStartDate(date)} className="form-control" placeholderText="From Date" isClearable portalId="date-picker-portal" popperPlacement="bottom-start" />
            </Col>
            <Col xl={2}>
              <DatePicker selected={endDate} onChange={date => setEndDate(date)} className="form-control" placeholderText="To Date" minDate={startDate} isClearable portalId="date-picker-portal" popperPlacement="bottom-start" />
            </Col>
            <Col xl={2}>
              <Button variant="outline-primary" className="w-100" onClick={refreshData} disabled={loading}>
                <i className="fas fa-sync-alt me-2"></i> Refresh
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
          ) : paginatedData.length > 0 ? (
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
                  {paginatedData.map((roadmap) => {
                    {/* START FIX: Aggregate all tech stack names for rendering */}
                    const allTechStackNames = roadmap.isConsolidated
                      ? [...new Set((roadmap.roles || []).flatMap(role => (role.techStacks || []).map(ts => ts.name)))]
                      : (roadmap.techStacks || []).map(stack => stack.name);
                    {/* END FIX */}

                    return (
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
                          {/* START FIX: Render tech stack names from the aggregated list */}
                          {allTechStackNames.slice(0, 3).map((stackName, i) => (
                            <Badge 
                              key={i} 
                              bg="light" 
                              text="dark"
                              className="border border-secondary-subtle fw-normal"
                            >
                              {stackName}
                            </Badge>
                          ))}
                          {allTechStackNames.length > 3 && (
                             <Badge 
                              bg="light" 
                              text="dark"
                              className="border border-secondary-subtle fw-normal"
                            >
                              +{allTechStackNames.length - 3} more
                            </Badge>
                          )}
                          {/* END FIX */}
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
                  )})}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-road fa-3x text-muted mb-3"></i>
              <h4>No Roadmaps Found</h4>
              <p className="text-muted">
                {searchTerm || companyFilter || startDate || endDate
                  ? "No roadmaps match your search criteria. Try adjusting your filters."
                  : "There are no published roadmaps available at this time."
                }
              </p>
              {(searchTerm || companyFilter || startDate || endDate) && (
                <Button 
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setCompanyFilter('');
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </Card.Body>
        <Card.Footer className="bg-light border-top">
            <PaginationControls totalRows={filteredRoadmaps.length} />
        </Card.Footer>
      </Card>

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
                            // FIX: Access `ts.name` as `techStacks` are now embedded objects
                            roleItem.techStacks.map((ts, stackIdx) => (
                                <Badge key={ts?._id || stackIdx} bg="light" text="dark" className="border me-1 mb-1 fw-normal">
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
                                {selectedRoadmapForDetails.techStacks.map((stack, stackIdx) => ( // stack is an object
                                    <Badge key={stack._id || stackIdx} bg="light" text="dark" className="border me-1 mb-1 fw-normal">
                                        {stack.name}
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
        .react-datepicker-popper {
          z-index: 1055 !important;
        }
      `}</style>
    </div>
  );
};

export default CRMDashboard;
