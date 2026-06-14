import React from 'react';
import { Link } from 'react-router-dom';

function Courses() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Courses Catalog</h1>
      <p>Explore all available training modules and classes.</p>
      
      <div style={{ margin: '1rem 0' }}>
        <Link to="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none' }}>&larr; Back to Dashboard</Link>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <li style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <h4>Intro to Django REST Framework</h4>
          <p>Learn core API architecture design.</p>
        </li>
        <li style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <h4>React for Beginners (Vite setup)</h4>
          <p>Master components, state management, routing, and hooks.</p>
        </li>
        <li style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <h4>PWA Support and Services</h4>
          <p>Convert static react configurations to installable mobile applications.</p>
        </li>
      </ul>
    </div>
  );
}

export default Courses;
