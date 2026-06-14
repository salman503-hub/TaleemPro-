import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';

/**
 * Dashboard Component
 * Renders role-specific metrics, dynamic SVG/CSS charts, operation menus.
 */
function Dashboard() {
  const { user } = useAuth();
  const { themeMode, themeColor, savePreferences } = useTheme();
  
  const [stats, setStats] = useState([]);
  const [chartsData, setChartsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showColors, setShowColors] = useState(false);
  const [statsName, setStatsName] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const themeColorsMap = {
    orange: '#f97316',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#eab308',
    teal: '#14b8a6',
    pink: '#ec4899',
    purple: '#8b5cf6'
  };

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/accounts/dashboard-stats/');
      setStats(response.data.stats || []);
      setChartsData(response.data.charts || null);
      if (response.data.teacher_name) {
        setStatsName(response.data.teacher_name);
      } else if (response.data.student_name) {
        setStatsName(response.data.student_name);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/api/announcements/');
      const list = response.data.results || response.data || [];
      setAnnouncements(list.slice(0, 3));
    } catch (err) {
      console.error('Failed to load announcements on dashboard', err);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const response = await api.get('/api/notifications/');
      const list = response.data.results || response.data || [];
      setNotifications(list.slice(0, 5));
      const unreadCountResponse = await api.get('/api/notifications/unread-count/');
      setUnreadNotifsCount(unreadCountResponse.data.unread_count);
    } catch (err) {
      console.error('Failed to load recent notifications', err);
    }
  };

  useEffect(() => {
    // Fetch dashboard stats and announcements
    fetchStats();
    fetchAnnouncements();
    fetchRecentNotifications();

    const interval = setInterval(fetchRecentNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Popover click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColors && !event.target.closest('#theme-palette-btn') && !event.target.closest('.animate-fade-in-up')) {
        setShowColors(false);
      }
      if (showNotifications && !event.target.closest('#bell-notif-btn') && !event.target.closest('.notif-popover')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColors, showNotifications]);

  const toggleTheme = () => {
    let currentMode = themeMode;
    if (themeMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentMode = prefersDark ? 'dark' : 'light';
    }
    const nextMode = currentMode === 'dark' ? 'light' : 'dark';
    savePreferences({ themeMode: nextMode });
  };

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column flex-md-row" style={{ background: 'var(--bg-color-main)', textAlign: 'left' }}>
      
      <Sidebar />

      {/* Main dashboard content area */}
      <main className="flex-grow-1 p-3 p-md-4" style={{ overflowY: 'auto' }}>
        
        {/* Dynamic User Profile Welcome Header Card with Settings */}
        <div className="mb-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center p-4 rounded shadow-sm gap-3 position-relative" 
             style={{ 
               backgroundColor: 'var(--card-bg-main)', 
               border: '1px solid var(--border-color-main)', 
               borderRadius: '12px',
               transition: 'all 0.3s'
             }}>
          <div>
            <h1 className="h4 fw-bold mb-1" style={{ letterSpacing: '-0.5px', color: 'var(--text-color-main)' }}>
              Welcome back, {statsName || (user ? user.username : 'User')}!
            </h1>
            <p className="mb-0" style={{ fontSize: '0.9rem', color: 'var(--text-muted-main)' }}>
              Here is your portal command center overview.
            </p>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            
            {/* Notification Bell Icon Button with popover */}
            <div className="position-relative">
              <button
                type="button"
                id="bell-notif-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn p-0 rounded-circle border-0 d-flex align-items-center justify-content-center position-relative"
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: showNotifications ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: '1px solid var(--border-color-main)',
                  color: 'var(--text-color-main)',
                  transition: 'all 0.25s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}
                title="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadNotifsCount > 0 && (
                  <span 
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.62rem', padding: '0.25em 0.5em', transform: 'translate(-35%, -10%)' }}
                  >
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div 
                  className="position-absolute bg-white rounded shadow-lg notif-popover"
                  style={{
                    top: '48px',
                    right: '0',
                    width: '320px',
                    zIndex: 1060,
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    textAlign: 'left'
                  }}
                >
                  <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                    <span className="fw-bold text-dark font-sans" style={{ fontSize: '0.9rem' }}>Recent Notifications</span>
                    {unreadNotifsCount > 0 && (
                      <span className="badge bg-danger rounded-pill fw-bold" style={{ fontSize: '0.7rem' }}>{unreadNotifsCount} Unread</span>
                    )}
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-secondary" style={{ fontSize: '0.82rem' }}>
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id}
                          onClick={async () => {
                            if (!notif.is_read) {
                              try {
                                await api.post(`/api/notifications/${notif.id}/mark-read/`);
                                setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                                setUnreadNotifsCount(prev => Math.max(0, prev - 1));
                              } catch (err) {
                                console.error(notif, err);
                              }
                            }
                          }}
                          className={`p-3 border-bottom transition-all ${!notif.is_read ? 'bg-light font-bold' : 'bg-white'}`}
                          style={{ fontSize: '0.82rem', borderLeft: !notif.is_read ? '3px solid #4f46e5' : 'none', cursor: 'pointer' }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <span className={`text-dark ${!notif.is_read ? 'fw-bold' : ''}`}>{notif.title}</span>
                            <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                              {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-secondary mb-0 text-truncate" style={{ fontSize: '0.78rem' }}>{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <Link 
                    to="/notifications" 
                    onClick={() => setShowNotifications(false)}
                    className="d-block p-2.5 text-center text-decoration-none fw-semibold border-top bg-light"
                    style={{ fontSize: '0.82rem', color: '#4f46e5' }}
                  >
                    View All Notifications
                  </Link>
                </div>
              )}
            </div>

            {/* Paint Palette Icon Button with popover */}
            <div className="position-relative">
              <button
                type="button"
                id="theme-palette-btn"
                onClick={() => setShowColors(!showColors)}
                className="btn p-0 rounded-circle border-0 d-flex align-items-center justify-content-center position-relative"
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: showColors ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: '1px solid var(--border-color-main)',
                  color: 'var(--text-color-main)',
                  transition: 'all 0.25s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}
                title="Theme Colors"
              >
                {/* Paint Palette SVG Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-aperture">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 5.97715 2 11C2 12.3789 2.50284 13.7121 3.42157 14.5784C3.79153 14.9272 4 15.4057 4 15.9082V18C4 20.2091 5.79086 22 8 22H12Z" />
                  <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor"/>
                  <circle cx="11.5" cy="7.5" r="1.2" fill="currentColor"/>
                  <circle cx="16.5" cy="9.5" r="1.2" fill="currentColor"/>
                  <circle cx="15.5" cy="14.5" r="1.2" fill="currentColor"/>
                </svg>
                
                {/* Accent notification badge dot */}
                <span 
                  className="position-absolute top-0 start-100 translate-middle p-1 rounded-circle border border-white"
                  style={{ backgroundColor: themeColorsMap[themeColor] || '#8b5cf6', width: '9px', height: '9px', borderWidth: '2.2px' }}
                />
              </button>

              {/* Accent Color Circle Swatches Container Popover (Floating below) */}
              {showColors && (
                <div 
                  className="position-absolute bg-white p-2 rounded-pill d-flex align-items-center gap-2 animate-fade-in-up"
                  style={{
                    top: '48px',
                    right: '0',
                    zIndex: 1060,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {/* Accent Swatches */}
                  {['orange', 'blue', 'green', 'yellow', 'teal', 'pink', 'purple'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => savePreferences({ themeColor: color })}
                      className="btn p-0 rounded-circle border-0"
                      style={{
                        width: '18px',
                        height: '18px',
                        backgroundColor: themeColorsMap[color],
                        boxShadow: themeColor === color ? '0 0 0 2px #ffffff, 0 0 0 3.5px var(--primary-accent-color)' : 'none',
                        transition: 'all 0.2s',
                        transform: themeColor === color ? 'scale(1.1)' : 'none'
                      }}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sliding Pill Toggle Switch (Sun / Moon) */}
            <div 
              onClick={toggleTheme}
              className="position-relative d-inline-flex align-items-center cursor-pointer rounded-pill"
              style={{
                width: '60px',
                height: '30px',
                backgroundColor: '#1e293b', // Dark Slate
                padding: '2px',
                cursor: 'pointer',
                userSelect: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)',
                border: '1px solid var(--border-color-main)'
              }}
              title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {/* Sliding white circle indicator */}
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  left: (themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? '32px' : '2px',
                  transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 2
                }}
              >
                {(themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? (
                  <span style={{ fontSize: '11px' }}>🌙</span>
                ) : (
                  <span style={{ fontSize: '11px' }}>☀️</span>
                )}
              </div>
              
              {/* Inactive background symbols */}
              <div className="d-flex w-100 justify-content-between align-items-center px-2" style={{ fontSize: '11px', opacity: 0.35, zIndex: 1, color: '#94a3b8' }}>
                <span>☀️</span>
                <span>🌙</span>
              </div>
            </div>

          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Live Statistics Cards Grid */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Stats...</span>
            </div>
          </div>
        ) : (
          <div className="row g-3 mb-4">
            {stats.map((s, idx) => (
              <div key={idx} className="col-sm-6 col-lg-3">
                <div className={`card border-0 border-start border-4 border-${s.color} shadow-sm bg-white p-3 h-100`} style={{ borderRadius: '8px' }}>
                  <small className="text-secondary fw-semibold d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>{s.label}</small>
                  <span className="h2 mb-0 fw-bold text-dark">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Latest Announcements Board Widget */}
        <div className="card border-0 shadow-sm p-4 bg-white mb-4" style={{ borderRadius: '12px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 text-dark fw-bold mb-0">📢 Latest Announcements</h2>
            <Link to="/announcements" className="btn btn-sm btn-outline-primary fw-semibold" style={{ fontSize: '0.8rem' }}>View All Notices</Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-secondary small mb-0">No active notices or announcements at this time.</p>
          ) : (
            <div className="row g-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="col-md-4">
                  <div className="p-3 border rounded bg-light h-100 d-flex flex-column justify-content-between">
                    <div>
                      <span className={`badge mb-2 ${ann.announcement_type === 'GLOBAL' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                        {ann.announcement_type === 'GLOBAL' ? 'Global' : `Course: ${ann.course_code}`}
                      </span>
                      <h3 className="h6 text-dark fw-bold mb-1" style={{ fontSize: '0.85rem' }}>{ann.title}</h3>
                      <p className="text-secondary small mb-0" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        fontSize: '0.8rem'
                      }}>
                        {ann.content}
                      </p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-3" style={{ fontSize: '0.7rem' }}>
                      <span className="text-secondary">By: <strong>{ann.created_by_name}</strong></span>
                      <span className="text-secondary">{new Date(ann.created_at).toLocaleDateString(undefined, { dateStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Charts/Analytics Area */}
        {!loading && chartsData && (
          <div className="row g-3 mb-4">
            {/* ADMIN CHARTS */}
            {user?.role === 'ADMIN' && chartsData.departments && (
              <>
                <div className="col-lg-8">
                  <div className="card border-0 shadow-sm p-4 bg-white h-100" style={{ borderRadius: '8px' }}>
                    <h2 className="h5 text-dark fw-bold mb-3">Student Distribution by Department</h2>
                    <div className="d-flex flex-column gap-3">
                      {chartsData.departments.map((dept, index) => {
                        const maxVal = Math.max(...chartsData.departments.map(d => d.value), 1);
                        const percent = (dept.value / maxVal) * 100;
                        const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger'];
                        const barColor = colors[index % colors.length];
                        return (
                          <div key={index}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-semibold text-secondary small">{dept.label}</span>
                              <span className="badge bg-light text-dark border fw-bold">{dept.value} Students</span>
                            </div>
                            <div className="progress" style={{ height: '10px', borderRadius: '5px' }}>
                              <div 
                                className={`progress-bar ${barColor} progress-bar-striped progress-bar-animated`} 
                                role="progressbar" 
                                style={{ width: `${percent}%`, borderRadius: '5px' }} 
                                aria-valuenow={dept.value} 
                                aria-valuemin="0" 
                                aria-valuemax={maxVal}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="card border-0 shadow-sm p-4 bg-white h-100" style={{ borderRadius: '8px' }}>
                    <h2 className="h5 text-dark fw-bold mb-3">System Information</h2>
                    <ul className="list-group list-group-flush small">
                      <li className="list-group-item d-flex justify-content-between px-0 bg-transparent">
                        <span className="text-secondary">Platform Status</span>
                        <span className="text-success fw-bold">Online & Healthy</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between px-0 bg-transparent">
                        <span className="text-secondary">PWA Capability</span>
                        <span className="text-primary fw-bold">Fully Supported</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between px-0 bg-transparent">
                        <span className="text-secondary">Database Connection</span>
                        <span className="text-success fw-bold">SQLite Live</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between px-0 bg-transparent">
                        <span className="text-secondary">Vite Plugins</span>
                        <span className="text-dark fw-bold">React + VitePWA</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* TEACHER CHARTS */}
            {user?.role === 'TEACHER' && chartsData.courses && (
              <div className="col-12">
                <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '8px' }}>
                  <h2 className="h5 text-dark fw-bold mb-3">Teaching Analytics by Course</h2>
                  {chartsData.courses.length === 0 ? (
                    <p className="text-secondary mb-0">No course data available. Assign teacher profiles using the Course Registry.</p>
                  ) : (
                    <div className="row g-3">
                      {chartsData.courses.map((course, index) => (
                        <div key={index} className="col-md-6 col-lg-4">
                          <div className="p-3 border rounded bg-light h-100">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <span className="badge bg-indigo text-white mb-1" style={{ backgroundColor: '#4f46e5' }}>{course.course_code}</span>
                                <h3 className="h6 text-dark fw-bold mb-0">{course.course_name}</h3>
                              </div>
                            </div>
                            <hr className="my-2" />
                            <div className="mb-2">
                              <div className="d-flex justify-content-between mb-1 small">
                                <span className="text-secondary">Attendance Entries:</span>
                                <span className="fw-bold text-dark">{course.attendance_count}</span>
                              </div>
                              <div className="d-flex justify-content-between small">
                                <span className="text-secondary">Students Graded:</span>
                                <span className="fw-bold text-dark">{course.grade_count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STUDENT CHARTS */}
            {user?.role === 'STUDENT' && chartsData.courses && (
              <div className="col-12">
                <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '8px' }}>
                  <h2 className="h5 text-dark fw-bold mb-3">My Academic Progress & Course Attendance</h2>
                  {chartsData.courses.length === 0 ? (
                    <p className="text-secondary mb-0">No active course enrollments found. Please contact the administrator.</p>
                  ) : (
                    <div className="row g-3">
                      {chartsData.courses.map((course, index) => (
                        <div key={index} className="col-md-6">
                          <div className="p-3 border rounded bg-light h-100 d-flex flex-column justify-content-between">
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex gap-2 align-items-center">
                                  <span className="badge bg-indigo text-white" style={{ backgroundColor: '#4f46e5' }}>{course.course_code}</span>
                                  <span className={`badge px-2 py-1 ${course.assignment_type === 'CURRICULUM' ? 'bg-secondary-subtle text-secondary-emphasis border' : 'bg-primary-subtle text-primary-emphasis border'}`} style={{ fontSize: '0.75rem' }}>
                                    {course.assignment_type === 'CURRICULUM' ? 'Curriculum' : 'Manual'}
                                  </span>
                                </div>
                                <span className={`badge px-2.5 py-1.5 fw-bold ${course.grade !== 'F' && course.grade !== 'N/A' ? 'bg-success' : course.grade === 'N/A' ? 'bg-secondary' : 'bg-danger'}`}>
                                  Grade: {course.grade}
                                </span>
                              </div>
                              <h3 className="h6 text-dark fw-bold mb-2">{course.course_name}</h3>
                            </div>
                            
                            <div className="mt-3">
                              <div className="d-flex justify-content-between align-items-center mb-1 small">
                                <span className="text-secondary">Course Attendance:</span>
                                <span className={`fw-bold ${course.attendance_percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                                  {course.attendance_percentage}%
                                </span>
                              </div>
                              <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                                <div 
                                  className={`progress-bar ${course.attendance_percentage >= 75 ? 'bg-success' : 'bg-danger'}`} 
                                  role="progressbar" 
                                  style={{ width: `${course.attendance_percentage}%`, borderRadius: '4px' }} 
                                  aria-valuenow={course.attendance_percentage} 
                                  aria-valuemin="0" 
                                  aria-valuemax="100"
                                ></div>
                              </div>
                              {course.attendance_percentage < 75 && (
                                <small className="text-danger mt-1 d-block" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                                  ⚠️ Below standard attendance requirement (75%)
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role Description Card Panel */}
        <div className="card border-0 shadow-sm p-4 bg-white mb-4" style={{ borderRadius: '8px' }}>
          <h2 className="h4 text-dark fw-bold mb-2">TaleemPro Operations</h2>
          <p className="text-secondary mb-3">TaleemPro is an installable, mobile-friendly full-stack learning platform. Expand operations using the navigation links below:</p>

          <div className="row g-3">
            {user?.role === 'ADMIN' && (
              <>
                <div className="col-md-6 col-lg-4">
                  <div className="p-3 border rounded h-100 bg-light">
                    <h3 className="h6 text-dark fw-bold mb-2">Manage Roster</h3>
                    <p className="text-secondary small mb-3">Add, edit and manage students and faculty registry files.</p>
                    <div className="d-flex gap-2">
                      <Link to="/students" className="btn btn-outline-primary btn-sm fw-semibold">Students</Link>
                      <Link to="/teachers" className="btn btn-outline-primary btn-sm fw-semibold">Teachers</Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="p-3 border rounded h-100 bg-light">
                    <h3 className="h6 text-dark fw-bold mb-2">Manage Curriculum</h3>
                    <p className="text-secondary small mb-3">Offering and assigning teachers to courses directories.</p>
                    <Link to="/courses" className="btn btn-outline-primary btn-sm fw-semibold">Courses</Link>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="p-3 border rounded h-100 bg-light">
                    <h3 className="h6 text-dark fw-bold mb-2">Smart Enrollment</h3>
                    <p className="text-secondary small mb-3">Manage automated rules and manual course registrations.</p>
                    <div className="d-flex gap-2">
                      <Link to="/courses/enrollments" className="btn btn-outline-primary btn-sm fw-semibold">Enrollments</Link>
                      <Link to="/departments" className="btn btn-outline-primary btn-sm fw-semibold">Departments</Link>
                      <Link to="/semesters" className="btn btn-outline-primary btn-sm fw-semibold">Semesters</Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="p-3 border rounded h-100 bg-light">
                    <h3 className="h6 text-dark fw-bold mb-2">Grades & Reports</h3>
                    <p className="text-secondary small mb-3">View academic performance transcripts and marks.</p>
                    <Link to="/grades" className="btn btn-outline-primary btn-sm fw-semibold">Gradebook</Link>
                  </div>
                </div>
              </>
            )}

            {user?.role === 'TEACHER' && (
              <>
                <div className="col-md-6 col-lg-4">
                  <div className="p-3 border rounded h-100 bg-light">
                    <h3 className="h6 text-dark fw-bold mb-2">Attendance sheets</h3>
                    <p className="text-secondary small mb-3">Mark daily course sheet attendances for students.</p>
                    <Link to="/attendance/mark" className="btn btn-primary btn-sm fw-semibold" style={{ background: '#4f46e5', border: 'none' }}>Mark Attendance</Link>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="p-3 border rounded h-100 bg-light">
                    <h3 className="h6 text-dark fw-bold mb-2">Marks Input</h3>
                    <p className="text-secondary small mb-3">Grade quiz, midterm and final scores for class courses.</p>
                    <Link to="/grades" className="btn btn-outline-primary btn-sm fw-semibold">Enter Grades</Link>
                  </div>
                </div>
              </>
            )}

            {user?.role === 'STUDENT' && (
              <>
                <div className="col-md-6 col-lg-4">
                  <div className="p-3 border rounded h-100 bg-light">
                    <h3 className="h6 text-dark fw-bold mb-2">My Attendance</h3>
                    <p className="text-secondary small mb-3">Review your overall attendance summaries and course averages.</p>
                    <Link to="/attendance/student" className="btn btn-primary btn-sm fw-semibold" style={{ background: '#4f46e5', border: 'none' }}>Check Attendance</Link>
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <div className="p-3 border rounded h-100 bg-light">
                    <h3 className="h6 text-dark fw-bold mb-2">My Transcript</h3>
                    <p className="text-secondary small mb-3">Check grade boundary calculations and cumulative GPA.</p>
                    <Link to="/grades/student" className="btn btn-outline-primary btn-sm fw-semibold">Check GPA</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Styled hover icons and active classes */}
      <style>{`
        .hover-white:hover {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
