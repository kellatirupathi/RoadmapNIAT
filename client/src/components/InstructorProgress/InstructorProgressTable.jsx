// client/src/components/InstructorProgress/InstructorProgressTable.jsx
import React, { useState, useEffect, forwardRef, useCallback } from 'react';
import { Table, Card, Spinner, Alert, Form, InputGroup, Button, Badge, Dropdown, Modal } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import statsService from '../../services/statsService';
import useAuth from '../../hooks/useAuth'; // Import useAuth
import CommentsList from '../Comments/CommentsList'; // Import CommentsList
import CommentForm from '../Comments/CommentForm';   // Import CommentForm

// Custom Input for React DatePicker for better styling with Bootstrap
const CustomDateInput = forwardRef(({ value, onClick, placeholderText, id }, ref) => (
  <InputGroup size="sm" style={{ minWidth: '160px' }}>
    <Form.Control
      id={id}
      type="text"
      value={value}
      onClick={onClick}
      ref={ref}
      placeholder={placeholderText}
      readOnly
      style={{ backgroundColor: '#fff', cursor: 'pointer' }}
    />
    <InputGroup.Text style={{ cursor: 'pointer' }} onClick={onClick}>
      <i className="fas fa-calendar-alt"></i>
    </InputGroup.Text>
  </InputGroup>
));
CustomDateInput.displayName = 'CustomDateInput';


const InstructorProgressTable = () => {
  const { user } = useAuth(); // Get current user
  const [dateRangeOption, setDateRangeOption] = useState('Today');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // State for comments modal
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedItemForComments, setSelectedItemForComments] = useState(null);
  const [refreshCommentsTrigger, setRefreshCommentsTrigger] = useState(0);

  const calculateDateRange = useCallback((option, start, end) => {
    const today = new Date(); // User's local "today"
    let effectiveStartDate = new Date(today);
    let effectiveEndDate = new Date(today);

    switch (option) {
      case 'Last Month':
        effectiveStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        effectiveEndDate = new Date(today.getFullYear(), today.getMonth(), 0); 
        break;
      case 'Last 7 Days':
        effectiveStartDate.setDate(today.getDate() - 6);
        effectiveEndDate = new Date(today); 
        break;
      case 'Yesterday':
        effectiveStartDate.setDate(today.getDate() - 1);
        effectiveEndDate.setDate(today.getDate() - 1);
        break;
      case 'Today':
        // startDate and endDate are already today
        break;
      case 'Tomorrow':
        effectiveStartDate.setDate(today.getDate() + 1);
        effectiveEndDate.setDate(today.getDate() + 1);
        break;
      case 'Next 7 Days':
        effectiveStartDate = new Date(today);
        effectiveEndDate.setDate(today.getDate() + 6);
        break;
      case 'Next Month':
        effectiveStartDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        effectiveEndDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); 
        break;
      case 'Custom Dates':
        if (start && end) {
          effectiveStartDate = new Date(start);
          effectiveEndDate = new Date(end);
        } else if (start) { // Only start date selected, use it for single day
            effectiveStartDate = new Date(start);
            effectiveEndDate = new Date(start);
        }
         else {
          return null; // Invalid custom range if dates are missing
        }
        break;
      default:
        // Default to Today
        break;
    }
    // Return Date objects, the service will format them
    return { startDate: effectiveStartDate, endDate: effectiveEndDate };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      let dateParams = {};
      const range = calculateDateRange(dateRangeOption, customStartDate, customEndDate);
      
      if (!range) { 
          setProgressData([]);
          //setError(null); // Clear error as user might be in process of selecting custom dates
          // setLoading(false); // Stop loading only if we are sure this isn't an intermediate state
          return;
      }
      
      if (dateRangeOption === 'Custom Dates') {
        if (customStartDate && customEndDate && customStartDate <= customEndDate) {
          dateParams = { startDate: customStartDate, endDate: customEndDate };
        } else if (customStartDate && !customEndDate) { 
          dateParams = { date: customStartDate };
        }
        else { 
          setProgressData([]); 
          // If custom dates are expected but not valid, optionally set an error or message
          // setError("Please select a valid custom date range or ensure 'From Date' is not after 'To Date'.");
          return;
        }
      } else { // Predefined ranges
        // Compare local date parts to determine if it's a single day
        if (
            range.startDate.getFullYear() === range.endDate.getFullYear() &&
            range.startDate.getMonth() === range.endDate.getMonth() &&
            range.startDate.getDate() === range.endDate.getDate()
        ) {
            dateParams = { date: range.startDate };
        } else {
            dateParams = { startDate: range.startDate, endDate: range.endDate };
        }
      }

      setLoading(true);
      setError(null);
      try {
        const response = await statsService.getInstructorProgressByDate(dateParams);
        if (response.success) {
          setProgressData(response.data || []);
        } else {
          setError(response.error || 'Failed to fetch progress data.');
          setProgressData([]);
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred.');
        setProgressData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRangeOption, customStartDate, customEndDate, calculateDateRange]);
  
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Yet to Start': return 'danger';
      default: return 'secondary';
    }
  };
  
  const handleDateOptionSelect = (option) => {
    setDateRangeOption(option);
    if (option !== 'Custom Dates') {
       setCustomStartDate(null); // Reset custom dates if a predefined range is chosen
       setCustomEndDate(null);
    }
  }

  const openCommentsModal = (item) => {
    setSelectedItemForComments(item);
    setShowCommentsModal(true);
  };

  const handleCloseCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedItemForComments(null);
  };

  const handleCommentAddedInModal = () => {
    setRefreshCommentsTrigger(prev => prev + 1); // Refresh CommentsList in modal
    if (selectedItemForComments) {
      // Optimistically update comment count in the main table data
      setProgressData(prevData => 
        prevData.map(item => 
          item.itemId === selectedItemForComments.itemId && item.techStackId.toString() === selectedItemForComments.techStackId.toString()
            ? { ...item, commentCount: (item.commentCount || 0) + 1 }
            : item
        )
      );
    }
  };

  const formatDateForDisplay = (dateString) => {
      if (!dateString) return 'N/A';
      // The date string from backend is YYYY-MM-DD.
      const parts = dateString.split('-');
      if (parts.length === 3) {
          // year, month (0-indexed), day
          // Use Date.UTC to avoid local timezone interpretation during Date object creation, then display using locale string with UTC specified.
          const dateObj = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
          return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
      }
      return "Invalid Date"; // Fallback for unexpected format
  };


  return (
    <>
      {/* Portal container for date pickers */}
      <div id="date-picker-portal"></div>
      
      <div> {/* This is the wrapping div for the Card */}
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white py-3 border-bottom-0">
          {/* Flex container for title and date selectors */}
          <div className="d-flex justify-content-between align-items-center flex-wrap">
              <div className="mb-2 mb-md-0"> {/* Title on the left */}
                  <h5 className="mb-0 fw-medium">Instructor Daily Progress</h5>
                  {success && (
                    <Alert variant="success" className="mt-2 py-1 small" onClose={() => setSuccess(null)} dismissible>
                        {success}
                    </Alert>
                  )}
              </div>
              
              {/* Date selectors on the right, stacking on small screens */}
              <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2 date-selectors-wrapper">
                  <div style={{ minWidth: '180px' }}>
                      <Form.Select 
                        size="sm" 
                        value={dateRangeOption} 
                        onChange={(e) => handleDateOptionSelect(e.target.value)}
                        style={{ 
                          minWidth: '180px',
                          fontSize: '0.875rem',
                          height: '31px',
                          border: '1px solid #ced4da',
                          borderRadius: '0.375rem',
                          backgroundColor: '#fff',
                          color: '#495057',
                          cursor: 'pointer',
                          backgroundImage: 'none'
                        }}
                        className="date-range-select"
                      >
                        {['Last Month', 'Last 7 Days', 'Yesterday', 'Today', 'Tomorrow', 'Next 7 Days', 'Next Month', 'Custom Dates'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </Form.Select>
                  </div>
                  {dateRangeOption === 'Custom Dates' && (
                  <>
                      <div style={{ minWidth: '160px', position: 'relative' }}>
                          <DatePicker
                              selected={customStartDate}
                              onChange={(date) => setCustomStartDate(date)}
                              selectsStart
                              startDate={customStartDate}
                              endDate={customEndDate}
                              customInput={<CustomDateInput placeholderText="From Date" id="customStartDatePicker"/>}
                              dateFormat="MM/dd/yyyy"
                              popperPlacement="bottom-start" 
                              isClearable
                              filterDate={date => customEndDate ? date <= customEndDate : true}
                              popperProps={{
                                strategy: 'fixed',
                                modifiers: [
                                  {
                                    name: 'preventOverflow',
                                    options: {
                                      boundary: 'viewport',
                                      altBoundary: false,
                                      rootBoundary: 'viewport'
                                    },
                                  },
                                  {
                                    name: 'flip',
                                    options: {
                                      boundary: 'viewport',
                                      rootBoundary: 'viewport'
                                    }
                                  }
                                ],
                              }}
                              portalId="date-picker-portal"
                          />
                      </div>
                      <div style={{ minWidth: '160px', position: 'relative' }}>
                          <DatePicker
                              selected={customEndDate}
                              onChange={(date) => setCustomEndDate(date)}
                              selectsEnd
                              startDate={customStartDate}
                              endDate={customEndDate}
                              minDate={customStartDate}
                              customInput={<CustomDateInput placeholderText="To Date" id="customEndDatePicker" />}
                              dateFormat="MM/dd/yyyy"
                              popperPlacement="bottom-start" 
                              isClearable
                              popperProps={{
                                strategy: 'fixed',
                                modifiers: [
                                  {
                                    name: 'preventOverflow',
                                    options: {
                                      boundary: 'viewport',
                                      altBoundary: false,
                                      rootBoundary: 'viewport'
                                    },
                                  },
                                  {
                                    name: 'flip',
                                    options: {
                                      boundary: 'viewport',
                                      rootBoundary: 'viewport'
                                    }
                                  }
                                ],
                              }}
                              portalId="date-picker-portal"
                          />
                      </div>
                  </>
                  )}
              </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {error && (
              <Alert variant="danger" className="m-3" onClose={() => setError(null)} dismissible>
                  <i className="fas fa-exclamation-triangle me-2"></i>{error}
              </Alert>
          )}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading progress data...</p>
            </div>
          ) : progressData.length === 0 && !error ? (
            <div className="text-center py-5">
               <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <p className="mb-0 text-muted">
                  {dateRangeOption === 'Custom Dates' && (!customStartDate && !customEndDate) 
                   ? 'Please select a custom date range.'
                   : 'No scheduled tasks found for the selected date/range.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <Table hover responsive className="align-middle mb-0 instructor-progress-table">
                <thead className="bg-light sticky-top instructor-progress-table-header">
                  <tr>
                    <th>Instructor</th>
                    <th>TechStack</th>
                    <th>Topic</th>
                    <th>Status</th>
                    {(user.role === 'admin' || user.role === 'manager') && (
                        <th className="text-center">Comments</th>
                    )}
                    <th>Scheduled Date</th>
                  </tr>
                </thead>
                <tbody>
                  {progressData.map((item) => (
                    <tr key={`${item.instructorId}-${item.itemId}-${item.scheduledDate}`}>
                      <td>{item.instructorName}</td>
                      <td>{item.techStackName}</td>
                      <td>{item.topic}</td>
                      <td>
                        <Badge bg={getStatusBadgeColor(item.status)} className="text-capitalize status-badge-custom" pill>
                          {item.status}
                        </Badge>
                      </td>
                      {(user.role === 'admin' || user.role === 'manager') && (
                        <td className="text-center">
                           <Button 
                            variant={item.commentCount > 0 ? "outline-info" : "outline-secondary"}
                            size="sm" 
                            onClick={() => openCommentsModal(item)}
                            className={`action-btn comments-btn ${item.commentCount === 0 ? 'no-comments-btn' : 'has-comments-btn'}`}
                            title={item.commentCount > 0 ? `View Comments (${item.commentCount})` : "Add Comment"}
                          >
                            {item.commentCount > 0 ? (
                              <>
                                <i className="fas fa-comments me-1 text-info"></i> 
                                ({item.commentCount})
                              </>
                            ) : (
                              <>
                                <i className="fas fa-comment-medical me-1 text-muted"></i>
                                <span className="no-comments-text">Add</span>
                              </>
                            )}
                          </Button>
                        </td>
                      )}
                      <td>{formatDateForDisplay(item.scheduledDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      </div> {/* This is the closing div for the wrapping div of the Card */}


      {/* Comments Modal */}
      <Modal show={showCommentsModal} onHide={handleCloseCommentsModal} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-comments me-2"></i>
            Comments for: "{selectedItemForComments?.topic}"
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {selectedItemForComments && (
            <>
              {/* Context for the item can be added here if needed */}
                <div className="mb-3 pb-3 border-bottom">
                    <p className="mb-1 small"><strong>Tech Stack:</strong> {selectedItemForComments.techStackName}</p>
                    <div className="mt-1">
                        <strong>Status:</strong>{' '}
                        <Badge bg={getStatusBadgeColor(selectedItemForComments.status)} className="status-badge-custom">
                            {selectedItemForComments.status}
                        </Badge>
                    </div>
                    {/* Display subtopics and projects for context */}
                    {selectedItemForComments.subTopics && selectedItemForComments.subTopics.length > 0 && (
                        <div className="mt-2">
                            <strong className="small">Sub-Topics:</strong>
                            <ul className="list-unstyled mb-0 ps-3">
                                {selectedItemForComments.subTopics.slice(0, 3).map((st, idx) => (
                                <li key={`st-${idx}`} className="text-muted small">- {st.name}</li>
                                ))}
                                {selectedItemForComments.subTopics.length > 3 && <li className="text-muted small">... and more</li>}
                            </ul>
                        </div>
                    )}
                    {selectedItemForComments.projects && selectedItemForComments.projects.length > 0 && (
                        <div className="mt-2">
                            <strong className="small">Projects:</strong>
                            <ul className="list-unstyled mb-0 ps-3">
                                {selectedItemForComments.projects.slice(0,3).map((p, idx) => (
                                <li key={`p-${idx}`} className="text-muted small">- {p.name}</li>
                                ))}
                                {selectedItemForComments.projects.length > 3 && <li className="text-muted small">... and more</li>}
                            </ul>
                        </div>
                    )}
                </div>
              <CommentsList 
                techStackId={selectedItemForComments.techStackId.toString()}
                itemId={selectedItemForComments.itemId.toString()}
                refreshTrigger={refreshCommentsTrigger}
              />
              <hr className="my-4" />
              <CommentForm 
                techStackId={selectedItemForComments.techStackId.toString()}
                itemId={selectedItemForComments.itemId.toString()}
                onCommentAdded={handleCommentAddedInModal}
              />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCloseCommentsModal}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Existing Styles */}
      <style jsx global>{`
          .instructor-progress-table-header th { /* Applied to thead th */
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            color: #4A5568; 
            white-space: nowrap;
            background-color: #f8f9fa !important; /* Ensure sticky header has bg and overrides other table styles */
            z-index: 10; /* Ensure header is above table content when sticky */
          }
          .instructor-progress-table td {
            font-size: 0.875rem;
            vertical-align: middle;
          }
          .react-datepicker-wrapper { width: 100%; }
          .react-datepicker-popper { 
            z-index: 9999 !important; /* Very high z-index for date picker */
            position: fixed !important; /* Break out of container bounds */
          }
          
          /* Ensure date picker calendar is fully visible */
          .react-datepicker {
            font-family: inherit !important;
            font-size: 0.875rem !important;
            border: 1px solid #ced4da !important;
            border-radius: 0.375rem !important;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
            background-color: #fff !important;
            z-index: 9999 !important;
          }
          
          .react-datepicker__portal {
            z-index: 9999 !important;
            position: fixed !important;
          }
          
          /* Ensure calendar doesn't get clipped */
          .react-datepicker__tab-loop {
            position: absolute !important;
            z-index: 9999 !important;
          } 

          #customStartDatePicker, #customEndDatePicker { 
            padding: 0.375rem 0.75rem !important; 
            font-size: 0.875rem !important; 
            line-height: 1.5 !important; 
            border-radius: 0.375rem !important; 
            background-color: #fff !important; 
            border: 1px solid #ced4da !important; 
            height: 31px !important;
          }
          #customStartDatePicker:focus, #customEndDatePicker:focus {
            border-color: #86b7fe !important; 
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important; 
            outline: 0 !important;
          }
          
          /* Style the native select dropdown */
          .date-range-select {
            appearance: auto !important;
            -webkit-appearance: auto !important;
            -moz-appearance: auto !important;
            background-image: none !important;
            background-repeat: no-repeat !important;
            background-position: right 0.75rem center !important;
            background-size: 16px 12px !important;
            padding-right: 2.25rem !important;
          }
          
          /* Remove Bootstrap's background image that creates duplicate arrow */
          .form-select {
            background-image: none !important;
          }
          
          .date-range-select:focus {
            border-color: #86b7fe !important;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
            outline: 0 !important;
          }
          
          .date-range-select option {
            padding: 8px 12px;
            font-size: 0.875rem;
            color: #495057;
            background-color: #fff;
          }
          
          .date-range-select option:hover {
            background-color: #f8f9fa;
          }

          @media (min-width: 576px) { /* sm breakpoint */
              .date-selectors-wrapper { align-items: center; }
          }
          .status-badge-custom {
            font-size: 0.7rem !important; 
            padding: 0.35em 0.65em !important; 
          }
          .action-btn {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
          .comments-btn {
            min-width: 70px; /* Ensure some base width for consistency */
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .comments-btn i {
            font-size: 0.75rem; /* Slightly larger icon */
          }
          .comments-btn.no-comments-btn i.text-muted {
            opacity: 0.6;
          }
          .comments-btn.no-comments-btn:hover {
            background-color: #e9ecef; /* Light hover for no-comments */
            border-color: #ced4da;
          }
           .comments-btn.has-comments-btn {
            /* Optional: Make has-comments button slightly more prominent */
             /* border-color: var(--bs-info); */
           }
          .no-comments-text {
            font-size: 0.7rem;
            color: #6c757d; /* Muted text color for "Add" */
          }


        `}</style>
    </>
  );
};

export default InstructorProgressTable;