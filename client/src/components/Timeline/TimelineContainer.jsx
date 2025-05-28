// client/src/components/Timeline/TimelineContainer.jsx
import React, { useState } from 'react';
import { Card, Row, Col, Modal, Button, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CommentsList from '../Comments/CommentsList';
import CommentForm from '../Comments/CommentForm';

const TimelineContainer = ({ 
  timelineItems, 
  // techStacks prop removed as items should contain techStackName
  onStatusChange, 
  updatingItems,
  loading
}) => {
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshCommentsTrigger, setRefreshCommentsTrigger] = useState(0); // Trigger for refreshing comments list

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

  const openCommentModal = (item) => {
    setSelectedItem(item);
    setShowCommentModal(true);
  };

  const handleCommentAdded = () => {
    // Trigger a refresh of the CommentsList component
    setRefreshCommentsTrigger(prev => prev + 1);
    // Potentially, you might want to re-fetch the item's commentCount here
    // if the backend `getTimelineStats` doesn't auto-update or if using polling.
    // For now, the modal list will refresh. The badge count on the main item card
    // would update if `timelineItems` prop itself is re-fetched by parent.
    if (selectedItem) { // if modal is open and an item is selected
        // Optimistically update comment count on the item in the main list
        const updatedItemIndex = timelineItems.findIndex(it => it.itemId === selectedItem.itemId);
        if (updatedItemIndex > -1) {
            // This is a direct mutation, ideally state update should be via parent
            // but for quick UI feedback without full re-fetch.
            // Or, the parent should handle this.
            // For this implementation, we assume the parent (`TimelineView`) handles the refresh.
        }
    }
  };
  
  const handleCloseCommentModal = () => {
    setShowCommentModal(false);
    setSelectedItem(null);
  }

  return (
    <>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading timeline data...</p>
        </div>
      ) : timelineItems.length > 0 ? (
        <div className="timeline-container">
          <Row className="g-3">
            {timelineItems.map((item) => ( // Removed index as key, prefer item.itemId if available
              <Col key={item.itemId || item.topic} md={6} lg={4}> {/* Use unique itemId */}
                <Card className={`h-100 border-0 shadow-sm timeline-item status-${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                    <Badge 
                      bg={getStatusBadgeVariant(item.status)}
                      className="status-badge"
                    >
                      {item.status}
                    </Badge>
                    <small className="text-muted text-truncate" style={{maxWidth: '150px'}} title={item.techStackName}>
                        {item.techStackName}
                    </small>
                  </Card.Header>
                  <Card.Body>
                    <h5 className="card-title mb-3 fw-bold">{item.topic}</h5> {/* Added fw-bold */}
                    
                    {item.subTopics && item.subTopics.length > 0 && (
                      <div className="mb-3">
                        <h6 className="text-muted mb-2 small">Sub-Topics:</h6> {/* Made it smaller */}
                        <ul className="list-unstyled mb-0"> {/* Removed default padding from ul */}
                          {item.subTopics.slice(0, 3).map((subTopic, idx) => ( // Show max 3
                            <li key={idx} className="mb-1 small d-flex align-items-center"> {/* Use small for list items */}
                              <i className="fas fa-circle-notch fa-xs me-2 text-primary opacity-75"></i>
                              {subTopic.name}
                            </li>
                          ))}
                          {item.subTopics.length > 3 && <li className="text-muted small mt-1">...and {item.subTopics.length - 3} more</li>}
                        </ul>
                      </div>
                    )}
                    
                    {item.projects && item.projects.length > 0 && (
                       <div className="mb-3">
                        <h6 className="text-muted mb-2 small">Projects:</h6>
                        <ul className="list-unstyled mb-0">
                          {item.projects.slice(0,3).map((project, idx) => (
                            <li key={idx} className="mb-1 small d-flex align-items-center">
                              <i className="fas fa-code-branch fa-xs me-2 text-success opacity-75"></i>
                              {project.name}
                            </li>
                          ))}
                           {item.projects.length > 3 && <li className="text-muted small mt-1">...and {item.projects.length - 3} more</li>}
                        </ul>
                      </div>
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-white border-top-0 pt-0 pb-3">
                    <div className="d-flex justify-content-between gap-2">
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => openCommentModal(item)}
                        className="flex-grow-1 position-relative" // Added position-relative for badge
                      >
                        <i className="fas fa-comment me-1"></i>
                        Comments
                        {item.commentCount > 0 && (
                          <Badge 
                            pill 
                            bg="danger" 
                            className="position-absolute top-0 start-100 translate-middle badge-sm-custom"
                            // style={{ transform: 'translate(50%, -50%)', fontSize: '0.65rem', padding: '0.2em 0.4em' }}
                          >
                            {item.commentCount > 9 ? '9+' : item.commentCount}
                          </Badge>
                        )}
                      </Button>
                      
                      <div className="dropdown">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="dropdown-toggle flex-grow-1" // ensure button also grows
                          disabled={updatingItems.includes(item.itemId)}
                          data-bs-toggle="dropdown" // Bootstrap 5 attribute
                          aria-expanded="false"
                        >
                          {updatingItems.includes(item.itemId) ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-exchange-alt me-1"></i>
                              Status
                            </>
                          )}
                        </Button>
                        <ul className="dropdown-menu"> {/* Standard Bootstrap 5 dropdown menu */}
                          <li>
                            <button 
                              className={`dropdown-item ${item.status === 'Yet to Start' ? 'active' : ''}`}
                              onClick={() => onStatusChange(item, 'Yet to Start')}
                              disabled={item.status === 'Yet to Start'}
                            >
                              <i className="fas fa-clock me-2 text-danger"></i>
                              Yet to Start
                            </button>
                          </li>
                          <li>
                            <button 
                              className={`dropdown-item ${item.status === 'In Progress' ? 'active' : ''}`}
                              onClick={() => onStatusChange(item, 'In Progress')}
                              disabled={item.status === 'In Progress'}
                            >
                              <i className="fas fa-spinner me-2 text-warning"></i>
                              In Progress
                            </button>
                          </li>
                          <li>
                            <button 
                              className={`dropdown-item ${item.status === 'Completed' ? 'active' : ''}`}
                              onClick={() => onStatusChange(item, 'Completed')}
                              disabled={item.status === 'Completed'}
                            >
                              <i className="fas fa-check-circle me-2 text-success"></i>
                              Completed
                            </button>
                          </li>
                        </ul>
                      </div>
                       {/* Removed View Details button as per implicit request in TimelineView.jsx */}
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <div className="text-center py-5">
          <i className="fas fa-tasks fa-3x text-muted mb-3"></i>
          <h4>No Items Found</h4>
          <p className="text-muted">
            There are no roadmap items matching your criteria.
          </p>
        </div>
      )}
      
      <Modal 
        show={showCommentModal} 
        onHide={handleCloseCommentModal}
        size="lg"
        centered
        backdrop="static" // Optional: make it non-dismissable by clicking outside
      >
        <Modal.Header closeButton>
          <Modal.Title>
             Comments: {selectedItem?.topic || "Item"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{maxHeight: '60vh', overflowY: 'auto'}}>
          {selectedItem && (
            <>
              <div className="mb-3 pb-3 border-bottom">
                <p className="mb-1"><strong>Tech Stack:</strong> {selectedItem.techStackName}</p>
                <p className="mb-0"><strong>Status:</strong>{' '}
                  <Badge bg={getStatusBadgeVariant(selectedItem.status)}>
                    {selectedItem.status}
                  </Badge>
                </p>
              </div>
              
              <CommentsList 
                techStackId={selectedItem.techStackId}
                itemId={selectedItem.itemId}
                refreshTrigger={refreshCommentsTrigger}
              />
              <hr className="my-4"/>
              <CommentForm 
                techStackId={selectedItem.techStackId}
                itemId={selectedItem.itemId}
                onCommentAdded={handleCommentAdded}
              />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCommentModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
       <style jsx global>{`
            .badge-sm-custom {
                font-size: 0.65rem;
                padding: 0.2em 0.45em;
                line-height: 1;
            }
            .timeline-item {
                transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            }
            .timeline-item:hover {
                transform: translateY(-3px);
                box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1) !important;
            }
       `}</style>
    </>
  );
};

export default TimelineContainer;