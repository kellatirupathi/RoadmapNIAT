// client/src/pages/TimelineView.jsx
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Card, Button, Form, Table, Badge, Spinner, Alert, Dropdown, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // For linking Tech Stack names if needed
import useAuth from '../hooks/useAuth';
import statsService from '../services/statsService';
import * as techStackService from '../services/techStackService'; 
import commentsService from '../services/commentsService';

import CommentForm from '../components/Comments/CommentForm'; // For the modal
import CommentsList from '../components/Comments/CommentsList'; // For the modal

const TimelineView = ({ setPageLoading }) => {
  const { user } = useAuth();
  const [timelineItems, setTimelineItems] = useState([]);
  const [allTechStacks, setAllTechStacks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTechStack, setFilterTechStack] = useState('all');
  
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedItemForComment, setSelectedItemForComment] = useState(null); 
  const [refreshCommentsTrigger, setRefreshCommentsTrigger] = useState(0); // For CommentList refresh
  
  const [updatingItems, setUpdatingItems] = useState([]);

  // State for sorting functionality
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      setError(null); 
      if (setPageLoading) setPageLoading(true);
      
      const response = await statsService.getTimelineStats();
      
      if (response && response.timelineStats) {
        const items = response.timelineStats.flatMap(statGroup => 
          statGroup.items.map(item => ({ 
              ...item, 
              status: statGroup._id, // The backend uses _id for the status group
              commentCount: item.commentCount !== undefined ? item.commentCount : 0 
          }))
        );
        setTimelineItems(items);

        if (response.techStackProgress) {
            setAllTechStacks(response.techStackProgress.map(stack => ({
              id: stack._id,
              name: stack.name
            })));
        } else {
            setAllTechStacks([]);
        }
      } else {
        setTimelineItems([]);
        setAllTechStacks([]);
        console.warn("Timeline data from backend is not in the expected format.");
      }
      
    } catch (err) {
      console.error('Error fetching timeline data:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load timeline data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      if (setPageLoading) setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, [setPageLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (itemToUpdate, newStatus) => {
    try {
      setUpdatingItems(prev => [...prev, itemToUpdate.itemId]);
      setError(null); setSuccess(null);

      await techStackService.updateRoadmapItem(itemToUpdate.techStackId, itemToUpdate.itemId, {
        completionStatus: newStatus
      });

      setSuccess(`Status updated to ${newStatus} for "${itemToUpdate.topic}"`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Update local state directly to avoid full page reload
      setTimelineItems(prevItems => 
        prevItems.map(item =>
          item.itemId === itemToUpdate.itemId ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update status.';
      setError(errorMessage);
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== itemToUpdate.itemId));
    }
  };

  const openCommentModal = (item) => {
    setSelectedItemForComment(item);
    setShowCommentModal(true);
  };
  
  const handleCommentAddedInModal = () => {
    setRefreshCommentsTrigger(prev => prev + 1); // Refresh comments list in modal
    // Re-fetch all timeline data to update the comment count badge in the main table
    fetchTimelineData(); 
  };

  const handleCloseCommentModal = () => {
    setShowCommentModal(false);
    setSelectedItemForComment(null);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Yet to Start': return 'danger';
      default: return 'secondary';
    }
  };

  // Helper to format date nicely, or show "--"
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "--";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return "Invalid Date"; }
  };

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return timelineItems.filter(item => {
      const searchMatch = 
        searchTerm === '' || 
        (item.topic && item.topic.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (item.techStackName && item.techStackName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const statusMatch = 
        filterStatus === 'all' || 
        item.status === filterStatus;
      
      const techStackMatch = 
        filterTechStack === 'all' || 
        item.techStackId === filterTechStack;
      
      return searchMatch && statusMatch && techStackMatch;
    });
  }, [timelineItems, searchTerm, filterStatus, filterTechStack]);


  // Sorting Request Handler (Tri-state logic)
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'none';
      key = null; // Reset to default order
    }
    setSortConfig({ key, direction });
  };
  
  // Sorting and Filtering Combined Logic
  const sortedAndFilteredItems = useMemo(() => {
    let sortableItems = [...filteredItems];

    if (sortConfig.direction === 'none' || !sortConfig.key) {
      // Default sort logic
      return sortableItems.sort((a, b) => {
          const statusPriority = { 'Completed': 2, 'In Progress': 0, 'Yet to Start': 1 };
          const priorityA = statusPriority[a.status] ?? 3;
          const priorityB = statusPriority[b.status] ?? 3;
          if (priorityA !== priorityB) return priorityA - priorityB;
          if ((a.techStackName || "").localeCompare(b.techStackName || "") !== 0) return (a.techStackName || "").localeCompare(b.techStackName || "");
          return (a.topic || "").localeCompare(b.topic || "");
      });
    }
    
    // Custom sort logic
    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle null/undefined to sort at the bottom
      if (aValue == null || aValue === '') aValue = Infinity;
      if (bValue == null || bValue === '') bValue = Infinity;

      // Type-specific comparison
      if (sortConfig.key === 'scheduledDate') {
          aValue = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
          bValue = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
      } else if (sortConfig.key === 'status') {
          const priority = { 'Completed': 2, 'In Progress': 1, 'Yet to Start': 0 };
          aValue = priority[a.status] ?? -1;
          bValue = priority[b.status] ?? -1;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return sortableItems;
  }, [filteredItems, sortConfig]);

  // Helper component to render sortable table headers
  const SortableHeader = ({ columnKey, title }) => {
    const isSorted = sortConfig.key === columnKey;
    const isAscending = isSorted && sortConfig.direction === 'ascending';
    const isDescending = isSorted && sortConfig.direction === 'descending';
    
    return (
      <th 
        onClick={() => requestSort(columnKey)} 
        style={{ cursor: 'pointer' }}
        className="sortable-header"
      >
        {title}
        <span className="ms-2">
          {isAscending && <i className="fas fa-arrow-up"></i>}
          {isDescending && <i className="fas fa-arrow-down"></i>}
        </span>
      </th>
    );
  };
  
  return (
    <div className="">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 fw-bold">Roadmap Timeline</h1>
          <p className="text-muted mb-0">Track and update progress across all tech stacks.</p>
        </div>
        <Button 
          variant="outline-primary"
          onClick={fetchTimelineData} 
          disabled={loading}
          className="rounded-pill px-3"
        >
          <i className={`fas fa-sync-alt me-2 ${loading ? 'fa-spin' : ''}`}></i>
          Refresh
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="shadow-sm">
          <i className="fas fa-exclamation-triangle me-2"></i>
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
          <Row className="g-3">
            <Col md={4} lg={5}>
              <Form.Group>
                <Form.Label className="small fw-medium">Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <i className="fas fa-search text-muted"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search topics or tech stacks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-start-0"
                  />
                  {searchTerm && (
                    <Button variant="outline-secondary" onClick={() => setSearchTerm('')} className="border-start-0" title="Clear search">
                      <i className="fas fa-times"></i>
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={4} lg={3}>
              <Form.Group>
                <Form.Label className="small fw-medium">Status</Form.Label>
                <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Yet to Start">Yet to Start</option>
                  <option value="In Progress">In Progress</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} lg={4}>
              <Form.Group>
                <Form.Label className="small fw-medium">Tech Stack</Form.Label>
                <Form.Select value={filterTechStack} onChange={(e) => setFilterTechStack(e.target.value)} disabled={allTechStacks.length === 0 && !loading}>
                  <option value="all">All Tech Stacks</option>
                  {allTechStacks.map((stack) => (
                    <option key={stack.id} value={stack.id}>
                      {stack.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Timeline Items</h5>
          <div className="d-flex align-items-center">
            <Badge bg="primary" pill className="me-2">{sortedAndFilteredItems.length}</Badge>
            <span className="text-muted small">
              {filterStatus !== 'all' || filterTechStack !== 'all' || searchTerm ? 'Filtered' : 'Total'}
            </span>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary"><span className="visually-hidden">Loading...</span></Spinner>
              <p className="mt-3 text-muted">Loading timeline data...</p>
            </div>
          ) : sortedAndFilteredItems.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="align-middle m-0">
                <thead className="bg-light">
                  <tr>
                    <SortableHeader columnKey="techStackName" title="Tech Stack" />
                    <SortableHeader columnKey="topic" title="Topic" />
                    <SortableHeader columnKey="scheduledDate" title="Scheduled Date" />
                    <SortableHeader columnKey="status" title="Status" />
                    <th style={{width: '20%', textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredItems.map((item) => (
                    <tr key={item.itemId || item.topic} className={`status-row-${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      <td>
                        <span className="fw-medium">
                          {item.techStackName}
                        </span>
                      </td>
                      <td>{item.topic}</td>
                      <td className="small text-muted">
                        {formatDisplayDate(item.scheduledDate)}
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(item.status)} className="status-badge-custom">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          {(user.role === 'admin' || user.role === 'instructor') && (
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="outline-primary"
                                size="sm"
                                disabled={updatingItems.includes(item.itemId)}
                                id={`dropdown-status-${item.itemId}`}
                                className="timeline-action-btn"
                              >
                                {updatingItems.includes(item.itemId) ? (
                                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                                ) : (
                                  <><i className="fas fa-exchange-alt me-1"></i> Status</>
                                )}
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item onClick={() => handleStatusChange(item, 'Yet to Start')} active={item.status === 'Yet to Start'} disabled={item.status === 'Yet to Start'}>
                                  Yet to Start
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange(item, 'In Progress')} active={item.status === 'In Progress'} disabled={item.status === 'In Progress'}>
                                  In Progress
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange(item, 'Completed')} active={item.status === 'Completed'} disabled={item.status === 'Completed'}>
                                  Completed
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          )}
                          
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => openCommentModal(item)}
                            className="position-relative timeline-action-btn"
                          >
                            <i className="fas fa-comment me-1"></i>
                            {item.commentCount > 0 && (
                              <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle badge-sm-custom">
                                {item.commentCount > 9 ? '9+' : item.commentCount}
                              </Badge>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
              <h4>No Timeline Items</h4>
              <p className="text-muted">
                {searchTerm || filterStatus !== 'all' || filterTechStack !== 'all'
                  ? "No items match your current filters."
                  : user.role === 'instructor' && allTechStacks.length === 0 
                    ? "No tech stacks are currently assigned to you." 
                    : "No roadmap items available to display in the timeline."
                }
              </p>
            </div>
          )}
        </Card.Body>
         {!loading && sortedAndFilteredItems.length === 0 && (searchTerm || filterStatus !== 'all' || filterTechStack !== 'all') && (
            <Card.Footer className="text-center bg-light py-2">
                <Button 
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterTechStack('all');
                    }}
                >
                    <i className="fas fa-filter-circle-xmark me-2"></i> Clear All Filters
                </Button>
            </Card.Footer>
         )}
      </Card>
      
      <Modal show={showCommentModal} onHide={handleCloseCommentModal} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
             <i className="fas fa-comments me-2"></i>Comments for: {selectedItemForComment?.topic || "Item"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{maxHeight: '65vh', overflowY: 'auto'}}>
          {selectedItemForComment && (
            <>
              <div className="mb-3 pb-3 border-bottom">
                <p className="mb-1 small"><strong>Tech Stack:</strong> {selectedItemForComment.techStackName}</p>
                <p className="mb-0 small"><strong>Topic:</strong> {selectedItemForComment.topic}</p>
                 <div className="mt-1">
                    <strong>Status:</strong>{' '}
                    <Badge bg={getStatusBadgeVariant(selectedItemForComment.status)}>
                        {selectedItemForComment.status}
                    </Badge>
                 </div>
                 {selectedItemForComment.subTopics && selectedItemForComment.subTopics.length > 0 && (
                    <div className="mt-2">
                        <strong className="small">Sub-Topics:</strong>
                        <ul className="list-unstyled mb-0 ps-3">
                        {selectedItemForComment.subTopics.slice(0, 5).map((st, idx) => (
                            <li key={`st-${idx}`} className="text-muted small">- {st.name}</li>
                        ))}
                        {selectedItemForComment.subTopics.length > 5 && <li className="text-muted small">... and more</li>}
                        </ul>
                    </div>
                 )}
                 {selectedItemForComment.projects && selectedItemForComment.projects.length > 0 && (
                     <div className="mt-2">
                        <strong className="small">Projects:</strong>
                        <ul className="list-unstyled mb-0 ps-3">
                        {selectedItemForComment.projects.slice(0,5).map((p, idx) => (
                            <li key={`p-${idx}`} className="text-muted small">- {p.name}</li>
                        ))}
                        {selectedItemForComment.projects.length > 5 && <li className="text-muted small">... and more</li>}
                        </ul>
                    </div>
                 )}
              </div>
              
              <CommentsList 
                techStackId={selectedItemForComment.techStackId}
                itemId={selectedItemForComment.itemId}
                refreshTrigger={refreshCommentsTrigger}
              />
              <hr className="my-4"/>
              <CommentForm 
                techStackId={selectedItemForComment.techStackId}
                itemId={selectedItemForComment.itemId}
                onCommentAdded={handleCommentAddedInModal} // Use updated handler
              />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCloseCommentModal}>Close</Button>
        </Modal.Footer>
      </Modal>
      
      <style>{`
        .status-row-in-progress { background-color: rgba(255, 193, 7, 0.035) !important; }
        .status-row-completed { background-color: rgba(40, 167, 69, 0.035) !important; }
        .status-row-yet-to-start { background-color: rgba(220, 53, 69, 0.035) !important; }
        .status-badge-custom { font-size: 0.75rem; padding: 0.35em 0.65em; }
        .badge-sm-custom { font-size: 0.65rem; padding: .2em .45em; line-height: 1; }
        .table td, .table th { vertical-align: middle; }
        .timeline-action-btn { min-width: 0px; }
        .sortable-header { -webkit-user-select: none; user-select: none; }
      `}</style>
    </div>
  );
};

export default TimelineView;
