import React, { useEffect, useState, createContext, useContext } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/API/services/admin/notificationService';

// Define Notification interface
/**
 * @typedef {Object} Notification
 * @property {string} _id - Notification ID
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {string} type - Notification type
 * @property {boolean} isRead - Whether notification has been read
 * @property {string} createdAt - Creation timestamp
 * @property {Object} [entity] - Related entity
 * @property {string} [entity.id] - Entity ID
 * @property {string} [entity.type] - Entity type
 */

/**
 * @typedef {Object} AdminNotificationsContextType
 * @property {Array<Notification>} notifications - Array of notifications
 * @property {number} unreadCount - Count of unread notifications
 * @property {boolean} loading - Loading state
 * @property {Function} updateNotifications - Function to refresh notifications
 * @property {Function} markAsRead - Function to mark notification as read
 * @property {Function} markAllAsRead - Function to mark all notifications as read
 */

// Create context
const AdminNotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  updateNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {}
});

// Provider component
export const AdminNotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { lastMessage } = useWebSocket();
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Function to fetch notifications
  const updateNotifications = async () => {
    try {
      setLoading(true);
      const fetchedNotifications = await getNotifications();
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to mark a notification as read
  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Initial fetch of notifications
  useEffect(() => {
    updateNotifications();
    
    // Set up interval to check for new notifications every minute
    const intervalId = setInterval(() => {
      updateNotifications();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle incoming websocket notifications
  useEffect(() => {
    // Skip showing toast for initial render
    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }

    if (lastMessage) {
      // Refresh notifications when we receive a new one
      updateNotifications();
      
      const { type, action, data } = lastMessage;
      
      let message = '';
      let title = '';
      let toastType = toast.TYPE.INFO;
      
      // Determine notification type based on data received
      if (type === 'movie') {
        const movieTitle = data?.title || 'Một phim';
        title = 'Thông báo phim';
        
        switch (action) {
          case 'created':
            message = `${movieTitle} đã được thêm mới`;
            toastType = toast.TYPE.SUCCESS;
            break;
          case 'updated':
            message = `${movieTitle} đã được cập nhật`;
            toastType = toast.TYPE.INFO;
            break;
          case 'deleted':
            message = `${movieTitle} đã bị xóa`;
            toastType = toast.TYPE.WARNING;
            break;
          default:
            message = `Có thay đổi với ${movieTitle}`;
        }
      } else if (type === 'user') {
        const userName = data?.name || data?.email || 'Một người dùng';
        title = 'Thông báo người dùng';
        
        switch (action) {
          case 'created':
            message = `${userName} đã đăng ký mới`;
            toastType = toast.TYPE.SUCCESS;
            break;
          case 'updated':
            message = `${userName} đã được cập nhật`;
            toastType = toast.TYPE.INFO;
            break;
          default:
            message = `Có thay đổi với ${userName}`;
        }
      } else if (lastMessage.type === 'notification') {
        // Handle notification from our new system
        title = lastMessage.data?.title || 'Thông báo mới';
        message = lastMessage.data?.message || 'Có thông báo mới';
      } else {
        title = 'Thông báo mới';
        message = lastMessage.message || 'Có thông báo mới';
      }
      
      // Show toast notification
      toast(
        <div>
          <strong>{title}</strong>
          <p>{message}</p>
        </div>, 
        { 
          type: toastType,
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    }
  }, [lastMessage, isInitialRender]);

  const value = {
    notifications,
    unreadCount,
    loading,
    updateNotifications,
    markAsRead,
    markAllAsRead
  };

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
      <ToastContainer />
      {!useWebSocket().isConnected && (
        <div className="connection-status" style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          background: '#ff5555', 
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          Mất kết nối với server
        </div>
      )}
    </AdminNotificationsContext.Provider>
  );
};

// Custom hook to use the notifications context
export const useAdminNotifications = () => useContext(AdminNotificationsContext);

// The main AdminNotifications component
const AdminNotifications = () => {
  // This component doesn't render anything visible since the Provider handles everything
  return null;
};

export default AdminNotifications;