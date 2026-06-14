import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function AttendanceReport() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-indexed
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/courses/', { params: { page_size: 100 } });
      setCourses(response.data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchReport = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      setError('Please select a course.');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await api.get('/api/attendance/report/', {
        params: {
          course: selectedCourse,
          month: selectedMonth,
          year: selectedYear,
        }
      });
      setReportData(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch monthly attendance report.');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="container py-4" style={{ textAlign: 'left' }}>
      <div className="mb-4">
        <Link to="/dashboard" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Dashboard</Link>
        <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Monthly Attendance Reports</h1>
        <p className="text-secondary mb-0">Select filters to compute overall student attendance percentages and statistics.</p>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Filter panel card */}
      <div className="card border shadow-sm p-4 mb-4" style={{ borderRadius: '8px', background: '#fff' }}>
        <form onSubmit={handleFetchReport} className="row g-3 align-items-end">
          <div className="col-md-5">
            <label className="form-label fw-semibold text-secondary">Course *</label>
            <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="form-select"
              required
            >
              <option value="">-- Select Course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
              ))}
            </select>
          </div>
          
          <div className="col-md-3">
            <label className="form-label fw-semibold text-secondary">Month *</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="form-select"
              required
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label fw-semibold text-secondary">Year *</label>
            <input 
              type="number" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min="2020" 
              max="2100" 
              className="form-control"
              required
            />
          </div>

          <div className="col-md-2">
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary w-100 py-2 fw-semibold"
              style={{ background: '#4f46e5', border: 'none' }}
            >
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>

      {/* Report Table Card */}
      {hasSearched && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
          {loading ? (
            <div className="card-body py-5 text-center text-secondary">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mb-0">Compiling report statistics...</p>
            </div>
          ) : reportData.length === 0 ? (
            <div className="card-body py-5 text-center text-secondary">
              <h4 className="h5 text-dark fw-semibold mb-2">No Records Found</h4>
              <p className="mb-0">No attendance records found for this course in the selected month/year.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
                <thead className="table-light text-secondary">
                  <tr>
                    <th className="py-3 px-4 fw-semibold" style={{ width: '130px' }}>Roll No</th>
                    <th className="py-3 px-4 fw-semibold">Student Name</th>
                    <th className="py-3 px-4 fw-semibold text-center">Present</th>
                    <th className="py-3 px-4 fw-semibold text-center">Absent</th>
                    <th className="py-3 px-4 fw-semibold text-center">Leave</th>
                    <th className="py-3 px-4 fw-semibold text-center">Total Classes</th>
                    <th className="py-3 px-4 fw-semibold" style={{ width: '250px' }}>Attendance Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row) => (
                    <tr key={row.student_id}>
                      <td className="py-3 px-4 fw-bold text-dark">{row.roll_no}</td>
                      <td className="py-3 px-4 text-dark fw-semibold">{row.name}</td>
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
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceReport;
