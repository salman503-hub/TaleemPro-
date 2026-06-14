import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/notifications/');
      setNotifications(response.data.results || response.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/mark-read/`);
      // Update local state
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
      alert('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read/');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
      alert('Failed to mark all notifications as read.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await api.delete(`/api/notifications/${id}/`);
        setNotifications(notifications.filter(n => n.id !== id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete notification.');
      }
    }
  };

  const getNotificationBadge = (type) => {
    switch (type) {
      case 'WELCOME':
        return <span className="badge bg-indigo text-white px-2 py-1.5 fw-semibold" style={{ backgroundColor: '#4f46e5' }}>Welcome</span>;
      case 'COURSE_ASSIGNED':
        return <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle px-2 py-1.5 fw-semibold">Course Assigned</span>;
      case 'COURSE_REMOVED':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1.5 fw-semibold">Course Removed</span>;
      case 'PROFILE_UPDATED':
        return <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1.5 fw-semibold">Profile Update</span>;
      case 'LEAVE_APPROVED':
        return <span className="badge bg-success text-white px-2 py-1.5 fw-semibold">Leave Approved</span>;
      case 'LEAVE_REJECTED':
        return <span className="badge bg-danger text-white px-2 py-1.5 fw-semibold">Leave Rejected</span>;
      default:
        return <span className="badge bg-secondary text-white px-2 py-1.5 fw-semibold">Notification</span>;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'WELCOME':
        return '👋';
      case 'COURSE_ASSIGNED':
        return '📚';
      case 'COURSE_REMOVED':
        return '🚫';
      case 'PROFILE_UPDATED':
        return '⚙️';
      case 'LEAVE_APPROVED':
        return '✅';
      case 'LEAVE_REJECTED':
        return '❌';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column flex-md-row" style={{ background: 'var(--bg-color-main)', textAlign: 'left' }}>
      <Sidebar />

      <main className="flex-grow-1 p-3 p-md-4" style={{ overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Link to="/dashboard" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Dashboard</Link>
            <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Notifications Center</h1>
            <p className="text-secondary mb-0">View system updates, course assignments, and account alerts.</p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="btn btn-outline-primary fw-semibold px-4"
              style={{ borderRadius: '6px' }}
            >
              Mark All as Read
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '12px' }}>
          {loading ? (
            <div className="py-5 text-center text-secondary">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mb-0">Loading your alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-5 text-center text-secondary">
              <span style={{ fontSize: '3rem' }}>🔔</span>
              <h4 className="h5 text-dark fw-semibold mt-3 mb-1">All Caught Up!</h4>
              <p className="mb-0">You have no notifications in your inbox.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 border rounded d-flex justify-content-between align-items-start gap-3 transition-all ${!notif.is_read ? 'bg-light border-primary-subtle' : 'bg-white'}`}
                  style={{ 
                    borderRadius: '8px',
                    borderLeft: !notif.is_read ? '4px solid #4f46e5' : '1px solid #dee2e6'
                  }}
                >
                  <div className="d-flex align-items-start gap-3">
                    <span style={{ fontSize: '1.5rem', marginTop: '2px' }}>
                      {getNotificationIcon(notif.type)}
                    </span>
                    <div>
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <h3 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>{notif.title}</h3>
                        {getNotificationBadge(notif.type)}
                        {!notif.is_read && (
                          <span className="badge bg-danger rounded-pill px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>Unread</span>
                        )}
                      </div>
                      <p className="mb-1 text-secondary" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                        {notif.message}
                      </p>
                      <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                        {new Date(notif.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </small>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {!notif.is_read && (
                      <button 
                        onClick={() => handleMarkRead(notif.id)}
                        className="btn btn-sm btn-light fw-medium border px-2.5 py-1"
                        style={{ fontSize: '0.75rem', borderRadius: '4px' }}
                      >
                        Mark as Read
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(notif.id)}
                      className="btn btn-sm btn-outline-danger border-0 px-2 py-1"
                      style={{ fontSize: '0.75rem', borderRadius: '4px' }}
                      title="Delete notification"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Notifications;
