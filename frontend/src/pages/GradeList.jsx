import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function GradeList() {
  const [grades, setGrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrades(1, searchTerm);
  }, []);

  const fetchGrades = async (page, searchVal) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/grades/', {
        params: {
          page: page,
          search: searchVal
        }
      });
      setGrades(response.data.results || []);
      const pageSize = 5;
      setTotalPages(Math.ceil(response.data.count / pageSize) || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
      setError('Failed to load grades database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGrades(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchGrades(1, '');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this grade record?')) {
      try {
        await api.delete(`/api/grades/${id}/`);
        const isLastItemOnPage = grades.length === 1;
        const targetPage = isLastItemOnPage && currentPage > 1 ? currentPage - 1 : currentPage;
        fetchGrades(targetPage, searchTerm);
      } catch (err) {
        console.error(err);
        alert('Failed to delete grade record.');
      }
    }
  };

  const getGradeBadgeClass = (letterGrade) => {
    switch(letterGrade) {
      case 'A+': return 'bg-success text-success-emphasis';
      case 'A':  return 'bg-success-subtle text-success-emphasis';
      case 'B':  return 'bg-primary-subtle text-primary-emphasis';
      case 'C':  return 'bg-info-subtle text-info-emphasis';
      case 'D':  return 'bg-warning-subtle text-warning-emphasis';
      case 'F':  return 'bg-danger-subtle text-danger-emphasis';
      default:   return 'bg-secondary-subtle text-secondary-emphasis';
    }
  };

  return (
    <div className="container py-4" style={{ textAlign: 'left' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/dashboard" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Dashboard</Link>
          <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Academic Gradebook</h1>
          <p className="text-secondary mb-0">Record and compile student marks, quizzes, midterm results and final letter grades.</p>
        </div>
        <Link 
          to="/grades/enter" 
          className="btn btn-primary px-4 py-2 fw-semibold"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)' }}
        >
          + Enter Student Marks
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
            placeholder="Search by Student Name, Roll No, Course Code or Course Name..." 
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
            <p className="mb-0">Fetching gradebook logs...</p>
          </div>
        ) : grades.length === 0 ? (
          <div className="card-body py-5 text-center text-secondary">
            <h4 className="h5 text-dark fw-semibold mb-2">No Grade Records Found</h4>
            <p className="mb-0">No academic grades exist in the database yet. Click "Enter Student Marks" to register a score.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
              <thead className="table-light text-secondary">
                <tr>
                  <th className="py-3 px-4 fw-semibold">Roll No</th>
                  <th className="py-3 px-4 fw-semibold">Student</th>
                  <th className="py-3 px-4 fw-semibold">Course</th>
                  <th className="py-3 px-4 fw-semibold text-center">Quiz (20)</th>
                  <th className="py-3 px-4 fw-semibold text-center">Mid (30)</th>
                  <th className="py-3 px-4 fw-semibold text-center">Final (50)</th>
                  <th className="py-3 px-4 fw-semibold text-center">Total (100)</th>
                  <th className="py-3 px-4 fw-semibold text-center">Grade</th>
                  <th className="py-3 px-4 fw-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 px-4 fw-bold text-dark">{row.student_details?.roll_no}</td>
                    <td className="py-3 px-4 text-dark fw-semibold">{row.student_details?.name}</td>
                    <td className="py-3 px-4">
                      <div className="fw-semibold text-dark">{row.course_details?.course_name}</div>
                      <small className="text-secondary">{row.course_details?.course_code}</small>
                    </td>
                    <td className="py-3 px-4 text-center text-muted fw-semibold">{row.quiz_marks}</td>
                    <td className="py-3 px-4 text-center text-muted fw-semibold">{row.mid_marks}</td>
                    <td className="py-3 px-4 text-center text-muted fw-semibold">{row.final_marks}</td>
                    <td className="py-3 px-4 text-center text-dark fw-bold">{row.total_marks}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`badge px-2.5 py-1.5 fw-bold ${getGradeBadgeClass(row.grade)}`} style={{ fontSize: '0.85rem' }}>
                        {row.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => handleDelete(row.id)}
                        className="btn btn-danger btn-sm fw-semibold"
                      >
                        Delete
                      </button>
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
                onClick={() => fetchGrades(currentPage - 1, searchTerm)}
                className="page-link rounded"
              >
                &larr; Prev
              </button>
            </li>
            
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
              <li key={pg} className={`page-item ${currentPage === pg ? 'active' : ''}`}>
                <button
                  onClick={() => fetchGrades(pg, searchTerm)}
                  className="page-link rounded"
                  style={currentPage === pg ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
                >
                  {pg}
                </button>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                onClick={() => fetchGrades(currentPage + 1, searchTerm)}
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

export default GradeList;
