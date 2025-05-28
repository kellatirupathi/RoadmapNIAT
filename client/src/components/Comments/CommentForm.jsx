// client/src/components/Comments/CommentForm.jsx
import React, { useState } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import commentsService from '../../services/commentsService'; // Ensure this path is correct
import useAuth from '../../hooks/useAuth';

const CommentForm = ({ techStackId, itemId, onCommentAdded }) => {
  const { user } = useAuth(); // user is used to check if logged in, potentially for disabling if not.
  const [commentText, setCommentText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false); // Default to public
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setSuccess(null); // Clear previous success messages
    
    if (!commentText.trim()) {
      setError('Comment text is required');
      return;
    }
    
    try {
      setLoading(true);
      
      const commentData = {
        content: commentText.trim(),
        isPrivate: isPrivate
      };
      
      // The addComment service function expects techStackId and itemId
      await commentsService.addComment(techStackId, itemId, commentData);
      
      setCommentText('');
      setIsPrivate(false); // Reset private checkbox
      setSuccess('Comment added successfully!');
      
      // Clear success message after a few seconds
      setTimeout(() => setSuccess(null), 3000);
      
      if (onCommentAdded) {
        onCommentAdded(); // Callback to parent to refresh comments or update UI
      }
      
    } catch (err) {
      console.error('Error adding comment:', err);
      const errorMessage = err.response?.data?.error || 'Failed to add comment. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Please log in to comment.</p>;

  return (
    <div className="comment-form mt-4">
      <h5 className="mb-3">
        <i className="fas fa-comment-dots me-2"></i> {/* Changed icon */}
        Leave a Comment
      </h5>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="py-2 small">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="py-2 small">
          {success}
        </Alert>
      )}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Write your comment here..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={loading}
            required
          />
        </Form.Group>
        
        {/* Allow private comments only for certain roles or specific conditions */}
        {(user.role === 'admin' || user.role === 'manager' || user.role === 'instructor') && (
            <Form.Group className="mb-3">
                <Form.Check
                    type="checkbox"
                    id={`private-comment-check-${itemId}`}
                    label="Mark as private (visible to admins, managers, and yourself)"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    disabled={loading}
                />
            </Form.Group>
        )}
        
        <div className="d-flex justify-content-end"> {/* Align button to right */}
          <Button 
            type="submit" 
            variant="primary"
            disabled={loading || !commentText.trim()}
            className="px-4"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane me-2"></i>
                Submit Comment
              </>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CommentForm;