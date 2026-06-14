import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function CourseList() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses(1, searchTerm);
    fetchTeachers();
  }, []);

  const fetchCourses = async (page, searchVal) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/courses/', {
        params: {
          page: page,
          search: searchVal
        }
      });
      setCourses(response.data.results);
      const pageSize = 5;
      setTotalPages(Math.ceil(response.data.count / pageSize) || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      // Get all teachers by setting page_size parameter to 100
      const response = await api.get('/api/teachers/', { params: { page_size: 100 } });
      setTeachers(response.data.results || []);
    } catch (err) {
      console.error('Failed to load teachers for dropdown', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchCourses(1, '');
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete course "${name}"?`)) {
      try {
        await api.delete(`/api/courses/${id}/`);
        const isLastItemOnPage = courses.length === 1;
        const targetPage = isLastItemOnPage && currentPage > 1 ? currentPage - 1 : currentPage;
        fetchCourses(targetPage, searchTerm);
      } catch (err) {
        console.error(err);
        alert('Failed to delete course.');
      }
    }
  };

  const handleDeleteTeacher = async (teacherId, name) => {
    if (window.confirm(`Are you sure you want to delete teacher "${name}"? This will unassign them from all courses.`)) {
      try {
        await api.delete(`/api/teachers/${teacherId}/`);
        // Refresh courses and teachers list
        fetchCourses(currentPage, searchTerm);
        fetchTeachers();
      } catch (err) {
        console.error(err);
        alert('Failed to delete teacher.');
      }
    }
  };

  const handleAssignTeacher = async (courseId, teacherId) => {
    try {
      const val = teacherId === "" ? null : parseInt(teacherId);
      await api.patch(`/api/courses/${courseId}/`, { teacher: val });
      // Refresh current page
      fetchCourses(currentPage, searchTerm);
    } catch (err) {
      console.error('Failed to assign teacher', err);
      alert('Failed to update teacher assignment.');
    }
  };

  return (
    <div className="container py-4" style={{ textAlign: 'left' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/dashboard" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Dashboard</Link>
          <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Courses Directory</h1>
          <p className="text-secondary mb-0">Browse subjects, manage credit hours, and assign faculty teachers.</p>
        </div>
        <div className="d-flex gap-2">
          <Link 
            to="/teachers" 
            className="btn btn-outline-secondary px-3 py-2 fw-semibold"
            style={{ borderRadius: '6px' }}
          >
            Manage Teachers
          </Link>
          <Link 
            to="/teachers/add" 
            className="btn btn-outline-primary px-3 py-2 fw-semibold"
            style={{ borderRadius: '6px' }}
          >
            + Add Teacher
          </Link>
          <Link 
            to="/courses/add" 
            className="btn btn-primary px-3 py-2 fw-semibold"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)' }}
          >
            + Add Course
          </Link>
        </div>
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
            placeholder="Search by Course Code, Course Name or Assigned Teacher..." 
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
            <p className="mb-0">Fetching course records...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="card-body py-5 text-center text-secondary">
            <h4 className="h5 text-dark fw-semibold mb-2">No Courses Found</h4>
            <p className="mb-0">No course records match your criteria. Try adding one or changing your search terms.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
              <thead className="table-light text-secondary">
                <tr>
                  <th className="py-3 px-4 fw-semibold">Course Code</th>
                  <th className="py-3 px-4 fw-semibold">Course Name</th>
                  <th className="py-3 px-4 fw-semibold text-center">Credit Hours</th>
                  <th className="py-3 px-4 fw-semibold">Assigned Teacher</th>
                  <th className="py-3 px-4 fw-semibold text-center" style={{ width: '220px' }}>Assign / Change Teacher</th>
                  <th className="py-3 px-4 fw-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td className="py-3 px-4 fw-bold text-dark">{course.course_code}</td>
                    <td className="py-3 px-4 text-dark fw-semibold">{course.course_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="badge bg-secondary-subtle text-secondary-emphasis px-2.5 py-1.5 fw-semibold" style={{ fontSize: '0.85rem' }}>
                        {course.credit_hours} Cr. Hrs
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {course.teacher_details ? (
                        <div>
                          <div className="fw-semibold text-dark">{course.teacher_details.name}</div>
                          <small className="text-secondary">{course.teacher_details.designation} ({course.teacher_details.department})</small>
                          
                          {/* Inline Edit / Delete Teacher Actions */}
                          <div className="d-flex gap-2 mt-1" style={{ fontSize: '0.8rem' }}>
                            <Link to={`/teachers/edit/${course.teacher}`} className="text-warning-emphasis text-decoration-none fw-semibold">Edit Teacher</Link>
                            <span className="text-secondary">|</span>
                            <button 
                              onClick={() => handleDeleteTeacher(course.teacher, course.teacher_details.name)} 
                              className="btn btn-link p-0 text-danger text-decoration-none fw-semibold" 
                              style={{ fontSize: '0.8rem', border: 'none', background: 'none', verticalAlign: 'baseline' }}
                            >
                              Delete Teacher
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-danger-emphasis bg-danger-subtle px-2 py-1 rounded fw-semibold" style={{ fontSize: '0.8rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select 
                        value={course.teacher || ''} 
                        onChange={(e) => handleAssignTeacher(course.id, e.target.value)}
                        className="form-select form-select-sm"
                        style={{ fontSize: '0.85rem' }}
                      >
                        <option value="">-- Unassigned --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => handleDelete(course.id, course.course_name)}
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
                onClick={() => fetchCourses(currentPage - 1, searchTerm)}
                className="page-link rounded"
              >
                &larr; Prev
              </button>
            </li>
            
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
              <li key={pg} className={`page-item ${currentPage === pg ? 'active' : ''}`}>
                <button
                  onClick={() => fetchCourses(pg, searchTerm)}
                  className="page-link rounded"
                  style={currentPage === pg ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
                >
                  {pg}
                </button>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                onClick={() => fetchCourses(currentPage + 1, searchTerm)}
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

export default CourseList;
