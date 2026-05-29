import React, { useState, useEffect } from 'react';

export default function UserManagement({ token, currentUser, t }) {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('doctor'); // default
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Network error loading users');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!username || !password || !name || !role) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, name, role })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(`User ${name} added successfully!`);
        setUsername('');
        setPassword('');
        setName('');
        setRole('doctor');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userFullName) => {
    if (userId === currentUser.id) {
      alert(t.error); // Cannot delete self
      return;
    }
    
    if (!confirm(`${t.deleteUserConfirm} (${userFullName})`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('User account removed');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error deleting user');
    }
  };

  return (
    <div className="user-admin-layout">
      {/* Creation form sidebar */}
      <div className="patient-info-sidebar">
        <h3 className="sidebar-heading">{t.addAccount}</h3>
        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{success}</div>}
        
        <form onSubmit={handleAddUser}>
          <div className="form-group">
            <label>{t.fullName}</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Ahmed Ali"
              required
            />
          </div>

          <div className="form-group">
            <label>{t.username}</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ahmed.ali"
              required
            />
          </div>

          <div className="form-group">
            <label>{t.password}</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>{t.role}</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="doctor">{t.roleDoctor}</option>
              <option value="admin">{t.roleAdmin}</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? t.loading : t.addAccount}
          </button>
        </form>
      </div>

      {/* User listing */}
      <div>
        <h3 style={{ marginBottom: '1rem' }}>{t.userManagement}</h3>
        <div className="user-card-list">
          {users.map(u => (
            <div key={u.id} className="user-card">
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{u.name}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>@{u.username}</p>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className={`status-badge ${u.role === 'admin' ? 'status-booked' : 'status-waiting'}`} style={{ textTransform: 'capitalize' }}>
                    {u.role === 'admin' ? t.roleAdmin : t.roleDoctor}
                  </span>
                </div>
              </div>
              
              {/* Delete button (disabled for active user) */}
              {u.id !== currentUser.id && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteUser(u.id, u.name)}
                >
                  <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
