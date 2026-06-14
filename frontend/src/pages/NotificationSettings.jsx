import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

function NotificationSettings() {
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState({
    welcome_emails_enabled: true,
    course_assignment_emails_enabled: true
  });
  const [emailLogs, setEmailLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Search filters
  const [emailSearch, setEmailSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Simulation form state
  const [selectedUser, setSelectedUser] = useState('');
  const [leaveStatus, setLeaveStatus] = useState('APPROVED');

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/notifications/admin-settings/');
      setSettings(response.data);
    } catch (err) {
      console.error(err);
      showMsg('danger', 'Failed to load global notification settings.');
    }
  };

  const fetchEmailLogs = async (searchVal = '') => {
    setLoading(true);
    try {
      const response = await api.get('/api/notifications/logs/email/', {
        params: { search: searchVal }
      });
      setEmailLogs(response.data.results || response.data || []);
    } catch (err) {
      console.error(err);
      showMsg('danger', 'Failed to load email history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (searchVal = '') => {
    setLoading(true);
    try {
      const response = await api.get('/api/notifications/logs/audit/', {
        params: { search: searchVal }
      });
      setAuditLogs(response.data.results || response.data || []);
    } catch (err) {
      console.error(err);
      showMsg('danger', 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/notifications/users/');
      setUsers(response.data);
      if (response.data.length > 0) {
        setSelectedUser(response.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'emails') {
      fetchEmailLogs();
    } else if (activeTab === 'audits') {
      fetchAuditLogs();
    } else if (activeTab === 'simulation') {
      fetchUsers();
    }
  }, [activeTab]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleToggleSetting = async (key) => {
    const updatedSettings = { ...settings, [key]: !settings[key] };
    try {
      await api.put('/api/notifications/admin-settings/', updatedSettings);
      setSettings(updatedSettings);
      showMsg('success', 'Notification preferences updated successfully.');
    } catch (err) {
      console.error(err);
      showMsg('danger', 'Failed to update preferences.');
    }
  };

  const handleResend = async (id) => {
    setActionLoading(true);
    try {
      await api.post(`/api/notifications/logs/email/${id}/resend/`);
      showMsg('success', 'Email resend job triggered in the background.');
      if (activeTab === 'emails') fetchEmailLogs(emailSearch);
    } catch (err) {
      console.error(err);
      showMsg('danger', 'Failed to trigger email resend.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Please select a user first.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/api/notifications/simulate-leave/', {
        user_id: selectedUser,
        status: leaveStatus
      });
      showMsg('success', `Simulated Leave ${leaveStatus.toLowerCase()} notification dispatched.`);
    } catch (err) {
      console.error(err);
      showMsg('danger', 'Failed to dispatch simulation notification.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column flex-md-row" style={{ background: 'var(--bg-color-main)', textAlign: 'left' }}>
      <Sidebar />

      <main className="flex-grow-1 p-3 p-md-4" style={{ overflowY: 'auto' }}>
        <div className="mb-4">
          <Link to="/dashboard" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Dashboard</Link>
          <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Notification & System Controls</h1>
          <p className="text-secondary mb-0">Configure global preferences, monitor email queues, view logs, and trigger simulations.</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
          </div>
        )}

        {/* Tab Navigation links */}
        <ul className="nav nav-tabs mb-4 border-bottom">
          <li className="nav-item">
            <button 
              className={`nav-link border-0 fw-semibold px-4 py-2.5 ${activeTab === 'settings' ? 'active border-bottom border-primary border-3 text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Preference Settings
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link border-0 fw-semibold px-4 py-2.5 ${activeTab === 'emails' ? 'active border-bottom border-primary border-3 text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('emails')}
            >
              📧 Email Queue History
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link border-0 fw-semibold px-4 py-2.5 ${activeTab === 'audits' ? 'active border-bottom border-primary border-3 text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('audits')}
            >
              📜 Administrator Audit Logs
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link border-0 fw-semibold px-4 py-2.5 ${activeTab === 'simulation' ? 'active border-bottom border-primary border-3 text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('simulation')}
            >
              🧪 Notification Simulator
            </button>
          </li>
        </ul>

        {/* Tab Contents */}
        <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '12px' }}>
          
          {/* TAB 1: SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="h5 fw-bold text-dark mb-3">Global Email Configurations</h2>
              <p className="text-secondary small mb-4">Toggle system-wide email notifications when specific actions occur.</p>
              
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center py-3 px-0">
                  <div>
                    <h3 className="h6 fw-bold mb-0 text-dark">Teacher Welcome Emails</h3>
                    <p className="text-secondary small mb-0">Automatically email login details and instructions to new teachers upon creation.</p>
                  </div>
                  <div className="form-check form-switch fs-4">
                    <input 
                      className="form-check-input cursor-pointer" 
                      type="checkbox" 
                      checked={settings.welcome_emails_enabled}
                      onChange={() => handleToggleSetting('welcome_emails_enabled')}
                    />
                  </div>
                </div>

                <div className="list-group-item d-flex justify-content-between align-items-center py-3 px-0">
                  <div>
                    <h3 className="h6 fw-bold mb-0 text-dark">Course Assignment Emails</h3>
                    <p className="text-secondary small mb-0">Send a detailed course assignment alert when a teacher is linked to a course.</p>
                  </div>
                  <div className="form-check form-switch fs-4">
                    <input 
                      className="form-check-input cursor-pointer" 
                      type="checkbox" 
                      checked={settings.course_assignment_emails_enabled}
                      onChange={() => handleToggleSetting('course_assignment_emails_enabled')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL LOGS */}
          {activeTab === 'emails' && (
            <div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
                <h2 className="h5 fw-bold text-dark mb-0">Dispatched Mail History</h2>
                
                <form onSubmit={(e) => { e.preventDefault(); fetchEmailLogs(emailSearch); }} className="d-flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search by recipient or status..." 
                    className="form-control form-control-sm"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    style={{ width: '240px' }}
                  />
                  <button type="submit" className="btn btn-sm btn-primary">Search</button>
                  {emailSearch && (
                    <button 
                      type="button" 
                      onClick={() => { setEmailSearch(''); fetchEmailLogs(''); }} 
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {loading ? (
                <div className="text-center py-5 text-secondary">
                  <div className="spinner-border text-primary mb-2" role="status"><span className="visually-hidden">Loading...</span></div>
                  <p className="mb-0">Loading mail logs...</p>
                </div>
              ) : emailLogs.length === 0 ? (
                <p className="text-center py-4 text-secondary mb-0">No email log records found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                    <thead className="table-light text-secondary">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Recipient</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Error details</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="py-3 px-3 text-muted">{new Date(log.sent_at).toLocaleString()}</td>
                          <td className="py-3 px-3 fw-semibold text-dark">{log.recipient_email}</td>
                          <td className="py-3 px-3 text-muted">{log.subject}</td>
                          <td className="py-3 px-3">
                            <span className="badge bg-secondary-subtle text-secondary-emphasis border px-2 py-1">{log.notification_type || 'Unknown'}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`badge px-2.5 py-1.5 fw-semibold ${log.status === 'SENT' ? 'bg-success-subtle text-success-emphasis' : log.status === 'FAILED' ? 'bg-danger-subtle text-danger-emphasis' : 'bg-warning-subtle text-warning-emphasis'}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-danger small" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.error_message}>
                            {log.error_message || '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button 
                              onClick={() => handleResend(log.id)}
                              disabled={actionLoading}
                              className="btn btn-sm btn-outline-primary fw-medium"
                              style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                            >
                              Resend
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'audits' && (
            <div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
                <h2 className="h5 fw-bold text-dark mb-0">System Action Roster</h2>
                
                <form onSubmit={(e) => { e.preventDefault(); fetchAuditLogs(auditSearch); }} className="d-flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search action or user..." 
                    className="form-control form-control-sm"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    style={{ width: '240px' }}
                  />
                  <button type="submit" className="btn btn-sm btn-primary">Search</button>
                  {auditSearch && (
                    <button 
                      type="button" 
                      onClick={() => { setAuditSearch(''); fetchAuditLogs(''); }} 
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {loading ? (
                <div className="text-center py-5 text-secondary">
                  <div className="spinner-border text-primary mb-2" role="status"><span className="visually-hidden">Loading...</span></div>
                  <p className="mb-0">Loading audit records...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-center py-4 text-secondary mb-0">No audit log records found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                    <thead className="table-light text-secondary">
                      <tr>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Actor (User)</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Module</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="py-3 px-3 text-muted">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="py-3 px-3 fw-semibold text-dark">{log.username}</td>
                          <td className="py-3 px-3">
                            <span className="badge bg-primary-subtle text-primary-emphasis border px-2 py-1">{log.action}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="badge bg-secondary-subtle text-secondary-emphasis px-2 py-1">{log.module}</span>
                          </td>
                          <td className="py-3 px-3 text-muted" style={{ maxWidth: '300px' }}>{log.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SIMULATION */}
          {activeTab === 'simulation' && (
            <div>
              <h2 className="h5 fw-bold text-dark mb-3">Simulate User Alerts</h2>
              <p className="text-secondary small mb-4">Send simulated notifications to students or teachers to verify in-app notification flows.</p>
              
              <form onSubmit={handleSimulate} style={{ maxWidth: '500px' }}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Target User Account</label>
                  <select 
                    className="form-select"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select User Profile --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role}) - {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">Leave Request Status</label>
                  <div className="d-flex gap-4">
                    <div className="form-check">
                      <input 
                        className="form-check-input cursor-pointer" 
                        type="radio" 
                        name="leaveStatus" 
                        id="statusApprove" 
                        value="APPROVED"
                        checked={leaveStatus === 'APPROVED'}
                        onChange={() => setLeaveStatus('APPROVED')}
                      />
                      <label className="form-check-label cursor-pointer text-dark fw-medium" htmlFor="statusApprove">
                        🟢 Leave Approved
                      </label>
                    </div>
                    <div className="form-check">
                      <input 
                        className="form-check-input cursor-pointer" 
                        type="radio" 
                        name="leaveStatus" 
                        id="statusReject" 
                        value="REJECTED"
                        checked={leaveStatus === 'REJECTED'}
                        onChange={() => setLeaveStatus('REJECTED')}
                      />
                      <label className="form-check-label cursor-pointer text-dark fw-medium" htmlFor="statusReject">
                        🔴 Leave Rejected
                      </label>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={actionLoading || !selectedUser}
                  className="btn btn-primary px-4 fw-semibold"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', borderRadius: '6px' }}
                >
                  {actionLoading ? 'Dispatching...' : '🚀 Trigger Notification'}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default NotificationSettings;
