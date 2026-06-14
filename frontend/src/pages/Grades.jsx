import React from 'react';
import { Link } from 'react-router-dom';

function Grades() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Academic Report Cards</h1>
      <p>Summary of current academic term grades and results.</p>
      
      <div style={{ margin: '1rem 0' }}>
        <Link to="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none' }}>&larr; Back to Dashboard</Link>
      </div>

      <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.5rem' }}>Subject</th>
              <th style={{ padding: '0.5rem' }}>Grade</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
              <td style={{ padding: '0.5rem' }}>Django Web Services</td>
              <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>A+</td>
              <td style={{ padding: '0.5rem', color: '#10b981' }}>Passed</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
              <td style={{ padding: '0.5rem' }}>React client & SPA</td>
              <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>A</td>
              <td style={{ padding: '0.5rem', color: '#10b981' }}>Passed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Grades;
