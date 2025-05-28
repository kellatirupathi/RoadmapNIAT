// client/src/components/ViewOnly/RoadmapViewer.jsx
import React, { useState } from 'react';
import { Card, Table, Badge, Form, InputGroup, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CommentsList from '../Comments/CommentsList';
import CommentForm from '../Comments/CommentForm';

const RoadmapViewer = ({ techStackData, showComments = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshComments, setRefreshComments] = useState(0);

  // Get the headers from tech stack data or use defaults
  const headers = techStackData.headers || {
    topic: "Topic",
    subTopics: "Sub-Topics",
    projects: "Projects",
    status: "Status"
  };

  // Filter roadmap items based on search and status
  const filteredItems = techStackData.roadmapItems?.filter(item => {
    // Apply search filter
    const searchMatch = searchTerm === '' || 
      item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subTopics.some(st => st.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.projects.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply status filter
    const statusMatch = filterStatus === 'all' || item.completionStatus === filterStatus;
    
    return searchMatch && statusMatch;
  }) || [];

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Yet to Start':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Toggle comment section for an item
  const toggleCommentSection = (item) => {
    if (selectedItem && selectedItem._id === item._id) {
      setShowCommentSection(!showCommentSection);
    } else {
      setSelectedItem(item);
      setShowCommentSection(true);
    }
  };

  // Handle comment added
  const handleCommentAdded = () => {
    setRefreshComments(prev => prev + 1);
  };

  return (
    <div className="roadmap-viewer">
      {/* Filters Section */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search topics, subtopics, or projects..."
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
                </InputGroup>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status Filter</Form.Label>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="Yet to Start">Yet to Start</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Roadmap Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{techStackData.name} Roadmap</h5>
          <Badge bg="primary">{filteredItems.length} Items</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredItems.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>{headers.topic}</th>
                    <th>{headers.subTopics}</th>
                    <th>{headers.projects}</th>
                    <th>{headers.status}</th>
                    {showComments && <th className="text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <React.Fragment key={item._id || index}>
                      <tr className={`status-${item.completionStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                        <td>{item.topic}</td>
                        <td>
                          {item.subTopics && item.subTopics.length > 0 ? (
                            <ul className="list-unstyled mb-0">
                              {item.subTopics.map((subTopic, idx) => (
                                <li key={idx} className="mb-1">
                                  <i className="fas fa-circle-notch me-2 text-primary small"></i>
                                  {subTopic.name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </td>
                        <td>
                          {item.projects && item.projects.length > 0 ? (
                            <ul className="list-unstyled mb-0">
                              {item.projects.map((project, idx) => (
                                <li key={idx} className="mb-1">
                                  <i className="fas fa-code-branch me-2 text-success small"></i>
                                  {project.name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </td>
                        <td>
                          <Badge 
                            bg={getStatusBadgeVariant(item.completionStatus)}
                            className="status-badge"
                          >
                            {item.completionStatus}
                          </Badge>
                        </td>
                        {showComments && (
                          <td className="text-center">
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              onClick={() => toggleCommentSection(item)}
                            >
                              <i className="fas fa-comment me-1"></i>
                              Comments
                            </Button>
                          </td>
                        )}
                      </tr>
                      {showComments && showCommentSection && selectedItem && selectedItem._id === item._id && (
                        <tr>
                          <td colSpan="5" className="bg-light p-3">
                            <CommentsList 
                              techStackId={techStackData._id}
                              itemId={item._id}
                              refreshTrigger={refreshComments}
                            />
                            
                            <hr />
                            
                            <CommentForm 
                              techStackId={techStackData._id}
                              itemId={item._id}
                              onCommentAdded={handleCommentAdded}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4>No Items Found</h4>
              <p className="text-muted">
                {searchTerm || filterStatus !== 'all'
                  ? "No items match your filter criteria. Try adjusting your filters."
                  : "There are no roadmap items available for this tech stack."
                }
              </p>
              {(searchTerm || filterStatus !== 'all') && (
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default RoadmapViewer;