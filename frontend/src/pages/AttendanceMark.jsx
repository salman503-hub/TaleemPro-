import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function AttendanceMark() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/courses/', { params: { page_size: 100 } });
      setCourses(response.data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/students/', { params: { page_size: 100 } });
      const studentList = response.data.results || [];
      setStudents(studentList);
      
      // Default all students to PRESENT
      const initialRecords = {};
      studentList.forEach((student) => {
        initialRecords[student.id] = 'PRESENT';
      });
      setAttendanceRecords(initialRecords);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to load students.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      setMessage({ type: 'danger', text: 'Please select a course.' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    const postRecords = Object.keys(attendanceRecords).map((studentId) => ({
      student: parseInt(studentId),
      status: attendanceRecords[studentId],
    }));

    const payload = {
      course: parseInt(selectedCourse),
      date: selectedDate,
      records: postRecords,
    };

    try {
      const response = await api.post('/api/attendance/mark/', payload);
      setMessage({
        type: 'success',
        text: `Attendance submitted! Created ${response.data.created} and updated ${response.data.updated} records.`
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to submit attendance.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4" style={{ textAlign: 'left' }}>
      <div className="mb-4">
        <Link to="/dashboard" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Dashboard</Link>
        <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Mark Attendance</h1>
        <p className="text-secondary mb-0">Select a course and date to register daily attendance sheets.</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} mb-4`} role="alert">
          {message.text}
        </div>
      )}

      {/* Filter Selection Card */}
      <div className="card border shadow-sm p-4 mb-4" style={{ borderRadius: '8px', background: '#fff' }}>
        <form onSubmit={handleSubmit} className="row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary">Select Course *</label>
            <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="form-select form-select-lg"
              required
            >
              <option value="">-- Choose Course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary">Select Date *</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-control form-control-lg"
              required
            />
          </div>
        </form>
      </div>

      {/* Student List Sheet Table */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div className="card-body py-5 text-center text-secondary">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mb-0">Loading class roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="card-body py-5 text-center text-secondary">
            <h4 className="h5 text-dark fw-semibold mb-2">No Students Registered</h4>
            <p className="mb-0">Create student profiles in the Students Directory first.</p>
          </div>
        ) : (
          <div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
                <thead className="table-light text-secondary">
                  <tr>
                    <th className="py-3 px-4 fw-semibold" style={{ width: '150px' }}>Roll No</th>
                    <th className="py-3 px-4 fw-semibold">Student Name</th>
                    <th className="py-3 px-4 fw-semibold text-center" style={{ width: '350px' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="py-3 px-4 fw-bold text-dark">{student.roll_no}</td>
                      <td className="py-3 px-4 text-dark fw-semibold">{student.name}</td>
                      <td className="py-3 px-4">
                        <div className="d-flex justify-content-center gap-4">
                          <div className="form-check form-check-inline mb-0">
                            <input 
                              type="radio" 
                              name={`attendance-${student.id}`} 
                              id={`present-${student.id}`} 
                              value="PRESENT" 
                              checked={attendanceRecords[student.id] === 'PRESENT'}
                              onChange={() => handleStatusChange(student.id, 'PRESENT')}
                              className="form-check-input"
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label text-success fw-bold" htmlFor={`present-${student.id}`} style={{ cursor: 'pointer' }}>
                              Present
                            </label>
                          </div>
                          <div className="form-check form-check-inline mb-0">
                            <input 
                              type="radio" 
                              name={`attendance-${student.id}`} 
                              id={`absent-${student.id}`} 
                              value="ABSENT" 
                              checked={attendanceRecords[student.id] === 'ABSENT'}
                              onChange={() => handleStatusChange(student.id, 'ABSENT')}
                              className="form-check-input"
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label text-danger fw-bold" htmlFor={`absent-${student.id}`} style={{ cursor: 'pointer' }}>
                              Absent
                            </label>
                          </div>
                          <div className="form-check form-check-inline mb-0">
                            <input 
                              type="radio" 
                              name={`attendance-${student.id}`} 
                              id={`leave-${student.id}`} 
                              value="LEAVE" 
                              checked={attendanceRecords[student.id] === 'LEAVE'}
                              onChange={() => handleStatusChange(student.id, 'LEAVE')}
                              className="form-check-input"
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label text-warning fw-bold" htmlFor={`leave-${student.id}`} style={{ cursor: 'pointer' }}>
                              Leave
                            </label>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-footer bg-white py-3 px-4 text-end">
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={saving || !selectedCourse}
                className="btn btn-primary px-5 py-2 fw-semibold"
                style={{ background: '#4f46e5', border: 'none' }}
              >
                {saving ? 'Submitting Attendance...' : 'Save Attendance Sheet'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceMark;
