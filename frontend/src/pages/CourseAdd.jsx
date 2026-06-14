import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function CourseAdd() {
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    credit_hours: 3,
    teacher: '',
    department: '',
    semester: '',
  });
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tResponse = await api.get('/api/teachers/', { params: { page_size: 100 } });
        setTeachers(tResponse.data.results || []);

        const dResponse = await api.get('/api/courses/departments/');
        if (dResponse.data && Array.isArray(dResponse.data.results)) {
          setDepartments(dResponse.data.results);
        } else if (Array.isArray(dResponse.data)) {
          setDepartments(dResponse.data);
        }

        const sResponse = await api.get('/api/courses/semesters/');
        if (sResponse.data && Array.isArray(sResponse.data.results)) {
          setSemesters(sResponse.data.results);
        } else if (Array.isArray(sResponse.data)) {
          setSemesters(sResponse.data);
        }
      } catch (err) {
        console.error('Failed to load dependency data', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    
    // Format teacher value properly (pass null if empty)
    const postData = {
      ...formData,
      teacher: formData.teacher === '' ? null : parseInt(formData.teacher),
      credit_hours: parseInt(formData.credit_hours),
    };

    try {
      await api.post('/api/courses/', postData);
      navigate('/courses');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ non_field_errors: ['Failed to add course record.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '600px', textAlign: 'left' }}>
      <Link to="/courses" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Directory</Link>
      
      <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Add New Course</h1>
      <p className="text-secondary mb-4">Register a new curriculum subject course and assign a teacher.</p>

      {errors.non_field_errors && (
        <div className="alert alert-danger mb-4" role="alert">
          {errors.non_field_errors.join(' ')}
        </div>
      )}

      <div className="card border shadow-sm p-4" style={{ borderRadius: '8px', background: '#fff' }}>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          
          <div>
            <label className="form-label fw-semibold text-secondary">Course Code *</label>
            <input 
              type="text" 
              name="course_code" 
              value={formData.course_code} 
              onChange={handleChange}
              placeholder="e.g. CS-301"
              className={`form-control ${errors.course_code ? 'is-invalid' : ''}`}
              required
            />
            {errors.course_code && <div className="invalid-feedback">{errors.course_code.join(' ')}</div>}
          </div>

          <div>
            <label className="form-label fw-semibold text-secondary">Course Name *</label>
            <input 
              type="text" 
              name="course_name" 
              value={formData.course_name} 
              onChange={handleChange}
              placeholder="e.g. Database Systems"
              className={`form-control ${errors.course_name ? 'is-invalid' : ''}`}
              required
            />
            {errors.course_name && <div className="invalid-feedback">{errors.course_name.join(' ')}</div>}
          </div>

          <div>
            <label className="form-label fw-semibold text-secondary">Credit Hours *</label>
            <input 
              type="number" 
              name="credit_hours" 
              value={formData.credit_hours} 
              onChange={handleChange}
              min="1"
              max="6"
              className={`form-control ${errors.credit_hours ? 'is-invalid' : ''}`}
              required
            />
            {errors.credit_hours && <div className="invalid-feedback">{errors.credit_hours.join(' ')}</div>}
          </div>

          <div>
            <label className="form-label fw-semibold text-secondary">Department *</label>
            <select 
              name="department" 
              value={formData.department} 
              onChange={handleChange}
              className={`form-select ${errors.department ? 'is-invalid' : ''}`}
              required
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            {errors.department && <div className="invalid-feedback">{errors.department.join(' ')}</div>}
          </div>

          <div>
            <label className="form-label fw-semibold text-secondary">Semester *</label>
            <select 
              name="semester" 
              value={formData.semester} 
              onChange={handleChange}
              className={`form-select ${errors.semester ? 'is-invalid' : ''}`}
              required
            >
              <option value="">-- Select Semester --</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            {errors.semester && <div className="invalid-feedback">{errors.semester.join(' ')}</div>}
          </div>

          <div>
            <label className="form-label fw-semibold text-secondary d-flex justify-content-between">
              <span>Assign Teacher</span>
              <Link to="/teachers/add" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5', fontSize: '0.85rem' }}>+ Create New Teacher</Link>
            </label>
            <select 
              name="teacher" 
              value={formData.teacher} 
              onChange={handleChange}
              className={`form-select ${errors.teacher ? 'is-invalid' : ''}`}
            >
              <option value="">-- No Teacher Assigned --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.designation} - {t.department})</option>
              ))}
            </select>
            {errors.teacher && <div className="invalid-feedback">{errors.teacher.join(' ')}</div>}
          </div>

          <div className="d-flex gap-2 mt-3">
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary flex-grow-1 py-2 fw-semibold"
              style={{ background: '#4f46e5', border: 'none' }}
            >
              {loading ? 'Adding Course...' : 'Add Course'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/courses')}
              className="btn btn-light border px-4 fw-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CourseAdd;
