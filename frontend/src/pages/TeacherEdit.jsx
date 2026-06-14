import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';

function TeacherEdit() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await api.get(`/api/teachers/${id}/`);
        setFormData({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || '',
          department: response.data.department,
          designation: response.data.designation,
        });
      } catch (err) {
        console.error(err);
        setErrors({ non_field_errors: ['Failed to load teacher details.'] });
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

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
    setSaving(true);
    setErrors({});
    
    try {
      await api.put(`/api/teachers/${id}/`, formData);
      navigate('/teachers');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ non_field_errors: ['Failed to save teacher changes.'] });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-secondary">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading teacher details...</p>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: '600px', textAlign: 'left' }}>
      <Link to="/teachers" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5' }}>&larr; Back to Directory</Link>
      
      <h1 className="h2 mt-2 mb-1 text-dark fw-bold">Edit Teacher Details</h1>
      <p className="text-secondary mb-4">Modify and save updates to faculty register details.</p>

      {errors.non_field_errors && (
        <div className="alert alert-danger mb-4" role="alert">
          {errors.non_field_errors.join(' ')}
        </div>
      )}

      <div className="card border shadow-sm p-4" style={{ borderRadius: '8px', background: '#fff' }}>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          
          <div>
            <label className="form-label fw-semibold text-secondary">Full Name *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              required
            />
            {errors.name && <div className="invalid-feedback">{errors.name.join(' ')}</div>}
          </div>

          <div>
            <label className="form-label fw-semibold text-secondary">Email Address *</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              required
            />
            {errors.email && <div className="invalid-feedback">{errors.email.join(' ')}</div>}
          </div>

          <div>
            <label className="form-label fw-semibold text-secondary">Phone Number</label>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange}
              className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
            />
            {errors.phone && <div className="invalid-feedback">{errors.phone.join(' ')}</div>}
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold text-secondary">Department *</label>
              <input 
                type="text" 
                name="department" 
                value={formData.department} 
                onChange={handleChange}
                className={`form-control ${errors.department ? 'is-invalid' : ''}`}
                required
              />
              {errors.department && <div className="invalid-feedback">{errors.department.join(' ')}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold text-secondary">Designation *</label>
              <input 
                type="text" 
                name="designation" 
                value={formData.designation} 
                onChange={handleChange}
                className={`form-control ${errors.designation ? 'is-invalid' : ''}`}
                required
              />
              {errors.designation && <div className="invalid-feedback">{errors.designation.join(' ')}</div>}
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button 
              type="submit" 
              disabled={saving}
              className="btn btn-primary flex-grow-1 py-2 fw-semibold"
              style={{ background: '#4f46e5', border: 'none' }}
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/teachers')}
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

export default TeacherEdit;
