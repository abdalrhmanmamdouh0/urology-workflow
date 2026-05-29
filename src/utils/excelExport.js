export const exportToExcel = (patients, language = 'en') => {
  if (!patients || patients.length === 0) return;

  const headers = language === 'en' ? [
    'Serial Number',
    'Patient Name (EN)',
    'Patient Name (AR)',
    'Age',
    'Weight (kg)',
    'Diagnosis (EN)',
    'Diagnosis (AR)',
    'Operation Name (EN)',
    'Operation Name (AR)',
    'OR Room',
    'Surgeon',
    'Hb Level',
    'Blood Group',
    'Blood Available',
    'HBV Status',
    'HCV Status',
    'HIV Status',
    'Cardiology Consult',
    'Chest Consult',
    'Anesthesia Consult',
    'Pediatric Consult',
    'Internal Consult',
    'Status',
    'Operation Date',
    'Notes'
  ] : [
    'الرقم المسلسل',
    'اسم المريض (إنجليزي)',
    'اسم المريض (عربي)',
    'العمر',
    'الوزن (كجم)',
    'التشخيص (إنجليزي)',
    'التشخيص (عربي)',
    'اسم العملية (إنجليزي)',
    'اسم العملية (عربي)',
    'غرفة العمليات',
    'الجراح',
    'مستوى Hb',
    'فصيلة الدم',
    'توفر الدم',
    'حالة HBV',
    'حالة HCV',
    'حالة HIV',
    'استشارة القلب',
    'استشارة الصدر',
    'استشارة التخدير',
    'استشارة الأطفال',
    'استشارة الباطنة',
    'الحالة',
    'تاريخ العملية',
    'ملاحظات'
  ];

  // Helper to escape values for CSV
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    // Escape double quotes
    str = str.replace(/"/g, '""');
    // Wrap in quotes if it contains commas, newlines, or double quotes
    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
      return `"${str}"`;
    }
    return str;
  };

  const rows = patients.map((p) => {
    return [
      p.serial_number,
      p.name_en,
      p.name_ar,
      p.age,
      p.weight || '',
      p.diagnosis_en || '',
      p.diagnosis_ar || '',
      p.operation_en || '',
      p.operation_ar || '',
      p.room || '',
      p.surgeon || '',
      p.hb_level || '',
      p.blood_type || '',
      p.blood_available ? (language === 'en' ? 'Yes' : 'نعم') : (language === 'en' ? 'No' : 'لا'),
      p.hbv || 'Negative',
      p.hcv || 'Negative',
      p.hiv || 'Negative',
      p.cons_cardiology || 'Not Done',
      p.cons_chest || 'Not Done',
      p.cons_anesthesia || 'Not Done',
      p.cons_pediatric || 'Not Needed',
      p.cons_internal || 'Not Done',
      p.status || 'Waiting',
      p.operation_date || '',
      language === 'en' ? (p.notes_en || '') : (p.notes_ar || '')
    ].map(escapeCSV);
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  // Excel requires UTF-8 BOM prefix \uFEFF to load Arabic characters correctly
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = language === 'en' 
    ? `Urology_Operation_List_${timestamp}.csv` 
    : `قائمة_عمليات_المسالك_البولية_${timestamp}.csv`;
    
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
