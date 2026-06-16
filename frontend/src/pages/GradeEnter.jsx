import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function GradeEnter() {
  const [formData, setFormData] = useState({
    student: '',
    course: '',
    quiz_marks: 0.0,
    mid_marks: 0.0,
    final_marks: 0.0,
  });
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students/', { params: { page_size: 100 } });
      setStudents(response.data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/courses/', { params: { page_size: 100 } });
      setCourses(response.data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

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

    // Local validation
    const quiz = parseFloat(formData.quiz_marks);
    const mid = parseFloat(formData.mid_marks);
    const final = parseFloat(formData.final_marks);

    const localErrors = {};
    if (quiz < 0 || quiz > 20) {
      localErrors.quiz_marks = ['Quiz marks must be between 0 and 20.'];
    }
    if (mid < 0 || mid > 30) {
      localErrors.mid_marks = ['Midterm marks must be between 0 and 30.'];
    }
    if (final < 0 || final > 50) {
      localErrors.final_marks = ['Final exam marks must be between 0 and 50.'];
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setLoading(false);
      return;
    }

    const postData = {
      student: parseInt(formData.student),
      course: parseInt(formData.course),
      quiz_marks: quiz,
      mid_marks: mid,
      final_marks: final,
    };

    try {
      await api.post('/api/grades/', postData);
      navigate('/grades');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          setErrors({ non_field_errors: [data.slice(0, 150) || 'Internal Server Error'] });
        } else if (data.detail) {
          setErrors({ non_field_errors: [data.detail] });
        } else {
          setErrors(data);
        }
      } else {
        setErrors({ non_field_errors: ['Failed to connect to the backend server. Please verify the server is running.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '600px', textAlign: 'left' }}>
      <Link to="/grades" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Gradebook</Link>
      
      <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Enter Student Marks</h1>
      <p className="text-secondary mb-4">Input academic assessment scores and automatically generate total grades.</p>

      {errors.non_field_errors && (
        <div className="alert alert-danger mb-4" role="alert">
          {errors.non_field_errors.join(' ')}
        </div>
      )}

      <div className="card border shadow-sm p-4" style={{ borderRadius: '8px', background: '#fff' }}>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          
          <div>
            <label className="form-label fw-semibold text-secondary">Student *</label>
            <select 
              name="student" 
              value={formData.student} 
              onChange={handleChange}
              className={`form-select ${errors.student ? 'is-invalid' : ''}`}
              required
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.roll_no} - {s.name}</option>
              ))}
            </select>
            {errors.student && <div className="invalid-feedback">{errors.student.join(' ')}</div>}
          </div>

          <div>
            <label className="form-label fw-semibold text-secondary">Course *</label>
            <select 
              name="course" 
              value={formData.course} 
              onChange={handleChange}
              className={`form-select ${errors.course ? 'is-invalid' : ''}`}
              required
            >
              <option value="">-- Choose Course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
              ))}
            </select>
            {errors.course && <div className="invalid-feedback">{errors.course.join(' ')}</div>}
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold text-secondary">Quiz Marks (Max 20) *</label>
              <input 
                type="number" 
                name="quiz_marks" 
                value={formData.quiz_marks} 
                onChange={handleChange}
                step="0.01"
                min="0"
                max="20"
                className={`form-control ${errors.quiz_marks ? 'is-invalid' : ''}`}
                required
              />
              {errors.quiz_marks && <div className="invalid-feedback">{errors.quiz_marks.join(' ')}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold text-secondary">Mid Marks (Max 30) *</label>
              <input 
                type="number" 
                name="mid_marks" 
                value={formData.mid_marks} 
                onChange={handleChange}
                step="0.01"
                min="0"
                max="30"
                className={`form-control ${errors.mid_marks ? 'is-invalid' : ''}`}
                required
              />
              {errors.mid_marks && <div className="invalid-feedback">{errors.mid_marks.join(' ')}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold text-secondary">Final Marks (Max 50) *</label>
              <input 
                type="number" 
                name="final_marks" 
                value={formData.final_marks} 
                onChange={handleChange}
                step="0.01"
                min="0"
                max="50"
                className={`form-control ${errors.final_marks ? 'is-invalid' : ''}`}
                required
              />
              {errors.final_marks && <div className="invalid-feedback">{errors.final_marks.join(' ')}</div>}
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary flex-grow-1 py-2 fw-semibold"
              style={{ background: '#4f46e5', border: 'none' }}
            >
              {loading ? 'Submitting Marks...' : 'Submit Grade'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/grades')}
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

export default GradeEnter;
