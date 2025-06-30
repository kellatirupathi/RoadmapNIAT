// client/src/components/Layout/NotificationIcon.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Dropdown, Badge, Button, Spinner, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { getRoleDisplayName } from '../../services/rolesService';

const NotificationIcon = () => {
  const { 
    notifications, 
    unreadCount, 
    loadingNotifications,
    markAsRead, 
    markAllAsRead,
    fetchNotifications 
  } = useNotifications();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const prevUnreadCountRef = useRef(unreadCount);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 2000);
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setShowDropdown(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllReadClick = async () => {
    await markAllAsRead();
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return "Invalid Date";
    }
  };
  
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // REFINED Function to format the notification display with comment content as primary
  const formatNotificationMessage = (notification) => {
      const triggeredBy = notification.triggeredBy; // Populated user object
      const details = notification.details || {};
      let primaryMessage = details.commentContentSnippet || notification.message || "Notification"; 
      let actorPrefix = ""; 
      let byLineText = "";
      let onText = ""; // For "on [topic] ([tech stack])"
  
      if (triggeredBy) {
          // Use commenterName and commenterRole from details if available (set by backend)
          const commenterDisplayName = details.commenterName || (triggeredBy.firstName ? `${triggeredBy.firstName} ${triggeredBy.lastName || ''}`.trim() : triggeredBy.username);
          const commenterActualRole = details.commenterRole || triggeredBy.role;
          
          actorPrefix = `${getRoleDisplayName(commenterActualRole)}: `;
          byLineText = `${commenterDisplayName} (${getRoleDisplayName(commenterActualRole)})`;
      } else {
          byLineText = "System";
      }
      
      if (notification.type === 'new_comment') {
          primaryMessage = `${actorPrefix}"${details.commentContentSnippet || 'A new comment was added.'}"`;
          if (details.roadmapItemTopic) {
            onText = (
              <p className="mb-0 notification-context-info">
                <span className="text-muted">On: </span> 
                <span className="notification-topic">"{details.roadmapItemTopic}"</span>
                {details.techStackName && <span className="text-muted"> ({details.techStackName})</span>}
              </p>
            );
          }
      }
  
      return (
        <div className="notification-content-wrapper">
          <p className={`mb-1 notification-primary-message ${!notification.isRead ? 'fw-bold' : ''}`}>
              {primaryMessage}
          </p>
          {onText} {/* Render the "on [topic]" text if available */}
          {/* 'By' line is less critical if actorPrefix is used, but kept for other notification types or if needed.
              Only show "By:" line if the byLineText provides additional info not in actorPrefix or if it's a different type of notification.
           */}
           { (notification.type !== 'new_comment' || !actorPrefix.startsWith(byLineText.split(' (')[0])) && byLineText && (
              <p className="mb-1 notification-context-info"> 
                  <span className="text-muted">By: </span> 
                  <span className="notification-actor">{byLineText}</span>
              </p>
           ) }
        </div>
      );
    };

  return (
    <div ref={dropdownRef} className="position-relative">
      <Button 
        variant="link" 
        onClick={() => setShowDropdown(!showDropdown)} 
        className={`p-0 text-gray-600 hover:text-primary-600 position-relative me-3 ${isBlinking ? 'notification-blink-effect' : ''}`}
        aria-expanded={showDropdown}
        title="Notifications"
      >
        <i className="fas fa-bell fa-lg"></i>
        {unreadCount > 0 && (
          <Badge 
            pill 
            bg="danger" 
            className="position-absolute top-0 start-100 translate-middle notification-badge-count"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showDropdown && (
        <Dropdown.Menu 
          show 
          className="shadow border-0 mt-2 notification-dropdown-menu-left-aligned" 
        >
          <Dropdown.Header className="d-flex justify-content-between align-items-center">
            <span className="fw-bold">Notifications</span>
            <div className="d-flex align-items-center">
              {notifications.length > 0 && unreadCount > 0 && (
                <Button variant="link" size="sm" onClick={handleMarkAllReadClick} className="p-0 text-primary small me-2">
                  Mark all as read
                </Button>
              )}
              <Button variant="link" size="sm" onClick={fetchNotifications} className="p-0 text-primary small" title="Refresh Notifications">
                  <i className="fas fa-sync-alt"></i>
              </Button>
            </div>
          </Dropdown.Header>
          
          <div className="notification-list-container">
            {loadingNotifications ? (
              <div className="text-center p-3">
                <Spinner animation="border" size="sm" />
                <p className="mb-0 small text-muted mt-1">Loading...</p>
              </div>
            ) : sortedNotifications.length === 0 ? (
              <Dropdown.ItemText className="text-center text-muted py-3">
                <i className="fas fa-bell-slash fa-2x mb-2 opacity-50"></i>
                <p className="mb-0 small">No notifications yet.</p>
              </Dropdown.ItemText>
            ) : (
              <ListGroup variant="flush">
                {sortedNotifications.map((notif) => (
                  <ListGroup.Item 
                    key={notif._id} 
                    action 
                    onClick={() => handleNotificationClick(notif)}
                    className={`notification-item-display ${!notif.isRead ? 'unread' : ''}`}
                  >
                    <div className="d-flex align-items-start">
                      {!notif.isRead && <div className="unread-dot"></div>}
                      <div className="flex-grow-1 ms-2">
                        {formatNotificationMessage(notif)}
                        <small className="text-muted d-block notification-timestamp mt-1">
                           {formatDate(notif.createdAt)}
                        </small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Dropdown.Menu>
      )}
       <style jsx global>{`
        @keyframes blinkAnimationEffect {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .notification-blink-effect .fa-bell {
          animation: blinkAnimationEffect 0.5s ease-in-out 2;
        }
        .notification-badge-count {
            font-size: 0.6em; 
            padding: 0.3em 0.5em;
            line-height: 0.9;
        }
        .notification-dropdown-menu-left-aligned {
            min-width: 350px; 
            max-width: 400px;
            border-radius: 0.375rem;
            right: 100%; 
            left: auto;
            margin-right: 8px; 
            transform: translateX(0);
            top: 0; 
            z-index: 1040;
        }
        .notification-list-container {
            max-height: 350px; 
            overflow-y: auto;
        }
        .notification-item-display {
            padding: 0.6rem 0.9rem; 
            border: none; 
            cursor: pointer;
            line-height: 1.35; 
        }
        .notification-item-display:hover {
          background-color: #f0f8ff; 
        }
        .notification-item-display.unread {
          background-color: #e7f3ff; 
        }
        .unread-dot {
          flex-shrink: 0;
          width: 7px; 
          height: 7px;
          background-color: var(--bs-primary); 
          border-radius: 50%;
          margin-right: 0.6rem; 
          margin-top: 0.4rem; 
        }

        /* Styling for the refined notification message (comment as primary) */
        .notification-content-wrapper {
            font-size: 0.8rem;
        }
        .notification-primary-message { /* This will now hold the comment snippet */
            font-size: 0.82rem; /* Main content, slightly larger */
            color: #2c3e50; /* Darker, primary text color */
            margin-bottom: 2px !important;
            /* Allow text to wrap, but limit lines */
            display: -webkit-box;
            -webkit-line-clamp: 3; /* Show up to 3 lines of the comment */
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
        }
        .notification-primary-message.fw-bold { /* Unread message style */
            font-weight: 600 !important;
            color: #1a2b3c; /* Even darker for unread importance */
        }
        .notification-context-info { /* "On:" and "By:" lines */
            font-size: 0.7rem; /* Smaller for secondary details */
            color: #5a6268; 
            margin-bottom: 0px !important;
            line-height: 1.2;
        }
        .notification-context-info .text-muted { 
            color: #7a8288 !important;
        }
        .notification-topic, .notification-actor {
            font-weight: 500;
            color: #4a5258;
        }
        .notification-timestamp { 
            font-size: 0.65rem; 
            color: #888 !important;
            margin-top: 3px !important; /* Small space before timestamp */
        }
      `}</style>
    </div>
  );
};

export default NotificationIcon;
