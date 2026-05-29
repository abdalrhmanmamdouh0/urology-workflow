import React, { useState, useEffect } from 'react';
import { translations } from './utils/translations';
import Login from './components/Login';
import OperationBoard from './components/OperationBoard';
import PatientModal from './components/PatientModal';
import FollowUpView from './components/FollowUpView';
import UserManagement from './components/UserManagement';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('urology_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('urology_user') || 'null'));
  const [lang, setLang] = useState(localStorage.getItem('urology_lang') || 'en');
  const [view, setView] = useState('board'); // 'board', 'archive', 'follow-up', 'users'
  const [patients, setPatients] = useState([]);
  const [archivedPatients, setArchivedPatients] = useState([]);
  
  // Selection/Modal states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle HTML document RTL/LTR layout directions
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('urology_lang', lang);
  }, [lang]);

  // Load operational data when logged in
  useEffect(() => {
    if (token) {
      fetchPatients();
      if (user?.role === 'admin') {
        fetchArchivedPatients();
      }
    }
  }, [token, user]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPatients(data);
      } else {
        // Token might be expired, log out automatically
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to load active patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedPatients = async () => {
    try {
      const res = await fetch('/api/patients/archived', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setArchivedPatients(data);
      }
    } catch (err) {
      console.error('Failed to load archived patients');
    }
  };

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('urology_token', newToken);
    localStorage.setItem('urology_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('urology_token');
    localStorage.removeItem('urology_user');
    setView('board');
  };

  // Add or Edit Patient Callback
  const handleSavePatient = (savedPatient) => {
    if (showModal && selectedPatient) {
      // Edit mode: replace in state
      setPatients(prev => prev.map(p => p.id === savedPatient.id ? savedPatient : p));
      setArchivedPatients(prev => prev.map(p => p.id === savedPatient.id ? savedPatient : p));
    } else {
      // Add mode: append to active list
      setPatients(prev => [...prev, savedPatient]);
    }
    fetchPatients();
    if (user?.role === 'admin') fetchArchivedPatients();
  };

  // Delete Patient
  const handleDeletePatient = async (id) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPatients(prev => prev.filter(p => p.id !== id));
        setArchivedPatients(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Failed to delete patient record');
      }
    } catch (err) {
      alert('Network error deleting patient');
    }
  };

  // Archive Patient
  const handleArchivePatient = async (id) => {
    if (!confirm(t.confirmArchive)) return;

    try {
      const res = await fetch(`/api/patients/${id}/archive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Move from patients to archived
        const archived = patients.find(p => p.id === id);
        setPatients(prev => prev.filter(p => p.id !== id));
        if (archived) {
          setArchivedPatients(prev => [archived, ...prev]);
        }
        fetchPatients();
        fetchArchivedPatients();
      } else {
        alert('Failed to archive patient');
      }
    } catch (err) {
      alert('Network error archiving patient');
    }
  };

  // Unarchive Patient (Restore)
  const handleUnarchivePatient = async (id) => {
    if (!confirm(t.confirmRestore)) return;

    try {
      const res = await fetch(`/api/patients/${id}/unarchive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const restored = archivedPatients.find(p => p.id === id);
        setArchivedPatients(prev => prev.filter(p => p.id !== id));
        if (restored) {
          setPatients(prev => [...prev, restored]);
        }
        fetchPatients();
        fetchArchivedPatients();
      } else {
        alert('Failed to restore patient');
      }
    } catch (err) {
      alert('Network error restoring patient');
    }
  };

  // Fast In-Line Cell Update (Quick Edit Mode)
  const handleUpdatePatientField = async (patientId, fieldName, value) => {
    // Optimistic local state update for instant visual feedback!
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, [fieldName]: value };
      }
      return p;
    }));

    try {
      const target = patients.find(p => p.id === patientId);
      if (!target) return;
      
      const updatedData = { ...target, [fieldName]: value };
      
      const res = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      
      if (!res.ok) {
        // If error, reload database list to roll back optimistic state
        fetchPatients();
        console.error('Failed to sync cell update to backend.');
      }
    } catch (err) {
      fetchPatients();
      console.error('Network error during quick-edit sync.');
    }
  };

  // Translation helpers
  const t = translations[lang];

  // Auth Guard
  if (!token || !user) {
    return <Login onLogin={handleLogin} lang={lang} setLang={setLang} t={t} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="app-container">
      {/* ---------------- MAIN HEADER BANNER ---------------- */}
      <header className="main-header no-print">
        <div className="header-brand">
          {/* Urology logo icon */}
          <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"></path>
          </svg>
          <div className="brand-text">
            <h1>{t.appTitle}</h1>
            <p>{t.appSubtitle}</p>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            className={`tab-btn ${view === 'board' ? 'active' : ''}`}
            onClick={() => setView('board')}
          >
            📋 {t.activeList}
          </button>
          
          {isAdmin && (
            <button 
              className={`tab-btn ${view === 'archive' ? 'active' : ''}`}
              onClick={() => setView('archive')}
            >
              📥 {t.archivedPatients}
            </button>
          )}

          {isAdmin && (
            <button 
              className={`tab-btn ${view === 'users' ? 'active' : ''}`}
              onClick={() => setView('users')}
            >
              👥 {t.userManagement}
            </button>
          )}
        </div>

        {/* Clinician Pill & Language switches */}
        <div className="header-actions">
          <button 
            className="btn-lang" 
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          >
            🌐 {t.toggleLanguage}
          </button>

          <div className="profile-pill">
            <div className="profile-avatar">
              {user.name.charAt(4) || 'U'}
            </div>
            <div>
              <div className="profile-name">{user.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--neutral-500)' }}>
                {user.role === 'admin' ? t.roleAdmin : t.roleDoctor}
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout} title={t.logout}>
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- MAIN APP CONTENTS ---------------- */}
      <main className="main-content">
        
        {loading && view !== 'follow-up' && (
          <div className="text-center no-print" style={{ padding: '4rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--neutral-500)' }}>
              ⏳ {t.loading}
            </span>
          </div>
        )}

        {/* VIEW 1: WEEKLY ACTIVE BOARD */}
        {!loading && view === 'board' && (
          <OperationBoard
            patients={patients}
            onEditPatient={(patient) => {
              setSelectedPatient(patient);
              setShowModal(true);
            }}
            onDeletePatient={handleDeletePatient}
            onArchivePatient={handleArchivePatient}
            onViewFollowUp={(patient) => {
              setSelectedPatient(patient);
              setView('follow-up');
            }}
            onUpdatePatientField={handleUpdatePatientField}
            user={user}
            lang={lang}
            t={t}
          />
        )}

        {/* VIEW 2: ARCHIVED DISCHARGED PATIENTS LIST */}
        {!loading && view === 'archive' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📥 {t.archivedPatients}
            </h3>
            
            <div className="table-responsive">
              <table className="operation-table">
                <thead>
                  <tr>
                    <th>{t.serialShort}</th>
                    <th>{t.patientName}</th>
                    <th>{t.age}</th>
                    <th>{t.diagnosis}</th>
                    <th>{t.opName}</th>
                    <th>{t.surgeon}</th>
                    <th>{t.notes}</th>
                    <th>{t.status}</th>
                    <th>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedPatients.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
                        {t.noData}
                      </td>
                    </tr>
                  ) : (
                    archivedPatients.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 'bold' }}>{p.serial_number}</td>
                        <td style={{ fontWeight: 600 }}>{lang === 'en' ? p.name_en : p.name_ar}</td>
                        <td>{p.age}</td>
                        <td>{lang === 'en' ? p.diagnosis_en : p.diagnosis_ar}</td>
                        <td>{lang === 'en' ? p.operation_en : p.operation_ar}</td>
                        <td>{p.surgeon || '-'}</td>
                        <td>{lang === 'en' ? p.notes_en : p.notes_ar}</td>
                        <td>
                          <span className="status-badge status-discharged">{t.statusDischarged}</span>
                        </td>
                        <td>
                          <div className="action-cluster">
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--success)' }}
                              onClick={() => handleUnarchivePatient(p.id)}
                              title={t.confirmRestore}
                            >
                              📤 Restore
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeletePatient(p.id)}
                              title={t.confirmDelete}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: DEDICATED CLINICAL POST-OP FOLLOW-UP */}
        {view === 'follow-up' && selectedPatient && (
          <FollowUpView
            patient={selectedPatient}
            token={token}
            currentUser={user}
            onBack={() => {
              setSelectedPatient(null);
              setView('board');
              fetchPatients();
            }}
            lang={lang}
            t={t}
          />
        )}

        {/* VIEW 4: ADMIN ROLE MANAGEMENT */}
        {view === 'users' && isAdmin && (
          <UserManagement
            token={token}
            currentUser={user}
            t={t}
          />
        )}

      </main>

      {/* ---------------- PATIENT REGISTRATION/EDIT MODAL ---------------- */}
      {showModal && (
        <PatientModal
          patient={selectedPatient}
          token={token}
          onClose={() => {
            setShowModal(false);
            setSelectedPatient(null);
          }}
          onSave={handleSavePatient}
          t={t}
        />
      )}
    </div>
  );
}
