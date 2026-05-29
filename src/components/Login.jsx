import React, { useState } from 'react';

export default function Login({ onLogin, lang, setLang, t }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t.invalidLogin);
      }
      
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* Top right language switch for accessibility */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <button 
          className="btn-lang"
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        >
          🌐 {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="login-card">
        <div className="login-logo">
          {/* Clinical medical shield/cross SVG */}
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
          <h2>{t.loginTitle}</h2>
          <p>{t.loginSubtitle}</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t.username}</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, resident"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t.password}</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', fontSize: '0.95rem' }}
            disabled={loading}
          >
            {loading ? t.loading : t.loginButton}
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
          <p>Demo Admin Credentials: <strong>admin / admin</strong></p>
          <p style={{ marginTop: '0.25rem' }}>Demo Resident Credentials: <strong>doctor / doctor</strong></p>
        </div>
      </div>
    </div>
  );
}
