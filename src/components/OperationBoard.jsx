import React, { useState } from 'react';
import { exportToExcel } from '../utils/excelExport';

export default function OperationBoard({ 
  patients, 
  onEditPatient, 
  onDeletePatient, 
  onArchivePatient, 
  onAddFollowUp, 
  onViewFollowUp,
  onUpdatePatientField,
  user, 
  lang, 
  t 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [surgeonFilter, setSurgeonFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [quickEdit, setQuickEdit] = useState(false);

  // Filter logic
  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      p.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.name_ar.includes(searchTerm);
      
    const matchesRoom = !roomFilter || p.room === roomFilter;
    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesSurgeon = !surgeonFilter || (p.surgeon && p.surgeon.toLowerCase().includes(surgeonFilter.toLowerCase()));
    const matchesDate = !dateFilter || p.operation_date === dateFilter;
    
    return matchesSearch && matchesRoom && matchesStatus && matchesSurgeon && matchesDate;
  });

  // Unique rooms, surgeons and dates for drop-downs
  const rooms = [...new Set(patients.map(p => p.room).filter(Boolean))];
  const surgeons = [...new Set(patients.map(p => p.surgeon).filter(Boolean))];
  const dates = [...new Set(patients.map(p => p.operation_date).filter(Boolean))];

  // Helper to cycle consultation options on-click (Quick Edit feature)
  const cycleConsult = async (patientId, fieldName, currentVal) => {
    if (!quickEdit) return;
    const options = ['Not Done', 'Done', 'Not Needed'];
    const nextIdx = (options.indexOf(currentVal) + 1) % options.length;
    const nextVal = options[nextIdx];
    onUpdatePatientField(patientId, fieldName, nextVal);
  };

  // Helper to toggle blood availability (Quick Edit feature)
  const toggleBlood = async (patientId, currentVal) => {
    if (!quickEdit) return;
    onUpdatePatientField(patientId, 'blood_available', currentVal === 1 ? 0 : 1);
  };

  const isAdmin = user.role === 'admin';

  return (
    <div>
      {/* ---------------- FILTER & SEARCH BAR ---------------- */}
      <div className="board-card no-print">
        <div className="dashboard-actions">
          {/* Main search input */}
          <div className="search-box">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input 
              type="text" 
              placeholder={t.search} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick-action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => onEditPatient(null)}>
              <svg style={{ width: '1.1rem', height: '1.1rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
              </svg>
              {t.addPatient}
            </button>
            <button className="btn btn-secondary" onClick={() => exportToExcel(filteredPatients, lang)}>
              📤 {t.exportExcel}
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              🖨️ {t.printA4}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="filter-bar">
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-500)' }}>
            {t.filterBy}:
          </span>
          
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t.status} ({t.all})</option>
            <option value="Waiting">{t.statusWaiting}</option>
            <option value="Booked">{t.statusBooked}</option>
            <option value="Done">{t.statusDone}</option>
            <option value="Postponed">{t.statusPostponed}</option>
            <option value="Cancelled">{t.statusCancelled}</option>
            <option value="Discharged">{t.statusDischarged}</option>
          </select>

          <select 
            className="filter-select"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          >
            <option value="">{t.operationRoom} ({t.all})</option>
            {rooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select 
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="">{t.operationDate} ({t.all})</option>
            {dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            className="filter-select"
            value={surgeonFilter}
            onChange={(e) => setSurgeonFilter(e.target.value)}
          >
            <option value="">{t.surgeon} ({t.all})</option>
            {surgeons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Quick Edit Toggle Switch */}
          <label className="order-checkbox-label" style={{ marginLeft: 'auto' }}>
            <input 
              type="checkbox" 
              checked={quickEdit}
              onChange={(e) => setQuickEdit(e.target.checked)}
            />
            <span style={{ fontWeight: 600 }}>⚡ {t.quickEditMode}</span>
          </label>
        </div>
      </div>

      {quickEdit && (
        <div className="quick-edit-banner no-print">
          <div>
            <strong>⚡ {t.quickEditMode} {t.done}</strong>
            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.15rem' }}>
              {t.quickEditDesc}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setQuickEdit(false)}>
            &times; Close
          </button>
        </div>
      )}

      {/* ---------------- PRINT ONLY MEDICAL SHEET HEADER ---------------- */}
      <div className="print-only-header">
        <h2>{t.printHeaderTitle}</h2>
        <p>{t.printDepartment} | {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* ---------------- MAIN BOARD TABLE ---------------- */}
      <div className="table-responsive">
        <table className="operation-table">
          <thead>
            <tr>
              <th className="sticky-col">{t.serialShort}</th>
              <th className="sticky-col" style={{ minWidth: '150px' }}>{t.patientName}</th>
              <th style={{ width: '50px' }}>{t.age}</th>
              <th style={{ width: '55px' }}>{t.weight}</th>
              <th style={{ minWidth: '150px' }}>{t.diagnosis}</th>
              <th style={{ minWidth: '150px' }}>{t.opName}</th>
              <th style={{ width: '70px' }}>{t.operationRoom}</th>
              <th style={{ width: '80px' }}>{t.surgeon}</th>
              <th style={{ minWidth: '120px' }}>{t.blood}</th>
              <th style={{ minWidth: '95px' }}>{t.viralState}</th>
              <th style={{ minWidth: '180px' }}>{t.consultations}</th>
              <th>{t.notes}</th>
              <th style={{ width: '90px' }}>{t.status}</th>
              <th className="no-print" style={{ width: '130px' }}>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="14" className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
                  {t.noData}
                </td>
              </tr>
            ) : (
              filteredPatients.map((p, index) => {
                const isPediatric = p.age < 18;
                return (
                  <tr key={p.id}>
                    {/* 1. Serial Number */}
                    <td className="sticky-col" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                      {p.serial_number}
                    </td>

                    {/* 2. Patient Name */}
                    <td className="sticky-col" style={{ fontWeight: 600 }}>
                      <div>{lang === 'en' ? p.name_en : p.name_ar}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', fontWeight: 'normal' }}>
                        {lang === 'en' ? p.name_ar : p.name_en}
                      </div>
                    </td>

                    {/* 3. Age */}
                    <td className="text-center">{p.age}</td>

                    {/* 4. Weight */}
                    <td className="text-center">{p.weight ? `${p.weight} ${t.kg}` : '-'}</td>

                    {/* 5. Diagnosis */}
                    <td>{lang === 'en' ? p.diagnosis_en : p.diagnosis_ar}</td>

                    {/* 6. Operation Name */}
                    <td style={{ fontWeight: 500 }}>{lang === 'en' ? p.operation_en : p.operation_ar}</td>

                    {/* 7. Room */}
                    <td className="text-center">
                      {quickEdit ? (
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ padding: '0.2rem', fontSize: '0.75rem', width: '60px', textAlign: 'center' }}
                          value={p.room || ''}
                          onChange={(e) => onUpdatePatientField(p.id, 'room', e.target.value)}
                        />
                      ) : (
                        p.room || '-'
                      )}
                    </td>

                    {/* 8. Surgeon */}
                    <td className="text-center">
                      {quickEdit ? (
                        <input 
                          type="text" 
                          className="form-control" 
                          style={{ padding: '0.2rem', fontSize: '0.75rem', width: '80px', textAlign: 'center' }}
                          value={p.surgeon || ''}
                          onChange={(e) => onUpdatePatientField(p.id, 'surgeon', e.target.value)}
                        />
                      ) : (
                        p.surgeon || '-'
                      )}
                    </td>

                    {/* 9. Blood Information */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.75rem' }}>
                        <div>Hb: <strong>{p.hb_level ? `${p.hb_level} g` : '-'}</strong></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span>Gp: <strong>{p.blood_type || '-'}</strong></span>
                          {/* Quick edit or standard display of blood available */}
                          <span 
                            onClick={() => toggleBlood(p.id, p.blood_available)}
                            className={`status-badge ${p.blood_available === 1 ? 'status-done' : 'status-cancelled'}`}
                            style={{ 
                              padding: '0.1rem 0.3rem', 
                              fontSize: '0.65rem',
                              cursor: quickEdit ? 'pointer' : 'default'
                            }}
                          >
                            {p.blood_available === 1 ? t.yes : t.no}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 10. Viral Status */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.7rem' }}>
                        <div>B: <span style={{ color: p.hbv === 'Positive' ? 'var(--danger)' : p.hbv === 'Pending' ? 'var(--warning)' : 'inherit', fontWeight: 'bold' }}>{p.hbv}</span></div>
                        <div>C: <span style={{ color: p.hcv === 'Positive' ? 'var(--danger)' : p.hcv === 'Pending' ? 'var(--warning)' : 'inherit', fontWeight: 'bold' }}>{p.hcv}</span></div>
                        <div>HIV: <span style={{ color: p.hiv === 'Positive' ? 'var(--danger)' : p.hiv === 'Pending' ? 'var(--warning)' : 'inherit', fontWeight: 'bold' }}>{p.hiv}</span></div>
                      </div>
                    </td>

                    {/* 11. Pre-op Consultations */}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', fontSize: '0.7rem' }}>
                        {/* Cardio */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{t.cardiology}</span>
                          <span 
                            className={`consult-badge ${p.cons_cardiology === 'Done' ? 'consult-done' : p.cons_cardiology === 'Not Needed' ? 'consult-notneeded' : 'consult-notdone'}`}
                            onClick={() => cycleConsult(p.id, 'cons_cardiology', p.cons_cardiology)}
                          >
                            {p.cons_cardiology === 'Done' ? '✓' : p.cons_cardiology === 'Not Needed' ? 'N' : '✗'}
                          </span>
                        </div>
                        {/* Chest */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{t.chest}</span>
                          <span 
                            className={`consult-badge ${p.cons_chest === 'Done' ? 'consult-done' : p.cons_chest === 'Not Needed' ? 'consult-notneeded' : 'consult-notdone'}`}
                            onClick={() => cycleConsult(p.id, 'cons_chest', p.cons_chest)}
                          >
                            {p.cons_chest === 'Done' ? '✓' : p.cons_chest === 'Not Needed' ? 'N' : '✗'}
                          </span>
                        </div>
                        {/* Anesthesia */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{t.anesthesia}</span>
                          <span 
                            className={`consult-badge ${p.cons_anesthesia === 'Done' ? 'consult-done' : p.cons_anesthesia === 'Not Needed' ? 'consult-notneeded' : 'consult-notdone'}`}
                            onClick={() => cycleConsult(p.id, 'cons_anesthesia', p.cons_anesthesia)}
                          >
                            {p.cons_anesthesia === 'Done' ? '✓' : p.cons_anesthesia === 'Not Needed' ? 'N' : '✗'}
                          </span>
                        </div>
                        {/* Internal medicine */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{t.internalMedicine}</span>
                          <span 
                            className={`consult-badge ${p.cons_internal === 'Done' ? 'consult-done' : p.cons_internal === 'Not Needed' ? 'consult-notneeded' : 'consult-notdone'}`}
                            onClick={() => cycleConsult(p.id, 'cons_internal', p.cons_internal)}
                          >
                            {p.cons_internal === 'Done' ? '✓' : p.cons_internal === 'Not Needed' ? 'N' : '✗'}
                          </span>
                        </div>
                        {/* Pediatric (Age < 18 only) */}
                        {isPediatric && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} title="Pediatric <18yrs Only">
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{t.pediatric}</span>
                            <span 
                              className={`consult-badge ${p.cons_pediatric === 'Done' ? 'consult-done' : p.cons_pediatric === 'Not Needed' ? 'consult-notneeded' : 'consult-notdone'}`}
                              onClick={() => cycleConsult(p.id, 'cons_pediatric', p.cons_pediatric)}
                              style={{ border: '1px solid var(--danger)' }}
                            >
                              {p.cons_pediatric === 'Done' ? '✓' : p.cons_pediatric === 'Not Needed' ? 'N' : '✗'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 12. Notes */}
                    <td style={{ fontSize: '0.75rem' }}>
                      {quickEdit ? (
                        <textarea 
                          className="form-control" 
                          rows="1"
                          style={{ padding: '0.2rem', fontSize: '0.75rem' }}
                          value={lang === 'en' ? (p.notes_en || '') : (p.notes_ar || '')}
                          onChange={(e) => onUpdatePatientField(p.id, lang === 'en' ? 'notes_en' : 'notes_ar', e.target.value)}
                        />
                      ) : (
                        lang === 'en' ? p.notes_en : p.notes_ar
                      )}
                    </td>

                    {/* 13. Status Badge */}
                    <td className="text-center">
                      {quickEdit ? (
                        <select 
                          className="form-control"
                          style={{ padding: '0.15rem 0.35rem', fontSize: '0.75rem', width: '90px' }}
                          value={p.status}
                          onChange={(e) => onUpdatePatientField(p.id, 'status', e.target.value)}
                        >
                          <option value="Waiting">{t.statusWaiting}</option>
                          <option value="Booked">{t.statusBooked}</option>
                          <option value="Done">{t.statusDone}</option>
                          <option value="Postponed">{t.statusPostponed}</option>
                          <option value="Cancelled">{t.statusCancelled}</option>
                          <option value="Discharged">{t.statusDischarged}</option>
                        </select>
                      ) : (
                        <span className={`status-badge status-${p.status.toLowerCase()}`}>
                          {p.status === 'Waiting' ? t.statusWaiting :
                           p.status === 'Booked' ? t.statusBooked :
                           p.status === 'Done' ? t.statusDone :
                           p.status === 'Postponed' ? t.statusPostponed :
                           p.status === 'Cancelled' ? t.statusCancelled : t.statusDischarged}
                        </span>
                      )}
                    </td>

                    {/* 14. Action Cluster (Buttons) */}
                    <td className="no-print">
                      <div className="action-cluster">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onEditPatient(p)}
                          title={t.editPatient}
                        >
                          📝
                        </button>
                        
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => onViewFollowUp(p)}
                          title={t.followUp}
                        >
                          🩺
                        </button>

                        {/* Admin-only destructive controls */}
                        {isAdmin && (
                          <>
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--warning)' }}
                              onClick={() => onArchivePatient(p.id)}
                              title={t.viewArchive}
                            >
                              📥
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => onDeletePatient(p.id)}
                              title={t.confirmDelete}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                        
                        {/* Resident control: If discharged, give button to quickly remove from active list */}
                        {!isAdmin && p.status === 'Discharged' && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--neutral-500)' }}
                            onClick={() => onArchivePatient(p.id)}
                            title="Remove from Active List"
                          >
                            ✗
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          
          {/* Print only: Handwritten Addition spaces */}
          <tbody className="print-handwritten-rows">
            {/* Generates blank structured rows for clinic manual writes */}
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={`blank-${i}`} className="print-handwritten-row">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div>Hb:</div>
                    <div>Gp:</div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    <div>B:</div>
                    <div>C:</div>
                    <div>HIV:</div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span>Cardio: [ ]</span>
                    <span>Chest: [ ]</span>
                    <span>Anes: [ ]</span>
                  </div>
                </td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-handwritten-title print-only">
        {t.handwrittenRowLabel}
      </div>
    </div>
  );
}
