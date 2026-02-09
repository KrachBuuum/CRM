
import express from 'express';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;
const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'HeroeS93';

const pool = new Pool({
  user: process.env.DB_USER || 'crm_admin',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'crm_production',
  password: process.env.DB_PASSWORD || 'HeroeS88',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const query = (text, params) => pool.query(text, params);

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', pi: true }));

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Ungültige Zugangsdaten' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Ungültige Zugangsdaten' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token fehlt' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token ungültig' });
    req.user = user;
    next();
  });
};

// CRM Routes
app.get('/api/users', auth, async (req, res) => {
  const result = await query('SELECT id, name, role FROM users');
  res.json(result.rows);
});

app.get('/api/contacts', auth, async (req, res) => {
  const result = await query('SELECT * FROM contacts ORDER BY last_name ASC');
  res.json(result.rows);
});

app.post('/api/contacts', auth, async (req, res) => {
  const c = req.body;
  const result = await query(
    'INSERT INTO contacts (category, company_name, first_name, last_name, email_business, phone_mobile, address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [c.category, c.companyName, c.firstName, c.lastName, c.emailBusiness, c.phoneMobile, JSON.stringify(c.address)]
  );
  res.json(result.rows[0]);
});

app.get('/api/processes', auth, async (req, res) => {
  const result = await query('SELECT * FROM processes ORDER BY date_created DESC');
  res.json(result.rows);
});

app.post('/api/processes', auth, async (req, res) => {
  const p = req.body;
  const result = await query(
    'INSERT INTO processes (process_number, type, customer_id, title, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [p.processNumber, p.type, p.customerId, p.title, p.status]
  );
  res.json(result.rows[0]);
});

app.get('/api/notes', auth, async (req, res) => {
  const result = await query('SELECT * FROM notes ORDER BY timestamp DESC');
  res.json(result.rows);
});

app.post('/api/notes', auth, async (req, res) => {
  const n = req.body;
  const result = await query(
    'INSERT INTO notes (process_id, user_id, user_name, text, duration, rate_profile_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [n.processId, req.user.id, req.user.username, n.text, n.duration, n.rateProfileId]
  );
  res.json(result.rows[0]);
});

const PORT = process.env.BACKEND_PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend auf Port ${PORT} gestartet`));
