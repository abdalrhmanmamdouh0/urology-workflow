import React, { useState, useEffect } from 'react';

export default function PatientModal({ patient, onClose, onSave, token, t }) {
  const [formData, setFormData] = useState({
    serial_number: '',
    name_en: '',
    name_ar: '',
    age: '',
    weight: '',
    diagnosis_en: '',
    diagnosis_ar: '',
    operation_en: '',
    operation_ar: '',
    room: '',
    surgeon: '',
    hb_level: '',
    blood_type: 'O+',
    blood_available: false,
    hbv: 'Negative',
    hcv: 'Negative',
    hiv: 'Negative',
    medical_history_en: '',
    medical_history_ar: '',
    cons_cardiology: 'Not Done',
    cons_chest: 'Not Done',
    cons_anesthesia: 'Not Done',
    cons_pediatric: 'Not Needed',
    cons_internal: 'Not Done',
    notes_en: '',
    notes_ar: '',
    status: 'Waiting',
    operation_date: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        ...patient,
        weight: patient.weight || '',
        hb_level: patient.hb_level || '',
        blood_available: patient.blood_available === 1 || patient.blood_available === true,
        operation_date: patient.operation_date || '',
        diagnosis_en: patient.diagnosis_en || '',
        diagnosis_ar: patient.diagnosis_ar || '',
        operation_en: patient.operation_en || '',
        operation_ar: patient.operation_ar || '',
        room: patient.room || '',
        surgeon: patient.surgeon || '',
        medical_history_en: patient.medical_history_en || '',
        medical_history_ar: patient.medical_history_ar || '',
        notes_en: patient.notes_en || '',
        notes_ar: patient.notes_ar || ''
      });
    } else {
      // Auto-generate serial if adding new (clinically randomized/timestamped default)
      const year = new Date().getFullYear().toString().slice(-2);
      const rand = Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({
        ...prev,
        serial_number: `UR-${year}-${rand}`
      }));
    }
  }, [patient]);

  // Dynamic clinical rules: Pediatric consult should automatically toggle to "Not Needed" if Age >= 18,
  // and be required or "Not Done" if Age < 18.
  useEffect(() => {
    const ageNum = parseInt(formData.age);
    if (!isNaN(ageNum)) {
      if (ageNum >= 18) {
        setFormData(prev => ({ ...prev, cons_pediatric: 'Not Needed' }));
      } else if (formData.cons_pediatric === 'Not Needed') {
        setFormData(prev => ({ ...prev, cons_pediatric: 'Not Done' }));
      }
    }
  }, [formData.age]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serial_number || !formData.name_en || !formData.name_ar || !formData.age) {
      setError('Required fields are missing.');
      return;
    }

    setLoading(true);
    setError('');

    const url = patient ? `/api/patients/${patient.id}` : '/api/patients';
    const method = patient ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onSave(data);
        onClose();
      } else {
        setError(data.error || 'Failed to save patient records.');
      }
    } catch (err) {
      setError('A network error occurred. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const isPediatric = parseInt(formData.age) < 18;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{patient ? t.editPatient : t.addPatient}</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            {/* SECTION 1: GENERAL DEMOGRAPHICS */}
            <div className="modal-section-title">{t.secGeneral}</div>
            
            <div className="grid-3 mb-3">
              <div className="form-group">
                <label>{t.serialFull} *</label>
                <input
                  type="text"
                  name="serial_number"
                  className="form-control"
                  value={formData.serial_number}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.age} *</label>
                <input
                  type="number"
                  name="age"
                  className="form-control"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder={t.years}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.weight} ({t.kg})</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  className="form-control"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g. 75.5"
                />
              </div>
            </div>

            <div className="grid-2 mb-3">
              <div className="form-group">
                <label>{t.patientNameEn} *</label>
                <input
                  type="text"
                  name="name_en"
                  className="form-control"
                  value={formData.name_en}
                  onChange={handleChange}
                  placeholder="English spelling"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.patientNameAr} *</label>
                <input
                  type="text"
                  name="name_ar"
                  className="form-control"
                  value={formData.name_ar}
                  onChange={handleChange}
                  placeholder="الاسم باللغة العربية"
                  required
                />
              </div>
            </div>

            <div className="grid-3 mb-3">
              <div className="form-group">
                <label>{t.operationDate}</label>
                <input
                  type="date"
                  name="operation_date"
                  className="form-control"
                  value={formData.operation_date}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>{t.operationRoom}</label>
                <input
                  type="text"
                  name="room"
                  className="form-control"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="e.g. OR-3, Room A"
                />
              </div>
              <div className="form-group">
                <label>{t.surgeon}</label>
                <input
                  type="text"
                  name="surgeon"
                  className="form-control"
                  value={formData.surgeon}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Samir"
                />
              </div>
            </div>

            {/* SECTION 2: CLINICAL WORK & DIAGNOSIS */}
            <div className="modal-section-title">{t.diagnosis} & {t.opName}</div>
            
            <div className="grid-2 mb-3">
              <div className="form-group">
                <label>{t.diagnosisEn}</label>
                <input
                  type="text"
                  name="diagnosis_en"
                  className="form-control"
                  value={formData.diagnosis_en}
                  onChange={handleChange}
                  placeholder="e.g. Right Renal Pelvic Stone"
                />
              </div>
              <div className="form-group">
                <label>{t.diagnosisAr}</label>
                <input
                  type="text"
                  name="diagnosis_ar"
                  className="form-control"
                  value={formData.diagnosis_ar}
                  onChange={handleChange}
                  placeholder="مثال: حصوة بحوض الكلية اليمنى"
                />
              </div>
            </div>

            <div className="grid-2 mb-3">
              <div className="form-group">
                <label>{t.opNameEn}</label>
                <input
                  type="text"
                  name="operation_en"
                  className="form-control"
                  value={formData.operation_en}
                  onChange={handleChange}
                  placeholder="e.g. PCNL (Right)"
                />
              </div>
              <div className="form-group">
                <label>{t.opNameAr}</label>
                <input
                  type="text"
                  name="operation_ar"
                  className="form-control"
                  value={formData.operation_ar}
                  onChange={handleChange}
                  placeholder="مثال: استخراج حصوة الكلية بالمنظار"
                />
              </div>
            </div>

            {/* SECTION 3: BLOOD & VIRAL STATUS */}
            <div className="modal-section-title">{t.blood} & {t.viralState}</div>
            
            <div className="grid-3 mb-3">
              <div className="form-group">
                <label>{t.hbLevel} (g/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  name="hb_level"
                  className="form-control"
                  value={formData.hb_level}
                  onChange={handleChange}
                  placeholder="e.g. 13.4"
                />
              </div>
              <div className="form-group">
                <label>{t.bloodType}</label>
                <select
                  name="blood_type"
                  className="form-control"
                  value={formData.blood_type}
                  onChange={handleChange}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.8rem' }}>
                <label className="order-checkbox-label" style={{ width: '100%', padding: '0.65rem' }}>
                  <input
                    type="checkbox"
                    name="blood_available"
                    checked={formData.blood_available}
                    onChange={handleChange}
                  />
                  <span>{t.bloodAvailable}</span>
                </label>
              </div>
            </div>

            <div className="grid-3 mb-3">
              <div className="form-group">
                <label>HBV (Hepatitis B)</label>
                <select name="hbv" className="form-control" value={formData.hbv} onChange={handleChange}>
                  <option value="Negative">Negative</option>
                  <option value="Positive">Positive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="form-group">
                <label>HCV (Hepatitis C)</label>
                <select name="hcv" className="form-control" value={formData.hcv} onChange={handleChange}>
                  <option value="Negative">Negative</option>
                  <option value="Positive">Positive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="form-group">
                <label>HIV</label>
                <select name="hiv" className="form-control" value={formData.hiv} onChange={handleChange}>
                  <option value="Negative">Negative</option>
                  <option value="Positive">Positive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* SECTION 4: PRE-OP CONSULTATIONS & MEDICAL HISTORY */}
            <div className="modal-section-title">{t.consultations} & {t.medicalHistory}</div>

            <div className="grid-2 mb-3">
              <div className="form-group">
                <label>{t.medicalHistoryEn}</label>
                <textarea
                  name="medical_history_en"
                  className="form-control"
                  rows="2"
                  value={formData.medical_history_en}
                  onChange={handleChange}
                  placeholder="Hypertensive, diabetic, etc."
                />
              </div>
              <div className="form-group">
                <label>{t.medicalHistoryAr}</label>
                <textarea
                  name="medical_history_ar"
                  className="form-control"
                  rows="2"
                  value={formData.medical_history_ar}
                  onChange={handleChange}
                  placeholder="الضغط، السكري، عمليات سابقة..."
                />
              </div>
            </div>

            <div className="grid-3 mb-3" style={{ gridTemplateColumns: isPediatric ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' }}>
              <div className="form-group">
                <label>{t.cardiology}</label>
                <select name="cons_cardiology" className="form-control" value={formData.cons_cardiology} onChange={handleChange}>
                  <option value="Done">{t.done}</option>
                  <option value="Not Done">{t.notDone}</option>
                  <option value="Not Needed">{t.notNeeded}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.chest}</label>
                <select name="cons_chest" className="form-control" value={formData.cons_chest} onChange={handleChange}>
                  <option value="Done">{t.done}</option>
                  <option value="Not Done">{t.notDone}</option>
                  <option value="Not Needed">{t.notNeeded}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.anesthesia}</label>
                <select name="cons_anesthesia" className="form-control" value={formData.cons_anesthesia} onChange={handleChange}>
                  <option value="Done">{t.done}</option>
                  <option value="Not Done">{t.notDone}</option>
                  <option value="Not Needed">{t.notNeeded}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.internalMedicine}</label>
                <select name="cons_internal" className="form-control" value={formData.cons_internal} onChange={handleChange}>
                  <option value="Done">{t.done}</option>
                  <option value="Not Done">{t.notDone}</option>
                  <option value="Not Needed">{t.notNeeded}</option>
                </select>
              </div>
              {/* Pediatric is conditionally enabled based on Age < 18 */}
              {isPediatric && (
                <div className="form-group" style={{ animation: 'modalEnter 0.2s ease' }}>
                  <label style={{ color: 'var(--danger)' }}>{t.pediatric}</label>
                  <select name="cons_pediatric" className="form-control" style={{ borderColor: 'var(--danger)' }} value={formData.cons_pediatric} onChange={handleChange}>
                    <option value="Done">{t.done}</option>
                    <option value="Not Done">{t.notDone}</option>
                    <option value="Not Needed">{t.notNeeded}</option>
                  </select>
                </div>
              )}
            </div>

            {/* SECTION 5: NOTES & CLINICAL STATUS */}
            <div className="modal-section-title">{t.notes} & {t.status}</div>

            <div className="grid-2 mb-3">
              <div className="form-group">
                <label>{t.notesEn}</label>
                <textarea
                  name="notes_en"
                  className="form-control"
                  rows="2"
                  value={formData.notes_en}
                  onChange={handleChange}
                  placeholder="Additional pre-operative instructions"
                />
              </div>
              <div className="form-group">
                <label>{t.notesAr}</label>
                <textarea
                  name="notes_ar"
                  className="form-control"
                  rows="2"
                  value={formData.notes_ar}
                  onChange={handleChange}
                  placeholder="تعليمات أو تحضيرات إضافية"
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label>{t.status}</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                <option value="Waiting">{t.statusWaiting}</option>
                <option value="Booked">{t.statusBooked}</option>
                <option value="Done">{t.statusDone}</option>
                <option value="Postponed">{t.statusPostponed}</option>
                <option value="Cancelled">{t.statusCancelled}</option>
                <option value="Discharged">{t.statusDischarged}</option>
              </select>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t.loading : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
