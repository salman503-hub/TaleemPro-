import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function CurriculumBuilder() {
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  
  const [newCourseId, setNewCourseId] = useState('');
  
  // Custom course creation form states
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [creditHours, setCreditHours] = useState(3);
  const [courseTeacher, setCourseTeacher] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [deptRes, semRes, courseRes, currRes, teacherRes] = await Promise.all([
        api.get('/api/courses/departments/'),
        api.get('/api/courses/semesters/'),
        api.get('/api/courses/'),
        api.get('/api/courses/curriculums/'),
        api.get('/api/teachers/', { params: { page_size: 100 } })
      ]);

      const depts = deptRes.data.results || deptRes.data || [];
      const sems = semRes.data.results || semRes.data || [];
      const crs = courseRes.data.results || courseRes.data || [];
      const currs = currRes.data.results || currRes.data || [];
      const tchs = teacherRes.data.results || teacherRes.data || [];

      // Sort semesters by number or name
      const sortedSems = [...sems].sort((a, b) => (a.number || 0) - (b.number || 0));

      setDepartments(depts);
      setSemesters(sortedSems);
      setCourses(crs);
      setCurriculums(currs);
      setTeachers(tchs);

      if (depts.length > 0 && sortedSems.length > 0) {
        setSelectedDept(depts[0].id.toString());
        setSelectedSem(sortedSems[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load initial metadata.');
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculumsList = async () => {
    try {
      const currRes = await api.get('/api/courses/curriculums/');
      setCurriculums(currRes.data.results || currRes.data || []);
    } catch (err) {
      console.error('Error refreshing curriculums list:', err);
    }
  };

  const refreshCoursesList = async () => {
    try {
      const courseRes = await api.get('/api/courses/');
      setCourses(courseRes.data.results || courseRes.data || []);
    } catch (err) {
      console.error('Error refreshing courses list:', err);
    }
  };

  // Find curriculum based on selected department and semester
  useEffect(() => {
    if (selectedDept && selectedSem) {
      const match = curriculums.find(
        (c) => c.department.toString() === selectedDept && c.semester.toString() === selectedSem
      );
      setSelectedCurriculum(match || null);
    } else {
      setSelectedCurriculum(null);
    }
    setSuccessMsg('');
    setErrorMsg('');
  }, [selectedDept, selectedSem, curriculums]);

  const handleCreateCurriculum = async () => {
    if (!selectedDept || !selectedSem) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.post('/api/courses/curriculums/', {
        department: parseInt(selectedDept),
        semester: parseInt(selectedSem),
      });
      setSuccessMsg('Curriculum structure created successfully.');
      await loadCurriculumsList();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create curriculum structure.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!selectedCurriculum || !newCourseId) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/api/courses/curriculum-courses/', {
        curriculum: selectedCurriculum.id,
        course: parseInt(newCourseId),
      });
      setSuccessMsg('Course added to curriculum successfully.');
      setNewCourseId('');
      await loadCurriculumsList();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to add course to curriculum. It might already be enrolled.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAndAddCourse = async (e) => {
    e.preventDefault();
    if (!selectedCurriculum || !courseCode || !courseName) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // 1. Create course
      const newCourseRes = await api.post('/api/courses/', {
        course_code: courseCode.trim(),
        course_name: courseName.trim(),
        credit_hours: parseInt(creditHours),
        teacher: courseTeacher ? parseInt(courseTeacher) : null
      });
      const newCourse = newCourseRes.data;

      // 2. Add to curriculum
      await api.post('/api/courses/curriculum-courses/', {
        curriculum: selectedCurriculum.id,
        course: newCourse.id,
      });

      setSuccessMsg(`Course "${courseName}" created and added to curriculum successfully.`);
      
      // Reset fields
      setCourseCode('');
      setCourseName('');
      setCreditHours(3);
      setCourseTeacher('');
      setIsCreatingCourse(false);

      // Refresh list
      await Promise.all([
        refreshCoursesList(),
        loadCurriculumsList()
      ]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.course_code?.join(' ') || err.response?.data?.detail || 'Failed to create and add course.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCourse = async (curriculumCourseId, courseCode) => {
    if (!window.confirm(`Are you sure you want to remove ${courseCode} from this curriculum?`)) {
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.delete(`/api/courses/curriculum-courses/${curriculumCourseId}/`);
      setSuccessMsg('Course removed from curriculum successfully.');
      await loadCurriculumsList();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to remove course from curriculum.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCurriculum = async () => {
    if (!selectedCurriculum) return;
    const deptName = selectedCurriculum.department_details?.name || 'this department';
    const semName = selectedCurriculum.semester_details?.name || 'this semester';
    if (!window.confirm(`Are you sure you want to DELETE the entire curriculum for ${deptName} (${semName})? This will unmap all its courses.`)) {
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.delete(`/api/courses/curriculums/${selectedCurriculum.id}/`);
      setSuccessMsg('Curriculum deleted successfully.');
      await loadCurriculumsList();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete curriculum.');
    } finally {
      setActionLoading(false);
    }
  };

  // Get list of courses not yet in selected curriculum
  const getAvailableCourses = () => {
    if (!selectedCurriculum) return [];
    const mappedIds = (selectedCurriculum.courses || []).map((cc) => cc.course);
    return courses.filter((c) => !mappedIds.includes(c.id));
  };

  const availableCourses = getAvailableCourses();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Link to="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>&larr; Back to Dashboard</Link>
          <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '2.25rem', color: '#1e293b' }}>Curriculum Builder</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Establish standard sets of courses per department and semester for automated student enrollment.</p>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#4f46e5', fontWeight: '600' }}>Loading metadata...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Sidebar Config / Selection Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', color: '#1e293b', fontSize: '1.15rem', fontWeight: '600' }}>Select Target</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Department</label>
                <select 
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Semester</label>
                <select 
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
                >
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Links / All Curriculums */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.15rem', fontWeight: '600' }}>Active Structures</h3>
              {curriculums.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No active curriculums yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {curriculums.map((curr) => {
                    const isCurrent = selectedDept === curr.department.toString() && selectedSem === curr.semester.toString();
                    return (
                      <button
                        key={curr.id}
                        onClick={() => {
                          setSelectedDept(curr.department.toString());
                          setSelectedSem(curr.semester.toString());
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '0.6rem 0.8rem',
                          borderRadius: '6px',
                          border: isCurrent ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                          background: isCurrent ? '#f5f3ff' : '#f8fafc',
                          color: isCurrent ? '#4f46e5' : '#334155',
                          fontWeight: isCurrent ? '600' : '500',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>{curr.department_details?.name} ({curr.semester_details?.name})</span>
                        <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px', color: '#475569' }}>
                          {(curr.courses || []).length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Main Working Area */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '400px' }}>
            {!selectedCurriculum ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <span style={{ fontSize: '3rem' }}>📁</span>
                <h3 style={{ marginTop: '1rem', color: '#1e293b', fontSize: '1.25rem', fontWeight: '600' }}>No Curriculum Map Exists</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  There is no registered curriculum structure for the selected Department and Semester combination.
                </p>
                <button
                  onClick={handleCreateCurriculum}
                  disabled={actionLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                  }}
                >
                  {actionLoading ? 'Creating Map...' : 'Create Curriculum Template'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: '700' }}>
                      {selectedCurriculum.department_details?.name}
                    </h2>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#4f46e5', fontWeight: '600', fontSize: '0.95rem' }}>
                      {selectedCurriculum.semester_details?.name} Course Matrix
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteCurriculum}
                    disabled={actionLoading}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: 'none',
                      color: '#ef4444',
                      border: '1px solid #fee2e2',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      cursor: actionLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Delete Curriculum
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                  
                  {/* Courses in Curriculum */}
                  <div>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '1.1rem', fontWeight: '600' }}>Curriculum Core Courses</h3>
                    
                    {!selectedCurriculum.courses || selectedCurriculum.courses.length === 0 ? (
                      <div style={{ border: '2px dashed #e2e8f0', borderRadius: '8px', padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        No courses added to this curriculum yet. Add courses from the panel on the right.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {selectedCurriculum.courses.map((cc) => (
                          <div 
                            key={cc.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '1rem', 
                              border: '1px solid #f1f5f9', 
                              background: '#f8fafc', 
                              borderRadius: '8px' 
                            }}
                          >
                            <div>
                              <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', marginRight: '0.5rem' }}>
                                {cc.course_details?.course_code}
                              </span>
                              <strong style={{ color: '#1e293b' }}>{cc.course_details?.course_name}</strong>
                              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {cc.course_details?.credit_hours} Credit Hours {cc.course_details?.teacher_details ? `• Taught by ${cc.course_details.teacher_details.name}` : ''}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveCourse(cc.id, cc.course_details?.course_code)}
                              disabled={actionLoading}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '0.5rem'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Course Form Box */}
                  <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ margin: 0, color: '#334155', fontSize: '1.1rem', fontWeight: '600' }}>
                        {isCreatingCourse ? 'Create & Add Course' : 'Add to Curriculum'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCourse(!isCreatingCourse);
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4f46e5',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {isCreatingCourse ? 'Select Existing' : 'Create New Course'}
                      </button>
                    </div>
                    
                    {isCreatingCourse ? (
                      <form onSubmit={handleCreateAndAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Course Code *</label>
                          <input 
                            type="text"
                            placeholder="e.g. CS-301"
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', background: '#fff', boxSizing: 'border-box' }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Course Name *</label>
                          <input 
                            type="text"
                            placeholder="e.g. Compiler Construction"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', background: '#fff', boxSizing: 'border-box' }}
                            required
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Credits</label>
                            <input 
                              type="number"
                              min="1"
                              max="6"
                              value={creditHours}
                              onChange={(e) => setCreditHours(e.target.value)}
                              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', background: '#fff', boxSizing: 'border-box' }}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Teacher</label>
                            <select 
                              value={courseTeacher}
                              onChange={(e) => setCourseTeacher(e.target.value)}
                              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', background: '#fff' }}
                            >
                              <option value="">-- No Teacher --</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button 
                          type="submit"
                          disabled={actionLoading}
                          style={{ 
                            padding: '0.65rem', 
                            background: '#4f46e5', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: actionLoading ? 'not-allowed' : 'pointer', 
                            fontWeight: '600', 
                            fontSize: '0.9rem' 
                          }}
                        >
                          {actionLoading ? 'Creating...' : 'Create & Add to Curriculum'}
                        </button>
                      </form>
                    ) : (
                      <>
                        {availableCourses.length === 0 ? (
                          <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5' }}>
                            All available courses are already enrolled in this curriculum, or no courses exist in the system. Click "Create New Course" above to add a new one.
                          </p>
                        ) : (
                          <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Select Course</label>
                              <select 
                                value={newCourseId}
                                onChange={(e) => setNewCourseId(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', background: '#fff' }}
                                required
                              >
                                <option value="">-- Choose Course --</option>
                                {availableCourses.map((c) => (
                                  <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
                                ))}
                              </select>
                            </div>
                            <button 
                              type="submit"
                              disabled={actionLoading || !newCourseId}
                              style={{ 
                                padding: '0.65rem', 
                                background: '#4f46e5', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: (actionLoading || !newCourseId) ? 'not-allowed' : 'pointer', 
                                fontWeight: '600', 
                                fontSize: '0.9rem' 
                              }}
                            >
                              {actionLoading ? 'Adding...' : 'Add Course'}
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default CurriculumBuilder;
