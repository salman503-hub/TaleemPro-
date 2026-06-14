import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Semesters() {
  const [semesters, setSemesters] = useState([]);
  const [newSemName, setNewSemName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/api/courses/semesters/');
      if (response.data && Array.isArray(response.data.results)) {
        setSemesters(response.data.results);
      } else if (Array.isArray(response.data)) {
        setSemesters(response.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load semesters.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSemName.trim()) return;

    setFormLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/api/courses/semesters/', { name: newSemName.trim() });
      setSuccessMsg('Semester added successfully!');
      setNewSemName('');
      fetchSemesters();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.name?.join(' ') || 'Failed to add semester.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;

    setFormLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.put(`/api/courses/semesters/${id}/`, { name: editingName.trim() });
      setSuccessMsg('Semester updated successfully!');
      setEditingId(null);
      setEditingName('');
      fetchSemesters();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.name?.join(' ') || 'Failed to update semester.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete semester "${name}"?`)) {
      try {
        await api.delete(`/api/courses/semesters/${id}/`);
        setSuccessMsg('Semester deleted successfully.');
        fetchSemesters();
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to delete semester.');
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Link to="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>&larr; Back to Dashboard</Link>
          <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '2.25rem', color: '#1e293b' }}>Semesters Management</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Configure academic semesters for automatic enrollment.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Semesters List */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>Loading...</div>
          ) : semesters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>No semesters defined.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Semester Name</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {semesters.map((sem) => {
                    const isEditing = sem.id === editingId;
                    return (
                      <tr key={sem.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '500', color: '#334155' }}>
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editingName} 
                              onChange={(e) => setEditingName(e.target.value)} 
                              style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
                            />
                          ) : (
                            sem.name
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleUpdate(sem.id)}
                                style={{ padding: '0.3rem 0.6rem', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', marginRight: '0.5rem' }}
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => { setEditingId(null); setEditingName(''); }}
                                style={{ padding: '0.3rem 0.6rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem' }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => { setEditingId(sem.id); setEditingName(sem.name); }}
                                style={{ padding: '0.3rem 0.6rem', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem', marginRight: '0.5rem' }}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(sem.id, sem.name)}
                                style={{ padding: '0.3rem 0.6rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem' }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Form */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.15rem' }}>Add Semester</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Semester Name *</label>
              <input 
                type="text"
                placeholder="e.g. 1st, 2nd, etc."
                value={newSemName}
                onChange={(e) => setNewSemName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                required
              />
            </div>
            <button 
              type="submit"
              disabled={formLoading}
              style={{ padding: '0.65rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: formLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
            >
              {formLoading ? 'Adding...' : 'Add Semester'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}


export default Semesters;
