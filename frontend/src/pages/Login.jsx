import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  // Sync state with URL hash (#turnon)
  const [isLightOn, setIsLightOn] = useState(window.location.hash === '#turnon');
  const [isPulling, setIsPulling] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Listen for hash changes to support browser back/forward and anchor clicks
  useEffect(() => {
    const handleHashChange = () => {
      setIsLightOn(window.location.hash === '#turnon');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handlePullChain = (e) => {
    e.preventDefault();
    setIsPulling(true);
    
    // Simulate chain pull snap-back
    setTimeout(() => {
      setIsPulling(false);
      const nextState = !isLightOn;
      setIsLightOn(nextState);
      // Update the URL hash to reflect the interaction state
      window.location.hash = nextState ? 'turnon' : '';
    }, 150);
  };

  const handleClose = (e) => {
    e.preventDefault();
    setIsLightOn(false);
    window.location.hash = '';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }
    
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div id="turnon" className={`login-page-wrapper ${isLightOn ? 'is-on' : ''}`}>
      
      {/* Header Info */}
      <div className="login-header-logo">
        <div className="login-icon-badge">
          <svg className="logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10l-10-5-10 5 10 5z" />
            <path d="M6 12.5V16c0 2 2 3 6 3s6-1 6-3v-3.5" />
            <line x1="12" y1="22" x2="12" y2="15" />
          </svg>
        </div>
        <h1>TaleemPro</h1>
        <p>Interactive Academic Command Center</p>
      </div>

      {/* Lamp and Switch Assembly */}
      <div className="lamp-assembly">
        {/* Cord */}
        <div className="lamp-cord" />
        
        {/* Lamp Shade - clicking it also toggles the light */}
        <div className="lamp-shade" onClick={handlePullChain} title="Toggle Lamp" />
        
        {/* Bulb */}
        <div className="lamp-bulb" />

        {/* Pull Chain Switch */}
        <a 
          href={isLightOn ? '#' : '#turnon'} 
          className={`pull-chain-container ${isPulling ? 'pulling' : ''}`}
          onClick={handlePullChain}
          title="Pull Switch"
        >
          <div className="pull-chain-wire" />
          <div className="pull-chain-handle" />
        </a>

        {/* Floating guide label when lamp is off */}
        <div className="floating-helper-label">
          💡 Click lamp or pull string
        </div>

        {/* Glowing light cone */}
        <div className="light-cone" />
      </div>

      {/* Glassmorphic Login Form Area */}
      <div className="login-form-container">
        
        {/* Close Switch Button */}
        <a href="#" className="form-close-btn" onClick={handleClose} title="Turn off light">
          ✕
        </a>

        <div className="login-form-title">
          <h2>Sign In</h2>
          <p>Please enter your portal credentials</p>
        </div>

        {errorMsg && (
          <div style={{ 
            padding: '0.75rem', 
            background: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#fca5a5', 
            borderRadius: '6px', 
            marginBottom: '1.25rem', 
            textAlign: 'center', 
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="glass-input-group">
            <label className="glass-input-label">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="glass-input-field"
              placeholder="e.g. admin"
              required
              disabled={loading}
            />
          </div>

          <div className="glass-input-group">
            <label className="glass-input-label">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="glass-input-field"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="glass-submit-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="glass-register-link">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
