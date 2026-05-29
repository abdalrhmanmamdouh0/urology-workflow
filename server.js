import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'urology-super-secret-key-12345';

app.use(cors());
app.use(express.json());

// Initialize SQLite database — use absolute path so it works on cloud (Render)
const DB_PATH = path.join(__dirname, 'urology_workflow.db');
const db = new DatabaseSync(DB_PATH);

// Create tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin' or 'doctor'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    age INTEGER NOT NULL,
    weight REAL,
    diagnosis_en TEXT,
    diagnosis_ar TEXT,
    operation_en TEXT,
    operation_ar TEXT,
    room TEXT,
    surgeon TEXT,
    hb_level REAL,
    blood_type TEXT,
    blood_available INTEGER DEFAULT 0, -- 0 = No, 1 = Yes
    hbv TEXT DEFAULT 'Negative', -- Positive, Negative, Pending
    hcv TEXT DEFAULT 'Negative',
    hiv TEXT DEFAULT 'Negative',
    medical_history_en TEXT,
    medical_history_ar TEXT,
    cons_cardiology TEXT DEFAULT 'Not Done', -- Done, Not Done, Not Needed
    cons_chest TEXT DEFAULT 'Not Done',
    cons_anesthesia TEXT DEFAULT 'Not Done',
    cons_pediatric TEXT DEFAULT 'Not Needed', -- Done, Not Done, Not Needed
    cons_internal TEXT DEFAULT 'Not Done',
    notes_en TEXT,
    notes_ar TEXT,
    status TEXT DEFAULT 'Waiting', -- Waiting, Booked, Done, Postponed, Cancelled, Discharged
    operation_date TEXT, -- YYYY-MM-DD
    is_archived INTEGER DEFAULT 0, -- 0 = Active, 1 = Archived
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    doctor_name TEXT NOT NULL,
    post_op_day INTEGER NOT NULL,
    general_condition TEXT,
    consciousness TEXT,
    pain_score INTEGER,
    fever TEXT,
    bp TEXT,
    pulse INTEGER,
    temperature REAL,
    rr INTEGER,
    spo2 INTEGER,
    urine_output TEXT,
    hematuria TEXT,
    foley_catheter TEXT,
    catheter_color_output TEXT,
    drain_output TEXT,
    dj_stent TEXT,
    nephrostomy_tube TEXT,
    wound_condition TEXT,
    scrotal_status TEXT,
    renal_function TEXT,
    infection_signs TEXT,
    oral_intake TEXT,
    bowel_movement TEXT,
    ambulation TEXT,
    labs TEXT,
    imaging TEXT,
    complications TEXT,
    assessment TEXT,
    plan TEXT,
    orders_needed TEXT, -- JSON string of arrays
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
  )
`);

// Insert default users if table is empty
const checkUsers = db.prepare('SELECT count(*) as count FROM users');
const userCount = checkUsers.get().count;

if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
  
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin', salt);
  const doctorHash = bcrypt.hashSync('doctor', salt);
  
  insertUser.run('admin', adminHash, 'Dr. Ahmed (Admin)', 'admin');
  insertUser.run('doctor', doctorHash, 'Dr. Youssef (Resident)', 'doctor');
  
  console.log('Inserted default users: admin/admin and doctor/doctor');
}

// ---------------- AUTH MIDDLEWARE ----------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ---------------- AUTH ENDPOINTS ----------------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    const userStmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = userStmt.get(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ---------------- USER MANAGEMENT ENDPOINTS ----------------
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, username, name, role, created_at FROM users');
    const users = stmt.all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticateToken, requireAdmin, (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    const stmt = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, hashedPassword, name, role);
    
    res.status(201).json({ id: result.lastInsertRowid, username, name, role });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  try {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ---------------- PATIENT ENDPOINTS ----------------
app.get('/api/patients', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM patients WHERE is_archived = 0 ORDER BY operation_date ASC, id ASC');
    const patients = stmt.all();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

app.get('/api/patients/archived', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM patients WHERE is_archived = 1 ORDER BY operation_date DESC, id DESC');
    const patients = stmt.all();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch archived patients' });
  }
});

app.post('/api/patients', authenticateToken, (req, res) => {
  const p = req.body;
  if (!p.serial_number || !p.name_en || !p.name_ar || !p.age) {
    return res.status(400).json({ error: 'Serial number, name (En/Ar), and age are required' });
  }
  
  try {
    const stmt = db.prepare(`
      INSERT INTO patients (
        serial_number, name_en, name_ar, age, weight, diagnosis_en, diagnosis_ar,
        operation_en, operation_ar, room, surgeon, hb_level, blood_type, blood_available,
        hbv, hcv, hiv, medical_history_en, medical_history_ar,
        cons_cardiology, cons_chest, cons_anesthesia, cons_pediatric, cons_internal,
        notes_en, notes_ar, status, operation_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      p.serial_number, p.name_en, p.name_ar, p.age, p.weight || null, p.diagnosis_en || null, p.diagnosis_ar || null,
      p.operation_en || null, p.operation_ar || null, p.room || null, p.surgeon || null, p.hb_level || null, p.blood_type || null, p.blood_available ? 1 : 0,
      p.hbv || 'Negative', p.hcv || 'Negative', p.hiv || 'Negative', p.medical_history_en || null, p.medical_history_ar || null,
      p.cons_cardiology || 'Not Done', p.cons_chest || 'Not Done', p.cons_anesthesia || 'Not Done', p.cons_pediatric || 'Not Needed', p.cons_internal || 'Not Done',
      p.notes_en || null, p.notes_ar || null, p.status || 'Waiting', p.operation_date || null
    );
    
    const newPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newPatient);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Serial number already exists' });
    }
    res.status(500).json({ error: 'Failed to create patient: ' + error.message });
  }
});

app.put('/api/patients/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const p = req.body;
  
  try {
    const stmt = db.prepare(`
      UPDATE patients SET
        serial_number = ?, name_en = ?, name_ar = ?, age = ?, weight = ?, diagnosis_en = ?, diagnosis_ar = ?,
        operation_en = ?, operation_ar = ?, room = ?, surgeon = ?, hb_level = ?, blood_type = ?, blood_available = ?,
        hbv = ?, hcv = ?, hiv = ?, medical_history_en = ?, medical_history_ar = ?,
        cons_cardiology = ?, cons_chest = ?, cons_anesthesia = ?, cons_pediatric = ?, cons_internal = ?,
        notes_en = ?, notes_ar = ?, status = ?, operation_date = ?
      WHERE id = ?
    `);
    
    stmt.run(
      p.serial_number, p.name_en, p.name_ar, p.age, p.weight || null, p.diagnosis_en || null, p.diagnosis_ar || null,
      p.operation_en || null, p.operation_ar || null, p.room || null, p.surgeon || null, p.hb_level || null, p.blood_type || null, p.blood_available ? 1 : 0,
      p.hbv || 'Negative', p.hcv || 'Negative', p.hiv || 'Negative', p.medical_history_en || null, p.medical_history_ar || null,
      p.cons_cardiology || 'Not Done', p.cons_chest || 'Not Done', p.cons_anesthesia || 'Not Done', p.cons_pediatric || 'Not Needed', p.cons_internal || 'Not Done',
      p.notes_en || null, p.notes_ar || null, p.status || 'Waiting', p.operation_date || null,
      id
    );
    
    const updatedPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
    if (!updatedPatient) return res.status(404).json({ error: 'Patient not found' });
    res.json(updatedPatient);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Serial number already exists' });
    }
    res.status(500).json({ error: 'Failed to update patient: ' + error.message });
  }
});

app.delete('/api/patients/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

app.post('/api/patients/:id/archive', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('UPDATE patients SET is_archived = 1 WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Patient archived successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive patient' });
  }
});

app.post('/api/patients/:id/unarchive', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('UPDATE patients SET is_archived = 0 WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Patient restored from archive successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore patient' });
  }
});

// ---------------- FOLLOW-UP ENDPOINTS ----------------
app.get('/api/patients/:id/follow-ups', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM follow_ups WHERE patient_id = ? ORDER BY created_at DESC');
    const followUps = stmt.all(id);
    
    // Parse orders_needed JSON strings back to arrays
    const formatted = followUps.map(f => ({
      ...f,
      orders_needed: f.orders_needed ? JSON.parse(f.orders_needed) : []
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

app.post('/api/patients/:id/follow-ups', authenticateToken, (req, res) => {
  const { id } = req.params;
  const f = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO follow_ups (
        patient_id, doctor_id, doctor_name, post_op_day, general_condition, consciousness,
        pain_score, fever, bp, pulse, temperature, rr, spo2, urine_output, hematuria,
        foley_catheter, catheter_color_output, drain_output, dj_stent, nephrostomy_tube,
        wound_condition, scrotal_status, renal_function, infection_signs, oral_intake,
        bowel_movement, ambulation, labs, imaging, complications, assessment, plan, orders_needed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      id,
      req.user.id,
      req.user.name,
      f.post_op_day || 0,
      f.general_condition || null,
      f.consciousness || null,
      f.pain_score !== undefined ? f.pain_score : null,
      f.fever || null,
      f.bp || null,
      f.pulse || null,
      f.temperature || null,
      f.rr || null,
      f.spo2 || null,
      f.urine_output || null,
      f.hematuria || null,
      f.foley_catheter || null,
      f.catheter_color_output || null,
      f.drain_output || null,
      f.dj_stent || null,
      f.nephrostomy_tube || null,
      f.wound_condition || null,
      f.scrotal_status || null,
      f.renal_function || null,
      f.infection_signs || null,
      f.oral_intake || null,
      f.bowel_movement || null,
      f.ambulation || null,
      f.labs || null,
      f.imaging || null,
      f.complications || null,
      f.assessment || null,
      f.plan || null,
      f.orders_needed ? JSON.stringify(f.orders_needed) : '[]'
    );
    
    const newFollowUp = db.prepare('SELECT * FROM follow_ups WHERE id = ?').get(result.lastInsertRowid);
    newFollowUp.orders_needed = newFollowUp.orders_needed ? JSON.parse(newFollowUp.orders_needed) : [];
    
    res.status(201).json(newFollowUp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add follow-up note: ' + error.message });
  }
});

app.delete('/api/follow-ups/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    // Check if user is admin or the actual writer of the note
    const checkStmt = db.prepare('SELECT doctor_id FROM follow_ups WHERE id = ?');
    const note = checkStmt.get(id);
    if (!note) return res.status(404).json({ error: 'Follow-up note not found' });
    
    if (req.user.role !== 'admin' && note.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this follow-up note' });
    }
    
    const stmt = db.prepare('DELETE FROM follow_ups WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Follow-up note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete follow-up note' });
  }
});

// Serve static assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// For all non-API paths, return index.html (supports single page app reload)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // If we are in dev, index.html might not exist in dist/ - that's fine
      res.status(404).send('Vite Dev Server handles page delivery in development. Run built client to serve statically.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
