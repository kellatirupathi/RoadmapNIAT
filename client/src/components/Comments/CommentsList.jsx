// // client/src/components/Comments/CommentsList.jsx
// import React, { useState, useEffect } from 'react';
// import { Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
// import commentsService from '../../services/commentsService';
// import useAuth from '../../hooks/useAuth';
// import { getRoleDisplayName } from '../../services/rolesService'; // Helper for role display

// const CommentsList = ({ techStackId, itemId, refreshTrigger }) => {
//   const { user } = useAuth();
//   const [comments, setComments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showAll, setShowAll] = useState(false); // State for "Show All" / "Show Less"
  
//   const initialCommentsToShow = 3; // Number of comments to show initially

//   useEffect(() => {
//     const fetchComments = async () => {
//       try {
//         setLoading(true);
//         setError(null); // Clear previous errors
//         const response = await commentsService.getComments(techStackId, itemId);
//         // Filter comments again on client based on user role, though backend should handle primary filtering
//         const filteredComments = response.data.filter(comment => {
//             if (comment.isPrivate) {
//                 // User can see their own private comments, or if they are admin/manager
//                 return comment.user?._id === user?._id || user?.role === 'admin' || user?.role === 'manager' || user?.role === 'instructor';
//             }
//             return true; // Public comments are visible to all authorized viewers of this list
//         });
//         setComments(filteredComments);
//       } catch (err) {
//         console.error('Error fetching comments:', err);
//         const errorMessage = err.response?.data?.error || 'Failed to load comments.';
//         setError(errorMessage);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (techStackId && itemId) {
//       fetchComments();
//     }
//   }, [techStackId, itemId, refreshTrigger, user]); // Add user to dependency array

//   const handleDeleteComment = async (commentId) => {
//     if (window.confirm('Are you sure you want to delete this comment?')) {
//       try {
//         setError(null);
//         // Call service to delete
//         await commentsService.deleteComment(techStackId, itemId, commentId); // Use the new signature
        
//         // Update local state to remove the comment
//         setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
//         // Optionally, trigger a refresh or parent callback if needed
//       } catch (err) {
//         console.error('Error deleting comment:', err);
//         const errorMessage = err.response?.data?.error || 'Failed to delete comment.';
//         setError(errorMessage);
//       }
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleString('en-US', { // Using toLocaleString for better formatting
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const canDeleteComment = (comment) => {
//     if (!user) return false;
//     return (
//       comment.user?._id === user._id || 
//       user.role === 'admin' || 
//       user.role === 'manager'
//     );
//   };

//   const visibleComments = showAll ? comments : comments.slice(0, initialCommentsToShow);

//   return (
//     <div className="comments-list mt-4"> {/* Added mt-4 */}
//       <h5 className="mb-3 d-flex align-items-center"> {/* Ensure title and badge are aligned */}
//         <i className="fas fa-comments me-2"></i>
//         Discussion
//         {comments.length > 0 && (
//           <Badge bg="secondary" pill className="ms-2 px-2 py-1 small"> {/* Nicer badge */}
//             {comments.length}
//           </Badge>
//         )}
//       </h5>
      
//       {error && (
//         <Alert variant="danger" onClose={() => setError(null)} dismissible className="py-2 small">
//           {error}
//         </Alert>
//       )}
      
//       {loading ? (
//         <div className="text-center py-4"> {/* Increased padding */}
//           <Spinner animation="border" size="sm" variant="primary" className="me-2" /> {/* Added variant */}
//           <span>Loading comments...</span>
//         </div>
//       ) : comments.length === 0 ? (
//         <Card className="border-0 bg-light"> {/* Light background card */}
//           <Card.Body className="text-center text-muted py-4">
//             <i className="fas fa-comment-slash fa-2x mb-3 opacity-50"></i> {/* Icon with opacity */}
//             <p className="mb-0">No comments yet. Be the first to discuss!</p>
//           </Card.Body>
//         </Card>
//       ) : (
//         <>
//           {visibleComments.map((comment) => (
//             <Card key={comment._id} className="mb-3 shadow-sm comment-card"> {/* Added shadow-sm */}
//               <Card.Body className="py-2 px-3"> {/* Adjusted padding */}
//                 <div className="d-flex justify-content-between align-items-start mb-1">
//                   <div>
//                     <strong className="me-2">
//                       {comment.user?.firstName && comment.user?.lastName 
//                         ? `${comment.user.firstName} ${comment.user.lastName}` 
//                         : comment.user?.username || 'Anonymous'}
//                     </strong>
//                     <Badge bg="light" text="dark" className="border me-1">
//                       {getRoleDisplayName(comment.user?.role)}
//                     </Badge>
//                     {comment.isPrivate && (
//                       <Badge bg="warning" text="dark" pill className="ms-2 small">
//                         <i className="fas fa-lock me-1"></i>
//                         Private
//                       </Badge>
//                     )}
//                   </div>
//                   {canDeleteComment(comment) && (
//                     <Button 
//                       variant="link" 
//                       className="text-danger p-0 ms-2 delete-comment-btn" 
//                       onClick={() => handleDeleteComment(comment._id)}
//                       title="Delete comment" // Added title
//                     >
//                       <i className="fas fa-trash-alt fa-xs"></i> {/* Smaller icon */}
//                     </Button>
//                   )}
//                 </div>
//                 <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</p> {/* Preserve line breaks */}
//                 <small className="text-muted d-block text-end"> {/* Align date to right */}
//                   {formatDate(comment.createdAt)}
//                 </small>
//               </Card.Body>
//             </Card>
//           ))}
          
//           {comments.length > initialCommentsToShow && (
//             <div className="text-center mt-2">
//               <Button 
//                 variant="link" 
//                 onClick={() => setShowAll(!showAll)}
//                 className="text-decoration-none small"
//               >
//                 {showAll ? (
//                   <><i className="fas fa-chevron-up me-1"></i>Show Less</>
//                 ) : (
//                   <><i className="fas fa-chevron-down me-1"></i>Show All ({comments.length}) Comments</>
//                 )}
//               </Button>
//             </div>
//           )}
//         </>
//       )}
//       <style jsx global>{`
//         .comment-card {
//           border-radius: .5rem;
//         }
//         .delete-comment-btn i {
//             transition: color 0.2s ease-in-out;
//         }
//         .delete-comment-btn:hover i {
//             color: #dc3545 !important; /* Use Bootstrap's danger color directly */
//         }
//       `}</style>
//     </div>
//   );
// };

// export default CommentsList;


// client/src/components/Comments/CommentsList.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import commentsService from '../../services/commentsService';
import useAuth from '../../hooks/useAuth';
import { getRoleDisplayName } from '../../services/rolesService';
import './CommentsList.css'; // Import the new CSS file

const CommentsList = ({ techStackId, itemId, refreshTrigger }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  
  const initialCommentsToShow = 3;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await commentsService.getComments(techStackId, itemId);
        const filteredComments = response.data.filter(comment => {
            if (comment.isPrivate) {
                return comment.user?._id === user?._id || user?.role === 'admin' || user?.role === 'manager' || user?.role === 'instructor';
            }
            return true;
        });
        setComments(filteredComments);
      } catch (err) {
        console.error('Error fetching comments:', err);
        const errorMessage = err.response?.data?.error || 'Failed to load comments.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (techStackId && itemId) {
      fetchComments();
    }
  }, [techStackId, itemId, refreshTrigger, user]);

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        setError(null);
        await commentsService.deleteComment(techStackId, itemId, commentId);
        setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
      } catch (err) {
        console.error('Error deleting comment:', err);
        const errorMessage = err.response?.data?.error || 'Failed to delete comment.';
        setError(errorMessage);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canDeleteComment = (comment) => {
    if (!user) return false;
    return (
      comment.user?._id === user._id || 
      user.role === 'admin' || 
      user.role === 'manager'
    );
  };

  const visibleComments = showAll ? comments : comments.slice(0, initialCommentsToShow);

  return (
    <div className="comments-list mt-4">
      <h5 className="mb-3 d-flex align-items-center">
        <i className="fas fa-comments me-2"></i>
        Discussion
        {comments.length > 0 && (
          <Badge bg="secondary" pill className="ms-2 px-2 py-1 small">
            {comments.length}
          </Badge>
        )}
      </h5>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="py-2 small">
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" variant="primary" className="me-2" />
          <span>Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <Card className="border-0 bg-light">
          <Card.Body className="text-center text-muted py-4">
            <i className="fas fa-comment-slash fa-2x mb-3 opacity-50"></i>
            <p className="mb-0">No comments yet. Be the first to discuss!</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {visibleComments.map((comment) => (
            <Card key={comment._id} className="mb-3 shadow-sm comment-card">
              <Card.Body className="py-2 px-3">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div>
                    <strong className="me-2">
                      {comment.user?.firstName && comment.user?.lastName 
                        ? `${comment.user.firstName} ${comment.user.lastName}` 
                        : comment.user?.username || 'Anonymous'}
                    </strong>
                    <Badge bg="light" text="dark" className="border me-1">
                      {getRoleDisplayName(comment.user?.role)}
                    </Badge>
                    {comment.isPrivate && (
                      <Badge bg="warning" text="dark" pill className="ms-2 small">
                        <i className="fas fa-lock me-1"></i>
                        Private
                      </Badge>
                    )}
                  </div>
                  {canDeleteComment(comment) && (
                    <Button 
                      variant="link" 
                      className="text-danger p-0 ms-2 delete-comment-btn" 
                      onClick={() => handleDeleteComment(comment._id)}
                      title="Delete comment"
                    >
                      <i className="fas fa-trash-alt fa-xs"></i>
                    </Button>
                  )}
                </div>
                <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                <small className="text-muted d-block text-end">
                  {formatDate(comment.createdAt)}
                </small>
              </Card.Body>
            </Card>
          ))}
          
          {comments.length > initialCommentsToShow && (
            <div className="text-center mt-2">
              <Button 
                variant="link" 
                onClick={() => setShowAll(!showAll)}
                className="text-decoration-none small"
              >
                {showAll ? (
                  <><i className="fas fa-chevron-up me-1"></i>Show Less</>
                ) : (
                  <><i className="fas fa-chevron-down me-1"></i>Show All ({comments.length}) Comments</>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentsList;
