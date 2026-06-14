import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function StudentResultView() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [resultSummary, setResultSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students/', { params: { page_size: 100 } });
      const studentList = response.data.results || [];
      setStudents(studentList);
      
      if (studentList.length > 0) {
        setSelectedStudent(studentList[0].id);
        fetchResults(studentList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResults = async (studentId) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/grades/student-results/', {
        params: { student: studentId }
      });
      setResultSummary(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load student result card.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (e) => {
    const id = e.target.value;
    setSelectedStudent(id);
    if (id) {
      fetchResults(id);
    } else {
      setResultSummary(null);
    }
  };

  const getGradeBadgeClass = (letterGrade) => {
    switch(letterGrade) {
      case 'A+': return 'bg-success text-success-emphasis';
      case 'A':  return 'bg-success-subtle text-success-emphasis';
      case 'B':  return 'bg-primary-subtle text-primary-emphasis';
      case 'C':  return 'bg-info-subtle text-info-emphasis';
      case 'D':  return 'bg-warning-subtle text-warning-emphasis';
      case 'F':  return 'bg-danger text-danger-emphasis';
      default:   return 'bg-secondary-subtle text-secondary-emphasis';
    }
  };

  return (
    <div className="container py-4" style={{ textAlign: 'left' }}>
      <div className="mb-4">
        <Link to="/dashboard" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Dashboard</Link>
        <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Student Result Dashboard</h1>
        <p className="text-secondary mb-0">Compute student Grade Point Average (GPA), credits earned, and view full transcript cards.</p>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Select Student Selector card */}
      <div className="card border shadow-sm p-4 mb-4" style={{ borderRadius: '8px', background: '#fff' }}>
        <div className="row">
          <div className="col-md-12">
            <label className="form-label fw-semibold text-secondary">Select Student Profile *</label>
            <select 
              value={selectedStudent} 
              onChange={handleStudentChange}
              className="form-select form-select-lg"
              required
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.roll_no} - {s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedStudent && resultSummary && !loading && (
        <div>
          {/* Transcript KPI summary cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border shadow-sm text-center py-4 bg-white" style={{ borderRadius: '8px' }}>
                <small className="text-secondary fw-semibold d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Grade Point Average (GPA)</small>
                <span className={`h1 mb-0 fw-bold ${resultSummary.gpa >= 3.0 ? 'text-success' : resultSummary.gpa >= 2.0 ? 'text-primary' : 'text-danger'}`}>
                  {resultSummary.gpa} / 4.0
                </span>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border shadow-sm text-center py-4 bg-white" style={{ borderRadius: '8px' }}>
                <small className="text-secondary fw-semibold d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Credits Earned Status</small>
                <span className="h1 mb-0 fw-bold text-dark">{resultSummary.earned_credits} <small className="text-secondary h5" style={{ fontWeight: 'normal' }}>/ {resultSummary.total_credits} Hrs</small></span>
                <div className="px-4 mt-2">
                  <div className="progress" style={{ height: '6px' }}>
                    <div 
                      className="progress-bar bg-primary" 
                      role="progressbar" 
                      style={{ width: `${resultSummary.total_credits > 0 ? (resultSummary.earned_credits / resultSummary.total_credits) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border shadow-sm text-center py-4 bg-white" style={{ borderRadius: '8px' }}>
                <small className="text-secondary fw-semibold d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Overall Average Marks</small>
                <span className="h1 mb-0 fw-bold text-dark">{resultSummary.average_percentage}%</span>
              </div>
            </div>
          </div>

          {/* Transcript Course breakdown list */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-dark fw-bold">Academic Transcript Sheet</h5>
              <span className="badge bg-secondary-subtle text-secondary-emphasis py-1.5 px-3 fw-semibold">
                Roster: {resultSummary.results.length} Courses
              </span>
            </div>
            
            {resultSummary.results.length === 0 ? (
              <div className="card-body py-5 text-center text-secondary">
                <h5 className="h6 fw-semibold mb-2">No Grade Sheets Registered</h5>
                <p className="mb-0">This student has no registered course marks in the gradebook yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
                  <thead className="table-light text-secondary">
                    <tr>
                      <th className="py-3 px-4 fw-semibold">Course Code</th>
                      <th className="py-3 px-4 fw-semibold">Course Name</th>
                      <th className="py-3 px-4 fw-semibold text-center">Credit Hours</th>
                      <th className="py-3 px-4 fw-semibold text-center">Quiz (20)</th>
                      <th className="py-3 px-4 fw-semibold text-center">Mid (30)</th>
                      <th className="py-3 px-4 fw-semibold text-center">Final (50)</th>
                      <th className="py-3 px-4 fw-semibold text-center">Total (100)</th>
                      <th className="py-3 px-4 fw-semibold text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultSummary.results.map((row) => (
                      <tr key={row.grade_id}>
                        <td className="py-3 px-4 fw-bold text-dark">{row.course_code}</td>
                        <td className="py-3 px-4 text-dark fw-semibold">{row.course_name}</td>
                        <td className="py-3 px-4 text-center text-muted fw-semibold">{row.credit_hours}</td>
                        <td className="py-3 px-4 text-center text-muted">{row.quiz_marks}</td>
                        <td className="py-3 px-4 text-center text-muted">{row.mid_marks}</td>
                        <td className="py-3 px-4 text-center text-muted">{row.final_marks}</td>
                        <td className="py-3 px-4 text-center text-dark fw-bold">{row.total_marks}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`badge px-2.5 py-1.5 fw-bold ${getGradeBadgeClass(row.grade)}`} style={{ fontSize: '0.85rem' }}>
                            {row.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedStudent && loading && (
        <div className="container py-5 text-center text-secondary">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Compiling student results dashboard...</p>
        </div>
      )}
    </div>
  );
}

export default StudentResultView;
