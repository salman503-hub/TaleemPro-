import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

function Sidebar() {
  const { user, logout } = useAuth();
  const { 
    themeMode, 
    themeColor, 
    textColor, 
    savePreferences 
  } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await api.get('/api/notifications/unread-count/');
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch unread notification count', err);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Fetch unread count on mount
    fetchUnreadCount();
    
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(interval);
    };
  }, [user]);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleTheme = () => {
    let currentMode = themeMode;
    if (themeMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentMode = prefersDark ? 'dark' : 'light';
    }
    const nextMode = currentMode === 'dark' ? 'light' : 'dark';
    savePreferences({ themeMode: nextMode });
  };

  // Color values mapping for rendering circle swatches
  const themeColorsMap = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    red: '#ef4444',
    orange: '#f97316'
  };



  const renderNavLinks = () => {
    const role = user?.role;
    const activeClass = "nav-link py-2 px-3 text-white rounded mb-1 bg-secondary bg-opacity-25 fw-bold";
    const inactiveClass = "nav-link py-2 px-3 text-white-50 hover-white rounded mb-1";

    if (role === 'ADMIN') {
      return (
        <>
          <Link to="/courses" className={(location.pathname.startsWith('/courses') && !location.pathname.includes('enrollments')) ? activeClass : inactiveClass}>Courses Directory</Link>
          <Link to="/curriculum" className={location.pathname.startsWith('/curriculum') ? activeClass : inactiveClass}>Curriculum Builder</Link>
          <Link to="/courses/enrollments" className={location.pathname.startsWith('/courses/enrollments') ? activeClass : inactiveClass}>Enrollment Management</Link>
          <Link to="/students" className={location.pathname.startsWith('/students') ? activeClass : inactiveClass}>Students Directory</Link>
          <Link to="/teachers" className={location.pathname.startsWith('/teachers') ? activeClass : inactiveClass}>Teachers Directory</Link>
          <Link to="/grades" className={location.pathname.startsWith('/grades') ? activeClass : inactiveClass}>Gradebook Directory</Link>
          <Link to="/attendance/report" className={location.pathname.startsWith('/attendance') ? activeClass : inactiveClass}>Attendance Reports</Link>
          <Link to="/departments" className={location.pathname.startsWith('/departments') ? activeClass : inactiveClass}>Departments</Link>
          <Link to="/semesters" className={location.pathname.startsWith('/semesters') ? activeClass : inactiveClass}>Semesters</Link>
          <Link to="/announcements" className={location.pathname.startsWith('/announcements') ? activeClass : inactiveClass}>Notice Board</Link>
          <Link to="/settings/notifications" className={location.pathname.startsWith('/settings/notifications') ? activeClass : inactiveClass}>Notification Settings</Link>
        </>
      );
    } else if (role === 'TEACHER') {
      return (
        <>
          <Link to="/courses" className={(location.pathname.startsWith('/courses') && !location.pathname.includes('enrollments')) ? activeClass : inactiveClass}>My Courses</Link>
          <Link to="/courses/enrollments" className={location.pathname.startsWith('/courses/enrollments') ? activeClass : inactiveClass}>Enrollment Management</Link>
          <Link to="/attendance/mark" className={location.pathname.startsWith('/attendance/mark') ? activeClass : inactiveClass}>Mark Attendance</Link>
          <Link to="/attendance/report" className={location.pathname.startsWith('/attendance/report') ? activeClass : inactiveClass}>Attendance Reports</Link>
          <Link to="/grades" className={location.pathname.startsWith('/grades') ? activeClass : inactiveClass}>Student Gradebook</Link>
          <Link to="/announcements" className={location.pathname.startsWith('/announcements') ? activeClass : inactiveClass}>Notice Board</Link>
        </>
      );
    } else if (role === 'STUDENT') {
      return (
        <>
          <Link to="/courses" className={location.pathname.startsWith('/courses') ? activeClass : inactiveClass}>Explore Courses</Link>
          <Link to="/attendance/student" className={location.pathname.startsWith('/attendance') ? activeClass : inactiveClass}>My Attendance Summary</Link>
          <Link to="/grades/student" className={location.pathname.startsWith('/grades') ? activeClass : inactiveClass}>My Academic Transcript</Link>
          <Link to="/announcements" className={location.pathname.startsWith('/announcements') ? activeClass : inactiveClass}>Notice Board</Link>
        </>
      );
    }
    return null;
  };

  return (
    <>
      {/* Mobile Toggle Navbar Header */}
      <header className="navbar navbar-dark bg-dark d-md-none px-3 w-100 sticky-top">
        <span className="navbar-brand mb-0 h1 fw-bold text-white">TaleemPro</span>
        <button onClick={toggleSidebar} className="navbar-toggler border-0" type="button" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
      </header>

      {/* Sidebar Navigation Panel */}
      <aside 
        className={`bg-dark text-white p-3 flex-shrink-0 d-md-flex flex-column ${isSidebarOpen ? 'd-flex w-100 vh-100 position-fixed z-3 top-0 start-0' : 'd-none d-md-flex'}`} 
        style={{ width: '260px', borderRight: '1px solid #2d3748', transition: 'width 0.3s', zIndex: 1050 }}
      >
        {/* Mobile close button inside overlay */}
        {isSidebarOpen && (
          <div className="d-flex justify-content-end d-md-none mb-3">
            <button onClick={toggleSidebar} className="btn btn-sm btn-outline-light border-0" type="button" style={{ fontSize: '1.2rem' }}>
              &times; Close
            </button>
          </div>
        )}

        <div className="mb-4 d-none d-md-block">
          <h2 className="h4 text-white fw-bold m-0 py-2">TaleemPro Portal</h2>
        </div>

        {/* User Card Profile */}
        {user && (
          <div className="p-3 bg-secondary bg-opacity-25 rounded mb-4">
            <span className="d-block fw-semibold text-white-50" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>SIGNED IN AS</span>
            <span className="d-block text-white fw-bold" style={{ fontSize: '1.05rem' }}>{user.username}</span>
            <span className="badge bg-primary mt-2 px-2.5 py-1.5 fw-bold" style={{ fontSize: '0.75rem' }}>{user.role}</span>
          </div>
        )}

        <nav className="nav flex-column mb-auto">
          <Link 
            to="/dashboard" 
            className={location.pathname === '/dashboard' ? "nav-link py-2 px-3 text-white rounded mb-1 bg-secondary bg-opacity-25 fw-bold" : "nav-link py-2 px-3 text-white-50 hover-white rounded mb-1"}
            onClick={() => setIsSidebarOpen(false)}
          >
            Dashboard Home
          </Link>
          <Link 
            to="/notifications" 
            className={location.pathname === '/notifications' ? "nav-link py-2 px-3 text-white rounded mb-1 bg-secondary bg-opacity-25 fw-bold" : "nav-link py-2 px-3 text-white-50 hover-white rounded mb-1"}
            onClick={() => { setIsSidebarOpen(false); }}
          >
            <span className="d-flex align-items-center justify-content-between w-100">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="badge bg-danger rounded-pill fw-bold" style={{ fontSize: '0.72rem', padding: '0.25em 0.6em' }}>
                  {unreadCount}
                </span>
              )}
            </span>
          </Link>
          {renderNavLinks()}
        </nav>



        {/* PWA App Installer Button */}
        {isInstallable && (
          <button 
            onClick={handleInstallApp}
            className="btn btn-warning w-100 py-2 fw-bold mb-2 shadow-sm"
            style={{ fontSize: '0.9rem', borderRadius: '6px' }}
          >
            📥 Install Portal App
          </button>
        )}

        <button 
          onClick={logout} 
          className="btn btn-danger w-100 py-2 fw-semibold mt-2"
          style={{ borderRadius: '6px' }}
        >
          Sign Out
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
