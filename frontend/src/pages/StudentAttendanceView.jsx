import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function StudentAttendanceView() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overallPercentage, setOverallPercentage] = useState(0);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students/', { params: { page_size: 100 } });
      const studentList = response.data.results || [];
      setStudents(studentList);
      
      // Auto-select first student if available
      if (studentList.length > 0) {
        setSelectedStudent(studentList[0].id);
        fetchSummary(studentList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async (studentId) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/attendance/student-summary/', {
        params: { student: studentId }
      });
      const data = response.data || [];
      setSummaryData(data);
      
      // Calculate overall attendance percentage across all courses
      let totalPresents = 0;
      let totalClasses = 0;
      data.forEach((course) => {
        totalPresents += course.present_count;
        totalClasses += course.total_classes;
      });

      const overall = totalClasses > 0 ? roundDecimal((totalPresents / totalClasses) * 100, 1) : 0;
      setOverallPercentage(overall);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch student summary.');
    } finally {
      setLoading(false);
    }
  };

  const roundDecimal = (value, decimals) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  };

  const handleStudentChange = (e) => {
    const id = e.target.value;
    setSelectedStudent(id);
    if (id) {
      fetchSummary(id);
    } else {
      setSummaryData([]);
      setOverallPercentage(0);
    }
  };

  return (
    <div className="container py-4" style={{ textAlign: 'left' }}>
      <div className="mb-4">
        <Link to="/dashboard" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Dashboard</Link>
        <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Student Attendance View</h1>
        <p className="text-secondary mb-0">Check overall attendance metrics, course summaries and progress stats.</p>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Select Student Selector card */}
      <div className="card border shadow-sm p-4 mb-4" style={{ borderRadius: '8px', background: '#fff' }}>
        <div className="row align-items-center">
          <div className="col-md-8">
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
          {selectedStudent && !loading && (
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <div className="d-inline-block p-3 border rounded text-center" style={{ minWidth: '150px', background: '#f8fafc' }}>
                <small className="text-secondary fw-semibold d-block text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Overall Attendance</small>
                <span className={`h2 mb-0 fw-bold ${overallPercentage >= 75 ? 'text-success' : 'text-danger'}`}>{overallPercentage}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Breakdown Card */}
      {selectedStudent && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
          {loading ? (
            <div className="card-body py-5 text-center text-secondary">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mb-0">Compiling summary logs...</p>
            </div>
          ) : summaryData.length === 0 ? (
            <div className="card-body py-5 text-center text-secondary">
              <h4 className="h5 text-dark fw-semibold mb-2">No Attendance Sheets Found</h4>
              <p className="mb-0">This student has no attendance marked in any courses yet.</p>
            </div>
          ) : (
            <div>
              <div className="card-header bg-white py-3 px-4 border-bottom">
                <h5 className="mb-0 text-dark fw-bold">Course-wise Breakdown</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
                  <thead className="table-light text-secondary">
                    <tr>
                      <th className="py-3 px-4 fw-semibold" style={{ width: '150px' }}>Course Code</th>
                      <th className="py-3 px-4 fw-semibold">Course Name</th>
                      <th className="py-3 px-4 fw-semibold text-center">Present</th>
                      <th className="py-3 px-4 fw-semibold text-center">Absent</th>
                      <th className="py-3 px-4 fw-semibold text-center">Leave</th>
                      <th className="py-3 px-4 fw-semibold text-center">Total Classes</th>
                      <th className="py-3 px-4 fw-semibold" style={{ width: '250px' }}>Course Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row) => (
                      <tr key={row.course_id}>
                        <td className="py-3 px-4 fw-bold text-dark">{row.course_code}</td>
                        <td className="py-3 px-4 text-dark fw-semibold">{row.course_name}</td>
                        <td className="py-3 px-4 text-center text-success fw-bold">{row.present_count}</td>
                        <td className="py-3 px-4 text-center text-danger fw-bold">{row.absent_count}</td>
                        <td className="py-3 px-4 text-center text-warning fw-bold">{row.leave_count}</td>
                        <td className="py-3 px-4 text-center text-dark fw-medium">{row.total_classes}</td>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center gap-3">
                            <div className="progress flex-grow-1" style={{ height: '8px' }}>
                              <div 
                                className={`progress-bar ${row.percentage >= 75 ? 'bg-success' : 'bg-danger'}`}
                                role="progressbar" 
                                style={{ width: `${row.percentage}%` }}
                                aria-valuenow={row.percentage} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <span className={`fw-bold ${row.percentage >= 75 ? 'text-success' : 'text-danger'}`} style={{ minWidth: '50px', fontSize: '0.9rem' }}>
                              {row.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentAttendanceView;
