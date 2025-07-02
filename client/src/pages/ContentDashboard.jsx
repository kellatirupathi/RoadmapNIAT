import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Badge, Spinner, Alert, Form, InputGroup, Modal, ProgressBar } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; 
import { getAllTechStacks, getTechStackById } from '../services/techStackService'; 
import TechStackTable from '../components/TechStackTable/TechStackTable'; 
import Papa from 'papaparse'; 

const ContentDashboard = ({ setPageLoading }) => {
  const { user } = useAuth();
  const [techStacks, setTechStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showTechStackModal, setShowTechStackModal] = useState(false);
  const [selectedTechStackForModal, setSelectedTechStackForModal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user.role === 'instructor' && user.techStackPermission === 'none') {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null); 
        if (setPageLoading) setPageLoading(true);
        
        const allTechStacksResponse = await getAllTechStacks(); 

        let fullTechStacksData = [];
        if (allTechStacksResponse && allTechStacksResponse.data) {
            const techStackDetailsPromises = allTechStacksResponse.data.map(ts => getTechStackById(ts._id));
            const techStackDetailsResults = await Promise.allSettled(techStackDetailsPromises);
            fullTechStacksData = techStackDetailsResults
                .filter(result => result.status === 'fulfilled' && result.value && result.value.data)
                .map(result => result.value.data);
        }
        setTechStacks(fullTechStacksData);
        
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
        if (setPageLoading) setPageLoading(false);
      }
    };

    fetchData();
  }, [setPageLoading, user]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredTechStacks = techStacks.filter(techStack => {
    const searchLower = searchTerm.toLowerCase();
    return techStack.name.toLowerCase().includes(searchLower) || (techStack.description && techStack.description.toLowerCase().includes(searchLower));
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateProgress = (techStack) => {
    if (!techStack.roadmapItems || techStack.roadmapItems.length === 0) return 0;
    const completed = techStack.roadmapItems.filter(item => item.completionStatus === 'Completed').length;
    return Math.round((completed / techStack.roadmapItems.length) * 100);
  };

  const handleViewDetails = (techStack) => {
    setSelectedTechStackForModal(techStack);
    setShowTechStackModal(true);
  };

  const handleTechStackUpdate = (updatedTechStack) => {
    setTechStacks(prev => prev.map(ts => ts._id === updatedTechStack._id ? updatedTechStack : ts));
    if (selectedTechStackForModal && selectedTechStackForModal._id === updatedTechStack._id) {
      setSelectedTechStackForModal(updatedTechStack);
    }
  };

  const handleTechStackDelete = (deletedId) => {
    setTechStacks(prev => prev.filter(ts => ts._id !== deletedId));
    if (selectedTechStackForModal && selectedTechStackForModal._id === deletedId) {
      setShowTechStackModal(false);
      setSelectedTechStackForModal(null);
    }
  };
  
  const handleExportAllCSV = () => {
    if (!filteredTechStacks || filteredTechStacks.length === 0) {
        alert("No data available to export based on current filters.");
        return;
    }

    const dataForCSV = [];
    filteredTechStacks.forEach(techStack => {
        const defaultHeaders = { topic: "Topic", subTopics: "Sub-Topics", projects: "Projects", status: "Status" };
        const headers = techStack.headers || defaultHeaders;

        if (techStack.roadmapItems && techStack.roadmapItems.length > 0) {
            techStack.roadmapItems.forEach(item => {
                dataForCSV.push({
                    "Tech Stack": techStack.name,
                    "Description": techStack.description || '',
                    [headers.topic]: item.topic,
                    [headers.subTopics]: (item.subTopics || []).map(st => st.name).join('; '),
                    [headers.projects]: (item.projects || []).map(p => p.name).join('; '),
                    [headers.status]: item.completionStatus
                });
            });
        } else {
            // Include tech stacks even if they have no items
            dataForCSV.push({ "Tech Stack": techStack.name, "Description": techStack.description || '' });
        }
    });

    const csv = Papa.unparse(dataForCSV);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `AllTechStacks_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (user.role === 'instructor' && user.techStackPermission === 'none') {
    return <Navigate to="/not-authorized" replace />;
  }
  const canCreate = user.role === 'admin' || user.role === 'content' || (user.role === 'instructor' && user.techStackPermission === 'edit');
  const isEditable = canCreate;

  return (
    <div className="content-dashboard">
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {loading ? (
        <div className="text-center py-5"><Spinner /><p className="mt-3 text-muted">Loading dashboard...</p></div>
      ) : (
        <>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <h5 className="mb-0 me-2">Manage Tech Stacks</h5>
                <Badge pill bg="secondary">{techStacks.length}</Badge>
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-success" size="sm" onClick={handleExportAllCSV}>
                    <i className="fas fa-file-csv me-2"></i>Export CSV
                </Button>
                {canCreate && (
                    <Link to="/newtechstack" className="btn btn-sm btn-primary">
                        <i className="fas fa-plus me-2"></i>Add New
                    </Link>
                )}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
                <div className="p-3 border-bottom">
                    <Row className="g-3">
                        <Col>
                            <InputGroup>
                                <InputGroup.Text><i className="fas fa-search"></i></InputGroup.Text>
                                <Form.Control placeholder="Search tech stacks..." value={searchTerm} onChange={handleSearchChange} />
                                {searchTerm && (<Button variant="outline-secondary" onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></Button>)}
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
                        filteredTechStacks.map((ts) => (
                            <tr key={ts._id}>
                            <td className="fw-medium">{ts.name}</td>
                            <td><span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>{ts.description || <span className="text-muted">No description</span>}</span></td>
                            <td className="text-center"><Badge bg="light" text="dark" className="rounded-pill">{ts.roadmapItems?.length || 0}</Badge></td>
                            <td>
                                <ProgressBar now={calculateProgress(ts)} variant={calculateProgress(ts) > 70 ? 'success' : 'secondary'} style={{ height: '8px' }} />
                                <span className="text-muted small ms-2">{calculateProgress(ts)}%</span>
                            </td>
                            <td><span className="text-muted small">{formatDate(ts.updatedAt)}</span></td>
                            <td>
                                <div className="d-flex justify-content-center gap-2">
                                    <Button variant="outline-info" size="sm" onClick={() => handleViewDetails(ts)} title="View & Edit Details"><i className="fas fa-eye"></i></Button>
                                    <Button variant="outline-success" size="sm" onClick={() => {
                                        const headers = ts.headers || { topic: "Topic", subTopics: "Sub-Topics", projects: "Projects", status: "Status" };
                                        const csvData = ts.roadmapItems.map(item => ({ [headers.topic]: item.topic, [headers.subTopics]: item.subTopics.map(st=>st.name).join(';'), [headers.projects]: item.projects.map(p=>p.name).join(';'), [headers.status]: item.completionStatus }));
                                        const csv = Papa.unparse(csvData);
                                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                        const link = document.createElement("a");
                                        const url = URL.createObjectURL(blob);
                                        link.setAttribute("href", url);
                                        link.setAttribute("download", `${ts.name.replace(/\s+/g, '_')}_roadmap.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }} title="Export to CSV"><i className="fas fa-file-csv"></i></Button>
                                </div>
                            </td>
                            </tr>
                        ))
                        ) : (
                        <tr><td colSpan={6} className="text-center py-5"><h5>No Tech Stacks Found</h5>{canCreate && (<Link to="/newtechstack" className="btn btn-primary mt-2">Create New Tech Stack</Link>)}</td></tr>
                        )}
                    </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
          
          <Modal show={showTechStackModal} onHide={() => setShowTechStackModal(false)} size="xl" centered>
            <Modal.Header closeButton><Modal.Title>{selectedTechStackForModal?.name || 'Details'}</Modal.Title></Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {selectedTechStackForModal && (<TechStackTable techStackData={selectedTechStackForModal} onUpdate={handleTechStackUpdate} onDelete={handleTechStackDelete} isEditable={isEditable} />)}
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={() => setShowTechStackModal(false)}>Close</Button></Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default ContentDashboard;
