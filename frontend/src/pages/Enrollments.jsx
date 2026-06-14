import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Enrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [oldCourse, setOldCourse] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [formTab, setFormTab] = useState('enroll'); // 'enroll' or 'replace'
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchEnrollments();
    fetchDropdownData();
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/api/enrollments/');
      if (response.data && Array.isArray(response.data.results)) {
        setEnrollments(response.data.results);
      } else if (Array.isArray(response.data)) {
        setEnrollments(response.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch all students (using page_size=100 for dropdowns)
      const studentsResponse = await api.get('/api/students/', { params: { page_size: 100 } });
      if (studentsResponse.data && Array.isArray(studentsResponse.data.results)) {
        setStudents(studentsResponse.data.results);
      } else if (Array.isArray(studentsResponse.data)) {
        setStudents(studentsResponse.data);
      }

      // Fetch all courses
      const coursesResponse = await api.get('/api/courses/', { params: { page_size: 100 } });
      if (coursesResponse.data && Array.isArray(coursesResponse.data.results)) {
        setCourses(coursesResponse.data.results);
      } else if (Array.isArray(coursesResponse.data)) {
        setCourses(coursesResponse.data);
      }
    } catch (err) {
      console.error('Failed to load students/courses dropdowns', err);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!selectedStudent || !selectedCourse) {
      setErrorMsg('Please select both a student and a course.');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/api/enrollments/', {
        student: selectedStudent,
        course: selectedCourse
      });
      setSuccessMsg('Student enrolled successfully!');
      setSelectedStudent('');
      setSelectedCourse('');
      fetchEnrollments();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to enroll student. They might already be enrolled in this course.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleReplace = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!selectedStudent || !oldCourse || !newCourse) {
      setErrorMsg('Please select student, old course, and new course.');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/api/courses/enrollments/replace/', {
        student: selectedStudent,
        old_course: oldCourse,
        new_course: newCourse
      });
      setSuccessMsg('Course replaced successfully!');
      setSelectedStudent('');
      setOldCourse('');
      setNewCourse('');
      fetchEnrollments();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to replace course.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, studentName, courseCode) => {
    if (window.confirm(`Are you sure you want to remove "${studentName}" from "${courseCode}"?`)) {
      try {
        await api.delete(`/api/enrollments/${id}/`);
        setSuccessMsg('Enrollment removed successfully.');
        fetchEnrollments();
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to delete enrollment.');
      }
    }
  };

  const filteredEnrollments = enrollments.filter((item) => {
    const sName = item.student_details?.name || '';
    const sRoll = item.student_details?.roll_no || '';
    const cName = item.course_details?.course_name || '';
    const cCode = item.course_details?.course_code || '';
    const term = searchTerm.toLowerCase();

    return (
      sName.toLowerCase().includes(term) ||
      sRoll.toLowerCase().includes(term) ||
      cName.toLowerCase().includes(term) ||
      cCode.toLowerCase().includes(term)
    );
  });

  const userRole = user?.role || localStorage.getItem('user_role');
  const isStudent = userRole === 'STUDENT';
  const isAdmin = userRole === 'ADMIN';

  // Derived states for Course Replacement
  const studentEnrollments = enrollments.filter(e => String(e.student) === String(selectedStudent));
  const enrolledCourseIds = studentEnrollments.map(e => e.course_details?.id || e.course);
  const availableNewCourses = courses.filter(c => !enrolledCourseIds.includes(c.id));

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Link to="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>&larr; Back to Dashboard</Link>
          <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '2.25rem', color: '#1e293b' }}>Enrollment Management</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Manage student course registrations and list enrolled courses.</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '1rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #c8e6c9' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #ffcdd2' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isStudent ? '1fr' : '2.5fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Enrollments List */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="Search by student, roll no, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flexGrow: 1, padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading enrollments...</div>
          ) : filteredEnrollments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No enrollments found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Student</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Course</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Assignment Type</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Assigned By</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Created At</th>
                    {!isStudent && <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.student_details?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.student_details?.roll_no}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '500', color: '#334155' }}>{item.course_details?.course_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.course_details?.course_code}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem', 
                          fontWeight: '600',
                          background: item.enrollment_type === 'CURRICULUM' ? '#f3e8ff' : '#e0e7ff',
                          color: item.enrollment_type === 'CURRICULUM' ? '#7c3aed' : '#4f46e5'
                        }}>
                          {item.enrollment_type || 'CURRICULUM'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>
                        {item.assigned_by_username || 'System'}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                        {new Date(item.created_at || item.enrolled_at).toLocaleDateString()}
                      </td>
                      {!isStudent && (
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDelete(item.id, item.student_details?.name, item.course_details?.course_code)}
                            style={{ padding: '0.35rem 0.75rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}
                          >
                            Drop
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enroll / Replace Form Panel (Only for Admin & Teacher) */}
        {!isStudent && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            {/* Tabs for Admin */}
            {isAdmin && (
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <button 
                  type="button"
                  onClick={() => { setFormTab('enroll'); setSelectedStudent(''); setSelectedCourse(''); }}
                  style={{ flexGrow: 1, padding: '0.5rem 0', border: 'none', background: 'none', fontWeight: '600', fontSize: '0.9rem', color: formTab === 'enroll' ? '#4f46e5' : '#64748b', borderBottom: formTab === 'enroll' ? '2px solid #4f46e5' : 'none', cursor: 'pointer' }}
                >
                  Quick Enroll
                </button>
                <button 
                  type="button"
                  onClick={() => { setFormTab('replace'); setSelectedStudent(''); setOldCourse(''); setNewCourse(''); }}
                  style={{ flexGrow: 1, padding: '0.5rem 0', border: 'none', background: 'none', fontWeight: '600', fontSize: '0.9rem', color: formTab === 'replace' ? '#4f46e5' : '#64748b', borderBottom: formTab === 'replace' ? '2px solid #4f46e5' : 'none', cursor: 'pointer' }}
                >
                  Replace Course
                </button>
              </div>
            )}

            {formTab === 'enroll' ? (
              <>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.25rem', display: isAdmin ? 'none' : 'block' }}>Quick Enroll</h3>
                <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Select Student *</label>
                    <select 
                      value={selectedStudent} 
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
                      required
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map((std) => (
                        <option key={std.id} value={std.id}>
                          {std.name} ({std.roll_no})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Select Course *</label>
                    <select 
                      value={selectedCourse} 
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
                      required
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map((crs) => (
                        <option key={crs.id} value={crs.id}>
                          {crs.course_code} - {crs.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    disabled={formLoading}
                    style={{ 
                      padding: '0.75rem', 
                      background: '#4f46e5', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: formLoading ? 'not-allowed' : 'pointer', 
                      fontWeight: '600',
                      boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                    }}
                  >
                    {formLoading ? 'Enrolling...' : 'Enroll Student'}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleReplace} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Select Student *</label>
                  <select 
                    value={selectedStudent} 
                    onChange={(e) => { setSelectedStudent(e.target.value); setOldCourse(''); setNewCourse(''); }}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((std) => (
                      <option key={std.id} value={std.id}>
                        {std.name} ({std.roll_no})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Current Course (To Remove) *</label>
                  <select 
                    value={oldCourse} 
                    onChange={(e) => setOldCourse(e.target.value)}
                    disabled={!selectedStudent}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: !selectedStudent ? '#f1f5f9' : '#fff' }}
                    required
                  >
                    <option value="">-- Choose Current Course --</option>
                    {studentEnrollments.map((e) => (
                      <option key={e.course_details?.id} value={e.course_details?.id}>
                        {e.course_details?.course_code} - {e.course_details?.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Replacement Course (To Enroll) *</label>
                  <select 
                    value={newCourse} 
                    onChange={(e) => setNewCourse(e.target.value)}
                    disabled={!selectedStudent}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: !selectedStudent ? '#f1f5f9' : '#fff' }}
                    required
                  >
                    <option value="">-- Choose Replacement Course --</option>
                    {availableNewCourses.map((crs) => (
                      <option key={crs.id} value={crs.id}>
                        {crs.course_code} - {crs.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={formLoading || !selectedStudent || !oldCourse || !newCourse}
                  style={{ 
                    padding: '0.75rem', 
                    background: '#4f46e5', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: (formLoading || !selectedStudent || !oldCourse || !newCourse) ? 'not-allowed' : 'pointer', 
                    fontWeight: '600',
                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                  }}
                >
                  {formLoading ? 'Replacing...' : 'Replace Course'}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Enrollments;

