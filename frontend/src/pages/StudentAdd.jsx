import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function StudentAdd() {
  const [formData, setFormData] = useState({
    roll_no: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    semester: '',
    password: '',
  });
  const [curriculums, setCurriculums] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [dbSemesters, setDbSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const dResponse = await api.get('/api/courses/departments/');
        const depts = dResponse.data && Array.isArray(dResponse.data.results) ? dResponse.data.results : (Array.isArray(dResponse.data) ? dResponse.data : []);
        setDbDepartments(depts);

        const sResponse = await api.get('/api/courses/semesters/');
        const sems = sResponse.data && Array.isArray(sResponse.data.results) ? sResponse.data.results : (Array.isArray(sResponse.data) ? sResponse.data : []);
        // Sort semesters by number or name
        const sortedSems = [...sems].sort((a, b) => (a.number || 0) - (b.number || 0));
        setDbSemesters(sortedSems);

        const cResponse = await api.get('/api/courses/curriculums/');
        const currs = cResponse.data && Array.isArray(cResponse.data.results) ? cResponse.data.results : (Array.isArray(cResponse.data) ? cResponse.data : []);
        setCurriculums(currs);

        if (depts.length > 0 && sortedSems.length > 0) {
          setFormData((prev) => ({
            ...prev,
            department: depts[0].id.toString(),
            semester: sortedSems[0].id.toString(),
          }));
        }
      } catch (err) {
        console.error('Failed to fetch dependencies', err);
      }
    };
    fetchDependencies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      const payload = {
        roll_no: formData.roll_no,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: parseInt(formData.department),
        semester: parseInt(formData.semester),
        password: formData.password,
      };
      await api.post('/api/students/', payload);
      navigate('/students');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ non_field_errors: ['Failed to add student. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  // Find the curriculum matching the current department and semester selection
  const activeCurriculum = curriculums.find(
    (c) => c.department.toString() === formData.department && c.semester.toString() === formData.semester
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
      <Link to="/students" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>&larr; Back to Directory</Link>
      
      <h1 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '2rem', color: '#1e293b' }}>Add New Student</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Register a new student. Standard curriculum courses will be automatically assigned.</p>

      {errors.non_field_errors && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {errors.non_field_errors.join(' ')}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569' }}>Roll No *</label>
          <input 
            type="text" 
            name="roll_no" 
            value={formData.roll_no} 
            onChange={handleChange}
            placeholder="e.g. CS-2023-042"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: errors.roll_no ? '1px solid #ef4444' : '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
            required
          />
          {errors.roll_no && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.roll_no.join(' ')}</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569' }}>Full Name *</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange}
            placeholder="e.g. Muhammad Ali"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: errors.name ? '1px solid #ef4444' : '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
            required
          />
          {errors.name && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.name.join(' ')}</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569' }}>Email Address *</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange}
            placeholder="e.g. ali@example.com"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: errors.email ? '1px solid #ef4444' : '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
            required
          />
          {errors.email && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.email.join(' ')}</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569' }}>Temporary Password *</label>
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange}
            placeholder="e.g. TempPassword123"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: errors.password ? '1px solid #ef4444' : '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
            required
          />
          {errors.password && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.password.join(' ')}</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569' }}>Phone Number</label>
          <input 
            type="text" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange}
            placeholder="e.g. +92 300 1234567"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: errors.phone ? '1px solid #ef4444' : '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
          {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.phone.join(' ')}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569' }}>Department *</label>
            <select 
              name="department" 
              value={formData.department} 
              onChange={handleChange}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: errors.department ? '1px solid #ef4444' : '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#fff' }}
              required
            >
              <option value="">-- Choose Department --</option>
              {dbDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.department && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.department.join(' ')}</span>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569' }}>Semester *</label>
            <select 
              name="semester" 
              value={formData.semester} 
              onChange={handleChange}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: errors.semester ? '1px solid #ef4444' : '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#fff' }}
              required
            >
              <option value="">-- Choose Semester --</option>
              {dbSemesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.semester && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{errors.semester.join(' ')}</span>}
          </div>
        </div>

        {/* Curriculum Preview Section */}
        <div style={{ marginTop: '0.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Curriculum Preview</label>
          <div style={{
            padding: '1rem',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            background: '#f8fafc',
            minHeight: '60px'
          }}>
            {!formData.department || !formData.semester ? (
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Select Department and Semester to preview curriculum</span>
            ) : !activeCurriculum ? (
              <span style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: '500' }}>⚠️ No curriculum matches this combination. Student will not be enrolled automatically.</span>
            ) : !activeCurriculum.courses || activeCurriculum.courses.length === 0 ? (
              <span style={{ color: '#d97706', fontSize: '0.9rem', fontWeight: '500' }}>⚠️ The matching curriculum exists but contains no courses.</span>
            ) : (
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#4f46e5', fontWeight: '600' }}>
                  Student will be automatically enrolled in:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {activeCurriculum.courses.map((cc) => (
                    <span 
                      key={cc.id} 
                      style={{ 
                        background: '#e0e7ff', 
                        color: '#4f46e5', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem', 
                        fontWeight: '600',
                        border: '1px solid #c7d2fe'
                      }}
                    >
                      {cc.course_details?.course_code} - {cc.course_details?.course_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              flexGrow: 1, 
              padding: '0.75rem', 
              background: '#4f46e5', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontWeight: '600', 
              textAlign: 'center' 
            }}
          >
            {loading ? 'Adding Student...' : 'Add Student'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/students')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: '#f1f5f9', 
              color: '#475569', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: '600' 
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default StudentAdd;
