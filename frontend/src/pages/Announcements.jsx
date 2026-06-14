import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: user?.role === 'TEACHER' ? 'COURSE' : 'GLOBAL',
    course: ''
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/announcements/');
      setAnnouncements(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch announcements.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/courses/', { params: { page_size: 100 } });
      setCourses(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    if (user?.role === 'ADMIN' || user?.role === 'TEACHER') {
      fetchCourses();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      title: formData.title,
      content: formData.content,
      announcement_type: formData.announcement_type,
      course: formData.announcement_type === 'COURSE' ? parseInt(formData.course) || null : null
    };

    try {
      await api.post('/api/announcements/', payload);
      setSuccess('Announcement published successfully.');
      setFormData({
        title: '',
        content: '',
        announcement_type: user?.role === 'TEACHER' ? 'COURSE' : 'GLOBAL',
        course: ''
      });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await api.delete(`/api/announcements/${id}/`);
        fetchAnnouncements();
      } catch (err) {
        console.error(err);
        alert('Failed to delete announcement.');
      }
    }
  };

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column flex-md-row" style={{ background: 'var(--bg-color-main)', textAlign: 'left' }}>
      <Sidebar />

      <main className="flex-grow-1 p-3 p-md-4" style={{ overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h2 text-dark fw-bold mb-1">Notice Board & Announcements</h1>
            <p className="text-secondary mb-0">Stay updated with institute global notices and course information.</p>
          </div>
        </div>

        {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}
        {success && <div className="alert alert-success shadow-sm mb-4">{success}</div>}

        <div className="row g-4">
          {/* Creator Form - Visible to ADMIN or TEACHER */}
          {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '10px' }}>
                <h2 className="h5 text-dark fw-bold mb-3">Post New Announcement</h2>
                
                <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label fw-semibold text-secondary small">Announcement Title *</label>
                    <input 
                      type="text" 
                      name="title" 
                      value={formData.title} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="e.g. Midterm Exams Schedule" 
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label fw-semibold text-secondary small">Announcement Message *</label>
                    <textarea 
                      name="content" 
                      value={formData.content} 
                      onChange={handleChange} 
                      className="form-control" 
                      rows="4" 
                      placeholder="Enter detailed notice content here..." 
                      required
                    />
                  </div>

                  {user?.role === 'ADMIN' && (
                    <div>
                      <label className="form-label fw-semibold text-secondary small">Scope / Type *</label>
                      <select 
                        name="announcement_type" 
                        value={formData.announcement_type} 
                        onChange={handleChange} 
                        className="form-select"
                      >
                        <option value="GLOBAL">Global (All Users)</option>
                        <option value="COURSE">Course Specific</option>
                      </select>
                    </div>
                  )}

                  {(user?.role === 'TEACHER' || formData.announcement_type === 'COURSE') && (
                    <div>
                      <label className="form-label fw-semibold text-secondary small">Select Targeted Course *</label>
                      <select 
                        name="course" 
                        value={formData.course} 
                        onChange={handleChange} 
                        className="form-select"
                        required
                      >
                        <option value="">-- Choose Course --</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.course_code} - {c.course_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="btn btn-primary w-100 py-2.5 fw-bold mt-2 shadow-sm"
                    style={{ background: 'var(--primary-accent-color)', border: 'none', borderRadius: '6px' }}
                  >
                    {submitting ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Announcements Feed Listing */}
          <div className={(user?.role === 'ADMIN' || user?.role === 'TEACHER') ? "col-lg-7" : "col-12"}>
            <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: '10px' }}>
              <h2 className="h5 text-dark fw-bold mb-3">Latest Announcements</h2>

              {loading ? (
                <div className="text-center py-5 text-secondary">
                  <div className="spinner-border text-primary mb-3" role="status" />
                  <p className="mb-0">Loading announcements...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <h4 className="h6 text-dark fw-semibold mb-2">Notice Board Empty</h4>
                  <p className="mb-0">There are no notices or announcements posted at this time.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {announcements.map((ann) => (
                    <div 
                      key={ann.id} 
                      className={`p-3 border rounded h-100 bg-light position-relative`} 
                      style={{ borderLeft: `4px solid ${ann.announcement_type === 'GLOBAL' ? '#f59e0b' : 'var(--primary-accent-color)'} !important` }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className={`badge mb-1 me-2 ${ann.announcement_type === 'GLOBAL' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                            {ann.announcement_type === 'GLOBAL' ? '📢 Global Notice' : `📚 Course: ${ann.course_code}`}
                          </span>
                          <h3 className="h6 text-dark fw-bold mb-0">{ann.title}</h3>
                        </div>
                        
                        {(user?.role === 'ADMIN' || ann.created_by_name === user?.username) && (
                          <button 
                            onClick={() => handleDelete(ann.id)} 
                            className="btn btn-sm btn-outline-danger border-0 p-1 position-absolute top-0 end-0 m-2"
                            title="Delete Notice"
                          >
                            &times;
                          </button>
                        )}
                      </div>

                      <p className="text-secondary small mb-2" style={{ whiteSpace: 'pre-wrap' }}>{ann.content}</p>

                      <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2" style={{ fontSize: '0.75rem' }}>
                        <span className="text-secondary">Posted by: <strong>{ann.created_by_name}</strong></span>
                        <span className="text-secondary">{new Date(ann.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Announcements;
