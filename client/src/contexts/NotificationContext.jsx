// client/src/contexts/NotificationContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import io from 'socket.io-client';
import notificationService from '../services/notificationService';
import useAuth from '../hooks/useAuth';

export const NotificationContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false); // For HTTP loading
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Fetch initial notifications via HTTP
  const fetchInitialNotifications = useCallback(async () => {
    if (!isAuthenticated || !(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'instructor')) {
      // Also allow instructors to fetch their notifications
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await notificationService.getMyNotifications();
      setNotifications(response.data || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch initial notifications:', err);
      setError('Failed to fetch notifications.');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchInitialNotifications();
  }, [fetchInitialNotifications]);

  // Setup and manage WebSocket connection
  useEffect(() => {
    // Allow instructors to also connect for real-time updates
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'instructor') && user?._id) {
      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL, {
          transports: ['websocket'],
          reconnectionAttempts: 5,
          // You might pass the token here for authentication if your backend socket server expects it
          // auth: { token: localStorage.getItem('token') }
        });
      }

      const socket = socketRef.current;

      if (!socket.connected) {
          socket.connect();
      }

      socket.on('connect', () => {
        console.log('Socket connected to server:', socket.id);
        setSocketConnected(true);
        socket.emit('registerUser', user._id); // Register user with their ID
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setSocketConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setSocketConnected(false);
      });

      // Listen for new notifications from the server
      socket.on('new_notification', (newNotification) => {
        console.log('Received new notification via socket:', newNotification);
        // Prepend to keep newest on top & update count
        setNotifications(prevNotifications => [newNotification, ...prevNotifications.slice(0, 19)]); // Keep last 20 for display
        if (!newNotification.isRead) {
          setUnreadCount(prevCount => prevCount + 1);
        }

        // Optional: Show browser notification
        if (typeof window !== "undefined" && window.Notification && Notification.permission === "granted") {
            new Notification("New Roadmap Comment", {
                body: newNotification.message,
                icon: '/logo.svg', // Path to your app's icon
                tag: newNotification._id // Use notification ID as tag to prevent duplicate system notifications if resent
            });
        }
      });

      return () => { // Cleanup on component unmount or user change
        if (socket) {
          console.log('Cleaning up socket connection...');
          socket.off('connect');
          socket.off('disconnect');
          socket.off('connect_error');
          socket.off('new_notification');
          if (socket.connected) {
            socket.disconnect();
          }
          socketRef.current = null;
          setSocketConnected(false);
        }
      };
    } else {
      // Not authenticated or not admin/manager, disconnect socket if it exists
      if (socketRef.current && socketRef.current.connected) {
        console.log('User not authorized or not authenticated, disconnecting socket.');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
      }
      setNotifications([]); // Clear notifications if user logs out or role changes
      setUnreadCount(0);
    }
  }, [isAuthenticated, user]); // Re-run when auth state or user changes


  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && window.Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("Browser notification permission granted.");
        } else {
          console.log("Browser notification permission denied.");
        }
      });
    }
  }, []);


  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      // Optimistically update UI
      const updatedNotifications = notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      );
      setNotifications(updatedNotifications);
      const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
      setUnreadCount(newUnreadCount); // Recalculate accurately
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };
  
  const contextValue = {
    notifications,
    unreadCount,
    loadingNotifications: loading, // Renamed to avoid conflict with socket loading status
    socketConnected,
    notificationError: error, // Renamed
    fetchNotifications: fetchInitialNotifications, // Expose initial fetch
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};