import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist on TaleemPro.</p>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
