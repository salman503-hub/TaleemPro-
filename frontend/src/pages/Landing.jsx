import React from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to TaleemPro</h1>
      <p>A premium full-stack educational and school management platform.</p>
      <div style={{ marginTop: '1.5rem' }}>
        <Link to="/login" style={{ marginRight: '1rem', padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
          Login
        </Link>
        <Link to="/dashboard" style={{ padding: '0.5rem 1rem', background: '#475569', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Landing;
