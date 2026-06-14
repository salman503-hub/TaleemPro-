import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents(1, searchTerm);
  }, []);

  const fetchStudents = async (page, searchVal) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/students/', {
        params: {
          page: page,
          search: searchVal
        }
      });
      setStudents(response.data.results);
      // Determine total pages. Since page size is 5 in backend pagination
      const pageSize = 5;
      setTotalPages(Math.ceil(response.data.count / pageSize) || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
      setError('Failed to load students directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchStudents(1, '');
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete student "${name}"?`)) {
      try {
        await api.delete(`/api/students/${id}/`);
        // Refresh current page or go back to page 1 if current page becomes empty
        const isLastItemOnPage = students.length === 1;
        const targetPage = isLastItemOnPage && currentPage > 1 ? currentPage - 1 : currentPage;
        fetchStudents(targetPage, searchTerm);
      } catch (err) {
        console.error(err);
        alert('Failed to delete student.');
      }
    }
  };

  const handleToggleActive = async (id, name, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} the user account for "${name}"?`)) {
      try {
        await api.post(`/api/students/${id}/toggle_active/`);
        fetchStudents(currentPage, searchTerm);
      } catch (err) {
        console.error(err);
        alert('Failed to update account status.');
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Link to="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>&larr; Back to Dashboard</Link>
          <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '2.25rem', color: '#1e293b' }}>Students Directory</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Manage student registry records, search and update profiles.</p>
        </div>
        <Link 
          to="/students/add" 
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
            color: '#fff', 
            textDecoration: 'none', 
            borderRadius: '6px', 
            fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          + Add New Student
        </Link>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Search by Roll No, Name, Email or Department..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            flexGrow: 1, 
            padding: '0.75rem 1rem', 
            borderRadius: '6px', 
            border: '1px solid #cbd5e1', 
            fontSize: '1rem',
            outline: 'none',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
          }}
        />
        <button 
          type="submit" 
          style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
        >
          Search
        </button>
        {searchTerm && (
          <button 
            type="button" 
            onClick={handleClearSearch}
            style={{ padding: '0.75rem 1.25rem', background: '#cbd5e1', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            Clear
          </button>
        )}
      </form>

      {/* List Container */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
            <p>Fetching student records...</p>
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No Students Found</h3>
            <p>No student records match your request. Try adding one or changing your search criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Roll No</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Phone</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Department</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Semester</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Account Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1rem', fontWeight: '600', color: '#1e293b' }}>{student.roll_no}</td>
                    <td style={{ padding: '1rem', color: '#334155' }}>{student.name}</td>
                    <td style={{ padding: '1rem', color: '#334155' }}>{student.email}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{student.phone || '-'}</td>
                    <td style={{ padding: '1rem', color: '#334155' }}><span style={{ padding: '0.25rem 0.5rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>{student.department}</span></td>
                    <td style={{ padding: '1rem', color: '#334155' }}>{student.semester}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem', 
                        fontWeight: '600',
                        backgroundColor: student.is_active ? '#d1fae5' : '#fee2e2',
                        color: student.is_active ? '#065f46' : '#991b1b',
                        marginRight: '0.5rem'
                      }}>
                        {student.is_active ? 'Active' : 'Deactivated'}
                      </span>
                      <button
                        onClick={() => handleToggleActive(student.id, student.name, student.is_active)}
                        className="btn btn-sm btn-outline-secondary"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', fontWeight: '500' }}
                      >
                        Toggle
                      </button>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button 
                          onClick={() => navigate(`/students/edit/${student.id}`)}
                          style={{ padding: '0.4rem 0.8rem', background: '#fbbf24', color: '#78350f', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, student.name)}
                          style={{ padding: '0.4rem 0.8rem', background: '#f87171', color: '#7f1d1d', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => fetchStudents(currentPage - 1, searchTerm)}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#fff', 
              border: '1px solid #cbd5e1', 
              borderRadius: '4px', 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              fontWeight: '500'
            }}
          >
            &larr; Prev
          </button>
          
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => fetchStudents(pg, searchTerm)}
              style={{
                padding: '0.5rem 0.85rem',
                background: currentPage === pg ? '#4f46e5' : '#fff',
                color: currentPage === pg ? '#fff' : '#1e293b',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: currentPage === pg ? 'bold' : 'normal'
              }}
            >
              {pg}
            </button>
          ))}

          <button 
            disabled={currentPage === totalPages}
            onClick={() => fetchStudents(currentPage + 1, searchTerm)}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#fff', 
              border: '1px solid #cbd5e1', 
              borderRadius: '4px', 
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
              fontWeight: '500'
            }}
          >
            Next &rarr;
          </button>
        </div>
      )}

      {/* Add spin animation locally for loader */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default StudentList;
