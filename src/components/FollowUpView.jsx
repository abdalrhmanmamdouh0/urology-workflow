import React, { useState, useEffect } from 'react';

export default function FollowUpView({ patient, token, currentUser, onBack, lang, t }) {
  const [followUps, setFollowUps] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Follow-up note state matching database schema
  const [noteData, setNoteData] = useState({
    post_op_day: 0,
    general_condition: 'Stable',
    consciousness: 'Fully Conscious',
    pain_score: 0,
    fever: 'None',
    
    bp: '',
    pulse: '',
    temperature: '',
    rr: '',
    spo2: '',
    
    urine_output: 'Adequate',
    hematuria: 'None',
    foley_catheter: 'In-situ',
    catheter_color_output: 'Clear Yellow',
    drain_output: 'None',
    dj_stent: 'In-situ',
    nephrostomy_tube: 'N/A',
    wound_condition: 'Healthy / Dressing Clean',
    scrotal_status: 'N/A',
    renal_function: '',
    infection_signs: 'None',
    
    oral_intake: 'Full Oral Intake',
    bowel_movement: 'Passed Flatus / Stool',
    ambulation: 'Mobilized',
    labs: '',
    imaging: '',
    complications: 'None',
    assessment: '',
    plan: '',
    orders_needed: []
  });

  useEffect(() => {
    fetchFollowUps();
  }, [patient.id]);

  const fetchFollowUps = async () => {
    try {
      const res = await fetch(`/api/patients/${patient.id}/follow-ups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFollowUps(data);
      }
    } catch (err) {
      console.error('Failed to fetch follow-ups');
    }
  };

  const handleOrderCheckboxChange = (orderKey) => {
    setNoteData(prev => {
      const currentOrders = [...prev.orders_needed];
      if (currentOrders.includes(orderKey)) {
        return { ...prev, orders_needed: currentOrders.filter(k => k !== orderKey) };
      } else {
        return { ...prev, orders_needed: [...currentOrders, orderKey] };
      }
    });
  };

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/patients/${patient.id}/follow-ups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Postoperative follow-up note added successfully!');
        setShowAddForm(false);
        // Reset form data
        setNoteData({
          post_op_day: 0,
          general_condition: 'Stable',
          consciousness: 'Fully Conscious',
          pain_score: 0,
          fever: 'None',
          bp: '',
          pulse: '',
          temperature: '',
          rr: '',
          spo2: '',
          urine_output: 'Adequate',
          hematuria: 'None',
          foley_catheter: 'In-situ',
          catheter_color_output: 'Clear Yellow',
          drain_output: 'None',
          dj_stent: 'In-situ',
          nephrostomy_tube: 'N/A',
          wound_condition: 'Healthy / Dressing Clean',
          scrotal_status: 'N/A',
          renal_function: '',
          infection_signs: 'None',
          oral_intake: 'Full Oral Intake',
          bowel_movement: 'Passed Flatus / Stool',
          ambulation: 'Mobilized',
          labs: '',
          imaging: '',
          complications: 'None',
          assessment: '',
          plan: '',
          orders_needed: []
        });
        fetchFollowUps();
      } else {
        setError(data.error || 'Failed to submit follow-up note.');
      }
    } catch (err) {
      setError('A network error occurred while submitting.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this postoperative note?')) return;

    try {
      const res = await fetch(`/api/follow-ups/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchFollowUps();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete follow-up note.');
      }
    } catch (err) {
      alert('Network error deleting follow-up note.');
    }
  };

  return (
    <div className="followup-layout">
      {/* ---------------- SIDEPANEL: PATIENT DETAILS HIGHLIGHTS ---------------- */}
      <div className="patient-info-sidebar">
        <button className="btn btn-secondary btn-sm mb-4" onClick={onBack} style={{ width: '100%' }}>
          ← {t.goBack}
        </button>
        
        <h3 className="sidebar-heading" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          {lang === 'en' ? patient.name_en : patient.name_ar}
        </h3>
        
        <div className="info-pair">
          <span className="info-label">{t.serialFull}</span>
          <span className="info-value">{patient.serial_number}</span>
        </div>
        <div className="info-pair">
          <span className="info-label">{t.age}</span>
          <span className="info-value">{patient.age} {t.years}</span>
        </div>
        <div className="info-pair">
          <span className="info-label">{t.weight}</span>
          <span className="info-value">{patient.weight ? `${patient.weight} kg` : '-'}</span>
        </div>
        <div className="info-pair">
          <span className="info-label">{t.hbLevel}</span>
          <span className="info-value">{patient.hb_level ? `${patient.hb_level} g/dL` : '-'}</span>
        </div>
        <div className="info-pair">
          <span className="info-label">{t.bloodType}</span>
          <span className="info-value">{patient.blood_type || '-'}</span>
        </div>
        
        <div style={{ margin: '1rem 0', borderTop: '1px solid var(--neutral-200)' }}></div>
        
        <div className="mb-2">
          <div className="info-label" style={{ marginBottom: '0.2rem' }}>{t.diagnosis}</div>
          <div className="info-value" style={{ fontSize: '0.9rem' }}>
            {lang === 'en' ? patient.diagnosis_en : patient.diagnosis_ar}
          </div>
        </div>

        <div className="mb-2">
          <div className="info-label" style={{ marginBottom: '0.2rem' }}>{t.opName}</div>
          <div className="info-value" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
            {lang === 'en' ? patient.operation_en : patient.operation_ar}
          </div>
        </div>

        <div className="info-pair">
          <span className="info-label">{t.surgeon}</span>
          <span className="info-value">{patient.surgeon || '-'}</span>
        </div>
        
        <div className="info-pair">
          <span className="info-label">{t.status}</span>
          <span className={`status-badge status-${patient.status.toLowerCase()}`}>
            {patient.status}
          </span>
        </div>
      </div>

      {/* ---------------- MAIN: TIMELINE & NOTE ADDITION ---------------- */}
      <div className="followup-main">
        
        {/* Toggle to create a new postoperative note */}
        {!showAddForm ? (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)} style={{ alignSelf: 'flex-start' }}>
            ➕ {t.addFollowUp}
          </button>
        ) : (
          <div className="board-card" style={{ animation: 'modalEnter 0.25s ease', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '0.5rem' }}>
              <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🩺 {t.addFollowUp}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>
                {t.cancel}
              </button>
            </div>

            {error && <div className="login-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

            <form onSubmit={handleSubmitNote}>
              {/* POD day number selection */}
              <div className="form-group" style={{ maxWidth: '200px', marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 'bold' }}>{t.postOpDay} *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="status-badge status-booked" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                    {t.day} {noteData.post_op_day}
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    value={noteData.post_op_day}
                    onChange={(e) => setNoteData(prev => ({ ...prev, post_op_day: parseInt(e.target.value) || 0 }))}
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* SECTION A: GENERAL CONDITION */}
              <div className="note-section-box">
                <h4>{t.secGeneral}</h4>
                <div className="note-form-grid">
                  <div className="form-group">
                    <label>{t.generalCondition}</label>
                    <select 
                      className="form-control" 
                      value={noteData.general_condition} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, general_condition: e.target.value }))}
                    >
                      <option value="Stable">Stable</option>
                      <option value="Critical">Critical</option>
                      <option value="Improving">Improving</option>
                      <option value="Guarded">Guarded</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.consciousness}</label>
                    <select 
                      className="form-control" 
                      value={noteData.consciousness} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, consciousness: e.target.value }))}
                    >
                      <option value="Fully Conscious">Fully Conscious</option>
                      <option value="Somnolent / Drowsy">Somnolent / Drowsy</option>
                      <option value="Confused">Confused</option>
                      <option value="Sedated / Intubated">Sedated / Intubated</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.painScore}: <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{noteData.pain_score}</strong></label>
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      className="form-control" 
                      style={{ padding: '0', cursor: 'pointer' }}
                      value={noteData.pain_score} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, pain_score: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.fever}</label>
                    <select 
                      className="form-control" 
                      value={noteData.fever} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, fever: e.target.value }))}
                    >
                      <option value="None">None</option>
                      <option value="Mild (38.0 - 38.5°C)">Mild (38.0 - 38.5°C)</option>
                      <option value="High (&gt;38.5°C)">High (&gt;38.5°C)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: VITAL SIGNS */}
              <div className="note-section-box">
                <h4>{t.secVitals}</h4>
                <div className="note-form-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  <div className="form-group">
                    <label>{t.bp}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 120/80" 
                      value={noteData.bp}
                      onChange={(e) => setNoteData(prev => ({ ...prev, bp: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.pulse}</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="bpm" 
                      value={noteData.pulse}
                      onChange={(e) => setNoteData(prev => ({ ...prev, pulse: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.temp}</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="form-control" 
                      placeholder="°C" 
                      value={noteData.temperature}
                      onChange={(e) => setNoteData(prev => ({ ...prev, temperature: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>RR</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="bpm" 
                      value={noteData.rr}
                      onChange={(e) => setNoteData(prev => ({ ...prev, rr: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>SpO2</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="%" 
                      value={noteData.spo2}
                      onChange={(e) => setNoteData(prev => ({ ...prev, spo2: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: UROLOGY SPECIFIC ITEMS */}
              <div className="note-section-box">
                <h4>{t.secUrology}</h4>
                <div className="note-form-grid">
                  <div className="form-group">
                    <label>{t.urineOutput}</label>
                    <select 
                      className="form-control" 
                      value={noteData.urine_output} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, urine_output: e.target.value }))}
                    >
                      <option value="Adequate">Adequate</option>
                      <option value="Oliguria (&lt;400ml/24h)">Oliguria (&lt;400ml/24h)</option>
                      <option value="Anuria (&lt;100ml/24h)">Anuria (&lt;100ml/24h)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.hematuria}</label>
                    <select 
                      className="form-control" 
                      value={noteData.hematuria} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, hematuria: e.target.value }))}
                    >
                      <option value="None">None</option>
                      <option value="Mild Hematuria / Rose urine">Mild Hematuria / Rose urine</option>
                      <option value="Gross Hematuria / Dark red">Gross Hematuria / Dark red</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.foleyCatheter}</label>
                    <select 
                      className="form-control" 
                      value={noteData.foley_catheter} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, foley_catheter: e.target.value }))}
                    >
                      <option value="In-situ">In-situ</option>
                      <option value="Removed Today">Removed Today</option>
                      <option value="CBI (Continuous Bladder Irrigation)">CBI (Continuous Bladder Irrigation)</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.catheterColor}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Clear yellow, Mildly bloody" 
                      value={noteData.catheter_color_output}
                      onChange={(e) => setNoteData(prev => ({ ...prev, catheter_color_output: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.drainOutput}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 50ml, serous" 
                      value={noteData.drain_output}
                      onChange={(e) => setNoteData(prev => ({ ...prev, drain_output: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.djStent}</label>
                    <select 
                      className="form-control" 
                      value={noteData.dj_stent} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, dj_stent: e.target.value }))}
                    >
                      <option value="In-situ">In-situ</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.nephrostomy}</label>
                    <select 
                      className="form-control" 
                      value={noteData.nephrostomy_tube} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, nephrostomy_tube: e.target.value }))}
                    >
                      <option value="N/A">N/A</option>
                      <option value="In-situ (Draining clear)">In-situ (Draining clear)</option>
                      <option value="In-situ (Bloody)">In-situ (Bloody)</option>
                      <option value="Blocked / Not draining">Blocked / Not draining</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.woundCondition}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Healthy, dry, dressing changed" 
                      value={noteData.wound_condition}
                      onChange={(e) => setNoteData(prev => ({ ...prev, wound_condition: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.scrotalStatus}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Normal, Mild swelling (for hydrocele/varicocele)" 
                      value={noteData.scrotal_status}
                      onChange={(e) => setNoteData(prev => ({ ...prev, scrotal_status: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.renalFunction}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Creatinine: 1.1 mg/dL" 
                      value={noteData.renal_function}
                      onChange={(e) => setNoteData(prev => ({ ...prev, renal_function: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>{t.infectionSigns}</label>
                    <select 
                      className="form-control" 
                      value={noteData.infection_signs} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, infection_signs: e.target.value }))}
                    >
                      <option value="None">None (Apyrexial, hemodynamically stable)</option>
                      <option value="SIRS criteria met (UTI suspect)">SIRS criteria met (UTI suspect)</option>
                      <option value="Sepsis / Under treatment">Sepsis / Under treatment</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION D: RECOVERY & NOTES */}
              <div className="note-section-box">
                <h4>{t.secPostOp}</h4>
                <div className="note-form-grid">
                  <div className="form-group">
                    <label>{t.oralIntake}</label>
                    <select 
                      className="form-control" 
                      value={noteData.oral_intake} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, oral_intake: e.target.value }))}
                    >
                      <option value="Full Oral Intake">Full Oral Intake</option>
                      <option value="Sips of water only">Sips of water only</option>
                      <option value="Soft diet">Soft diet</option>
                      <option value="NPO (Nil per os)">NPO (Nil per os)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.bowelMovement}</label>
                    <select 
                      className="form-control" 
                      value={noteData.bowel_movement} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, bowel_movement: e.target.value }))}
                    >
                      <option value="Passed Flatus / Stool">Passed Flatus / Stool</option>
                      <option value="No Flatus yet">No Flatus yet</option>
                      <option value="Abdomen distended / sluggish">Abdomen distended / sluggish</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>{t.ambulation}</label>
                    <select 
                      className="form-control" 
                      value={noteData.ambulation} 
                      onChange={(e) => setNoteData(prev => ({ ...prev, ambulation: e.target.value }))}
                    >
                      <option value="Mobilized">Mobilized (walking around corridor)</option>
                      <option value="Assisted Mobilization">Assisted Mobilization</option>
                      <option value="Bed bound / Rest">Bed bound / Rest</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2 mb-3" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>{t.assessment} *</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="Subjective & Objective assessment summary..."
                      value={noteData.assessment}
                      onChange={(e) => setNoteData(prev => ({ ...prev, assessment: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.plan} *</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="Detailed clinical instructions..."
                      value={noteData.plan}
                      onChange={(e) => setNoteData(prev => ({ ...prev, plan: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION E: ORDERS NEEDED (CHECKBOX LIST) */}
              <div className="note-section-box" style={{ border: '1px dashed var(--primary)' }}>
                <h4 style={{ color: 'var(--primary)' }}>📋 {t.ordersTitle}</h4>
                
                <div className="orders-grid">
                  {[
                    { key: 'CBC', label: t.orderCBC },
                    { key: 'Creatinine', label: t.orderCreatinine },
                    { key: 'Electrolytes', label: t.orderElectrolytes },
                    { key: 'Urine analysis', label: t.orderUrine },
                    { key: 'Imaging', label: t.orderImaging },
                    { key: 'Antibiotics', label: t.orderAntibiotics },
                    { key: 'IV fluids', label: t.orderIVFluids },
                    { key: 'Pain control', label: t.orderPain },
                    { key: 'Drain plan', label: t.orderDrainPlan },
                    { key: 'Catheter removal plan', label: t.orderCatheterRemoval },
                    { key: 'Discharge plan', label: t.orderDischargePlan }
                  ].map(order => (
                    <label key={order.key} className="order-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={noteData.orders_needed.includes(order.key)}
                        onChange={() => handleOrderCheckboxChange(order.key)}
                      />
                      <span>{order.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  {t.cancel}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? t.loading : t.save}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- POST-OP NOTES TIMELINE DISPLAY ---------------- */}
        <div className="followup-timeline">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📅 {t.timeline}
          </h3>
          
          {followUps.length === 0 ? (
            <p style={{ color: 'var(--neutral-500)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
              {t.noFollowUps}
            </p>
          ) : (
            <div className="timeline-items">
              {followUps.map(f => {
                const dateString = new Date(f.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                const isAuthorOrAdmin = currentUser.role === 'admin' || f.doctor_id === currentUser.id;

                return (
                  <div key={f.id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    
                    <div className="timeline-header">
                      <span>{t.doctor}: <strong>{f.doctor_name}</strong></span>
                      <span>{dateString}</span>
                    </div>

                    <div className="timeline-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0 }}>
                          POD-{f.post_op_day} | {f.general_condition} ({f.consciousness})
                        </h4>
                        {isAuthorOrAdmin && (
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}
                            onClick={() => handleDeleteNote(f.id)}
                            title="Delete follow-up note"
                          >
                            🗑️
                          </button>
                        )}
                      </div>

                      {/* Vital signs list */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--neutral-800)', backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem', border: '1px solid var(--neutral-200)' }}>
                        {f.bp && <span>BP: <strong>{f.bp}</strong></span>}
                        {f.pulse && <span>Pulse: <strong>{f.pulse} bpm</strong></span>}
                        {f.temperature && <span>T°: <strong>{f.temperature} °C</strong></span>}
                        {f.rr && <span>RR: <strong>{f.rr} bpm</strong></span>}
                        {f.spo2 && <span>SpO2: <strong>{f.spo2} %</strong></span>}
                        {f.pain_score !== null && <span>Pain: <strong>{f.pain_score}/10</strong></span>}
                        {f.fever !== 'None' && <span>Fever: <strong style={{ color: 'var(--danger)' }}>{f.fever}</strong></span>}
                      </div>

                      {/* Urology status notes */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>• Urine Output: <strong>{f.urine_output}</strong></div>
                        <div>• Urine Hematuria: <strong>{f.hematuria}</strong></div>
                        {f.foley_catheter !== 'N/A' && <div>• Foley Catheter: <strong>{f.foley_catheter}</strong></div>}
                        {f.catheter_color_output && <div>• Catheter Flow: <strong>{f.catheter_color_output}</strong></div>}
                        {f.drain_output !== 'None' && <div>• Drain Output: <strong>{f.drain_output}</strong></div>}
                        {f.dj_stent !== 'N/A' && <div>• DJ Stent: <strong>{f.dj_stent}</strong></div>}
                        {f.nephrostomy_tube !== 'N/A' && <div>• Nephrostomy: <strong>{f.nephrostomy_tube}</strong></div>}
                        <div>• Wound Condition: <strong>{f.wound_condition}</strong></div>
                        {f.scrotal_status !== 'N/A' && <div>• Scrotal status: <strong>{f.scrotal_status}</strong></div>}
                        {f.renal_function && <div>• Renal Labs: <strong>{f.renal_function}</strong></div>}
                        {f.infection_signs !== 'None' && <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>• Sepsis: <strong>{f.infection_signs}</strong></div>}
                      </div>

                      {/* Intake & Bowels */}
                      <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                        <span>Oral: <strong>{f.oral_intake}</strong></span>
                        <span>Bowel: <strong>{f.bowel_movement}</strong></span>
                        <span>Mobilized: <strong>{f.ambulation}</strong></span>
                      </div>

                      {/* Lab results if any */}
                      {(f.labs || f.imaging || f.complications !== 'None') && (
                        <div style={{ marginTop: '0.5rem', padding: '0.4rem', backgroundColor: '#fdf2f2', border: '1px solid #fde2e2', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {f.labs && <div>🧪 Labs: {f.labs}</div>}
                          {f.imaging && <div>📸 Imaging: {f.imaging}</div>}
                          {f.complications !== 'None' && <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ Complications: {f.complications}</div>}
                        </div>
                      )}

                      {/* Assessment & Plan */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--neutral-200)', paddingTop: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Assessment / التقييم:</strong>
                          <p style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>{f.assessment}</p>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Management Plan / خطة العلاج:</strong>
                          <p style={{ marginTop: '0.2rem', color: 'var(--primary)', fontWeight: 500, whiteSpace: 'pre-wrap' }}>{f.plan}</p>
                        </div>
                      </div>

                      {/* Orders summary tags */}
                      {f.orders_needed && f.orders_needed.length > 0 && (
                        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--neutral-200)', paddingTop: '0.5rem' }}>
                          <strong style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block', marginBottom: '0.25rem' }}>
                            🔔 Active Orders / طلبات نشطة:
                          </strong>
                          <div className="ordered-items-summary">
                            {f.orders_needed.map(orderKey => {
                              // Match translation key or fall back
                              const translateKey = `order${orderKey.replace(/\s+/g, '')}`;
                              const label = t[translateKey] || orderKey;
                              return (
                                <span key={orderKey} className="order-summary-tag">
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
