// client/src/pages/InstructorDashboard.jsx
import React, { useState, useEffect, forwardRef } from 'react';
import { Card, Button, Table, Badge, Form, Spinner, Alert, Dropdown, InputGroup, Modal } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import statsService from '../services/statsService';
import * as techStackService from '../services/techStackService'; 

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import CommentForm from '../components/Comments/CommentForm';
import CommentsList from '../components/Comments/CommentsList';

// Custom Input for React DatePicker
const CustomDateInput = forwardRef(({ value, onClick, hasDateValue, onClear, placeholderText, disabled }, ref) => (
  <InputGroup size="sm" className={`custom-date-picker-input-group ${disabled ? 'disabled' : ''}`}>
    <Form.Control
      type="text"
      value={value}
      onClick={onClick}
      ref={ref}
      placeholder={placeholderText}
      readOnly
      className="date-picker-display-input"
      disabled={disabled}
    />
    {hasDateValue && !disabled && (
      <Button variant="link" onClick={onClear} className="date-picker-clear-btn" title="Clear Date" disabled={disabled}>
        <i className="fas fa-times"></i>
      </Button>
    )}
    <Button variant="link" onClick={onClick} className="date-picker-calendar-btn" title="Open Calendar" disabled={disabled}>
      <i className="fas fa-calendar-alt"></i>
    </Button>
  </InputGroup>
));
CustomDateInput.displayName = 'CustomDateInput';


const InstructorDashboard = ({ setPageLoading }) => {
  const { user } = useAuth();
  const [timelineData, setTimelineData] = useState({ techStacks: [], itemsByTechStack: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedItemForComment, setSelectedItemForComment] = useState(null);
  const [refreshCommentsTrigger, setRefreshCommentsTrigger] = useState(0);
  
  const [updatingItems, setUpdatingItems] = useState([]); 
  const [expandedTopics, setExpandedTopics] = useState({});

  const dashboardDisplayName = user?.username ? `${user.username}'s` : user?.firstName ? `${user.firstName}'s` : "Instructor";
  const welcomeMessageName = user?.username || user?.firstName || 'Instructor';

  const fetchInstructorData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (setPageLoading) setPageLoading(true);
      
      const response = await statsService.getTimelineStats(); 
      
      if (response && response.techStackProgress && response.timelineStats) {
        const assignedTechStacks = response.techStackProgress.map(ts => ({
          id: ts._id,
          name: ts.name,
          headers: ts.headers || { topic: "Topic", subTopics: "Sub-Topics", projects: "Projects", status: "Status" }
        }));

        const itemsGrouped = {};
        response.timelineStats.forEach(statusGroup => {
          if (statusGroup && statusGroup.items && Array.isArray(statusGroup.items)) {
            statusGroup.items.forEach(item => {
              if (!itemsGrouped[item.techStackId]) {
                itemsGrouped[item.techStackId] = [];
              }
              itemsGrouped[item.techStackId].push({
                ...item, 
                commentCount: item.commentCount !== undefined ? item.commentCount : 0 
              }); 
            });
          } else {
            console.warn("Encountered an invalid statusGroup in timelineStats:", statusGroup);
          }
        });
        
        setTimelineData({ techStacks: assignedTechStacks, itemsByTechStack: itemsGrouped });

      } else {
        setTimelineData({ techStacks: [], itemsByTechStack: {} });
        console.warn("Timeline data from backend is not in the expected format or is empty. Response:", response);
      }
      
    } catch (err) {
      console.error('Fetch Instructor Data Error:', err);
      let detailedError = err.message || 'Unknown error';
      if (err.response && err.response.data && err.response.data.error) {
        detailedError = err.response.data.error;
      } else if (typeof err === 'string') {
        detailedError = err;
      }
      setError('Failed to load dashboard data. ' + detailedError);
    } finally {
      setLoading(false);
      if (setPageLoading) setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageLoading]); 

  const handleStatusChange = async (itemToUpdate, newStatus) => {
    try {
      setUpdatingItems(prev => [...prev, itemToUpdate.itemId]);
      setError(null); setSuccess(null);

      await techStackService.updateRoadmapItem(itemToUpdate.techStackId, itemToUpdate.itemId, {
        completionStatus: newStatus
      });

      fetchInstructorData();

    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== itemToUpdate.itemId));
    }
  };

  const handleScheduledDateChange = async (itemToUpdate, dateObjectOrNull) => {
    const newDateString = dateObjectOrNull
      ? `${dateObjectOrNull.getFullYear()}-${(dateObjectOrNull.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${dateObjectOrNull.getDate().toString().padStart(2, '0')}`
      : null;
  
    try {
      setUpdatingItems((prev) => [...prev, itemToUpdate.itemId]);
      setError(null);
      setSuccess(null);
  
      await techStackService.updateRoadmapItemSchedule(itemToUpdate.techStackId, itemToUpdate.itemId, {
        scheduledDate: newDateString,
      });
  
      // ✅ Optimistically update local state (without re-fetch)
      setTimelineData((prevData) => {
        const updatedItems = prevData.itemsByTechStack[itemToUpdate.techStackId].map((item) =>
          item.itemId === itemToUpdate.itemId ? { ...item, scheduledDate: newDateString } : item
        );
  
        return {
          ...prevData,
          itemsByTechStack: {
            ...prevData.itemsByTechStack,
            [itemToUpdate.techStackId]: updatedItems,
          },
        };
      });
  
    } catch (err) {
      console.error('Error updating scheduled date:', err);
      setError('Failed to update scheduled date. ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingItems((prev) => prev.filter((id) => id !== itemToUpdate.itemId));
    }
  };
  

  const openCommentModal = (item) => {
    setSelectedItemForComment(item);
    setShowCommentModal(true);
  };
  
  const handleCloseCommentModal = () => {
    setShowCommentModal(false);
    setSelectedItemForComment(null);
  };
  
  const handleCommentAddedInModal = () => {
    setRefreshCommentsTrigger(prev => prev + 1); 
    fetchInstructorData(); 
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Yet to Start': return 'danger';
      default: return 'secondary';
    }
  };

  const toggleTopicExpansion = (itemId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="instructor-dashboard p-3 p-md-4">
      <div className="mb-4">
        <h1 className="h3 mb-0 fw-bold">{dashboardDisplayName} Dashboard</h1>
        <p className="text-muted mb-0">Manage your assigned Tech Stacks and item progress. Welcome, {welcomeMessageName}!</p>
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
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading your dashboard...</p>
        </div>
      ) : timelineData.techStacks.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
            <Card.Body>
                <i className="fas fa-layer-group fa-3x text-muted mb-3"></i>
                <h4>No Tech Stacks Assigned</h4>
                <p className="text-muted">
                    You currently do not have any Tech Stacks assigned to you.
                    Please contact an administrator.
                </p>
            </Card.Body>
        </Card>
      ) : (
        timelineData.techStacks.map(techStack => {
          const itemsForThisStack = timelineData.itemsByTechStack[techStack.id] || [];
          const columnHeaders = { topic: "Topic & Details", status: "Status", actions: "Actions" };

          return (
            <Card key={techStack.id} className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-light py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-medium">{techStack.name}</h5>
                <Badge pill bg="secondary">{itemsForThisStack.length} items</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                {itemsForThisStack.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0 instructor-techstack-table">
                      <thead className="bg-light-alt">
                        <tr>
                          <th style={{ width: '45%' }}>{columnHeaders.topic}</th>
                          <th style={{ width: '18%' }} className="text-center">Scheduled Date</th>
                          <th style={{ width: '17%' }} className="text-center">{columnHeaders.status}</th>
                          <th style={{ width: '20%', textAlign: 'center' }}>{columnHeaders.actions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsForThisStack
                          .sort((a, b) => { 
                              const statusPriority = { 'Completed': 0, 'Yet to Start': 1, 'In Progress': 2 };
                              if (a.status && b.status && statusPriority[a.status] !== statusPriority[b.status]) {
                                  return statusPriority[a.status] - statusPriority[b.status];
                              }
                              return (a.topic || "").localeCompare(b.topic || "");
                          })
                          .map((item) => {
                            const isExpanded = !!expandedTopics[item.itemId];
                            return (
                              <React.Fragment key={item.itemId}>
                                <tr className={`main-topic-row status-row-${item.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                  <td className="topic-details-cell">
                                    <div className="d-flex align-items-center h-100"> {/* Cell content wrapper */}
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        onClick={() => toggleTopicExpansion(item.itemId)}
                                        className="p-0 me-2 expand-btn"
                                        aria-expanded={isExpanded}
                                        aria-controls={`details-${item.itemId}`}
                                      >
                                        <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} fa-xs`}></i>
                                      </Button>
                                      <strong className="topic-title">{item.topic}</strong>
                                    </div>
                                  </td>
                                  <td className="text-center scheduled-date-cell">
                                    <div className="d-flex align-items-center justify-content-center h-100"> {/* Cell content wrapper */}
                                      <DatePicker
                                        selected={item.scheduledDate ? new Date(item.scheduledDate) : null}
                                        onChange={(date) => handleScheduledDateChange(item, date)}
                                        customInput={
                                          <CustomDateInput
                                            hasDateValue={!!item.scheduledDate}
                                            placeholderText="Set Date"
                                            onClear={(e) => {
                                              e.stopPropagation(); // Prevent datepicker from opening
                                              handleScheduledDateChange(item, null);
                                            }}
                                            disabled={updatingItems.includes(item.itemId)}
                                          />
                                        }
                                        dateFormat="MM/dd/yyyy"
                                        popperPlacement="bottom-start"
                                        disabled={updatingItems.includes(item.itemId)}
                                        autoComplete="off"
                                        wrapperClassName="d-inline-block"
                                        popperProps={{ // Added this prop
                                          strategy: 'fixed',
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <div className="d-flex align-items-center justify-content-center h-100"> {/* Cell content wrapper */}
                                      <Badge 
                                        bg={getStatusBadgeColor(item.status)}
                                        className="status-badge-custom"
                                      >
                                        {item.status}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <div className="d-flex align-items-center justify-content-center h-100 gap-2"> {/* Cell content wrapper */}
                                      <Dropdown>
                                        <Dropdown.Toggle 
                                          variant="outline-primary" 
                                          size="sm"
                                          disabled={updatingItems.includes(item.itemId)}
                                          id={`dropdown-status-${item.itemId}`}
                                          className="action-btn"
                                        >
                                          {updatingItems.includes(item.itemId) ? (
                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                          ) : (
                                            <><i className="fas fa-exchange-alt me-1"></i></> 
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
                                      <Button 
                                        variant="outline-info" 
                                        size="sm"
                                        onClick={() => openCommentModal(item)}
                                        className="position-relative action-btn"
                                      >
                                        <i className="fas fa-comment"></i>
                                        {item.commentCount > 0 && (
                                            <Badge 
                                                pill 
                                                bg="danger" 
                                                className="position-absolute top-0 start-100 translate-middle badge-sm-custom"
                                            >
                                                {item.commentCount > 9 ? "9+" : item.commentCount}
                                            </Badge>
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <>
                                    {item.subTopics && item.subTopics.length > 0 && (
                                      <tr className="details-row subtopics-details-row" id={`details-${item.itemId}-subtopics`}>
                                        <td colSpan={4} className="py-1 px-2">
                                          <div className="details-content">
                                            <strong className="detail-type-label">Sub-Topics:</strong>
                                            <ul className="list-unstyled mb-0 ps-3">
                                              {item.subTopics.map((st, idx) => (
                                                <li key={`st-${idx}`} className="text-muted small">
                                                  <i className="fas fa-genderless fa-xs me-2 text-primary-light"></i> {st.name}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                    {item.projects && item.projects.length > 0 && (
                                      <tr className="details-row projects-details-row" id={`details-${item.itemId}-projects`}>
                                         <td colSpan={4} className="py-1 px-2">
                                           <div className="details-content">
                                            <strong className="detail-type-label">Projects:</strong>
                                            <ul className="list-unstyled mb-0 ps-3">
                                              {item.projects.map((p, idx) => (
                                                <li key={`p-${idx}`} className="text-muted small">
                                                   <i className="fas fa-code fa-xs me-2 text-success-dark"></i> {p.name}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                    {(!item.subTopics || item.subTopics.length === 0) && (!item.projects || item.projects.length === 0) && (
                                        <tr className="details-row no-details-row">
                                            <td colSpan={4} className="text-muted small text-center py-2">
                                                No sub-topics or projects for this item.
                                            </td>
                                        </tr>
                                    )}
                                  </>
                                )}
                              </React.Fragment>
                            )
                          })}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <i className="fas fa-folder-open fa-2x text-muted mb-2"></i>
                    <p className="text-muted mb-0">No roadmap items found for this Tech Stack.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )
        })
      )}

      <Modal show={showCommentModal} onHide={handleCloseCommentModal} centered size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-comments me-2"></i>
            Comments for: "{selectedItemForComment?.topic}"
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {selectedItemForComment && (
            <>
             <div className="mb-3 pb-3 border-bottom">
                <p className="mb-1 small"><strong>Tech Stack:</strong> {selectedItemForComment.techStackName}</p>
                 <div className="mt-1">
                    <strong>Status:</strong>{' '}
                    <Badge bg={getStatusBadgeColor(selectedItemForComment.status)}>
                        {selectedItemForComment.status}
                    </Badge>
                 </div>
              </div>
              <CommentsList 
                techStackId={selectedItemForComment.techStackId}
                itemId={selectedItemForComment.itemId}
                refreshTrigger={refreshCommentsTrigger}
              />
              <hr className="my-4" />
              <CommentForm 
                techStackId={selectedItemForComment.techStackId}
                itemId={selectedItemForComment.itemId}
                onCommentAdded={handleCommentAddedInModal}
              />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCloseCommentModal}>Close</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        /* --- Start Instructor Dashboard Styles --- */
        .instructor-dashboard { padding: 1.5rem; background-color: #f4f7f9; }

        /* Table row status highlighting */
        .status-row-in-progress td:first-child { border-left: 4px solid var(--bs-warning) !important; }
        .status-row-completed td:first-child { border-left: 4px solid var(--bs-success) !important; }
        .status-row-yet-to-start td:first-child { border-left: 4px solid var(--bs-danger) !important; }

        .main-topic-row td { border-bottom-width: 1px !important; height: 60px; /* Fixed height for rows */ } 
        .details-row td { 
            padding-left: 3rem !important; 
            background-color: #fafbff !important; 
            border-top: none !important; 
            border-bottom: 1px dashed #e9eef3 !important;
        }
        .details-row:last-of-type td { 
            border-bottom-width: 1px !important; 
            border-bottom-style: solid !important; 
            border-color: #dee2e6 !important; 
        }
        
        /* Centering content within table cells that now have fixed height */
        .instructor-techstack-table td > .h-100 { /* Targets direct child div for flex centering */
          display: flex;
          align-items: center;
          justify-content: center; /* Center for specific columns like status/actions */
        }
        .instructor-techstack-table .topic-details-cell > .h-100, 
        .instructor-techstack-table .scheduled-date-cell > .h-100 {
           justify-content: flex-start; /* Align left for topic and date */
        }
        
        .details-content { padding: 0.6rem 0; }
        .detail-type-label { font-size: 0.78rem; color: #4a5568; display: block; margin-bottom: 0.3rem; font-weight:500; }
        .details-content ul li { padding: 0.15rem 0; font-size: 0.8rem; color: #555;}
        .details-content ul li .fas { font-size: 0.65rem; opacity: 0.7; }

        .expand-btn { color: var(--bs-primary); }
        .expand-btn .fas { transition: transform 0.2s ease-in-out; font-size: 0.8em; }
        .topic-details-cell { /* Removed display:flex here as child div will handle it */ }
        .topic-title { font-weight: 600; color: #2c3e50; font-size: 0.9rem;}

        .status-badge-custom { font-size: 0.7rem; padding: 0.4em 0.7em; letter-spacing: 0.5px; }
        
        .bg-light-alt thead th { 
            background-color: #f8f9fc !important; 
            font-weight: 600; 
            font-size: 0.75rem; 
            text-transform: uppercase;
            color: #55637A;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e0e7ef !important;
            border-top: none !important;
            height: 45px; /* Consistent header height */
        }
        .instructor-techstack-table { table-layout: fixed; width: 100%; } 
        .instructor-techstack-table td, .instructor-techstack-table th {
            padding: 0.5rem 0.9rem;  /* Adjusted padding */
            vertical-align: middle;
            font-size: 0.85rem; 
        }
        .action-btn {
            min-width: 34px; 
            padding: 0.25rem 0.5rem; 
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.25rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }
        .action-btn .fas { margin-right: 0 !important; font-size: 0.8rem; }
        .dropdown-toggle.action-btn .fas { margin-right: 0.25rem !important; } 

        .badge-sm-custom {
            font-size: 0.6rem;
            padding: 0.25em 0.5em; 
            line-height: 0.9;
        }
        .text-primary-light { color: #7E9FFC; } 
        .text-success-dark { color: #0A6847; } 

        /* Custom Date Picker Input Group */
        .custom-date-picker-input-group {
          border: 1px solid #ced4da;
          border-radius: 0.25rem; /* Bootstrap's default sm input radius */
          background-color: #fff;
          transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
          /* width: 100%; Take full width of cell or container */
          max-width: 150px; /* Limit max width to keep it compact */
          display: inline-flex; /* To make it wrap content or control width with max-width */
        }
        .custom-date-picker-input-group.disabled {
          background-color: #e9ecef;
          opacity: 0.7;
        }
        .custom-date-picker-input-group:focus-within {
          border-color: var(--bs-primary);
          box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
        }
        .date-picker-display-input {
          border: none !important;
          box-shadow: none !important;
          padding: 0.25rem 0.5rem !important;
          font-size: 0.8rem !important;
          height: calc(1.5em + .5rem + 2px) !important; /* Match Bootstrap sm input height */
          background-color: transparent !important;
          cursor: pointer;
          min-width: 80px; /* Ensure placeholder text is visible */
        }
        .date-picker-display-input::placeholder {
            color: #6c757d; /* Bootstrap placeholder color */
            opacity: 0.8;
        }
        .date-picker-clear-btn, .date-picker-calendar-btn {
          border: none !important;
          background-color: transparent !important;
          color: #6c757d !important;
          padding: 0 0.5rem !important;
          font-size: 0.8rem !important;
          box-shadow: none !important;
          display: flex;
          align-items: center;
        }
        .date-picker-clear-btn .fas { color: var(--bs-danger) !important; }
        .date-picker-calendar-btn .fas { color: var(--bs-primary) !important; }
        .date-picker-clear-btn:hover .fas, .date-picker-calendar-btn:hover .fas { opacity: 0.7; }


        /* React DatePicker Popup Wow Styles */
        .react-datepicker-popper {
          z-index: 1071 !important; /* This should be high enough to float over most elements, including Bootstrap modals (usually ~1050-1060) */
          box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.175) !important;
          border-radius: 0.375rem !important; 
        }
        .react-datepicker {
          font-family: 'Outfit', sans-serif !important;
          border: none !important; 
          border-radius: 0.375rem !important;
          background-color: #fff !important;
          color: #212529 !important;
          padding: 0.3rem !important; 
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        }
        .react-datepicker__triangle { display: none !important; }

        .react-datepicker__header {
          background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-primary-dark-subtle, #0d6efd) 100%) !important; 
          border-bottom: none !important;
          padding-top: 0.7rem !important;
          padding-bottom: 0.3rem !important;
          border-top-left-radius: 0.375rem !important;
          border-top-right-radius: 0.375rem !important;
        }
        .react-datepicker__current-month { color: white !important; font-weight: 600 !important; font-size: 0.9rem !important; }
        
        .react-datepicker__navigation { top: 0.7rem !important; outline: none !important; border-width: 0.2em !important; }
        .react-datepicker__navigation--previous { border-right-color: rgba(255,255,255,0.8) !important; }
        .react-datepicker__navigation--next { border-left-color: rgba(255,255,255,0.8) !important; }
        .react-datepicker__navigation:hover *::before { border-color: white !important; }

        .react-datepicker__day-name {
          color: var(--bs-primary) !important; 
          font-weight: 500 !important;
          font-size: 0.7rem !important;
          margin: 0.2rem !important;
          text-transform: uppercase;
        }
        .react-datepicker__day {
          color: #495057 !important;
          width: 1.9rem !important; 
          line-height: 1.9rem !important;
          height: 1.9rem !important;
          margin: 0.15rem !important;
          border-radius: 50% !important;
          transition: all 0.15s ease-in-out;
          font-size: 0.8rem;
        }
        .react-datepicker__day:hover {
          background-color: var(--bs-primary-bg-subtle) !important; 
          color: var(--bs-primary) !important;
          transform: scale(1.05);
        }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
          background-color: var(--bs-primary) !important;
          color: white !important;
          font-weight: bold !important;
          box-shadow: 0 2px 4px rgba(var(--bs-primary-rgb), 0.4);
        }
        .react-datepicker__day--today {
          font-weight: bold !important;
          border: 1px solid var(--bs-primary) !important;
          color: var(--bs-primary) !important;
          background-color: transparent !important;
        }
        .react-datepicker__day--outside-month { opacity: 0.5; }
        .react-datepicker__day--disabled { color: #adb5bd !important; cursor: default !important; background-color: #f8f9fa !important; }
        .react-datepicker__day--disabled:hover { background-color: #f8f9fa !important; transform: none; }
        .react-datepicker__input-container > div { width: 100%; } 
        .react-datepicker-wrapper { width: 100%; /* Allow datepicker to fill the td */ }

        /* --- End Instructor Dashboard Styles --- */
      `}</style>
    </div>
  );
};

export default InstructorDashboard;