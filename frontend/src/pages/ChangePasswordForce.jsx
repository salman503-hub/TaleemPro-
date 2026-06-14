import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ChangePasswordForce() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateMustChangePassword, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/accounts/change-password-force/', {
        new_password: newPassword
      });
      setSuccessMsg('Password updated successfully! Redirecting...');
      setTimeout(() => {
        updateMustChangePassword(false);
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: '#ffffff',
        padding: '2.5rem',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(170, 59, 255, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(170, 59, 255, 0.1)',
            color: '#aa3bff',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            🔒
          </div>
          <h2 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.75rem',
            color: '#1e1b4b',
            fontWeight: '700'
          }}>Security Update Required</h2>
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontSize: '0.95rem',
            lineHeight: '1.5'
          }}>
            This is your first login. Please choose a strong, secure password to activate your account.
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '1rem',
            background: '#fef2f2',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            border: '1px solid #fee2e2'
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '1rem',
            background: '#f0fdf4',
            color: '#166534',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            border: '1px solid #dcfce7'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.9rem'
            }}>New Password</label>
            <input 
              type="password" 
              placeholder="Min. 8 characters"
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.9rem'
            }}>Confirm New Password</label>
            <input 
              type="password" 
              placeholder="Confirm your password"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#aa3bff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(170, 59, 255, 0.4)',
              transition: 'background-color 0.2s, transform 0.1s',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Updating Password...' : 'Save & Continue'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button 
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordForce;
