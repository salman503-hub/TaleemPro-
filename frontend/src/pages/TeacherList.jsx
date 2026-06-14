import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeachers(1, searchTerm);
  }, []);

  const fetchTeachers = async (page, searchVal) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/teachers/', {
        params: {
          page: page,
          search: searchVal
        }
      });
      setTeachers(response.data.results);
      // Determine total pages. Since page size is 5 in backend pagination
      const pageSize = 5;
      setTotalPages(Math.ceil(response.data.count / pageSize) || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
      setError('Failed to load teachers directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTeachers(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchTeachers(1, '');
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete teacher "${name}"?`)) {
      try {
        await api.delete(`/api/teachers/${id}/`);
        const isLastItemOnPage = teachers.length === 1;
        const targetPage = isLastItemOnPage && currentPage > 1 ? currentPage - 1 : currentPage;
        fetchTeachers(targetPage, searchTerm);
      } catch (err) {
        console.error(err);
        alert('Failed to delete teacher.');
      }
    }
  };

  const handleToggleActive = async (id, name, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} the user account for "${name}"?`)) {
      try {
        await api.post(`/api/teachers/${id}/toggle_active/`);
        fetchTeachers(currentPage, searchTerm);
      } catch (err) {
        console.error(err);
        alert('Failed to update account status.');
      }
    }
  };

  return (
    <div className="container py-4" style={{ textAlign: 'left' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/dashboard" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Dashboard</Link>
          <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Teachers Directory</h1>
          <p className="text-secondary mb-0">Manage faculty records, designations, departments and contact details.</p>
        </div>
        <Link 
          to="/teachers/add" 
          className="btn btn-primary px-4 py-2 fw-semibold"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)' }}
        >
          + Add New Teacher
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Search by Name, Email, Department or Designation..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control py-2"
            style={{ borderRadius: '6px 0 0 6px' }}
          />
          <button 
            type="submit" 
            className="btn btn-primary px-4"
          >
            Search
          </button>
          {searchTerm && (
            <button 
              type="button" 
              onClick={handleClearSearch}
              className="btn btn-outline-secondary"
              style={{ borderRadius: '0 6px 6px 0' }}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* List Container */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div className="card-body py-5 text-center text-secondary">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mb-0">Fetching faculty records...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="card-body py-5 text-center text-secondary">
            <h4 className="h5 text-dark fw-semibold mb-2">No Teachers Found</h4>
            <p className="mb-0">No faculty records match your criteria. Try adding one or changing your search terms.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
              <thead className="table-light text-secondary">
                <tr>
                  <th className="py-3 px-4 fw-semibold">Name</th>
                  <th className="py-3 px-4 fw-semibold">Email</th>
                  <th className="py-3 px-4 fw-semibold">Phone</th>
                  <th className="py-3 px-4 fw-semibold">Department</th>
                  <th className="py-3 px-4 fw-semibold">Designation</th>
                  <th className="py-3 px-4 fw-semibold text-center">Account Status</th>
                  <th className="py-3 px-4 fw-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="py-3 px-4 fw-semibold text-dark">{teacher.name}</td>
                    <td className="py-3 px-4 text-muted">{teacher.email}</td>
                    <td className="py-3 px-4 text-muted">{teacher.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="badge bg-primary-subtle text-primary-emphasis px-2 py-1.5 fw-semibold" style={{ fontSize: '0.8rem' }}>
                        {teacher.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-dark fw-medium">{teacher.designation}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`badge px-2 py-1.5 fw-semibold me-2 ${teacher.is_active ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`} style={{ fontSize: '0.8rem' }}>
                        {teacher.is_active ? 'Active' : 'Deactivated'}
                      </span>
                      <button
                        onClick={() => handleToggleActive(teacher.id, teacher.name, teacher.is_active)}
                        className="btn btn-xs btn-outline-secondary py-1 px-2"
                        style={{ fontSize: '0.75rem', fontWeight: '500' }}
                      >
                        Toggle
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          onClick={() => navigate(`/teachers/edit/${teacher.id}`)}
                          className="btn btn-warning btn-sm fw-semibold text-dark"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(teacher.id, teacher.name)}
                          className="btn btn-danger btn-sm fw-semibold"
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
        <nav className="d-flex justify-content-center mt-4">
          <ul className="pagination gap-1">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                onClick={() => fetchTeachers(currentPage - 1, searchTerm)}
                className="page-link rounded"
              >
                &larr; Prev
              </button>
            </li>
            
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
              <li key={pg} className={`page-item ${currentPage === pg ? 'active' : ''}`}>
                <button
                  onClick={() => fetchTeachers(pg, searchTerm)}
                  className="page-link rounded"
                  style={currentPage === pg ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
                >
                  {pg}
                </button>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                onClick={() => fetchTeachers(currentPage + 1, searchTerm)}
                className="page-link rounded"
              >
                Next &rarr;
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default TeacherList;
