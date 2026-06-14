import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // Share the stylesheet

function Register() {
  // Sync state with URL hash (#turnon)
  const [isLightOn, setIsLightOn] = useState(window.location.hash === '#turnon');
  const [isPulling, setIsPulling] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Listen for hash changes
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
    setTimeout(() => {
      setIsPulling(false);
      const nextState = !isLightOn;
      setIsLightOn(nextState);
      window.location.hash = nextState ? 'turnon' : '';
    }, 150);
  };

  const handleClose = (e) => {
    e.preventDefault();
    setIsLightOn(false);
    window.location.hash = '';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg('');

    if (password !== passwordConfirm) {
      setErrors({ password: 'Passwords do not match.' });
      return;
    }

    setLoading(true);

    const payload = {
      username,
      email,
      phone_number: phoneNumber,
      role,
      password,
      password_confirm: passwordConfirm,
    };

    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Success! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1800);
    } else {
      setErrors(res.error || { detail: 'Registration failed.' });
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
        
        {/* Lamp Shade */}
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

        {/* Floating helper label when lamp is off */}
        <div className="floating-helper-label">
          💡 Click lamp or pull string
        </div>

        {/* Glowing light cone */}
        <div className="light-cone" />
      </div>

      {/* Glassmorphic Register Form Area */}
      <div className="login-form-container" style={{ maxWidth: '420px' }}>
        
        {/* Close Button */}
        <a href="#" className="form-close-btn" onClick={handleClose} title="Turn off light">
          ✕
        </a>

        <div className="login-form-title">
          <h2>Create Account</h2>
          <p>Join TaleemPro learning system</p>
        </div>

        {successMsg && (
          <div style={{ 
            padding: '0.6rem', 
            background: 'rgba(16, 185, 129, 0.2)', 
            border: '1px solid rgba(16, 185, 129, 0.3)', 
            color: '#a7f3d0', 
            borderRadius: '6px', 
            marginBottom: '1rem', 
            textAlign: 'center', 
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            {successMsg}
          </div>
        )}

        {errors.detail && (
          <div style={{ 
            padding: '0.6rem', 
            background: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#fca5a5', 
            borderRadius: '6px', 
            marginBottom: '1rem', 
            textAlign: 'center', 
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            {errors.detail}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* Row 1: Username & Email */}
          <div className="glass-input-row">
            <div className="glass-input-group">
              <label className="glass-input-label">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="glass-input-field"
                placeholder="Username"
                required
                disabled={loading}
              />
              {errors.username && <span style={{ color: '#fca5a5', fontSize: '0.7rem' }}>{errors.username[0]}</span>}
            </div>

            <div className="glass-input-group">
              <label className="glass-input-label">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="glass-input-field"
                placeholder="email@example.com"
                disabled={loading}
              />
              {errors.email && <span style={{ color: '#fca5a5', fontSize: '0.7rem' }}>{errors.email[0]}</span>}
            </div>
          </div>

          {/* Row 2: Phone & Role */}
          <div className="glass-input-row">
            <div className="glass-input-group">
              <label className="glass-input-label">Phone Number</label>
              <input 
                type="text" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                className="glass-input-field"
                placeholder="+123456789"
                disabled={loading}
              />
              {errors.phone_number && <span style={{ color: '#fca5a5', fontSize: '0.7rem' }}>{errors.phone_number[0]}</span>}
            </div>

            <div className="glass-input-group">
              <label className="glass-input-label">Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="glass-input-field"
                disabled={loading}
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
              </select>
            </div>
          </div>

          {/* Row 3: Password & Confirm Password */}
          <div className="glass-input-row">
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
              {errors.password && <span style={{ color: '#fca5a5', fontSize: '0.7rem' }}>{errors.password[0] || errors.password}</span>}
            </div>

            <div className="glass-input-group">
              <label className="glass-input-label">Confirm Password</label>
              <input 
                type="password" 
                value={passwordConfirm} 
                onChange={(e) => setPasswordConfirm(e.target.value)} 
                className="glass-input-field"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="glass-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="glass-register-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
